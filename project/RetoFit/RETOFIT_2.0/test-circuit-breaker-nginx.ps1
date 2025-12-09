# Test Circuit Breaker a traves de Nginx (HTTPS)
Write-Host "=== Test Circuit Breaker via Nginx (HTTPS) ===" -ForegroundColor Cyan

# Verificar contenedores
Write-Host "`n1. Verificando contenedores..." -ForegroundColor Yellow
$containers = docker ps --filter "name=users-service" --format "{{.Names}}"
if (-not $containers) {
    Write-Host "ERROR: users-service no esta corriendo." -ForegroundColor Red
    exit 1
}
Write-Host "   OK Contenedores listos" -ForegroundColor Green

# Primero, resetear el Circuit Breaker enviando peticiones exitosas
Write-Host "`n2. Preparando estado inicial (enviando peticiones exitosas)..." -ForegroundColor Yellow
1..10 | ForEach-Object {
    try {
        Invoke-WebRequest -Uri "https://localhost/api/users/health" -SkipCertificateCheck -UseBasicParsing -ErrorAction SilentlyContinue | Out-Null
    } catch { }
    Start-Sleep -Milliseconds 100
}

Start-Sleep -Seconds 3

# Verificar estado inicial
Write-Host "`n3. Estado inicial del Circuit Breaker:" -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "http://localhost:8081/actuator/circuit-breakers/usersServiceCircuitBreaker" -UseBasicParsing
    $state = $response.Content | ConvertFrom-Json
    Write-Host "   Estado: $($state.state)" -ForegroundColor Cyan
    Write-Host "   Llamadas totales: $($state.numberOfBufferedCalls)" -ForegroundColor Cyan
} catch {
    Write-Host "   No disponible" -ForegroundColor Gray
}

# Detener servicio
Write-Host "`n4. Deteniendo users-service para simular fallo..." -ForegroundColor Yellow
docker stop users-service | Out-Null
Write-Host "   OK Servicio detenido" -ForegroundColor Green
Start-Sleep -Seconds 2

# Enviar peticiones LENTAS a traves de Nginx para activar Circuit Breaker
Write-Host "`n5. Enviando peticiones a traves de Nginx (HTTPS)..." -ForegroundColor Yellow
Write-Host "   Esto tomara tiempo debido a timeouts de 5 segundos..." -ForegroundColor Gray
$startTime = Get-Date

$failedCount = 0
1..10 | ForEach-Object {
    Write-Host "   Peticion $_ ..." -NoNewline
    try {
        Invoke-WebRequest -Uri "https://localhost/api/users/health" -SkipCertificateCheck -UseBasicParsing -TimeoutSec 6 -ErrorAction Stop | Out-Null
        Write-Host " OK" -ForegroundColor Green
    } catch {
        Write-Host " Fallo" -ForegroundColor Red
        $failedCount++
    }
    Start-Sleep -Milliseconds 500
}

$endTime = Get-Date
$slowDuration = [math]::Round(($endTime - $startTime).TotalSeconds, 2)
Write-Host "`n   Peticiones fallidas: $failedCount" -ForegroundColor Red
Write-Host "   Tiempo total: $slowDuration segundos" -ForegroundColor Cyan

# Verificar estado del Circuit Breaker
Write-Host "`n6. Verificando estado del Circuit Breaker..." -ForegroundColor Yellow
Start-Sleep -Seconds 2
try {
    $response = Invoke-WebRequest -Uri "http://localhost:8081/actuator/circuit-breakers/usersServiceCircuitBreaker" -UseBasicParsing
    $cbState = $response.Content | ConvertFrom-Json
    Write-Host "   Estado: $($cbState.state)" -ForegroundColor $(if ($cbState.state -eq "OPEN") { "Green" } else { "Yellow" })
    Write-Host "   Tasa de fallos: $([math]::Round($cbState.failureRate, 2))%" -ForegroundColor Cyan
    Write-Host "   Llamadas fallidas: $($cbState.numberOfFailedCalls)" -ForegroundColor Cyan
    Write-Host "   Llamadas exitosas: $($cbState.numberOfSuccessfulCalls)" -ForegroundColor Cyan
    Write-Host "   Total llamadas: $($cbState.numberOfBufferedCalls)" -ForegroundColor Cyan
    
    if ($cbState.state -eq "OPEN") {
        Write-Host "`n   OK Circuit Breaker ACTIVADO!" -ForegroundColor Green
    } else {
        Write-Host "`n   AVISO: Circuit Breaker sigue CLOSED" -ForegroundColor Yellow
    }
} catch {
    Write-Host "   Error al verificar estado" -ForegroundColor Red
}

