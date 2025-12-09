#######################################################################
# RetoFit 2.0 - Kubernetes Deployment Script (PowerShell)
# Automatiza el deployment completo en Kubernetes local
#######################################################################

# Error handling
$ErrorActionPreference = "Stop"

#######################################################################
# Helper Functions
#######################################################################

function Write-Header {
    param([string]$Message)
    Write-Host ""
    Write-Host "═══════════════════════════════════════════════════════" -ForegroundColor Blue
    Write-Host "  $Message" -ForegroundColor Cyan
    Write-Host "═══════════════════════════════════════════════════════" -ForegroundColor Blue
    Write-Host ""
}

function Write-Step {
    param([string]$Message)
    Write-Host "✅ $Message" -ForegroundColor Green
}

function Write-ErrorMsg {
    param([string]$Message)
    Write-Host "❌ ERROR: $Message" -ForegroundColor Red
}

function Write-Warning {
    param([string]$Message)
    Write-Host "⚠️  WARNING: $Message" -ForegroundColor Yellow
}

function Write-Info {
    param([string]$Message)
    Write-Host "⏳ $Message" -ForegroundColor Cyan
}

function Test-CommandExists {
    param([string]$Command)
    $null -ne (Get-Command $Command -ErrorAction SilentlyContinue)
}

function Wait-ForPods {
    param(
        [string]$Label,
        [int]$Timeout = 120,
        [string]$Namespace = "default"
    )

    Write-Info "Esperando a que los pods con label '$Label' estén listos (timeout: ${Timeout}s)..."

    try {
        kubectl wait --for=condition=ready pod -l $Label --timeout="${Timeout}s" -n $Namespace 2>$null | Out-Null
        Write-Step "Pods con label '$Label' están listos"
        return $true
    }
    catch {
        Write-ErrorMsg "Timeout esperando pods con label '$Label'"
        kubectl get pods -l $Label -n $Namespace
        return $false
    }
}

#######################################################################
# Pre-flight Checks
#######################################################################

function Test-Prerequisites {
    Write-Header "⚙️  Pre-flight Checks"

    # Check kubectl
    if (-not (Test-CommandExists "kubectl")) {
        Write-ErrorMsg "kubectl no está instalado"
        exit 1
    }
    Write-Step "kubectl instalado"

    # Check Docker
    if (-not (Test-CommandExists "docker")) {
        Write-ErrorMsg "Docker no está instalado"
        exit 1
    }
    Write-Step "Docker instalado"

    # Check cluster connection
    try {
        kubectl cluster-info 2>$null | Out-Null
        Write-Step "Conexión al cluster exitosa"
    }
    catch {
        Write-ErrorMsg "No se puede conectar al cluster de Kubernetes"
        Write-Host ""
        Write-Host "Inicializa tu cluster primero:"
        Write-Host "  minikube: minikube start --memory=8192 --cpus=4"
        Write-Host "  kind: kind create cluster --name retofit"
        Write-Host "  Docker Desktop: Habilitar Kubernetes en Settings"
        exit 1
    }

    # Detect cluster type
    $nodeName = kubectl get nodes -o jsonpath='{.items[0].metadata.name}' 2>$null

    if ($nodeName -match "minikube") {
        $script:ClusterType = "minikube"
        Write-Step "Cluster detectado: minikube"
    }
    elseif ($nodeName -match "kind") {
        $script:ClusterType = "kind"
        $context = kubectl config current-context
        $script:ClusterName = $context -replace "kind-", ""
        Write-Step "Cluster detectado: kind ($ClusterName)"
    }
    elseif ((kubectl config current-context) -match "docker-desktop") {
        $script:ClusterType = "docker-desktop"
        Write-Step "Cluster detectado: Docker Desktop"
    }
    else {
        $script:ClusterType = "docker-desktop"
        Write-Warning "Tipo de cluster desconocido, asumiendo Docker Desktop"
    }

    # Check TLS certificates
    if (-not (Test-Path ".\nginx\tls\nginx.pem") -or -not (Test-Path ".\nginx\tls\nginx-key.pem")) {
        Write-ErrorMsg "Certificados TLS no encontrados en nginx\tls\"
        exit 1
    }
    Write-Step "Certificados TLS encontrados"

    Write-Host ""
}

