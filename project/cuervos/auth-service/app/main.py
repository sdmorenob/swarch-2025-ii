from fastapi import FastAPI, Request, Response
from .db import engine, Base
from .routers import auth
from .security import get_jwks
from prometheus_client import Counter, Histogram, CONTENT_TYPE_LATEST, generate_latest

app = FastAPI(title="Auth Service")

REQUEST_COUNTER = Counter(
    "auth_requests_total",
    "Total de solicitudes",
    ["method", "endpoint", "status"]
)

REQUEST_DURATION = Histogram(
    "auth_request_duration_seconds",
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
    Base.metadata.create_all(bind=engine)

@app.get("/healthz")
def healthz():
    return {"ok": True}

@app.get("/metrics")
def metrics():
    return Response(content=generate_latest(), media_type=CONTENT_TYPE_LATEST)

@app.get("/.well-known/jwks.json")
def jwks():
    return get_jwks()

app.include_router(auth.router)