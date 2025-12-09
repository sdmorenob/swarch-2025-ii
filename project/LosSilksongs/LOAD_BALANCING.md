# 🎯 Implementación de Balanceo de Carga - MusicShare

## 📋 Resumen Ejecutivo

Se ha implementado con éxito un sistema de **balanceo de carga automático** en MusicShare utilizando Traefik como API Gateway y Load Balancer. El sistema permite escalar horizontalmente los microservicios backend para mejorar el rendimiento, disponibilidad y resiliencia.

Se ha migrado la arquitectura a **Kubernetes**, reemplazando Docker Compose. El balanceo de carga se realiza automáticamente mediante:
 - **Kubernetes Service Load Balancing**: Distribución automática a través de Service Discovery
 - **HorizontalPodAutoscaler (HPA)**: Escalado automático basado en uso de CPU
 - **Traefik Gateway**: Enrutamiento inteligente de tráfico via IngressRoute CRDs
---

## 🏗️ Arquitectura Kubernetes
### 1. 🔧 Configuración de Docker Compose
```
Internet
  ↓
Load Balancer Público (Service: frontend-loadbalancer)
  ↓
Frontend React (Deployment 3 réplicas)
  ↓
Traefik Gateway (Deployment 2 réplicas, ClusterIP)
  ↓
Microservicios con Escalado Automático (HPA 2-6 réplicas según CPU)
```

## 🚀 Componentes Escalables en Kubernetes
**Servicios Escalables:**
 | Servicio | Réplicas Iniciales | Máx (HPA) | Umbral CPU |
 |----------|-------------------|-----------|-----------|
 | UserService | 2 | 6 | 50% |
 | MusicService | 2 | 6 | 50% |
 | SocialService | 2 | 5 | 55% |
 | NotificationService | 2 | 6 | 50% |
 | Frontend | 3 | 3 | (sin HPA) |
 | Traefik Gateway | 2 | 2 | (sin HPA) |
- ✅ **NotificationService**: 2 réplicas iniciales
**Cambios Realizados:**
- Políticas de reinicio automático

**Ejemplo de Configuración:**
```yaml
deploy:
  resources:
      memory: 512M
      cpus: '0.25'
      memory: 256M
  restart_policy:
    condition: on-failure
    delay: 5s
    max_attempts: 3
```

### 2. ⚖️ Configuración de Traefik

**Características Implementadas:**

#### Health Checks
```yaml
  - "traefik.http.services.userservice.loadbalancer.healthcheck.interval=10s"
```
### 1. 🔧 Configuración de Kubernetes Deployments

**Servicios Escalables (HPA habilitado):**
 - ✅ **UserService**: 2-6 réplicas
 - ✅ **MusicService**: 2-6 réplicas  
 - ✅ **SocialService**: 2-5 réplicas
 - ✅ **NotificationService**: 2-6 réplicas

**Ejemplo de Deployment con recursos limitados:**
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: userservice
  namespace: musicshare
spec:
  replicas: 2  # Réplicas iniciales
  selector:
    matchLabels:
      app: userservice
  template:
    metadata:
      labels:
        app: userservice
    spec:
      containers:
        - name: userservice
          image: musicshare/userservice:latest
          ports:
            - containerPort: 8002
          resources:
            requests:
              cpu: 250m
              memory: 256Mi
            limits:
              cpu: 500m
              memory: 512Mi
```

### 1.5. 🔧 Configuración de HorizontalPodAutoscaler (HPA)

El escalado automático se configura mediante **HPA**, que monitorea métricas de CPU y ajusta el número de réplicas dinámicamente:

**Ejemplo de HPA para UserService:**
```yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: userservice-hpa
  namespace: musicshare
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: userservice
  minReplicas: 2      # Mínimo 2 réplicas siempre
  maxReplicas: 6      # Máximo 6 réplicas
  metrics:
    - type: Resource
      resource:
        name: cpu
        target:
          type: Utilization
          averageUtilization: 50  # Si CPU > 50%, escala hacia arriba

