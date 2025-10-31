# app/main.py

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.endpoints import router as gamification_router
# Removed: from app.db.session import engine, Base

# Removed: Base.metadata.create_all(bind=engine)

app = FastAPI(title="Gamification Service")

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(gamification_router, prefix="/gamification", tags=["Gamification"])

@app.get("/")
def read_root():
    return {"message": "Welcome to the Gamification Service"}