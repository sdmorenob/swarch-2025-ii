# app/api/endpoints.py

import jwt
import os
from datetime import timedelta
from fastapi import APIRouter, Depends, HTTPException
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
import httpx

from app.core.email import send_email_async
from app.db.session import get_db
from app.services.register import save_verification_code, verify_code, get_password_hash
from app.services.login import create_access_token, decode_access_token, verify_password
from app.db.models import (
    EmailVerificationRequest, UserRegistrationRequest, User, EmailCheckRequest,
    LoginRequest, ForgotPasswordRequest, ResetPasswordRequest,
    SocialLoginRequest
)

router = APIRouter()
security = HTTPBearer()


USER_SERVICE_URL = "http://api-gateway:8080/api/users"
PHYSICAL_ACTIVITIES_SERVICE_URL = "http://api-gateway:8080/api/activities"
SECRET_KEY = os.getenv("SECRET_KEY")
ALGORITHM = os.getenv("ALGORITHM")
FRONTEND_URL = os.getenv("FRONTEND_URL")

@router.get("/health")
async def health_check():
    """Health check endpoint para verificar que el servicio esta funcionando"""
    return {
        "status": "healthy",
        "service": "auth-service",
        "message": "Service is running"
    }

@router.post("/check-email")
async def check_email(request: EmailCheckRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter_by(correo=request.email).first()
    return {"status": "success", "exists": user is not None}

@router.post("/send-verification")
async def send_verification_email(request: EmailVerificationRequest, db: Session = Depends(get_db)):
    """
    Envía un correo electrónico de verificación al usuario.

    Args:
        request (EmailVerificationRequest): Datos del correo y código de verificación.
        db (Session): Sesión de la base de datos.

    Returns:
        dict: Estado y mensaje de éxito.

    Raises:
        HTTPException: Si ocurre un error al enviar el correo.
    """
    try:
        # Guarda el código de verificación en la base de datos
        save_verification_code(db, request.email, request.code)

        # Cuerpo del mensaje en HTML
        html_body = f"""
            <html>
                <body style="font-family: Arial, sans-serif; text-align: center; margin: 0; padding: 40px; background-color: #f9fafb;">
                    <h1 style="font-size: 28px; font-weight: bold; color: #1f2937;">Código de Verificación</h1>
                    <p style="font-size: 18px; color: #4b5563;">Tu código de verificación para RETOFIT es:</p>
                    <h2 style="font-size: 36px; color: #2563EB; letter-spacing: 4px; margin: 30px 0;">{request.code}</h2>
                    <p style="font-size: 14px; color: #6b7280;">Este código expirará en 5 minutos.</p>
                    <p style="font-size: 14px; color: #6b7280;">Si no solicitaste este código, puedes ignorar este correo.</p>
                </body>
            </html>
        """

        # Envía el mensaje de correo electrónico
        await send_email_async(to=request.email, subject="Verificación de Correo - RETOFIT", html_body=html_body)

        return {
            "status": "success",
            "message": "Código de verificación enviado",
            "email": request.email
        }

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error al enviar el email: {str(e)}"
        )


@router.post("/verify-code")
async def verify_code_endpoint(request: EmailVerificationRequest, db: Session = Depends(get_db)):
    """
    Verifica el código de verificación proporcionado por el usuario.

    Args:
        request (EmailVerificationRequest): Datos del correo y código de verificación.
        db (Session): Sesión de la base de datos.

    Returns:
        dict: Estado, mensaje de éxito y token de acceso si el código es correcto.

    Raises:
        HTTPException: Si el código es incorrecto o ha expirado.
    """
    if verify_code(db, request.email, request.code):
        return {
            "status": "success",
            "message": "Código verificado correctamente."
        }
    else:
        raise HTTPException(
            status_code=400,
            detail="Código de verificación incorrecto o expirado"
        )


