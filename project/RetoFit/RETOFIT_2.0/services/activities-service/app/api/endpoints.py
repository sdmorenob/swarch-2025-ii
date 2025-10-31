# app/api/endpoints.py

from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session
from typing import List
import httpx # Se usará para la comunicación entre servicios

from app.db.session import get_db
from app.db.models import Actividad, ActividadCreate, ActividadResponse, User

router = APIRouter()

# URL del servicio de gamificación (debería estar en una variable de entorno)
GAMIFICATION_SERVICE_URL = "http://gamification-service:8003" 

def calculate_activity_points(actividad: ActividadCreate) -> int:
    """
    Calcula puntos basado en la actividad.
    - 1 punto por cada 10 minutos de duración
    - 1 punto por cada km recorrido
    - Mínimo 1 punto por actividad
    """
    points = 0
    if actividad.duracion_min:
        points += actividad.duracion_min // 10
    if actividad.distancia_km:
        points += int(actividad.distancia_km)
    return max(points, 1)

@router.post("/users/{user_id}/activities", response_model=ActividadResponse, status_code=201)
async def create_activity_for_user(user_id: int, actividad: ActividadCreate, db: Session = Depends(get_db)):
    """
    Registra una nueva actividad para un usuario.
    """
    # Se podría verificar si el usuario existe haciendo una llamada al user-service, pero por simplicidad lo omitimos.
    
    new_activity = Actividad(**actividad.dict(), id_usuario=user_id)
    db.add(new_activity)
    db.commit()
    db.refresh(new_activity)

    # 1. Calcula los puntos para la actividad
    points = calculate_activity_points(actividad)

    # 2. Notifica al servicio de gamificación de forma asíncrona
    try:
        async with httpx.AsyncClient() as client:
            # Llama al gamification-service para añadir puntos y verificar logros
            await client.post(f"{GAMIFICATION_SERVICE_URL}/gamification/process-activity", json={
                "user_id": user_id,
                "points": points
            })
    except httpx.RequestError as e:
        # En un sistema real, aquí manejarías el error (e.g., reintentos, logs)
        print(f"Error al notificar al gamification-service: {e}")


    return new_activity

@router.get("/users/{user_id}/activities", response_model=List[ActividadResponse])
async def get_activities_by_user(user_id: int, db: Session = Depends(get_db)):
    """
    Obtiene todas las actividades de un usuario específico.
    """
    activities = db.query(Actividad).filter(Actividad.id_usuario == user_id).all()
    if not activities:
        # Es mejor devolver una lista vacía que un 404 si el usuario existe pero no tiene actividades
        return []
    return activities

@router.get("/activities", response_model=List[ActividadResponse])
async def get_all_activities(db: Session = Depends(get_db)):
    """
    Endpoint de administrador para obtener todas las actividades.
    """
    return db.query(Actividad).all()