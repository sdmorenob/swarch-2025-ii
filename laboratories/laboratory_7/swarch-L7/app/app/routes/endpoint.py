import math
import time

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.core.database import get_db
from app.models.Transaction import Transaction

router = APIRouter()


# Expensive endpoint
@router.get("/metrics")
def metrics(db: Session = Depends(get_db)):

    start_time = time.time()

    # Expensive DB query: aggregate over large table
    stats = db.query(
        func.count(Transaction.id).label("count"),
        func.avg(Transaction.amount).label("average"),
        func.sum(Transaction.amount).label("total"),
        func.max(Transaction.amount).label("max"),
        func.min(Transaction.amount).label("min")
    ).one()

    duration = time.time() - start_time

    return {
        "db_stats": {
            "total_transactions": stats.count,
            "average_amount": stats.average,
            "total_amount": stats.total,
            "max_amount": stats.max,
            "min_amount": stats.min
        },
        "duration_seconds": round(duration, 2)
    }