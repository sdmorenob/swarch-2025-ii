<#
.SYNOPSIS
Run k6 performance tests (load or stress) across RPS targets.

.PARAMETER BaseUrl
Gateway base URL, e.g. http://localhost:8083 or https://localhost:8443

.PARAMETER Scenario
load|stress (selects the k6 scenario to run)

.PARAMETER RpsList
Comma-separated RPS values, e.g. 50,200,1000

.PARAMETER Duration
Test duration per run, e.g. 2m or 5m

.PARAMETER K6Script
K6 script to run (default: search_scenario.js, alternative: auth_scenarios.js)

.PARAMETER K6Scenario
Specific k6 scenario to run (for scripts with multiple scenarios like auth_scenarios.js)
Use 'login_perf' for authentication performance or 'api_traffic' for business traffic
#>
param(
  [string]$BaseUrl = "http://localhost:8083",
  [string]$Scenario = "load",
  [string]$RpsList = "50,200,1000",
  [string]$Duration = "2m",
  [string]$Query = "meeting",
  [int]$UserId = 1,
  [string]$JwtOverride = "",
  [string]$K6Script = "service_scenario.js",
  [string]$K6Scenario = "",
  # Preset de servicio/escenario, e.g. "search-load", "tasks-stress"
  [string]$Preset = "",
  [string]$ExecutorMode = "vus",
  # Per-service config
  [string]$ServiceName = "search-service",
  [string]$EndpointPath = "/search",
  [string]$Method = "POST",
  [string]$ContentType = "application/json",
  [string]$Body = "",
  [string]$TestId = "",
  [switch]$OutPrometheus,
  [string]$PrometheusWriteUrl = "http://localhost:9090/api/v1/write"
  ,
  [switch]$OutInflux,
  [switch]$InfluxV2,
  [string]$InfluxUrl = "http://localhost:8086",
  [string]$InfluxV1Database = "k6",
  [string]$InfluxV2Org = "TaskNotes",
  [string]$InfluxV2Bucket = "k6",
  [string]$InfluxV2Token = "tasknotes-influx-admin-token"
)

$ErrorActionPreference = 'Stop'
$here = Split-Path -Parent $MyInvocation.MyCommand.Path
$k6Script = Join-Path $here "k6/$K6Script"
$reportsDir = Join-Path $here 'reports'
$timestamp = Get-Date -Format 'yyyyMMdd_HHmmss'
New-Item -ItemType Directory -Force -Path $reportsDir | Out-Null

# Validate k6 script exists
if (-not (Test-Path $k6Script)) {
  Write-Error "K6 script not found: $k6Script"
  exit 1
}

$rpsValues = $RpsList.Split(',') | ForEach-Object { $_.Trim() } | Where-Object { $_ -ne '' }

# Validar y normalizar escenario: sólo 'load' o 'stress'
$allowedScenarios = @('load','stress')
$Scenario = $Scenario.ToLower()
if (-not $allowedScenarios.Contains($Scenario)) {
  Write-Warning "Escenario no válido '$Scenario'. Se usará 'load'"
  $Scenario = 'load'
}

# Aplicar preset si se especifica (formato: "<servicio>-<escenario>")
if ($Preset) {
  $parts = $Preset.ToLower().Split('-')
  $presetService = $parts[0]
  $presetScenario = if ($parts.Length -ge 2 -and $parts[1]) { $parts[1] } else { "load" }

  # Tabla de configuración por servicio
  $svcMap = @{
    'search' = @{ ServiceName='search-service'; Path='/search/'; Method='POST'; ContentType='application/json'; Body='{"query":"meeting","user_id":1,"limit":20,"skip":0}' }
    'tasks' =  @{ ServiceName='tasks-service';  Path='/tasks';         Method='GET';  ContentType='application/json'; Body='' }
    'notes' =  @{ ServiceName='notes-service';  Path='/notes';         Method='GET';  ContentType='application/json'; Body='' }
    'tags' =   @{ ServiceName='tags-service';   Path='/tags';          Method='GET';  ContentType='application/json'; Body='' }
    'categories' = @{ ServiceName='categories-service'; Path='/categories'; Method='GET'; ContentType='application/json'; Body='' }
    'userprofile' = @{ ServiceName='user-profile-service'; Path='/user-profile/'; Method='GET'; ContentType='application/json'; Body='' }
  }

  if ($svcMap.ContainsKey($presetService)) {
    $cfg = $svcMap[$presetService]
    if (-not $PSBoundParameters.ContainsKey('ServiceName')) { $ServiceName = $cfg.ServiceName }
    if (-not $PSBoundParameters.ContainsKey('EndpointPath')) { $EndpointPath = $cfg.Path }
    if (-not $PSBoundParameters.ContainsKey('Method')) { $Method = $cfg.Method }
    if (-not $PSBoundParameters.ContainsKey('ContentType')) { $ContentType = $cfg.ContentType }
    if (-not $PSBoundParameters.ContainsKey('Body')) { $Body = $cfg.Body }
  } else {
    Write-Warning "Preset desconocido de servicio: '$presetService'. Se ignora."
  }

  if (-not $PSBoundParameters.ContainsKey('K6Scenario')) { $K6Scenario = $presetScenario }
}