@router.post("/register")
async def register_user(request: UserRegistrationRequest, db: Session = Depends(get_db)):
    print('Llego mensaje')
    hashed_password = get_password_hash(request.password) if request.password else None
    user = User(
        nombre=request.name,
        apellido=request.last_name or '',
        correo=request.email,
        contraseña=hashed_password,
        proveedor=request.provider
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    # Notificar al user-service para que cree el perfil
    try:
        async with httpx.AsyncClient() as client:
            user_profile_data = {
                "id_usuario": user.id_usuario,
                "nombre": user.nombre,
                "apellido": user.apellido,
                "correo": user.correo,
            }
            response = await client.post(f"{USER_SERVICE_URL}/", json=user_profile_data)
            response.raise_for_status() # Lanza un error si la solicitud falla
            # 2. Notificar a physical-activities-service (NUEVO)
            # Este servicio solo necesita el ID para crear la referencia.
            activity_user_data = {"id_usuario": user.id_usuario}
            # El endpoint podría ser '/users' o similar. Debes crearlo en el servicio de Go.
            #response_activities = await client.post(f"{PHYSICAL_ACTIVITIES_SERVICE_URL}/users", json=activity_user_data)
            #response_activities.raise_for_status()
            
    
    except httpx.RequestError as e:
        # En un sistema real, aquí manejarías el error (e.g., reintentos, logs)
        # Por ahora, lanzamos una excepción para saber que algo falló
        print(f"Error al notificar al user-service: {e}")
        raise HTTPException(status_code=500, detail=f"Error al comunicar con servicios internos: {e.url}")

    # En una arquitectura real, aquí podrías emitir un evento 'user_created'
    return {"status": "success", "message": "Usuario registrado correctamente", "user_id": user.id_usuario}

@router.post("/login")
async def login_user(request: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter_by(correo=request.email).first()
    if not user or not verify_password(request.password, user.contraseña):
        raise HTTPException(status_code=401, detail="Credenciales incorrectas")

    access_token = create_access_token(data={"sub": user.correo, "id": user.id_usuario}, role=user.rol)
    
    # --- CAMBIO SUGERIDO ---
    # Devuelve el token Y los datos del usuario
    return {
        "access_token": access_token, 
        "token_type": "bearer",
        "user": {
            "id": user.id_usuario, # Asegúrate de que este sea el nombre correcto del campo ID
            "name": user.nombre,
            "email": user.correo,
            "role": user.rol
        }
    }

@router.post("/login/admin")
async def login_admin_user(request: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter_by(correo=request.email).first()
    if not user or not verify_password(request.password, user.contraseña):
        raise HTTPException(status_code=401, detail="Credenciales incorrectas")

    if user.rol != "admin":
        raise HTTPException(status_code=403, detail="Credenciales incorrectas")

    access_token = create_access_token(data={"sub": user.correo, "id": user.id_usuario}, role=user.rol)
    return {"access_token": access_token, "token_type": "bearer"}

@router.post("/social-login")
async def social_login(request: SocialLoginRequest, db: Session = Depends(get_db)):
    # 1. Buscar si el usuario ya existe con este proveedor y su ID único.
    user = db.query(User).filter_by(
        proveedor=request.provider,
        id_proveedor=request.provider_id
    ).first()

    # 2. Si no se encuentra por ID, intentamos buscar por correo.
    if not user:
        existing_user_by_email = db.query(User).filter_by(correo=request.email).first()
        
        # Si ya existe un usuario con ese email, pero con un proveedor diferente (ej: 'email'),
        # no debemos crear una cuenta nueva ni enlazarla automáticamente.
        if existing_user_by_email:
            raise HTTPException(
                status_code=409, 
                detail=f"Ya existe una cuenta con el correo {request.email}. Por favor, inicia sesión con tu método original."
            )
        else:
            # Si no existe de ninguna forma, lo creamos.
            user = User(
                nombre=request.name,
                correo=request.email,
                proveedor=request.provider,
                id_proveedor=request.provider_id
            )
            db.add(user)
            db.commit()
            db.refresh(user)

    # 3. Crear y devolver el token de acceso de nuestra aplicación
    access_token = create_access_token(data={"sub": user.correo, "id": user.id_usuario}, role=user.rol)
    return {"access_token": access_token, "token_type": "bearer"}


@router.get("/validate-token")
async def validate_token(credentials: HTTPAuthorizationCredentials = Depends(security)):
    """
    Valida el token de acceso.

    Args:
        credentials (HTTPAuthorizationCredentials): Credenciales de autorización.

    Returns:
        dict: Estado de validación del token.
    """
    token = credentials.credentials
    print("ENNTROOOOO TOKEEEEEENNNN!!!!!!!!!!!!!!!")
    try:
        payload = decode_access_token(token)
        return {"status": "success", "message": "Token válido", "data": payload}
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expirado")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Token inválido")

@router.post("/forgot-password")
async def forgot_password(request: ForgotPasswordRequest, db: Session = Depends(get_db)):
    """
    Envía un enlace de restablecimiento de contraseña al correo del usuario.

    Args:
        request (ForgotPasswordRequest): Datos de la solicitud que contiene el correo electrónico.
        db (Session): Sesión de la base de datos.

    Returns:
        dict: Estado y mensaje de éxito si el correo fue enviado.

    Raises:
        HTTPException: Si el usuario no es encontrado o si ocurre un error al enviar el correo.
    """
    # Busca al usuario por correo electrónico
    user = db.query(User).filter_by(correo=request.email).first()
    # Por seguridad, no revelamos si el usuario existe.
    # Si no se encuentra, simplemente devolvemos una respuesta exitosa sin hacer nada.
    if not user:
        raise HTTPException(status_code=401, detail="Usuario no encontrado")

    try:
        # Genera un token de restablecimiento con una expiración de 10 minutos
        reset_token = create_access_token(
            data={"sub": user.correo}, role=user.rol, expires_delta=timedelta(minutes=10))

        # Crea el enlace de restablecimiento de contraseña
        reset_link = f"{FRONTEND_URL}/reset-password?token={reset_token}"

        # Cuerpo del mensaje en HTML
        html_body = f"""
            <html>
                <body style="font-family: Arial, sans-serif; text-align: center; margin: 0; padding: 40px; background-color: #f9fafb;">
                    <h1 style="font-size: 28px; font-weight: bold; color: #1f2937;">Restablecimiento de Contraseña</h1>
                    <p style="font-size: 18px; color: #4b5563;">Haz clic en el botón para restablecer tu contraseña:</p>
                    <a href="{reset_link}" style="display: inline-block; margin: 20px 0; padding: 12px 24px; background-color: #2563EB; color: #ffffff; text-decoration: none; border-radius: 6px; font-size: 16px;">Restablecer Contraseña</a>
                    <p style="font-size: 14px; color: #6b7280;">Este enlace expirará en 10 minutos.</p>
                    <p style="font-size: 14px; color: #6b7280;">Si no solicitaste este cambio, puedes ignorar este correo.</p>
                </body>
            </html>
        """

        # Envía el mensaje de correo electrónico
        await send_email_async(to=request.email, subject="Restablecimiento de Contraseña - RETOFIT", html_body=html_body)

        return {"status": "success", "message": "Si existe una cuenta, se ha enviado un enlace de restablecimiento."}

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error al enviar el email: {str(e)}"
        )


@router.post("/reset-password")
async def reset_password(request: ResetPasswordRequest, db: Session = Depends(get_db)):
    """
    Restablece la contraseña del usuario usando un token de restablecimiento.

    Args:
        request (ResetPasswordRequest): Datos de la solicitud que contiene el token y la nueva contraseña.
        db (Session): Sesión de la base de datos.

    Returns:
        dict: Estado y mensaje de éxito si la contraseña fue cambiada.

    Raises:
        HTTPException: Si el token es inválido, ha expirado, o si el usuario no es encontrado.
    """
    try:
        # Decodifica el token para obtener el correo electrónico
        payload = jwt.decode(request.token, SECRET_KEY, algorithms=[ALGORITHM])
        email = payload.get("sub")
        if email is None:
            raise HTTPException(status_code=400, detail="Token inválido")

        # Busca al usuario por correo electrónico
        user = db.query(User).filter_by(correo=email).first()
        if not user:
            raise HTTPException(
                status_code=404, detail="Usuario no encontrado")

        # Cambia la contraseña del usuario
        user.contraseña = get_password_hash(request.new_password)
        db.commit()

        return {"status": "success", "message": "Contraseña cambiada correctamente"}

    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=400, detail="El token ha expirado")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=400, detail="Token inválido")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
