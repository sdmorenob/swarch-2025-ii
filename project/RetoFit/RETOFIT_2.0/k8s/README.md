# RetoFit 2.0 - Kubernetes Deployment

Este directorio contiene todos los manifiestos YAML necesarios para desplegar RetoFit 2.0 en Kubernetes.

## 📋 Requisitos Previos

- **Kubernetes local**: minikube, kind, o Docker Desktop con Kubernetes habilitado
- **kubectl**: CLI de Kubernetes instalado
- **Docker**: Para construir imágenes
- **Recursos mínimos**: 8GB RAM, 4 CPU cores, 20GB disk

## 🏗️ Estructura del Proyecto

```
k8s/
├── 01-configmaps/          # Configuraciones (nginx.conf, application.yml)
├── 02-secrets/             # Secrets (JWT, databases, APIs externas)
├── 03-services/            # Services (LoadBalancer + ClusterIP)
├── 04-deployments/         # Deployments (10 servicios)
├── 05-network-policies/    # NetworkPolicies básicas
└── README.md              # Este archivo
```

## 🚀 Guía de Deployment Rápido

### Paso 1: Iniciar Cluster

**Opción A - minikube:**
```bash
minikube start --memory=8192 --cpus=4
minikube tunnel  # En terminal separada (necesario para LoadBalancer)
```

**Opción B - kind:**
```bash
kind create cluster --name retofit
```

**Opción C - Docker Desktop:**
- Settings → Kubernetes → Enable Kubernetes

### Paso 2: Construir Imágenes Docker

```bash
# Desde la raíz del proyecto
docker build -t retofit/auth-service:latest ./services/auth-service
docker build -t retofit/users-service:latest ./services/user-service
docker build -t retofit/activities-service:latest ./services/physical_activities_service
docker build -t retofit/gamification-service:latest ./services/gamification-service
docker build -t retofit/posts-service:latest ./services/posts-service
docker build -t retofit/admin-service:latest ./services/admin-service
docker build -t retofit/api-gateway:latest ./api_gateway_2.1
docker build -t retofit/landing-page:latest ./landing-page
docker build -t retofit/frontend:latest ./front
```

**Para minikube - cargar imágenes:**
```bash
minikube image load retofit/auth-service:latest
minikube image load retofit/users-service:latest
minikube image load retofit/activities-service:latest
minikube image load retofit/gamification-service:latest
minikube image load retofit/posts-service:latest
minikube image load retofit/admin-service:latest
minikube image load retofit/api-gateway:latest
minikube image load retofit/landing-page:latest
minikube image load retofit/frontend:latest
```

**Para kind - cargar imágenes:**
```bash
kind load docker-image retofit/auth-service:latest --name retofit
kind load docker-image retofit/users-service:latest --name retofit
kind load docker-image retofit/activities-service:latest --name retofit
kind load docker-image retofit/gamification-service:latest --name retofit
kind load docker-image retofit/posts-service:latest --name retofit
kind load docker-image retofit/admin-service:latest --name retofit
kind load docker-image retofit/api-gateway:latest --name retofit
kind load docker-image retofit/landing-page:latest --name retofit
kind load docker-image retofit/frontend:latest --name retofit
```

### Paso 3: Generar Certificados TLS

**IMPORTANTE**: Antes de desplegar, debes generar certificados TLS para Nginx.

**Opción A - Usar script automatizado (Recomendado):**

```bash
# En PowerShell (Windows)
cd k8s
.\generate-certs.ps1

# En Bash (Linux/Mac/Git Bash)
cd k8s
chmod +x generate-certs.sh
./generate-certs.sh
```

**Opción B - Generar manualmente con OpenSSL:**

```bash
# Crear directorio
mkdir -p nginx/tls

# Generar clave privada
openssl genrsa -out nginx/tls/nginx-key.pem 2048

# Generar certificado autofirmado (válido por 365 días)
openssl req -new -x509 -sha256 \
  -key nginx/tls/nginx-key.pem \
  -out nginx/tls/nginx.pem \
  -days 365 \
  -subj "/C=CO/ST=Cundinamarca/L=Bogota/O=RetoFit/OU=Development/CN=localhost" \
  -addext "subjectAltName=DNS:localhost,DNS:*.localhost,IP:127.0.0.1"
```

⚠️ **Nota**: Estos son certificados autofirmados para desarrollo. Los navegadores mostrarán advertencias de seguridad - esto es normal para desarrollo local.

### Paso 4: Crear Secrets

```bash
# TLS Secret (Nginx)
kubectl create secret generic nginx-tls-secret \
  --from-file=nginx.pem=./nginx/tls/nginx.pem \
  --from-file=nginx-key.pem=./nginx/tls/nginx-key.pem

# Aplicar secrets YAML
kubectl apply -f k8s/02-secrets/

# Verificar
kubectl get secrets
```

### Paso 5: Crear ConfigMaps

```bash
kubectl apply -f k8s/01-configmaps/

# Verificar
kubectl get configmaps
```

### Paso 6: Crear Services

