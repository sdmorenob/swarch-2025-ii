from fastapi import FastAPI, HTTPException, Depends, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
import httpx
import os
from typing import Optional, List, Dict
import logging
from jose import jwt, JWTError, jwk
import json
import socketio
from sio_server import sio, socket_app
from fastapi.responses import Response
from prometheus_client import Counter, Histogram, generate_latest, CONTENT_TYPE_LATEST
import time
import asyncio
from collections import defaultdict
from datetime import datetime, timezone
import uuid

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
    allow_origins=["*"],  # En producciÃ³n, especificar dominios especÃ­ficos
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ConfiguraciÃ³n de servicios
SERVICES: Dict[str, str] = {
    "auth": os.getenv("AUTH_SERVICE_URL", "http://auth-service:8002"),
    "tasks": os.getenv("TASKS_SERVICE_URL", "http://tasks-service:8003"),
    "notes": os.getenv("NOTES_SERVICE_URL", "http://notes-service:8004"),
    "tags": os.getenv("TAGS_SERVICE_URL", "http://tags-service:8005"),
    "categories": os.getenv("CATEGORIES_SERVICE_URL", "http://categories-service:8006"),
    "user_profile": os.getenv("USER_PROFILE_SERVICE_URL", "http://user-profile-service:8007"),
    "search": os.getenv("SEARCH_SERVICE_URL", "http://search-service:8008")
}

# MÃ©tricas Prometheus
REQUEST_COUNT = Counter(
    "gateway_requests_total",
    "Total de requests recibidas por el Gateway",
    ["method", "endpoint", "status"],
)
REQUEST_LATENCY = Histogram(
    "gateway_request_duration_seconds",
    "Latencia de requests del Gateway",
    ["endpoint"],
)

# MÃ©tricas de rate limiting
RATE_LIMIT_ALLOWED = Counter(
    "gateway_rate_limit_allowed_total",
    "Requests permitidas por el rate limiter",
    ["endpoint", "method", "key_type"],
)
RATE_LIMIT_BLOCKED = Counter(
    "gateway_rate_limit_blocked_total",
    "Requests bloqueadas por el rate limiter",
    ["endpoint", "method", "key_type"],
)

# ConfiguraciÃ³n de rate limiting (token-bucket)
RATE_LIMIT_WINDOW_SECONDS = int(os.getenv("RATE_LIMIT_WINDOW_SECONDS", "60"))
DEFAULT_LIMITS = {
    "GET": int(os.getenv("RATE_LIMIT_GET_PER_WINDOW", "100")),
    "POST": int(os.getenv("RATE_LIMIT_POST_PER_WINDOW", "30")),
    "PUT": int(os.getenv("RATE_LIMIT_PUT_PER_WINDOW", "30")),
    "PATCH": int(os.getenv("RATE_LIMIT_PATCH_PER_WINDOW", "30")),
    "DELETE": int(os.getenv("RATE_LIMIT_DELETE_PER_WINDOW", "20")),
}

class TokenBucket:
    def __init__(self, capacity: int, window_seconds: int):
        self.capacity = max(1, capacity)
        self.window = max(1, window_seconds)
        self.tokens = float(self.capacity)
        self.refill_rate = float(self.capacity) / float(self.window)
        self.last = time.perf_counter()

    def consume(self, amount: float = 1.0) -> bool:
        now = time.perf_counter()
        elapsed = now - self.last
        # Refill por tiempo transcurrido
        self.tokens = min(self.capacity, self.tokens + elapsed * self.refill_rate)
        self.last = now
        if self.tokens >= amount:
            self.tokens -= amount
            return True
        return False

# Buckets en memoria: por endpoint/mÃ©todo y por clave (usuario o IP)
BUCKETS: Dict[str, Dict[str, Dict[str, TokenBucket]]] = defaultdict(lambda: defaultdict(dict))

def get_endpoint_label(path: str) -> str:
    return path.split("/")[1] if path and path != "/" and len(path.split("/")) > 1 else "root"

