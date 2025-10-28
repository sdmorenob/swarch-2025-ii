# app/config.py


# compatibility for pydantic v1 & v2
try:
    # pydantic v2: BaseSettings moved to pydantic-settings
    from pydantic_settings import BaseSettings
except Exception:
    # fallback for pydantic v1
    from pydantic import BaseSettings
    

class Settings(BaseSettings):
    POSTGRES_USER: str = "music_user"
    POSTGRES_PASSWORD: str = "music_pass"
    POSTGRES_DB: str = "music_db"
    POSTGRES_HOST: str = "postgres"
    POSTGRES_PORT: int = 5432

    SECRET_KEY: str = "replace-this-secret"  # cambiar en prod
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24  # 1 día
    ALGORITHM: str = "HS256"

    MUSICSERVICE_URL: str = "http://musicservice:8080"  # endpoint para integrar playlists

    class Config:
        env_file = ".env"

settings = Settings()
