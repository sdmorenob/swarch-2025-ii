Param(
  [int]$RotateThresholdDays = 30
)

$ErrorActionPreference = "Stop"

# Rotate mTLS certificates for internal gRPC if expiring soon (Windows/PowerShell)
# - Checks CA and leaf certs using openssl -checkend
# - Reissues server certs (notes, tasks) and client cert (search)
# - Restarts affected services via docker compose

$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$Out = Join-Path $ScriptDir "grpc"
$TaskNotesDir = Split-Path -Parent $ScriptDir
$ComposeFile = Join-Path $TaskNotesDir "docker-compose.e2e.dist.yml"

$ThresholdSec = $RotateThresholdDays * 86400

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

$CaCrt = Join-Path $Out "ca.crt"
$CaKey = Join-Path $Out "ca.key"
if (-not (Test-Path $CaCrt) -or -not (Test-Path $CaKey)) {
  throw "CA files not found in $Out (expected ca.crt and ca.key)"
}

function Test-CertExpiringSoon($CertPath) {
  & $OpenSSL x509 -checkend $ThresholdSec -noout -in $CertPath | Out-Null
  return ($LASTEXITCODE -ne 0)
}

function Rotate-ServerCert($Name, $CN, $SanDns) {
  $crt = Join-Path $Out "$Name.crt"
  $key = Join-Path $Out "$Name.key"
  if (-not (Test-Path $crt) -or -not (Test-Path $key)) {
    Write-Host "Skipping ${Name}: missing cert or key"
    return
  }
  if (-not (Test-CertExpiringSoon -CertPath $crt)) {
    Write-Host "OK: $Name cert valid > $RotateThresholdDays d"
    return
  }
  Write-Host "Rotating server cert: $Name"
  $csr = Join-Path $Out "$Name.csr"
  $ext = Join-Path $Out "$Name-san.cnf"
  & $OpenSSL req -new -key $key -subj "/CN=$CN" -out $csr
  @"
[ v3_req ]
subjectAltName=DNS:$SanDns
extendedKeyUsage = serverAuth
keyUsage = digitalSignature, keyEncipherment
"@ | Set-Content -Path $ext -NoNewline
  Copy-Item $crt "$crt.bak" -Force
  & $OpenSSL x509 -req -in $csr -CA $CaCrt -CAkey $CaKey -CAcreateserial `
    -out $crt -days 365 -sha256 -extensions v3_req -extfile $ext
  Remove-Item $csr, $ext -Force
}

function Rotate-ClientCert($Name, $CN) {
  $crt = Join-Path $Out "$Name.crt"
  $key = Join-Path $Out "$Name.key"
  if (-not (Test-Path $crt) -or -not (Test-Path $key)) {
    Write-Host "Skipping ${Name}: missing cert or key"
    return
  }
  if (-not (Test-CertExpiringSoon -CertPath $crt)) {
    Write-Host "OK: $Name cert valid > $RotateThresholdDays d"
    return
  }
  Write-Host "Rotating client cert: $Name"
  $csr = Join-Path $Out "$Name.csr"
  $ext = Join-Path $Out "$Name-ext.cnf"
  & $OpenSSL req -new -key $key -subj "/CN=$CN" -out $csr
  @"
[ v3_req ]
extendedKeyUsage = clientAuth
keyUsage = digitalSignature, keyEncipherment
"@ | Set-Content -Path $ext -NoNewline
  Copy-Item $crt "$crt.bak" -Force
  & $OpenSSL x509 -req -in $csr -CA $CaCrt -CAkey $CaKey -CAcreateserial `
    -out $crt -days 365 -sha256 -extensions v3_req -extfile $ext
  Remove-Item $csr, $ext -Force
}

Rotate-ServerCert -Name "notes" -CN "notes-service" -SanDns "notes-service"
Rotate-ServerCert -Name "tasks" -CN "tasks-service" -SanDns "tasks-service"
Rotate-ClientCert -Name "search-client" -CN "search-service"

Write-Host "Restarting services to reload certificates"
docker compose -f $ComposeFile restart notes-service tasks-service search-service
Write-Host "Done"