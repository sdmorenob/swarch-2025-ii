from fastapi import FastAPI
from .db import engine, Base
from .routers.tags import router as tags_router, internal_router as internal_tags_router

app = FastAPI(title="Tags Service")

@app.get("/healthz")
def health():
    return {"ok": True}

# Include routers
app.include_router(tags_router)
app.include_router(internal_tags_router)

# Create tables on startup
@app.on_event("startup")
def on_startup():
    Base.metadata.create_all(bind=engine)