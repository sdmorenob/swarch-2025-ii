# Makefile for Music Service

# Variables
APP_NAME=music-service
DOCKER_IMAGE=musicshare/music-service
GO_VERSION=1.21

# Default target
.PHONY: help
help:
	@echo "Available commands:"
	@echo "  build          - Build the Go application"
	@echo "  run            - Run the application locally"
	@echo "  test           - Run tests"
	@echo "  docker-build   - Build Docker image"
	@echo "  docker-run     - Run Docker container"
	@echo "  proto-gen      - Generate protobuf files"
	@echo "  swagger-gen    - Generate Swagger documentation"
	@echo "  clean          - Clean build artifacts"
	@echo "  deps           - Download dependencies"
	@echo "  lint           - Run linter"

# Build the application
.PHONY: build
build:
	@echo "Building $(APP_NAME)..."
	CGO_ENABLED=0 GOOS=linux go build -a -installsuffix cgo -o bin/$(APP_NAME) ./cmd/server

# Run the application locally
.PHONY: run
run:
	@echo "Running $(APP_NAME)..."
	go run ./cmd/server

# Run tests
.PHONY: test
test:
	@echo "Running tests..."
	go test -v ./...

# Run tests with coverage
.PHONY: test-coverage
test-coverage:
	@echo "Running tests with coverage..."
	go test -v -coverprofile=coverage.out ./...
	go tool cover -html=coverage.out -o coverage.html

# Build Docker image
.PHONY: docker-build
docker-build:
	@echo "Building Docker image..."
	docker build -t $(DOCKER_IMAGE):latest .

# Run Docker container
.PHONY: docker-run
docker-run:
	@echo "Running Docker container..."
	docker run -p 8081:8081 --name $(APP_NAME) $(DOCKER_IMAGE):latest

# Generate protobuf files
.PHONY: proto-gen
proto-gen:
	@echo "Generating protobuf files..."
	@if command -v protoc >/dev/null 2>&1; then \
		protoc --go_out=. --go_opt=paths=source_relative \
		       --go-grpc_out=. --go-grpc_opt=paths=source_relative \
		       proto/metadata/metadata.proto; \
	else \
		echo "protoc not found. Please install Protocol Buffers compiler."; \
		echo "On macOS: brew install protobuf"; \
		echo "On Ubuntu: apt-get install protobuf-compiler"; \
	fi

# Generate Swagger documentation
.PHONY: swagger-gen
swagger-gen:
	@echo "Generating Swagger documentation..."
	@if command -v swag >/dev/null 2>&1; then \
		swag init -g cmd/server/main.go -o docs --parseDependency --parseInternal; \
		echo "✅ Swagger docs generated in docs/"; \
	else \
		echo "Installing swag..."; \
		go install github.com/swaggo/swag/cmd/swag@latest; \
		swag init -g cmd/server/main.go -o docs --parseDependency --parseInternal; \
	fi

# Format Swagger comments
.PHONY: swagger-fmt
swagger-fmt:
	@echo "Formatting Swagger comments..."
	@if command -v swag >/dev/null 2>&1; then \
		swag fmt; \
	else \
		echo "swag not found. Run 'make swagger-gen' first."; \
	fi

# Clean build artifacts
.PHONY: clean
clean:
	@echo "Cleaning..."
	rm -rf bin/
	rm -rf docs/
	rm -f coverage.out coverage.html
	docker rmi $(DOCKER_IMAGE):latest 2>/dev/null || true

# Download dependencies
.PHONY: deps
deps:
	@echo "Downloading dependencies..."
	go mod download
	go mod tidy

# Run linter (requires golangci-lint)
.PHONY: lint
lint:
	@if command -v golangci-lint >/dev/null 2>&1; then \
		echo "Running linter..."; \
		golangci-lint run; \
	else \
		echo "golangci-lint not found. Install it from https://golangci-lint.run/"; \
	fi

# Development setup
.PHONY: dev-setup
dev-setup:
	@echo "Setting up development environment..."
	go mod download
	@echo "Creating uploads directory..."
	mkdir -p uploads/audio uploads/temp uploads/covers
	@echo "Generating Swagger documentation..."
	$(MAKE) swagger-gen

# Format code
.PHONY: fmt
fmt:
	@echo "Formatting code..."
	go fmt ./...

# Install tools
.PHONY: install-tools
install-tools:
	@echo "Installing development tools..."
	go install google.golang.org/protobuf/cmd/protoc-gen-go@latest
	go install google.golang.org/grpc/cmd/protoc-gen-go-grpc@latest
	go install github.com/swaggo/swag/cmd/swag@latest
	@echo "✅ All tools installed"

# Run with hot reload (requires air)
.PHONY: dev
dev:
	@echo "Running with hot reload..."
	@if command -v air >/dev/null 2>&1; then \
		air; \
	else \
		echo "Installing air..."; \
		go install github.com/cosmtrek/air@latest; \
		air; \
	fi

# Clean uploads directory
.PHONY: clean-uploads
clean-uploads:
	@echo "Cleaning uploads directory..."
	rm -rf uploads/audio/* uploads/temp/* uploads/covers/*

# Docker Compose commands
.PHONY: docker-compose-up
docker-compose-up:
	@echo "Starting services with docker-compose..."
	docker-compose up -d

.PHONY: docker-compose-down
docker-compose-down:
	@echo "Stopping services..."
	docker-compose down

.PHONY: docker-compose-logs
docker-compose-logs:
	@echo "Showing logs..."
	docker-compose logs -f music-service

# All-in-one: generate docs and run
.PHONY: serve
serve: swagger-gen
	@echo "Starting server with updated Swagger docs..."
	go run ./cmd/server