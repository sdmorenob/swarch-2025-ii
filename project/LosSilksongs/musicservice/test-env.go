package main

import (
	"context"
	"fmt"
	"log"
	"time"

	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
)

func main() {
	fmt.Println("🧪 Testing MusicService Environment...")

	// Test 1: Go version
	fmt.Println("✅ Go is working!")

	// Test 2: MongoDB connection
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	client, err := mongo.Connect(ctx, options.Client().ApplyURI("mongodb://localhost:27017"))
	if err != nil {
		log.Printf("❌ MongoDB connection failed: %v", err)
		log.Println("💡 Make sure MongoDB is running:")
		log.Println("   - Local: Start MongoDB service")
		log.Println("   - Docker: docker run --name mongodb -p 27017:27017 -d mongo:latest")
	} else {
		defer client.Disconnect(ctx)
		if err = client.Ping(ctx, nil); err != nil {
			log.Printf("❌ MongoDB ping failed: %v", err)
		} else {
			fmt.Println("✅ MongoDB connection successful!")
		}
	}

	fmt.Println("🎉 Environment test complete!")
}
