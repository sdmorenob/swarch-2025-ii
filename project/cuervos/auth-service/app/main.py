from fastapi import FastAPI
from .db import engine, Base
from .routers import auth
from .security import get_jwks

app = FastAPI(title="Auth Service")

@app.on_event("startup")
def on_startup():
    Base.metadata.create_all(bind=engine)

@app.get("/healthz")
def healthz():
    return {"ok": True}

@app.get("/.well-known/jwks.json")
def jwks():
    return get_jwks()

app.include_router(auth.router)