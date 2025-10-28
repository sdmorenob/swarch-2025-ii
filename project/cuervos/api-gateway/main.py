from fastapi import FastAPI, HTTPException, Depends, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
import httpx
import os
from typing import Optional
import logging
from jose import jwt, JWTError, jwk
import json
import socketio
from sio_server import sio, socket_app
from fastapi.responses import Response

# Configurar logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="TaskNotes API Gateway",
    description="API Gateway para la arquitectura de microservicios TaskNotes",
    version="1.0.0"
)

# Configurar CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # En producción, especificar dominios específicos
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configuración de servicios
SERVICES = {
    "auth": os.getenv("AUTH_SERVICE_URL", "http://auth-service:8002"),
    "tasks": os.getenv("TASKS_SERVICE_URL", "http://tasks-service:8003"),
    "notes": os.getenv("NOTES_SERVICE_URL", "http://notes-service:8004"),
    "tags": os.getenv("TAGS_SERVICE_URL", "http://tags-service:8005"),
    "categories": os.getenv("CATEGORIES_SERVICE_URL", "http://categories-service:8006"),
    "user_profile": os.getenv("USER_PROFILE_SERVICE_URL", "http://user-profile-service:8007"),
    "search": os.getenv("SEARCH_SERVICE_URL", "http://search-service:8008")
}

# Configuración JWT
JWT_ALGORITHM = os.getenv("JWT_ALGORITHM", "HS256")
JWT_SECRET_KEY = os.getenv("JWT_SECRET_KEY", "your-secret-key")
JWT_PUBLIC_KEY = os.getenv("JWT_PUBLIC_KEY", None)
JWKS_URL = os.getenv("JWKS_URL", "http://auth-service:8002/.well-known/jwks.json")

security = HTTPBearer(auto_error=False)

# Cache para JWKS
jwks_cache = {"keys": [], "last_updated": 0}

async def get_jwks():
    """Obtener JWKS del auth-service"""
    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(JWKS_URL, timeout=5.0)
            if response.status_code == 200:
                jwks_data = response.json()
                jwks_cache["keys"] = jwks_data.get("keys", [])
                return jwks_cache["keys"]
    except Exception as e:
        logger.warning(f"Error obteniendo JWKS: {e}")
    return jwks_cache["keys"]

async def verify_token(credentials: Optional[HTTPAuthorizationCredentials] = Depends(security)):
    """Verificar token JWT"""
    if not credentials:
        return None
    
    token = credentials.credentials
    
    try:
        # Si es RS256, obtener JWKS
        if JWT_ALGORITHM == "RS256":
            jwks_keys = await get_jwks()
            if not jwks_keys:
                raise HTTPException(status_code=401, detail="No se pudo obtener JWKS")
            
            # Decodificar header para obtener kid
            unverified_header = jwt.get_unverified_header(token)
            kid = unverified_header.get("kid")
            
            # Buscar la clave correcta
            public_key_pem = None
            for key in jwks_keys:
                if key.get("kid") == kid:
                    public_key_pem = jwk.construct(key).to_pem().decode("utf-8")
                    break
            
            if not public_key_pem:
                raise HTTPException(status_code=401, detail="Clave pública no encontrada")
            
            payload = jwt.decode(
                token, 
                public_key_pem, 
                algorithms=[JWT_ALGORITHM],
                options={"verify_aud": False}
            )
        else:
            # HS256
            payload = jwt.decode(
                token, 
                JWT_SECRET_KEY, 
                algorithms=[JWT_ALGORITHM],
                options={"verify_aud": False}
            )
        
        return payload
    except JWTError as e:
        logger.warning(f"Error verificando token: {e}")
        raise HTTPException(status_code=401, detail="Token inválido")

