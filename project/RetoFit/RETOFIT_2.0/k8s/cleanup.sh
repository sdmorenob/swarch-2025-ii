#!/bin/bash

#######################################################################
# RetoFit 2.0 - Kubernetes Cleanup Script
# Elimina todos los recursos de Kubernetes
#######################################################################

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

print_header() {
    echo ""
    echo -e "${BLUE}════════════════════════════════════════════════════════${NC}"
    echo -e "${CYAN}  $1${NC}"
    echo -e "${BLUE}════════════════════════════════════════════════════════${NC}"
    echo ""
}

print_step() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

#######################################################################
# Confirmation
#######################################################################

confirm() {
    echo -e "${YELLOW}"
    cat << "EOF"
╔═══════════════════════════════════════════════════════════╗
║                      ⚠️  WARNING  ⚠️                      ║
║                                                           ║
║  This will DELETE all RetoFit resources from Kubernetes  ║
║                                                           ║
║  - All Deployments                                        ║
║  - All Services                                           ║
║  - All ConfigMaps                                         ║
║  - All Secrets                                            ║
║  - All NetworkPolicies                                    ║
║                                                           ║
╚═══════════════════════════════════════════════════════════╝
EOF
    echo -e "${NC}"

    read -p "Are you sure you want to continue? (yes/no): " -r
    echo
    if [[ ! $REPLY =~ ^[Yy][Ee][Ss]$ ]]; then
        echo "Cleanup cancelled."
        exit 0
    fi
}

#######################################################################
# Cleanup Functions
#######################################################################

cleanup_deployments() {
    print_header "🗑️  Deleting Deployments"

    if kubectl delete -f k8s/04-deployments/ 2>/dev/null; then
        print_step "Deployments eliminados"
    else
        print_warning "No se encontraron deployments o ya fueron eliminados"
    fi

    # Wait for pods to terminate
    echo "Esperando a que los pods terminen..."
    sleep 5

    local remaining_pods=$(kubectl get pods --no-headers 2>/dev/null | wc -l)
    if [ "$remaining_pods" -eq 0 ]; then
        print_step "Todos los pods han terminado"
    else
        print_warning "Aún hay ${remaining_pods} pods terminando..."
        kubectl get pods
    fi

    echo ""
}

cleanup_services() {
    print_header "🌐 Deleting Services"

    if kubectl delete -f k8s/03-services/ 2>/dev/null; then
        print_step "Services eliminados"
    else
        print_warning "No se encontraron services o ya fueron eliminados"
    fi

    echo ""
}

cleanup_network_policies() {
    print_header "🔒 Deleting Network Policies"

    if kubectl delete -f k8s/05-network-policies/ 2>/dev/null; then
        print_step "NetworkPolicies eliminadas"
    else
        print_warning "No se encontraron network policies o ya fueron eliminadas"
    fi

    echo ""
}

cleanup_configmaps() {
    print_header "⚙️  Deleting ConfigMaps"

    if kubectl delete -f k8s/01-configmaps/ 2>/dev/null; then
        print_step "ConfigMaps eliminados"
    else
        print_warning "No se encontraron configmaps o ya fueron eliminados"
    fi

    echo ""
}

cleanup_secrets() {
    print_header "🔐 Deleting Secrets"

    # Delete YAML secrets
    if kubectl delete -f k8s/02-secrets/ 2>/dev/null; then
        print_step "Secrets YAML eliminados"
    else
        print_warning "No se encontraron secrets YAML o ya fueron eliminados"
    fi

    # Delete TLS secret
    if kubectl delete secret nginx-tls-secret 2>/dev/null; then
        print_step "TLS secret eliminado"
    else
        print_warning "TLS secret no encontrado o ya fue eliminado"
    fi

    echo ""
}

cleanup_pvcs() {
    print_header "💾 Checking for PersistentVolumeClaims"

    local pvcs=$(kubectl get pvc --no-headers 2>/dev/null | wc -l)
    if [ "$pvcs" -gt 0 ]; then
        print_warning "Se encontraron ${pvcs} PVCs"
        kubectl get pvc

        read -p "¿Eliminar PVCs? (yes/no): " -r
        if [[ $REPLY =~ ^[Yy][Ee][Ss]$ ]]; then
            kubectl delete pvc --all
            print_step "PVCs eliminados"
        fi
    else
        print_step "No hay PVCs"
    fi

    echo ""
}

verify_cleanup() {
    print_header "✅ Verifying Cleanup"

    echo -e "${CYAN}Recursos restantes:${NC}"
    echo ""

    echo -e "${YELLOW}Pods:${NC}"
    kubectl get pods 2>/dev/null || echo "  (none)"

    echo ""
    echo -e "${YELLOW}Services:${NC}"
    kubectl get services 2>/dev/null | grep -v "kubernetes" || echo "  (none)"

    echo ""
    echo -e "${YELLOW}Deployments:${NC}"
    kubectl get deployments 2>/dev/null || echo "  (none)"

    echo ""
    echo -e "${YELLOW}ConfigMaps:${NC}"
    kubectl get configmaps 2>/dev/null | grep -v "kube-root-ca.crt" || echo "  (none)"

    echo ""
    echo -e "${YELLOW}Secrets:${NC}"
    kubectl get secrets 2>/dev/null | grep -v "default-token" || echo "  (none)"

    echo ""
}

#######################################################################
# Main
#######################################################################

main() {
    clear

    echo -e "${RED}"
    cat << "EOF"
╔═══════════════════════════════════════════════════════════╗
║                                                           ║
║              🗑️  KUBERNETES CLEANUP SCRIPT 🗑️            ║
║                                                           ║
║                    RetoFit 2.0 - v1.0                     ║
║                                                           ║
╚═══════════════════════════════════════════════════════════╝
EOF
    echo -e "${NC}"

    confirm

    cleanup_deployments
    cleanup_services
    cleanup_network_policies
    cleanup_configmaps
    cleanup_secrets
    cleanup_pvcs
    verify_cleanup

    print_header "✅ Cleanup Complete"
    echo -e "${GREEN}Todos los recursos de RetoFit han sido eliminados${NC}"
    echo ""
    echo -e "${CYAN}Para volver a desplegar:${NC}"
    echo -e "  ${GREEN}./k8s/deploy.sh${NC}"
    echo ""
}

main
