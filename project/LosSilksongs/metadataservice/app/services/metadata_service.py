from typing import Optional, List, Dict, Any
import logging
from datetime import datetime

from services.spotify_client import SpotifyClient
from services.matching_service import MatchingService
from services.cache_service import get_cache_service
from config import settings

logger = logging.getLogger(__name__)


class MetadataService:
    """Main service for enriching track metadata."""
    
    def __init__(self):
        """Initialize metadata service with dependencies."""
        self.spotify_client = SpotifyClient()
        self.matching_service = MatchingService(
            threshold=settings.fuzzy_matching_threshold
        )
        self.cache_service = get_cache_service()
        logger.info("MetadataService initialized")

    async def enrich_track_metadata(
        self,
        title: str,
        artist: str,
        album: Optional[str] = None,
        duration: Optional[int] = None,
        genre_hint: Optional[str] = None
    ) -> Optional[Dict[str, Any]]:
        """
        Enrich track metadata using Spotify API.
        
        Args:
            title: Track title
            artist: Artist name
            album: Album name (optional)
            duration: Track duration in seconds (optional)
            genre_hint: Genre hint for better matching (optional)
            
        Returns:
            Dictionary with enriched metadata or None if no match found
        """
        # Input validation
        if not title or not artist:
            logger.warning("Title and artist are required for enrichment")
            return None
        
        # Generate cache key
        cache_key = self.cache_service.generate_cache_key(title, artist, album)
        
        # Try to get from cache
        cached_result = await self.cache_service.get(cache_key)
        if cached_result:
            logger.info(f"Cache hit for: {title} - {artist}")
            return cached_result

        try:
            # Search in Spotify
            logger.info(f"Enriching track: {title} - {artist}")
            spotify_data = await self.spotify_client.search_track(
                title, artist, album
            )
            
            if not spotify_data:
                logger.warning(f"No Spotify match found for: {title} - {artist}")
                return None

            # Calculate match confidence
            confidence = self.matching_service.calculate_match_confidence(
                original_title=title,
                original_artist=artist,
                spotify_title=spotify_data['title'],
                spotify_artist=spotify_data['artist'],
                original_album=album,
                spotify_album=spotify_data['album']
            )

            # Enrich with artist genres if not present
            if not spotify_data.get('genres'):
                genres = await self.spotify_client.get_artist_genres(
                    spotify_data['artist']
                )
                spotify_data['genres'] = genres

            # Add confidence and enrichment timestamp
            spotify_data['confidence'] = confidence
            spotify_data['enriched_at'] = datetime.utcnow().isoformat()

            # Only return if match is good enough
            if self.matching_service.is_good_match(confidence):
                # Cache the result
                await self.cache_service.set(cache_key, spotify_data)
                
                logger.info(
                    f"Successfully enriched: {title} - {artist} "
                    f"(confidence: {confidence:.2f})"
                )
                return spotify_data
            else:
                logger.warning(
                    f"Low confidence match ({confidence:.2f}) for: "
                    f"{title} - {artist}. Skipping."
                )
                return None

        except Exception as e:
            logger.error(f"Error enriching metadata for {title} - {artist}: {e}")
            return None

    async def batch_enrich_tracks(
        self, 
        tracks: List[Dict[str, Any]]
    ) -> List[Optional[Dict[str, Any]]]:
        """
        Process multiple tracks in batch.
        
        Args:
            tracks: List of track dictionaries with title, artist, etc.
            
        Returns:
            List of enriched metadata (None for failed tracks)
        """
        if not tracks:
            return []
        
        # Limit batch size
        if len(tracks) > settings.max_batch_size:
            logger.warning(
                f"Batch size {len(tracks)} exceeds maximum "
                f"{settings.max_batch_size}. Truncating."
            )
            tracks = tracks[:settings.max_batch_size]
        
        logger.info(f"Processing batch of {len(tracks)} tracks")
        
        results = []
        successful = 0
        failed = 0
        
        for idx, track_data in enumerate(tracks):
            try:
                result = await self.enrich_track_metadata(
                    title=track_data.get('title', ''),
                    artist=track_data.get('artist', ''),
                    album=track_data.get('album'),
                    duration=track_data.get('duration'),
                    genre_hint=track_data.get('genre_hint')
                )
                
                results.append(result)
                
                if result:
                    successful += 1
                else:
                    failed += 1
                    
            except Exception as e:
                logger.error(f"Error processing track {idx}: {e}")
                results.append(None)
                failed += 1
        
        logger.info(
            f"Batch processing complete: {successful} successful, "
            f"{failed} failed"
        )
        
        return results

    async def search_tracks(
        self,
        query: str,
        limit: int = 20,
        offset: int = 0
    ) -> Dict[str, Any]:
        """
        Search for tracks in Spotify.
        
        Args:
            query: Search query
            limit: Number of results to return
            offset: Offset for pagination
            
        Returns:
            Dictionary with search results and pagination info
        """
        try:
            # Respect rate limit
            await self.spotify_client._respect_rate_limit()
            
            results = self.spotify_client.client.search(
                q=query,
                type='track',
                limit=min(limit, 50),  # Spotify max is 50
                offset=offset,
                market=settings.spotify_market
            )
            
            tracks_data = results.get('tracks', {})
            items = tracks_data.get('items', [])
            
            formatted_tracks = [
                self.spotify_client._format_track_data(track)
                for track in items
            ]
            
            return {
                'tracks': formatted_tracks,
                'total': tracks_data.get('total', 0),
                'limit': limit,
                'offset': offset,
                'next': tracks_data.get('next'),
                'previous': tracks_data.get('previous')
            }
            
        except Exception as e:
            logger.error(f"Error searching tracks: {e}")
            return {
                'tracks': [],
                'total': 0,
                'limit': limit,
                'offset': offset,
                'error': str(e)
            }

    async def get_track_by_spotify_id(
        self, 
        spotify_id: str
    ) -> Optional[Dict[str, Any]]:
        """
        Get track metadata by Spotify ID.
        
        Args:
            spotify_id: Spotify track ID
            
        Returns:
            Dictionary with track metadata or None
        """
        try:
            track_data = await self.spotify_client.get_track_by_id(spotify_id)
            
            if track_data:
                # Enrich with genres
                if not track_data.get('genres'):
                    genres = await self.spotify_client.get_artist_genres(
                        track_data['artist']
                    )
                    track_data['genres'] = genres
                
                track_data['confidence'] = 1.0  # Direct ID lookup
                track_data['enriched_at'] = datetime.utcnow().isoformat()
            
            return track_data
            
        except Exception as e:
            logger.error(f"Error getting track by ID {spotify_id}: {e}")
            return None

    async def health_check(self) -> Dict[str, Any]:
        """
        Perform health check on the service.
        
        Returns:
            Dictionary with health status
        """
        health = {
            'service': 'metadata-service',
            'status': 'healthy',
            'timestamp': datetime.utcnow().isoformat(),
            'spotify_api': 'unknown',
            'cache': 'unknown'
        }
        
        # Check Spotify API
        try:
            spotify_healthy = await self.spotify_client.health_check()
            health['spotify_api'] = 'healthy' if spotify_healthy else 'unhealthy'
        except Exception as e:
            health['spotify_api'] = f'error: {str(e)}'
            health['status'] = 'degraded'
        
        # Check cache
        try:
            if self.cache_service.use_redis:
                # Test Redis cache
                test_key = '_health_check_'
                await self.cache_service.set(test_key, {'test': True}, ttl=10)
                result = await self.cache_service.get(test_key)
                await self.cache_service.delete(test_key)
                health['cache'] = 'healthy (redis)' if result else 'unhealthy (redis)'
            else:
                # In-memory cache is always available
                health['cache'] = 'in-memory (default)'
        except Exception as e:
            health['cache'] = f'error: {str(e)}'
        
        return health

    async def shutdown(self):
        """Cleanup resources on shutdown."""
        logger.info("Shutting down MetadataService...")
        try:
            await self.cache_service.close()
            logger.info("MetadataService shutdown complete")
        except Exception as e:
            logger.error(f"Error during shutdown: {e}")