# load-test.ps1
# Script para probar el balanceo de carga de MusicShare
# Realiza múltiples peticiones y muestra qué réplica responde cada vez

param(
    [Parameter(HelpMessage="Servicio a probar (userservice, music-service, social-service)")]
    [ValidateSet("userservice", "music-service", "social-service")]
    [string]$Service = "userservice",
    
    [Parameter(HelpMessage="Número de peticiones a realizar")]
    [int]$Requests = 20,
    
    [Parameter(HelpMessage="Delay entre peticiones en milisegundos")]
    [int]$Delay = 500
)

# Mapeo de servicios a endpoints
$endpoints = @{
    "userservice" = "https://localhost/api/users/health"
    "music-service" = "https://localhost/api/music/health"
    "social-service" = "https://localhost/api/social/actuator/health"
}

$endpoint = $endpoints[$Service]

# Colores
function Write-ColorOutput($ForegroundColor) {
    $fc = $host.UI.RawUI.ForegroundColor
    $host.UI.RawUI.ForegroundColor = $ForegroundColor
    if ($args) {
        Write-Output $args
    }
    $host.UI.RawUI.ForegroundColor = $fc
}

Write-ColorOutput Green "🔥 MusicShare - Prueba de Balanceo de Carga"
Write-ColorOutput Green "============================================"
Write-Host ""
Write-ColorOutput Cyan "Servicio: $Service"
Write-ColorOutput Cyan "Endpoint: $endpoint"
Write-ColorOutput Cyan "Peticiones: $Requests"
Write-ColorOutput Cyan "Delay: ${Delay}ms"
Write-Host ""

# Deshabilitar validación de certificados SSL para localhost
if (-not ([System.Management.Automation.PSTypeName]'ServerCertificateValidationCallback').Type) {
    $certCallback = @"
    using System;
    using System.Net;
    using System.Net.Security;
    using System.Security.Cryptography.X509Certificates;
    public class ServerCertificateValidationCallback
    {
        public static void Ignore()
        {
            if(ServicePointManager.ServerCertificateValidationCallback == null)
            {
                ServicePointManager.ServerCertificateValidationCallback += 
                    delegate
                    (
                        Object obj, 
                        X509Certificate certificate, 
                        X509Chain chain, 
                        SslPolicyErrors errors
                    )
                    {
                        return true;
                    };
            }
        }
    }
"@
    Add-Type $certCallback
}
[ServerCertificateValidationCallback]::Ignore()

# Variables para estadísticas
$successful = 0
$failed = 0
$responseTimes = @()
$containerHits = @{}

Write-ColorOutput Yellow "🚀 Iniciando prueba de carga..."
Write-Host ""

for ($i = 1; $i -le $Requests; $i++) {
    try {
        $stopwatch = [System.Diagnostics.Stopwatch]::StartNew()
        
        # Realizar petición HTTP
        $response = Invoke-WebRequest -Uri $endpoint -UseBasicParsing -TimeoutSec 5 2>$null
        
        $stopwatch.Stop()
        $responseTime = $stopwatch.ElapsedMilliseconds
        $responseTimes += $responseTime
        
        # Obtener el contenedor que respondió (si está en las cabeceras)
        $containerId = "unknown"
        if ($response.Headers.ContainsKey("X-Container-Id")) {
            $containerId = $response.Headers["X-Container-Id"]
        }
        
        # Contar hits por contenedor
        if ($containerHits.ContainsKey($containerId)) {
            $containerHits[$containerId]++
        } else {
            $containerHits[$containerId] = 1
        }
        
        $successful++
        
        # Mostrar resultado
        $statusColor = if ($response.StatusCode -eq 200) { "Green" } else { "Yellow" }
        Write-Host "[$i/$Requests] " -NoNewline
        Write-ColorOutput $statusColor "✓ Status: $($response.StatusCode) | Tiempo: ${responseTime}ms"
        
    } catch {
        $failed++
        Write-Host "[$i/$Requests] " -NoNewline
        Write-ColorOutput Red "✗ Error: $($_.Exception.Message)"
    }
    
    # Delay entre peticiones
    if ($i -lt $Requests) {
        Start-Sleep -Milliseconds $Delay
    }
}

# Calcular estadísticas
Write-Host ""
Write-ColorOutput Green "============================================"
Write-ColorOutput Green "📊 Resultados de la Prueba"
Write-ColorOutput Green "============================================"
Write-Host ""

Write-ColorOutput Cyan "Peticiones totales: $Requests"
Write-ColorOutput Green "✓ Exitosas: $successful"
if ($failed -gt 0) {
    Write-ColorOutput Red "✗ Fallidas: $failed"
}

if ($responseTimes.Count -gt 0) {
    $avgTime = ($responseTimes | Measure-Object -Average).Average
    $minTime = ($responseTimes | Measure-Object -Minimum).Minimum
    $maxTime = ($responseTimes | Measure-Object -Maximum).Maximum
    
    Write-Host ""
    Write-ColorOutput Yellow "⏱️ Tiempos de Respuesta:"
    Write-Host "  • Promedio: $([math]::Round($avgTime, 2))ms"
    Write-Host "  • Mínimo: ${minTime}ms"
    Write-Host "  • Máximo: ${maxTime}ms"
}

Write-Host ""
Write-ColorOutput Yellow "🔄 Distribución de Carga:"
if ($containerHits.Count -gt 1) {
    foreach ($container in $containerHits.Keys) {
        $percentage = [math]::Round(($containerHits[$container] / $successful) * 100, 2)
        Write-Host "  • Réplica $($container): $($containerHits[$container]) peticiones ($percentage%)"
    }
    Write-Host ""
    Write-ColorOutput Green "✅ El balanceo de carga está funcionando correctamente"
} else {
    Write-ColorOutput Yellow "⚠️ Todas las peticiones fueron manejadas por la misma réplica"
    Write-ColorOutput Yellow "   Esto puede deberse a sticky sessions o a que solo hay una réplica activa"
}

Write-Host ""
Write-ColorOutput Cyan "💡 Tip: Para ver la distribución en tiempo real, visita:"
Write-ColorOutput Cyan "   👉 http://localhost:8080/dashboard/"
Write-Host ""

# Mostrar réplicas activas
Write-ColorOutput Yellow "🔍 Réplicas activas del servicio $Service :"
docker compose ps $Service --format "table {{.Name}}\t{{.Status}}\t{{.Ports}}"

Write-Host ""
Write-ColorOutput Green "✅ Prueba completada"
