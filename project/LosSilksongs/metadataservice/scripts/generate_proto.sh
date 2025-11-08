#!/bin/bash

set -e

echo "🔨 Generating Python files from protobuf definitions..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if running from project root
if [ ! -f "proto/metadata.proto" ]; then
    echo -e "${RED}Error: Must run from project root directory${NC}"
    echo "Current directory: $(pwd)"
    exit 1
fi

# Check if Python is installed
if ! command -v python3 &> /dev/null; then
    echo -e "${RED}Error: Python 3 is not installed${NC}"
    exit 1
fi

# Check if grpc_tools is installed
if ! python3 -c "import grpc_tools" 2>/dev/null; then
    echo -e "${YELLOW}Installing grpc_tools...${NC}"
    pip install grpcio-tools
fi

# Create output directory if it doesn't exist
mkdir -p app/proto

# Create __init__.py for proto package
touch app/proto/__init__.py

# Generate Python files
echo "Generating Python protobuf files..."
python3 -m grpc_tools.protoc \
    -I./proto \
    --python_out=./app/proto \
    --grpc_python_out=./app/proto \
    proto/metadata.proto

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Protobuf files generated successfully!${NC}"
    echo ""
    echo "Generated files:"
    echo "  - app/proto/metadata_pb2.py"
    echo "  - app/proto/metadata_pb2_grpc.py"
    echo ""
    
    # Fix imports in generated files (Python import issue)
    if [[ "$OSTYPE" == "darwin"* ]]; then
        # macOS
        sed -i '' 's/import metadata_pb2/from proto import metadata_pb2/g' app/proto/metadata_pb2_grpc.py
    else
        # Linux
        sed -i 's/import metadata_pb2/from proto import metadata_pb2/g' app/proto/metadata_pb2_grpc.py
    fi
    
    echo -e "${GREEN}✅ Import paths fixed${NC}"
else
    echo -e "${RED}❌ Failed to generate protobuf files${NC}"
    exit 1
fi

echo ""
echo "You can now run the service with:"
echo "  python -m app.main"