@app.middleware("http")
async def rate_limit_middleware(request: Request, call_next):
    endpoint = get_endpoint_label(request.url.path)
    method = request.method.upper()

    # Derivar clave: usuario si hay token, si no IP
    key_type = "ip"
    key_value = request.client.host if request.client else "unknown"
    auth_header = request.headers.get("authorization") or request.headers.get("Authorization")
    if auth_header and auth_header.lower().startswith("bearer "):
        token = auth_header.split(" ", 1)[1].strip()
        try:
            # No verifica firma; solo para obtener 'sub' y diferenciar por usuario
            unverified_claims = jwt.get_unverified_claims(token)
            sub = unverified_claims.get("sub")
            if sub:
                key_type = "user"
                key_value = str(sub)
        except Exception:
            # Si el token es invÃ¡lido, mantener por IP
            pass

    # Obtener lÃ­mites
    capacity = DEFAULT_LIMITS.get(method, DEFAULT_LIMITS["GET"])

    # Construir/obtener bucket
    bucket_key = f"{key_type}:{key_value}"
    bucket = BUCKETS[endpoint][method].get(bucket_key)
    if bucket is None:
        bucket = TokenBucket(capacity=capacity, window_seconds=RATE_LIMIT_WINDOW_SECONDS)
        BUCKETS[endpoint][method][bucket_key] = bucket

    if bucket.consume(1.0):
        RATE_LIMIT_ALLOWED.labels(endpoint=endpoint, method=method, key_type=key_type).inc()
        # Continuar
        return await call_next(request)
    else:
        # Bloquear y contar; tambiÃ©n actualizar REQUEST_COUNT con 429
        RATE_LIMIT_BLOCKED.labels(endpoint=endpoint, method=method, key_type=key_type).inc()
        try:
            REQUEST_COUNT.labels(method=method, endpoint=endpoint, status=str(429)).inc()
        except Exception:
            pass
        return Response(content=json.dumps({"detail": "Rate limit excedido"}), status_code=429, media_type="application/json")

@app.middleware("http")
async def metrics_middleware(request: Request, call_next):
    start = time.perf_counter()
    response = await call_next(request)
    duration = time.perf_counter() - start
    endpoint = get_endpoint_label(request.url.path)
    try:
        REQUEST_LATENCY.labels(endpoint=endpoint).observe(duration)
        REQUEST_COUNT.labels(
            method=request.method,
            endpoint=endpoint,
            status=str(response.status_code),
        ).inc()
    except Exception:
        # Evitar que mÃ©tricas rompan el request
        pass
    return response

# Upstreams por servicio (round-robin simple). Lee *_SERVICE_UPSTREAMS como lista CSV.
def parse_upstreams(env_name: str, default_url: str) -> List[str]:
    raw = os.getenv(env_name, "")
    items = [u.strip() for u in raw.split(",") if u.strip()]
    return items if items else [default_url]

SERVICE_POOLS: Dict[str, List[str]] = {
    name: parse_upstreams(f"{name.upper()}_SERVICE_UPSTREAMS", url)
    for name, url in SERVICES.items()
}

# Ãndices y locks para selecciÃ³n concurrente
ROUND_ROBIN_IDX: Dict[str, int] = {name: 0 for name in SERVICE_POOLS.keys()}
RR_LOCKS: Dict[str, asyncio.Lock] = {name: asyncio.Lock() for name in SERVICE_POOLS.keys()}

async def choose_upstream(service_name: str) -> str:
    pool = SERVICE_POOLS.get(service_name)
    if not pool:
        raise HTTPException(status_code=404, detail=f"Servicio {service_name} no encontrado")
    async with RR_LOCKS[service_name]:
        idx = ROUND_ROBIN_IDX[service_name]
        target = pool[idx % len(pool)]
        ROUND_ROBIN_IDX[service_name] = (idx + 1) % len(pool)
        return target