async def proxy_request(
    request: Request,
    service_name: str,
    path: str = "",
    token_payload: Optional[dict] = None
):
    """Proxy de requests a microservicios"""
    service_url = SERVICES.get(service_name)
    if not service_url:
        raise HTTPException(status_code=404, detail=f"Servicio {service_name} no encontrado")
    
    # Construir URL completa
    target_url = f"{service_url}{path}"
    
    # Preparar headers
    headers = dict(request.headers)
    # Remover headers problemáticos
    headers.pop("host", None)
    headers.pop("content-length", None)
    
    # Agregar información del usuario si hay token
    if token_payload:
        headers["X-User-Id"] = str(token_payload.get("sub", ""))
        headers["X-User-Email"] = token_payload.get("email", "")
    
    try:
        async with httpx.AsyncClient() as client:
            # Obtener body si existe
            body = None
            if request.method in ["POST", "PUT", "PATCH"]:
                body = await request.body()
            
            response = await client.request(
                method=request.method,
                url=target_url,
                headers=headers,
                params=request.query_params,
                content=body,
                timeout=30.0
            )
            
            return response
    except httpx.RequestError as e:
        logger.error(f"Error en proxy request a {target_url}: {e}")
        raise HTTPException(status_code=503, detail=f"Servicio {service_name} no disponible")

@app.get("/health")
async def health_check():
    """Health check del API Gateway"""
    return {"status": "healthy", "service": "api-gateway"}

@app.get("/.well-known/jwks.json")
async def get_jwks_endpoint():
    """Endpoint JWKS del API Gateway (proxy al auth-service)"""
    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(JWKS_URL, timeout=5.0)
            return response.json()
    except Exception as e:
        logger.error(f"Error obteniendo JWKS: {e}")
        return {"keys": []}

# Rutas de autenticación (sin autenticación requerida)
@app.api_route("/auth/{path:path}", methods=["GET", "POST", "PUT", "DELETE", "PATCH"])
async def auth_proxy(request: Request, path: str):
    """Proxy para auth-service"""
    prefix = "/auth"
    forward_path = (f"{prefix}/{path}" if path else (prefix + ("/" if request.url.path.endswith("/") else "")))
    proxied = await proxy_request(request, "auth", forward_path )
    # Interceptar registro para crear perfil automáticamente
    try:
        if request.method == "POST" and path.strip("/") == "register" and proxied.status_code in (200, 201):
            data = None
            try:
                data = proxied.json()
            except Exception:
                # Si no es JSON, no intentamos crear perfil
                data = None
            user_obj = None
            if isinstance(data, dict):
                user_obj = data.get("user") if isinstance(data.get("user"), dict) else None
            user_id = None
            user_email = None
            if isinstance(data, dict):
                user_id = data.get("id") or (user_obj or {}).get("id")
                user_email = data.get("email") or (user_obj or {}).get("email")
            if user_id and user_email:
                local_part = user_email.split("@")[0]
                derived_name = " ".join(
                    part.capitalize() for part in local_part.replace(".", " ").replace("_", " ").split()
                ) or "Usuario"
                payload = {"name": derived_name, "email": user_email}
                headers = {"X-User-Id": str(user_id), "X-User-Email": user_email}
                profiles_url = f"{SERVICES['user_profile']}/profiles/"
                try:
                    async with httpx.AsyncClient() as client:
                        profile_resp = await client.post(
                            profiles_url,
                            json=payload,
                            headers=headers,
                            timeout=10.0,
                        )
                        if profile_resp.status_code in (200, 201):
                            logger.info(f"Perfil creado para usuario {user_id}")
                        elif profile_resp.status_code == 409:
                            logger.info(f"Perfil ya existe para usuario {user_id}")
                        else:
                            logger.warning(
                                f"Fallo al crear perfil {user_id}: {profile_resp.status_code} {profile_resp.text}"
                            )
                except Exception as e:
                    logger.error(f"Error creando perfil en registro: {e}")
    except Exception as e:
        logger.error(f"Intercept registro falló: {e}")
    return Response(content=proxied.content, status_code=proxied.status_code, media_type=proxied.headers.get("content-type"))