```bash
kubectl apply -f k8s/03-services/

# Verificar
kubectl get services
```

### Paso 7: Desplegar Aplicaciones

```bash
# Backend services
kubectl apply -f k8s/04-deployments/auth-service-deployment.yaml
kubectl apply -f k8s/04-deployments/users-service-deployment.yaml
kubectl apply -f k8s/04-deployments/activities-service-deployment.yaml
kubectl apply -f k8s/04-deployments/gamification-service-deployment.yaml
kubectl apply -f k8s/04-deployments/posts-service-deployment.yaml
kubectl apply -f k8s/04-deployments/admin-service-deployment.yaml

# Esperar a que estén ready
kubectl wait --for=condition=ready pod -l tier=backend --timeout=180s

# API Gateway
kubectl apply -f k8s/04-deployments/api-gateway-deployment.yaml
kubectl wait --for=condition=ready pod -l app=api-gateway --timeout=180s

# Frontends
kubectl apply -f k8s/04-deployments/landing-page-deployment.yaml
kubectl apply -f k8s/04-deployments/frontend-deployment.yaml
kubectl wait --for=condition=ready pod -l tier=frontend --timeout=120s

# Nginx
kubectl apply -f k8s/04-deployments/nginx-deployment.yaml
kubectl wait --for=condition=ready pod -l app=nginx-proxy --timeout=60s
```

### Paso 8: Aplicar NetworkPolicies

```bash
kubectl apply -f k8s/05-network-policies/

# Verificar
kubectl get networkpolicies
```

### Paso 9: Verificar Deployment

```bash
# Ver todos los pods
kubectl get pods -o wide

# Ver servicios y LoadBalancer IP
kubectl get services

# Ver logs de un servicio
kubectl logs -l app=auth-service --tail=50

# Test acceso externo
curl -k https://localhost/
curl -k https://localhost/dashboard
```

## 🧪 Testing y Validación

### Test de Conectividad Backend

```bash
# Port-forward API Gateway
kubectl port-forward deployment/api-gateway 8081:8081

# Ver circuit breakers
curl http://localhost:8081/actuator/circuitbreakers

# Ver health
curl http://localhost:8081/actuator/health
```

### Test de Load Balancing

```bash
# Escalar auth-service
kubectl scale deployment auth-service --replicas=3

# Ver distribución de pods
kubectl get pods -l app=auth-service -o wide

# Ver logs para verificar load balancing
kubectl logs -l app=auth-service --tail=100
```

### Test de gRPC (Activities → Users)

```bash
# Ver logs de activities service
kubectl logs -l app=activities-service | grep -i "grpc\|users"

# Ver logs de users service
kubectl logs -l app=users-service | grep -i "grpc\|50051"
```

## 📊 Configuración de Réplicas

| Servicio | Réplicas | Razón |
|----------|----------|-------|
| auth-service | 2 | Servicio crítico, load balancing |
| users-service | 2 | Servicio crítico, dual-port (HTTP + gRPC) |
| activities-service | 2 | Load balancing, gRPC client |
| gamification-service | 1 | MongoDB single connection |
| posts-service | 1 | File uploads local |
| admin-service | 1 | Low traffic |
| api-gateway | 1 | Circuit breaker state in-memory |
| nginx-proxy | 1 | Edge proxy |
| landing-page | 1 | Frontend |
| frontend | 1 | Frontend |

## 🔒 NetworkPolicies Aplicadas

1. **allow-dns.yaml**: Permite a todos los pods acceder a kube-dns
2. **allow-external-db.yaml**: Permite egress a AWS RDS (5432) y Railway MongoDB (10201)
3. **activities-to-users-grpc.yaml**: Permite gRPC entre activities y users (50051)

**Nota**: No se aplica `default-deny-all` para facilitar debugging en desarrollo.

## 🛠️ Comandos Útiles

### Ver Estado del Cluster

```bash
# Ver todos los recursos
kubectl get all

# Ver pods con detalles
kubectl get pods -o wide

# Ver uso de recursos
kubectl top nodes
kubectl top pods

# Ver eventos
kubectl get events --sort-by='.lastTimestamp'
```

### Debugging

```bash
# Logs en tiempo real
kubectl logs -l app=auth-service -f --tail=100

# Ejecutar comando en pod
kubectl exec -it deployment/auth-service -- /bin/sh

# Port-forward para acceso local
kubectl port-forward deployment/api-gateway 8081:8081

# Describir pod (ver eventos y configuración)
kubectl describe pod <pod-name>
```

### Escalar Servicios

```bash
# Escalar manualmente
kubectl scale deployment auth-service --replicas=3

# Ver status de escalado
kubectl get deployment auth-service

# Reiniciar deployment (rolling restart)
kubectl rollout restart deployment auth-service
kubectl rollout status deployment auth-service
```

### Gestión

```bash
# Eliminar deployment específico
kubectl delete deployment auth-service

# Eliminar todos los deployments
kubectl delete -f k8s/04-deployments/

# Eliminar todo
kubectl delete -f k8s/
```

