# app/db/models.py

from sqlalchemy import Column, Integer, String, DateTime, Float, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from .session import Base
from pydantic import BaseModel
from typing import Optional
from datetime import datetime

# Modelo de usuario simplificado para mantener la relación.
# En una base de datos real por microservicio, solo necesitarías el id_usuario.
class User(Base):
    __tablename__ = 'usuario'
    id_usuario = Column(Integer, primary_key=True)
    actividades = relationship("Actividad", back_populates="propietario")

class Actividad(Base):
    __tablename__ = 'actividades'

    id_actividad = Column(Integer, primary_key=True)
    tipo = Column(String, nullable=False)
    distancia_km = Column(Float, nullable=True)
    duracion_min = Column(Integer, nullable=True)
    fecha = Column(DateTime(timezone=True), server_default=func.now())
    
    id_usuario = Column(Integer, ForeignKey('usuario.id_usuario'), nullable=False)
    propietario = relationship("User", back_populates="actividades")

# --- Schemas de Pydantic para la validación de datos ---

class ActividadCreate(BaseModel):
    tipo: str
    distancia_km: Optional[float] = None
    duracion_min: Optional[int] = None

class ActividadResponse(ActividadCreate):
    id_actividad: int
    fecha: datetime
    id_usuario: int

    class Config:
        from_attributes = True