#!/bin/bash
# =============================================
# Script seguro para levantar y detener servicios
# No afecta otros procesos del sistema
# =============================================

set -e
PIDS=()
GATEWAY_PID=""

# Función para iniciar un servicio y registrar su PID
start_service() {
  local name="$1"
  local cmd="$2"

  echo "🚀 Iniciando $name..."
  bash -c "$cmd &"
  local pid=$!
  PIDS+=($pid)
  echo "   ↳ PID: $pid"
}

# Captura Ctrl + C para detener todo
trap 'echo "🛑 Deteniendo todos los servicios..."; 
for pid in "${PIDS[@]}"; do 
  kill -9 $pid 2>/dev/null || true; 
done; 
if [ -n "$GATEWAY_PID" ]; then 
  kill -9 "$GATEWAY_PID" 2>/dev/null || true; 
fi; 
echo "✅ Todos los servicios detenidos."; 
exit 0' SIGINT

# === API Gateway ===
cd api_gateway
mvn clean package -DskipTests
java -jar target/*.jar &
cd ..
GATEWAY_PID=$!
echo "🚀 Iniciando API Gateway..."

# === Frontend ===
start_service "Frontend" "cd front && npm run dev"

# === Auth Service ===
start_service "Auth Service" "cd services/auth-service && source venv/bin/activate && uvicorn app.main:app --reload --port 8001"

# === Physical Activities Service ===
start_service "Physical Activities Service" "cd services/physical_activities_service && go run cmd/rest_api/main.go"

# === Gamification Service ===
start_service "Gamification Service" "cd services/gamification-service && source venv/bin/activate && uvicorn app.main:app --reload --port 8003"

# === User Service ===
start_service "User Service" "cd services/user-service && source venv/bin/activate && uvicorn app.main:app --reload --port 8004"

# === Posts Service ===
start_service "Posts Service" "cd services/posts-service && npx prisma generate && npm run dev"

# === Admin Service ===
start_service "Admin Service" "cd services/admin-service && php -S localhost:8006 -t public"

echo "✅ Todos los servicios se están ejecutando."
echo "🛑 Presiona Ctrl+C para detenerlos."

# Mantener el script activo
wait
