from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .database import engine, Base
from .routers import auth_router, users_router
from fastapi.middleware.cors import CORSMiddleware
from . import models

app = FastAPI(title="Users Service - MusicShare",
              version="1.0.0", 
              description="Service for user management in MusicShare application.",
              root_path="/api/users")

origins = [
    "http://localhost:3000",  # frontend
    "http://localhost:5173",  # opcional
]

app.add_middleware(
    CORSMiddleware,
    allow_origins= origins,   # ["*"] para permitir todos
    allow_credentials=True,
    allow_methods=["GET","POST","PUT","PATCH","DELETE","OPTIONS"],
    allow_headers=["*"],
)

# Crear tablas al iniciar la aplicación
@app.on_event("startup")
def on_startup():
    print("Creating database tables...")
    Base.metadata.create_all(bind=engine)
    print("Database tables created successfully!")

app.include_router(auth_router.router)
app.include_router(users_router.router)

@app.get("/health")
def health():
    return {"status": "ok"}