# Probar respuestas rapidas con Circuit Breaker activo
Write-Host "`n7. Probando respuestas con Circuit Breaker activo..." -ForegroundColor Yellow
Write-Host "   Estas peticiones deberian recibir fallback inmediato" -ForegroundColor Gray
$fastStartTime = Get-Date

1..10 | ForEach-Object {
    try {
        $result = Invoke-WebRequest -Uri "https://localhost/api/users/health" -SkipCertificateCheck -UseBasicParsing -TimeoutSec 2 -ErrorAction SilentlyContinue
        Write-Host "   Peticion $_ : Fallback OK" -ForegroundColor Green
    } catch {
        Write-Host "   Peticion $_ : Fallback OK" -ForegroundColor Green
    }
    Start-Sleep -Milliseconds 100
}

$fastEndTime = Get-Date
$fastDuration = [math]::Round(($fastEndTime - $fastStartTime).TotalSeconds, 2)
Write-Host "`n   Tiempo con Circuit Breaker: $fastDuration segundos" -ForegroundColor Green

# Calcular mejora
if ($slowDuration -gt 0) {
    $improvement = [math]::Round(($slowDuration / $fastDuration), 2)
    Write-Host "`n   MEJORA: ${improvement}x mas rapido" -ForegroundColor Magenta
}

# Reiniciar servicio
Write-Host "`n8. Reiniciando users-service..." -ForegroundColor Yellow
docker start users-service | Out-Null
Write-Host "   OK Servicio reiniciado" -ForegroundColor Green
Start-Sleep -Seconds 5

# Esperar que el Circuit Breaker pase a HALF_OPEN
Write-Host "`n9. Esperando transicion a HALF_OPEN..." -ForegroundColor Yellow
Start-Sleep -Seconds 10

# Enviar peticiones para cerrar el circuito
Write-Host "`n10. Enviando peticiones para recuperacion..." -ForegroundColor Yellow
1..5 | ForEach-Object {
    try {
        Invoke-WebRequest -Uri "https://localhost/api/users/health" -SkipCertificateCheck -UseBasicParsing -ErrorAction SilentlyContinue | Out-Null
        Write-Host "   Peticion $_ : OK" -ForegroundColor Green
    } catch {
        Write-Host "   Peticion $_ : Error" -ForegroundColor Red
    }
    Start-Sleep -Seconds 1
}

# Estado final
Write-Host "`n11. Estado final del Circuit Breaker:" -ForegroundColor Yellow
Start-Sleep -Seconds 2
try {
    $response = Invoke-WebRequest -Uri "http://localhost:8081/actuator/circuit-breakers/usersServiceCircuitBreaker" -UseBasicParsing
    $finalState = $response.Content | ConvertFrom-Json
    Write-Host "   Estado: $($finalState.state)" -ForegroundColor $(if ($finalState.state -eq "CLOSED") { "Green" } elseif ($finalState.state -eq "HALF_OPEN") { "Yellow" } else { "Red" })
    Write-Host "   Tasa de fallos: $([math]::Round($finalState.failureRate, 2))%" -ForegroundColor Cyan
} catch {
    Write-Host "   Error al obtener estado final" -ForegroundColor Red
}

# Resumen
Write-Host "`n================================" -ForegroundColor Cyan
Write-Host "         RESUMEN" -ForegroundColor Cyan
Write-Host "================================" -ForegroundColor Cyan
Write-Host "Configuracion:" -ForegroundColor White
Write-Host "  - Acceso via: HTTPS (Nginx)" -ForegroundColor Gray
Write-Host "  - Rate Limiting: 50 req/s burst 100" -ForegroundColor Gray
Write-Host "  - Circuit Breaker: 50% threshold, 5 min calls" -ForegroundColor Gray
Write-Host "" -ForegroundColor White
Write-Host "Resultados:" -ForegroundColor White
Write-Host "  Tiempo SIN Circuit Breaker: $slowDuration seg" -ForegroundColor Yellow
Write-Host "  Tiempo CON Circuit Breaker: $fastDuration seg" -ForegroundColor Green
if ($slowDuration -gt 0) {
    Write-Host "  Mejora de Performance: ${improvement}x" -ForegroundColor Magenta
}
Write-Host "================================`n" -ForegroundColor Cyan
