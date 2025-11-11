from fastapi import APIRouter, Depends, HTTPException, status, Header
from sqlalchemy.orm import Session
from sqlalchemy import select

from ..db import get_db
from ..models import User
from ..schemas import UserCreate, UserLogin, UserRead, Token
from ..security import verify_password, hash_password, create_access_token, decode_access_token

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/register", response_model=UserRead, status_code=status.HTTP_201_CREATED)
def register(payload: UserCreate, db: Session = Depends(get_db)):
    existing = db.execute(select(User).where(User.email == payload.email)).scalar_one_or_none()
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    user = User(email=payload.email, hashed_password=hash_password(payload.password))
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


@router.post("/login", response_model=Token)
def login(payload: UserLogin, db: Session = Depends(get_db)):
    user = db.execute(select(User).where(User.email == payload.email)).scalar_one_or_none()
    if not user or not verify_password(payload.password, user.hashed_password):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")
    # Incluir email en el token para que el gateway pueda inyectarlo hacia servicios dependientes
    token = create_access_token({"sub": str(user.id), "email": user.email})
    return Token(access_token=token)


@router.get("/me", response_model=UserRead)
def me(authorization: str | None = Header(default=None), db: Session = Depends(get_db)):
    if not authorization or not authorization.lower().startswith("bearer "):
        raise HTTPException(status_code=401, detail="Missing bearer token")
    token = authorization.split(" ", 1)[1]
    payload = decode_access_token(token)
    if not payload or "sub" not in payload:
        raise HTTPException(status_code=401, detail="Invalid token")
    user = db.get(User, int(payload["sub"]))
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user


@router.post("/refresh", response_model=Token)
def refresh_token(authorization: str | None = Header(default=None), db: Session = Depends(get_db)):
    """Renovar token de acceso"""
    if not authorization or not authorization.lower().startswith("bearer "):
        raise HTTPException(status_code=401, detail="Missing bearer token")
    
    token = authorization.split(" ", 1)[1]
    payload = decode_access_token(token)
    if not payload or "sub" not in payload:
        raise HTTPException(status_code=401, detail="Invalid token")
    
    # Verificar que el usuario existe
    user = db.get(User, int(payload["sub"]))
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Crear nuevo token con la misma información del usuario
    new_token = create_access_token({"sub": str(user.id), "email": user.email})
    return Token(access_token=new_token)


@router.post("/logout")
def logout():
    """Cerrar sesión (logout)"""
    # En una implementación JWT stateless, el logout se maneja en el cliente
    # eliminando el token. Aquí podríamos implementar una blacklist de tokens
    # si fuera necesario, pero por simplicidad retornamos éxito.
    return {"message": "Successfully logged out"}