"""
Punto de entrada de la aplicación FastAPI.

Responsabilidades:
- Configurar el ciclo de vida (lifespan) para conectar/desconectar MongoDB
- Configurar CORS
- Incluir routers (auth, users, tasks, notes, categories, tags)
- Envolver la app con Socket.IO (ASGIApp)

Rutas auxiliares:
- GET /               -> mensaje de estado
- GET /health         -> chequeo de salud
"""

from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer
import socketio
from contextlib import asynccontextmanager
import os

from app.database.postgres import engine, Base
from app.database.mongodb import mongodb
from app.routers import auth, tasks, notes, users, categories, tags
from app.core.config import settings
from app.websocket import sio

# Database initialization is now handled by init_db.py script
# This ensures proper startup order and error handling

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Gestiona el ciclo de vida de la app.

    - Startup: abre conexión a MongoDB
    - Shutdown: cierra conexión
    """
    # Startup
    await mongodb.connect()
    yield
    # Shutdown
    await mongodb.disconnect()

# Create FastAPI app
app = FastAPI(
    title="TaskNotes API",
    description="API para sistema de gestión de tareas y notas personales",
    version="1.0.0",
    lifespan=lifespan
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.backend_cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth.router, prefix="/api/v1/auth", tags=["authentication"])
app.include_router(users.router, prefix="/api/v1/users", tags=["users"])
app.include_router(tasks.router, prefix="/api/v1/tasks", tags=["tasks"])
app.include_router(notes.router, prefix="/api/v1/notes", tags=["notes"])
app.include_router(categories.router, prefix="/api/v1/categories", tags=["categories"])
app.include_router(tags.router, prefix="/api/v1/tags", tags=["tags"])

# Mount Socket.IO
socket_app = socketio.ASGIApp(sio, app)


@app.get("/")
async def root():
    return {"message": "TaskNotes API is running"}

@app.get("/health")
async def health_check():
    return {"status": "healthy", "service": "TaskNotes API"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(socket_app, host="0.0.0.0", port=8000, reload=True)