package services

import (
	"fmt"
	"mime/multipart"
	"path/filepath"
	"strings"

	"musicservice/internal/models"
	"musicservice/pkg/logger"

	"github.com/dhowden/tag"
)

// MetadataExtractor handles extraction of metadata from audio files
type MetadataExtractor struct{}

// NewMetadataExtractor creates a new metadata extractor
func NewMetadataExtractor() *MetadataExtractor {
	return &MetadataExtractor{}
}

// ExtractFromFile extracts metadata from an audio file
func (e *MetadataExtractor) ExtractFromFile(file multipart.File, filename string) (models.FileMetadata, error) {
	metadata := models.FileMetadata{}

	// Reset file pointer
	if _, err := file.Seek(0, 0); err != nil {
		return metadata, fmt.Errorf("failed to reset file pointer: %w", err)
	}

	// Use dhowden/tag to extract ID3 metadata
	m, err := tag.ReadFrom(file)
	if err != nil {
		// If metadata extraction fails, create basic metadata from filename
		logger.Warnf("Failed to extract metadata from %s: %v", filename, err)
		return e.createFallbackMetadata(filename), nil
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
		metadata.Title = e.extractTitleFromFilename(filename)
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

	// Set format-specific information based on detected format
	if format := m.Format(); format != tag.UnknownFormat {
		e.setFormatSpecificData(&metadata, format)
	} else {
		e.setDefaultAudioData(&metadata, filename)
	}

	logger.Infof("Extracted metadata - Title: %s, Artist: %s, Album: %s",
		metadata.Title, metadata.Artist, metadata.Album)

	return metadata, nil
}

// createFallbackMetadata creates basic metadata when extraction fails
func (e *MetadataExtractor) createFallbackMetadata(filename string) models.FileMetadata {
	return models.FileMetadata{
		Title:      e.extractTitleFromFilename(filename),
		Artist:     "Unknown Artist",
		Album:      "Unknown Album",
		Genre:      "Unknown",
		Year:       0,
		Track:      0,
		Duration:   0,
		Bitrate:    320,
		SampleRate: 44100,
	}
}

// extractTitleFromFilename extracts title from filename
func (e *MetadataExtractor) extractTitleFromFilename(filename string) string {
	// Remove extension
	name := filepath.Base(filename)
	ext := filepath.Ext(name)
	title := name[:len(name)-len(ext)]

	// Clean up common patterns
	title = strings.ReplaceAll(title, "_", " ")
	title = strings.ReplaceAll(title, "-", " ")
	title = strings.TrimSpace(title)

	// Capitalize first letter of each word
	words := strings.Fields(title)
	for i, word := range words {
		if len(word) > 0 {
			words[i] = strings.ToUpper(word[:1]) + strings.ToLower(word[1:])
		}
	}

	return strings.Join(words, " ")
}

// setFormatSpecificData sets bitrate and sample rate based on audio format
func (e *MetadataExtractor) setFormatSpecificData(metadata *models.FileMetadata, format tag.Format) {
	// Note: Using string comparison instead of constants due to dhowden/tag version compatibility
	formatStr := string(format)

	switch formatStr {
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

// setDefaultAudioData sets default audio parameters
func (e *MetadataExtractor) setDefaultAudioData(metadata *models.FileMetadata, filename string) {
	// Try to guess based on file extension
	ext := strings.ToLower(filepath.Ext(filename))

	switch ext {
	case ".mp3":
		metadata.Bitrate = 320
		metadata.SampleRate = 44100
	case ".flac":
		metadata.Bitrate = 1411
		metadata.SampleRate = 44100
	case ".m4a", ".aac":
		metadata.Bitrate = 256
		metadata.SampleRate = 44100
	case ".wav":
		metadata.Bitrate = 1411
		metadata.SampleRate = 44100
	case ".ogg":
		metadata.Bitrate = 320
		metadata.SampleRate = 44100
	default:
		// Default values
		metadata.Bitrate = 320
		metadata.SampleRate = 44100
	}
}

// EstimateDuration estimates duration based on file size and bitrate (rough estimation)
func (e *MetadataExtractor) EstimateDuration(fileSize int64, bitrate int) int {
	if bitrate == 0 {
		bitrate = 320 // Default bitrate
	}

	// Formula: duration (seconds) = file_size_bits / bitrate_per_second
	fileSizeBits := fileSize * 8
	bitratePerSecond := int64(bitrate * 1000) // Convert kbps to bps

	if bitratePerSecond > 0 {
		duration := int(fileSizeBits / bitratePerSecond)
		return duration
	}

	return 0
}

// ValidateMetadata validates extracted metadata
func (e *MetadataExtractor) ValidateMetadata(metadata models.FileMetadata) error {
	if metadata.Title == "" {
		return fmt.Errorf("title is required")
	}

	if metadata.Bitrate < 0 || metadata.Bitrate > 10000 {
		return fmt.Errorf("invalid bitrate: %d", metadata.Bitrate)
	}

	if metadata.SampleRate < 0 || metadata.SampleRate > 192000 {
		return fmt.Errorf("invalid sample rate: %d", metadata.SampleRate)
	}

	if metadata.Duration < 0 {
		return fmt.Errorf("invalid duration: %d", metadata.Duration)
	}

	return nil
}
