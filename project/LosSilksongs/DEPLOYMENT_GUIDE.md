# Guía de Despliegue MusicShare con NGINX Ingress Controller

## 📋 Resumen

Esta guía describe cómo desplegar MusicShare en Kubernetes usando **NGINX Ingress Controller** como API Gateway (reemplazando Traefik), proporcionando:

1. **LoadBalancer Público** → Frontend React
2. **NGINX Ingress** → API Gateway para microservicios
3. **Escalado Automático (HPA)** → Servicios backend

## 🔧 Prerequisitos

- Kubernetes 1.24+ (minikube, kind, EKS, GKE, AKS, etc.)
- `kubectl` configurado
- Docker/Podman para construir imágenes
- `helm` (opcional, para instalaciones avanzadas)
- `git`

## 📦 Paso 1: Clonar Repositorio

```bash
git clone https://github.com/JulianAVG64/MusicShare.git
cd MusicShare
```

## 🚀 Paso 2: Preparar Imágenes Docker

Asegúrate de tener todas las imágenes disponibles (en repositorio privado o local):

```bash
# Construir imágenes localmente (si no están en repositorio)
docker build -t musicshare/frontend:latest ./frontend/MusicShareFrontend/
docker build -t musicshare/userservice:latest ./userservice/
docker build -t musicshare/musicservice:latest ./musicservice/
docker build -t musicshare/social-service:latest ./socialservice/
docker build -t musicshare/notificationservice:latest ./notificationservice/
docker build -t musicshare/metadata-service:latest ./metadataservice/

# Si usas un registro privado:
docker tag musicshare/frontend:latest your-registry/musicshare/frontend:latest
docker push your-registry/musicshare/frontend:latest
# ... repetir para otros servicios
```

## 🌍 Paso 3: Crear Namespace

```bash
kubectl create namespace musicshare
kubectl label namespace musicshare name=musicshare
```

## 📥 Paso 4: Instalar cert-manager (para HTTPS)

```bash
# Opción A: Con Helm
helm repo add jetstack https://charts.jetstack.io
helm repo update
helm install cert-manager jetstack/cert-manager \
  --namespace cert-manager \
  --create-namespace \
  --version v1.13.2

# Opción B: Con manifiestos directos
kubectl apply -f https://github.com/cert-manager/cert-manager/releases/download/v1.13.2/cert-manager.yaml
```

## 🔌 Paso 5: Instalar NGINX Ingress Controller

### Opción A: Usando Kustomize (Recomendado)

```bash
# Solo NGINX Ingress
kubectl apply -f k8s/base/nginx-ingress-controller.yaml

# O con Kustomize (incluye cert-manager automáticamente)
kubectl apply -k k8s/base/
```

### Opción B: Usando Helm

```bash
helm repo add ingress-nginx https://kubernetes.github.io/ingress-nginx
helm repo update

helm install nginx-ingress ingress-nginx/ingress-nginx \
  --namespace ingress-nginx \
  --create-namespace \
  --values - <<EOF
controller:
  replicaCount: 2
  resources:
    requests:
      cpu: 200m
      memory: 256Mi
    limits:
      cpu: 500m
      memory: 512Mi
  service:
    type: LoadBalancer
    annotations:
      service.beta.kubernetes.io/aws-load-balancer-type: "nlb"
EOF
```

## ✅ Paso 6: Verificar NGINX Ingress

```bash
# Ver que el controller está running
kubectl get pods -n ingress-nginx
kubectl get svc -n ingress-nginx

# Obtener IP externa del LoadBalancer
kubectl get svc -n ingress-nginx nginx-ingress -w
# Espera a que aparezca la IP/hostname en EXTERNAL-IP
```

## 🗄️ Paso 7: Configurar Bases de Datos

Las bases de datos se crearán automáticamente en el paso 8, pero puedes pre-crear volúmenes:

```bash
# Ver configuración de bases de datos
kubectl apply -f k8s/app/databases.yaml

# Esperar a que estén ready
kubectl get pvc -n musicshare -w
```

## 🎯 Paso 8: Desplegar MusicShare

### Opción A: Despliegue completo con Kustomize (Recomendado)

```bash
# Aplicar todo desde la carpeta k8s
kubectl apply -k k8s/

# Verificar que se están creando recursos
kubectl get pods -n musicshare -w
kubectl get svc -n musicshare
kubectl get ingress -n musicshare
```

