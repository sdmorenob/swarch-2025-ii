package mongodb

import (
	"context"
	"fmt"
	"time"

	"musicservice/internal/models"
	"musicservice/internal/repository"

	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
)

type playlistRepository struct {
	playlistCollection *mongo.Collection
	trackCollection    *mongo.Collection
}

// NewPlaylistRepository creates a new playlist repository
func NewPlaylistRepository(client *mongo.Client, dbName string) repository.PlaylistRepository {
	db := GetDatabase(client, dbName)
	playlistCollection := GetCollection(db, "playlists")
	trackCollection := GetCollection(db, "tracks")

	// Create indexes
	go createPlaylistIndexes(playlistCollection)

	return &playlistRepository{
		playlistCollection: playlistCollection,
		trackCollection:    trackCollection,
	}
}

func (r *playlistRepository) Create(ctx context.Context, playlist *models.Playlist) error {
	if playlist.ID.IsZero() {
		playlist.ID = primitive.NewObjectID()
	}

	playlist.CreatedAt = time.Now()
	playlist.UpdatedAt = time.Now()

	_, err := r.playlistCollection.InsertOne(ctx, playlist)
	if err != nil {
		return fmt.Errorf("failed to create playlist: %w", err)
	}

	return nil
}

func (r *playlistRepository) GetByID(ctx context.Context, id primitive.ObjectID) (*models.Playlist, error) {
	var playlist models.Playlist

	err := r.playlistCollection.FindOne(ctx, bson.M{"_id": id}).Decode(&playlist)
	if err != nil {
		if err == mongo.ErrNoDocuments {
			return nil, fmt.Errorf("playlist not found")
		}
		return nil, fmt.Errorf("failed to get playlist: %w", err)
	}

	return &playlist, nil
}

func (r *playlistRepository) GetWithTracks(ctx context.Context, id primitive.ObjectID) (*models.PlaylistWithTracks, error) {
	// Get playlist first
	playlist, err := r.GetByID(ctx, id)
	if err != nil {
		return nil, err
	}

	// If no tracks, return playlist with empty tracks array
	if len(playlist.TrackIDs) == 0 {
		return &models.PlaylistWithTracks{
			Playlist: *playlist,
			Tracks:   []models.Track{},
		}, nil
	}

	// Get tracks using aggregation pipeline
	pipeline := []bson.M{
		{
			"$match": bson.M{"_id": bson.M{"$in": playlist.TrackIDs}},
		},
		{
			"$addFields": bson.M{
				"__order": bson.M{
					"$indexOfArray": []interface{}{playlist.TrackIDs, "$_id"},
				},
			},
		},
		{
			"$sort": bson.M{"__order": 1},
		},
		{
			"$unset": "__order",
		},
	}

	cursor, err := r.trackCollection.Aggregate(ctx, pipeline)
	if err != nil {
		return nil, fmt.Errorf("failed to get playlist tracks: %w", err)
	}
	defer cursor.Close(ctx)

	var tracks []models.Track
	for cursor.Next(ctx) {
		var track models.Track
		if err := cursor.Decode(&track); err != nil {
			return nil, fmt.Errorf("failed to decode track: %w", err)
		}
		tracks = append(tracks, track)
	}

	if err := cursor.Err(); err != nil {
		return nil, fmt.Errorf("cursor error: %w", err)
	}

	return &models.PlaylistWithTracks{
		Playlist: *playlist,
		Tracks:   tracks,
	}, nil
}

func (r *playlistRepository) Update(ctx context.Context, playlist *models.Playlist) error {
	playlist.UpdatedAt = time.Now()

	filter := bson.M{"_id": playlist.ID}
	update := bson.M{"$set": playlist}

	result, err := r.playlistCollection.UpdateOne(ctx, filter, update)
	if err != nil {
		return fmt.Errorf("failed to update playlist: %w", err)
	}

	if result.MatchedCount == 0 {
		return fmt.Errorf("playlist not found")
	}

	return nil
}

func (r *playlistRepository) Delete(ctx context.Context, id primitive.ObjectID) error {
	filter := bson.M{"_id": id}

	result, err := r.playlistCollection.DeleteOne(ctx, filter)
	if err != nil {
		return fmt.Errorf("failed to delete playlist: %w", err)
	}

	if result.DeletedCount == 0 {
		return fmt.Errorf("playlist not found")
	}

	return nil
}

func (r *playlistRepository) List(ctx context.Context, filter models.PlaylistFilter) ([]*models.Playlist, int64, error) {
	// Build MongoDB filter
	mongoFilter := bson.M{}

	if filter.CreatorID != "" {
		mongoFilter["creator_id"] = filter.CreatorID
	}

	if filter.IsPublic != nil {
		mongoFilter["is_public"] = *filter.IsPublic
	}

	if filter.Search != "" {
		mongoFilter["$or"] = []bson.M{
			{"name": bson.M{"$regex": filter.Search, "$options": "i"}},
			{"description": bson.M{"$regex": filter.Search, "$options": "i"}},
		}
	}

	// Count total documents
	total, err := r.playlistCollection.CountDocuments(ctx, mongoFilter)
	if err != nil {
		return nil, 0, fmt.Errorf("failed to count playlists: %w", err)
	}

	// Calculate pagination
	skip := (filter.Page - 1) * filter.Limit

	// Set up query options
	opts := options.Find()
	opts.SetSkip(int64(skip))
	opts.SetLimit(int64(filter.Limit))
	opts.SetSort(bson.M{"created_at": -1}) // Sort by newest first

	// Execute query
	cursor, err := r.playlistCollection.Find(ctx, mongoFilter, opts)
	if err != nil {
		return nil, 0, fmt.Errorf("failed to find playlists: %w", err)
	}
	defer cursor.Close(ctx)

	// Decode results
	var playlists []*models.Playlist
	for cursor.Next(ctx) {
		var playlist models.Playlist
		if err := cursor.Decode(&playlist); err != nil {
			return nil, 0, fmt.Errorf("failed to decode playlist: %w", err)
		}
		playlists = append(playlists, &playlist)
	}

	if err := cursor.Err(); err != nil {
		return nil, 0, fmt.Errorf("cursor error: %w", err)
	}

	return playlists, total, nil
}