**Cómo funciona:**
 1. Metrics Server monitorea el uso de CPU en cada Pod
 2. Si uso promedio de CPU > 50%, el HPA crea nuevas réplicas
- Verificación automática cada 10 segundos
```yaml
```
- Mantiene sesiones de usuario en la misma réplica
- **Round Robin** (por defecto)
  ### 2. ⚖️ Configuración de Traefik en Kubernetes

  **Características Implementadas:**

  #### IngressRoute CRD para Enrutamiento
  ```yaml
  apiVersion: traefik.io/v1alpha1
  kind: IngressRoute
  metadata:
    name: userservice-route
    namespace: musicshare
  spec:
    entryPoints:
      - web
      - websecure
    routes:
      - match: PathPrefix(`/api/users`)
        kind: Rule
        middlewares:
          - name: strip-users
        services:
          - name: userservice
            port: 8002
    tls:
      certResolver: letsencrypt-prod  # TLS automático
  ```

   - **Service Discovery**: Kubernetes API automáticamente detecta cambios en Services
   - **Load Balancing**: Traefik distribuye tráfico a todos los Pods de un Deployment
   - **Health Checks**: Kubernetes liveness/readiness probes integrados

  #### Middleware para StripPrefix
  ```yaml
  apiVersion: traefik.io/v1alpha1
  kind: Middleware
  metadata:
    name: strip-users
    namespace: musicshare
  spec:
    stripPrefix:
      prefixes:
        - /api/users
  ```

   - Elimina el prefijo `/api/users` antes de pasar la solicitud al servicio
   - Permite que los servicios reciban rutas limpias (ej. `/me` en lugar de `/api/users/me`)

  #### Algoritmo de Balanceo
   - **Kubernetes Services**: Round-robin de Kubernetes a nivel DNS/iptables
   - **Traefik**: Distribuye equitativamente entre Pods saludables
   - **Session Affinity**: Opcional via `sessionAffinity: ClientIP` en Service

  #### Logs y Métricas
   - **Logs estructurados**: JSON enviados a `/var/log/traefik/`
   - **Métricas Prometheus**: Traefik expone métricas en puerto 8080
   - **Dashboard**: Accesible en `http://localhost:8080/dashboard/`
   - **Integración**: Prometheus scrape automático via ServiceMonitor (si usas Prometheus Operator)
- Distribución equitativa entre réplicas saludables

#### Logs y Métricas
- Logs en formato JSON
- Métricas de Prometheus habilitadas
- Dashboard web en puerto 8080

### 3. 🛠️ Scripts de Automatización

#### scale-service.ps1
Script PowerShell para escalar servicios dinámicamente.


**Uso:**
```powershell
.\scripts\scale-service.ps1 -Service userservice -Replicas 5
.\scripts\scale-service.ps1 -Service all -Replicas 3
```

#### load-test.ps1
Script para probar el balanceo de carga mediante peticiones HTTP.


**Uso:**
```powershell
.\scripts\load-test.ps1 -Service userservice -Requests 20 -Delay 500
```

### 3. 🛠️ Comandos Kubernetes para Escalado Manual

**Escalar un servicio manualmente (sin HPA):**
```bash
# Escalar UserService a 5 réplicas
kubectl scale deployment userservice -n musicshare --replicas=5

# Escalar todos los servicios
kubectl scale deployment -n musicshare --all --replicas=3
```

**Monitorear escalado automático:**
```bash
# Ver estado del HPA
kubectl get hpa -n musicshare -w  # -w para watch (monitoreo en tiempo real)

# Detalles del HPA
kubectl describe hpa userservice-hpa -n musicshare

# Ver métricas de CPU en tiempo real
kubectl top pods -n musicshare
kubectl top nodes
```

**Deshabilitar HPA (para pruebas):**
```bash
# Pausar el HPA
kubectl patch hpa userservice-hpa -n musicshare -p '{"spec":{"minReplicas":2,"maxReplicas":2}}'

# Eliminar HPA (vuelve al número de réplicas del Deployment)
kubectl delete hpa userservice-hpa -n musicshare
```
### 4. 📚 Documentación

