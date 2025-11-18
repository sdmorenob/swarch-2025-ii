package rest

import "musicservice/internal/models"

// Swagger response models

// SuccessResponse represents a successful API response
// @Description Successful response wrapper
type SuccessResponse struct {
	Success bool        `json:"success" example:"true"`
	Data    interface{} `json:"data"`
	Message string      `json:"message" example:"Operation completed successfully"`
}

// ErrorResponse represents an error API response
// @Description Error response wrapper
type ErrorResponse struct {
	Success bool   `json:"success" example:"false"`
	Error   string `json:"error" example:"Error description"`
}

// TrackResponse represents a track in responses
type TrackResponse struct {
	models.Track
}

// PlaylistResponse represents a playlist in responses
type PlaylistResponse struct {
	models.Playlist
}

// TrackListResponse represents paginated track list
type TrackListResponse struct {
	Tracks     []models.Track `json:"tracks"`
	Pagination PaginationInfo `json:"pagination"`
}

// PlaylistListResponse represents paginated playlist list
type PlaylistListResponse struct {
	Playlists  []models.Playlist `json:"playlists"`
	Pagination PaginationInfo    `json:"pagination"`
}

// PaginationInfo represents pagination metadata
type PaginationInfo struct {
	CurrentPage int   `json:"current_page" example:"1"`
	PerPage     int   `json:"per_page" example:"20"`
	TotalPages  int   `json:"total_pages" example:"5"`
	TotalItems  int64 `json:"total_items" example:"100"`
	HasNext     bool  `json:"has_next" example:"true"`
	HasPrev     bool  `json:"has_prev" example:"false"`
}

// HealthResponse represents health check response
type HealthResponse struct {
	Status    string `json:"status" example:"healthy"`
	Service   string `json:"service" example:"music-service"`
	Timestamp string `json:"timestamp" example:"2024-01-15T10:30:00Z"`
}