foreach ($rps in $rpsValues) {
  # Build output filename based on script and scenario
  $scriptName = [System.IO.Path]::GetFileNameWithoutExtension($K6Script)
  $scenarioSuffix = if ($K6Scenario) { "-$K6Scenario" } else { "" }
  $outfile = Join-Path $reportsDir ("k6-$scriptName-" + $Scenario + $scenarioSuffix + "-" + $rps + "rps-" + $timestamp + ".json")
  
  Write-Host "Running k6: script=$K6Script scenario=$Scenario k6scenario=$K6Scenario rps=$rps duration=$Duration base=$BaseUrl"
  $env:BASE_URL = $BaseUrl
  $env:SCENARIO = $Scenario
  $env:EXECUTOR_MODE = $ExecutorMode
  $env:RPS = $rps
  $env:DURATION = $Duration
  $env:QUERY = $Query
  $env:USER_ID = $UserId
  # Per-service envs for generic script
  $env:PATH = $EndpointPath
  $env:METHOD = $Method
  $env:CONTENT_TYPE = $ContentType
  $env:BODY = $Body
  $env:SERVICE_NAME = $ServiceName
  $env:API_RPS = $rps
  if ($JwtOverride) {
    Write-Host "Using JWT_OVERRIDE from parameter"
    $env:JWT_OVERRIDE = $JwtOverride
  } else {
    $env:JWT_OVERRIDE = $null
  }

  # Configure k6 Prometheus remote write output if requested
  if ($OutPrometheus) {
    Write-Host "Enabling k6 Prometheus remote write output -> $PrometheusWriteUrl"
    $env:K6_PROMETHEUS_RW_SERVER_URL = $PrometheusWriteUrl
    # Optional tuning: emit trend metrics as gauges for simpler PromQL
    $env:K6_PROMETHEUS_RW_TREND_AS_GAUGE = "true"
  } else {
    $env:K6_PROMETHEUS_RW_SERVER_URL = $null
    $env:K6_PROMETHEUS_RW_TREND_AS_GAUGE = $null
  }

  # Configure k6 InfluxDB output for historization if requested
  if ($OutInflux) {
    if ($InfluxV2) {
      Write-Host "Enabling k6 InfluxDB v2 output -> $InfluxUrl org=$InfluxV2Org bucket=$InfluxV2Bucket"
      $env:K6_INFLUXDB_V2 = "true"
      $env:K6_INFLUXDB_V2_URL = $InfluxUrl
      $env:K6_INFLUXDB_V2_ORG = $InfluxV2Org
      $env:K6_INFLUXDB_V2_BUCKET = $InfluxV2Bucket
      $env:K6_INFLUXDB_V2_TOKEN = $InfluxV2Token
    } else {
      Write-Host "Enabling k6 InfluxDB v1 output -> $InfluxUrl database=$InfluxV1Database"
      $env:K6_INFLUXDB_ADDRESS = $InfluxUrl
      $env:K6_INFLUXDB_DATABASE = $InfluxV1Database
    }
  } else {
    $env:K6_INFLUXDB_V2 = $null
    $env:K6_INFLUXDB_V2_URL = $null
    $env:K6_INFLUXDB_V2_ORG = $null
    $env:K6_INFLUXDB_V2_BUCKET = $null
    $env:K6_INFLUXDB_V2_TOKEN = $null
    $env:K6_INFLUXDB_ADDRESS = $null
    $env:K6_INFLUXDB_DATABASE = $null
  }
  
  # Build k6 command with optional scenario selection
  $k6Args = @("run", $k6Script, "--summary-export", $outfile)
  if ($K6Scenario) {
    # Permite ejecutar un escenario específico definido en el script seleccionado
    $k6Args += @("--scenario", $K6Scenario)
  }

  if ($TestId) {
    Write-Host "Adding global tag: testid=$TestId"
    $k6Args += @("--tag", "testid=$TestId")
  }

  if ($OutPrometheus) {
    $k6Args += @("--out", "experimental-prometheus-rw")
  }

  if ($OutInflux) {
    if ($InfluxV2) {
      $k6Args += @("--out", "influxdb")
    } else {
      $k6Args += @("--out", "influxdb=$InfluxUrl/$InfluxV1Database")
    }
  }
  
  # Requires k6 to be installed and available in PATH
  & k6 $k6Args
}

Write-Host "Done. Reports saved to $reportsDir"