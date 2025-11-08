# app/main.py

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
# Importamos los objetos 'router' directamente desde cada módulo
from app.api.endpoints import router as auth_router
from app.api.admin import router as admin_auth_router
from app.db.session import engine, Base

Base.metadata.create_all(bind=engine)

app = FastAPI(title="Auth Service")

app.add_middleware(
    CORSMiddleware, 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router, prefix="/auth", tags=["Authentication"])
app.include_router(admin_auth_router, prefix="/admin", tags=["Auth Admin"])

@app.get("/")
def read_root():
    return {"message": "Welcome to the Auth Service"}