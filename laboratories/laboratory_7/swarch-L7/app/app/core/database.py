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
    pool_size=10,              # Reducido de 60
    max_overflow=20,           # Reducido de 90
    pool_timeout=30,
    pool_pre_ping=True,
    pool_recycle=3600,         # Nuevo: recicla conexiones cada hora
)

SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False)
Base = declarative_base()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()