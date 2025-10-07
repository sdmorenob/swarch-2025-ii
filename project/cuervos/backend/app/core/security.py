"""
Utilidades de seguridad para autenticación y autorización.

Incluye:
- Hashing y verificación de contraseñas usando bcrypt vía passlib
- Creación y verificación de JWT
- Dependencias de FastAPI para obtener el usuario actual autenticado

Funciones clave:
- verify_password(plain_password, hashed_password): valida una contraseña con su hash
- get_password_hash(password): genera hash seguro para almacenar en BD
- create_access_token(data, expires_delta): emite un JWT con expiración
- get_current_user(credentials, db): obtiene el `User` autenticado desde el token
- get_current_active_user(current_user): valida que el usuario esté activo
"""

from datetime import datetime, timedelta
from typing import Optional
from jose import JWTError, jwt
from passlib.context import CryptContext
from fastapi import HTTPException, status, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session

from app.core.config import settings
from app.database.postgres import get_db
from app.models.postgres_models import User

# Password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# JWT token security
security = HTTPBearer()

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verifica que `plain_password` coincida con `hashed_password`.

    Uso: se utiliza durante el login para autenticar al usuario.
    """
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password: str) -> str:
    """Genera un hash seguro para `password` usando bcrypt.

    Uso: se utiliza al registrar usuarios o al cambiar la contraseña para
    persistir el hash en la base de datos (no la contraseña en claro).
    """
    return pwd_context.hash(password)

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    """Crea un JWT firmado con `settings.secret_key`.

    - `data`: payload con, por ejemplo, `{"sub": email}`
    - `expires_delta`: timedelta opcional para personalizar la expiración

    Retorna el token codificado (string).
    """
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=settings.access_token_expire_minutes)
    
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, settings.secret_key, algorithm=settings.algorithm)
    return encoded_jwt

def verify_token(token: str) -> Optional[str]:
    """Valida un token JWT y retorna el `email` (sub) si es válido.

    Retorna None si la verificación falla.
    """
    try:
        payload = jwt.decode(token, settings.secret_key, algorithms=[settings.algorithm])
        email: str = payload.get("sub")
        if email is None:
            return None
        return email
    except JWTError:
        return None

def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db)
) -> User:
    """Dependencia de FastAPI que retorna el `User` autenticado.

    - Extrae el token Bearer del header Authorization
    - Verifica el token y obtiene el email (`sub`)
    - Busca y retorna el usuario en la BD
    - Lanza 401 si algo falla
    """
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    token = credentials.credentials
    email = verify_token(token)
    if email is None:
        raise credentials_exception
    
    user = db.query(User).filter(User.email == email).first()
    if user is None:
        raise credentials_exception
    
    return user

def get_current_active_user(current_user: User = Depends(get_current_user)) -> User:
    """Valida que el usuario actual esté activo (is_active=True)."""
    if not current_user.is_active:
        raise HTTPException(status_code=400, detail="Inactive user")
    return current_user