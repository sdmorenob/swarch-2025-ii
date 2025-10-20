echo "Generating protobuf files..."

# Check if protoc is installed
if ! command -v protoc &> /dev/null; then
    echo "Error: protoc (Protocol Buffers compiler) is not installed"
    echo "Please install it:"
    echo "  macOS: brew install protobuf"
    echo "  Ubuntu/Debian: apt-get install protobuf-compiler"
    echo "  Or download from: https://github.com/protocolbuffers/protobuf/releases"
    exit 1
fi

# Check if Go protoc plugins are installed
if ! command -v protoc-gen-go &> /dev/null; then
    echo "Installing protoc-gen-go..."
    go install google.golang.org/protobuf/cmd/protoc-gen-go@latest
fi

if ! command -v protoc-gen-go-grpc &> /dev/null; then
    echo "Installing protoc-gen-go-grpc..."
    go install google.golang.org/grpc/cmd/protoc-gen-go-grpc@latest
fi

# Generate protobuf files
echo "Generating Go files from proto definitions..."

protoc --go_out=. --go_opt=paths=source_relative \
       --go-grpc_out=. --go-grpc_opt=paths=source_relative \
       proto/metadata/metadata.proto

if [ $? -eq 0 ]; then
    echo "✅ Protobuf files generated successfully!"
    echo "Generated files:"
    echo "  - proto/metadata/metadata.pb.go"
    echo "  - proto/metadata/metadata_grpc.pb.go"
else
    echo "❌ Failed to generate protobuf files"
    exit 1
fi