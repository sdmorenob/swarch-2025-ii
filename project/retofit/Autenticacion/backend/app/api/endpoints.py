import jwt
import os
from fastapi import APIRouter, Depends,HTTPException
from fastapi_mail import MessageSchema
from app.core.email import fastmail
from sqlalchemy.orm import Session
from app.db.session import SessionLocal
from app.services.register import save_verification_code, verify_code, get_password_hash
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from app.services.login import create_access_token, decode_access_token, verify_password
from datetime import timedelta
from typing import List
from app.services.achievements import check_and_award_achievements # Importa la nueva función
from app.db.models import Actividad, ActividadCreate, ActividadResponse # Importa los schemas
from pydantic import BaseModel


from app.db.models import (
    EmailVerificationRequest,
    UserRegistrationRequest,
    User,
    EmailCheckRequest,
    LoginRequest,
    ForgotPasswordRequest,
    ResetPasswordRequest,
    Puntos, # Importa el nuevo modelo
    Logro, # Importa el nuevo modelo
    LogroDefinicion, # Importa el modelo de definiciones
    PuntosCreate, # Importa el nuevo schema
    PuntosResponse, # Importa el nuevo schema
    LogroCreate, # Importa el nuevo schema
    LogroResponse # Importa el nuevo schema
   
)



router = APIRouter()
security = HTTPBearer()


SECRET_KEY = os.getenv("SECRET_KEY")
ALGORITHM = os.getenv("ALGORITHM")
FRONTEND_URL = os.getenv("FRONTEND_URL")


