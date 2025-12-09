# k6-load-test.ps1
# Script para ejecutar tests de carga con k6 contra Kubernetes
# Monitorea el autoescalado (HPA) en tiempo real

param(
    [Parameter(HelpMessage="URL base para el test")]
    [string]$BaseUrl = "http://localhost",
    
    [Parameter(HelpMessage="Script k6 a ejecutar")]
    [string]$ScriptPath = "k6/baseline.js",
    
    [Parameter(HelpMessage="Mostrar métricas de HPA en tiempo real")]
    [switch]$ShowMetrics = $true,
    
    [Parameter(HelpMessage="Servicios a monitorear")]
    [array]$Services = @("userservice", "musicservice", "social-service", "notificationservice")
)

Write-Host "╔════════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║           K6 Load Test para MusicShare en Kubernetes          ║" -ForegroundColor Cyan
Write-Host "╚════════════════════════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""

# Verificar que k6 esté instalado
if (-not (Get-Command k6 -ErrorAction SilentlyContinue)) {
    Write-Host "❌ k6 no está instalado. Instálalo con: choco install k6" -ForegroundColor Red
    exit 1
}

# Verificar que kubectl esté disponible
if (-not (Get-Command kubectl -ErrorAction SilentlyContinue)) {
    Write-Host "❌ kubectl no está instalado." -ForegroundColor Red
    exit 1
}

# Función para mostrar estado de HPA
function Show-HPA-Status {
    Write-Host ""
    Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Yellow
    Write-Host "📊 ESTADO DE AUTOESCALADO (HPA)" -ForegroundColor Yellow
    Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Yellow
    Write-Host ""
    
    foreach ($service in $Services) {
        $hpaName = "$service-hpa"
        $hpaStatus = kubectl get hpa $hpaName -n musicshare -o json 2>$null | ConvertFrom-Json
        
        if ($hpaStatus) {
            $currentReplicas = $hpaStatus.status.currentReplicas
            $desiredReplicas = $hpaStatus.status.desiredReplicas
            $minReplicas = $hpaStatus.spec.minReplicas
            $maxReplicas = $hpaStatus.spec.maxReplicas
            
            # Obtener métricas de CPU
            $metrics = kubectl get hpa $hpaName -n musicshare -o custom-columns=NAME:.metadata.name,REFERENCE:.spec.scaleTargetRef.name,TARGETS:.status.currentMetrics[0].resource.current.averageUtilization 2>$null
            
            $color = 'White'
            if ($currentReplicas -eq $maxReplicas) { $color = 'Red' }
            elseif ($currentReplicas -gt $minReplicas) { $color = 'Yellow' }
            else { $color = 'Green' }
            
            Write-Host "  📦 $service" -ForegroundColor $color
            Write-Host "     Replicas: $currentReplicas/$desiredReplicas (Min: $minReplicas, Max: $maxReplicas)"
            Write-Host "     $metrics" | Select-Object -Skip 1
            Write-Host ""
        }
    }
}

# Función para obtener pods actuales
function Show-Pods-Status {
    Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Cyan
    Write-Host "📋 PODS EN EJECUCIÓN" -ForegroundColor Cyan
    Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Cyan
    Write-Host ""
    
    $pods = kubectl get pods -n musicshare -o wide | Select-Object -Property @{N='NAME';E={$_.NAMES}},@{N='READY';E={$_.READY}},@{N='STATUS';E={$_.STATUS}},@{N='RESTARTS';E={$_.RESTARTS}},@{N='NODE';E={$_.NODE}}
    
    Write-Host ($pods | Format-Table -AutoSize | Out-String)
}

# Mostrar configuración inicial
Write-Host "⚙️  Configuración:" -ForegroundColor Green
Write-Host "   Base URL: $BaseUrl"
Write-Host "   Script: $ScriptPath"
Write-Host "   Namespace: musicshare"
Write-Host ""

# Mostrar HPA inicial
if ($ShowMetrics) {
    Show-HPA-Status
    Show-Pods-Status
}

Write-Host "🔥 Iniciando test de carga con k6..." -ForegroundColor Green
Write-Host ""

# Ejecutar k6
$env:BASE_URL = $BaseUrl
k6 run $ScriptPath

Write-Host ""
Write-Host "✅ Test completado!" -ForegroundColor Green

# Mostrar HPA final
if ($ShowMetrics) {
    Write-Host ""
    Write-Host "Estado final después del test:" -ForegroundColor Green
    Show-HPA-Status
    Show-Pods-Status
}

Write-Host ""
Write-Host "💡 Próximos pasos:" -ForegroundColor Cyan
Write-Host "   1. Revisa Grafana: http://localhost:3000 (usuario: admin, contraseña: admin)"
Write-Host "   2. Revisa Prometheus: http://localhost:9090"
Write-Host "   3. Verifica logs de pods: kubectl logs -n musicshare -f <pod-name>"
Write-Host ""
