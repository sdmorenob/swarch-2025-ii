# scale-service.ps1
# Script para escalar servicios de MusicShare dinámicamente
# Uso: .\scale-service.ps1 -Service <nombre-servicio> -Replicas <número>

param(
    [Parameter(Mandatory=$true, HelpMessage="Nombre del servicio a escalar (userservice, music-service, social-service, notificationservice)")]
    [ValidateSet("userservice", "music-service", "social-service", "notificationservice", "all")]
    [string]$Service,
    
    [Parameter(Mandatory=$true, HelpMessage="Número de réplicas deseadas")]
    [ValidateRange(1, 10)]
    [int]$Replicas
)

# Colores para la salida
function Write-ColorOutput($ForegroundColor) {
    $fc = $host.UI.RawUI.ForegroundColor
    $host.UI.RawUI.ForegroundColor = $ForegroundColor
    if ($args) {
        Write-Output $args
    }
    $host.UI.RawUI.ForegroundColor = $fc
}

Write-ColorOutput Green "🚀 MusicShare - Sistema de Escalado de Servicios"
Write-ColorOutput Green "================================================"
Write-Host ""

# Verificar que Docker Compose está disponible
try {
    $dockerComposeVersion = docker compose version 2>&1
    Write-ColorOutput Cyan "✓ Docker Compose detectado: $dockerComposeVersion"
} catch {
    Write-ColorOutput Red "❌ Error: Docker Compose no está instalado o no está en el PATH"
    exit 1
}

# Función para escalar un servicio
function Scale-MusicShareService {
    param(
        [string]$ServiceName,
        [int]$ReplicaCount
    )
    
    Write-Host ""
    Write-ColorOutput Yellow "📊 Escalando $ServiceName a $ReplicaCount réplica(s)..."
    
    try {
        # Escalar el servicio
        docker compose up -d --scale $ServiceName=$ReplicaCount --no-recreate
        
        if ($LASTEXITCODE -eq 0) {
            Write-ColorOutput Green "✓ $ServiceName escalado exitosamente"
            
            # Esperar un momento para que los contenedores se inicien
            Start-Sleep -Seconds 2
            
            # Mostrar el estado de las réplicas
            Write-ColorOutput Cyan "`nEstado de las réplicas:"
            docker compose ps $ServiceName
        } else {
            Write-ColorOutput Red "❌ Error al escalar $ServiceName"
        }
    } catch {
        Write-ColorOutput Red "❌ Error: $_"
    }
}

# Escalar servicio(s)
if ($Service -eq "all") {
    Write-ColorOutput Magenta "`n🔄 Escalando TODOS los servicios a $Replicas réplica(s)..."
    
    $services = @("userservice", "music-service", "social-service", "notificationservice")
    foreach ($svc in $services) {
        Scale-MusicShareService -ServiceName $svc -ReplicaCount $Replicas
    }
} else {
    Scale-MusicShareService -ServiceName $Service -ReplicaCount $Replicas
}

# Mostrar resumen del sistema
Write-Host ""
Write-ColorOutput Green "================================================"
Write-ColorOutput Green "📈 Resumen del Sistema"
Write-ColorOutput Green "================================================"
Write-Host ""

# Contar réplicas activas
Write-ColorOutput Cyan "Servicios escalables activos:"
docker compose ps --format json | ConvertFrom-Json | Where-Object { $_.Service -in @("userservice", "music-service", "social-service", "notificationservice") } | Group-Object Service | ForEach-Object {
    Write-Host "  • $($_.Name): $($_.Count) réplica(s)"
}

Write-Host ""
Write-ColorOutput Yellow "💡 Tip: Verifica el balanceo de carga en el dashboard de Traefik:"
Write-ColorOutput Yellow "   👉 http://localhost:8080/dashboard/"
Write-Host ""

# Verificar salud de Traefik
Write-ColorOutput Cyan "🔍 Verificando estado de Traefik..."
try {
    $response = Invoke-WebRequest -Uri "http://localhost:8080/ping" -UseBasicParsing -TimeoutSec 5
    if ($response.StatusCode -eq 200) {
        Write-ColorOutput Green "✓ Traefik está operativo y balanceando carga"
    }
} catch {
    Write-ColorOutput Yellow "⚠ No se pudo verificar el estado de Traefik"
}

Write-Host ""
Write-ColorOutput Green "✅ Escalado completado"
