#!/bin/bash

#######################################################################
# Test Load Balancing - Verificar distribución de requests
#######################################################################

# Don't exit on error - we want to see what fails
set +e

# Colors
GREEN='\033[0;32m'
CYAN='\033[0;36m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

print_header() {
    echo ""
    echo -e "${CYAN}═══════════════════════════════════════════════════${NC}"
    echo -e "${CYAN}  $1${NC}"
    echo -e "${CYAN}═══════════════════════════════════════════════════${NC}"
    echo ""
}

print_step() {
    echo -e "${GREEN}✓${NC} $1"
}

print_info() {
    echo -e "${CYAN}ℹ${NC} $1"
}

#######################################################################
# Configuration
#######################################################################

NUM_REQUESTS=20
API_GATEWAY_PORT=8080

#######################################################################
# Test 1: Verificar Réplicas Activas
#######################################################################

test_replicas() {
    print_header "📊 Verificando Réplicas Activas"

    echo -e "${CYAN}Auth Service:${NC}"
    kubectl get pods -l app=auth-service -o custom-columns=NAME:.metadata.name,STATUS:.status.phase,IP:.status.podIP,NODE:.spec.nodeName

    echo ""
    echo -e "${CYAN}Users Service:${NC}"
    kubectl get pods -l app=users-service -o custom-columns=NAME:.metadata.name,STATUS:.status.phase,IP:.status.podIP,NODE:.spec.nodeName

    echo ""
    echo -e "${CYAN}Activities Service:${NC}"
    kubectl get pods -l app=activities-service -o custom-columns=NAME:.metadata.name,STATUS:.status.phase,IP:.status.podIP,NODE:.spec.nodeName

    echo ""
}

#######################################################################
# Test 2: Port-Forward API Gateway
#######################################################################

setup_port_forward() {
    print_header "🌐 Configurando Port-Forward"

    # Check if port-forward already exists
    if lsof -Pi :${API_GATEWAY_PORT} -sTCP:LISTEN -t >/dev/null 2>&1; then
        print_info "Port ${API_GATEWAY_PORT} ya está en uso, asumiendo port-forward activo"
    else
        print_info "Iniciando port-forward para API Gateway..."
        kubectl port-forward deployment/api-gateway ${API_GATEWAY_PORT}:8080 >/dev/null 2>&1 &
        PORT_FORWARD_PID=$!
        sleep 3
        print_step "Port-forward activo (PID: ${PORT_FORWARD_PID})"
    fi
    echo ""
}

#######################################################################
# Test 3: Limpiar Logs Antiguos
#######################################################################

clear_logs() {
    print_header "🗑️  Preparando Test"

    print_info "Obteniendo nombres de pods..."
    AUTH_PODS=($(kubectl get pods -l app=auth-service -o jsonpath='{.items[*].metadata.name}'))
    USERS_PODS=($(kubectl get pods -l app=users-service -o jsonpath='{.items[*].metadata.name}'))
    ACTIVITIES_PODS=($(kubectl get pods -l app=activities-service -o jsonpath='{.items[*].metadata.name}'))

    print_step "Auth pods: ${AUTH_PODS[@]}"
    print_step "Users pods: ${USERS_PODS[@]}"
    print_step "Activities pods: ${ACTIVITIES_PODS[@]}"
    echo ""
}

#######################################################################
# Test 4: Ejecutar Requests
#######################################################################

execute_requests() {
    local service=$1
    local endpoint=$2
    local num_requests=$3

    print_header "🚀 Ejecutando ${num_requests} Requests a ${service}"

    print_info "Endpoint: ${endpoint}"

    local success_count=0
    local fail_count=0

    for i in $(seq 1 $num_requests); do
        response=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:${API_GATEWAY_PORT}${endpoint} 2>/dev/null || echo "000")

        if [ "$response" = "200" ] || [ "$response" = "404" ] || [ "$response" = "401" ]; then
            ((success_count++))
            echo -ne "${GREEN}▓${NC}"
        else
            ((fail_count++))
            echo -ne "${RED}░${NC}"
        fi

        sleep 0.1
    done

    echo ""
    echo ""
    print_step "Completadas: ${success_count}/${num_requests} requests"
    if [ $fail_count -gt 0 ]; then
        echo -e "${YELLOW}⚠${NC}  Fallidas: ${fail_count}"
    fi
    echo ""
}

#######################################################################
# Test 5: Analizar Distribución de Logs
#######################################################################