func (r *playlistRepository) GetByCreatorID(ctx context.Context, creatorID string, filter models.PaginationQuery) ([]*models.Playlist, int64, error) {
	playlistFilter := models.PlaylistFilter{
		PaginationQuery: filter,
		CreatorID:       creatorID,
	}

	return r.List(ctx, playlistFilter)
}

func (r *playlistRepository) AddTrack(ctx context.Context, playlistID, trackID primitive.ObjectID) error {
	// Use MongoDB's $addToSet to avoid duplicates and $inc to update counters
	// pipeline := []bson.M{
	// 	{
	// 		"$set": bson.M{
	// 			"track_ids":   bson.M{"$concatArrays": []interface{}{"$track_ids", []primitive.ObjectID{trackID}}},
	// 			"track_count": bson.M{"$add": []interface{}{"$track_count", 1}},
	// 			"updated_at":  time.Now(),
	// 		},
	// 	},
	// }

	// First, check if track is not already in the playlist
	filter := bson.M{
		"_id":       playlistID,
		"track_ids": bson.M{"$ne": trackID},
	}

	update := bson.M{
		"$addToSet": bson.M{"track_ids": trackID},
		"$inc":      bson.M{"track_count": 1},
		"$set":      bson.M{"updated_at": time.Now()},
	}

	result, err := r.playlistCollection.UpdateOne(ctx, filter, update)
	if err != nil {
		return fmt.Errorf("failed to add track to playlist: %w", err)
	}

	if result.MatchedCount == 0 {
		return fmt.Errorf("playlist not found or track already exists in playlist")
	}

	// Update total duration (optional - could be calculated on demand)
	go r.updatePlaylistDuration(ctx, playlistID)

	return nil
}

func (r *playlistRepository) RemoveTrack(ctx context.Context, playlistID, trackID primitive.ObjectID) error {
	filter := bson.M{
		"_id":       playlistID,
		"track_ids": trackID, // Ensure track exists in playlist
	}

	update := bson.M{
		"$pull": bson.M{"track_ids": trackID},
		"$inc":  bson.M{"track_count": -1},
		"$set":  bson.M{"updated_at": time.Now()},
	}

	result, err := r.playlistCollection.UpdateOne(ctx, filter, update)
	if err != nil {
		return fmt.Errorf("failed to remove track from playlist: %w", err)
	}

	if result.MatchedCount == 0 {
		return fmt.Errorf("playlist not found or track not in playlist")
	}

	// Update total duration
	go r.updatePlaylistDuration(ctx, playlistID)

	return nil
}

// Helper function to update playlist duration (runs asynchronously)
func (r *playlistRepository) updatePlaylistDuration(ctx context.Context, playlistID primitive.ObjectID) {
	// Get playlist to get track IDs
	playlist, err := r.GetByID(ctx, playlistID)
	if err != nil {
		return
	}

	if len(playlist.TrackIDs) == 0 {
		// No tracks, set duration to 0
		r.playlistCollection.UpdateOne(ctx,
			bson.M{"_id": playlistID},
			bson.M{"$set": bson.M{"total_duration": 0}},
		)
		return
	}

	// Aggregate total duration from tracks
	pipeline := []bson.M{
		{
			"$match": bson.M{"_id": bson.M{"$in": playlist.TrackIDs}},
		},
		{
			"$group": bson.M{
				"_id": nil,
				"total_duration": bson.M{
					"$sum": "$original_metadata.duration",
				},
			},
		},
	}

	cursor, err := r.trackCollection.Aggregate(ctx, pipeline)
	if err != nil {
		return
	}
	defer cursor.Close(ctx)

	var result struct {
		TotalDuration int `bson:"total_duration"`
	}

	if cursor.Next(ctx) {
		cursor.Decode(&result)
		// Update playlist with calculated duration
		r.playlistCollection.UpdateOne(ctx,
			bson.M{"_id": playlistID},
			bson.M{"$set": bson.M{"total_duration": result.TotalDuration}},
		)
	}
}

// createPlaylistIndexes creates necessary indexes for the playlists collection
func createPlaylistIndexes(collection *mongo.Collection) {
	ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
	defer cancel()

	indexes := []mongo.IndexModel{
		{
			Keys: bson.D{{Key: "creator_id", Value: 1}},
		},
		{
			Keys: bson.D{{Key: "created_at", Value: -1}},
		},
		{
			Keys: bson.D{{Key: "is_public", Value: 1}},
		},
		{
			Keys: bson.D{{Key: "is_collaborative", Value: 1}},
		},
		{
			Keys: bson.D{
				{Key: "name", Value: "text"},
				{Key: "description", Value: "text"},
			},
		},
		{
			Keys: bson.D{{Key: "track_ids", Value: 1}},
		},
	}

	_, err := collection.Indexes().CreateMany(ctx, indexes)
	if err != nil {
		// Log error but don't fail the application
		fmt.Printf("Warning: Failed to create playlist indexes: %v\n", err)
	}
}
