import os

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base

DB_USERNAME = os.getenv("DB_USERNAME", "app")
DB_PASSWORD = os.getenv("DB_PASSWORD", "123")
DB_HOSTNAME = os.getenv("DB_HOSTNAME", "localhost")
DB_DATABASE = os.getenv("DB_DATABASE", "performance_db")

DATABASE_URL = f"mysql+pymysql://{DB_USERNAME}:{DB_PASSWORD}@{DB_HOSTNAME}:3306/{DB_DATABASE}"

engine = create_engine(
    DATABASE_URL,
    # Adjusted pooling to a safer per-pod connection budget so the DB is not
    # overwhelmed when the `app` Deployment auto-scales. Calculate pool sizes
    # so `pool_size + max_overflow` stays within the DB `max_connections` / replicas.
    pool_size=15,
    max_overflow=6,
    pool_timeout=10,
    pool_pre_ping=True
)
SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False)
Base = declarative_base()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()