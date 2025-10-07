package models

import (
	"time"

	"go.mongodb.org/mongo-driver/bson/primitive"
)

// Playlist represents a music playlist
type Playlist struct {
	ID          primitive.ObjectID   `bson:"_id,omitempty" json:"id"`
	CreatorID   string               `bson:"creator_id" json:"creator_id" validate:"required"`
	Name        string               `bson:"name" json:"name" validate:"required"`
	Description string               `bson:"description" json:"description"`
	TrackIDs    []primitive.ObjectID `bson:"track_ids" json:"track_ids"`

	// Playlist metadata
	CoverImageURL   string `bson:"cover_image_url" json:"cover_image_url"`
	IsPublic        bool   `bson:"is_public" json:"is_public"`
	IsCollaborative bool   `bson:"is_collaborative" json:"is_collaborative"`

	// Computed fields
	TrackCount    int `bson:"track_count" json:"track_count"`
	TotalDuration int `bson:"total_duration" json:"total_duration"` // seconds

	// Timestamps
	CreatedAt time.Time `bson:"created_at" json:"created_at"`
	UpdatedAt time.Time `bson:"updated_at" json:"updated_at"`
}

// PlaylistWithTracks represents a playlist with full track information
type PlaylistWithTracks struct {
	Playlist
	Tracks []Track `json:"tracks"`
}

// CreatePlaylistRequest represents the request for creating a playlist
type CreatePlaylistRequest struct {
	CreatorID       string `json:"creator_id" validate:"required"`
	Name            string `json:"name" validate:"required"`
	Description     string `json:"description"`
	IsPublic        bool   `json:"is_public"`
	IsCollaborative bool   `json:"is_collaborative"`
}

// UpdatePlaylistRequest represents the request for updating a playlist
type UpdatePlaylistRequest struct {
	Name            *string `json:"name,omitempty"`
	Description     *string `json:"description,omitempty"`
	IsPublic        *bool   `json:"is_public,omitempty"`
	IsCollaborative *bool   `json:"is_collaborative,omitempty"`
}

// AddTrackToPlaylistRequest represents the request for adding a track to a playlist
type AddTrackToPlaylistRequest struct {
	TrackID string `json:"track_id" validate:"required"`
}

// PlaylistFilter represents filtering options for playlists
type PlaylistFilter struct {
	PaginationQuery
	CreatorID string `form:"creator_id"`
	IsPublic  *bool  `form:"is_public"`
	Search    string `form:"search"`
}
