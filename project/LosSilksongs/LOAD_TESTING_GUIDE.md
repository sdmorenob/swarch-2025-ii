# Load Testing & Monitoring con Kubernetes

## 📊 Overview

MusicShare en Kubernetes está configurado para:
- **HPA (Horizontal Pod Autoscaler)**: Escala automáticamente los pods según uso de CPU
- **Prometheus**: Recopila métricas del cluster
- **Grafana**: Visualización de métricas en dashboards

## 🚀 Ejecutar Tests de Carga con K6

### 1. Instalar k6

**Windows (Chocolatey):**
```powershell
choco install k6
```

**Windows (Direct):**
Descargar de https://github.com/grafana/k6/releases

**Linux/Mac:**
```bash
# macOS
brew install k6

# Linux
sudo apt-get install k6  # Debian/Ubuntu
sudo dnf install k6      # Fedora
```

### 2. Ejecutar el Test de Carga

**Opción A: Desde el script PowerShell (Recomendado para Windows)**
```powershell
cd c:\Users\andre\OneDrive\Documentos\10\ semestre\proyecto\MusicShare
.\scripts\k6-load-test.ps1 -BaseUrl "http://localhost"
```

**Opción B: Ejecutar k6 directamente**
```bash
cd MusicShare
k6 run k6/baseline.js --env BASE_URL=http://localhost
```

### 3. Configuración del Test

El test incluye:
- **Ramp-up**: Aumento gradual de usuarios virtuales (0 → 50 → 100)
- **Stabilización**: Mantiene 100 VUs por 5 minutos
- **Ramp-down**: Reducción gradual (100 → 0)
- **Duración total**: ~14 minutos

**Para test rápido de verificación:**
```bash
k6 run k6/baseline.js --env BASE_URL=http://localhost -d 1m
```

**Para test intenso (requiere más recursos):**
```bash
k6 run k6/baseline.js --env BASE_URL=http://localhost -s "duration=10m,target=300"
```

## 📈 Monitorear el Autoescalado

### Opción 1: Ver HPA en Tiempo Real

```bash
# Monitorear todos los HPA en la namespace
kubectl get hpa -n musicshare -w

# Monitorear HPA específico (ej: userservice)
kubectl get hpa userservice-hpa -n musicshare -w -o wide
```

### Opción 2: Ver Detalles de HPA

```bash
# Ver estado completo de un HPA
kubectl describe hpa userservice-hpa -n musicshare

# Ver métricas actuales
kubectl get hpa -n musicshare -o custom-columns=NAME:.metadata.name,REFERENCE:.spec.scaleTargetRef.name,TARGETS:.status.currentMetrics[0].resource.current.averageUtilization,MINPODS:.spec.minReplicas,MAXPODS:.spec.maxReplicas
```

### Opción 3: Ver Pods Escalando

```bash
# Ver pods en tiempo real
kubectl get pods -n musicshare -w -l app=userservice

# Ver con más detalles
kubectl get pods -n musicshare -o wide | grep userservice
```

## 🎨 Visualizar Métricas en Grafana

### Acceso a Grafana

1. **Obtener la IP del Ingress:**
```bash
kubectl get ingress -n musicshare
```

2. **Acceder a Grafana:**
   - URL: `http://localhost:3000` (si está en localhost)
   - Usuario: `admin`
   - Contraseña: `admin`

3. **Dashboards Disponibles:**
   - **Kubernetes Cluster Monitoring**: Muestra CPU, memoria, red
   - **Pod Resource Usage**: Detalles por pod
   - **HPA Status**: Estado de autoescalado

### Crear Dashboard Personalizado

1. Ir a **+ > Dashboard > New Panel**
2. Seleccionar datasource: **Prometheus**
3. Escribir queries PromQL útiles:

```promql
# CPU actual vs límite (%)
100 * (rate(container_cpu_usage_seconds_total{pod=~"userservice.*"}[1m])) / (container_spec_cpu_quota{pod=~"userservice.*"} / container_spec_cpu_period{pod=~"userservice.*"})

# Número de pods por servicio
count(kube_pod_labels{label_app=~"userservice|musicservice|social_service"}) by (label_app)

# Latencia de requests HTTP
histogram_quantile(0.95, http_request_duration_seconds_bucket)

# Tasa de error
rate(http_requests_total{status=~"5.."}[5m])
```

## 🔍 Monitorear con Prometheus

1. **Acceder a Prometheus:**
   - URL: `http://localhost:9090`

2. **Queries útiles:**

```promql
# CPU usage por pod
container_cpu_usage_seconds_total{pod=~"userservice.*"}

# Memoria usage por pod
container_memory_working_set_bytes{pod=~"userservice.*"}

# Número actual de replicas
kube_deployment_status_replicas{deployment=~"userservice|musicservice"}

# HPA target CPU
kube_horizontalpodautoscaler_target_metrics{metric_name="cpu",namespace="musicshare"}
```

## 📊 Flujo Típico de Test

```
1. Terminal 1: Monitorear HPA
   kubectl get hpa -n musicshare -w

2. Terminal 2: Ver pods
   kubectl get pods -n musicshare -w -l app=userservice

3. Terminal 3: Ejecutar test
   .\scripts\k6-load-test.ps1

4. Browser: Abrir Grafana
   http://localhost:3000
   
   Observar cómo:
   - CPU sube
   - HPA escala up (aumenta pods)
   - Latencia se mantiene constante
   - CPU baja
   - HPA escala down (reduce pods)
```

## 📋 Configuración Actual de HPA

| Servicio | Min Pods | Max Pods | CPU Target |
|----------|----------|----------|-----------|
| userservice | 2 | 6 | 50% |
| musicservice | 2 | 6 | 50% |
| social-service | 2 | 5 | 55% |
| notificationservice | 2 | 6 | 50% |

## 🐛 Troubleshooting

### Problema: HPA no escala

```bash
# Verificar que metrics-server esté instalado
kubectl get deployment metrics-server -n kube-system

# Si no existe, instalar:
kubectl apply -f https://github.com/kubernetes-sigs/metrics-server/releases/latest/download/components.yaml
```

### Problema: k6 no puede conectar

```bash
# Verificar que el Ingress esté activo
kubectl get ingress -n musicshare

# Obtener IP del Ingress
kubectl get ingress api-gateway -n musicshare -o jsonpath='{.status.loadBalancer.ingress[0].ip}'

# Probar conexión manualmente
curl -v http://localhost/api/users/health
```

### Problema: Grafana no tiene datos

```bash
# Verificar que Prometheus esté corriendo
kubectl get pods -n monitoring

# Revisar logs de Prometheus
kubectl logs -n monitoring -l app=prometheus
```

## 💾 Exportar Resultados

```bash
# K6 genera reportes JSON
k6 run k6/baseline.js --env BASE_URL=http://localhost -o json=results.json

# Convertir a formato legible
jq '.data.samples[] | select(.metric == "http_req_duration") | {timestamp: .timestamp, duration: .value}' results.json
```

## 📚 Referencias

- **K6 Docs**: https://k6.io/docs/
- **Kubernetes HPA**: https://kubernetes.io/docs/tasks/run-application/horizontal-pod-autoscale/
- **Prometheus PromQL**: https://prometheus.io/docs/prometheus/latest/querying/basics/
- **Grafana**: https://grafana.com/docs/grafana/latest/
