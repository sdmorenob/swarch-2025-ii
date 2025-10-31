package database

import (
	"context"
	"database/sql"
	"fmt"
	"time"

	_ "github.com/lib/pq"
)

type Config struct {
	DBDriver          string
	DBSource          string
	MaxOpenConns      int
	MaxIdleConns      int
	ConnMaxIdleTime   time.Duration
	ConnectionTimeout time.Duration
}

type SQLClient struct {
	DB *sql.DB
}

// NewSQLClient creates a new database client with the given configuration.
func NewSQLClient(cfg Config) (*SQLClient, error) {
	db, err := sql.Open(cfg.DBDriver, cfg.DBSource)
	if err != nil {
		return nil, fmt.Errorf("database connection failed: %w", err)
	}

	// Set connection pool settings
	db.SetMaxOpenConns(cfg.MaxOpenConns)
	db.SetMaxIdleConns(cfg.MaxIdleConns)
	db.SetConnMaxIdleTime(cfg.ConnMaxIdleTime)

	// Ping the database to verify the connection
	ctx, cancel := context.WithTimeout(context.Background(), cfg.ConnectionTimeout)
	defer cancel()

	if err := db.PingContext(ctx); err != nil {
		return nil, fmt.Errorf("database ping failed: %w", err)
	}

	return &SQLClient{DB: db}, nil
}

// Close terminates the database connection.
func (client *SQLClient) Close() error {
	if client.DB != nil {
		return client.DB.Close()
	}

	return nil
}
