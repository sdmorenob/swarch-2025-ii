// package grpc

// import (
// 	"context"
// 	"fmt"
// 	"time"

// 	"musicservice/internal/models"
// 	pb "musicservice/proto/metadata"

// 	"google.golang.org/grpc"
// 	"google.golang.org/grpc/keepalive"
// 	"google.golang.org/grpc/credentials/insecure"
// )

// type MetadataClient interface {
// 	EnrichTrack(ctx context.Context, title, artist, album string) (*models.SpotifyMetadata, error)
// 	Close() error
// }

// type metadataClient struct {
// 	client pb.MetadataServiceClient
// 	conn   *grpc.ClientConn
// }

// func NewMetadataClient(address string) (MetadataClient, error) {
// 	// Configure gRPC connection with optimizations
// 	opts := []grpc.DialOption{
// 		grpc.WithTransportCredentials(insecure.NewCredentials()),
// 		grpc.WithKeepaliveParams(keepalive.ClientParameters{
// 			Time:                10 * time.Second, // Ping every 10 seconds
// 			Timeout:             time.Second,      // Ping timeout
// 			PermitWithoutStream: true,
// 		}),
// 		grpc.WithDefaultCallOptions(
// 			grpc.MaxCallRecvMsgSize(4*1024*1024), // 4MB max message size
// 		),
// 	}

// 	// Establish connection
// 	conn, err := grpc.Dial(address, opts...)
// 	if err != nil {
// 		return nil, fmt.Errorf("failed to connect to metadata service: %w", err)
// 	}

// 	// Create client
// 	client := pb.NewMetadataServiceClient(conn)

// 	return &metadataClient{
// 		client: client,
// 		conn:   conn,
// 	}, nil
// }

// func (c *metadataClient) EnrichTrack(ctx context.Context, title, artist, album string) (*models.SpotifyMetadata, error) {
// 	// Set timeout for the request
// 	ctx, cancel := context.WithTimeout(ctx, 10*time.Second)
// 	defer cancel()

// 	// Prepare request
// 	request := &pb.EnrichTrackRequest{
// 		Title:  title,
// 		Artist: artist,
// 		Album:  album,
// 	}

// 	// Make gRPC call
// 	response, err := c.client.EnrichTrack(ctx, request)
// 	if err != nil {
// 		return nil, fmt.Errorf("metadata enrichment failed: %w", err)
// 	}

// 	// Check if enrichment was successful
// 	if !response.Success {
// 		return nil, fmt.Errorf("metadata enrichment failed: %s", response.ErrorMessage)
// 	}

// 	// Convert protobuf response to internal model
// 	if response.Metadata == nil {
// 		return nil, fmt.Errorf("no metadata returned")
// 	}

// 	spotifyMetadata := &models.SpotifyMetadata{
// 		SpotifyID:    response.Metadata.SpotifyId,
// 		Title:        response.Metadata.Title,
// 		Artist:       response.Metadata.Artist,
// 		Album:        response.Metadata.Album,
// 		Genres:       response.Metadata.Genres,
// 		ReleaseDate:  response.Metadata.ReleaseDate,
// 		AlbumArtURL:  response.Metadata.AlbumArtUrl,
// 		PreviewURL:   response.Metadata.PreviewUrl,
// 		DurationMS:   int(response.Metadata.DurationMs),
// 		Popularity:   response.Metadata.Popularity,
// 		Confidence:   response.Metadata.Confidence,
// 	}

// 	return spotifyMetadata, nil
// }

// func (c *metadataClient) Close() error {
// 	if c.conn != nil {
// 		return c.conn.Close()
// 	}
// 	return nil
// }

package grpc

import (
	"context"
	"fmt"

	"musicservice/internal/models"
)

// MetadataClient interface for metadata enrichment
type MetadataClient interface {
	EnrichTrack(ctx context.Context, title, artist, album string) (*models.SpotifyMetadata, error)
	Close() error
}

// stubMetadataClient is a stub implementation for MVP
type stubMetadataClient struct{}

// NewMetadataClient creates a stub metadata client for MVP
func NewMetadataClient(address string) (MetadataClient, error) {
	// For MVP, return stub client instead of real gRPC client
	return &stubMetadataClient{}, nil
}

// EnrichTrack returns nil (no enrichment) for MVP
func (c *stubMetadataClient) EnrichTrack(ctx context.Context, title, artist, album string) (*models.SpotifyMetadata, error) {
	// For MVP, we don't enrich metadata - just return nil
	// This means tracks will only have basic ID3 metadata
	return nil, fmt.Errorf("metadata enrichment not available in MVP mode")
}

// Close does nothing for stub client
func (c *stubMetadataClient) Close() error {
	return nil
}
