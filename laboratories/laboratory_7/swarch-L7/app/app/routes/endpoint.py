import time
from datetime import datetime, timedelta

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.core.database import get_db
from app.models.Transaction import Transaction

router = APIRouter()

# Caché simple en memoria
_cache = {"data": None, "timestamp": None, "ttl": 60}


# Endpoint optimizado
@router.get("/metrics")
def metrics(db: Session = Depends(get_db)):
    start_time = time.time()
    
    # Verificar caché
    if _cache["data"] and _cache["timestamp"]:
        age = (datetime.utcnow() - _cache["timestamp"]).total_seconds()
        if age < _cache["ttl"]:
            # Retornar desde caché
            duration = time.time() - start_time
            return {
                "db_stats": _cache["data"],
                "duration_seconds": round(duration, 4),
                "cache_hit": True
            }
    
    # Query optimizada: solo últimos 30 días
    thirty_days_ago = datetime.utcnow() - timedelta(days=30)
    
    stats = db.query(
        func.count(Transaction.id).label("count"),
        func.avg(Transaction.amount).label("average"),
        func.sum(Transaction.amount).label("total"),
        func.max(Transaction.amount).label("max"),
        func.min(Transaction.amount).label("min")
    ).filter(
        Transaction.timestamp >= thirty_days_ago
    ).one()
    
    # Actualizar caché
    _cache["data"] = {
        "total_transactions": stats.count,
        "average_amount": float(stats.average) if stats.average else 0,
        "total_amount": float(stats.total) if stats.total else 0,
        "max_amount": float(stats.max) if stats.max else 0,
        "min_amount": float(stats.min) if stats.min else 0,
        "period": "last_30_days"
    }
    _cache["timestamp"] = datetime.utcnow()
    
    duration = time.time() - start_time
    
    return {
        "db_stats": _cache["data"],
        "duration_seconds": round(duration, 4),
        "cache_hit": False
    }