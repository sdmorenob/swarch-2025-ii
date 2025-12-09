# Script de validación de la arquitectura de despliegue MusicShare
# Para Windows PowerShell

Write-Host "=================================================="
Write-Host "Validación de Arquitectura MusicShare" -ForegroundColor Cyan
Write-Host "=================================================="

$scriptsPath = Split-Path -Parent $MyInvocation.MyCommand.Path
$projectRoot = Split-Path -Parent $scriptsPath

$failedChecks = 0
$successfulChecks = 0

# Función para verificar archivo
function CheckFile {
    param (
        [string]$Path,
        [string]$Description
    )
    
    $fullPath = Join-Path $projectRoot $Path
    
    if (Test-Path $fullPath) {
        Write-Host "✓ $Description`: $Path" -ForegroundColor Green
        $script:successfulChecks++
    } else {
        Write-Host "✗ $Description`: $Path (NO ENCONTRADO)" -ForegroundColor Red
        $script:failedChecks++
    }
}

# Función para validar YAML
function ValidateYaml {
    param (
        [string]$Path
    )
    
    $fullPath = Join-Path $projectRoot $Path
    
    try {
        $output = & kubectl apply -f $fullPath --dry-run=client --validate=true 2>&1
        if ($LASTEXITCODE -eq 0) {
            Write-Host "✓ YAML válido: $Path" -ForegroundColor Green
            return $true
        } else {
            Write-Host "✗ Error al validar: $Path" -ForegroundColor Red
            Write-Host "  Error: $output" -ForegroundColor Red
            return $false
        }
    } catch {
        Write-Host "✗ Error al validar: $Path - $($_.Exception.Message)" -ForegroundColor Red
        return $false
    }
}

# Función para validar Kustomize
function ValidateKustomize {
    param (
        [string]$Path
    )
    
    $fullPath = Join-Path $projectRoot $Path
    
    try {
        $output = & kubectl kustomize $fullPath 2>&1
        if ($LASTEXITCODE -eq 0) {
            Write-Host "✓ Kustomize válido: $Path" -ForegroundColor Green
            return $true
        } else {
            Write-Host "✗ Error en kustomize: $Path" -ForegroundColor Red
            Write-Host "  Error: $output" -ForegroundColor Red
            return $false
        }
    } catch {
        Write-Host "✗ Error en kustomize: $Path - $($_.Exception.Message)" -ForegroundColor Red
        return $false
    }
}

# Función para validar contenido de archivo
function CheckFileContent {
    param (
        [string]$Path,
        [string]$SearchString,
        [string]$Description
    )
    
    $fullPath = Join-Path $projectRoot $Path
    
    if (-not (Test-Path $fullPath)) {
        Write-Host "✗ Archivo no encontrado: $Path" -ForegroundColor Red
        return $false
    }
    
    $content = Get-Content $fullPath -Raw
    
    if ($content -match $SearchString) {
        Write-Host "✓ $Description" -ForegroundColor Green
        return $true
    } else {
        Write-Host "✗ $Description (no encontrado)" -ForegroundColor Red
        return $false
    }
}

Write-Host ""
Write-Host "1. Verificando archivos de documentación..." -ForegroundColor Yellow
Write-Host "=================================================="

CheckFile "DEPLOYMENT_ARCHITECTURE.md" "Documentación de arquitectura"
CheckFile "DEPLOYMENT_GUIDE.md" "Guía de despliegue"
CheckFile "MIGRATION_TRAEFIK_TO_NGINX.md" "Guía de migración"
CheckFile "ARCHITECTURE_CHANGES_SUMMARY.md" "Resumen de cambios"

Write-Host ""
Write-Host "2. Verificando manifiestos NGINX..." -ForegroundColor Yellow
Write-Host "=================================================="

CheckFile "k8s/base/nginx-ingress-controller.yaml" "NGINX Ingress Controller"
CheckFile "k8s/app/ingress.yaml" "Configuración de Ingress"

Write-Host ""
Write-Host "3. Verificando manifiestos modificados..." -ForegroundColor Yellow
Write-Host "=================================================="

CheckFile "k8s/base/kustomization.yaml" "Kustomization base actualizado"
CheckFile "k8s/app/kustomization.yaml" "Kustomization app actualizado"
CheckFile "k8s/app/frontend-deployment-service.yaml" "Frontend Deployment mejorado"

Write-Host ""
Write-Host "4. Verificando manifiestos existentes..." -ForegroundColor Yellow
Write-Host "=================================================="

CheckFile "k8s/app/backend-deployments-services.yaml" "Backend services"
CheckFile "k8s/app/databases.yaml" "Bases de datos"
CheckFile "k8s/app/hpa.yaml" "Horizontal Pod Autoscaler"
CheckFile "k8s/app/frontend-config.yaml" "Frontend config"
CheckFile "k8s/app/cert-manager-issuer.yaml" "Cert-manager issuer"
CheckFile "k8s/app/namespace.yaml" "Namespace"

Write-Host ""
Write-Host "5. Validando sintaxis YAML..." -ForegroundColor Yellow
Write-Host "=================================================="

