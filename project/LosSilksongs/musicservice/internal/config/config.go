package config

import (
	"fmt"
	"os"
	"strconv"
)

type Config struct {
	Environment string
	LogLevel    string
	Server      ServerConfig
	MongoDB     MongoDBConfig
	Storage     StorageConfig
	MetadataService MetadataServiceConfig
}

type ServerConfig struct {
	Address string
	Port    int
}

type MongoDBConfig struct {
	URI      string
	Database string
}

type StorageConfig struct {
	Type     string // "local" or "cloud"
	BasePath string
}

type MetadataServiceConfig struct {
	GRPCAddress string
	HTTPAddress string
}

func Load() (*Config, error) {
	cfg := &Config{
		Environment: getEnv("ENVIRONMENT", "development"),
		LogLevel:    getEnv("LOG_LEVEL", "info"),
		Server: ServerConfig{
			Port:    getEnvAsInt("SERVER_PORT", 8081),
		},
		MongoDB: MongoDBConfig{
			URI:      getEnv("MONGODB_URI", "mongodb://localhost:27017"),
			Database: getEnv("MONGODB_DATABASE", "musicshare"),
		},
		Storage: StorageConfig{
			Type:     getEnv("STORAGE_TYPE", "local"),
			BasePath: getEnv("STORAGE_PATH", "./uploads"),
		},
		MetadataService: MetadataServiceConfig{
			GRPCAddress: getEnv("METADATA_SERVICE_GRPC", "localhost:50051"),
			HTTPAddress: getEnv("METADATA_SERVICE_HTTP", "http://localhost:8082"),
		},
	}

	cfg.Server.Address = fmt.Sprintf(":%d", cfg.Server.Port)

	// Create uploads directory if it doesn't exist
	if err := os.MkdirAll(cfg.Storage.BasePath, 0755); err != nil {
		return nil, fmt.Errorf("failed to create storage directory: %w", err)
	}

	// Create subdirectories
	subdirs := []string{"audio", "temp", "covers"}
	for _, subdir := range subdirs {
		path := fmt.Sprintf("%s/%s", cfg.Storage.BasePath, subdir)
		if err := os.MkdirAll(path, 0755); err != nil {
			return nil, fmt.Errorf("failed to create storage subdirectory %s: %w", subdir, err)
		}
	}

	return cfg, nil
}

func getEnv(key, defaultValue string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return defaultValue
}

func getEnvAsInt(key string, defaultValue int) int {
	if value := os.Getenv(key); value != "" {
		if intValue, err := strconv.Atoi(value); err == nil {
			return intValue
		}
	}
	return defaultValue
}