# Makefile for Metadata Service

PYTHON := python3
PIP := $(PYTHON) -m pip
VENV := venv
VENV_BIN := $(VENV)/bin

.PHONY: help
help:
	@echo "Available commands:"
	@echo "  make install        - Install dependencies"
	@echo "  make install-dev    - Install dev dependencies"
	@echo "  make proto          - Generate protobuf files"
	@echo "  make run            - Run the service"
	@echo "  make test           - Run tests"
	@echo "  make lint           - Run linters"
	@echo "  make format         - Format code"
	@echo "  make clean          - Clean generated files"
	@echo "  make docker-build   - Build Docker image"
	@echo "  make docker-run     - Run Docker container"
	@echo "  make venv           - Create virtual environment"

.PHONY: venv
venv:
	@echo "Creating virtual environment..."
	$(PYTHON) -m venv $(VENV)
	@echo "Virtual environment created. Activate with: source $(VENV_BIN)/activate"

.PHONY: install
install:
	@echo "Installing dependencies..."
	$(PIP) install --upgrade pip
	$(PIP) install -r requirements.txt
	@echo "✅ Dependencies installed"

.PHONY: install-dev
install-dev: install
	@echo "Installing dev dependencies..."
	$(PIP) install -r requirements-dev.txt
	@echo "✅ Dev dependencies installed"

.PHONY: proto
proto:
	@echo "Generating protobuf files..."
	@bash scripts/generate_proto.sh

.PHONY: run
run:
	@echo "Starting Metadata Service..."
	$(PYTHON) -m app.main

.PHONY: test
test:
	@echo "Running tests..."
	$(PYTHON) -m pytest tests/ -v

.PHONY: test-cov
test-cov:
	@echo "Running tests with coverage..."
	$(PYTHON) -m pytest tests/ -v --cov=app --cov-report=html --cov-report=term

.PHONY: lint
lint:
	@echo "Running linters..."
	$(PYTHON) -m flake8 app/ tests/
	$(PYTHON) -m mypy app/

.PHONY: format
format:
	@echo "Formatting code..."
	$(PYTHON) -m black app/ tests/
	$(PYTHON) -m isort app/ tests/
	@echo "✅ Code formatted"

.PHONY: format-check
format-check:
	@echo "Checking code format..."
	$(PYTHON) -m black --check app/ tests/
	$(PYTHON) -m isort --check app/ tests/

.PHONY: clean
clean:
	@echo "Cleaning generated files..."
	rm -rf app/proto/*.py
	rm -rf app/proto/__pycache__
	rm -rf app/__pycache__
	rm -rf app/services/__pycache__
	rm -rf tests/__pycache__
	rm -rf .pytest_cache
	rm -rf htmlcov
	rm -rf .coverage
	rm -rf *.egg-info
	rm -rf dist
	rm -rf build
	find . -type d -name "__pycache__" -exec rm -rf {} + 2>/dev/null || true
	find . -type f -name "*.pyc" -delete
	@echo "✅ Cleaned"

.PHONY: docker-build
docker-build:
	@echo "Building Docker image..."
	docker build -t metadata-service:latest .
	@echo "✅ Docker image built"

.PHONY: docker-run
docker-run:
	@echo "Running Docker container..."
	docker run -p 50051:50051 --env-file .env metadata-service:latest

.PHONY: docker-stop
docker-stop:
	@echo "Stopping Docker container..."
	docker stop metadata-service || true
	docker rm metadata-service || true

.PHONY: setup
setup: venv install proto
	@echo "✅ Setup complete!"
	@echo ""
	@echo "Next steps:"
	@echo "1. Copy .env.example to .env"
	@echo "2. Configure your Spotify credentials in .env"
	@echo "3. Run: make run"

.PHONY: dev-setup
dev-setup: venv install-dev proto
	@echo "✅ Development setup complete!"