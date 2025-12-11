Param(
  [string]$OutDir = $PSScriptRoot
)

$certPath = Join-Path $OutDir 'gateway.crt'
$keyPath  = Join-Path $OutDir 'gateway.key'

Write-Host "Generating self-signed cert in $OutDir ..."

if (Get-Command openssl -ErrorAction SilentlyContinue) {
  # Generate self-signed cert with SANs for modern browsers
  & openssl req -x509 -nodes -days 365 -newkey rsa:2048 `
    -keyout $keyPath -out $certPath `
    -subj "/C=CO/ST=Dev/L=Local/O=TaskNotes/OU=Gateway/CN=localhost" `
    -addext "subjectAltName=DNS:localhost,IP:127.0.0.1,IP:::1"
  Write-Host "Done: cert=$certPath key=$keyPath"
} else {
  Write-Host "OpenSSL not found. Please install OpenSSL or use WSL/Git Bash to run generate-dev-certs.sh"
  exit 1
}