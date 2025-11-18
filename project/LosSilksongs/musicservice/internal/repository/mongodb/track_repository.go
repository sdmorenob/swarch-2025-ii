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

type trackRepository struct {
	collection *mongo.Collection
}

// NewTrackRepository creates a new track repository
func NewTrackRepository(client *mongo.Client, dbName string) repository.TrackRepository {
	db := GetDatabase(client, dbName)
	collection := GetCollection(db, "tracks")

	// Create indexes
	go createTrackIndexes(collection)

	return &trackRepository{
		collection: collection,
	}
}

func (r *trackRepository) Create(ctx context.Context, track *models.Track) error {
	if track.ID.IsZero() {
		track.ID = primitive.NewObjectID()
	}

	track.CreatedAt = time.Now()
	track.UpdatedAt = time.Now()

	_, err := r.collection.InsertOne(ctx, track)
	if err != nil {
		return fmt.Errorf("failed to create track: %w", err)
	}

	return nil
}

func (r *trackRepository) GetByID(ctx context.Context, id primitive.ObjectID) (*models.Track, error) {
	var track models.Track
	
	err := r.collection.FindOne(ctx, bson.M{"_id": id}).Decode(&track)
	if err != nil {
		if err == mongo.ErrNoDocuments {
			return nil, fmt.Errorf("track not found")
		}
		return nil, fmt.Errorf("failed to get track: %w", err)
	}

	return &track, nil
}

func (r *trackRepository) Update(ctx context.Context, track *models.Track) error {
	track.UpdatedAt = time.Now()
	
	filter := bson.M{"_id": track.ID}
	update := bson.M{"$set": track}
	
	result, err := r.collection.UpdateOne(ctx, filter, update)
	if err != nil {
		return fmt.Errorf("failed to update track: %w", err)
	}

	if result.MatchedCount == 0 {
		return fmt.Errorf("track not found")
	}

	return nil
}

func (r *trackRepository) Delete(ctx context.Context, id primitive.ObjectID) error {
	filter := bson.M{"_id": id}
	
	result, err := r.collection.DeleteOne(ctx, filter)
	if err != nil {
		return fmt.Errorf("failed to delete track: %w", err)
	}

	if result.DeletedCount == 0 {
		return fmt.Errorf("track not found")
	}

	return nil
}

func (r *trackRepository) List(ctx context.Context, filter models.TrackFilter) ([]*models.Track, int64, error) {
	// Build MongoDB filter
	mongoFilter := bson.M{}

	if filter.UserID != "" {
		mongoFilter["user_id"] = filter.UserID
	}

	if filter.Genre != "" {
		mongoFilter["$or"] = []bson.M{
			{"original_metadata.genre": bson.M{"$regex": filter.Genre, "$options": "i"}},
			{"enriched_metadata.genres": bson.M{"$in": []string{filter.Genre}}},
		}
	}

	if filter.Artist != "" {
		mongoFilter["$or"] = []bson.M{
			{"original_metadata.artist": bson.M{"$regex": filter.Artist, "$options": "i"}},
			{"enriched_metadata.artist": bson.M{"$regex": filter.Artist, "$options": "i"}},
		}
	}

	if filter.IsPublic != nil {
		mongoFilter["is_public"] = *filter.IsPublic
	}

	if filter.Search != "" {
		mongoFilter["$or"] = []bson.M{
			{"original_metadata.title": bson.M{"$regex": filter.Search, "$options": "i"}},
			{"original_metadata.artist": bson.M{"$regex": filter.Search, "$options": "i"}},
			{"original_metadata.album": bson.M{"$regex": filter.Search, "$options": "i"}},
			{"enriched_metadata.title": bson.M{"$regex": filter.Search, "$options": "i"}},
			{"enriched_metadata.artist": bson.M{"$regex": filter.Search, "$options": "i"}},
			{"enriched_metadata.album": bson.M{"$regex": filter.Search, "$options": "i"}},
			{"tags": bson.M{"$in": []string{filter.Search}}},
		}
	}

	// Count total documents
	total, err := r.collection.CountDocuments(ctx, mongoFilter)
	if err != nil {
		return nil, 0, fmt.Errorf("failed to count tracks: %w", err)
	}

	// Calculate pagination
	skip := (filter.Page - 1) * filter.Limit

	// Set up query options
	opts := options.Find()
	opts.SetSkip(int64(skip))
	opts.SetLimit(int64(filter.Limit))
	opts.SetSort(bson.M{"created_at": -1}) // Sort by newest first

	// Execute query
	cursor, err := r.collection.Find(ctx, mongoFilter, opts)
	if err != nil {
		return nil, 0, fmt.Errorf("failed to find tracks: %w", err)
	}
	defer cursor.Close(ctx)

	// Decode results
	var tracks []*models.Track
	for cursor.Next(ctx) {
		var track models.Track
		if err := cursor.Decode(&track); err != nil {
			return nil, 0, fmt.Errorf("failed to decode track: %w", err)
		}
		tracks = append(tracks, &track)
	}

	if err := cursor.Err(); err != nil {
		return nil, 0, fmt.Errorf("cursor error: %w", err)
	}

	return tracks, total, nil
}

func (r *trackRepository) GetByUserID(ctx context.Context, userID string, filter models.PaginationQuery) ([]*models.Track, int64, error) {
	trackFilter := models.TrackFilter{
		PaginationQuery: filter,
		UserID:         userID,
	}
	
	return r.List(ctx, trackFilter)
}

// createTrackIndexes creates necessary indexes for the tracks collection
func createTrackIndexes(collection *mongo.Collection) {
	ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
	defer cancel()

	indexes := []mongo.IndexModel{
		{
			Keys: bson.D{{Key: "user_id", Value: 1}},
		},
		{
			Keys: bson.D{{Key: "created_at", Value: -1}},
		},
		{
			Keys: bson.D{{Key: "is_public", Value: 1}},
		},
		{
			Keys: bson.D{{Key: "upload_status", Value: 1}},
		},
		{
			Keys: bson.D{
				{Key: "original_metadata.title", Value: "text"},
				{Key: "original_metadata.artist", Value: "text"},
				{Key: "original_metadata.album", Value: "text"},
				{Key: "enriched_metadata.title", Value: "text"},
				{Key: "enriched_metadata.artist", Value: "text"},
				{Key: "enriched_metadata.album", Value: "text"},
			},
		},
	}

	_, err := collection.Indexes().CreateMany(ctx, indexes)
	if err != nil {
		// Log error but don't fail the application
		fmt.Printf("Warning: Failed to create track indexes: %v\n", err)
	}
}