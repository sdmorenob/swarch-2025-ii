#!/bin/bash

# Script de validación de la arquitectura de despliegue MusicShare
# Este script verifica que todos los manifiestos de Kubernetes están correctos

set -e

echo "=================================================="
echo "Validación de Arquitectura MusicShare"
echo "=================================================="

# Colores
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Función para imprimir resultados
check_file() {
    local file=$1
    local description=$2
    
    if [ -f "$file" ]; then
        echo -e "${GREEN}✓${NC} $description: $file"
        return 0
    else
        echo -e "${RED}✗${NC} $description: $file (NO ENCONTRADO)"
        return 1
    fi
}

# Función para validar YAML
validate_yaml() {
    local file=$1
    
    if ! kubectl apply -f "$file" --dry-run=client --validate=true 2>/dev/null; then
        echo -e "${RED}✗${NC} Error al validar: $file"
        return 1
    fi
    return 0
}

# Función para validar Kustomize
validate_kustomize() {
    local dir=$1
    
    if ! kubectl kustomize "$dir" > /dev/null 2>&1; then
        echo -e "${RED}✗${NC} Error al validar kustomize: $dir"
        return 1
    fi
    return 0
}

echo ""
echo "1. Verificando archivos de configuración..."
echo "=================================================="

# Verificar archivos nuevos
check_file "DEPLOYMENT_ARCHITECTURE.md" "Documentación de arquitectura"
check_file "DEPLOYMENT_GUIDE.md" "Guía de despliegue"
check_file "MIGRATION_TRAEFIK_TO_NGINX.md" "Guía de migración"
check_file "ARCHITECTURE_CHANGES_SUMMARY.md" "Resumen de cambios"

echo ""
echo "2. Verificando manifiestos NGINX..."
echo "=================================================="

check_file "k8s/base/nginx-ingress-controller.yaml" "NGINX Ingress Controller"
check_file "k8s/app/ingress.yaml" "Configuración de Ingress"

echo ""
echo "3. Verificando manifiestos modificados..."
echo "=================================================="

check_file "k8s/base/kustomization.yaml" "Kustomization base actualizado"
check_file "k8s/app/kustomization.yaml" "Kustomization app actualizado"
check_file "k8s/app/frontend-deployment-service.yaml" "Frontend Deployment mejorado"

echo ""
echo "4. Verificando manifiestos existentes..."
echo "=================================================="

check_file "k8s/app/backend-deployments-services.yaml" "Backend services"
check_file "k8s/app/databases.yaml" "Bases de datos"
check_file "k8s/app/hpa.yaml" "Horizontal Pod Autoscaler"
check_file "k8s/app/frontend-config.yaml" "Frontend config"
check_file "k8s/app/cert-manager-issuer.yaml" "Cert-manager issuer"
check_file "k8s/app/namespace.yaml" "Namespace"

echo ""
echo "5. Validando sintaxis YAML..."
echo "=================================================="

validate_yaml "k8s/base/nginx-ingress-controller.yaml" && \
    echo -e "${GREEN}✓${NC} NGINX Ingress Controller YAML válido" || \
    echo -e "${RED}✗${NC} Error en NGINX Ingress Controller YAML"

validate_yaml "k8s/app/ingress.yaml" && \
    echo -e "${GREEN}✓${NC} Ingress YAML válido" || \
    echo -e "${RED}✗${NC} Error en Ingress YAML"

validate_yaml "k8s/app/frontend-deployment-service.yaml" && \
    echo -e "${GREEN}✓${NC} Frontend deployment YAML válido" || \
    echo -e "${RED}✗${NC} Error en Frontend deployment YAML"

echo ""
echo "6. Validando kustomize..."
echo "=================================================="

validate_kustomize "k8s/base" && \
    echo -e "${GREEN}✓${NC} Kustomize base válido" || \
    echo -e "${RED}✗${NC} Error en kustomize base"

validate_kustomize "k8s/app" && \
    echo -e "${GREEN}✓${NC} Kustomize app válido" || \
    echo -e "${RED}✗${NC} Error en kustomize app"

echo ""
echo "7. Verificando que Traefik ha sido removido..."
echo "=================================================="

if grep -q "traefik" "k8s/base/kustomization.yaml"; then
    echo -e "${RED}✗${NC} Traefik aún está en kustomization.yaml"
else
    echo -e "${GREEN}✓${NC} Traefik removido de kustomization.yaml"
fi

if grep -q "ingressroutes" "k8s/app/kustomization.yaml"; then
    echo -e "${RED}✗${NC} IngressRoutes aún están en kustomization.yaml"
else
    echo -e "${GREEN}✓${NC} IngressRoutes removidas de kustomization.yaml"
fi

echo ""
echo "8. Verificando contenido de manifiestos..."
echo "=================================================="

if grep -q "ingress-nginx" "k8s/base/nginx-ingress-controller.yaml"; then
    echo -e "${GREEN}✓${NC} NGINX namespace configurado correctamente"
else
    echo -e "${RED}✗${NC} NGINX namespace no encontrado"
fi

if grep -q "ingressClassName: nginx" "k8s/app/ingress.yaml"; then
    echo -e "${GREEN}✓${NC} Ingress className configurado correctamente"
else
    echo -e "${RED}✗${NC} Ingress className no configurado"
fi

if grep -q "frontend-loadbalancer" "k8s/app/frontend-deployment-service.yaml"; then
    echo -e "${GREEN}✓${NC} Frontend LoadBalancer configurado"
else
    echo -e "${RED}✗${NC} Frontend LoadBalancer no encontrado"
fi

echo ""
echo "9. Resumen de cambios..."
echo "=================================================="

echo "Archivos nuevos creados:"
echo "  - DEPLOYMENT_ARCHITECTURE.md"
echo "  - DEPLOYMENT_GUIDE.md"
echo "  - MIGRATION_TRAEFIK_TO_NGINX.md"
echo "  - ARCHITECTURE_CHANGES_SUMMARY.md"
echo "  - k8s/base/nginx-ingress-controller.yaml"
echo "  - k8s/app/ingress.yaml"

echo ""
echo "Archivos modificados:"
echo "  - k8s/base/kustomization.yaml (Traefik → NGINX)"
echo "  - k8s/app/kustomization.yaml (IngressRoute → Ingress)"
echo "  - k8s/app/frontend-deployment-service.yaml (Mejorado)"
echo "  - README.md (Sección de despliegue agregada)"

echo ""
echo "Archivos obsoletos (pueden eliminarse):"
echo "  - k8s/base/traefik-crd.yaml"
echo "  - k8s/base/traefik-deployment-updated.yaml"
echo "  - k8s/app/ingressroutes.yaml"
echo "  - k8s/TRAEFIK_SETUP.md"

echo ""
echo "=================================================="
echo "Validación completada!"
echo "=================================================="
echo ""
echo "Próximos pasos:"
echo "1. Revisar: DEPLOYMENT_ARCHITECTURE.md"
echo "2. Revisar: DEPLOYMENT_GUIDE.md"
echo "3. Ejecutar: kubectl apply -k k8s/"
echo "4. Verificar: kubectl get pods -n musicshare"
echo "5. Verificar: kubectl get ingress -n musicshare"
echo ""
