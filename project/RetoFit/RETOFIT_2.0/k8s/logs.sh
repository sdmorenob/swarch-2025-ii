#!/bin/bash

#######################################################################
# RetoFit 2.0 - Logs Viewer Script
# Facilita la visualización de logs de los servicios
#######################################################################

# Colors
GREEN='\033[0;32m'
CYAN='\033[0;36m'
YELLOW='\033[1;33m'
NC='\033[0m'

show_help() {
    cat << EOF
${CYAN}RetoFit 2.0 - Logs Viewer${NC}

Uso: $0 [OPCIÓN] [SERVICIO]

${YELLOW}Opciones:${NC}
  all               Ver logs de todos los servicios
  backend           Ver logs de todos los backend services
  frontend          Ver logs de todos los frontends
  gateway           Ver logs del API Gateway
  nginx             Ver logs de Nginx
  [service-name]    Ver logs de un servicio específico

${YELLOW}Servicios disponibles:${NC}
  auth              Auth Service
  users             Users Service
  activities        Activities Service
  gamification      Gamification Service
  posts             Posts Service
  admin             Admin Service
  api-gateway       API Gateway
  nginx             Nginx Proxy
  landing           Landing Page
  frontend          Main Frontend

${YELLOW}Ejemplos:${NC}
  $0 all                    # Logs de todos los servicios
  $0 auth                   # Logs del auth service
  $0 backend                # Logs de todos los backend
  $0 gateway                # Logs del API Gateway

${YELLOW}Flags adicionales (al final):${NC}
  -f, --follow              Seguir logs en tiempo real (tail -f)
  -n, --lines N             Número de líneas a mostrar (default: 50)
  -c, --container NAME      Contenedor específico en el pod
  -p, --previous            Logs del contenedor anterior (si crasheó)

${YELLOW}Ejemplos con flags:${NC}
  $0 auth -f                # Seguir logs de auth en tiempo real
  $0 all -n 100             # Últimas 100 líneas de todos
  $0 users -p               # Logs anteriores de users (si crasheó)

EOF
}

# Service mapping
get_label_selector() {
    case $1 in
        all)
            echo "all"
            ;;
        backend)
            echo "tier=backend"
            ;;
        frontend)
            echo "tier=frontend"
            ;;
        gateway|api-gateway)
            echo "app=api-gateway"
            ;;
        nginx)
            echo "app=nginx-proxy"
            ;;
        auth|auth-service)
            echo "app=auth-service"
            ;;
        users|users-service)
            echo "app=users-service"
            ;;
        activities|activities-service)
            echo "app=activities-service"
            ;;
        gamification|gamification-service)
            echo "app=gamification-service"
            ;;
        posts|posts-service)
            echo "app=posts-service"
            ;;
        admin|admin-service)
            echo "app=admin-service"
            ;;
        landing|landing-page)
            echo "app=landing-page"
            ;;
        frontend|main-frontend)
            echo "app=frontend"
            ;;
        *)
            echo ""
            ;;
    esac
}

# Parse flags
FOLLOW=""
TAIL="50"
CONTAINER=""
PREVIOUS=""

while [[ $# -gt 0 ]]; do
    case $1 in
        -h|--help)
            show_help
            exit 0
            ;;
        -f|--follow)
            FOLLOW="--follow"
            shift
            ;;
        -n|--lines)
            TAIL="$2"
            shift 2
            ;;
        -c|--container)
            CONTAINER="-c $2"
            shift 2
            ;;
        -p|--previous)
            PREVIOUS="--previous"
            shift
            ;;
        *)
            SERVICE="$1"
            shift
            ;;
    esac
done

# Default to all if no service specified
if [ -z "$SERVICE" ]; then
    SERVICE="all"
fi

# Get label selector
SELECTOR=$(get_label_selector "$SERVICE")

if [ -z "$SELECTOR" ]; then
    echo -e "${YELLOW}⚠️  Servicio desconocido: $SERVICE${NC}"
    echo ""
    show_help
    exit 1
fi

# Show header
echo -e "${CYAN}═══════════════════════════════════════════════════════${NC}"
echo -e "${CYAN}  Logs: $SERVICE${NC}"
echo -e "${CYAN}═══════════════════════════════════════════════════════${NC}"
echo ""

# Show logs
if [ "$SELECTOR" == "all" ]; then
    # All pods
    echo -e "${GREEN}Mostrando logs de todos los pods...${NC}"
    echo ""

    # Get all pods
    PODS=$(kubectl get pods -o name)

    for pod in $PODS; do
        POD_NAME=$(echo $pod | cut -d'/' -f2)
        echo -e "${YELLOW}>>> Logs de: $POD_NAME${NC}"
        kubectl logs "$pod" --tail=$TAIL $CONTAINER $PREVIOUS $FOLLOW 2>/dev/null || echo "  (no logs available)"
        echo ""
    done
else
    # Specific service(s)
    echo -e "${GREEN}Mostrando logs de: $SERVICE (label: $SELECTOR)${NC}"
    echo ""

    # Check if pods exist
    POD_COUNT=$(kubectl get pods -l "$SELECTOR" --no-headers 2>/dev/null | wc -l)

    if [ "$POD_COUNT" -eq 0 ]; then
        echo -e "${YELLOW}⚠️  No se encontraron pods con label: $SELECTOR${NC}"
        exit 1
    fi

    echo -e "${CYAN}Pods encontrados: $POD_COUNT${NC}"
    echo ""

    # Show logs
    if [ -n "$FOLLOW" ]; then
        # Follow mode - use kubectl logs with selector
        kubectl logs -l "$SELECTOR" --tail=$TAIL $CONTAINER $PREVIOUS $FOLLOW --prefix=true
    else
        # Static mode - show each pod separately
        PODS=$(kubectl get pods -l "$SELECTOR" -o name)

        for pod in $PODS; do
            POD_NAME=$(echo $pod | cut -d'/' -f2)
            echo -e "${YELLOW}>>> $POD_NAME${NC}"
            kubectl logs "$pod" --tail=$TAIL $CONTAINER $PREVIOUS 2>/dev/null || echo "  (no logs available)"
            echo ""
        done
    fi
fi
