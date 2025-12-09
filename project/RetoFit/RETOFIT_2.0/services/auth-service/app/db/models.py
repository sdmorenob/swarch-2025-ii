# app/db/models.py

from sqlalchemy import Column, Integer, String, DateTime, func
from datetime import datetime
from .session import Base
from pydantic import BaseModel, EmailStr, Field
from typing import Optional

class EmailCheckRequest(BaseModel):
    email: EmailStr

class EmailVerificationRequest(BaseModel):
    email: EmailStr
    code: str

class UserRegistrationRequest(BaseModel):
    id_usuario: Optional[int] = Field(None, alias='id_usuario') # Añadido para las respuestas
    name: str = Field(..., alias='nombre')
    last_name: Optional[str] = Field(None, alias='apellido')
    email: EmailStr = Field(..., alias='correo')
    password: Optional[str] = None
    provider: Optional[str] = Field("local", alias='proveedor')
    rol: Optional[str] = Field("user", alias='rol')
    fecha_creacion: Optional[datetime] = Field(None, alias='fecha_creacion')
    

    class Config:
        from_attributes = True
        populate_by_name = True # Permite usar tanto 'email' como 'correo'

class User(Base):
    __tablename__ = 'usuario'

    id_usuario = Column(Integer, primary_key=True, index=True)
    nombre = Column(String, index=True, nullable=False)
    apellido = Column(String, index=True, nullable=True)
    correo = Column(String, unique=True, index=True, nullable=False)
    contraseña = Column(String, nullable=True)
    proveedor = Column(String, nullable=True, default='local')
    id_proveedor = Column(String, nullable=True, unique=True)
    rol = Column(String, nullable=False, default='user')
    fecha_creacion = Column(DateTime(timezone=True), server_default=func.now())
    # Se eliminan relaciones y campos que irán en otros servicios

class VerificationCode(Base):
    __tablename__ = 'codigos'

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, index=True, nullable=False)
    codigo = Column(String, nullable=False)
    expiracion = Column(DateTime(timezone=True), nullable=False)

class LoginRequest(BaseModel):
    email: EmailStr
    password: Optional[str] = None
    name: Optional[str] = None

class SocialLoginRequest(BaseModel):
    name: str
    email: EmailStr
    provider: str
    provider_id: str
    
class ForgotPasswordRequest(BaseModel):
    email: EmailStr

class ResetPasswordRequest(BaseModel):
    token: str
    new_password: str

class UserStatusUpdate(BaseModel):
    status: str = Field(..., pattern="^(active|suspended)$")