import os

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base

DB_USERNAME = os.getenv("DB_USERNAME", "app")
DB_PASSWORD = os.getenv("DB_PASSWORD", "123")
DB_HOSTNAME = os.getenv("DB_HOSTNAME", "localhost")
DB_DATABASE = os.getenv("DB_DATABASE", "performance_db")

DATABASE_READ_URL = f"mysql+pymysql://{DB_USERNAME}:{DB_PASSWORD}@{DB_HOSTNAME}:6447/{DB_DATABASE}"
DATABASE_WRITE_URL = f"mysql+pymysql://{DB_USERNAME}:{DB_PASSWORD}@{DB_HOSTNAME}:6446/{DB_DATABASE}"

read_engine = create_engine(
    DATABASE_READ_URL,
    pool_size=60,  # Increase base pool size
    max_overflow=90,  # Allow more temporary connections
    pool_timeout=30,  # Wait longer before timing out
    pool_pre_ping=True
)

write_engine = create_engine(
    DATABASE_WRITE_URL,
    pool_size=60,  # Increase base pool size
    max_overflow=90,  # Allow more temporary connections
    pool_timeout=30,  # Wait longer before timing out
    pool_pre_ping=True
)

ReadSessionLocal = sessionmaker(bind=read_engine, autoflush=False, autocommit=False)
WriteSessionLocal = sessionmaker(bind=write_engine, autoflush=False, autocommit=False)
Base = declarative_base()


def get_read_db():
    db = ReadSessionLocal()
    try:
        yield db
    finally:
        db.close()


def get_write_db():
    db = WriteSessionLocal()
    try:
        yield db
    finally:
        db.close()