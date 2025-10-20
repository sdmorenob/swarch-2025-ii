#!/bin/bash

set -e

echo "🔨 Generating Swagger Documentation..."

# Check if swag is installed
if ! command -v swag &> /dev/null; then
    echo "📦 Installing swag..."
    go install github.com/swaggo/swag/cmd/swag@latest
    
    # Add GOPATH/bin to PATH if not already there
    if [[ ":$PATH:" != *":$HOME/go/bin:"* ]]; then
        export PATH=$PATH:$HOME/go/bin
    fi
fi

# Check swag version
echo "📌 Swag version: $(swag --version)"

# Clean old docs
echo "🧹 Cleaning old documentation..."
rm -rf docs/

# Generate new docs
echo "📝 Generating Swagger documentation..."
swag init \
    -g cmd/server/main.go \
    -o docs \
    --parseDependency \
    --parseInternal \
    --parseDepth 1

if [ $? -eq 0 ]; then
    echo "✅ Swagger documentation generated successfully!"
    echo ""
    echo "📂 Generated files:"
    echo "  - docs/docs.go"
    echo "  - docs/swagger.json"
    echo "  - docs/swagger.yaml"
    echo ""
    echo "🌐 After starting the server, visit:"
    echo "  http://localhost:8081/swagger/index.html"
else
    echo "❌ Failed to generate Swagger documentation"
    exit 1
fi