package mongodb

import (
	"context"
	"fmt"
	"time"

	"musicservice/pkg/logger"

	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
	"go.mongodb.org/mongo-driver/mongo/readpref"
)

// Connect establishes a connection to MongoDB
func Connect(uri string) (*mongo.Client, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	// Configure client options
	clientOptions := options.Client().ApplyURI(uri)

	// Set connection pool settings
	clientOptions.SetMaxPoolSize(20)
	clientOptions.SetMinPoolSize(5)
	clientOptions.SetMaxConnIdleTime(30 * time.Second)

	logger.Infof("Connecting to MongoDB at %s", uri)

	// Connect to MongoDB
	client, err := mongo.Connect(ctx, clientOptions)
	if err != nil {
		return nil, fmt.Errorf("failed to connect to MongoDB: %w", err)
	}

	// Ping the database to verify connection
	ctx, cancel = context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	if err := client.Ping(ctx, readpref.Primary()); err != nil {
		return nil, fmt.Errorf("failed to ping MongoDB: %w", err)
	}

	logger.Info("Successfully connected to MongoDB")
	return client, nil
}

// Disconnect closes the MongoDB connection
func Disconnect(client *mongo.Client) error {
	if client == nil {
		return nil
	}

	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	logger.Info("Disconnecting from MongoDB")
	return client.Disconnect(ctx)
}

// GetDatabase returns a database instance
func GetDatabase(client *mongo.Client, name string) *mongo.Database {
	return client.Database(name)
}

// GetCollection returns a collection instance
func GetCollection(db *mongo.Database, name string) *mongo.Collection {
	return db.Collection(name)
}
