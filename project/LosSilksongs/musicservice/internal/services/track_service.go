package services

import (
	"context"
	"fmt"
	"mime/multipart"
	"path/filepath"
	"strings"
	"time"

	"musicservice/internal/handlers/grpc"
	"musicservice/internal/models"
	"musicservice/internal/repository"
	"musicservice/internal/storage"
	"musicservice/pkg/logger"

	"go.mongodb.org/mongo-driver/bson/primitive"
)

type TrackService struct {
	trackRepo      repository.TrackRepository
	storage        storage.FileStorage
	metadataClient grpc.MetadataClient
	fileService    *FileService
}

func NewTrackService(
	trackRepo repository.TrackRepository,
	storage storage.FileStorage,
	metadataClient grpc.MetadataClient,
) *TrackService {
	return &TrackService{
		trackRepo:      trackRepo,
		storage:        storage,
		metadataClient: metadataClient,
		fileService:    NewFileService(),
	}
}

func (s *TrackService) UploadTrack(ctx context.Context, file multipart.File, header *multipart.FileHeader, req models.TrackUploadRequest) (*models.Track, error) {
	// Validate file
	if err := s.fileService.ValidateAudioFile(header); err != nil {
		return nil, err
	}

	// Reset file pointer to beginning
	file.Seek(0, 0)

	// Detect MIME type
	mimeType, err := s.fileService.DetectMimeType(file)
	if err != nil {
		logger.Errorf("Failed to detect MIME type: %v", err)
		mimeType = "audio/mpeg" // Default fallback
	}

	// Reset file pointer again
	file.Seek(0, 0)

	// Generate unique filename
	trackID := primitive.NewObjectID()
	ext := filepath.Ext(header.Filename)
	filename := fmt.Sprintf("track_%s%s", trackID.Hex(), ext)

	// Extract metadata from file
	originalMetadata, err := s.fileService.ExtractMetadata(file, header.Filename)
	if err != nil {
		logger.Errorf("Failed to extract metadata: %v", err)
		// Continue with empty metadata
		originalMetadata = models.FileMetadata{
			Title:  strings.TrimSuffix(header.Filename, ext),
			Artist: "Unknown Artist",
		}
	}

	// Reset file pointer for storage
	file.Seek(0, 0)

	// Save file to storage
	filePath, fileURL, err := s.storage.SaveFile(file, filename)
	if err != nil {
		return nil, fmt.Errorf("failed to save file: %w", err)
	}

	// Create track object
	track := &models.Track{
		ID:       trackID,
		UserID:   req.UserID,
		Filename: header.Filename,
		FilePath: filePath,
		FileSize: header.Size,
		MimeType: mimeType,
		FileURL:  fileURL,

		OriginalMetadata: originalMetadata,
		Tags:             req.Tags,
		IsPublic:         req.IsPublic,
		UploadStatus:     "processing",

		CreatedAt: time.Now(),
		UpdatedAt: time.Now(),
	}

	// Save to database
	if err := s.trackRepo.Create(ctx, track); err != nil {
		// Clean up uploaded file if database save fails
		s.storage.DeleteFile(filePath)
		return nil, fmt.Errorf("failed to save track to database: %w", err)
	}

	// Enrich metadata asynchronously
	go s.enrichMetadataAsync(track)

	return track, nil
}

func (s *TrackService) GetTrack(ctx context.Context, id string) (*models.Track, error) {
	objectID, err := primitive.ObjectIDFromHex(id)
	if err != nil {
		return nil, fmt.Errorf("invalid track ID: %w", err)
	}

	track, err := s.trackRepo.GetByID(ctx, objectID)
	if err != nil {
		return nil, fmt.Errorf("track not found: %w", err)
	}

	return track, nil
}

func (s *TrackService) ListTracks(ctx context.Context, filter models.TrackFilter) ([]*models.Track, int64, error) {
	tracks, total, err := s.trackRepo.List(ctx, filter)
	if err != nil {
		return nil, 0, fmt.Errorf("failed to list tracks: %w", err)
	}

	return tracks, total, nil
}

func (s *TrackService) DeleteTrack(ctx context.Context, id string, userID string) error {
	objectID, err := primitive.ObjectIDFromHex(id)
	if err != nil {
		return fmt.Errorf("invalid track ID: %w", err)
	}

	// Get track to verify ownership and get file path
	track, err := s.trackRepo.GetByID(ctx, objectID)
	if err != nil {
		return fmt.Errorf("track not found: %w", err)
	}

	// Verify ownership
	if track.UserID != userID {
		return fmt.Errorf("unauthorized: you can only delete your own tracks")
	}

	// Delete from database
	if err := s.trackRepo.Delete(ctx, objectID); err != nil {
		return fmt.Errorf("failed to delete track from database: %w", err)
	}

	// Delete file from storage
	if err := s.storage.DeleteFile(track.FilePath); err != nil {
		logger.Errorf("Failed to delete file %s: %v", track.FilePath, err)
		// Continue anyway since DB deletion succeeded
	}

	return nil
}

func (s *TrackService) GetTrackStream(ctx context.Context, id string) (*models.Track, error) {
	return s.GetTrack(ctx, id)
}

// Private helper methods

func (s *TrackService) enrichMetadataAsync(track *models.Track) {
	ctx := context.Background()

	// Skip if no metadata client available
	if s.metadataClient == nil {
		logger.Warn("Metadata client not available, skipping enrichment")
		s.updateTrackStatus(ctx, track.ID, "completed")
		return
	}

	logger.Infof("Enriching metadata for track %s", track.ID.Hex())

	// Call Metadata Service via gRPC
	enrichedData, err := s.metadataClient.EnrichTrack(ctx,
		track.OriginalMetadata.Title,
		track.OriginalMetadata.Artist,
		track.OriginalMetadata.Album,
	)

	if err != nil {
		logger.Errorf("Failed to enrich metadata for track %s: %v", track.ID.Hex(), err)
		// Mark as completed anyway since the track upload succeeded
		s.updateTrackStatus(ctx, track.ID, "completed")
		return
	}

	// Update track with enriched metadata
	track.EnrichedMetadata = enrichedData
	track.UploadStatus = "completed"
	track.UpdatedAt = time.Now()

	if err := s.trackRepo.Update(ctx, track); err != nil {
		logger.Errorf("Failed to update track with enriched metadata: %v", err)
	} else {
		logger.Infof("Successfully enriched metadata for track %s", track.ID.Hex())
	}
}

func (s *TrackService) updateTrackStatus(ctx context.Context, trackID primitive.ObjectID, status string) {
	track, err := s.trackRepo.GetByID(ctx, trackID)
	if err != nil {
		logger.Errorf("Failed to get track for status update: %v", err)
		return
	}

	track.UploadStatus = status
	track.UpdatedAt = time.Now()

	if err := s.trackRepo.Update(ctx, track); err != nil {
		logger.Errorf("Failed to update track status: %v", err)
	}
}
