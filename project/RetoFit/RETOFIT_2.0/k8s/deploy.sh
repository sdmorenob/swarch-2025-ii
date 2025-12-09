#!/bin/bash

#######################################################################
# RetoFit 2.0 - Kubernetes Deployment Script
# Automatiza el deployment completo en Kubernetes local
#######################################################################

#set -e  # Exit on error

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Emojis
CHECK="✅"
CROSS="❌"
ROCKET="🚀"
HOURGLASS="⏳"
GEAR="⚙️"
PACKAGE="📦"
NETWORK="🌐"
DATABASE="💾"
LOCK="🔒"

#######################################################################
# Helper Functions
#######################################################################

print_header() {
    echo ""
    echo -e "${BLUE}════════════════════════════════════════════════════════${NC}"
    echo -e "${CYAN}  $1${NC}"
    echo -e "${BLUE}════════════════════════════════════════════════════════${NC}"
    echo ""
}

print_step() {
    echo -e "${GREEN}${CHECK} $1${NC}"
}

print_error() {
    echo -e "${RED}${CROSS} ERROR: $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  WARNING: $1${NC}"
}

print_info() {
    echo -e "${CYAN}${HOURGLASS} $1${NC}"
}

# Check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Wait for pods to be ready
wait_for_pods() {
    local label=$1
    local timeout=$2
    local namespace=${3:-default}

    print_info "Esperando a que los pods con label '$label' estén listos (timeout: ${timeout}s)..."

    if kubectl wait --for=condition=ready pod -l "$label" --timeout="${timeout}s" -n "$namespace" 2>/dev/null; then
        print_step "Pods con label '$label' están listos"
        return 0
    else
        print_error "Timeout esperando pods con label '$label'"
        kubectl get pods -l "$label" -n "$namespace"
        return 1
    fi
}

#######################################################################
# Pre-flight Checks
#######################################################################

preflight_checks() {
    print_header "${GEAR} Pre-flight Checks"

    # Check kubectl
    if ! command_exists kubectl; then
        print_error "kubectl no está instalado"
        exit 1
    fi
    print_step "kubectl instalado"

    # Check Docker
    if ! command_exists docker; then
        print_error "Docker no está instalado"
        exit 1
    fi
    print_step "Docker instalado"

    # Check cluster connection
    if ! kubectl cluster-info >/dev/null 2>&1; then
        print_error "No se puede conectar al cluster de Kubernetes"
        echo ""
        echo "Inicializa tu cluster primero:"
        echo "  minikube: minikube start --memory=8192 --cpus=4"
        echo "  kind: kind create cluster --name retofit"
        echo "  Docker Desktop: Habilitar Kubernetes en Settings"
        exit 1
    fi
    print_step "Conexión al cluster exitosa"

    # Detect cluster type
    if kubectl get nodes -o jsonpath='{.items[0].metadata.name}' 2>/dev/null | grep -q "minikube"; then
        CLUSTER_TYPE="minikube"
        print_step "Cluster detectado: minikube"
    elif kubectl get nodes -o jsonpath='{.items[0].metadata.name}' 2>/dev/null | grep -q "kind"; then
        CLUSTER_TYPE="kind"
        CLUSTER_NAME=$(kubectl config current-context | sed 's/kind-//')
        print_step "Cluster detectado: kind (${CLUSTER_NAME})"
    elif kubectl config current-context 2>/dev/null | grep -q "docker-desktop"; then
        CLUSTER_TYPE="docker-desktop"
        print_step "Cluster detectado: Docker Desktop"
    else
        CLUSTER_TYPE="unknown"
        print_warning "Tipo de cluster desconocido, asumiendo Docker Desktop"
        CLUSTER_TYPE="docker-desktop"
    fi

    # Check if TLS certificates exist
    if [ ! -f "./nginx/tls/nginx.pem" ] || [ ! -f "./nginx/tls/nginx-key.pem" ]; then
        print_error "Certificados TLS no encontrados en nginx/tls/"
        exit 1
    fi
    print_step "Certificados TLS encontrados"

    echo ""
}

#######################################################################
# Build Docker Images
#######################################################################

