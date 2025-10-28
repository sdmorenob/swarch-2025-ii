package repository

import (
	"context"
	"musicservice/internal/models"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

// TrackRepository defines the interface for track data operations
type TrackRepository interface {
	Create(ctx context.Context, track *models.Track) error
	GetByID(ctx context.Context, id primitive.ObjectID) (*models.Track, error)
	Update(ctx context.Context, track *models.Track) error
	Delete(ctx context.Context, id primitive.ObjectID) error
	List(ctx context.Context, filter models.TrackFilter) ([]*models.Track, int64, error)
	GetByUserID(ctx context.Context, userID string, filter models.PaginationQuery) ([]*models.Track, int64, error)
}

// PlaylistRepository defines the interface for playlist data operations
type PlaylistRepository interface {
	Create(ctx context.Context, playlist *models.Playlist) error
	GetByID(ctx context.Context, id primitive.ObjectID) (*models.Playlist, error)
	GetWithTracks(ctx context.Context, id primitive.ObjectID) (*models.PlaylistWithTracks, error)
	Update(ctx context.Context, playlist *models.Playlist) error
	Delete(ctx context.Context, id primitive.ObjectID) error
	List(ctx context.Context, filter models.PlaylistFilter) ([]*models.Playlist, int64, error)
	GetByCreatorID(ctx context.Context, creatorID string, filter models.PaginationQuery) ([]*models.Playlist, int64, error)
	AddTrack(ctx context.Context, playlistID, trackID primitive.ObjectID) error
	RemoveTrack(ctx context.Context, playlistID, trackID primitive.ObjectID) error
}