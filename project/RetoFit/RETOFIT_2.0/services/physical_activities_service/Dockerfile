# Etapa 1: Builder
FROM golang:1.25.1-alpine AS builder

# Instala dependencias necesarias para compilación
RUN apk add --no-cache git ca-certificates tzdata

# Directorio de trabajo
WORKDIR /app

# Copia archivos de dependencias
COPY go.mod go.sum* ./

# Descarga dependencias (con caché)
RUN go mod download

# Copia el código fuente
COPY . .

# Copia el archivo de configuración (ajusta la ruta)
RUN mkdir -p configs && \
    if [ -f configs/dev.env ]; then cp configs/dev.env ./dev.env; fi

# Compila el binario con optimizaciones
RUN CGO_ENABLED=0 GOOS=linux GOARCH=amd64 go build \
    -ldflags='-w -s -extldflags "-static"' \
    -a -installsuffix cgo \
    -o main ./cmd/rest_api/main.go

# Etapa 2: Imagen final (mínima)
FROM alpine:latest

# Instala certificados CA y timezone
RUN apk --no-cache add ca-certificates tzdata

# Crea usuario no-root
RUN addgroup -g 1000 appuser && \
    adduser -D -u 1000 -G appuser appuser

WORKDIR /app

# Copia el binario desde el builder
COPY --from=builder /app/main .

# Cambia ownership
RUN chown -R appuser:appuser /app

# Usa usuario no-root
USER appuser

# Expone el puerto
EXPOSE 8002

# Ejecuta el binario
CMD ["./main"]