#!/bin/bash
# Script de desarrollo para RetroFit App

echo "🚀 RetroFit Development Setup"
echo "=============================="

case "$1" in
  "start")
    echo "📦 Iniciando todos los servicios..."
    docker-compose up -d
    echo "✅ Servicios iniciados!"
    echo "🌐 Frontend: http://localhost:3000"
    echo "🔧 Backend API: http://localhost:8000"
    echo "📊 Base de datos admin: http://localhost:8080"
    echo ""
    echo "Para ver los logs: ./dev.sh logs"
    ;;
  
  "stop")
    echo "🛑 Deteniendo todos los servicios..."
    docker-compose down
    echo "✅ Servicios detenidos!"
    ;;
  
  "restart")
    echo "🔄 Reiniciando servicios..."
    docker-compose restart
    echo "✅ Servicios reiniciados!"
    ;;
  
  "logs")
    echo "📋 Mostrando logs..."
    docker-compose logs -f
    ;;
  
  "build")
    echo "🏗️ Construyendo imágenes..."
    docker-compose build --no-cache
    echo "✅ Imágenes construidas!"
    ;;
  
  "clean")
    echo "🧹 Limpiando contenedores e imágenes..."
    docker-compose down -v --remove-orphans
    docker system prune -f
    echo "✅ Sistema limpiado!"
    ;;
  
  "db")
    echo "🗄️ Accediendo a la base de datos..."
    docker-compose exec db psql -U retrofit_user -d retrofit_db
    ;;
  
  "backend")
    echo "🔧 Accediendo al contenedor del backend..."
    docker-compose exec backend /bin/bash
    ;;
  
  "frontend")
    echo "🌐 Accediendo al contenedor del frontend..."
    docker-compose exec frontend /bin/sh
    ;;
  
  *)
    echo "Uso: $0 {start|stop|restart|logs|build|clean|db|backend|frontend}"
    echo ""
    echo "Comandos disponibles:"
    echo "  start    - Iniciar todos los servicios"
    echo "  stop     - Detener todos los servicios"
    echo "  restart  - Reiniciar servicios"
    echo "  logs     - Ver logs en tiempo real"
    echo "  build    - Construir imágenes Docker"
    echo "  clean    - Limpiar contenedores e imágenes"
    echo "  db       - Conectar a la base de datos"
    echo "  backend  - Acceder al contenedor del backend"
    echo "  frontend - Acceder al contenedor del frontend"
    exit 1
    ;;
esac