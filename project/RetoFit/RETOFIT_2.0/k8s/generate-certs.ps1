# PowerShell Script para Generar Certificados TLS (Local)

function Write-Success {
    param([string]$Message)
    Write-Host "✓ $Message" -ForegroundColor Green
}

function Write-Warning-Custom {
    param([string]$Message)
    Write-Host "⚠ $Message" -ForegroundColor Yellow
}

function Write-Error-Custom {
    param([string]$Message)
    Write-Host "✗ $Message" -ForegroundColor Red
}

function Write-Info {
    param([string]$Message)
    Write-Host "ℹ $Message" -ForegroundColor Cyan
}

Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "  Generador de Certificados TLS (Local)" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""

# Check if OpenSSL is available
try {
    $null = Get-Command openssl -ErrorAction Stop
} catch {
    Write-Error-Custom "OpenSSL no está instalado o no está en PATH"
    Write-Host ""
    Write-Host "Opciones de instalación:"
    Write-Host "  1. Chocolatey: choco install openssl"
    Write-Host "  2. Descargar desde: https://slproweb.com/products/Win32OpenSSL.html"
    Write-Host "  3. Git Bash incluye OpenSSL (ejecuta este script en Git Bash)"
    exit 1
}

# Create nginx/tls directory if it doesn't exist
$NginxTlsDir = "..\nginx\tls"
if (-not (Test-Path $NginxTlsDir)) {
    New-Item -ItemType Directory -Path $NginxTlsDir -Force | Out-Null
}

Write-Info "Directorio de certificados: $NginxTlsDir"
Write-Host ""

# Check if certificates already exist
$CertPath = Join-Path $NginxTlsDir "nginx.pem"
$KeyPath = Join-Path $NginxTlsDir "nginx-key.pem"

if ((Test-Path $CertPath) -and (Test-Path $KeyPath)) {
    Write-Warning-Custom "Los certificados ya existen"
    $Response = Read-Host "¿Deseas regenerarlos? (s/n)"
    if ($Response -ne 's' -and $Response -ne 'S') {
        Write-Info "Operación cancelada"
        exit 0
    }
    Remove-Item $CertPath -Force -ErrorAction SilentlyContinue
    Remove-Item $KeyPath -Force -ErrorAction SilentlyContinue
}

# Generate private key
Write-Info "Generando clave privada RSA (2048 bits)..."
$Output = & openssl genrsa -out $KeyPath 2048 2>&1
if ($LASTEXITCODE -eq 0) {
    Write-Success "Clave privada generada: nginx-key.pem"
} else {
    Write-Error-Custom "Error al generar la clave privada"
    Write-Host $Output
    exit 1
}

# Generate self-signed certificate
Write-Info "Generando certificado autofirmado..."
$Output = & openssl req -new -x509 -sha256 `
    -key $KeyPath `
    -out $CertPath `
    -days 365 `
    -subj "/C=CO/ST=Cundinamarca/L=Bogota/O=RetoFit/OU=Development/CN=localhost" `
    -addext "subjectAltName=DNS:localhost,DNS:*.localhost,IP:127.0.0.1" 2>&1

if ($LASTEXITCODE -eq 0) {
    Write-Success "Certificado autofirmado generado: nginx.pem"
} else {
    Write-Error-Custom "Error al generar el certificado"
    Write-Host $Output
    exit 1
}

Write-Host ""
Write-Success "Certificados TLS generados exitosamente"
Write-Host ""

# Display certificate info
Write-Info "Información del certificado:"
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Gray
$CertInfo = & openssl x509 -in $CertPath -noout -subject -issuer -dates -ext subjectAltName 2>&1
$CertInfo -split "`n" | ForEach-Object { Write-Host "  $_" -ForegroundColor Gray }
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Gray
Write-Host ""

Write-Warning-Custom "IMPORTANTE: Este es un certificado autofirmado para desarrollo local"
Write-Warning-Custom "Los navegadores mostrarán advertencias de seguridad - esto es normal"
Write-Warning-Custom "NO uses estos certificados en producción"
Write-Host ""

Write-Info "Para confiar en el certificado en tu navegador:"
Write-Host "  1. Abre https://localhost en tu navegador"
Write-Host "  2. Acepta el riesgo de seguridad (varía según el navegador)"
Write-Host "  3. Alternativamente, importa nginx.pem a las autoridades certificadoras de confianza"
Write-Host ""
Write-Host "Para importar en Windows:"
Write-Host "  - Abre certmgr.msc"
Write-Host "  - Navega a: Autoridades de certificación raíz de confianza > Certificados"
Write-Host "  - Click derecho > Todas las tareas > Importar"
Write-Host "  - Selecciona nginx.pem"
Write-Host ""

Write-Success "Los certificados están listos para usar con deploy.ps1"
