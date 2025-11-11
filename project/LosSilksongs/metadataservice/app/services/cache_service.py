import json
import logging
from typing import Optional, Dict, Any
from datetime import timedelta

# Redis is optional - will use in-memory cache if not available
try:
    import redis.asyncio as redis
    REDIS_AVAILABLE = True
except ImportError:
    REDIS_AVAILABLE = False
    redis = None  # Prevent undefined variable

from config import settings

logger = logging.getLogger(__name__)


class CacheService:
    """Service for caching metadata results (in-memory by default)."""
    
    def __init__(self):
        # Check if Redis should be used
        self.use_redis = (
            settings.cache_enabled and 
            settings.redis_url is not None and 
            settings.redis_url.strip() != "" and
            REDIS_AVAILABLE
        )
        
        self.ttl = settings.cache_ttl
        self._client: Optional[redis.Redis] = None
        self._in_memory_cache: Dict[str, Any] = {}
        
        if self.use_redis:
            self._init_redis()
        else:
            if settings.redis_url:
                logger.warning(
                    "Redis URL configured but redis package not available. "
                    "Using in-memory cache instead."
                )
            else:
                logger.info("Using in-memory cache (Redis not configured)")
    
    def _init_redis(self):
        """Initialize Redis client."""
        try:
            self._client = redis.from_url(
                settings.redis_url,
                encoding="utf-8",
                decode_responses=True,
                socket_connect_timeout=5,
                socket_keepalive=True
            )
            logger.info(f"Redis cache initialized: {settings.redis_url}")
        except Exception as e:
            logger.error(f"Failed to initialize Redis: {e}")
            logger.info("Falling back to in-memory cache")
            self.use_redis = False
            self._client = None
    
    async def get(self, key: str) -> Optional[Dict[str, Any]]:
        """Get value from cache."""
        if not self.use_redis:
            return self._in_memory_cache.get(key)
        
        try:
            value = await self._client.get(key)
            if value:
                return json.loads(value)
            return None
        except Exception as e:
            logger.error(f"Cache get error for key {key}: {e}")
            return None
    
    async def set(
        self, 
        key: str, 
        value: Dict[str, Any], 
        ttl: Optional[int] = None
    ) -> bool:
        """Set value in cache."""
        if not self.use_redis:
            self._in_memory_cache[key] = value
            return True
        
        try:
            ttl = ttl or self.ttl
            serialized = json.dumps(value)
            await self._client.setex(key, ttl, serialized)
            return True
        except Exception as e:
            logger.error(f"Cache set error for key {key}: {e}")
            return False
    
    async def delete(self, key: str) -> bool:
        """Delete value from cache."""
        if not self.use_redis:
            self._in_memory_cache.pop(key, None)
            return True
        
        try:
            await self._client.delete(key)
            return True
        except Exception as e:
            logger.error(f"Cache delete error for key {key}: {e}")
            return False
    
    async def clear(self) -> bool:
        """Clear all cache."""
        if not self.use_redis:
            self._in_memory_cache.clear()
            return True
        
        try:
            await self._client.flushdb()
            return True
        except Exception as e:
            logger.error(f"Cache clear error: {e}")
            return False
    
    async def close(self):
        """Close Redis connection."""
        if self._client:
            try:
                await self._client.close()
                logger.info("Redis connection closed")
            except Exception as e:
                logger.error(f"Error closing Redis connection: {e}")
    
    def generate_cache_key(
        self, 
        title: str, 
        artist: str, 
        album: Optional[str] = None
    ) -> str:
        """Generate cache key from track information."""
        # Normalize for consistent keys
        title = title.lower().strip()
        artist = artist.lower().strip()
        album = album.lower().strip() if album else ""
        
        return f"track:{title}:{artist}:{album}"


# Singleton instance
_cache_service: Optional[CacheService] = None


def get_cache_service() -> CacheService:
    """Get or create cache service instance."""
    global _cache_service
    if _cache_service is None:
        _cache_service = CacheService()
    return _cache_service