# ConfiguraciÃ³n JWT
JWT_ALGORITHM = os.getenv("JWT_ALGORITHM", "HS256")
JWT_SECRET_KEY = os.getenv("JWT_SECRET_KEY", "your-secret-key")
JWT_PUBLIC_KEY = os.getenv("JWT_PUBLIC_KEY", None)
JWKS_URL = os.getenv("JWKS_URL", "http://auth-service:8002/.well-known/jwks.json")
JWT_ISSUER = os.getenv("JWT_ISSUER", "tasknotes-auth")
JWT_AUDIENCE = os.getenv("JWT_AUDIENCE", "tasknotes")
JWT_CLOCK_SKEW_SECONDS = int(os.getenv("JWT_CLOCK_SKEW_SECONDS", "5"))
JWT_MAX_TTL_SECONDS = int(os.getenv("JWT_MAX_TTL_SECONDS", "3600"))
ENABLE_SCOPE_ENFORCEMENT = os.getenv("ENABLE_SCOPE_ENFORCEMENT", "false").lower() == "true"
SKIP_JWT_SIGNATURE_VERIFY = os.getenv("SKIP_JWT_SIGNATURE_VERIFY", "false").lower() == "true"

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
                raise HTTPException(status_code=401, detail="Clave pÃºblica no encontrada")
            
            payload = jwt.decode(
                token, 
                public_key_pem, 
                algorithms=[JWT_ALGORITHM],
                audience=JWT_AUDIENCE,
                issuer=JWT_ISSUER,
                options={
                    "verify_aud": True,
                    "verify_exp": True,
                    "verify_iat": True,
                    "verify_nbf": True,
                    "leeway": JWT_CLOCK_SKEW_SECONDS,
                },
            )
        else:
            # HS256
            # En entorno HS256 (dev/e2e), permitir omitir verificación de firma si está habilitado
            if SKIP_JWT_SIGNATURE_VERIFY:
                payload = jwt.get_unverified_claims(token)
                # Validar exp/iat si existen
                exp = payload.get("exp")
                iat = payload.get("iat")
                if exp is None or iat is None:
                    raise HTTPException(status_code=401, detail="Token sin exp/iat")
            else:
                payload = jwt.decode(
                    token,
                    JWT_SECRET_KEY,
                    algorithms=[JWT_ALGORITHM],
                    options={
                        "verify_aud": False,
                        "verify_exp": True,
                        "verify_iat": True,
                        "verify_nbf": True,
                        "leeway": JWT_CLOCK_SKEW_SECONDS,
                    },
                )
        # ValidaciÃ³n TTL mÃ¡ximo (exp - iat)
        exp = payload.get("exp")
        iat = payload.get("iat")
        if exp is None or iat is None:
            raise HTTPException(status_code=401, detail="Token sin exp/iat")
        # exp/iat son timestamps en segundos
        ttl = int(exp) - int(iat)
        if ttl > JWT_MAX_TTL_SECONDS:
            raise HTTPException(status_code=401, detail="Token TTL excede mÃ¡ximo permitido")

        return payload
    except JWTError as e:
        logger.warning(f"Error verificando token: {e}")
        raise HTTPException(status_code=401, detail="Token invÃ¡lido")

async def proxy_request(
    request: Request,
    service_name: str,
    path: str = "",
    token_payload: Optional[dict] = None
):
    """Proxy de requests a microservicios"""
    # Elegir upstream y construir URL
    base_url = await choose_upstream(service_name)
    target_url = f"{base_url}{path}"
    
    # Preparar headers
    headers = dict(request.headers)
    # Remover headers problemÃ¡ticos
    headers.pop("host", None)
    headers.pop("content-length", None)
    
    # Agregar informaciÃ³n del usuario si hay token
    if token_payload:
        headers["X-User-Id"] = str(token_payload.get("sub", ""))
        headers["X-User-Email"] = token_payload.get("email", "")

    # Propagar trace-id
    try:
        trace_id = getattr(request.state, "trace_id", None)
        if not trace_id:
            trace_id = request.headers.get("X-Request-ID") or uuid.uuid4().hex
        headers["X-Request-ID"] = trace_id
        headers.setdefault("X-Correlation-ID", trace_id)
        headers.setdefault("Trace-Id", trace_id)
    except Exception:
        pass
    
    try:
        async with httpx.AsyncClient() as client:
            # Obtener body si existe
            body = None
            if request.method in ["POST", "PUT", "PATCH"]:
                body = await request.body()
                try:
                    snippet = body.decode("utf-8")[:200]
                except Exception:
                    snippet = "(non-text)"
                try:
                    logger.info(f"proxy {service_name} {request.method} -> {target_url} ct={headers.get('content-type','')} size={len(body) if body else 0} body_snippet={snippet}")
                except Exception:
                    pass
            
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

def extract_scopes(payload: dict) -> List[str]:
    scopes: List[str] = []
    if not payload:
        return scopes
    raw_scope = payload.get("scope")
    if isinstance(raw_scope, str):
        scopes.extend([s for s in raw_scope.split() if s])
    raw_scopes = payload.get("scopes")
    if isinstance(raw_scopes, list):
        scopes.extend([str(s) for s in raw_scopes])
    return list(set(scopes))