### Opción B: Despliegue paso a paso

```bash
# 1. Namespace y bases de datos
kubectl apply -f k8s/app/namespace.yaml
kubectl apply -f k8s/app/databases.yaml

# 2. Configuración del frontend
kubectl apply -f k8s/app/frontend-config.yaml
kubectl apply -f k8s/app/frontend-deployment-service.yaml

# 3. Deployments y servicios backend
kubectl apply -f k8s/app/backend-deployments-services.yaml

# 4. API Gateway (NGINX Ingress)
kubectl apply -f k8s/app/ingress.yaml

# 5. Escalado automático
kubectl apply -f k8s/app/hpa.yaml

# 6. Cert-manager para HTTPS (si es necesario)
kubectl apply -f k8s/app/cert-manager-issuer.yaml
```

## 🔍 Paso 9: Verificar Despliegue

```bash
# Ver todos los pods
kubectl get pods -n musicshare -o wide

# Ver servicios
kubectl get svc -n musicshare

# Ver Ingress
kubectl get ingress -n musicshare -o wide

# Ver HPA (escalado automático)
kubectl get hpa -n musicshare

# Ver logs de un pod específico
kubectl logs -n musicshare deployment/userservice --tail=100 -f

# Describir un pod (para ver errores)
kubectl describe pod -n musicshare <pod-name>
```

## 🌐 Paso 10: Obtener URLs de Acceso

```bash
# Frontend (LoadBalancer público)
FRONTEND_IP=$(kubectl get svc -n musicshare frontend-loadbalancer -o jsonpath='{.status.loadBalancer.ingress[0].ip}')
echo "Frontend: http://$FRONTEND_IP"

# API Gateway (NGINX Ingress)
NGINX_IP=$(kubectl get svc -n ingress-nginx nginx-ingress -o jsonpath='{.status.loadBalancer.ingress[0].ip}')
echo "API Gateway: http://$NGINX_IP"
echo "  - User API: http://$NGINX_IP/api/users"
echo "  - Music API: http://$NGINX_IP/api/music"
echo "  - Social API: http://$NGINX_IP/api/social"
echo "  - Notifications API: http://$NGINX_IP/api/notifications"
echo "  - WebSocket: ws://$NGINX_IP/ws"

# NGINX Metrics (para Prometheus)
echo "NGINX Metrics: http://$NGINX_IP:10254/metrics"
```

## 🧪 Paso 11: Pruebas Básicas

```bash
# Probar acceso al Frontend
curl -v http://$FRONTEND_IP/

# Probar API Gateway
curl -v http://$NGINX_IP/api/users/health

# Ver métricas de NGINX
curl http://$NGINX_IP:10254/metrics

# Probar WebSocket
wscat -c ws://$NGINX_IP/ws
```

## 📊 Paso 12: Configurar Monitoreo

### Prometheus (Recomendado)

```bash
# Verificar que prometheus.yml apunta a NGINX metrics
kubectl apply -f prometheus/prometheus.yml

# Agregar ServiceMonitor para NGINX (opcional)
kubectl apply -f - <<EOF
apiVersion: monitoring.coreos.com/v1
kind: ServiceMonitor
metadata:
  name: nginx-ingress
  namespace: ingress-nginx
spec:
  selector:
    matchLabels:
      app.kubernetes.io/name: ingress-nginx
  endpoints:
  - port: metrics
EOF
```

### Grafana

```bash
# Dashboard recomendado: ID 14314 (NGINX Ingress)
# https://grafana.com/grafana/dashboards/14314
```

## 🔐 Paso 13: Configurar HTTPS (Opcional)

```bash
# 1. Editar k8s/app/ingress.yaml y agregar sección `tls`
# 2. Usar cert-manager para provisionar certificados automáticamente

kubectl apply -f - <<EOF
apiVersion: cert-manager.io/v1
kind: Certificate
metadata:
  name: musicshare-tls
  namespace: musicshare
spec:
  secretName: musicshare-tls
  issuerRef:
    name: letsencrypt-prod
    kind: ClusterIssuer
  dnsNames:
  - musicshare.example.com
EOF
```

## 🔄 Paso 14: Pruebas de Carga y Escalado

