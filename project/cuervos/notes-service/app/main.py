import asyncio
from fastapi import FastAPI, Request, Response
from prometheus_client import Counter, Histogram, CONTENT_TYPE_LATEST, generate_latest
from app.routers.notes import router as notes_router

app = FastAPI(title="Notes Service", version="0.1.0")

app.include_router(notes_router)

REQUEST_COUNTER = Counter(
    "notes_requests_total",
    "Total de solicitudes",
    ["method", "endpoint", "status"]
)

REQUEST_DURATION = Histogram(
    "notes_request_duration_seconds",
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

@app.get("/healthz")
def health():
    return {"ok": True}

@app.get("/metrics")
def metrics():
    return Response(content=generate_latest(), media_type=CONTENT_TYPE_LATEST)

@app.on_event("startup")
async def startup_event():
    """Inicia el servidor gRPC en paralelo con FastAPI"""
    from app.grpc.notes_search_server import serve_grpc
    asyncio.create_task(serve_grpc())