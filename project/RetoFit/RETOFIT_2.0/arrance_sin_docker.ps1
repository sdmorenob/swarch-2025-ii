# =============================================
# Script seguro para levantar y detener servicios
# No afecta otros procesos del sistema
# =============================================

$ErrorActionPreference = "Stop"
$processes = @()

# Función para iniciar un servicio y registrar su proceso
function Start-Service {
    param(
        [string]$Name,
        [string]$Command,
        [string]$WorkingDirectory
    )
    
    try {
        Write-Host "🚀 Iniciando $Name..." -ForegroundColor Cyan
        
        $processStartInfo = New-Object System.Diagnostics.ProcessStartInfo
        $processStartInfo.FileName = "powershell.exe"
        $processStartInfo.Arguments = "-NoExit -Command `"cd '$WorkingDirectory'; $Command`""
        $processStartInfo.RedirectStandardOutput = $false
        $processStartInfo.RedirectStandardError = $false
        $processStartInfo.UseShellExecute = $true
        $processStartInfo.CreateNoWindow = $false
        
        $process = New-Object System.Diagnostics.Process
        $process.StartInfo = $processStartInfo
        $process.Start() | Out-Null
        
        Start-Sleep -Milliseconds 500
        
        if (!$process.HasExited) {
            $processes += $process
            Write-Host "   ↳ PID: $($process.Id)" -ForegroundColor Green
            return $process
        }
    }
    catch {
        Write-Host "❌ Error iniciando $Name : $($_.Exception.Message)" -ForegroundColor Red
        return $null
    }
}

# Función para limpiar procesos
function Stop-Services {
    Write-Host "`n🛑 Deteniendo todos los servicios..." -ForegroundColor Yellow
    
    foreach ($process in $processes) {
        if ($process -and !$process.HasExited) {
            try {
                $process.Kill()
                Write-Host "✅ Proceso $($process.Id) detenido" -ForegroundColor Green
            }
            catch {
                Write-Host "⚠️  No se pudo detener proceso $($process.Id)" -ForegroundColor Red
            }
        }
    }
    
    # Limpiar array
    $processes = @()
    Write-Host "✅ Todos los servicios detenidos." -ForegroundColor Green
}

# Capturar Ctrl+C
$null = Register-EngineEvent -SourceIdentifier PowerShell.Exiting -Action { Stop-Services }

try {
    Write-Host "=== INICIANDO SISTEMA ===" -ForegroundColor Magenta
    
    # === API Gateway ===
    Write-Host "🚀 Iniciando API Gateway..." -ForegroundColor Cyan
    Set-Location "api_gateway"
    mvn clean package -DskipTests
    $apiProcess = Start-Process PowerShell -ArgumentList "-NoExit", "-Command", "cd '$pwd'; java -jar target/*.jar" -PassThru
    $processes += $apiProcess
    Write-Host "   ↳ PID: $($apiProcess.Id)" -ForegroundColor Green
    Set-Location ".."
    
    # === Frontend ===
    Start-Service -Name "Frontend" -Command "npm run dev" -WorkingDirectory "front"
    
    # === Auth Service ===
    Start-Service -Name "Auth Service" -Command ".\venv\Scripts\Activate.ps1; uvicorn app.main:app --reload --port 8001" -WorkingDirectory "services/auth-service"
    
    # === Physical Activities Service ===
    Start-Service -Name "Physical Activities Service" -Command "go run cmd/rest_api/main.go" -WorkingDirectory "services/physical_activities_service"
    
    # === Gamification Service ===
    Start-Service -Name "Gamification Service" -Command ".\venv\Scripts\Activate.ps1; uvicorn app.main:app --reload --port 8003" -WorkingDirectory "services/gamification-service"
    
    # === User Service ===
    Start-Service -Name "User Service" -Command ".\venv\Scripts\Activate.ps1; uvicorn app.main:app --reload --port 8004" -WorkingDirectory "services/user-service"
    
    # === Posts Service ===
    Start-Service -Name "Posts Service" -Command "npx prisma generate; npm run dev" -WorkingDirectory "services/posts-service"
    
    # === Admin Service ===
    Start-Service -Name "Admin Service" -Command "php -S localhost:8006 -t public" -WorkingDirectory "services/admin-service"
    
    Write-Host "`n✅ Todos los servicios se están ejecutando." -ForegroundColor Green
    Write-Host "🛑 Presiona Ctrl+C para detenerlos." -ForegroundColor Yellow
    Write-Host "=== SISTEMA OPERATIVO ===" -ForegroundColor Magenta
    
    # Mantener el script activo
    while ($true) {
        Start-Sleep -Seconds 1
        
        # Verificar si algún proceso principal ha terminado
        $activeProcesses = $processes | Where-Object { !$_.HasExited }
        if ($activeProcesses.Count -lt $processes.Count) {
            Write-Host "⚠️  Algunos servicios se han detenido inesperadamente" -ForegroundColor Red
            break
        }
    }
}
catch {
    Write-Host "❌ Error crítico: $($_.Exception.Message)" -ForegroundColor Red
    Stop-Services
    exit 1
}