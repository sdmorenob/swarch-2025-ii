from fastapi import FastAPI, Request, Response
from .db import engine, Base
from .routers.tags import router as tags_router, internal_router as internal_tags_router
from prometheus_client import Counter, Histogram, CONTENT_TYPE_LATEST, generate_latest

app = FastAPI(title="Tags Service")

REQUEST_COUNTER = Counter(
    "tags_requests_total",
    "Total de solicitudes",
    ["method", "endpoint", "status"]
)

REQUEST_DURATION = Histogram(
    "tags_request_duration_seconds",
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

# Include routers
app.include_router(tags_router)
app.include_router(internal_tags_router)

# Create tables on startup
@app.on_event("startup")
def on_startup():
    Base.metadata.create_all(bind=engine)