**Archivos Actualizados:**


## 🚀 Cómo Usar el Sistema

### Iniciar el Sistema con Réplicas

```powershell
# Construir y levantar todos los servicios
docker compose build
docker compose up -d

# Verificar que las réplicas están corriendo
### 4. 📚 Documentación Kubernetes

**Archivos Nuevos:**
 - ✅ `k8s/TRAEFIK_SETUP.md` - Guía detallada de instalación de Traefik
 - ✅ `k8s/traefik-crd.yaml` - Custom Resource Definitions
 - ✅ `k8s/traefik-config.yaml` - ConfigMap con configuración
 - ✅ `k8s/traefik-deployment-updated.yaml` - Deployment + RBAC
 - ✅ `k8s/ingressroutes.yaml` - Rutas y middlewares
 - ✅ `k8s/backend-deployments-services.yaml` - Microservicios
 - ✅ `k8s/hpa.yaml` - Escalado automático
 - ✅ `APIGateway.md` - Actualizado para Kubernetes
 - ✅ `LOAD_BALANCING.md` - Actualizado con HPA

---

## 🚀 Cómo Desplegar en Kubernetes

### Pruebas de Carga y Escalado en Kubernetes

**Generar carga para activar escalado automático:**
```bash
# Port-forward al servicio
kubectl port-forward -n musicshare svc/userservice 8002:8002 &

# Usar herramienta como ab (Apache Bench) o wrk
# Instalar: brew install httpd (macOS) o apt-get install apache2-utils (Linux)
ab -n 10000 -c 100 http://localhost:8002/health

# Monitorear escalado en otra terminal
kubectl get hpa -n musicshare -w
```

**Ejemplo de salida esperada:**
```
NAME                REFERENCE                        TARGETS    MINPODS   MAXPODS   REPLICAS   AGE
userservice-hpa     Deployment/userservice           75%/50%    2         6         4          2m
# CPU sube a 75%, HPA escala de 2 a 4 réplicas
```

**Ver logs de escalado:**
```bash
kubectl get events -n musicshare --sort-by='.lastTimestamp' | tail -20
```

### Requisitos previos
 1. Clúster Kubernetes (minikube, kind, EKS, GKE, AKS, etc.)
 2. `kubectl` configurado
 3. `helm` (opcional, para cert-manager)
 4. Imágenes Docker publicadas en un registry

### Despliegue paso a paso

```bash
# 1. Crear namespace y recursos de Traefik
kubectl apply -f k8s/namespace.yaml
kubectl apply -f k8s/traefik-crd.yaml
kubectl apply -f k8s/traefik-config.yaml
kubectl apply -f k8s/traefik-deployment-updated.yaml
kubectl apply -f k8s/ingressroutes.yaml

# 2. Desplegar servicios
kubectl apply -f k8s/frontend-deployment-service.yaml
kubectl apply -f k8s/backend-deployments-services.yaml
kubectl apply -f k8s/databases.yaml
kubectl apply -f k8s/hpa.yaml

# 3. Verificar despliegue
kubectl get all -n musicshare
kubectl get hpa -n musicshare
```

### Despliegue (método antiguo con Docker Compose)

Si todavía usas Docker Compose (no recomendado, solo para desarrollo local):

```bash
# Construir y levantar todos los servicios
docker compose build
docker compose up -d
```
docker compose ps
```

### Escalar Servicios Manualmente

```powershell
# Método 1: Docker Compose directo
docker compose up -d --scale userservice=5 --no-recreate

# Método 2: Script (Recomendado)
.\scripts\scale-service.ps1 -Service userservice -Replicas 5

# Escalar todos los servicios
.\scripts\scale-service.ps1 -Service all -Replicas 3
```

### Probar el Balanceo de Carga

