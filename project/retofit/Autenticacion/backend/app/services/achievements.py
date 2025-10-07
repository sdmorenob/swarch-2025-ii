# app/services/achievements.py

from sqlalchemy.orm import Session
from sqlalchemy import func
from app.db.models import Actividad, Logro, LogroDefinicion

def check_and_award_achievements(db: Session, user_id: int):
    definitions = db.query(LogroDefinicion).all()
    user_achievements = db.query(Logro).filter(Logro.id_usuario == user_id).all()
    achieved_names = {logro.nombre for logro in user_achievements}

    for definition in definitions:
        if definition.nombre in achieved_names:
            continue

        achievement_earned = False
        
        # --- Lógica de evaluación de reglas ---
        if definition.regla_tipo == "SUMA_DISTANCIA":
            # Suma todas las distancias de las actividades del usuario
            total_distance = db.query(func.sum(Actividad.distancia_km)).filter(Actividad.id_usuario == user_id).scalar() or 0
            if total_distance >= definition.regla_valor:
                achievement_earned = True

        elif definition.regla_tipo == "CONTEO_ACTIVIDADES":
            # Cuenta todas las actividades del usuario
            total_activities = db.query(func.count(Actividad.id_actividad)).filter(Actividad.id_usuario == user_id).scalar() or 0
            if total_activities >= definition.regla_valor:
                achievement_earned = True
        
        # ... aquí podrías agregar más 'elif' para otros tipos de reglas (ej. "MAX_DISTANCIA_UNICA")

        # 3. Si se ganó un logro, se lo asignamos
        if achievement_earned:
            new_logro = Logro(
                nombre=definition.nombre,
                descripcion=definition.descripcion,
                id_usuario=user_id
            )
            db.add(new_logro)

    # Guardamos los cambios al final
    db.commit()