def has_admin_role(payload: dict) -> bool:
    roles = payload.get("roles")
    if isinstance(roles, list):
        return "admin" in [str(r).lower() for r in roles]
    if isinstance(roles, str):
        return "admin" == roles.lower()
    return False

# PolÃ­ticas declarativas de acceso por endpoint/mÃ©todo â†’ scopes requeridos
ACCESS_POLICIES: Dict[str, Dict[str, List[str]]] = {
    "tasks": {
        "GET": ["tasks:read"],
        "POST": ["tasks:write"],
        "PUT": ["tasks:write"],
        "PATCH": ["tasks:write"],
        "DELETE": ["tasks:write"],
    },
    "notes": {
        "GET": ["notes:read"],
        "POST": ["notes:write"],
        "PUT": ["notes:write"],
        "PATCH": ["notes:write"],
        "DELETE": ["notes:write"],
    },
    "tags": {
        "GET": ["tags:read"],
        "POST": ["tags:write"],
        "PUT": ["tags:write"],
        "PATCH": ["tags:write"],
        "DELETE": ["tags:write"],
    },
    "categories": {
        "GET": ["categories:read"],
        "POST": ["categories:write"],
        "PUT": ["categories:write"],
        "PATCH": ["categories:write"],
        "DELETE": ["categories:write"],
    },
    "user-profile": {
        "GET": ["profile:read"],
        "POST": ["profile:write"],
        "PUT": ["profile:write"],
        "PATCH": ["profile:write"],
        "DELETE": ["profile:write"],
    },
    "search": {
        "GET": ["search:read"],
        "POST": ["search:query"],
    },
}

def enforce_policies(token_payload: dict, endpoint: str, method: str):
    if not ENABLE_SCOPE_ENFORCEMENT:
        return
    if has_admin_role(token_payload):
        return
    required = ACCESS_POLICIES.get(endpoint, {}).get(method.upper(), [])
    if not required:
        return
    scopes = set(extract_scopes(token_payload))
    missing = [s for s in required if s not in scopes]
    if missing:
        raise HTTPException(status_code=403, detail=f"Scopes insuficientes: faltan {missing}")

@app.get("/health")
async def health_check():
    """Health check del API Gateway"""
    return {"status": "healthy", "service": "api-gateway"}

@app.get("/metrics")
async def metrics():
    """Exponer mÃ©tricas Prometheus"""
    data = generate_latest()
    return Response(content=data, media_type=CONTENT_TYPE_LATEST)

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

# Rutas de autenticaciÃ³n (sin autenticaciÃ³n requerida)
@app.api_route("/auth/{path:path}", methods=["GET", "POST", "PUT", "DELETE", "PATCH"])
async def auth_proxy(request: Request, path: str):
    """Proxy para auth-service"""
    prefix = "/auth"
    forward_path = (f"{prefix}/{path}" if path else (prefix + ("/" if request.url.path.endswith("/") else "")))
    proxied = await proxy_request(request, "auth", forward_path )
    # Interceptar registro para crear perfil automÃ¡ticamente
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
                # Seleccionar upstream para user_profile
                profiles_base = await choose_upstream("user_profile")
                profiles_url = f"{profiles_base}/profiles/"
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
        logger.error(f"Intercept registro fallÃ³: {e}")
    return Response(content=proxied.content, status_code=proxied.status_code, media_type=proxied.headers.get("content-type"))

# Rutas protegidas que requieren autenticaciÃ³n
@app.api_route("/tasks/{path:path}", methods=["GET", "POST", "PUT", "DELETE", "PATCH"])
async def tasks_proxy(request: Request, path: str, token_payload: dict = Depends(verify_token)):
    """Proxy para tasks-service"""
    if not token_payload:
        raise HTTPException(status_code=401, detail="Token requerido")
    enforce_policies(token_payload, "tasks", request.method)
    prefix = "/tasks"
    forward_path = (f"{prefix}/{path}" if path else f"{prefix}/")
    proxied = await proxy_request(request, "tasks", forward_path, token_payload)
    return Response(content=proxied.content, status_code=proxied.status_code, media_type=proxied.headers.get("content-type"))

@app.api_route("/notes/{path:path}", methods=["GET", "POST", "PUT", "DELETE", "PATCH"])
async def notes_proxy(request: Request, path: str, token_payload: dict = Depends(verify_token)):
    """Proxy para notes-service"""
    if not token_payload:
        raise HTTPException(status_code=401, detail="Token requerido")
    enforce_policies(token_payload, "notes", request.method)
    prefix = "/notes"
    forward_path = (f"{prefix}/{path}" if path else f"{prefix}/")
    proxied = await proxy_request(request, "notes", forward_path, token_payload)
    return Response(content=proxied.content, status_code=proxied.status_code, media_type=proxied.headers.get("content-type"))

