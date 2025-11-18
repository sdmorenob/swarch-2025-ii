package services

import (
	"context"
	"fmt"
	"time"

	"musicservice/internal/models"
	"musicservice/internal/repository"
	"musicservice/pkg/logger"

	"go.mongodb.org/mongo-driver/bson/primitive"
)

type PlaylistService struct {
	playlistRepo repository.PlaylistRepository
	trackRepo    repository.TrackRepository
}

func NewPlaylistService(
	playlistRepo repository.PlaylistRepository,
	trackRepo repository.TrackRepository,
) *PlaylistService {
	return &PlaylistService{
		playlistRepo: playlistRepo,
		trackRepo:    trackRepo,
	}
}

func (s *PlaylistService) CreatePlaylist(ctx context.Context, req models.CreatePlaylistRequest) (*models.Playlist, error) {
	// Create playlist object
	playlist := &models.Playlist{
		ID:              primitive.NewObjectID(),
		CreatorID:       req.CreatorID,
		Name:            req.Name,
		Description:     req.Description,
		TrackIDs:        []primitive.ObjectID{}, // Empty initially
		IsPublic:        req.IsPublic,
		IsCollaborative: req.IsCollaborative,
		TrackCount:      0,
		TotalDuration:   0,
		CreatedAt:       time.Now(),
		UpdatedAt:       time.Now(),
	}

	// Save to database
	if err := s.playlistRepo.Create(ctx, playlist); err != nil {
		return nil, fmt.Errorf("failed to create playlist: %w", err)
	}

	logger.Infof("Created playlist %s for user %s", playlist.ID.Hex(), req.CreatorID)
	return playlist, nil
}

func (s *PlaylistService) GetPlaylist(ctx context.Context, id string) (*models.Playlist, error) {
	objectID, err := primitive.ObjectIDFromHex(id)
	if err != nil {
		return nil, fmt.Errorf("invalid playlist ID: %w", err)
	}

	playlist, err := s.playlistRepo.GetByID(ctx, objectID)
	if err != nil {
		return nil, fmt.Errorf("playlist not found: %w", err)
	}

	return playlist, nil
}

func (s *PlaylistService) GetPlaylistWithTracks(ctx context.Context, id string) (*models.PlaylistWithTracks, error) {
	objectID, err := primitive.ObjectIDFromHex(id)
	if err != nil {
		return nil, fmt.Errorf("invalid playlist ID: %w", err)
	}

	playlistWithTracks, err := s.playlistRepo.GetWithTracks(ctx, objectID)
	if err != nil {
		return nil, fmt.Errorf("playlist not found: %w", err)
	}

	return playlistWithTracks, nil
}

func (s *PlaylistService) ListPlaylists(ctx context.Context, filter models.PlaylistFilter) ([]*models.Playlist, int64, error) {
	playlists, total, err := s.playlistRepo.List(ctx, filter)
	if err != nil {
		return nil, 0, fmt.Errorf("failed to list playlists: %w", err)
	}

	return playlists, total, nil
}

func (s *PlaylistService) UpdatePlaylist(ctx context.Context, id string, req models.UpdatePlaylistRequest, userID string) (*models.Playlist, error) {
	objectID, err := primitive.ObjectIDFromHex(id)
	if err != nil {
		return nil, fmt.Errorf("invalid playlist ID: %w", err)
	}

	// Get existing playlist to verify ownership
	playlist, err := s.playlistRepo.GetByID(ctx, objectID)
	if err != nil {
		return nil, fmt.Errorf("playlist not found: %w", err)
	}

	// Verify ownership or collaboration permission
	if playlist.CreatorID != userID && !playlist.IsCollaborative {
		return nil, fmt.Errorf("unauthorized: you can only edit your own playlists or collaborative playlists")
	}

	// Update fields if provided
	if req.Name != nil {
		playlist.Name = *req.Name
	}
	if req.Description != nil {
		playlist.Description = *req.Description
	}
	if req.IsPublic != nil {
		playlist.IsPublic = *req.IsPublic
	}
	if req.IsCollaborative != nil {
		playlist.IsCollaborative = *req.IsCollaborative
	}

	playlist.UpdatedAt = time.Now()

	// Save changes
	if err := s.playlistRepo.Update(ctx, playlist); err != nil {
		return nil, fmt.Errorf("failed to update playlist: %w", err)
	}

	logger.Infof("Updated playlist %s", playlist.ID.Hex())
	return playlist, nil
}

