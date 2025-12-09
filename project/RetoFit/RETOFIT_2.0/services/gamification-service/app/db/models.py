# services/gamification-service/app/db/models.py

from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime

# --- MODELO CORRECTO Y DEFINITIVO ---
# Esta es la plantilla que DEBE coincidir con lo que envía el servicio de Go.
# Acepta todos los campos de la actividad.
class ProcessActivityRequest(BaseModel):
    user_id: int
    tipo: str
    distancia_km: float
    duracion_min: int
    fecha: datetime

# Este modelo es para las respuestas al frontend y está correcto.
class AchievementProgressResponse(BaseModel):
    id: str
    nombre: str
    descripcion: str
    meta: float
    progreso_actual: float
    porcentaje_completado: float
    obtenido: bool
    fecha_obtenido: Optional[datetime] = None
    tipo_regla: str