# app/db/models.py

from sqlalchemy import Column, Integer, String, Float
from .session import Base
from pydantic import BaseModel, Field
from typing import Optional

class User(Base):
    __tablename__ = 'usuario'
    
    # Mantenemos todos los campos del perfil
    id_usuario = Column(Integer, primary_key=True, index=True)
    nombre = Column(String, index=True, nullable=False)
    apellido = Column(String, index=True, nullable=True)
    correo = Column(String, unique=True, index=True, nullable=False) # El correo sigue siendo el identificador único
    edad = Column(Integer, nullable=True)
    peso = Column(Float, nullable=True)
    altura = Column(Float, nullable=True)
    genero = Column(String, nullable=True)
    nivel_condicion_fisica = Column(String, nullable=True)
    foto_perfil_url = Column(String, nullable=True)
    deportes_favoritos = Column(String, nullable=True)

class UserUpdateRequest(BaseModel):
    nombre: Optional[str] = None
    apellido: Optional[str] = None
    edad: Optional[int] = None
    peso: Optional[float] = None
    altura: Optional[float] = None
    genero: Optional[str] = None
    nivel_condicion_fisica: Optional[str] = None
    deportes_favoritos: Optional[str] = None

class UserProfileResponse(BaseModel):
    id: int = Field(..., alias='id_usuario')
    username: str = Field(..., alias='nombre')
    lastname: Optional[str] = Field(None, alias='apellido')
    email: str = Field(..., alias='correo')
    age: Optional[int] = Field(None, alias='edad')
    weight: Optional[float] = Field(None, alias='peso')
    height: Optional[float] = Field(None, alias='altura')
    gender: Optional[str] = Field(None, alias='genero')
    fitness_level: Optional[str] = Field(None, alias='nivel_condicion_fisica')
    foto_perfil_url: Optional[str] = Field(None, alias='foto_perfil_url')
    deportes_favoritos: Optional[str] = Field(None, alias='deportes_favoritos')
    # Se eliminan los puntos y actividades, ya que se obtendrán del gamification-service

    class Config:
        from_attributes = True