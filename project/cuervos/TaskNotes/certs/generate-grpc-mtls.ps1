Param()

$ErrorActionPreference = "Stop"

# Generate internal CA and issue mTLS certs for gRPC services (Windows/PowerShell)
# Requires OpenSSL available in PATH

$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$Out = Join-Path $ScriptDir "grpc"
New-Item -ItemType Directory -Force -Path $Out | Out-Null

Write-Host "[1/6] Generating CA key and certificate"
$OpenSSL = (Get-Command openssl -ErrorAction SilentlyContinue)
if (-not $OpenSSL) {
  $OpenSSLPath = "C:\Program Files\OpenSSL-Win64\bin\openssl.exe"
  if (-not (Test-Path $OpenSSLPath)) {
    throw "OpenSSL not found. Install with winget (ShiningLight.OpenSSL.Light) or provide path."
  }
  $OpenSSL = $OpenSSLPath
} else {
  $OpenSSL = $OpenSSL.Path
}
& $OpenSSL genrsa -out (Join-Path $Out "ca.key") 4096
& $OpenSSL req -x509 -new -nodes -key (Join-Path $Out "ca.key") -sha256 -days 365 `
  -subj "/CN=TaskNotes-Internal-CA" -out (Join-Path $Out "ca.crt")

function Make-ServerCert($Name, $CN, $SanDns) {
  Write-Host "[2/x] Generating server key/csr for $Name (CN=$CN, SAN=$SanDns)"
  $keyPath = Join-Path $Out "$Name.key"
  $csrPath = Join-Path $Out "$Name.csr"
  $extPath = Join-Path $Out "$Name-san.cnf"
  $crtPath = Join-Path $Out "$Name.crt"

  & $OpenSSL genrsa -out $keyPath 2048
  & $OpenSSL req -new -key $keyPath -subj "/CN=$CN" -out $csrPath
  @"
[ v3_req ]
subjectAltName=DNS:$SanDns
extendedKeyUsage = serverAuth
keyUsage = digitalSignature, keyEncipherment
"@ | Set-Content -Path $extPath -NoNewline

  & $OpenSSL x509 -req -in $csrPath -CA (Join-Path $Out "ca.crt") -CAkey (Join-Path $Out "ca.key") -CAcreateserial `
    -out $crtPath -days 365 -sha256 -extensions v3_req -extfile $extPath

  Remove-Item $extPath, $csrPath -Force
}

function Make-ClientCert($Name, $CN) {
  Write-Host "[x/6] Generating client key/csr for $Name (CN=$CN)"
  $keyPath = Join-Path $Out "$Name.key"
  $csrPath = Join-Path $Out "$Name.csr"
  $extPath = Join-Path $Out "$Name-ext.cnf"
  $crtPath = Join-Path $Out "$Name.crt"

  & $OpenSSL genrsa -out $keyPath 2048
  & $OpenSSL req -new -key $keyPath -subj "/CN=$CN" -out $csrPath
  @"
[ v3_req ]
extendedKeyUsage = clientAuth
keyUsage = digitalSignature, keyEncipherment
"@ | Set-Content -Path $extPath -NoNewline

  & $OpenSSL x509 -req -in $csrPath -CA (Join-Path $Out "ca.crt") -CAkey (Join-Path $Out "ca.key") -CAcreateserial `
    -out $crtPath -days 365 -sha256 -extensions v3_req -extfile $extPath

  Remove-Item $extPath, $csrPath -Force
}

Make-ServerCert -Name "notes" -CN "notes-service" -SanDns "notes-service"
Make-ServerCert -Name "tasks" -CN "tasks-service" -SanDns "tasks-service"
Make-ClientCert -Name "search-client" -CN "search-service"

Write-Host "Done. Files in ${Out}:"
Get-ChildItem -Path $Out | Select-Object -ExpandProperty Name
Write-Host "`nMount this directory to services as /grpc-certs:ro"