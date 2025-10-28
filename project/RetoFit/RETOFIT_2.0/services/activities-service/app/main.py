# app/main.py

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.endpoints import router as activities_router
from app.db.session import engine, Base

Base.metadata.create_all(bind=engine)

app = FastAPI(title="Activities Service")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(activities_router, prefix="/activities", tags=["Activities"])

@app.get("/")
def read_root():
    return {"message": "Welcome to the Activities Service"}