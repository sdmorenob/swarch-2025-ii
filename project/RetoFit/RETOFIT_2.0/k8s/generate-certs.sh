#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

print_success() {
    echo -e "${GREEN}✓${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

print_error() {
    echo -e "${RED}✗${NC} $1"
}

print_info() {
    echo -e "${NC}ℹ${NC} $1"
}

echo "=========================================="
echo "  Generador de Certificados TLS (Local)"
echo "=========================================="
echo ""

# Check if openssl is installed
if ! command -v openssl &> /dev/null; then
    print_error "OpenSSL no está instalado"
    echo "Instálalo con: sudo apt-get install openssl (Linux) o brew install openssl (Mac)"
    exit 1
fi

# Create nginx/tls directory if it doesn't exist
NGINX_TLS_DIR="../nginx/tls"
mkdir -p "$NGINX_TLS_DIR"

print_info "Directorio de certificados: $NGINX_TLS_DIR"
echo ""

# Check if certificates already exist
if [ -f "$NGINX_TLS_DIR/nginx.pem" ] && [ -f "$NGINX_TLS_DIR/nginx-key.pem" ]; then
    print_warning "Los certificados ya existen"
    read -p "¿Deseas regenerarlos? (s/n): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Ss]$ ]]; then
        print_info "Operación cancelada"
        exit 0
    fi
    rm -f "$NGINX_TLS_DIR/nginx.pem" "$NGINX_TLS_DIR/nginx-key.pem"
fi

# Generate private key
print_info "Generando clave privada RSA (2048 bits)..."
openssl genrsa -out "$NGINX_TLS_DIR/nginx-key.pem" 2048 2>/dev/null
if [ $? -eq 0 ]; then
    print_success "Clave privada generada: nginx-key.pem"
else
    print_error "Error al generar la clave privada"
    exit 1
fi

# Generate self-signed certificate
print_info "Generando certificado autofirmado..."
openssl req -new -x509 -sha256 \
    -key "$NGINX_TLS_DIR/nginx-key.pem" \
    -out "$NGINX_TLS_DIR/nginx.pem" \
    -days 365 \
    -subj "/C=CO/ST=Cundinamarca/L=Bogota/O=RetoFit/OU=Development/CN=localhost" \
    -addext "subjectAltName=DNS:localhost,DNS:*.localhost,IP:127.0.0.1" \
    2>/dev/null

if [ $? -eq 0 ]; then
    print_success "Certificado autofirmado generado: nginx.pem"
else
    print_error "Error al generar el certificado"
    exit 1
fi

echo ""
print_success "Certificados TLS generados exitosamente"
echo ""

# Display certificate info
print_info "Información del certificado:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
openssl x509 -in "$NGINX_TLS_DIR/nginx.pem" -noout -subject -issuer -dates -ext subjectAltName 2>/dev/null | sed 's/^/  /'
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

print_warning "IMPORTANTE: Este es un certificado autofirmado para desarrollo local"
print_warning "Los navegadores mostrarán advertencias de seguridad - esto es normal"
print_warning "NO uses estos certificados en producción"
echo ""

print_info "Para confiar en el certificado en tu navegador:"
echo "  1. Abre https://localhost en tu navegador"
echo "  2. Acepta el riesgo de seguridad (varía según el navegador)"
echo "  3. Alternativamente, importa nginx.pem a las autoridades certificadoras de confianza del sistema"
echo ""

print_success "Los certificados están listos para usar con el script deploy.sh"
