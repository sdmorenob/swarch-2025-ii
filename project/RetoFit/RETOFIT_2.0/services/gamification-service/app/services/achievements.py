# services/gamification-service/app/services/achievements.py

from motor.motor_asyncio import AsyncIOMotorDatabase
from datetime import datetime

async def check_and_award_achievements(db: AsyncIOMotorDatabase, user_id: int):
    """
    Verifica y otorga logros a un usuario basado en su progreso total 
    (puntos, distancia y número de actividades).
    """
    # 1. Obtener los logros que el usuario ya ha ganado para no volver a darlos
    user_achievements_cursor = db["logros"].find({"id_usuario": user_id})
    user_achievements_list = await user_achievements_cursor.to_list(length=100)
    achieved_names = {logro["nombre"] for logro in user_achievements_list}

    # 2. Obtener las definiciones de TODOS los logros que el usuario aún no tiene
    definitions_cursor = db["logros_definiciones"].find({"nombre": {"$nin": list(achieved_names)}})
    definitions = await definitions_cursor.to_list(length=100)
    
    if not definitions:
        # Si no hay nuevos logros por ganar, no hacemos nada más
        return

    # 3. Calcular los totales del usuario
    # Total de Puntos
    pipeline_points = [
        {"$match": {"id_usuario": user_id}},
        {"$group": {"_id": "$id_usuario", "total": {"$sum": "$cantidad"}}}
    ]
    total_points_result = await db["puntos"].aggregate(pipeline_points).to_list(length=1)
    total_points = total_points_result[0]["total"] if total_points_result else 0

    # Total de Distancia
    pipeline_dist = [
        {"$match": {"id_usuario": user_id}},
        {"$group": {"_id": "$id_usuario", "total": {"$sum": "$distancia_km"}}}
    ]
    total_dist_result = await db["actividades"].aggregate(pipeline_dist).to_list(length=1)
    total_distance = total_dist_result[0]["total"] if total_dist_result else 0

    # Conteo total de actividades
    total_activities = await db["actividades"].count_documents({"id_usuario": user_id})

    # 4. Iterar sobre los logros PENDIENTES y otorgarlos si se cumple la condición
    for definition in definitions:
        should_award = False
        rule_type = definition.get("regla_tipo")
        rule_value = definition.get("regla_valor")

        if rule_type == "TOTAL_PUNTOS" and total_points >= rule_value:
            should_award = True
        elif rule_type == "SUMA_DISTANCIA" and total_distance >= rule_value:
            should_award = True
        elif rule_type == "CONTEO_ACTIVIDADES" and total_activities >= rule_value:
            should_award = True

        if should_award:
            await db["logros"].insert_one({
                "nombre": definition["nombre"],
                "descripcion": definition["descripcion"],
                "id_usuario": user_id,
                "fecha_obtencion": datetime.utcnow()
            })