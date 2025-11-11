import threading
from fastapi import FastAPI
from sqlalchemy import text
from app.routers.tasks import router as tasks_router
from app.database.postgres import Base, engine
from app.models.postgres_models import Task

app = FastAPI(title="Tasks Service", version="0.1.0")

@app.on_event("startup")
def on_startup():
    # Crear tablas necesarias (solo tasks)
    Base.metadata.create_all(bind=engine)
    # Asegurar que no haya FK y que exista tag_ids
    with engine.connect() as conn:
        conn.execute(text("ALTER TABLE IF EXISTS tasks DROP CONSTRAINT IF EXISTS tasks_category_id_fkey"))
        conn.execute(text("ALTER TABLE IF EXISTS tasks ADD COLUMN IF NOT EXISTS tag_ids INTEGER[]"))
        conn.commit()
    
    # Iniciar servidor gRPC en un hilo separado
    from app.grpc.tasks_search_server import serve_grpc
    grpc_thread = threading.Thread(target=serve_grpc, daemon=True)
    grpc_thread.start()

app.include_router(tasks_router)

@app.get("/healthz")
def health():
    return {"ok": True}