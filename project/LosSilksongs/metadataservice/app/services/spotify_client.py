import spotipy
from spotipy.oauth2 import SpotifyClientCredentials
from spotipy.exceptions import SpotifyException
from typing import Dict, List, Optional
import asyncio
import time
import logging
from functools import wraps

from config import settings

logger = logging.getLogger(__name__)


def retry_on_failure(max_retries: int = 3, delay: float = 1.0):
    """Decorator for retrying failed Spotify API calls."""
    def decorator(func):
        @wraps(func)
        async def wrapper(*args, **kwargs):
            last_exception = None
            for attempt in range(max_retries):
                try:
                    return await func(*args, **kwargs)
                except SpotifyException as e:
                    last_exception = e
                    if e.http_status == 429:  # Rate limit
                        retry_after = int(e.headers.get('Retry-After', delay))
                        logger.warning(
                            f"Rate limited. Retrying after {retry_after}s"
                        )
                        await asyncio.sleep(retry_after)
                    elif e.http_status >= 500:  # Server error
                        logger.warning(
                            f"Spotify server error (attempt {attempt + 1}/{max_retries})"
                        )
                        await asyncio.sleep(delay * (attempt + 1))
                    else:
                        # Client error, don't retry
                        raise
                except Exception as e:
                    last_exception = e
                    logger.error(f"Unexpected error in {func.__name__}: {e}")
                    await asyncio.sleep(delay)
            
            # All retries exhausted
            raise last_exception
        return wrapper
    return decorator


class SpotifyClient:
    """Client for interacting with Spotify API."""
    
    def __init__(self):
        """Initialize Spotify client with credentials."""
        if not settings.validate_spotify_credentials():
            raise ValueError("Spotify credentials not configured")
        
        try:
            auth_manager = SpotifyClientCredentials(
                client_id=settings.spotify_client_id,
                client_secret=settings.spotify_client_secret
            )
            self.client = spotipy.Spotify(auth_manager=auth_manager)
            self._last_request_time = 0
            self._rate_limit_delay = 1.0 / settings.spotify_requests_per_second
            
            logger.info("Spotify client initialized successfully")
        except Exception as e:
            logger.error(f"Failed to initialize Spotify client: {e}")
            raise

    @retry_on_failure(max_retries=settings.max_retries, delay=settings.retry_delay)
    async def search_track(
        self, 
        title: str, 
        artist: str, 
        album: Optional[str] = None
    ) -> Optional[Dict]:
        """
        Search for a track in Spotify and return the best match.
        
        Args:
            title: Track title
            artist: Artist name
            album: Album name (optional)
            
        Returns:
            Dictionary with track data or None if not found
        """
        await self._respect_rate_limit()
        
        # Exact search first
        query = f'track:"{title}" artist:"{artist}"'
        if album:
            query += f' album:"{album}"'
        
        logger.debug(f"Searching Spotify (exact): {query}")
        
        try:
            results = self.client.search(
                q=query,
                type='track',
                limit=10,
                market=settings.spotify_market
            )
            
            tracks = results.get('tracks', {}).get('items', [])
            
            if not tracks:
                # Flexible search without quotes
                query_flexible = f'{title} {artist}'
                if album:
                    query_flexible += f' {album}'
                
                logger.debug(f"Searching Spotify (flexible): {query_flexible}")
                
                results = self.client.search(
                    q=query_flexible,
                    type='track',
                    limit=10,
                    market=settings.spotify_market
                )
                tracks = results.get('tracks', {}).get('items', [])
            
            if tracks:
                best_track = tracks[0]
                logger.info(
                    f"Found match: {best_track['name']} by "
                    f"{best_track['artists'][0]['name']}"
                )
                return self._format_track_data(best_track)
            
            logger.info(f"No Spotify match found for: {title} - {artist}")
            return None
            
        except SpotifyException as e:
            logger.error(f"Spotify API error: {e}")
            raise
        except Exception as e:
            logger.error(f"Unexpected error in search_track: {e}")
            raise

    @retry_on_failure(max_retries=settings.max_retries, delay=settings.retry_delay)
    async def get_artist_genres(self, artist_name: str) -> List[str]:
        """
        Get genres associated with an artist.
        
        Args:
            artist_name: Name of the artist
            
        Returns:
            List of genre strings
        """
        await self._respect_rate_limit()
        
        try:
            results = self.client.search(
                q=f'artist:"{artist_name}"',
                type='artist',
                limit=1
            )
            
            artists = results.get('artists', {}).get('items', [])
            if artists:
                genres = artists[0].get('genres', [])
                logger.debug(f"Genres for {artist_name}: {genres}")
                return genres
            
            return []
            
        except Exception as e:
            logger.error(f"Error getting artist genres: {e}")
            return []

    @retry_on_failure(max_retries=settings.max_retries, delay=settings.retry_delay)
    async def get_track_by_id(self, spotify_id: str) -> Optional[Dict]:
        """
        Get track information by Spotify ID.
        
        Args:
            spotify_id: Spotify track ID
            
        Returns:
            Dictionary with track data or None
        """
        await self._respect_rate_limit()
        
        try:
            track = self.client.track(spotify_id)
            if track:
                return self._format_track_data(track)
            return None
        except Exception as e:
            logger.error(f"Error getting track by ID {spotify_id}: {e}")
            return None

    def _format_track_data(self, track_data: Dict) -> Dict:
        """
        Convert Spotify track data to internal format.
        
        Args:
            track_data: Raw Spotify track data
            
        Returns:
            Formatted track dictionary
        """
        artists = [artist['name'] for artist in track_data.get('artists', [])]
        album = track_data.get('album', {})
        
        return {
            'spotify_id': track_data.get('id', ''),
            'title': track_data.get('name', ''),
            'artist': artists[0] if artists else 'Unknown',
            'artists': artists,
            'album': album.get('name', ''),
            'genres': [],  # Will be populated from artist
            'release_date': album.get('release_date', ''),
            'album_art_url': self._get_album_art(album),
            'preview_url': track_data.get('preview_url', ''),
            'duration_ms': track_data.get('duration_ms', 0),
            'popularity': track_data.get('popularity', 0),
            'external_url': track_data.get('external_urls', {}).get('spotify', ''),
            'album_type': album.get('album_type', ''),
            'track_number': track_data.get('track_number', 0),
            'disc_number': track_data.get('disc_number', 1),
            'explicit': track_data.get('explicit', False),
            'isrc': track_data.get('external_ids', {}).get('isrc', '')
        }

    def _get_album_art(self, album_data: Dict) -> str:
        """
        Extract album art URL from album data.
        
        Args:
            album_data: Album information from Spotify
            
        Returns:
            URL of album art or empty string
        """
        images = album_data.get('images', [])
        if images:
            # Prefer medium size (300px) if available
            for img in images:
                if img.get('height') == 300:
                    return img.get('url', '')
            # Otherwise return first image
            return images[0].get('url', '')
        return ""

    async def _respect_rate_limit(self):
        """Implement basic rate limiting."""
        current_time = time.time()
        time_since_last = current_time - self._last_request_time
        
        if time_since_last < self._rate_limit_delay:
            sleep_time = self._rate_limit_delay - time_since_last
            await asyncio.sleep(sleep_time)
        
        self._last_request_time = time.time()

    async def health_check(self) -> bool:
        """Check if Spotify API is accessible."""
        try:
            await self._respect_rate_limit()
            # Simple search to test connectivity
            self.client.search(q='test', type='track', limit=1)
            return True
        except Exception as e:
            logger.error(f"Spotify health check failed: {e}")
            return False