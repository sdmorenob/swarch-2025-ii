from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import AnyUrl, Field
from typing import Optional

class Settings(BaseSettings):
    # Database URLs
    postgres_url: str = "postgresql://user:password@postgres:5432/tasknotes"
    mongodb_url: str = "mongodb://admin:password@mongodb:27017/tasknotes?authSource=admin"
    mongodb_db_name: str = "tasknotes"
    
    # JWT Settings
    secret_key: str = "your-secret-key-here-change-in-production"
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 30
    
    # API Settings
    api_v1_str: str = "/api/v1"
    project_name: str = "TaskNotes"
    
    # CORS Settings
    backend_cors_origins: list = ["http://localhost:3000", "http://frontend:80"]

    # Search Service Settings
    search_service_url: AnyUrl = Field(..., alias="SEARCH_SERVICE_URL")

    model_config = SettingsConfigDict(env_file=".env", extra="forbid")
    
    
    # class Config:
    #     env_file = ".env"

settings = Settings()