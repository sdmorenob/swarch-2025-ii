from difflib import SequenceMatcher
from typing import Dict, List, Tuple
import re
import unicodedata

class MatchingService:
    def __init__(self, threshold: float = 0.8):
        self.threshold = threshold

    def calculate_match_confidence(
        self, 
        original_title: str, 
        original_artist: str,
        spotify_title: str, 
        spotify_artist: str,
        original_album: str = None,
        spotify_album: str = None
    ) -> float:
        """Calcula la confianza del match entre metadatos originales y Spotify."""
        
        # Normalizar strings
        orig_title_norm = self._normalize_string(original_title)
        orig_artist_norm = self._normalize_string(original_artist)
        spot_title_norm = self._normalize_string(spotify_title)
        spot_artist_norm = self._normalize_string(spotify_artist)
        
        # Calcular similitud de título (peso: 0.5)
        title_similarity = self._similarity(orig_title_norm, spot_title_norm)
        
        # Calcular similitud de artista (peso: 0.4)
        artist_similarity = self._similarity(orig_artist_norm, spot_artist_norm)
        
        # Calcular similitud de álbum (peso: 0.1)
        album_similarity = 1.0  # Default si no hay álbum
        if original_album and spotify_album:
            orig_album_norm = self._normalize_string(original_album)
            spot_album_norm = self._normalize_string(spotify_album)
            album_similarity = self._similarity(orig_album_norm, spot_album_norm)
        
        # Peso promedio
        confidence = (
            title_similarity * 0.5 +
            artist_similarity * 0.4 +
            album_similarity * 0.1
        )
        
        return confidence

    def _similarity(self, a: str, b: str) -> float:
        """Calcula similitud entre dos strings usando SequenceMatcher."""
        return SequenceMatcher(None, a, b).ratio()

    def _normalize_string(self, text: str) -> str:
        """Normaliza un string para comparación."""
        if not text:
            return ""
        
        # Convertir a lowercase
        text = text.lower()
        
        # Remover acentos
        text = unicodedata.normalize('NFKD', text)
        text = ''.join(c for c in text if not unicodedata.combining(c))
        
        # Remover caracteres especiales y espacios extra
        text = re.sub(r'[^\w\s]', '', text)
        text = re.sub(r'\s+', ' ', text).strip()
        
        # Remover palabras comunes que interfieren
        common_words = ['feat', 'ft', 'featuring', 'remix', 'remaster', 'remastered']
        words = text.split()
        words = [w for w in words if w not in common_words]
        
        return ' '.join(words)

    def is_good_match(self, confidence: float) -> bool:
        """Determina si el match es suficientemente bueno."""
        return confidence >= self.threshold