#######################################################################
# Build Docker Images
#######################################################################

function Build-DockerImages {
    Write-Header "📦 Building Docker Images"

    $images = @{
        "auth-service"         = ".\services\auth-service"
        "users-service"        = ".\services\user-service"
        "activities-service"   = ".\services\physical_activities_service"
        "gamification-service" = ".\services\gamification-service"
        "posts-service"        = ".\services\posts-service"
        "admin-service"        = ".\services\admin-service"
        "api-gateway"          = ".\api_gateway_2.1"
        "landing-page"         = ".\landing-page"
        "frontend"             = ".\front"
    }

    foreach ($name in $images.Keys) {
        $path = $images[$name]
        Write-Info "Building retofit/${name}:latest..."

        try {
            docker build -t "retofit/${name}:latest" $path 2>&1 | Out-File "docker-build-${name}.log"
            Write-Step "retofit/${name}:latest construida"
        }
        catch {
            Write-ErrorMsg "Error construyendo retofit/${name}:latest"
            Write-Host "Ver logs en: docker-build-${name}.log"
            Get-Content "docker-build-${name}.log" -Tail 20
            exit 1
        }
    }

    Write-Host ""
}

#######################################################################
# Load Images into Cluster
#######################################################################

function Import-ImagesToCluster {
    Write-Header "📦 Loading Images into Cluster"

    $images = @(
        "auth-service",
        "users-service",
        "activities-service",
        "gamification-service",
        "posts-service",
        "admin-service",
        "api-gateway",
        "landing-page",
        "frontend"
    )

    switch ($script:ClusterType) {
        "minikube" {
            Write-Info "Cargando imágenes en minikube..."
            foreach ($image in $images) {
                Write-Info "Cargando retofit/${image}:latest..."
                minikube image load "retofit/${image}:latest" 2>&1 | Out-Null
                Write-Step "retofit/${image}:latest cargada en minikube"
            }
        }
        "kind" {
            Write-Info "Cargando imágenes en kind..."
            foreach ($image in $images) {
                Write-Info "Cargando retofit/${image}:latest..."
                kind load docker-image "retofit/${image}:latest" --name $script:ClusterName 2>&1 | Out-Null
                Write-Step "retofit/${image}:latest cargada en kind"
            }
        }
        "docker-desktop" {
            Write-Step "Docker Desktop usa imágenes locales automáticamente"
        }
    }

    Write-Host ""
}

#######################################################################
# Deploy Resources
#######################################################################