```powershell
# Ejecutar prueba de carga
.\scripts\load-test.ps1 -Service userservice -Requests 20 -Delay 500

## 📡 Observabilidad Simplificada: Prometheus + Grafana

Se redujo la pila a un único sistema de métricas (Prometheus) y visualización (Grafana):

- Prometheus scrapea `/metrics` de Traefik (expuesto en el puerto interno 8080 del contenedor).
- Grafana consume Prometheus como datasource único (UID sugerido para dashboard: `ms-trfk-lb-20251117`).

### Servicios involucrados

- `prometheus` (puerto 9090 → http://localhost:9090)
- `grafana` (puerto 3010 → http://localhost:3010)
- `traefik` (dashboard interno 8080, métricas en `/metrics`)

### Levantar observabilidad

```powershell
docker compose up -d traefik prometheus grafana
docker compose ps traefik prometheus grafana
start http://localhost:3010
start http://localhost:9090
```

### Prometheus configuración (archivo `prometheus/prometheus.yml`)
```yaml
global:
  scrape_interval: 10s
scrape_configs:
  - job_name: 'traefik'
    metrics_path: /metrics
    static_configs:
      - targets: ['traefik:8080']
```

### Métricas útiles de Traefik
- `traefik_entrypoint_requests_total` por entrypoint
- `traefik_router_requests_total` por router (ruta lógica)
- `traefik_service_requests_total` por servicio backend
- `traefik_service_request_duration_seconds_bucket` para latencias (usar p95/p99 vía histogram quantiles)

### Panel básico recomendado (Grafana)
1. Requests por router (panel tipo time series): `sum by(router) (rate(traefik_router_requests_total[1m]))`
2. Latencia p95 global: `histogram_quantile(0.95, sum(rate(traefik_service_request_duration_seconds_bucket[5m])) by (le))`
3. Errores 5xx por servicio: `sum by(service) (increase(traefik_service_requests_total{code=~"5.."}[5m]))`
4. Throughput total: `sum(rate(traefik_entrypoint_requests_total[1m]))`

---
## 🧪 Prueba de Carga Única (PowerShell)

Se dejó solo el script `scripts/load-test.ps1` para pruebas manuales de distribución y latencia básico.

### Ejecutar prueba
```powershell
./scripts/load-test.ps1 -Service userservice -Requests 30 -Delay 300
```

Cambiar servicio:
```powershell
./scripts/load-test.ps1 -Service music-service -Requests 50 -Delay 200
```

### Qué validar
1. Respuestas HTTP 200 predominantes
2. Tiempos promedio estables < 500ms (desarrollo)
3. Distribución entre réplicas (si sticky sessions no monopoliza la misma). Para mejor dispersión, repetir ejecuciones nuevas.

### Ejemplo interpretación
```
✓ 30/30 exitosas | p95 180ms | Réplica A 16 / Réplica B 14 → balance ok
```

### Escalar y volver a probar
```powershell
docker compose up -d --scale userservice=4 --no-recreate
./scripts/load-test.ps1 -Service userservice -Requests 60 -Delay 200
```

---

# Resultado Esperado:
# Réplica 1: ~33% (10 peticiones)
# Réplica 2: ~33% (10 peticiones)
# Réplica 3: ~33% (10 peticiones)
```

### Prueba 2: Failover Automático

```powershell
# Terminal 1: Ejecutar prueba continua
.\scripts\load-test.ps1 -Service userservice -Requests 100 -Delay 500

# Terminal 2: Durante la prueba, detener una réplica
docker compose ps userservice  # Identificar container ID
docker stop <container-id>

# Resultado Esperado:
# - Peticiones continúan exitosas
# - Distribución se ajusta automáticamente
# - Dashboard muestra réplica como unhealthy
```

### Prueba 3: Escalado Bajo Carga

```powershell
# Terminal 1: Ejecutar prueba continua
.\scripts\load-test.ps1 -Service userservice -Requests 200 -Delay 500

# Terminal 2: Durante la prueba, escalar
.\scripts\scale-service.ps1 -Service userservice -Replicas 5

# Resultado Esperado:
# - Peticiones siguen funcionando
# - Nuevas réplicas se agregan automáticamente
# - Traefik detecta y balancea a las nuevas réplicas
```