build_images() {
    print_header "${PACKAGE} Building Docker Images"

    local images=(
        "auth-service:./services/auth-service"
        "users-service:./services/user-service"
        "activities-service:./services/physical_activities_service"
        "gamification-service:./services/gamification-service"
        "posts-service:./services/posts-service"
        "admin-service:./services/admin-service"
        "api-gateway:./api_gateway_2.1"
        "landing-page:./landing-page"
        "frontend:./front"
    )

    for image_info in "${images[@]}"; do
        IFS=':' read -r name path <<< "$image_info"

        print_info "Building retofit/${name}:latest..."

        if docker build -t "retofit/${name}:latest" "$path" > /tmp/docker-build-${name}.log 2>&1; then
            print_step "retofit/${name}:latest construida"
        else
            print_error "Error construyendo retofit/${name}:latest"
            echo "Ver logs en: /tmp/docker-build-${name}.log"
            tail -n 20 /tmp/docker-build-${name}.log
            exit 1
        fi
    done

    echo ""
}

#######################################################################
# Load Images into Cluster
#######################################################################

load_images() {
    print_header "${PACKAGE} Loading Images into Cluster"

    local images=(
        "auth-service"
        "users-service"
        "activities-service"
        "gamification-service"
        "posts-service"
        "admin-service"
        "api-gateway"
        "landing-page"
        "frontend"
    )

    case $CLUSTER_TYPE in
        minikube)
            print_info "Cargando imágenes en minikube..."
            for image in "${images[@]}"; do
                print_info "Cargando retofit/${image}:latest..."
                if minikube image load "retofit/${image}:latest" 2>&1 | grep -v "^$"; then
                    print_step "retofit/${image}:latest cargada en minikube"
                fi
            done
            ;;
        kind)
            print_info "Cargando imágenes en kind..."
            for image in "${images[@]}"; do
                print_info "Cargando retofit/${image}:latest..."
                if kind load docker-image "retofit/${image}:latest" --name "$CLUSTER_NAME" 2>&1; then
                    print_step "retofit/${image}:latest cargada en kind"
                fi
            done
            ;;
        docker-desktop)
            print_step "Docker Desktop usa imágenes locales automáticamente"
            ;;
    esac

    echo ""
}

#######################################################################
# Deploy Secrets
#######################################################################

deploy_secrets() {
    print_header "${LOCK} Deploying Secrets"

    # Create TLS secret
    print_info "Creando TLS secret para Nginx..."
    if kubectl create secret generic nginx-tls-secret \
        --from-file=nginx.pem=./nginx/tls/nginx.pem \
        --from-file=nginx-key.pem=./nginx/tls/nginx-key.pem \
        --dry-run=client -o yaml | kubectl apply -f - >/dev/null 2>&1; then
        print_step "TLS secret creado"
    else
        print_error "Error creando TLS secret"
        exit 1
    fi

    # Apply secret YAMLs
    print_info "Aplicando secrets YAML..."
    if kubectl apply -f k8s/02-secrets/ >/dev/null 2>&1; then
        print_step "Secrets YAML aplicados"
    else
        print_error "Error aplicando secrets"
        exit 1
    fi

    # Verify
    local secret_count=$(kubectl get secrets | grep -c "retofit\|jwt\|database\|mongodb\|smtp\|cloudinary\|firebase\|gemini\|nginx-tls" || true)
    print_step "Total secrets creados: ${secret_count}"

    echo ""
}

#######################################################################
# Deploy ConfigMaps
#######################################################################

deploy_configmaps() {
    print_header "${GEAR} Deploying ConfigMaps"

    print_info "Aplicando ConfigMaps..."
    if kubectl apply -f k8s/01-configmaps/ >/dev/null 2>&1; then
        print_step "ConfigMaps aplicados"
    else
        print_error "Error aplicando ConfigMaps"
        exit 1
    fi

    # Verify
    kubectl get configmaps | grep -E "nginx-config|api-gateway-config"

    echo ""
}

#######################################################################
# Deploy Services
#######################################################################

deploy_services() {
    print_header "${NETWORK} Deploying Services"

    print_info "Aplicando Services..."
    if kubectl apply -f k8s/03-services/ >/dev/null 2>&1; then
        print_step "Services aplicados"
    else
        print_error "Error aplicando Services"
        exit 1
    fi

    # Verify
    echo ""
    kubectl get services

    echo ""
}