function Deploy-Secrets {
    Write-Header "🔒 Deploying Secrets"

    # Create TLS secret
    Write-Info "Creando TLS secret para Nginx..."
    kubectl create secret generic nginx-tls-secret `
        --from-file=nginx.pem=.\nginx\tls\nginx.pem `
        --from-file=nginx-key.pem=.\nginx\tls\nginx-key.pem `
        --dry-run=client -o yaml | kubectl apply -f - 2>&1 | Out-Null

    Write-Step "TLS secret creado"

    # Apply secret YAMLs
    Write-Info "Aplicando secrets YAML..."
    kubectl apply -f k8s\02-secrets\ 2>&1 | Out-Null
    Write-Step "Secrets YAML aplicados"

    $secretCount = (kubectl get secrets | Select-String "retofit|jwt|database|mongodb|smtp|cloudinary|firebase|gemini|nginx-tls").Count
    Write-Step "Total secrets creados: $secretCount"

    Write-Host ""
}

function Deploy-ConfigMaps {
    Write-Header "⚙️  Deploying ConfigMaps"

    Write-Info "Aplicando ConfigMaps..."
    kubectl apply -f k8s\01-configmaps\ 2>&1 | Out-Null
    Write-Step "ConfigMaps aplicados"

    kubectl get configmaps | Select-String "nginx-config|api-gateway-config"

    Write-Host ""
}

function Deploy-Services {
    Write-Header "🌐 Deploying Services"

    Write-Info "Aplicando Services..."
    kubectl apply -f k8s\03-services\ 2>&1 | Out-Null
    Write-Step "Services aplicados"

    Write-Host ""
    kubectl get services

    Write-Host ""
}

function Deploy-Backend {
    Write-Header "💾 Deploying Backend Services"

    $services = @(
        "auth-service",
        "users-service",
        "activities-service",
        "gamification-service",
        "posts-service",
        "admin-service"
    )

    foreach ($service in $services) {
        Write-Info "Desplegando ${service}..."
        kubectl apply -f "k8s\04-deployments\${service}-deployment.yaml" 2>&1 | Out-Null
        Write-Step "${service} desplegado"
    }

    Write-Info "Esperando a que los servicios backend estén listos..."
    if (Wait-ForPods "tier=backend" 180) {
        Write-Step "Todos los servicios backend están listos"
    }
    else {
        Write-ErrorMsg "Timeout esperando servicios backend"
        kubectl get pods -l tier=backend
        exit 1
    }

    Write-Host ""
}

function Deploy-Gateway {
    Write-Header "🌐 Deploying API Gateway"

    Write-Info "Desplegando API Gateway..."
    kubectl apply -f k8s\04-deployments\api-gateway-deployment.yaml 2>&1 | Out-Null
    Write-Step "API Gateway desplegado"

    if (Wait-ForPods "app=api-gateway" 180) {
        Write-Step "API Gateway está listo"
    }
    else {
        Write-ErrorMsg "Timeout esperando API Gateway"
        kubectl get pods -l app=api-gateway
        exit 1
    }

    Write-Host ""
}

function Deploy-Frontends {
    Write-Header "🚀 Deploying Frontends"

    $frontends = @("landing-page", "frontend")

    foreach ($frontend in $frontends) {
        Write-Info "Desplegando ${frontend}..."
        kubectl apply -f "k8s\04-deployments\${frontend}-deployment.yaml" 2>&1 | Out-Null
        Write-Step "${frontend} desplegado"
    }

    if (Wait-ForPods "tier=frontend" 120) {
        Write-Step "Frontends están listos"
    }
    else {
        Write-Warning "Algunos frontends pueden no estar listos, continuando..."
    }

    Write-Host ""
}

function Deploy-Nginx {
    Write-Header "🌐 Deploying Nginx Proxy"

    Write-Info "Desplegando Nginx..."
    kubectl apply -f k8s\04-deployments\nginx-deployment.yaml 2>&1 | Out-Null
    Write-Step "Nginx desplegado"

    if (Wait-ForPods "app=nginx-proxy" 60) {
        Write-Step "Nginx está listo"
    }
    else {
        Write-ErrorMsg "Timeout esperando Nginx"
        kubectl get pods -l app=nginx-proxy
        exit 1
    }

    Write-Host ""
}

function Deploy-NetworkPolicies {
    Write-Header "🔒 Deploying Network Policies"

    Write-Info "Aplicando NetworkPolicies..."
    try {
        kubectl apply -f k8s\05-network-policies\ 2>&1 | Out-Null
        Write-Step "NetworkPolicies aplicadas"
    }
    catch {
        Write-Warning "Error aplicando NetworkPolicies (puede ser normal en algunos clusters)"
    }

    kubectl get networkpolicies 2>$null

    Write-Host ""
}

#######################################################################
# Verify & Report
#######################################################################

function Test-Deployment {
    Write-Header "✅ Verifying Deployment"

    Write-Host "Pods Status:" -ForegroundColor Cyan
    kubectl get pods -o wide

    Write-Host ""
    Write-Host "Services:" -ForegroundColor Cyan
    kubectl get services

    Write-Host ""
    Write-Host "Deployments:" -ForegroundColor Cyan
    kubectl get deployments

    $totalPods = (kubectl get pods --no-headers | Measure-Object).Count
    $runningPods = (kubectl get pods --no-headers | Select-String "Running" | Measure-Object).Count

    Write-Host ""
    if ($runningPods -eq $totalPods) {
        Write-Step "Todos los pods están Running ($runningPods/$totalPods)"
    }
    else {
        Write-Warning "Solo $runningPods/$totalPods pods están Running"
        Write-Host ""
        Write-Host "Pods con problemas:"
        kubectl get pods | Select-String -NotMatch "Running"
    }

    Write-Host ""
}

function Show-PostDeploymentInfo {
    Write-Header "🚀 Deployment Complete!"

    Write-Host "Acceso a la aplicación:" -ForegroundColor Cyan
    Write-Host ""

    switch ($script:ClusterType) {
        "minikube" {
            Write-Host "⚠️  Para minikube, ejecuta en otra terminal:" -ForegroundColor Yellow
            Write-Host "   minikube tunnel" -ForegroundColor Green
            Write-Host ""
        }
        "kind" {
            Write-Host "⚠️  kind no soporta LoadBalancer nativamente" -ForegroundColor Yellow
            Write-Host "   Usa port-forward: kubectl port-forward svc/nginx-proxy 8443:443" -ForegroundColor Green
            Write-Host ""
        }
    }

    Write-Host "  Landing Page:  https://localhost/" -ForegroundColor Green
    Write-Host "  Dashboard:     https://localhost/dashboard" -ForegroundColor Green
    Write-Host "  Admin Panel:   https://localhost/admin" -ForegroundColor Green
    Write-Host ""

    Write-Host "Comandos útiles:" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "  Ver todos los pods:"
    Write-Host "    kubectl get pods -o wide" -ForegroundColor Green
    Write-Host ""
    Write-Host "  Ver logs de un servicio:"
    Write-Host "    kubectl logs -l app=auth-service -f --tail=100" -ForegroundColor Green
    Write-Host ""
    Write-Host "  Escalar un servicio:"
    Write-Host "    kubectl scale deployment auth-service --replicas=3" -ForegroundColor Green
    Write-Host ""

    Write-Host "Estado de réplicas:" -ForegroundColor Cyan
    Write-Host ""
    kubectl get deployments -o custom-columns=NAME:.metadata.name,REPLICAS:.spec.replicas,READY:.status.readyReplicas

    Write-Host ""
    Write-Host "✅ Deployment completado exitosamente!" -ForegroundColor Green
    Write-Host ""
}

#######################################################################
# Main Execution
#######################################################################

function Main {
    Clear-Host

    Write-Host @"
╔═══════════════════════════════════════════════════════════╗
║                                                           ║
║   ██████╗ ███████╗████████╗ ██████╗ ███████╗██╗████████╗  ║
║   ██╔══██╗██╔════╝╚══██╔══╝██╔═══██╗██╔════╝██║╚══██╔══╝  ║
║   ██████╔╝█████╗     ██║   ██║   ██║█████╗  ██║   ██║     ║
║   ██╔══██╗██╔══╝     ██║   ██║   ██║██╔══╝  ██║   ██║     ║
║   ██║  ██║███████╗   ██║   ╚██████╔╝██║     ██║   ██║     ║
║   ╚═╝  ╚═╝╚══════╝   ╚═╝    ╚═════╝ ╚═╝     ╚═╝   ╚═╝     ║
║                                                           ║
║         Kubernetes Deployment Script v1.0 (PowerShell)    ║
║                                                           ║
╚═══════════════════════════════════════════════════════════╝
"@ -ForegroundColor Blue

    Test-Prerequisites
    Build-DockerImages
    Import-ImagesToCluster
    Deploy-Secrets
    Deploy-ConfigMaps
    Deploy-Services
    Deploy-Backend
    Deploy-Gateway
    Deploy-Frontends
    Deploy-Nginx
    Deploy-NetworkPolicies
    Test-Deployment
    Show-PostDeploymentInfo
}

# Run
Main
