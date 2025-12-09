from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func, case
from typing import List, Optional

from ..db.session import get_db
from ..db.models import User
# Importamos el esquema de respuesta definido en nuestro propio servicio.
from ..db.models import UserProfileResponse as UserAdminResponseSchema

router = APIRouter()

@router.get("/users", response_model=List[UserAdminResponseSchema])
def get_all_users(db: Session = Depends(get_db), skip: int = 0, limit: int = 100):
    """
    Obtiene una lista de todos los usuarios.
    Endpoint para ser consumido por el admin-service.
    """
    users = db.query(User).offset(skip).limit(limit).all()
    # Construir la respuesta explícitamente para asegurar que los alias de Pydantic se apliquen.
    # FastAPI no aplica los alias automáticamente al devolver objetos de SQLAlchemy directamente.
    return [
        UserAdminResponseSchema.from_orm(user) for user in users
    ]

@router.get("/users/stats")
def get_user_stats(db: Session = Depends(get_db)):
    """Obtiene el conteo total de perfiles de usuario."""
    total_users = db.query(func.count(User.id_usuario)).scalar()

    return {"total_users": total_users}

@router.get("/analytics/users")
def get_user_analytics(db: Session = Depends(get_db)):
    """
    Obtiene analíticas agregadas sobre los datos físicos de los usuarios.
    """
    # 1. Distribución de Género
    gender_distribution = db.query(
        User.genero,
        func.count(User.id_usuario)
    ).filter(User.genero.isnot(None)).group_by(User.genero).all()

    # 2. Distribución de Nivel de Condición Física
    fitness_level_distribution = db.query(
        User.nivel_condicion_fisica,
        func.count(User.id_usuario)
    ).filter(User.nivel_condicion_fisica.isnot(None)).group_by(User.nivel_condicion_fisica).all()

    # 3. Estadísticas de Edad, Peso y Altura (promedios)
    avg_stats = db.query(
        func.avg(User.edad).label('avg_age'),
        func.avg(User.peso).label('avg_weight'),
        func.avg(User.altura).label('avg_height')
    ).one()

    # 4. Top 5 Deportes Favoritos
    # Esta es una aproximación simple. Una solución más robusta requeriría normalizar los datos.
    top_sports = db.query(
        User.deportes_favoritos,
        func.count(User.id_usuario).label('count')
    ).filter(User.deportes_favoritos.isnot(None)).group_by(User.deportes_favoritos).order_by(func.count(User.id_usuario).desc()).limit(5).all()

    return {
        "gender_distribution": {gender: count for gender, count in gender_distribution},
        "fitness_level_distribution": {level: count for level, count in fitness_level_distribution},
        "average_stats": {
            "age": round(avg_stats.avg_age, 1) if avg_stats.avg_age else 0,
            "weight": round(avg_stats.avg_weight, 1) if avg_stats.avg_weight else 0,
            "height": round(avg_stats.avg_height, 2) if avg_stats.avg_height else 0,
        },
        "top_sports": {sport: count for sport, count in top_sports}
    }

@router.delete("/users/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_user(user_id: int, db: Session = Depends(get_db)):
    """
    Elimina un usuario de la base de datos.
    """
    user = db.query(User).filter(User.id_usuario == user_id).first()
    if not user:
        return
    db.delete(user)
    db.commit()
    return