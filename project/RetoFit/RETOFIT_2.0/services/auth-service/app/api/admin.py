from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func, text, or_
from typing import List, Dict, Any

from ..db.session import get_db
from ..db.models import User, UserStatusUpdate, UserRegistrationRequest

router = APIRouter()

@router.get("/users/roles", response_model=Dict[str, str])
def get_all_user_roles(db: Session = Depends(get_db)):
    """
    Obtiene un diccionario con el rol de cada usuario.
    Formato: { "email1@example.com": "user", "email2@example.com": "admin" }
    """
    users = db.query(User.correo, User.rol).all()
    return {email: role for email, role in users}

@router.get("/users", response_model=List[UserRegistrationRequest])
def get_all_auth_users(db: Session = Depends(get_db), skip: int = 0, limit: int = 100):
    """
    Obtiene una lista de todas las entradas de usuario de autenticación.
    Endpoint para ser consumido por el admin-service.
    """
    users = db.query(User).order_by(User.fecha_creacion.desc()).offset(skip).limit(limit).all()
    return users

@router.get("/users/stats")
def get_user_stats(db: Session = Depends(get_db)):
    """
    Obtiene estadísticas sobre los roles de los usuarios.
    - total_users: Conteo total de usuarios.
    - active_users: Usuarios no suspendidos.
    - suspended_users: Usuarios con rol 'suspended'.
    """
    # Contar solo usuarios "reales": aquellos con contraseña (registro local) o id_proveedor (login social).
    base_query = db.query(User).filter(or_(User.contraseña.isnot(None), User.id_proveedor.isnot(None)))

    total_users = base_query.count()
    
    active_users = base_query.filter(User.rol != 'suspended').count()
    suspended_users = base_query.filter(User.rol == 'suspended').count()

    return {
        "total_users": total_users,
        "active_users": active_users,
        "suspended_users": suspended_users,
    }

@router.patch("/users/{user_id}/status")
def update_user_status(user_id: int, status_update: UserStatusUpdate, db: Session = Depends(get_db)):
    """
    Actualiza el estado (rol) de un usuario.
    """
    user = db.query(User).filter(User.id_usuario == user_id).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Usuario no encontrado en el servicio de autenticación")

    new_role = "user" if status_update.status == "active" else "suspended"
    user.rol = new_role
    db.commit()
    db.refresh(user)
    return {"status": "success", "message": f"Rol del usuario actualizado a '{new_role}'"}

@router.delete("/users/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_auth_user(user_id: int, db: Session = Depends(get_db)):
    """
    Elimina un usuario del servicio de autenticación.
    """
    user = db.query(User).filter(User.id_usuario == user_id).first()
    if not user:
        # No se lanza error para que la operación sea idempotente
        return

    db.delete(user)
    db.commit()
    return

@router.get("/analytics/user-registrations")
def get_user_registrations_analytics(db: Session = Depends(get_db)) -> List[Dict[str, Any]]:
    """
    Obtiene el conteo de registros de usuarios por día en los últimos 30 días.
    """
    query = text("""
        SELECT DATE(fecha_creacion) as date, COUNT(id_usuario) as count
        FROM usuario
        WHERE fecha_creacion >= NOW() - INTERVAL '30 days'
        GROUP BY DATE(fecha_creacion)
        ORDER BY date ASC;
    """)
    result = db.execute(query).fetchall()
    # Convertir el resultado a un formato de diccionario JSON serializable
    return [{"date": row.date.isoformat(), "count": row.count} for row in result]