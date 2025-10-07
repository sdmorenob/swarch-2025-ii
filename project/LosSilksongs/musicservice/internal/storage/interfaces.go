package storage

import (
	"io"
	"mime/multipart"
)

// FileStorage defines the interface for file storage operations
type FileStorage interface {
	SaveFile(file multipart.File, filename string) (filePath, fileURL string, error error)
	GetFile(filePath string) ([]byte, error)
	GetFileStream(filePath string) (io.ReadSeeker, error)
	DeleteFile(filePath string) error
	FileExists(filePath string) bool
	GetFileURL(filePath string) string
}
