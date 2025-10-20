package models

// MetadataRequest represents a request to enrich track metadata
type MetadataRequest struct {
	Title     string `json:"title"`
	Artist    string `json:"artist"`
	Album     string `json:"album"`
	Duration  int    `json:"duration,omitempty"`
	GenreHint string `json:"genre_hint,omitempty"`
}

// MetadataResponse represents the response from metadata enrichment
type MetadataResponse struct {
	Success bool             `json:"success"`
	Data    *SpotifyMetadata `json:"data,omitempty"`
	Error   string           `json:"error,omitempty"`
}