## 🐛 Troubleshooting

### Pod en CrashLoopBackOff

```bash
# Ver logs del pod
kubectl logs <pod-name>

# Ver eventos
kubectl describe pod <pod-name>

# Causas comunes:
# - DATABASE_URL incorrecta
# - Secret no existe
# - Puerto incorrecto en containerPort
```

### ImagePullBackOff

```bash
# Verificar imagen existe
docker images | grep retofit

# Cargar imagen en minikube
minikube image load retofit/<service-name>:latest

# Verificar imagePullPolicy en deployment
kubectl get deployment <name> -o yaml | grep imagePullPolicy
```

### Service No Alcanzable

```bash
# Verificar endpoints
kubectl get endpoints <service-name>

# Si no hay endpoints, verificar selector
kubectl get pods --show-labels
kubectl describe svc <service-name>

# Test desde otro pod
kubectl run test --image=curlimages/curl --rm -it --restart=Never -- \
  curl -v http://<service-name>:<port>/
```

### LoadBalancer Pending

**Para minikube:**
```bash
# Ejecutar en terminal separada
minikube tunnel
```

**Para kind:**
Requiere MetalLB o configuración de port mapping al crear cluster.

**Para Docker Desktop:**
Automático, verificar que puerto no esté en uso.

## 📈 Monitoring

### Metrics Server (Opcional)

```bash
kubectl apply -f https://github.com/kubernetes-sigs/metrics-server/releases/latest/download/components.yaml

# Ver métricas
kubectl top nodes
kubectl top pods
```

### Kubernetes Dashboard (Opcional)

```bash
kubectl apply -f https://raw.githubusercontent.com/kubernetes/dashboard/v2.7.0/aio/deploy/recommended.yaml

# Crear token de acceso
kubectl create serviceaccount dashboard-admin -n kubernetes-dashboard
kubectl create clusterrolebinding dashboard-admin \
  --clusterrole=cluster-admin \
  --serviceaccount=kubernetes-dashboard:dashboard-admin

# Get token
kubectl create token dashboard-admin -n kubernetes-dashboard

# Proxy
kubectl proxy

# Acceder: http://localhost:8001/api/v1/namespaces/kubernetes-dashboard/services/https:kubernetes-dashboard:/proxy/
```

## 🔄 Actualizar Aplicaciones

```bash
# Rebuild imagen
docker build -t retofit/auth-service:v2 ./services/auth-service

# Cargar en cluster
minikube image load retofit/auth-service:v2

# Actualizar deployment
kubectl set image deployment/auth-service auth-service=retofit/auth-service:v2

# Ver rollout
kubectl rollout status deployment/auth-service
```

## 📝 Diferencias vs Docker Compose

| Aspecto | Docker Compose | Kubernetes |
|---------|---------------|------------|
| Inicio | `docker compose up -d` | `kubectl apply -f k8s/` |
| Logs | `docker compose logs -f service` | `kubectl logs -l app=service -f` |
| Escalar | `docker compose up -d --scale service=3` | `kubectl scale deployment service --replicas=3` |
| Parar | `docker compose down` | `kubectl delete -f k8s/` |
| Estado | `docker compose ps` | `kubectl get pods` |

## ⚠️ Notas Importantes

1. **Bases de Datos Externas**: El sistema se conecta a AWS RDS (PostgreSQL) y Railway (MongoDB). No hay bases de datos en el cluster.

2. **Secrets en Git**: Los archivos de secrets contienen credenciales reales. En producción:
   - NO commitear a Git
   - Usar External Secrets Operator o Sealed Secrets
   - Rotar credenciales regularmente

3. **LoadBalancer Local**:
   - minikube requiere `minikube tunnel`
   - Docker Desktop funciona automáticamente
   - kind requiere configuración adicional

4. **Recursos**: La configuración actual requiere ~8GB RAM. Ajustar `resources.requests` y `resources.limits` según tu hardware.

5. **Development Mode**: Los frontends están en modo development (`npm run dev`). Para producción, cambiar a `npm run build && npm start`.

## 📚 Referencias


- [Documentación Kubernetes](https://kubernetes.io/docs/)
- [minikube Docs](https://minikube.sigs.k8s.io/docs/)
- [kubectl Cheat Sheet](https://kubernetes.io/docs/reference/kubectl/cheatsheet/)

## 🎯 Próximos Pasos

1. ✅ Implementar Persistent Volumes para posts-service
2. ✅ Configurar Horizontal Pod Autoscaler (HPA)
3. ✅ Añadir Ingress Controller (NGINX Ingress)
4. ✅ Implementar monitoring con Prometheus + Grafana
5. ✅ Configurar CI/CD con GitHub Actions
6. ✅ Aplicar NetworkPolicies completas (incluir default-deny-all)

## 📞 Soporte

Para problemas o preguntas, revisar:
1. Logs de pods: `kubectl logs <pod-name>`
2. Eventos del cluster: `kubectl get events`
3. Plan de migración detallado en `.claude/plans/`
