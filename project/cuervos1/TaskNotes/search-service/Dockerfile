# Build stage: compila el binario Go en una imagen con toolchain
FROM golang:1.23-alpine AS builder

# Set working directory
WORKDIR /app

# Install git, CA certificates y protoc (para generar código gRPC)
RUN apk add --no-cache git ca-certificates protobuf && update-ca-certificates

# Configura proxy y sum database públicos para resolver dependencias
ENV GOPROXY=https://proxy.golang.org GOSUMDB=sum.golang.org GONOSUMDB=

# Instala plugins de protoc para Go y añade al PATH. Pin a versiones que soportan Go 1.23
# para evitar exigir toolchains más recientes durante la instalación.
RUN go install google.golang.org/protobuf/cmd/protoc-gen-go@v1.33.0 && \
  go install google.golang.org/grpc/cmd/protoc-gen-go-grpc@v1.3.0
ENV PATH="/go/bin:${PATH}"

# Copy go mod files (go.sum may not exist initially)
COPY go.mod ./

# Descarga dependencias declaradas en go.mod
RUN go mod download

# Copy source code
COPY . .

# Copia archivos .proto locales al contexto
COPY proto ./proto

# Genera código gRPC en Go dentro de grpc/generated en subcarpetas separadas
RUN mkdir -p grpc/generated/common grpc/generated/notes grpc/generated/tasks && \
    protoc --proto_path=./proto \
      --go_out=./grpc/generated/common --go_opt=paths=source_relative \
      ./proto/common.proto && \
    protoc --proto_path=./proto \
      --go_out=./grpc/generated/notes --go_opt=paths=source_relative \
      --go-grpc_out=./grpc/generated/notes --go-grpc_opt=paths=source_relative \
      ./proto/notes_search.proto && \
    protoc --proto_path=./proto \
      --go_out=./grpc/generated/tasks --go_opt=paths=source_relative \
      --go-grpc_out=./grpc/generated/tasks --go-grpc_opt=paths=source_relative \
      ./proto/tasks_search.proto

# Asegura que los módulos estén consistentes tras copiar el código
RUN go mod tidy

# Compila el binario estático para linux (sin CGO)
RUN CGO_ENABLED=0 GOOS=linux go build -a -installsuffix cgo -o main .

# Final stage: imagen mínima para ejecutar el binario
FROM alpine:latest

# Install ca-certificates and curl for health checks
RUN apk --no-cache add ca-certificates curl

# Set working directory
WORKDIR /root/

# Copy the binary from builder stage
COPY --from=builder /app/main .

# Ejecutar como usuario no-root por seguridad
RUN adduser -D -s /bin/sh appuser
USER appuser

# Expose port
EXPOSE 8008

# Health check contra /health para orquestadores
HEALTHCHECK --interval=30s --timeout=30s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:8008/health || exit 1

# Ejecuta el binario
CMD ["./main"]