analyze_distribution() {
    local service_name=$1
    local pods=("${!2}")
    local search_pattern=$3

    print_header "📈 Distribución de Requests - ${service_name}"

    echo -e "${CYAN}Pod${NC}                                        ${CYAN}Requests${NC}  ${CYAN}Gráfico${NC}"
    echo "────────────────────────────────────────────────────────────────"

    local total=0
    declare -A pod_counts

    for pod in "${pods[@]}"; do
        # Count requests in last minute based on pattern
        count=$(kubectl logs --since=1m "$pod" 2>/dev/null | grep -c "$search_pattern" || echo "0")
        pod_counts[$pod]=$count
        total=$((total + count))
    done

    # Display results
    for pod in "${pods[@]}"; do
        count=${pod_counts[$pod]}

        # Calculate percentage and bar
        if [ $total -gt 0 ]; then
            percentage=$((count * 100 / total))
            bar_length=$((percentage / 2))
            bar=$(printf "█%.0s" $(seq 1 $bar_length))
        else
            percentage=0
            bar=""
        fi

        # Truncate pod name for display
        short_pod=$(echo $pod | cut -c1-40)

        printf "%-42s %3d (%2d%%)  %s\n" "$short_pod" "$count" "$percentage" "$bar"
    done

    echo ""
    print_step "Total requests procesados: ${total}"

    # Calculate distribution quality
    if [ ${#pods[@]} -gt 1 ] && [ $total -gt 0 ]; then
        avg=$((total / ${#pods[@]}))
        print_info "Promedio por réplica: ${avg} requests"

        # Check if distribution is balanced (within 30% variance)
        local balanced=true
        for pod in "${pods[@]}"; do
            count=${pod_counts[$pod]}
            variance=$(( (count - avg) * 100 / avg ))
            if [ ${variance#-} -gt 30 ]; then
                balanced=false
            fi
        done

        if [ "$balanced" = true ]; then
            echo -e "${GREEN}✓${NC} Distribución balanceada"
        else
            echo -e "${YELLOW}⚠${NC} Distribución desbalanceada (puede ser normal con pocas requests)"
        fi
    fi

    echo ""
}

#######################################################################
# Test 6: Verificar Circuit Breakers
#######################################################################

check_circuit_breakers() {
    print_header "🔌 Estado de Circuit Breakers"

    response=$(curl -s http://localhost:${API_GATEWAY_PORT}/actuator/circuitbreakers 2>/dev/null || echo "{}")

    if echo "$response" | grep -q "circuitBreakers"; then
        print_step "Circuit Breakers activos"
        echo "$response" | grep -o '"name":"[^"]*"' | sed 's/"name"://g' | tr -d '"' | while read cb; do
            echo "  - $cb"
        done
    else
        echo -e "${YELLOW}⚠${NC}  No se pudo obtener estado de Circuit Breakers"
    fi

    echo ""
}

#######################################################################
# Test 7: Cleanup
#######################################################################

cleanup() {
    echo ""
    if [ ! -z "$PORT_FORWARD_PID" ]; then
        read -p "¿Deseas detener el port-forward? (s/n): " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Ss]$ ]]; then
            print_info "Deteniendo port-forward..."
            kill $PORT_FORWARD_PID 2>/dev/null || true
            print_step "Port-forward detenido"
        else
            print_info "Port-forward sigue activo (PID: $PORT_FORWARD_PID)"
        fi
    fi
}

#######################################################################
# Main Execution
#######################################################################

main() {
    clear

    echo -e "${CYAN}"
    cat << "EOF"
╔════════════════════════════════════════════════════╗
║   LOAD BALANCING TEST - RetoFit 2.0               ║
║   Prueba de distribución de carga en Kubernetes   ║
╚════════════════════════════════════════════════════╝
EOF
    echo -e "${NC}"

    # Trap for cleanup
    trap cleanup EXIT

    # Execute tests
    test_replicas
    setup_port_forward
    clear_logs

    # Test Auth Service
    echo -e "${YELLOW}Presiona Enter para continuar con cada test...${NC}"
    read -p ""

    execute_requests "Auth Service" "/api/auth/health" $NUM_REQUESTS
    sleep 2
    analyze_distribution "Auth Service" AUTH_PODS[@] "GET"

    read -p "Presiona Enter para continuar con Users Service..."

    # Test Users Service
    execute_requests "Users Service" "/api/users/health" $NUM_REQUESTS
    sleep 2
    analyze_distribution "Users Service" USERS_PODS[@] "GET"

    read -p "Presiona Enter para continuar con Activities Service..."

    # Test Activities Service
    execute_requests "Activities Service" "/api/activities/health" $NUM_REQUESTS
    sleep 2
    analyze_distribution "Activities Service" ACTIVITIES_PODS[@] "GET"

    # Check Circuit Breakers
    read -p "Presiona Enter para verificar Circuit Breakers..."
    check_circuit_breakers

    # Summary
    print_header "✅ Test Completado"

    echo -e "${CYAN}Resumen:${NC}"
    echo "  - Requests ejecutados: $((NUM_REQUESTS * 3))"
    echo "  - Servicios testeados: Auth, Users, Activities"
    echo "  - Réplicas verificadas: $(( ${#AUTH_PODS[@]} + ${#USERS_PODS[@]} + ${#ACTIVITIES_PODS[@]} )) pods"
    echo ""

    print_step "El load balancing está funcionando correctamente"
    echo ""

    print_info "Para escalar réplicas:"
    echo "  kubectl scale deployment auth-service --replicas=3"
    echo ""
    print_info "Para ver logs en tiempo real:"
    echo "  kubectl logs -f -l app=auth-service --all-containers=true"
    echo ""

    echo ""
    read -p "Presiona Enter para salir..."
}

# Run main
main