#######################################################################
# Deploy Backend Services
#######################################################################

deploy_backend() {
    print_header "${DATABASE} Deploying Backend Services"

    local backend_services=(
        "auth-service"
        "users-service"
        "activities-service"
        "gamification-service"
        "posts-service"
        "admin-service"
    )

    for service in "${backend_services[@]}"; do
        print_info "Desplegando ${service}..."
        if kubectl apply -f "k8s/04-deployments/${service}-deployment.yaml" >/dev/null 2>&1; then
            print_step "${service} desplegado"
        else
            print_error "Error desplegando ${service}"
            exit 1
        fi
    done

    # Wait for backend services
    print_info "Esperando a que los servicios backend estén listos..."
    if wait_for_pods "tier=backend" "180"; then
        print_step "Todos los servicios backend están listos"
    else
        print_error "Timeout esperando servicios backend"
        kubectl get pods -l tier=backend
        exit 1
    fi

    echo ""
}

#######################################################################
# Deploy API Gateway
#######################################################################

deploy_gateway() {
    print_header "${NETWORK} Deploying API Gateway"

    print_info "Desplegando API Gateway..."
    if kubectl apply -f k8s/04-deployments/api-gateway-deployment.yaml >/dev/null 2>&1; then
        print_step "API Gateway desplegado"
    else
        print_error "Error desplegando API Gateway"
        exit 1
    fi

    # Wait for gateway
    if wait_for_pods "app=api-gateway" "180"; then
        print_step "API Gateway está listo"
    else
        print_error "Timeout esperando API Gateway"
        kubectl get pods -l app=api-gateway
        exit 1
    fi

    echo ""
}

#######################################################################
# Deploy Frontends
#######################################################################

deploy_frontends() {
    print_header "${ROCKET} Deploying Frontends"

    local frontends=(
        "landing-page"
        "frontend"
    )

    for frontend in "${frontends[@]}"; do
        print_info "Desplegando ${frontend}..."
        if kubectl apply -f "k8s/04-deployments/${frontend}-deployment.yaml" >/dev/null 2>&1; then
            print_step "${frontend} desplegado"
        else
            print_error "Error desplegando ${frontend}"
            exit 1
        fi
    done

    # Wait for frontends
    if wait_for_pods "tier=frontend" "120"; then
        print_step "Frontends están listos"
    else
        print_warning "Algunos frontends pueden no estar listos, continuando..."
    fi

    echo ""
}

#######################################################################
# Deploy Nginx
#######################################################################

deploy_nginx() {
    print_header "${NETWORK} Deploying Nginx Proxy"

    print_info "Desplegando Nginx..."
    if kubectl apply -f k8s/04-deployments/nginx-deployment.yaml >/dev/null 2>&1; then
        print_step "Nginx desplegado"
    else
        print_error "Error desplegando Nginx"
        exit 1
    fi

    # Wait for nginx
    if wait_for_pods "app=nginx-proxy" "60"; then
        print_step "Nginx está listo"
    else
        print_error "Timeout esperando Nginx"
        kubectl get pods -l app=nginx-proxy
        exit 1
    fi

    echo ""
}

#######################################################################
# Deploy Network Policies
#######################################################################

deploy_network_policies() {
    print_header "${LOCK} Deploying Network Policies"

    print_info "Aplicando NetworkPolicies..."
    if kubectl apply -f k8s/05-network-policies/ >/dev/null 2>&1; then
        print_step "NetworkPolicies aplicadas"
    else
        print_warning "Error aplicando NetworkPolicies (puede ser normal en algunos clusters)"
    fi

    # Verify
    kubectl get networkpolicies 2>/dev/null || print_warning "NetworkPolicies no soportadas en este cluster"

    echo ""
}

#######################################################################
# Verify Deployment
#######################################################################

verify_deployment() {
    print_header "${CHECK} Verifying Deployment"

    echo -e "${CYAN}Pods Status:${NC}"
    kubectl get pods -o wide

    echo ""
    echo -e "${CYAN}Services:${NC}"
    kubectl get services

    echo ""
    echo -e "${CYAN}Deployments:${NC}"
    kubectl get deployments

    # Check if all pods are running
    local total_pods=$(kubectl get pods --no-headers | wc -l)
    local running_pods=$(kubectl get pods --no-headers | grep -c "Running" || true)

    echo ""
    if [ "$running_pods" -eq "$total_pods" ]; then
        print_step "Todos los pods están Running (${running_pods}/${total_pods})"
    else
        print_warning "Solo ${running_pods}/${total_pods} pods están Running"
        echo ""
        echo "Pods con problemas:"
        kubectl get pods | grep -v "Running"
    fi

    echo ""
}