func (s *PlaylistService) DeletePlaylist(ctx context.Context, id string, userID string) error {
	objectID, err := primitive.ObjectIDFromHex(id)
	if err != nil {
		return fmt.Errorf("invalid playlist ID: %w", err)
	}

	// Get playlist to verify ownership
	playlist, err := s.playlistRepo.GetByID(ctx, objectID)
	if err != nil {
		return fmt.Errorf("playlist not found: %w", err)
	}

	// Verify ownership
	if playlist.CreatorID != userID {
		return fmt.Errorf("unauthorized: you can only delete your own playlists")
	}

	// Delete from database
	if err := s.playlistRepo.Delete(ctx, objectID); err != nil {
		return fmt.Errorf("failed to delete playlist: %w", err)
	}

	logger.Infof("Deleted playlist %s", playlist.ID.Hex())
	return nil
}

func (s *PlaylistService) AddTrackToPlaylist(ctx context.Context, playlistID, trackID string, userID string) (*models.Playlist, error) {
	playlistObjectID, err := primitive.ObjectIDFromHex(playlistID)
	if err != nil {
		return nil, fmt.Errorf("invalid playlist ID: %w", err)
	}

	trackObjectID, err := primitive.ObjectIDFromHex(trackID)
	if err != nil {
		return nil, fmt.Errorf("invalid track ID: %w", err)
	}

	// Get playlist to verify permissions
	playlist, err := s.playlistRepo.GetByID(ctx, playlistObjectID)
	if err != nil {
		return nil, fmt.Errorf("playlist not found: %w", err)
	}

	// Verify permissions (owner or collaborative playlist)
	if playlist.CreatorID != userID && !playlist.IsCollaborative {
		return nil, fmt.Errorf("unauthorized: you can only add tracks to your own playlists or collaborative playlists")
	}

	// Verify track exists and is accessible
	track, err := s.trackRepo.GetByID(ctx, trackObjectID)
	if err != nil {
		return nil, fmt.Errorf("track not found: %w", err)
	}

	// Check if track is public or user owns it
	if !track.IsPublic && track.UserID != userID {
		return nil, fmt.Errorf("unauthorized: cannot add private tracks that you don't own")
	}

	// Check if track is already in playlist
	for _, existingTrackID := range playlist.TrackIDs {
		if existingTrackID == trackObjectID {
			return nil, fmt.Errorf("track is already in the playlist")
		}
	}

	// Add track to playlist using repository method
	if err := s.playlistRepo.AddTrack(ctx, playlistObjectID, trackObjectID); err != nil {
		return nil, fmt.Errorf("failed to add track to playlist: %w", err)
	}

	// Get updated playlist
	updatedPlaylist, err := s.playlistRepo.GetByID(ctx, playlistObjectID)
	if err != nil {
		return nil, fmt.Errorf("failed to retrieve updated playlist: %w", err)
	}

	logger.Infof("Added track %s to playlist %s", trackID, playlistID)
	return updatedPlaylist, nil
}

func (s *PlaylistService) RemoveTrackFromPlaylist(ctx context.Context, playlistID, trackID string, userID string) (*models.Playlist, error) {
	playlistObjectID, err := primitive.ObjectIDFromHex(playlistID)
	if err != nil {
		return nil, fmt.Errorf("invalid playlist ID: %w", err)
	}

	trackObjectID, err := primitive.ObjectIDFromHex(trackID)
	if err != nil {
		return nil, fmt.Errorf("invalid track ID: %w", err)
	}

	// Get playlist to verify permissions
	playlist, err := s.playlistRepo.GetByID(ctx, playlistObjectID)
	if err != nil {
		return nil, fmt.Errorf("playlist not found: %w", err)
	}

	// Verify permissions (owner or collaborative playlist)
	if playlist.CreatorID != userID && !playlist.IsCollaborative {
		return nil, fmt.Errorf("unauthorized: you can only remove tracks from your own playlists or collaborative playlists")
	}

	// Check if track is in playlist
	trackExists := false
	for _, existingTrackID := range playlist.TrackIDs {
		if existingTrackID == trackObjectID {
			trackExists = true
			break
		}
	}

	if !trackExists {
		return nil, fmt.Errorf("track is not in the playlist")
	}

	// Remove track from playlist using repository method
	if err := s.playlistRepo.RemoveTrack(ctx, playlistObjectID, trackObjectID); err != nil {
		return nil, fmt.Errorf("failed to remove track from playlist: %w", err)
	}

	// Get updated playlist
	updatedPlaylist, err := s.playlistRepo.GetByID(ctx, playlistObjectID)
	if err != nil {
		return nil, fmt.Errorf("failed to retrieve updated playlist: %w", err)
	}

	logger.Infof("Removed track %s from playlist %s", trackID, playlistID)
	return updatedPlaylist, nil
}

func (s *PlaylistService) GetUserPlaylists(ctx context.Context, userID string, filter models.PaginationQuery) ([]*models.Playlist, int64, error) {
	playlists, total, err := s.playlistRepo.GetByCreatorID(ctx, userID, filter)
	if err != nil {
		return nil, 0, fmt.Errorf("failed to get user playlists: %w", err)
	}

	return playlists, total, nil
}