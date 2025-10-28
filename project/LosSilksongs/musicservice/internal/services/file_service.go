package services

import (
	"fmt"
	"mime/multipart"
	"path/filepath"

	"musicservice/internal/models"
	"musicservice/pkg/logger"
	"musicservice/pkg/utils"

	"github.com/dhowden/tag"
	"github.com/gabriel-vasile/mimetype"
)

// FileService handles file-related operations
type FileService struct{}

// NewFileService creates a new file service instance
func NewFileService() *FileService {
	return &FileService{}
}

// ValidateAudioFile validates if the uploaded file is a valid audio file
func (s *FileService) ValidateAudioFile(header *multipart.FileHeader) error {
	// Check file extension
	if !utils.IsValidAudioFile(header.Filename) {
		return fmt.Errorf("unsupported file type. Supported formats: MP3, WAV, FLAC, M4A, OGG, AAC")
	}

	// Check file size (max 50MB)
	maxSize := int64(50 * 1024 * 1024) // 50MB
	if header.Size > maxSize {
		return fmt.Errorf("file size exceeds maximum allowed size of %s", utils.FormatFileSize(maxSize))
	}

	// Check minimum file size (1KB)
	minSize := int64(1024) // 1KB
	if header.Size < minSize {
		return fmt.Errorf("file size is too small. Minimum size is %s", utils.FormatFileSize(minSize))
	}

	return nil
}

// DetectMimeType detects the MIME type of the uploaded file
func (s *FileService) DetectMimeType(file multipart.File) (string, error) {
	// Read first 512 bytes for MIME type detection
	buffer := make([]byte, 512)
	n, err := file.Read(buffer)
	if err != nil {
		return "", fmt.Errorf("failed to read file for MIME type detection: %w", err)
	}

	// Reset file pointer
	file.Seek(0, 0)

	mtype := mimetype.Detect(buffer[:n])
	detectedType := mtype.String()

	// Validate that it's actually an audio file
	if !s.isAudioMimeType(detectedType) {
		return "", fmt.Errorf("file is not a valid audio file. Detected type: %s", detectedType)
	}

	return detectedType, nil
}

// ExtractMetadata extracts ID3 metadata from audio file
func (s *FileService) ExtractMetadata(file multipart.File, filename string) (models.FileMetadata, error) {
	metadata := models.FileMetadata{}

	// Reset file pointer
	file.Seek(0, 0)

	// Use dhowden/tag to extract ID3 metadata
	m, err := tag.ReadFrom(file)
	if err != nil {
		// If metadata extraction fails, create basic metadata from filename
		logger.Warnf("Failed to extract metadata from %s: %v", filename, err)

		// Try to extract title from filename
		name := filepath.Base(filename)
		ext := filepath.Ext(name)
		title := name[:len(name)-len(ext)]

		metadata.Title = title
		metadata.Artist = "Unknown Artist"
		metadata.Album = "Unknown Album"
		metadata.Genre = "Unknown"
		return metadata, nil
	}

	// Extract available metadata
	metadata.Title = m.Title()
	metadata.Artist = m.Artist()
	metadata.Album = m.Album()
	metadata.Genre = m.Genre()

	// Handle year
	if year := m.Year(); year != 0 {
		metadata.Year = year
	}

	// Handle track number
	if track, _ := m.Track(); track != 0 {
		metadata.Track = track
	}

	// Set default values if empty
	if metadata.Title == "" {
		name := filepath.Base(filename)
		ext := filepath.Ext(name)
		metadata.Title = name[:len(name)-len(ext)]
	}
	if metadata.Artist == "" {
		metadata.Artist = "Unknown Artist"
	}
	if metadata.Album == "" {
		metadata.Album = "Unknown Album"
	}
	if metadata.Genre == "" {
		metadata.Genre = "Unknown"
	}

	// Try to get format-specific information
	if format := m.Format(); format != tag.UnknownFormat {
		// Use string comparison since tag constants may not match Format type
		formatName := string(format)
		switch formatName {
		case "MP3":
			metadata.Bitrate = 320 // Default, could be extracted more precisely
			metadata.SampleRate = 44100
		case "FLAC":
			metadata.Bitrate = 1411 // Lossless
			metadata.SampleRate = 44100
		case "M4A":
			metadata.Bitrate = 256
			metadata.SampleRate = 44100
		case "OGG":
			metadata.Bitrate = 320
			metadata.SampleRate = 44100
		default:
			metadata.Bitrate = 320
			metadata.SampleRate = 44100
		}
	}

	logger.Infof("Extracted metadata - Title: %s, Artist: %s, Album: %s",
		metadata.Title, metadata.Artist, metadata.Album)

	return metadata, nil
}

// isAudioMimeType checks if the detected MIME type is audio
func (s *FileService) isAudioMimeType(mimeType string) bool {
	audioMimeTypes := []string{
		"audio/mpeg",     // MP3
		"audio/wav",      // WAV
		"audio/x-wav",    // WAV alternative
		"audio/flac",     // FLAC
		"audio/mp4",      // M4A
		"audio/aac",      // AAC
		"audio/ogg",      // OGG
		"audio/x-ms-wma", // WMA
	}

	for _, audioType := range audioMimeTypes {
		if mimeType == audioType {
			return true
		}
	}

	return false
}