def get_db():
    """
    Proporciona una sesión de base de datos para cada solicitud.

    Yields:
        Session: Sesión de la base de datos.
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


@router.get("/")
async def read_root():
    return {"message": "Welcome to RetoFit Backend API"}


@router.post("/check-email")
async def check_email(request: EmailCheckRequest, db: Session = Depends(get_db)):
    """
    Verifica si un correo ya existe en la base de datos.

    Args:
        email (str): Correo electrónico a verificar.
        db (Session): Sesión de la base de datos.

    Returns:
        dict: Estado y si el correo existe.
    """
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

        # Configura el mensaje de correo electrónico
        message = MessageSchema(
            subject="Verificación de Correo - RETOFIT",
            recipients=[request.email],
            body=f"""
                <html>
                    <body style="font-family: Arial, sans-serif; text-align: center; margin: 0; padding: 40px; background-color: #fdf4e3;">
                        <h1 style="font-size: 30px; font-weight: bold; color: #ff7a00;">Código de Verificación</h1>
                        <p style="font-size: 20px; color: #333333;">Tu código de verificación es:</p>
                        <h2 style="font-size: 40px; color: #ff7a00;">{request.code}</h2>
                        <p style="font-size: 16px; color: #555555;">Este código expirará en 5 minutos.</p>
                        <p style="font-size: 16px; color: #555555;">Si no solicitaste este código, puedes ignorar este correo.</p>
                    </body>
                </html>

            """,
            subtype="html"
        )

        # Envía el mensaje de correo electrónico
        await fastmail.send_message(message)

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
        # Generar el token de acceso
        access_token = create_access_token(data={"sub": request.email})
        return {
            "status": "success",
            "message": "Código de verificación correcto",
            "access_token": access_token,
            "token_type": "bearer"
        }
    else:
        raise HTTPException(
            status_code=400,
            detail="Código de verificación incorrecto o expirado"
        )
    

@router.post("/register")
async def register_user(request: UserRegistrationRequest, db: Session = Depends(get_db)):
    """
    Registra un nuevo usuario en la base de datos.

    Args:
        request (UserRegistrationRequest): Datos del usuario a registrar.
        db (Session): Sesión de la base de datos.

    Returns:
        dict: Estado y mensaje de éxito tras el registro.
    """
    # Hashea la contraseña si está presente
    hashed_password = get_password_hash(
        request.password) if request.password else None

    # Crea un nuevo objeto de usuario
    user = User(
        nombre=request.name,
        apellido=request.last_name if request.last_name else '',
        correo=request.email,
        contraseña=hashed_password,
        edad=request.edad,
        peso=request.peso,
        altura=request.altura,
        genero=request.genero,
        nivel_condicion_fisica=request.nivel_condicion_fisica,
        proveedor=request.provider
        
    )

    # Añade el usuario a la base de datos
    db.add(user)
    db.commit()
    db.refresh(user)

    return {"status": "success", "message": "Usuario registrado correctamente"}


@router.post("/login-google")
async def login_google_user(request: LoginRequest, db: Session = Depends(get_db)):
    """
    Inicia sesión de un usuario existente.
    """
    user = db.query(User).filter_by(correo=request.email).first()
    if not user:
        user = User(
            nombre=request.name,
            apellido='',
            correo=request.email,
            contraseña=None,
            proveedor="google"
        )
        db.add(user)
        db.commit()
        db.refresh(user)

    access_token = create_access_token(data={"sub": user.correo})

    return {"status": "success", "access_token": access_token, "token_type": "bearer"}

@router.post("/login")
async def login_user(request: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter_by(correo=request.email).first()

    if not user:
        raise HTTPException(status_code=401, detail="Usuario no encontrado")

    if user.proveedor == "google":
        raise HTTPException(
            status_code=401, detail="Ya has iniciado sesión con Google"
        )

    if not verify_password(request.password, user.contraseña):
        raise HTTPException(status_code=401, detail="Credenciales incorrectas")

    access_token = create_access_token(data={"sub": user.correo})
    
    # Calcular puntos totales del usuario
    puntos_sum = db.query(Puntos).filter(Puntos.id_usuario == user.id_usuario).all()
    total_puntos = sum(p.cantidad for p in puntos_sum) if puntos_sum else 0
    
    # Contar actividades totales del usuario
    total_actividades = db.query(Actividad).filter(Actividad.id_usuario == user.id_usuario).count()
    
    # Devolver también los datos del usuario
    user_data = {
        "id": user.id_usuario,
        "username": user.nombre,
        "email": user.correo,
        "is_verified": True,  # Por ahora siempre True
        "puntos_totales": total_puntos,
        "total_actividades": total_actividades,
        "created_at": user.created_at.isoformat() if hasattr(user, 'created_at') else "",
        "updated_at": user.updated_at.isoformat() if hasattr(user, 'updated_at') else ""
    }
    
    return {
        "access_token": access_token, 
        "token_type": "bearer",
        "user": user_data
    }


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
    try:
        payload = decode_access_token(token)
        return {"status": "success", "message": "Token válido", "data": payload}
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expirado")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Token inválido")

# Endpoint para solicitar el restablecimiento de contraseña


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
    if not user:
        raise HTTPException(status_code=401, detail="Usuario no encontrado")

    try:
        # Genera un token de restablecimiento con una expiración de 1 hora
        reset_token = create_access_token(
            data={"sub": user.correo}, expires_delta=timedelta(minutes=10))

        # Crea el enlace de restablecimiento de contraseña
        reset_link = f"{FRONTEND_URL}/reset-password?token={reset_token}"

        # Configura el mensaje de correo electrónico
        message = MessageSchema(
            subject="Restablecimiento de Contraseña - RETOFITAPP",
            recipients=[request.email],
            body=f"""
                <html>
                    <body style="font-family: Arial, sans-serif; text-align: center; margin: 0; padding: 40px; background-color: #fdf4e3;">
                        <h1 style="font-size: 30px; font-weight: bold; color: #ffb923;">Restablecimiento de Contraseña</h1>
                        <p style="font-size: 20px; color: #333333;">Haz clic en el enlace para restablecer tu contraseña:</p>
                        <a href="{reset_link}" style="font-size: 20px; color: #835bfc; text-decoration: none; font-weight: bold;">Restablecer Contraseña</a>
                        <p style="font-size: 16px; color: #555555;">Este enlace expirará en 10 minutos.</p>
                        <p style="font-size: 16px; color: #555555;">Si no solicitaste este cambio, puedes ignorar este correo.</p>
                    </body>
                </html>

                """,
            subtype="html"
        )

        # Envía el mensaje de correo electrónico
        await fastmail.send_message(message)

        return {
            "status": "success",
            "message": "Enlace de restablecimiento enviado",
            "email": request.email
        }

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error al enviar el email: {str(e)}"
        )


# Endpoint para restablecer la contraseña usando el token


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
    

@router.post("/users/{user_id}/points",tags=["Puntos"], response_model=PuntosResponse, status_code=201)
async def create_points_for_user(user_id: int, puntos: PuntosCreate, db: Session = Depends(get_db)):
    """
    Otorga una nueva cantidad de puntos a un usuario específico.
    """
    # 1. Verifica si el usuario existe
    db_user = db.query(User).filter(User.id_usuario == user_id).first()
    if db_user is None:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")

    # 2. Crea el nuevo registro de puntos
    new_puntos = Puntos(cantidad=puntos.cantidad, id_usuario=user_id)
    
    # 3. Guarda en la base de datos
    db.add(new_puntos)
    db.commit()
    db.refresh(new_puntos)
    
    return new_puntos


@router.get("/users/{user_id}/points",tags=["Puntos"], response_model=List[PuntosResponse])
async def get_user_points(user_id: int, db: Session = Depends(get_db)):
    """
    Obtiene todo el historial de puntos de un usuario.
    """
    # 1. Verifica si el usuario existe
    db_user = db.query(User).filter(User.id_usuario == user_id).first()
    if db_user is None:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")

    # 2. Retorna los puntos del usuario
    return db.query(Puntos).filter(Puntos.id_usuario == user_id).all()


# --- Endpoints para LOGROS ---

@router.post("/users/{user_id}/achievements", tags=["Logros"],response_model=LogroResponse, status_code=201)
async def create_achievement_for_user(user_id: int, logro: LogroCreate, db: Session = Depends(get_db)):
    """
    Asigna un nuevo logro a un usuario específico.
    """
    # 1. Verifica si el usuario existe
    db_user = db.query(User).filter(User.id_usuario == user_id).first()
    if db_user is None:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")

    # 2. Crea el nuevo logro
    new_logro = Logro(**logro.dict(), id_usuario=user_id)
    
    # 3. Guarda en la base de datos
    db.add(new_logro)
    db.commit()
    db.refresh(new_logro)
    
    return new_logro


@router.get("/users/{user_id}/achievements", response_model=List[LogroResponse], tags=["Logros"])
async def get_user_achievements(user_id: int, db: Session = Depends(get_db)):
    """
    Obtiene la lista de logros de un usuario.
    """
    # 1. Verifica si el usuario existe
    db_user = db.query(User).filter(User.id_usuario == user_id).first()
    if db_user is None:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
        
    # 2. Retorna los logros del usuario
    return db.query(Logro).filter(Logro.id_usuario == user_id).all()


@router.post("/users/{user_id}/activities", response_model=ActividadResponse, status_code=201)
async def create_activity_for_user(user_id: int, actividad: ActividadCreate, db: Session = Depends(get_db)):
    """
    Registra una nueva actividad para un usuario, calcula puntos automáticamente y verifica si ha ganado logros.
    """
    db_user = db.query(User).filter(User.id_usuario == user_id).first()
    if db_user is None:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")

    # 1. Guarda la nueva actividad
    new_activity = Actividad(**actividad.dict(), id_usuario=user_id)
    db.add(new_activity)
    db.commit()
    db.refresh(new_activity)

    # 2. Calcula puntos automáticamente basado en la actividad
    points = calculate_activity_points(actividad)
    
    # 3. Guarda los puntos en la base de datos
    new_points = Puntos(cantidad=points, id_usuario=user_id)
    db.add(new_points)
    db.commit()

    # 4. Llama al motor de logros para que haga la magia
    check_and_award_achievements(db=db, user_id=user_id)

    return new_activity


@router.get("/users/{user_id}/activities", response_model=List[ActividadResponse])
async def get_activities_by_user(user_id: int, db: Session = Depends(get_db)):
    """
    Obtiene todas las actividades de un usuario específico.
    """
    db_user = db.query(User).filter(User.id_usuario == user_id).first()
    if db_user is None:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")

    activities = db.query(Actividad).filter(Actividad.id_usuario == user_id).all()
    return activities


@router.get("/activities", response_model=List[ActividadResponse])
async def get_all_activities(db: Session = Depends(get_db)):
    """
    Obtiene todas las actividades (admin endpoint).
    """
    activities = db.query(Actividad).all()
    return activities


@router.post("/initialize-achievements")
async def initialize_default_achievements(db: Session = Depends(get_db)):
    """
    Inicializa las definiciones de logros por defecto (solo para setup inicial)
    """
    # Verificar si ya existen logros definidos
    existing_count = db.query(LogroDefinicion).count()
    if existing_count > 0:
        return {"message": f"Ya existen {existing_count} definiciones de logros"}
    
    # Definiciones de logros por defecto
    default_achievements = [
        # Logros por distancia
        LogroDefinicion(
            nombre="Primer Paso",
            descripcion="Completa tu primera actividad con distancia",
            regla_tipo="SUMA_DISTANCIA",
            regla_valor=0.1
        ),
        LogroDefinicion(
            nombre="Caminante",
            descripcion="Acumula un total de 5km",
            regla_tipo="SUMA_DISTANCIA",
            regla_valor=5.0
        ),
        LogroDefinicion(
            nombre="Corredor Novato",
            descripcion="Acumula un total de 10km corriendo",
            regla_tipo="SUMA_DISTANCIA",
            regla_valor=10.0
        ),
        LogroDefinicion(
            nombre="Atleta en Progreso",
            descripcion="Acumula un total de 21km",
            regla_tipo="SUMA_DISTANCIA",
            regla_valor=21.0
        ),
        LogroDefinicion(
            nombre="Maratonista Amateur",
            descripcion="Acumula un total de 42km corriendo",
            regla_tipo="SUMA_DISTANCIA",
            regla_valor=42.0
        ),
        LogroDefinicion(
            nombre="Maratonista Experto",
            descripcion="Acumula un total de 100km",
            regla_tipo="SUMA_DISTANCIA",
            regla_valor=100.0
        ),
        
        # Logros por número de actividades
        LogroDefinicion(
            nombre="Iniciando",
            descripcion="Completa tu primera actividad",
            regla_tipo="CONTEO_ACTIVIDADES",
            regla_valor=1
        ),
        LogroDefinicion(
            nombre="Constante",
            descripcion="Realiza 5 actividades",
            regla_tipo="CONTEO_ACTIVIDADES",
            regla_valor=5
        ),
        LogroDefinicion(
            nombre="Dedicado",
            descripcion="Realiza 10 actividades",
            regla_tipo="CONTEO_ACTIVIDADES",
            regla_valor=10
        ),
        LogroDefinicion(
            nombre="Comprometido",
            descripcion="Realiza 25 actividades",
            regla_tipo="CONTEO_ACTIVIDADES",
            regla_valor=25
        ),
        LogroDefinicion(
            nombre="Atleta Disciplinado",
            descripcion="Realiza 50 actividades",
            regla_tipo="CONTEO_ACTIVIDADES",
            regla_valor=50
        ),
    ]
    
    # Agregar todas las definiciones
    for achievement in default_achievements:
        db.add(achievement)
    
    db.commit()
    
    return {"message": f"Se crearon {len(default_achievements)} definiciones de logros"}


@router.get("/achievement-definitions")
async def get_achievement_definitions(db: Session = Depends(get_db)):
    """
    Obtiene todas las definiciones de logros disponibles
    """
    definitions = db.query(LogroDefinicion).all()
    return definitions

@router.get("/users/{user_id}/achievements-progress")
async def get_user_achievements_progress(user_id: int, db: Session = Depends(get_db)):
    """
    Obtiene el progreso de logros del usuario (obtenidos y pendientes)
    """
    # Obtener todas las definiciones de logros
    all_definitions = db.query(LogroDefinicion).all()
    
    # Obtener logros ya obtenidos por el usuario - por ahora nombres únicos
    user_achievements = db.query(Logro).filter(Logro.id_usuario == user_id).all()
    obtained_names = {achievement.nombre for achievement in user_achievements}
    
    # Obtener estadísticas del usuario para calcular progreso
    user_activities = db.query(Actividad).filter(Actividad.id_usuario == user_id).all()
    total_distance = sum(act.distancia_km or 0 for act in user_activities)
    total_activities = len(user_activities)
    
    progress_list = []
    
    for definition in all_definitions:
        is_obtained = definition.nombre in obtained_names
        
        # Calcular progreso actual
        if definition.regla_tipo == "SUMA_DISTANCIA":
            current_progress = total_distance
        elif definition.regla_tipo == "CONTEO_ACTIVIDADES":
            current_progress = total_activities
        else:
            current_progress = 0
            
        # Calcular porcentaje
        percentage = min(100, (current_progress / definition.regla_valor) * 100) if definition.regla_valor > 0 else 0
        
        # Obtener fecha de obtención si aplica
        obtained_date = None
        if is_obtained:
            user_achievement = next(
                (ua for ua in user_achievements if ua.nombre == definition.nombre), 
                None
            )
            obtained_date = user_achievement.fecha_obtencion if user_achievement else None
        
        progress_list.append({
            "id": definition.id_definicion,
            "nombre": definition.nombre,
            "descripcion": definition.descripcion,
            "meta": definition.regla_valor,
            "progreso_actual": current_progress,
            "porcentaje_completado": percentage,
            "obtenido": is_obtained,
            "fecha_obtenido": obtained_date,
            "tipo_regla": definition.regla_tipo
        })
    
    return progress_list

def calculate_activity_points(actividad: ActividadCreate) -> int:
    """
    Calcula puntos basado en la actividad.
    Sistema de puntos:
    - 1 punto por cada 10 minutos de duración
    - 1 punto por cada km recorrido
    - Mínimo 1 punto por actividad
    """
    points = 0
    
    # Puntos por duración
    if actividad.duracion_min:
        points += actividad.duracion_min // 10
    
    # Puntos por distancia
    if actividad.distancia_km:
        points += int(actividad.distancia_km)
    
    # Mínimo 1 punto
    return max(points, 1)


@router.get("/users/me")
async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security), db: Session = Depends(get_db)):
    """
    Obtiene la información del usuario actual basado en el token.
    """
    token = credentials.credentials
    try:
        # Decodificar el token para obtener el email del usuario
        payload = decode_access_token(token)
        email = payload.get("sub")
        
        if email is None:
            raise HTTPException(status_code=401, detail="Token inválido")
        
        # Buscar el usuario en la base de datos
        user = db.query(User).filter(User.correo == email).first()
        if user is None:
            raise HTTPException(status_code=404, detail="Usuario no encontrado")
        
        # Calcular puntos totales (suma de la cantidad de todos los puntos del usuario)
        puntos_sum = db.query(Puntos).filter(Puntos.id_usuario == user.id_usuario).all()
        total_puntos = sum(p.cantidad for p in puntos_sum) if puntos_sum else 0
        
        # Contar actividades totales del usuario
        total_actividades = db.query(Actividad).filter(Actividad.id_usuario == user.id_usuario).count()
        
        return {
            "id": user.id_usuario,
            "username": user.nombre,
            "email": user.correo,
            "password_hash": "",  # No devolver el hash por seguridad
            "is_verified": True,
            "puntos_totales": total_puntos,
            "total_actividades": total_actividades,
            "created_at": user.created_at.isoformat() if hasattr(user, 'created_at') else "",
            "updated_at": user.updated_at.isoformat() if hasattr(user, 'updated_at') else ""
        }
        
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expirado")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Token inválido")


@router.get("/users/ranking", tags=["Usuarios"])
async def get_users_ranking(limit: int = 10, db: Session = Depends(get_db)):
    """
    Obtiene el ranking de usuarios ordenados por puntos totales (top 10 por defecto)
    """
    # Obtener todos los usuarios con sus puntos totales calculados
    users = db.query(User).all()
    
    ranking_data = []
    
    for user in users:
        # Calcular puntos totales para cada usuario
        puntos_sum = db.query(Puntos).filter(Puntos.id_usuario == user.id_usuario).all()
        total_puntos = sum(p.cantidad for p in puntos_sum) if puntos_sum else 0
        
        # Contar actividades totales del usuario
        total_actividades = db.query(Actividad).filter(Actividad.id_usuario == user.id_usuario).count()
        
        ranking_data.append({
            "id": user.id_usuario,
            "username": user.nombre,
            "puntos_totales": total_puntos,
            "total_actividades": total_actividades,
            "avatar": user.nombre[0].upper() if user.nombre else "U"  # Primera letra como avatar
        })
    
    # Ordenar por puntos totales de mayor a menor
    ranking_data.sort(key=lambda x: x["puntos_totales"], reverse=True)
    
    # Agregar posición en el ranking
    for i, user_data in enumerate(ranking_data[:limit], 1):
        user_data["position"] = i
    
    return ranking_data[:limit]


@router.post("/simple-register")
async def simple_register(request: UserRegistrationRequest, db: Session = Depends(get_db)):
    """
    Registro simple sin verificación de email - Solo para desarrollo/testing
    """
    # Verificar si el usuario ya existe
    existing_user = db.query(User).filter(User.correo == request.email).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="El email ya está registrado")
    
    # Hash de la contraseña
    hashed_password = get_password_hash(request.password) if request.password else None
    
    # Crear usuario con los campos mínimos requeridos
    user = User(
        nombre=request.name or "Usuario",  # Usar 'name' del request como 'nombre'
        apellido=request.last_name or "",
        correo=request.email,
        contraseña=hashed_password,
        edad=request.edad,
        peso=request.peso,
        altura=request.altura,
        genero=request.genero,
        nivel_condicion_fisica=request.nivel_condicion_fisica,
        proveedor="local"
    )
    
    # Guardar en la base de datos
    db.add(user)
    db.commit()
    db.refresh(user)
    
    return {
        "status": "success", 
        "message": "Usuario registrado correctamente sin verificación de email",
        "user": {
            "id": user.id_usuario,
            "username": user.nombre,
            "email": user.correo,
            "puntos_totales": 0
        }
    }
