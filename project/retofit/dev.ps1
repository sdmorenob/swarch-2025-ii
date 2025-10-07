# Script PowerShell para desarrollo en Windows
# RetroFit Development Setup

param(
    [Parameter(Mandatory=$true)]
    [ValidateSet("start", "stop", "restart", "logs", "build", "clean", "db", "backend", "frontend")]
    [string]$Action
)

Write-Host "🚀 RetroFit Development Setup" -ForegroundColor Cyan
Write-Host "==============================" -ForegroundColor Cyan

switch ($Action) {
    "start" {
        Write-Host "📦 Iniciando todos los servicios..." -ForegroundColor Green
        docker-compose up -d
        Write-Host "✅ Servicios iniciados!" -ForegroundColor Green
        Write-Host "🌐 Frontend: http://localhost:3000" -ForegroundColor Yellow
        Write-Host "🔧 Backend API: http://localhost:8000" -ForegroundColor Yellow
        Write-Host "📊 Base de datos admin: http://localhost:8080" -ForegroundColor Yellow
        Write-Host ""
        Write-Host "Para ver los logs: .\dev.ps1 logs" -ForegroundColor Cyan
    }
    
    "stop" {
        Write-Host "🛑 Deteniendo todos los servicios..." -ForegroundColor Red
        docker-compose down
        Write-Host "✅ Servicios detenidos!" -ForegroundColor Green
    }
    
    "restart" {
        Write-Host "🔄 Reiniciando servicios..." -ForegroundColor Yellow
        docker-compose restart
        Write-Host "✅ Servicios reiniciados!" -ForegroundColor Green
    }
    
    "logs" {
        Write-Host "📋 Mostrando logs..." -ForegroundColor Cyan
        docker-compose logs -f
    }
    
    "build" {
        Write-Host "🏗️ Construyendo imágenes..." -ForegroundColor Blue
        docker-compose build --no-cache
        Write-Host "✅ Imágenes construidas!" -ForegroundColor Green
    }
    
    "clean" {
        Write-Host "🧹 Limpiando contenedores e imágenes..." -ForegroundColor Magenta
        docker-compose down -v --remove-orphans
        docker system prune -f
        Write-Host "✅ Sistema limpiado!" -ForegroundColor Green
    }
    
    "db" {
        Write-Host "🗄️ Accediendo a la base de datos..." -ForegroundColor Cyan
        docker-compose exec db psql -U retrofit_user -d retrofit_db
    }
    
    "backend" {
        Write-Host "🔧 Accediendo al contenedor del backend..." -ForegroundColor Cyan
        docker-compose exec backend /bin/bash
    }
    
    "frontend" {
        Write-Host "🌐 Accediendo al contenedor del frontend..." -ForegroundColor Cyan
        docker-compose exec frontend /bin/sh
    }
}

# Ejemplos de uso:
# .\dev.ps1 start
# .\dev.ps1 stop  
# .\dev.ps1 logs