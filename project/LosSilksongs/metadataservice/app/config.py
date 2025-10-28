from pydantic_settings import BaseSettings
from typing import Optional
from functools import lru_cache
import os


class Settings(BaseSettings):
    """Configuration settings for Metadata Service."""
    
    # Application
    app_name: str = "metadata-service"
    environment: str = "development"
    debug: bool = False
    
    # gRPC Server
    grpc_host: str = "0.0.0.0"
    grpc_port: int = 50051
    grpc_max_workers: int = 10
    grpc_max_concurrent_rpcs: Optional[int] = None
    
    # Spotify API
    spotify_client_id: str
    spotify_client_secret: str
    spotify_market: str = "US"
    
    # Cache (opcional - deja vacío para usar in-memory cache)
    redis_url: Optional[str] = None
    cache_enabled: bool = True  # true = in-memory, true + redis_url = Redis
    cache_ttl: int = 3600  # 1 hora
    
    # Rate limiting
    spotify_requests_per_second: int = 10
    max_batch_size: int = 50
    request_timeout: int = 30  # segundos
    
    # Matching
    fuzzy_matching_threshold: float = 0.8
    title_weight: float = 0.5
    artist_weight: float = 0.4
    album_weight: float = 0.1
    
    # Logging
    log_level: str = "INFO"
    log_format: str = "json"  # "json" or "text"
    
    # Retry policy
    max_retries: int = 3
    retry_delay: float = 1.0  # segundos
    
    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        case_sensitive = False

    def validate_spotify_credentials(self) -> bool:
        """Validate that Spotify credentials are set."""
        return bool(self.spotify_client_id and self.spotify_client_secret)

    @property
    def is_production(self) -> bool:
        """Check if running in production."""
        return self.environment.lower() == "production"

    @property
    def grpc_address(self) -> str:
        """Get full gRPC address."""
        return f"{self.grpc_host}:{self.grpc_port}"


@lru_cache()
def get_settings() -> Settings:
    """Get cached settings instance."""
    return Settings()


# Global settings instance
settings = get_settings()