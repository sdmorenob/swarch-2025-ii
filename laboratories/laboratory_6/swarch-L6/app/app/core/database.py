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
    pool_size=60,  # Increase base pool size
    max_overflow=90,  # Allow more temporary connections
    pool_timeout=30,  # Wait longer before timing out
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