# services/gamification-service/app/api/endpoints.py

from fastapi import APIRouter, Depends, HTTPException
from motor.motor_asyncio import AsyncIOMotorDatabase
from typing import List
from datetime import datetime

from app.db.session import get_database
from app.db.models import ProcessActivityRequest, AchievementProgressResponse
from app.services.achievements import check_and_award_achievements

router = APIRouter()

@router.post("/process-activity")
async def process_activity(request: ProcessActivityRequest, db: AsyncIOMotorDatabase = Depends(get_database)):
    """
    Recibe una actividad, calcula puntos y verifica logros.
    """
    # 1. Almacenar la actividad para el seguimiento de logros de distancia/conteo
    await db["actividades"].insert_one({
        "id_usuario": request.user_id,
        "tipo": request.tipo,
        "distancia_km": request.distancia_km,
        "duracion_min": request.duracion_min,
        "fecha": request.fecha
    })

    # 2. Calcular los puntos (asegurando que los valores sean flotantes)
    points = (float(request.distancia_km) * 10) + float(request.duracion_min)

    # 3. Guardar los puntos en la colección "puntos"
    await db["puntos"].insert_one({
        "cantidad": points,
        "id_usuario": request.user_id,
        "fecha_obtencion": datetime.utcnow()
    })

    # 4. Llamar a la lógica de verificación de logros
    await check_and_award_achievements(db=db, user_id=request.user_id)

    return {"status": "success", "message": "Activity processed"}

# ... (el resto de tus endpoints se mantienen igual)

# --- FUNCIÓN CORREGIDA ---
@router.get("/users/{user_id}/achievements-progress", response_model=List[AchievementProgressResponse])
async def get_user_achievements_progress(user_id: int, db: AsyncIOMotorDatabase = Depends(get_database)):
    definitions_cursor = db["logros_definiciones"].find()
    user_achievements_cursor = db["logros"].find({"id_usuario": user_id})
    
    all_definitions = await definitions_cursor.to_list(length=100)
    user_achievements = await user_achievements_cursor.to_list(length=100)
    
    obtained_map = {ach["nombre"]: ach["fecha_obtencion"] for ach in user_achievements}

    # --- Calcula el progreso para TODOS los tipos de logros ---
    # Distancia
    pipeline_dist = [
        {"$match": {"id_usuario": user_id}},
        {"$group": {"_id": "$id_usuario", "total": {"$sum": "$distancia_km"}}}
    ]
    total_dist_result = await db["actividades"].aggregate(pipeline_dist).to_list(length=1)
    total_distance = total_dist_result[0]["total"] if total_dist_result else 0
    
    # Conteo de Actividades
    total_activities = await db["actividades"].count_documents({"id_usuario": user_id})

    # Puntos
    pipeline_points = [
        {"$match": {"id_usuario": user_id}},
        {"$group": {"_id": "$id_usuario", "total": {"$sum": "$cantidad"}}}
    ]
    total_points_result = await db["puntos"].aggregate(pipeline_points).to_list(length=1)
    total_points = total_points_result[0]["total"] if total_points_result else 0


    progress_list = []
    for definition in all_definitions:
        current_progress = 0
        rule_type = definition.get("regla_tipo", "") # Usamos .get para evitar errores
        
        # Asigna el progreso actual según el tipo de regla
        if rule_type == "SUMA_DISTANCIA":
            current_progress = total_distance
        elif rule_type == "CONTEO_ACTIVIDADES":
            current_progress = total_activities
        elif rule_type == "TOTAL_PUNTOS":  # <-- ESTA LÓGICA FALTABA
            current_progress = total_points
        
        meta = definition["regla_valor"]
        percentage = min(100, (current_progress / meta) * 100 if meta > 0 else 0)
        is_obtained = definition["nombre"] in obtained_map

        progress_list.append({
            "id": str(definition["_id"]), 
            "nombre": definition["nombre"],
            "descripcion": definition["descripcion"],
            "meta": meta,
            "progreso_actual": current_progress,
            "porcentaje_completado": percentage,
            "obtenido": is_obtained,
            "fecha_obtenido": obtained_map.get(definition["nombre"]),
            "tipo_regla": definition["regla_tipo"]
        })
        
    return progress_list

# --- ENDPOINT DE RANKING SIMPLIFICADO ---
@router.get("/users/ranking")
async def get_users_ranking(limit: int = 10, db: AsyncIOMotorDatabase = Depends(get_database)):
    pipeline = [
        {"$group": {"_id": "$id_usuario", "puntos_totales": {"$sum": "$cantidad"}}},
        {"$sort": {"puntos_totales": -1}},
        {"$limit": limit},
        {"$project": {"user_id": "$_id", "puntos_totales": 1, "_id": 0}}
    ]
    
    ranking_cursor = db["puntos"].aggregate(pipeline)
    ranking_data = await ranking_cursor.to_list(length=limit)

    # Nota: Este ranking ahora solo devuelve user_id. El frontend tendría que
    # buscar los nombres de usuario si fuera necesario.
    return [{"position": i + 1, **data} for i, data in enumerate(ranking_data)]


@router.post("/initialize-achievements")
async def initialize_default_achievements(db: AsyncIOMotorDatabase = Depends(get_database)):
    # Borramos las definiciones viejas para empezar de cero
    await db["logros_definiciones"].delete_many({})

    # Nuevas definiciones de logros basadas en PUNTOS TOTALES
    default_achievements = [
        {
            "nombre": "Principiante Entusiasta",
            "descripcion": "Acumula 100 puntos",
            "regla_tipo": "TOTAL_PUNTOS",  # Nueva regla
            "regla_valor": 100
        },
        {
            "nombre": "Atleta Constante",
            "descripcion": "Acumula 500 puntos",
            "regla_tipo": "TOTAL_PUNTOS",
            "regla_valor": 500
        },
        {
            "nombre": "Atleta de Élite",
            "descripcion": "Alcanza la increíble suma de 1,000 puntos",
            "regla_tipo": "TOTAL_PUNTOS",
            "regla_valor": 100000
        }
        
    ]

    result = await db["logros_definiciones"].insert_many(default_achievements)
    return {"message": f"Se crearon {len(result.inserted_ids)} definiciones de logros basadas en puntos"}

@router.get("/users/{user_id}/points")
async def get_user_total_points(user_id: int, db: AsyncIOMotorDatabase = Depends(get_database)):
    """
    Calcula y devuelve la suma total de puntos para un usuario específico.
    """
    pipeline = [
        {"$match": {"id_usuario": user_id}},
        {"$group": {"_id": "$id_usuario", "puntos_totales": {"$sum": "$cantidad"}}}
    ]

    result_cursor = db["puntos"].aggregate(pipeline)
    result = await result_cursor.to_list(length=1)

    if not result:
        # Si el usuario no tiene puntos, devolvemos 0
        return {"user_id": user_id, "puntos_totales": 0}

    # MongoDB devuelve un número que puede ser int o float, lo aseguramos como float
    puntos_totales = float(result[0].get("puntos_totales", 0))

    return {"user_id": user_id, "puntos_totales": puntos_totales}