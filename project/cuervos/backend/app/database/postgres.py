"""
Configuración de SQLAlchemy para PostgreSQL.

Incluye:
- `engine`: conexión a la BD
- `SessionLocal`: fábrica de sesiones
- `Base`: clase base para modelos declarativos
- `create_tables()` y `drop_tables()` para gestionar el esquema (prototipo)
- `get_db()`: dependencia de FastAPI que entrega una sesión y la cierra al finalizar
"""

from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from app.core.config import settings

# Create engine
engine = create_engine(settings.postgres_url)

# Create session
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Create base class
Base = declarative_base()

def create_tables():
    """Crea todas las tablas definidas en los modelos declarativos.

    Nota: en producción se recomienda usar Alembic; esto es para un prototipo.
    """
    # Importa todos los modelos para que queden registrados en Base.metadata
    from app.models.postgres_models import User, Task, Category, Tag, task_tags
    
    # Crea todas las tablas
    Base.metadata.create_all(bind=engine)
    print("✅ All database tables created successfully")

def drop_tables():
    """Elimina todas las tablas (uso peligroso)."""
    # Importa todos los modelos para estar seguro que están registrados
    from app.models.postgres_models import User, Task, Category, Tag, task_tags
    
    # Elimina todas las tablas
    Base.metadata.drop_all(bind=engine)
    print("⚠️  All database tables dropped")

# Dependency to get database session
def get_db():
    """Provee una sesión de BD para rutas FastAPI y garantiza su cierre."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()