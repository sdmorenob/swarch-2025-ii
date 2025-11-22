# Script para gestionar los microfrontends de Reto-Fit

param(
    [Parameter(Mandatory=$false)]
    [ValidateSet('dev', 'build', 'docker-up', 'docker-down', 'install', 'clean', 'help')]
    [string]$Command = 'help'
)

function Show-Help {
    Write-Host @"
==============================================
  Reto-Fit Microfrontends Manager
==============================================

Comandos disponibles:

  dev           - Iniciar ambos microfrontends en modo desarrollo
  build         - Construir ambos microfrontends
  docker-up     - Levantar todos los servicios con Docker Compose
  docker-down   - Detener todos los servicios Docker
  install       - Instalar dependencias en ambos microfrontends
  clean         - Limpiar node_modules y archivos de build
  help          - Mostrar esta ayuda

Ejemplos:
  .\microfrontends.ps1 dev
  .\microfrontends.ps1 docker-up
  .\microfrontends.ps1 install

==============================================
"@
}

function Start-Dev {
    Write-Host "🚀 Iniciando microfrontends en modo desarrollo..." -ForegroundColor Green
    
    # Iniciar landing page en background
    Write-Host "`n📄 Iniciando Landing Page (puerto 3001)..." -ForegroundColor Cyan
    Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd landing-page; npm run dev"
    
    Start-Sleep -Seconds 2
    
    # Iniciar frontend principal
    Write-Host "🎯 Iniciando Frontend Principal (puerto 3000)..." -ForegroundColor Cyan
    Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd front; npm run dev"
    
    Write-Host "`n✅ Microfrontends iniciados!" -ForegroundColor Green
    Write-Host "   Landing Page: http://localhost:3001" -ForegroundColor Yellow
    Write-Host "   Frontend:     http://localhost:3000" -ForegroundColor Yellow
}

function Build-All {
    Write-Host "🔨 Construyendo microfrontends..." -ForegroundColor Green
    
    # Build landing page
    Write-Host "`n📄 Construyendo Landing Page..." -ForegroundColor Cyan
    Set-Location landing-page
    npm run build
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Error al construir Landing Page" -ForegroundColor Red
        Set-Location ..
        return
    }
    Set-Location ..
    
    # Build frontend principal
    Write-Host "`n🎯 Construyendo Frontend Principal..." -ForegroundColor Cyan
    Set-Location front
    npm run build
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Error al construir Frontend Principal" -ForegroundColor Red
        Set-Location ..
        return
    }
    Set-Location ..
    
    Write-Host "`n✅ Builds completados exitosamente!" -ForegroundColor Green
}

function Start-Docker {
    Write-Host "🐳 Levantando servicios con Docker Compose..." -ForegroundColor Green
    docker-compose up --build -d
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "`n✅ Servicios iniciados!" -ForegroundColor Green
        Write-Host "   Aplicación: https://localhost/" -ForegroundColor Yellow
        Write-Host "   API:        https://localhost/api/" -ForegroundColor Yellow
        Write-Host "`nVer logs: docker-compose logs -f" -ForegroundColor Cyan
    } else {
        Write-Host "`n❌ Error al iniciar servicios" -ForegroundColor Red
    }
}

function Stop-Docker {
    Write-Host "🛑 Deteniendo servicios Docker..." -ForegroundColor Yellow
    docker-compose down
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "`n✅ Servicios detenidos" -ForegroundColor Green
    }
}

function Install-Dependencies {
    Write-Host "📦 Instalando dependencias..." -ForegroundColor Green
    
    # Instalar en landing page
    Write-Host "`n📄 Landing Page..." -ForegroundColor Cyan
    Set-Location landing-page
    npm install
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Error al instalar dependencias de Landing Page" -ForegroundColor Red
        Set-Location ..
        return
    }
    Set-Location ..
    
    # Instalar en frontend principal
    Write-Host "`n🎯 Frontend Principal..." -ForegroundColor Cyan
    Set-Location front
    npm install
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Error al instalar dependencias de Frontend Principal" -ForegroundColor Red
        Set-Location ..
        return
    }
    Set-Location ..
    
    Write-Host "`n✅ Dependencias instaladas!" -ForegroundColor Green
}

function Clean-All {
    Write-Host "🧹 Limpiando archivos..." -ForegroundColor Yellow
    
    $confirm = Read-Host "¿Eliminar node_modules y archivos de build? (s/N)"
    if ($confirm -ne 's') {
        Write-Host "Operación cancelada" -ForegroundColor Yellow
        return
    }
    
    # Limpiar landing page
    Write-Host "`n📄 Limpiando Landing Page..." -ForegroundColor Cyan
    if (Test-Path "landing-page/node_modules") { Remove-Item -Recurse -Force "landing-page/node_modules" }
    if (Test-Path "landing-page/.next") { Remove-Item -Recurse -Force "landing-page/.next" }
    
    # Limpiar frontend principal
    Write-Host "🎯 Limpiando Frontend Principal..." -ForegroundColor Cyan
    if (Test-Path "front/node_modules") { Remove-Item -Recurse -Force "front/node_modules" }
    if (Test-Path "front/.next") { Remove-Item -Recurse -Force "front/.next" }
    
    Write-Host "`n✅ Limpieza completada!" -ForegroundColor Green
}

# Ejecutar comando
switch ($Command) {
    'dev'         { Start-Dev }
    'build'       { Build-All }
    'docker-up'   { Start-Docker }
    'docker-down' { Stop-Docker }
    'install'     { Install-Dependencies }
    'clean'       { Clean-All }
    'help'        { Show-Help }
}
