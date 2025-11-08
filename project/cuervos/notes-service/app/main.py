import asyncio
from fastapi import FastAPI
from app.routers.notes import router as notes_router

app = FastAPI(title="Notes Service", version="0.1.0")

app.include_router(notes_router)

@app.get("/healthz")
def health():
    return {"ok": True}

@app.on_event("startup")
async def startup_event():
    """Inicia el servidor gRPC en paralelo con FastAPI"""
    from app.grpc.notes_search_server import serve_grpc
    asyncio.create_task(serve_grpc())