# Rutas protegidas que requieren autenticación
@app.api_route("/tasks/{path:path}", methods=["GET", "POST", "PUT", "DELETE", "PATCH"])
async def tasks_proxy(request: Request, path: str, token_payload: dict = Depends(verify_token)):
    """Proxy para tasks-service"""
    if not token_payload:
        raise HTTPException(status_code=401, detail="Token requerido")
    prefix = "/tasks"
    forward_path = (f"{prefix}/{path}" if path else f"{prefix}/")
    proxied = await proxy_request(request, "tasks", forward_path, token_payload)
    return Response(content=proxied.content, status_code=proxied.status_code, media_type=proxied.headers.get("content-type"))

@app.api_route("/notes/{path:path}", methods=["GET", "POST", "PUT", "DELETE", "PATCH"])
async def notes_proxy(request: Request, path: str, token_payload: dict = Depends(verify_token)):
    """Proxy para notes-service"""
    if not token_payload:
        raise HTTPException(status_code=401, detail="Token requerido")
    prefix = "/notes"
    forward_path = (f"{prefix}/{path}" if path else f"{prefix}/")
    proxied = await proxy_request(request, "notes", forward_path, token_payload)
    return Response(content=proxied.content, status_code=proxied.status_code, media_type=proxied.headers.get("content-type"))

@app.api_route("/tags/{path:path}", methods=["GET", "POST", "PUT", "DELETE", "PATCH"])
async def tags_proxy(request: Request, path: str, token_payload: dict = Depends(verify_token)):
    """Proxy para tags-service"""
    if not token_payload:
        raise HTTPException(status_code=401, detail="Token requerido")
    prefix = "/tags"
    forward_path = (f"{prefix}/{path}" if path else prefix)
    proxied = await proxy_request(request, "tags", forward_path, token_payload)
    return Response(content=proxied.content, status_code=proxied.status_code, media_type=proxied.headers.get("content-type"))

@app.api_route("/categories/{path:path}", methods=["GET", "POST", "PUT", "DELETE", "PATCH"])
async def categories_proxy(request: Request, path: str, token_payload: dict = Depends(verify_token)):
    """Proxy para categories-service"""
    if not token_payload:
        raise HTTPException(status_code=401, detail="Token requerido")
    prefix = "/categories"
    forward_path = (f"{prefix}/{path}" if path else prefix)
    proxied = await proxy_request(request, "categories", forward_path, token_payload)
    return Response(content=proxied.content, status_code=proxied.status_code, media_type=proxied.headers.get("content-type"))

@app.api_route("/user-profile/{path:path}", methods=["GET", "POST", "PUT", "DELETE", "PATCH"])
async def user_profile_proxy(request: Request, path: str, token_payload: dict = Depends(verify_token)):
    """Proxy para user-profile-service"""
    if not token_payload:
        raise HTTPException(status_code=401, detail="Token requerido")
    prefix = "/profiles"
    forward_path = (f"{prefix}/{path}" if path else (prefix + ("/" if request.url.path.endswith("/") else "")))
    proxied = await proxy_request(request, "user_profile", forward_path, token_payload)
    return Response(content=proxied.content, status_code=proxied.status_code, media_type=proxied.headers.get("content-type"))

@app.api_route("/search/{path:path}", methods=["GET", "POST", "PUT", "DELETE", "PATCH"])
async def search_proxy(request: Request, path: str, token_payload: dict = Depends(verify_token)):
    """Proxy para search-service"""
    if not token_payload:
        raise HTTPException(status_code=401, detail="Token requerido")
    # Search service mapea la raíz '/'
    forward_path = (f"/{path}" if path else ("/" if request.url.path.endswith("/") else ""))
    proxied = await proxy_request(request, "search", forward_path, token_payload)
    return Response(content=proxied.content, status_code=proxied.status_code, media_type=proxied.headers.get("content-type"))

# Montar Socket.IO explícitamente bajo la ruta /socket.io
# app.mount("/socket.io", socketio.ASGIApp(sio, socketio_path="socket.io"))

# Crear aplicación ASGI combinada que incluye FastAPI y Socket.IO en /socket.io
combined_app = socketio.ASGIApp(sio, app, socketio_path="socket.io")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(combined_app, host="0.0.0.0", port=8083)