@app.api_route("/tags/{path:path}", methods=["GET", "POST", "PUT", "DELETE", "PATCH"])
async def tags_proxy(request: Request, path: str, token_payload: dict = Depends(verify_token)):
    """Proxy para tags-service"""
    if not token_payload:
        raise HTTPException(status_code=401, detail="Token requerido")
    enforce_policies(token_payload, "tags", request.method)
    prefix = "/tags"
    forward_path = (f"{prefix}/{path}" if path else prefix)
    proxied = await proxy_request(request, "tags", forward_path, token_payload)
    return Response(content=proxied.content, status_code=proxied.status_code, media_type=proxied.headers.get("content-type"))

@app.api_route("/categories/{path:path}", methods=["GET", "POST", "PUT", "DELETE", "PATCH"])
async def categories_proxy(request: Request, path: str, token_payload: dict = Depends(verify_token)):
    """Proxy para categories-service"""
    if not token_payload:
        raise HTTPException(status_code=401, detail="Token requerido")
    enforce_policies(token_payload, "categories", request.method)
    prefix = "/categories"
    forward_path = (f"{prefix}/{path}" if path else prefix)
    proxied = await proxy_request(request, "categories", forward_path, token_payload)
    return Response(content=proxied.content, status_code=proxied.status_code, media_type=proxied.headers.get("content-type"))

@app.api_route("/user-profile/{path:path}", methods=["GET", "POST", "PUT", "DELETE", "PATCH"])
async def user_profile_proxy(request: Request, path: str, token_payload: dict = Depends(verify_token)):
    """Proxy para user-profile-service"""
    if not token_payload:
        raise HTTPException(status_code=401, detail="Token requerido")
    enforce_policies(token_payload, "user-profile", request.method)
    prefix = "/profiles"
    forward_path = (f"{prefix}/{path}" if path else (prefix + ("/" if request.url.path.endswith("/") else "")))
    proxied = await proxy_request(request, "user_profile", forward_path, token_payload)
    return Response(content=proxied.content, status_code=proxied.status_code, media_type=proxied.headers.get("content-type"))

@app.api_route("/search/{path:path}", methods=["GET", "POST", "PUT", "DELETE", "PATCH"])
async def search_proxy(request: Request, path: str, token_payload: dict = Depends(verify_token)):
    """Proxy para search-service"""
    if not token_payload:
        raise HTTPException(status_code=401, detail="Token requerido")
    enforce_policies(token_payload, "search", request.method)
    # Search service mapea la raÃ­z '/'
    forward_path = (f"/{path}" if path else ("/" if request.url.path.endswith("/") else ""))
    proxied = await proxy_request(request, "search", forward_path, token_payload)
    return Response(content=proxied.content, status_code=proxied.status_code, media_type=proxied.headers.get("content-type"))

# Montar Socket.IO explÃ­citamente bajo la ruta /socket.io
# app.mount("/socket.io", socketio.ASGIApp(sio, socketio_path="socket.io"))

# Crear aplicaciÃ³n ASGI combinada que incluye FastAPI y Socket.IO en /socket.io
combined_app = socketio.ASGIApp(sio, app, socketio_path="socket.io")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(combined_app, host="0.0.0.0", port=8083)
# Middleware para correlaciÃ³n de requests con trace-id
@app.middleware("http")
async def trace_id_middleware(request: Request, call_next):
    # Respetar encabezados existentes si vienen del cliente o de proxies
    incoming = request.headers.get("X-Request-ID") or request.headers.get("X-Correlation-ID") or request.headers.get("Trace-Id")
    trace_id = incoming if incoming else uuid.uuid4().hex
    # Guardar en el estado de la request
    try:
        request.state.trace_id = trace_id
    except Exception:
        pass

    # Continuar la cadena y aÃ±adir header a la respuesta
    response = await call_next(request)
    try:
        response.headers["X-Request-ID"] = trace_id
    except Exception:
        pass

    # Log bÃ¡sico con trace-id
    try:
        logger.info(f"trace_id={trace_id} method={request.method} path={request.url.path} status={response.status_code}")
    except Exception:
        pass

    return response

