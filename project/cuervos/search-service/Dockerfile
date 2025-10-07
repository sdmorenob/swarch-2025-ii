# Build stage: compila el binario Go en una imagen con toolchain
FROM golang:1.21-alpine AS builder

# Set working directory
WORKDIR /app

# Install git and CA certificates (needed for go mod download over HTTPS)
RUN apk add --no-cache git ca-certificates && update-ca-certificates

# Configura proxy y sum database públicos para resolver dependencias
ENV GOPROXY=https://proxy.golang.org GOSUMDB=sum.golang.org GONOSUMDB= 

# Copy go mod files (go.sum may not exist initially)
COPY go.mod ./

# Descarga dependencias declaradas en go.mod
RUN go mod download

# Copy source code
COPY . .

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
EXPOSE 8081

# Health check contra /health para orquestadores
HEALTHCHECK --interval=30s --timeout=30s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:8081/health || exit 1

# Ejecuta el binario
CMD ["./main"]