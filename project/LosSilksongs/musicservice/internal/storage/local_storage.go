package storage

import (
	"fmt"
	"io"
	"mime/multipart"
	"os"
	"path/filepath"
	"strings"

	"musicservice/pkg/logger"
)

type localStorage struct {
	basePath string
	baseURL  string
}

// NewLocalStorage creates a new local file storage instance
func NewLocalStorage(basePath string) FileStorage {
	// Ensure the base path exists
	if err := os.MkdirAll(basePath, 0755); err != nil {
		logger.Fatalf("Failed to create storage directory: %v", err)
	}

	// Create subdirectories
	subdirs := []string{"audio", "temp", "covers"}
	for _, subdir := range subdirs {
		path := filepath.Join(basePath, subdir)
		if err := os.MkdirAll(path, 0755); err != nil {
			logger.Fatalf("Failed to create subdirectory %s: %v", subdir, err)
		}
	}

	return &localStorage{
		basePath: basePath,
		baseURL:  "/uploads", // URL path for serving files
	}
}

func (s *localStorage) SaveFile(file multipart.File, filename string) (string, string, error) {
	// Create audio subdirectory
	audioDir := filepath.Join(s.basePath, "audio")
	if err := os.MkdirAll(audioDir, 0755); err != nil {
		return "", "", fmt.Errorf("failed to create audio directory: %w", err)
	}

	// Full file path
	filePath := filepath.Join(audioDir, filename)

	// Create the destination file
	dst, err := os.Create(filePath)
	if err != nil {
		return "", "", fmt.Errorf("failed to create destination file: %w", err)
	}
	defer dst.Close()

	// Copy file contents
	_, err = io.Copy(dst, file)
	if err != nil {
		// Clean up the file if copy failed
		os.Remove(filePath)
		return "", "", fmt.Errorf("failed to copy file: %w", err)
	}

	// Generate file URL
	fileURL := s.generateFileURL(filename)

	logger.Infof("File saved successfully: %s", filePath)

	return filePath, fileURL, nil
}

func (s *localStorage) GetFile(filePath string) ([]byte, error) {
	// Security check: ensure file is within our storage directory
	if !s.isValidPath(filePath) {
		return nil, fmt.Errorf("invalid file path")
	}

	data, err := os.ReadFile(filePath)
	if err != nil {
		return nil, fmt.Errorf("failed to read file: %w", err)
	}

	return data, nil
}

func (s *localStorage) GetFileStream(filePath string) (io.ReadSeeker, error) {
	// Security check: ensure file is within our storage directory
	if !s.isValidPath(filePath) {
		return nil, fmt.Errorf("invalid file path")
	}

	file, err := os.Open(filePath)
	if err != nil {
		return nil, fmt.Errorf("failed to open file: %w", err)
	}

	return file, nil
}

func (s *localStorage) DeleteFile(filePath string) error {
	// Security check: ensure file is within our storage directory
	if !s.isValidPath(filePath) {
		return fmt.Errorf("invalid file path")
	}

	if !s.FileExists(filePath) {
		return nil // File doesn't exist, consider it deleted
	}

	err := os.Remove(filePath)
	if err != nil {
		return fmt.Errorf("failed to delete file: %w", err)
	}

	logger.Infof("File deleted successfully: %s", filePath)
	return nil
}

func (s *localStorage) FileExists(filePath string) bool {
	_, err := os.Stat(filePath)
	return !os.IsNotExist(err)
}

func (s *localStorage) GetFileURL(filePath string) string {
	// Extract filename from full path
	filename := filepath.Base(filePath)
	return s.generateFileURL(filename)
}

// Helper methods

func (s *localStorage) generateFileURL(filename string) string {
	return fmt.Sprintf("%s/audio/%s", s.baseURL, filename)
}

func (s *localStorage) isValidPath(filePath string) bool {
	// Clean the path to prevent directory traversal
	cleanPath := filepath.Clean(filePath)

	// Check if the path is within our base directory
	absBasePath, err := filepath.Abs(s.basePath)
	if err != nil {
		return false
	}

	absFilePath, err := filepath.Abs(cleanPath)
	if err != nil {
		return false
	}

	return strings.HasPrefix(absFilePath, absBasePath)
}
