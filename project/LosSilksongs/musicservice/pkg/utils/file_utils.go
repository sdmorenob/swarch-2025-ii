package utils

import (
	"fmt"
	"path/filepath"
	"strings"
)

// IsValidAudioFile checks if the file extension is supported
func IsValidAudioFile(filename string) bool {
	ext := strings.ToLower(filepath.Ext(filename))
	validExtensions := []string{".mp3", ".wav", ".flac", ".m4a", ".ogg", ".aac", ".wma"}

	for _, validExt := range validExtensions {
		if ext == validExt {
			return true
		}
	}
	return false
}

// GetAudioMimeType returns the MIME type based on file extension
func GetAudioMimeType(filename string) string {
	ext := strings.ToLower(filepath.Ext(filename))

	mimeTypes := map[string]string{
		".mp3":  "audio/mpeg",
		".wav":  "audio/wav",
		".flac": "audio/flac",
		".m4a":  "audio/mp4",
		".ogg":  "audio/ogg",
		".aac":  "audio/aac",
		".wma":  "audio/x-ms-wma",
	}

	if mimeType, exists := mimeTypes[ext]; exists {
		return mimeType
	}

	return "audio/mpeg" // Default fallback
}

// FormatFileSize formats file size in human readable format
func FormatFileSize(bytes int64) string {
	const unit = 1024
	if bytes < unit {
		return fmt.Sprintf("%d B", bytes)
	}

	div, exp := int64(unit), 0
	for n := bytes / unit; n >= unit; n /= unit {
		div *= unit
		exp++
	}

	units := []string{"KB", "MB", "GB", "TB"}
	return fmt.Sprintf("%.1f %s", float64(bytes)/float64(div), units[exp])
}

// GenerateUniqueFilename generates a unique filename with timestamp
func GenerateUniqueFilename(originalName string) string {
	ext := filepath.Ext(originalName)
	name := strings.TrimSuffix(originalName, ext)

	// Clean the filename
	name = strings.ReplaceAll(name, " ", "_")
	name = strings.ReplaceAll(name, "(", "")
	name = strings.ReplaceAll(name, ")", "")

	return fmt.Sprintf("%s%s", name, ext)
}
