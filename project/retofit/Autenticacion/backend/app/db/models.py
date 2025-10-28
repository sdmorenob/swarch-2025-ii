from sqlalchemy import Column, Integer, String, DateTime, Boolean,Float
from sqlalchemy.sql import func
from .session import Base
from pydantic import BaseModel, EmailStr
from typing import Optional, List
from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, DateTime, Float, ForeignKey
from sqlalchemy.orm import relationship # Asegúrate de importar relationship
from sqlalchemy.sql import func
from .session import Base
from sqlalchemy.orm import relationship

class EmailCheckRequest(BaseModel):
    email: EmailStr

class EmailVerificationRequest(BaseModel):
    email: EmailStr
    code: str

class UserRegistrationRequest(BaseModel):
    name: str
    last_name: Optional[str] = None
    email: EmailStr
    password: Optional[str] = None
    edad: Optional[int] = None
    peso: Optional[float] = None
    altura: Optional[float] = None
    genero: Optional[str] = None
    nivel_condicion_fisica: Optional[str] = None
    provider: str = "local"  # por defecto local




class User(Base):
    __tablename__ = 'usuario'

    id_usuario = Column(Integer, primary_key=True, index=True)
    nombre = Column(String, index=True, nullable=False)
    apellido = Column(String, index=True, nullable=True)      
    edad = Column(Integer, nullable=True)
    peso = Column(Float, nullable=True)
    altura = Column(Float, nullable=True)
    genero = Column(String, nullable=True)
    nivel_condicion_fisica = Column(String, nullable=True)
    correo = Column(String, unique=True, index=True, nullable=False)
    contraseña = Column(String, nullable=True)
    proveedor = Column(String, nullable=True, default='local')
    TFA_enabled = Column(Boolean, nullable=False, default=False)
    puntos = relationship("Puntos", back_populates="propietario")
    logros = relationship("Logro", back_populates="propietario")
    actividades = relationship("Actividad", back_populates="propietario")



class VerificationCode(Base):
    __tablename__ = 'codigos'

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, index=True, nullable=False)
    codigo = Column(String, nullable=False)
    expiracion = Column(DateTime, nullable=False)


class LoginRequest(BaseModel):
    email: EmailStr
    password: Optional[str] = None
    name: Optional[str] = None


class ForgotPasswordRequest(BaseModel):
    email: EmailStr


class ResetPasswordRequest(BaseModel):
    token: str
    new_password: str

class Puntos(Base):
    __tablename__ = 'puntos'

    id_puntos = Column(Integer, primary_key=True, index=True)
    cantidad = Column(Integer, nullable=False)
    fecha_obtencion = Column(DateTime(timezone=True), server_default=func.now())
    
    # Llave foránea para relacionar con el usuario
    id_usuario = Column(Integer, ForeignKey('usuario.id_usuario'), nullable=False)
    
    # Relación para poder acceder desde el usuario a sus puntos (ej: usuario.puntos)
    propietario = relationship("User", back_populates="puntos")


class Logro(Base):
    __tablename__ = 'logros'

    id_logro = Column(Integer, primary_key=True, index=True)
    nombre = Column(String, nullable=False)
    descripcion = Column(String, nullable=True)
    fecha_obtencion = Column(DateTime(timezone=True), server_default=func.now())

    # Llave foránea para relacionar con el usuario
    id_usuario = Column(Integer, ForeignKey('usuario.id_usuario'), nullable=False)

    # Relación para poder acceder desde el usuario a sus logros (ej: usuario.logros)
    propietario = relationship("User", back_populates="logros")    

class PuntosBase(BaseModel):
    cantidad: int

class PuntosCreate(PuntosBase):
    pass

class PuntosResponse(PuntosBase):
    id_puntos: int
    fecha_obtencion: datetime

    class Config:
         from_attributes = True # Permite que Pydantic lea datos de objetos SQLAlchemy

# --- Schemas para Logros ---

class LogroBase(BaseModel):
    nombre: str
    descripcion: str | None = None # Usamos | None para que sea opcional

class LogroCreate(LogroBase):
    pass

class LogroResponse(LogroBase):
    id_logro: int
    fecha_obtencion: datetime

    class Config:
         from_attributes = True


class Actividad(Base):
    __tablename__ = 'actividades'

    id_actividad = Column(Integer, primary_key=True)
    tipo = Column(String, nullable=False)  # Ej: "carrera", "gimnasio", "ciclismo"
    distancia_km = Column(Float, nullable=True)
    duracion_min = Column(Integer, nullable=True)
    fecha = Column(DateTime(timezone=True), server_default=func.now())
    
    id_usuario = Column(Integer, ForeignKey('usuario.id_usuario'), nullable=False)
    propietario = relationship("User", back_populates="actividades")

class LogroDefinicion(Base):
    __tablename__ = 'logros_definiciones'

    id_definicion = Column(Integer, primary_key=True)
    nombre = Column(String, unique=True, nullable=False)
    descripcion = Column(String, nullable=False)
    
    # El tipo de regla que nuestro "motor" sabrá interpretar
    regla_tipo = Column(String, nullable=False) # Ej: "SUMA_DISTANCIA", "CONTEO_ACTIVIDADES"
    
    # El valor a alcanzar para cumplir la regla
    regla_valor = Column(Float, nullable=False)

class ActividadCreate(BaseModel):
    tipo: str
    distancia_km: float | None = None
    duracion_min: int | None = None

class ActividadResponse(ActividadCreate):
    id_actividad: int
    fecha: datetime

    class Config:
        from_attributes = True