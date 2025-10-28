"""
Endpoints de autenticación y emisión de tokens.

Rutas:
- POST /register: crea usuario y retorna token + datos del usuario
- POST /login: autentica credenciales y retorna token + datos del usuario
- POST /refresh: emite nuevo token para usuario autenticado
"""

from datetime import timedelta
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session

from app.database.postgres import get_db
from app.models.postgres_models import User
from app.schemas.user_schemas import UserCreate, User as UserSchema, Token, UserLogin
from app.core.security import (
    verify_password,
    get_password_hash,
    create_access_token,
    get_current_active_user
)
from app.core.config import settings

router = APIRouter()

@router.post("/register", response_model=Token)
async def register(user_data: UserCreate, db: Session = Depends(get_db)):
    """Registra un nuevo usuario y retorna un token de acceso.

    - Valida que el email no exista
    - Hashea la contraseña
    - Crea el usuario y retorna un JWT + datos del usuario
    """
    # Check if user already exists
    db_user = db.query(User).filter(User.email == user_data.email).first()
    if db_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
    
    # Create new user
    hashed_password = get_password_hash(user_data.password)
    db_user = User(
        name=user_data.name,
        email=user_data.email,
        hashed_password=hashed_password
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    
    # Create access token
    access_token_expires = timedelta(minutes=settings.access_token_expire_minutes)
    access_token = create_access_token(
        data={"sub": db_user.email}, expires_delta=access_token_expires
    )
    
    user_schema = UserSchema.model_validate(db_user)
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": user_schema
    }

@router.post("/login", response_model=Token)
async def login(user_data: UserLogin, db: Session = Depends(get_db)):
    """Autentica credenciales y retorna un token de acceso."""
    # Authenticate user
    user = db.query(User).filter(User.email == user_data.email).first()
    if not user or not verify_password(user_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Create access token
    access_token_expires = timedelta(minutes=settings.access_token_expire_minutes)
    access_token = create_access_token(
        data={"sub": user.email}, expires_delta=access_token_expires
    )
    
    user_schema = UserSchema.from_orm(user)
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": user_schema
    }

@router.post("/refresh", response_model=Token)
async def refresh_token(current_user: User = Depends(get_current_active_user)):
    """Genera un nuevo token para el usuario autenticado."""
    # Create new access token
    access_token_expires = timedelta(minutes=settings.access_token_expire_minutes)
    access_token = create_access_token(
        data={"sub": current_user.email}, expires_delta=access_token_expires
    )
    
    user_schema = UserSchema.from_orm(current_user)
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": user_schema
    }