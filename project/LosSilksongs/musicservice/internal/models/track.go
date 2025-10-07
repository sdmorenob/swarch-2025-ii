package models

import (
	"time"

	"go.mongodb.org/mongo-driver/bson/primitive"
)

// Track represents a music track in the system
type Track struct {
	ID     primitive.ObjectID `bson:"_id,omitempty" json:"id"`
	UserID string             `bson:"user_id" json:"user_id" validate:"required"`

	// File information
	Filename string `bson:"filename" json:"filename"`
	FilePath string `bson:"file_path" json:"file_path"`
	FileSize int64  `bson:"file_size" json:"file_size"`
	MimeType string `bson:"mime_type" json:"mime_type"`
	FileURL  string `bson:"file_url" json:"file_url"`

	// Original metadata from file
	OriginalMetadata FileMetadata `bson:"original_metadata" json:"original_metadata"`

	// Enriched metadata from Spotify
	EnrichedMetadata *SpotifyMetadata `bson:"enriched_metadata,omitempty" json:"enriched_metadata,omitempty"`

	// Additional fields
	Tags     []string `bson:"tags" json:"tags"`
	IsPublic bool     `bson:"is_public" json:"is_public"`

	// Status
	UploadStatus string `bson:"upload_status" json:"upload_status"` // "processing", "completed", "failed"

	// Timestamps
	CreatedAt time.Time `bson:"created_at" json:"created_at"`
	UpdatedAt time.Time `bson:"updated_at" json:"updated_at"`
}

// FileMetadata represents metadata extracted from audio file
type FileMetadata struct {
	Title      string `bson:"title" json:"title"`
	Artist     string `bson:"artist" json:"artist"`
	Album      string `bson:"album" json:"album"`
	Genre      string `bson:"genre" json:"genre"`
	Year       int    `bson:"year" json:"year"`
	Track      int    `bson:"track" json:"track"`
	Duration   int    `bson:"duration" json:"duration"` // seconds
	Bitrate    int    `bson:"bitrate" json:"bitrate"`
	SampleRate int    `bson:"sample_rate" json:"sample_rate"`
}

// SpotifyMetadata represents enriched metadata from Spotify API
type SpotifyMetadata struct {
	SpotifyID   string   `bson:"spotify_id" json:"spotify_id"`
	Title       string   `bson:"title" json:"title"`
	Artist      string   `bson:"artist" json:"artist"`
	Album       string   `bson:"album" json:"album"`
	Genres      []string `bson:"genres" json:"genres"`
	ReleaseDate string   `bson:"release_date" json:"release_date"`
	AlbumArtURL string   `bson:"album_art_url" json:"album_art_url"`
	PreviewURL  string   `bson:"preview_url" json:"preview_url"`
	DurationMS  int      `bson:"duration_ms" json:"duration_ms"`
	Popularity  float32  `bson:"popularity" json:"popularity"`
	Confidence  float32  `bson:"confidence" json:"confidence"`
}

// TrackUploadRequest represents the request for uploading a track
type TrackUploadRequest struct {
	UserID   string   `form:"user_id" validate:"required"`
	Tags     []string `form:"tags"`
	IsPublic bool     `form:"is_public"`
}

// APIResponse represents a generic API response
type APIResponse struct {
	Success bool        `json:"success"`
	Data    interface{} `json:"data,omitempty"`
	Error   string      `json:"error,omitempty"`
	Message string      `json:"message,omitempty"`
}

// PaginationQuery represents pagination parameters
type PaginationQuery struct {
	Page  int `form:"page,default=1" validate:"min=1"`
	Limit int `form:"limit,default=20" validate:"min=1,max=100"`
}

// TrackFilter represents filtering options for tracks
type TrackFilter struct {
	PaginationQuery
	UserID   string `form:"user_id"`
	Genre    string `form:"genre"`
	Artist   string `form:"artist"`
	IsPublic *bool  `form:"is_public"`
	Search   string `form:"search"`
}