---

## 🔐 Consideraciones de Seguridad

### Implementadas ✅

1. **Sticky Sessions**: Mantiene sesión de usuario en misma réplica
2. **Health Checks**: Verifica estado antes de enviar tráfico
3. **Resource Limits**: Previene consumo excesivo de recursos
4. **TLS/HTTPS**: Todo el tráfico externo es cifrado
5. **Network Segmentation**: Réplicas en redes aisladas

### Recomendadas para Producción ⚠️

1. **Rate Limiting**: Limitar peticiones por IP
2. **Authentication**: Proteger dashboard de Traefik
3. **Certificados Válidos**: Usar Let's Encrypt o certificados corporativos
4. **Monitoring Avanzado**: Integrar Prometheus + Grafana
5. **Auto-scaling**: Migrar a Kubernetes para escalado automático

---

## 📈 Próximos Pasos

### Corto Plazo
- [ ] Implementar rate limiting por IP
- [ ] Agregar autenticación al dashboard de Traefik
- [ ] Configurar alertas de Prometheus
- [ ] Crear scripts de backup automático

### Mediano Plazo
- [ ] Integrar Grafana para visualización
- [ ] Implementar circuit breakers
- [ ] Configurar auto-scaling basado en métricas
- [ ] Agregar caché distribuido (Redis)

### Largo Plazo
- [ ] Migrar a Kubernetes para orquestación avanzada
- [ ] Implementar service mesh (Istio/Linkerd)
- [ ] Multi-region deployment
- [ ] Disaster recovery automation

---

## 🐛 Troubleshooting

### Las réplicas no se crean

**Síntoma:** `docker compose up` no crea múltiples réplicas

**Causa:** Docker Compose requiere v2.x para soporte de `deploy.replicas`

**Solución:**
```powershell
docker compose version  # Verificar versión
docker compose up -d --scale userservice=2  # Alternativa
```

### El balanceo no distribuye equitativamente

**Síntoma:** Todas las peticiones van a la misma réplica

**Causa:** Sticky sessions habilitadas

**Solución:** Esto es comportamiento esperado para mantener sesiones de usuario.
```powershell
# Probar sin cookies para ver distribución real
.\scripts\load-test.ps1 -Service userservice -Requests 20
```

### Health checks fallan

**Síntoma:** Dashboard muestra réplicas como "unhealthy"

**Causa:** Endpoint `/health` no disponible o servicio caído

**Solución:**
```powershell
# Verificar logs
docker compose logs userservice

# Probar endpoint directamente
curl https://localhost/api/users/health -k

# Reiniciar servicio
docker compose restart userservice
```

### Consumo excesivo de recursos

**Síntoma:** Sistema lento, alta utilización de CPU/RAM

**Causa:** Demasiadas réplicas o límites mal configurados

**Solución:**
```powershell
# Ver consumo actual
docker stats

# Reducir réplicas
.\scripts\scale-service.ps1 -Service all -Replicas 2

# Ajustar límites en docker-compose.yml
```

---

## 📞 Soporte

Para más información:
- **Documentación API Gateway**: [APIGateway.md](./APIGateway.md)
- **Documentación Scripts**: [scripts/README.md](./scripts/README.md)
- **Dashboard Traefik**: http://localhost:8080/dashboard/
- **Repositorio**: https://github.com/JulianAVG64/MusicShare

---

## 📝 Notas Finales

✅ **Sistema completamente funcional** con balanceo de carga automático

✅ **4 servicios escalables** con 2 réplicas iniciales cada uno

✅ **Scripts automatizados** para operaciones comunes

✅ **Documentación completa** para uso y troubleshooting

✅ **Health checks y failover** automáticos implementados

✅ **Sticky sessions** para mantener estado de usuario

---

*Implementación completada el 17 de noviembre de 2025*  
*Versión: 1.0*  
*Equipo: Los SilkSongs*