```bash
# Instalar k6
curl https://github.com/grafana/k6/releases/download/v0.47.0/k6-v0.47.0-linux-amd64.tar.gz | tar xz

# Ejecutar pruebas
./k6 run k6/baseline.js

# Observar escalado automático
kubectl get hpa -n musicshare -w
kubectl get pods -n musicshare -w
```

## 📝 Paso 15: Configurar Variables de Entorno

Los servicios usan variables de entorno. Verificar `k8s/app/backend-deployments-services.yaml`:

```yaml
env:
  - name: POSTGRES_HOST
    value: postgres
  - name: MONGODB_URI
    value: "mongodb://admin:password123@mongodb:27017/musicshare?authSource=admin"
  - name: NOTIFICATION_SERVICE_URL
    value: "http://notificationservice:8082"
  - name: USER_SERVICE_URL
    value: "http://userservice:8002"
```

**Cambiar contraseñas en producción:**

```bash
# Crear Secret de Kubernetes
kubectl create secret generic db-credentials \
  -n musicshare \
  --from-literal=postgres-password=tu-password-seguro \
  --from-literal=mongodb-password=tu-password-seguro
```

## 🛠️ Troubleshooting

### Los pods no están starting

```bash
# Ver eventos del cluster
kubectl describe nodes

# Ver logs del pod
kubectl logs -n musicshare <pod-name> --previous

# Ver descripción detallada
kubectl describe pod -n musicshare <pod-name>
```

### NGINX no redirige correctamente

```bash
# Ver configuración generada de NGINX
kubectl exec -n ingress-nginx deployment/nginx-ingress-controller -- cat /etc/nginx/nginx.conf

# Verificar que el Ingress tiene rutas correctas
kubectl get ingress -n musicshare api-gateway -o yaml

# Logs de NGINX
kubectl logs -n ingress-nginx deployment/nginx-ingress-controller -f
```

### LoadBalancer sin IP externa

```bash
# En minikube/kind, usar port-forward
kubectl port-forward -n musicshare svc/frontend-loadbalancer 80:80 &
kubectl port-forward -n ingress-nginx svc/nginx-ingress 80:80 &

# En cloud providers, esperar a que se provisione
kubectl get svc -n musicshare frontend-loadbalancer -w
```

### WebSocket no funciona

```bash
# Verificar que NGINX tiene la anotación correcta
kubectl get ingress -n musicshare api-gateway -o yaml | grep websocket

# Ver si el servicio está escuchando en puerto 8082
kubectl get svc -n musicshare notificationservice
```

## 🗑️ Limpiar Recursos

```bash
# Eliminar MusicShare
kubectl delete -k k8s/

# Eliminar NGINX Ingress
kubectl delete -k k8s/base/

# Eliminar namespace
kubectl delete namespace musicshare

# Eliminar NGINX Ingress namespace
kubectl delete namespace ingress-nginx
```

## 📚 Referencias Útiles

- [NGINX Ingress Controller Docs](https://kubernetes.github.io/ingress-nginx/)
- [Kubernetes Ingress API](https://kubernetes.io/docs/concepts/services-networking/ingress/)
- [cert-manager Docs](https://cert-manager.io/)
- [Kubernetes Service Types](https://kubernetes.io/docs/concepts/services-networking/service/)
- [HorizontalPodAutoscaler](https://kubernetes.io/docs/tasks/run-application/horizontal-pod-autoscale/)

## ✨ Configuración Recomendada para Producción

```bash
# 1. Usar certificados SSL/TLS reales
# 2. Habilitar autoscaling basado en métricas reales
# 3. Configurar límites de recursos apropiados
# 4. Implementar network policies
# 5. Usar private container registry
# 6. Configurar backups automáticos de bases de datos
# 7. Implementar monitoring y alerting
# 8. Usar pod security policies
# 9. Configurar RBAC adecuadamente
# 10. Implementar secrets management (Vault, AWS Secrets Manager, etc.)
```

## ❓ Soporte

Para problemas, consultar:
- Logs: `kubectl logs -n musicshare <pod-name>`
- Eventos: `kubectl get events -n musicshare`
- Descripción: `kubectl describe pod -n musicshare <pod-name>`
- Debugging: `kubectl debug -n musicshare <pod-name>`
