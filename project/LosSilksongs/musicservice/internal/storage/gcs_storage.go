package storage

import (
    "bytes"
    "context"
    "fmt"
    "io"
    "mime"
    "mime/multipart"
    "path/filepath"
    "strings"
    "time"

    "cloud.google.com/go/storage"
    "github.com/google/uuid"
)

// GCSStorage implements FileStorage using Google Cloud Storage.
type GCSStorage struct {
    client     *storage.Client
    bucketName string
}

// NewGCSStorage initializes a Google Cloud Storage client using
// Application Default Credentials (ADC). Bucket name is required.
func NewGCSStorage(ctx context.Context, bucketName string) (*GCSStorage, error) {
    if strings.TrimSpace(bucketName) == "" {
        return nil, fmt.Errorf("bucket name is required")
    }

    client, err := storage.NewClient(ctx)
    if err != nil {
        return nil, fmt.Errorf("failed to create GCS client: %w", err)
    }

    return &GCSStorage{
        client:     client,
        bucketName: bucketName,
    }, nil
}

// SaveFile uploads the multipart file to GCS with a unique name and returns
// the object path and its public URL.
func (s *GCSStorage) SaveFile(file multipart.File, filename string) (string, string, error) {
    ctx, cancel := context.WithTimeout(context.Background(), 2*time.Minute)
    defer cancel()

    // Ensure we start reading from the beginning if possible.
    if seeker, ok := file.(io.Seeker); ok {
        _, _ = seeker.Seek(0, io.SeekStart)
    }

    ext := strings.ToLower(filepath.Ext(filename))
    objectName := fmt.Sprintf("audio/%s%s", uuid.New().String(), ext)

    obj := s.client.Bucket(s.bucketName).Object(objectName)
    writer := obj.NewWriter(ctx)

    if ct := mime.TypeByExtension(ext); ct != "" {
        writer.ContentType = ct
    } else {
        writer.ContentType = "application/octet-stream"
    }

    if _, err := io.Copy(writer, file); err != nil {
        _ = writer.Close()
        return "", "", fmt.Errorf("failed to copy file to GCS: %w", err)
    }

    if err := writer.Close(); err != nil {
        return "", "", fmt.Errorf("failed to finalize upload to GCS: %w", err)
    }

    // With uniform bucket-level access enabled we cannot set per-object ACLs.
    // Public access must be granted at bucket/IAM level (e.g., storage.objectViewer for allUsers).
    publicURL := s.GetFileURL(objectName)
    return objectName, publicURL, nil
}

// GetFile retrieves the full object contents from GCS.
func (s *GCSStorage) GetFile(filePath string) ([]byte, error) {
    ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
    defer cancel()

    reader, err := s.client.Bucket(s.bucketName).Object(filePath).NewReader(ctx)
    if err != nil {
        return nil, fmt.Errorf("failed to open GCS object: %w", err)
    }
    defer reader.Close()

    data, err := io.ReadAll(reader)
    if err != nil {
        return nil, fmt.Errorf("failed to read GCS object: %w", err)
    }

    return data, nil
}

// GetFileStream returns a ReadSeeker for the object by buffering it in memory.
func (s *GCSStorage) GetFileStream(filePath string) (io.ReadSeeker, error) {
    data, err := s.GetFile(filePath)
    if err != nil {
        return nil, err
    }

    return bytes.NewReader(data), nil
}

// DeleteFile removes the object from GCS. Missing objects are treated as success.
func (s *GCSStorage) DeleteFile(filePath string) error {
    ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
    defer cancel()

    err := s.client.Bucket(s.bucketName).Object(filePath).Delete(ctx)
    if err != nil && err != storage.ErrObjectNotExist {
        return fmt.Errorf("failed to delete GCS object: %w", err)
    }

    return nil
}

// FileExists checks if the object exists in GCS.
func (s *GCSStorage) FileExists(filePath string) bool {
    ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
    defer cancel()

    _, err := s.client.Bucket(s.bucketName).Object(filePath).Attrs(ctx)
    return err == nil
}

// GetFileURL builds the public URL for the given object.
func (s *GCSStorage) GetFileURL(filePath string) string {
    // GCS public URL format.
    return fmt.Sprintf("https://storage.googleapis.com/%s/%s", s.bucketName, strings.TrimPrefix(filePath, "/"))
}

// Close releases underlying GCS client resources.
func (s *GCSStorage) Close() error {
    if s.client != nil {
        return s.client.Close()
    }
    return nil
}