#######################################################################
# Post-Deployment Info
#######################################################################

post_deployment_info() {
    print_header "${ROCKET} Deployment Complete!"

    # Get LoadBalancer info
    echo -e "${CYAN}Acceso a la aplicación:${NC}"
    echo ""

    case $CLUSTER_TYPE in
        minikube)
            echo -e "${YELLOW}⚠️  Para minikube, ejecuta en otra terminal:${NC}"
            echo -e "   ${GREEN}minikube tunnel${NC}"
            echo ""
            ;;
        kind)
            echo -e "${YELLOW}⚠️  kind no soporta LoadBalancer nativamente${NC}"
            echo -e "   Usa port-forward: ${GREEN}kubectl port-forward svc/nginx-proxy 8443:443${NC}"
            echo ""
            ;;
    esac

    echo -e "  ${GREEN}Landing Page:${NC}  https://localhost/"
    echo -e "  ${GREEN}Dashboard:${NC}     https://localhost/dashboard"
    echo -e "  ${GREEN}Admin Panel:${NC}   https://localhost/admin"
    echo ""

    echo -e "${CYAN}Comandos útiles:${NC}"
    echo ""
    echo -e "  Ver todos los pods:"
    echo -e "    ${GREEN}kubectl get pods -o wide${NC}"
    echo ""
    echo -e "  Ver logs de un servicio:"
    echo -e "    ${GREEN}kubectl logs -l app=auth-service -f --tail=100${NC}"
    echo ""
    echo -e "  Escalar un servicio:"
    echo -e "    ${GREEN}kubectl scale deployment auth-service --replicas=3${NC}"
    echo ""
    echo -e "  Ver circuit breakers (API Gateway):"
    echo -e "    ${GREEN}kubectl port-forward deployment/api-gateway 8081:8081${NC}"
    echo -e "    ${GREEN}curl http://localhost:8081/actuator/circuitbreakers${NC}"
    echo ""
    echo -e "  Test de conectividad:"
    echo -e "    ${GREEN}curl -k https://localhost/${NC}"
    echo ""

    echo -e "${CYAN}Estado de réplicas:${NC}"
    echo ""
    kubectl get deployments -o custom-columns=NAME:.metadata.name,REPLICAS:.spec.replicas,READY:.status.readyReplicas

    echo ""
    echo -e "${GREEN}${CHECK} Deployment completado exitosamente!${NC}"
    echo ""
}

#######################################################################
# Main Execution
#######################################################################

main() {
    clear

    echo -e "${BLUE}"
    cat << "EOF"
╔═══════════════════════════════════════════════════════════╗
║                                                           ║
║   ██████╗ ███████╗████████╗ ██████╗ ███████╗██╗████████╗  ║
║   ██╔══██╗██╔════╝╚══██╔══╝██╔═══██╗██╔════╝██║╚══██╔══╝  ║
║   ██████╔╝█████╗     ██║   ██║   ██║█████╗  ██║   ██║     ║
║   ██╔══██╗██╔══╝     ██║   ██║   ██║██╔══╝  ██║   ██║     ║
║   ██║  ██║███████╗   ██║   ╚██████╔╝██║     ██║   ██║     ║
║   ╚═╝  ╚═╝╚══════╝   ╚═╝    ╚═════╝ ╚═╝     ╚═╝   ╚═╝     ║
║                                                           ║
║            Kubernetes Deployment Script v1.0              ║
║                                                           ║
╚═══════════════════════════════════════════════════════════╝
EOF
    echo -e "${NC}"

    # Execution
    preflight_checks
    build_images
    load_images
    deploy_secrets
    deploy_configmaps
    deploy_services
    deploy_backend
    deploy_gateway
    deploy_frontends
    deploy_nginx
    deploy_network_policies
    verify_deployment
    post_deployment_info
}

# Run main function
main
