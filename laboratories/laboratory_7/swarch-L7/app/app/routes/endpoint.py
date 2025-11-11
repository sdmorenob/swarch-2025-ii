import math
import time
import random

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

    matrix_load_test(random.randint(3, 200))

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


def generate_matrix(rows, cols):
    return [[random.randint(1, 100) for _ in range(cols)] for _ in range(rows)]


def multiply_matrices(A, B):
    result = [[0 for _ in range(len(B[0]))] for _ in range(len(A))]
    for i in range(len(A)):
        for j in range(len(B[0])):
            for k in range(len(B)):
                result[i][j] += A[i][k] * B[k][j]
    return result


def matrix_load_test(size=3000):
    A = generate_matrix(size, size)
    B = generate_matrix(size, size)
    C = multiply_matrices(A, B)