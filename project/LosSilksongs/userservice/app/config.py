# compatibility for pydantic v1 & v2
try:
    from pydantic_settings import BaseSettings, SettingsConfigDict
except Exception:
    from pydantic import BaseSettings
    SettingsConfigDict = None

class Settings(BaseSettings):
    POSTGRES_USER: str = "music_user"
    POSTGRES_PASSWORD: str = "music_pass"
    POSTGRES_DB: str = "music_db"
    POSTGRES_HOST: str = "postgres"
    POSTGRES_PORT: int = 5432

    SECRET_KEY: str
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24  # 1 día
    ALGORITHM: str = "HS256"

    if SettingsConfigDict:
        model_config = SettingsConfigDict(env_file=".env", extra="ignore")
    else:
        class Config:
            env_file = ".env"
            extra = "ignore"

settings = Settings()