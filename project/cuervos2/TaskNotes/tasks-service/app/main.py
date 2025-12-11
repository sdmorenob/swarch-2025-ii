import threading
from fastapi import FastAPI, Request, Response
from prometheus_client import Counter, Histogram, CONTENT_TYPE_LATEST, generate_latest
from sqlalchemy import text
from app.routers.tasks import router as tasks_router
from app.database.postgres import Base, engine
from app.models.postgres_models import Task

app = FastAPI(title="Tasks Service", version="0.1.0")

REQUEST_COUNTER = Counter(
    "tasks_requests_total",
    "Total de solicitudes",
    ["method", "endpoint", "status"]
)

REQUEST_DURATION = Histogram(
    "tasks_request_duration_seconds",
    "Duración de solicitudes en segundos",
    ["method", "endpoint"]
)

@app.middleware("http")
async def prometheus_middleware(request: Request, call_next):
    endpoint = request.url.path
    method = request.method
    with REQUEST_DURATION.labels(method=method, endpoint=endpoint).time():
        response = await call_next(request)
    REQUEST_COUNTER.labels(method=method, endpoint=endpoint, status=str(response.status_code)).inc()
    return response

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

@app.get("/metrics")
def metrics():
    return Response(content=generate_latest(), media_type=CONTENT_TYPE_LATEST)