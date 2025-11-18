<#
.SYNOPSIS
Run wrk HTTP benchmark for POST /search and save outputs (load or stress).

.NOTE
Requires wrk installed (WSL or native) and accessible from PATH.
#>
param(
  [string]$Url = "http://localhost:8083/search",
  [string]$Scenario = "load",
  [string]$Query = "meeting",
  [int]$UserId = 1,
  [int]$DurationSeconds = 120,
  [string]$RpsList = "50,200,1000",
  [string]$TokensFile = "",
  [string]$AuthToken = ""
)

$ErrorActionPreference = 'Stop'
$here = Split-Path -Parent $MyInvocation.MyCommand.Path
$script = Join-Path $here 'wrk/search_post.lua'
$reportsDir = Join-Path $here 'reports'
$timestamp = Get-Date -Format 'yyyyMMdd_HHmmss'
New-Item -ItemType Directory -Force -Path $reportsDir | Out-Null

$env:QUERY = $Query
$env:USER_ID = $UserId

# Validar y normalizar escenario: sólo 'load' o 'stress'
$allowedScenarios = @('load','stress')
$Scenario = $Scenario.ToLower()
if (-not $allowedScenarios.Contains($Scenario)) {
  Write-Warning "Escenario no válido '$Scenario'. Se usará 'load'"
  $Scenario = 'load'
}

# Optional auth: tokens file or single token. Avoid login per request.
if ($TokensFile -and (Test-Path $TokensFile)) {
  Write-Host "Using WRK_TOKENS_FILE=$TokensFile"
  $env:WRK_TOKENS_FILE = $TokensFile
} elseif ($AuthToken) {
  Write-Host "Using WRK_AUTH_TOKEN from parameter"
  $env:WRK_AUTH_TOKEN = $AuthToken
} else {
  # Unset to avoid stale environment
  $env:WRK_TOKENS_FILE = $null
  $env:WRK_AUTH_TOKEN = $null
}

# Parsear RPS objetivo
$rpsValues = $RpsList.Split(',') | ForEach-Object { $_.Trim() } | Where-Object { $_ -ne '' } | ForEach-Object { [int]$_ }
if (-not $rpsValues -or $rpsValues.Count -eq 0) { $rpsValues = @(50,200,1000) }

function Get-Config($rps) {
  # Aproximaciones de hilos/conexiones para intentar alcanzar el RPS objetivo
  if ($rps -le 50) { return @{ name = "${rps}rps"; threads = 2; conns = [int]$rps } }
  elseif ($rps -le 200) { return @{ name = "${rps}rps"; threads = 4; conns = [int]$rps } }
  else {
    $conns = [int][Math]::Min(1000, [Math]::Max(200, [int]($rps * 0.6)))
    return @{ name = "${rps}rps"; threads = 8; conns = $conns }
  }
}

# Orden según escenario: load (tal cual), stress (sólo ascendente por pasos)
$orderedRps = if ($Scenario -eq 'stress') {
  $rpsValues | Sort-Object
} else { $rpsValues }

foreach ($rps in $orderedRps) {
  $cfg = Get-Config $rps
  $outfile = Join-Path $reportsDir ("wrk-" + $Scenario + "-" + $cfg.name + "-" + $timestamp + ".txt")
  Write-Host "Running wrk: $Url scenario=$Scenario threads=$($cfg.threads) conns=$($cfg.conns) duration=${DurationSeconds}s"
  wrk -t $($cfg.threads) -c $($cfg.conns) -d ${DurationSeconds}s -s $script $Url | Tee-Object -FilePath $outfile
}

Write-Host "Done. Reports saved to $reportsDir"