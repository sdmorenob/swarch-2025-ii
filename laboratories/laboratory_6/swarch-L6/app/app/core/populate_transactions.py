import random

from datetime import datetime as dt, timedelta as td
from app.core.database import SessionLocal, Base, engine
from app.models.Transaction import Transaction

Base.metadata.create_all(bind=engine)

# Data generation
def generate_transactions(n=1_000_000):
    db = SessionLocal()
    batch_size = 10_000
    now = dt.utcnow()

    for i in range(0, n, batch_size):
        batch = []
        for _ in range(batch_size):
            amount = round(random.uniform(1.0, 1000.0), 2)
            timestamp = now - td(days=random.randint(0, 365))
            batch.append(Transaction(amount=amount, timestamp=timestamp))
        db.bulk_save_objects(batch)
        db.commit()
        print(f"Inserted {i + batch_size} records")

    db.close()