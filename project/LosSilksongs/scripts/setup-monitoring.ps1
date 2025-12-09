# setup-monitoring.ps1
# Instala Prometheus, Grafana y Metrics Server para monitoreo de HPA

Write-Host "╔════════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║     Instalando Stack de Monitoreo para MusicShare K8s         ║" -ForegroundColor Cyan
Write-Host "╚════════════════════════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""

# Verificar que kubectl y helm estén instalados
if (-not (Get-Command kubectl -ErrorAction SilentlyContinue)) {
    Write-Host "❌ kubectl no está instalado" -ForegroundColor Red
    exit 1
}

if (-not (Get-Command helm -ErrorAction SilentlyContinue)) {
    Write-Host "❌ helm no está instalado. Instálalo de: https://helm.sh/docs/intro/install/" -ForegroundColor Red
    exit 1
}

# 1. Instalar Metrics Server
Write-Host "📊 Instalando Metrics Server..." -ForegroundColor Green
kubectl apply -f https://github.com/kubernetes-sigs/metrics-server/releases/latest/download/components.yaml

Write-Host "⏳ Esperando a que Metrics Server esté listo..." -ForegroundColor Yellow
$attempt = 0
while ($attempt -lt 12) {
    $ready = kubectl get deployment metrics-server -n kube-system -o jsonpath='{.status.readyReplicas}' 2>$null
    if ($ready -eq "1") {
        break
    }
    Start-Sleep -Seconds 5
    $attempt++
}
Write-Host "✅ Metrics Server instalado" -ForegroundColor Green
Write-Host ""

# 2. Crear namespace para monitoring
Write-Host "🔧 Creando namespace de monitoring..." -ForegroundColor Green
kubectl create namespace monitoring --dry-run=client -o yaml | kubectl apply -f -

# 3. Instalar Prometheus usando Helm
Write-Host "📈 Instalando Prometheus y Grafana (esto puede tomar 2-3 minutos)..." -ForegroundColor Green
helm repo add prometheus-community https://prometheus-community.github.io/helm-charts
helm repo update

helm upgrade --install prometheus prometheus-community/kube-prometheus-stack `
  --namespace monitoring `
  --set prometheus.prometheusSpec.retention=30d `
  --set grafana.adminPassword=admin `
  --set grafana.adminUser=admin `
  --wait

Write-Host "✅ Prometheus instalado" -ForegroundColor Green
Write-Host ""

# 4. Esperar a que Grafana esté listo
Write-Host "⏳ Esperando a que Grafana esté listo..." -ForegroundColor Yellow
$attempt = 0
while ($attempt -lt 24) {
    $ready = kubectl get deployment prometheus-grafana -n monitoring -o jsonpath='{.status.readyReplicas}' 2>$null
    if ($ready -eq "1") {
        break
    }
    Start-Sleep -Seconds 5
    $attempt++
}

Write-Host ""
Write-Host "╔════════════════════════════════════════════════════════════════╗" -ForegroundColor Green
Write-Host "║                   ✅ SETUP COMPLETADO                        ║" -ForegroundColor Green
Write-Host "╚════════════════════════════════════════════════════════════════╝" -ForegroundColor Green
Write-Host ""

Write-Host "🔍 Verificando estado de la instalación..." -ForegroundColor Cyan
Write-Host ""
kubectl get pods -n monitoring
Write-Host ""

Write-Host "📊 Acceso a los dashboards:" -ForegroundColor Cyan
Write-Host "   Prometheus: http://localhost:9090"
Write-Host "   Grafana:    http://localhost:3000"
Write-Host ""

Write-Host "🔐 Credenciales de Grafana:" -ForegroundColor Yellow
Write-Host "   Usuario: admin"
Write-Host "   Contraseña: admin"
Write-Host ""

Write-Host "💡 Próximos pasos:" -ForegroundColor Green
Write-Host "   1. Ejecuta: kubectl port-forward -n monitoring svc/prometheus-grafana 3000:80" -ForegroundColor Cyan
Write-Host "   2. Abre: http://localhost:3000" -ForegroundColor Cyan
Write-Host "   3. En Grafana, ve a: Configuration > Data Sources > Add Prometheus" -ForegroundColor Cyan
Write-Host "      URL: http://prometheus-operated:9090" -ForegroundColor Cyan
Write-Host "   4. Importa dashboards:" -ForegroundColor Cyan
Write-Host "      - Kubernetes Cluster Monitoring (ID: 8588)" -ForegroundColor Cyan
Write-Host "      - Pod Resource Usage (ID: 6417)" -ForegroundColor Cyan
Write-Host ""

Write-Host "🚀 Para ejecutar tests de carga:" -ForegroundColor Green
Write-Host "   .\scripts\k6-load-test.ps1" -ForegroundColor Cyan
Write-Host ""

Write-Host "⚠️  IMPORTANTE: Verifica que los HPA ahora muestren métricas de CPU:" -ForegroundColor Yellow
Write-Host "   kubectl get hpa -n musicshare" -ForegroundColor Cyan
Write-Host ""