# Validar archivos YAML
if (ValidateYaml "k8s/base/nginx-ingress-controller.yaml") {
    $script:successfulChecks++
} else {
    $script:failedChecks++
}

if (ValidateYaml "k8s/app/ingress.yaml") {
    $script:successfulChecks++
} else {
    $script:failedChecks++
}

if (ValidateYaml "k8s/app/frontend-deployment-service.yaml") {
    $script:successfulChecks++
} else {
    $script:failedChecks++
}

Write-Host ""
Write-Host "6. Validando kustomize..." -ForegroundColor Yellow
Write-Host "=================================================="

if (ValidateKustomize "k8s/base") {
    $script:successfulChecks++
} else {
    $script:failedChecks++
}

if (ValidateKustomize "k8s/app") {
    $script:successfulChecks++
} else {
    $script:failedChecks++
}

Write-Host ""
Write-Host "7. Verificando que Traefik ha sido removido..." -ForegroundColor Yellow
Write-Host "=================================================="

# Verificar que Traefik no está en base kustomization
$baseKustomization = Join-Path $projectRoot "k8s/base/kustomization.yaml"
$baseContent = Get-Content $baseKustomization -Raw

if ($baseContent -match "traefik") {
    Write-Host "✗ Traefik aún está en kustomization.yaml" -ForegroundColor Red
    $script:failedChecks++
} else {
    Write-Host "✓ Traefik removido de kustomization.yaml" -ForegroundColor Green
    $script:successfulChecks++
}

# Verificar que IngressRoutes no están en app kustomization
$appKustomization = Join-Path $projectRoot "k8s/app/kustomization.yaml"
$appContent = Get-Content $appKustomization -Raw

if ($appContent -match "ingressroutes") {
    Write-Host "✗ IngressRoutes aún están en kustomization.yaml" -ForegroundColor Red
    $script:failedChecks++
} else {
    Write-Host "✓ IngressRoutes removidas de kustomization.yaml" -ForegroundColor Green
    $script:successfulChecks++
}

Write-Host ""
Write-Host "8. Verificando contenido de manifiestos..." -ForegroundColor Yellow
Write-Host "=================================================="

CheckFileContent "k8s/base/nginx-ingress-controller.yaml" "ingress-nginx" "NGINX namespace configurado"
CheckFileContent "k8s/app/ingress.yaml" "ingressClassName: nginx" "Ingress className configurado"
CheckFileContent "k8s/app/frontend-deployment-service.yaml" "frontend-loadbalancer" "Frontend LoadBalancer configurado"

Write-Host ""
Write-Host "9. Resumen de cambios..." -ForegroundColor Yellow
Write-Host "=================================================="

Write-Host ""
Write-Host "Archivos nuevos creados:" -ForegroundColor Cyan
Write-Host "  - DEPLOYMENT_ARCHITECTURE.md"
Write-Host "  - DEPLOYMENT_GUIDE.md"
Write-Host "  - MIGRATION_TRAEFIK_TO_NGINX.md"
Write-Host "  - ARCHITECTURE_CHANGES_SUMMARY.md"
Write-Host "  - k8s/base/nginx-ingress-controller.yaml"
Write-Host "  - k8s/app/ingress.yaml"

Write-Host ""
Write-Host "Archivos modificados:" -ForegroundColor Cyan
Write-Host "  - k8s/base/kustomization.yaml (Traefik → NGINX)"
Write-Host "  - k8s/app/kustomization.yaml (IngressRoute → Ingress)"
Write-Host "  - k8s/app/frontend-deployment-service.yaml (Mejorado)"
Write-Host "  - README.md (Sección de despliegue agregada)"

Write-Host ""
Write-Host "Archivos obsoletos (pueden eliminarse):" -ForegroundColor Yellow
Write-Host "  - k8s/base/traefik-crd.yaml"
Write-Host "  - k8s/base/traefik-deployment-updated.yaml"
Write-Host "  - k8s/app/ingressroutes.yaml"
Write-Host "  - k8s/TRAEFIK_SETUP.md"

Write-Host ""
Write-Host "=================================================="
Write-Host "Validación completada!" -ForegroundColor Cyan
Write-Host "=================================================="

Write-Host ""
Write-Host "Resumen de resultados:" -ForegroundColor Cyan
Write-Host "  ✓ Controles exitosos: $successfulChecks" -ForegroundColor Green
Write-Host "  ✗ Controles fallidos: $failedChecks" -ForegroundColor $(if ($failedChecks -eq 0) { "Green" } else { "Red" })

Write-Host ""
Write-Host "Próximos pasos:" -ForegroundColor Cyan
Write-Host "1. Revisar: DEPLOYMENT_ARCHITECTURE.md"
Write-Host "2. Revisar: DEPLOYMENT_GUIDE.md"
Write-Host "3. Ejecutar: kubectl apply -k k8s/"
Write-Host "4. Verificar: kubectl get pods -n musicshare"
Write-Host "5. Verificar: kubectl get ingress -n musicshare"
Write-Host ""

# Salir con código de error si hubo fallos
if ($failedChecks -gt 0) {
    exit 1
} else {
    exit 0
}
