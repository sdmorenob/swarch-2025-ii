#!/usr/bin/env python3
"""
Metadata Service - Main Entry Point

This service enriches music track metadata using the Spotify API.
It communicates with the Music Service via gRPC.
"""

import asyncio
import logging
import sys
from pathlib import Path

# Add app directory to path
sys.path.insert(0, str(Path(__file__).parent))

from grpc_server import serve
from config import settings


def setup_logging():
    """Configure logging for the application."""
    log_level = getattr(logging, settings.log_level.upper(), logging.INFO)
    
    # Create formatter
    if settings.log_format == "json":
        try:
            import structlog
            
            structlog.configure(
                processors=[
                    structlog.stdlib.filter_by_level,
                    structlog.stdlib.add_logger_name,
                    structlog.stdlib.add_log_level,
                    structlog.stdlib.PositionalArgumentsFormatter(),
                    structlog.processors.TimeStamper(fmt="iso"),
                    structlog.processors.StackInfoRenderer(),
                    structlog.processors.format_exc_info,
                    structlog.processors.UnicodeDecoder(),
                    structlog.processors.JSONRenderer()
                ],
                wrapper_class=structlog.stdlib.BoundLogger,
                context_class=dict,
                logger_factory=structlog.stdlib.LoggerFactory(),
                cache_logger_on_first_use=True,
            )
            
            logging.basicConfig(
                format="%(message)s",
                stream=sys.stdout,
                level=log_level,
            )
        except ImportError:
            # Fallback to standard logging if structlog not available
            logging.basicConfig(
                level=log_level,
                format='{"timestamp":"%(asctime)s","level":"%(levelname)s","name":"%(name)s","message":"%(message)s"}',
                datefmt="%Y-%m-%dT%H:%M:%S",
                stream=sys.stdout
            )
    else:
        # Text format
        logging.basicConfig(
            level=log_level,
            format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
            datefmt='%Y-%m-%d %H:%M:%S',
            stream=sys.stdout
        )
    
    # Set log level for noisy libraries
    logging.getLogger('urllib3').setLevel(logging.WARNING)
    logging.getLogger('spotipy').setLevel(logging.WARNING)
    
    return logging.getLogger(__name__)


async def check_configuration(logger):
    """Validate configuration before starting."""
    logger.info("Validating configuration...")
    
    errors = []
    
    # Check Spotify credentials
    if not settings.validate_spotify_credentials():
        errors.append("Spotify credentials (SPOTIFY_CLIENT_ID and SPOTIFY_CLIENT_SECRET) not configured")
    
    # Warn about cache
    if settings.cache_enabled and not settings.redis_url:
        logger.info("Using in-memory cache (recommended for single instance)")
    elif settings.cache_enabled and settings.redis_url:
        logger.info(f"Redis cache configured: {settings.redis_url}")
    else:
        logger.warning("Cache disabled - all requests will hit Spotify API")
    
    # Check rate limiting
    if settings.spotify_requests_per_second > 100:
        logger.warning(
            f"High rate limit configured ({settings.spotify_requests_per_second}/s). "
            "This may cause Spotify API rate limiting."
        )
    
    if errors:
        for error in errors:
            logger.error(f"Configuration error: {error}")
        return False
    
    logger.info("Configuration validated successfully")
    return True


def print_startup_banner(logger):
    """Print service startup information."""
    banner = f"""
╔══════════════════════════════════════════════════════════════╗
║              METADATA SERVICE                                 ║
║              Version: 1.0.0                                   ║
╚══════════════════════════════════════════════════════════════╝

Configuration:
  Environment:     {settings.environment}
  gRPC Address:    {settings.grpc_address}
  Log Level:       {settings.log_level}
  Cache:           {'Enabled (Redis)' if settings.cache_enabled and settings.redis_url else 'In-Memory' if settings.cache_enabled else 'Disabled'}
  Spotify Market:  {settings.spotify_market}
  Rate Limit:      {settings.spotify_requests_per_second} requests/second
  Match Threshold: {settings.fuzzy_matching_threshold}
    """
    
    for line in banner.split('\n'):
        logger.info(line)


async def main():
    """Main entry point for the application."""
    # Setup logging
    logger = setup_logging()
    
    try:
        # Print startup banner
        print_startup_banner(logger)
        
        # Validate configuration
        if not await check_configuration(logger):
            logger.error("Configuration validation failed. Exiting.")
            sys.exit(1)
        
        # Start gRPC server
        logger.info("Starting Metadata Service...")
        await serve()
        
    except KeyboardInterrupt:
        logger.info("Received shutdown signal")
    except Exception as e:
        logger.error(f"Fatal error: {e}", exc_info=True)
        sys.exit(1)
    finally:
        logger.info("Metadata Service shutdown complete")


if __name__ == '__main__':
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        print("\nShutdown complete")
        sys.exit(0)