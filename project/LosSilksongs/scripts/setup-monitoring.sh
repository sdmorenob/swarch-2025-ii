#!/bin/bash
# setup-monitoring.sh
# Instala Prometheus, Grafana y Metrics Server para monitoreo de HPA

set -e

echo "╔════════════════════════════════════════════════════════════════╗"
echo "║     Instalando Stack de Monitoreo para MusicShare K8s         ║"
echo "╚════════════════════════════════════════════════════════════════╝"
echo ""

# 1. Instalar Metrics Server (requerido para HPA)
echo "📊 Instalando Metrics Server..."
kubectl apply -f https://github.com/kubernetes-sigs/metrics-server/releases/latest/download/components.yaml

echo "⏳ Esperando a que Metrics Server esté listo..."
kubectl wait --for=condition=ready pod -l k8s-app=metrics-server -n kube-system --timeout=120s || true
sleep 5

echo "✅ Metrics Server instalado"
echo ""

# 2. Crear namespace para monitoring
echo "🔧 Creando namespace de monitoring..."
kubectl create namespace monitoring --dry-run=client -o yaml | kubectl apply -f -

# 3. Instalar Prometheus usando Helm
echo "📈 Instalando Prometheus..."
helm repo add prometheus-community https://prometheus-community.github.io/helm-charts
helm repo update

helm upgrade --install prometheus prometheus-community/kube-prometheus-stack \
  --namespace monitoring \
  --set prometheus.prometheusSpec.retention=30d \
  --set grafana.adminPassword=admin \
  --set grafana.adminUser=admin \
  --wait

echo "✅ Prometheus instalado"
echo ""

# 4. Crear Ingress para Prometheus y Grafana
echo "🌐 Configurando acceso a dashboards..."

cat <<EOF | kubectl apply -f -
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: monitoring-ingress
  namespace: monitoring
spec:
  ingressClassName: nginx
  rules:
    - http:
        paths:
          - path: /prometheus
            pathType: Prefix
            backend:
              service:
                name: prometheus-operated
                port:
                  number: 9090
          - path: /grafana
            pathType: Prefix
            backend:
              service:
                name: prometheus-grafana
                port:
                  number: 80
EOF

echo "✅ Ingress configurado"
echo ""

# 5. Esperar a que Grafana esté listo
echo "⏳ Esperando a que Grafana esté listo..."
kubectl wait --for=condition=ready pod -l app.kubernetes.io/name=grafana -n monitoring --timeout=120s || true

echo ""
echo "╔════════════════════════════════════════════════════════════════╗"
echo "║                   ✅ SETUP COMPLETADO                        ║"
echo "╚════════════════════════════════════════════════════════════════╝"
echo ""
echo "📊 Acceso a los dashboards:"
echo "   Prometheus: http://localhost/prometheus"
echo "   Grafana:    http://localhost/grafana"
echo ""
echo "🔐 Credenciales de Grafana:"
echo "   Usuario: admin"
echo "   Contraseña: admin"
echo ""
echo "💡 Próximos pasos:"
echo "   1. Ejecuta: kubectl port-forward -n monitoring svc/prometheus-grafana 3000:80"
echo "   2. Abre: http://localhost:3000"
echo "   3. Importa dashboards de Grafana Cloud (ID: 315, 6417, 8588)"
echo ""
echo "🚀 Para ejecutar tests de carga:"
echo "   .\scripts\k6-load-test.ps1"
echo ""
