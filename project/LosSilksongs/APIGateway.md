# API Gateway - MusicShare

Este documento describe la configuración y funcionamiento del API Gateway en el proyecto MusicShare, que utiliza **Traefik** como proxy inverso y punto de entrada único para todos los servicios.

## 🏗️ Arquitectura del API Gateway

## 📖 Concepto Clave: API Gateway con Traefik en Kubernetes

Nuestra arquitectura **ha sido migrada a Kubernetes** y utiliza **Traefik** como API Gateway, un proxy inverso moderno que:
 - **Enruta automáticamente** las peticiones a los servicios correctos mediante **IngressRoute CRDs**
 - **Descubre servicios** automáticamente desde la API de Kubernetes
 - **Maneja SSL/TLS** para conexiones seguras (con cert-manager para certificados automáticos)
 - **Balancea carga** entre réplicas de servicios mediante Service discovery
 - **Proporciona un dashboard** para monitoreo en tiempo real
 - **Soporta escalado automático (HPA)** basado en métricas de CPU

**A Traefik no le importa la lógica interna de los servicios, solo le importa la ruta y el nombre del Service de Kubernetes al que debe dirigir las solicitudes.**

## 🏗️ Arquitectura del API Gateway en Kubernetes
```
Internet/Cliente
       ↓
   Traefik (Puerto 80/443)
       ↓
   ┌────────────────────────────────┐
   │  Enrutamiento por PathPrefix   │
   └────────────────────────────────┘
       ↓
   ┌───────────────────────────────────────────────────┐
   │                                                     │
   ├─→ /api/users      → UserService (8002)            │
   ├─→ /api/music      → MusicService (8081)           │
   ├─→ /api/social     → SocialService (8083)          │
   ├─→ /api/notifications → NotificationService (8082) │
   ├─→ /ws             → NotificationService WebSocket │
   ├─→ /upload         → Next.js SSR (3000)            │
   ├─→ /formulario-post → Formulario Post Frontend (80)│
   └─→ /               → Frontend React (80)           │
       (prioridad 1, catch-all)                        │
   └───────────────────────────────────────────────────┘
```

## ✅ Servicios Configurados en el API Gateway

### 1. **UserService** (Puerto 8002)
- **Ruta**: `/api/users`
- **Middleware**: Strip prefix `/api/users`
- **Ejemplos de endpoints**:
  - `https://musicshare.com/api/users/auth/token` → `http://userservice:8002/auth/token`
  - `https://musicshare.com/api/users/me` → `http://userservice:8002/me`

### 2. **MusicService** (Puerto 8081)
- **Ruta**: `/api/music`
- **Middleware**: Strip prefix `/api/music`
- **Ejemplos de endpoints**:
  - `https://musicshare.com/api/music/tracks` → `http://music-service:8081/tracks`
  - `https://musicshare.com/api/music/playlists` → `http://music-service:8081/playlists`

### 3. **SocialService** (Puerto 8083)
- **Ruta**: `/api/social`
- **Middleware**: Strip prefix `/api/social`
- **Rutas adicionales**: `/swagger-ui`, `/v3/api-docs` (sin strip prefix para Swagger)
- **Ejemplos de endpoints**:
  - `https://musicshare.com/api/social/posts` → `http://social-service:8083/posts`
  - `https://musicshare.com/swagger-ui` → `http://social-service:8083/swagger-ui`

### 4. **NotificationService** (Puerto 8082)
- **Ruta REST**: `/api/notifications`
- **Ruta WebSocket**: `/ws`
- **Middleware**: Strip prefix `/api/notifications` (solo para REST)
- **Ejemplos**:
  - `https://musicshare.com/api/notifications/send` → `http://notificationservice:8082/send`
- **Sin strip prefix**: Sirve la aplicación React tal cual

### 7. **Formulario Post Frontend** (Puerto 80)
- **Ruta**: `/formulario-post`
- **Estado**: Carpeta vacía (solo `.gitkeep`)
- **Acción requerida**: Implementar el servicio antes de configurar en Traefik
- **No requiere exposición pública**: Correcto según arquitectura de microservicios

```yaml
api:
entryPoints:

### 1. **UserService**
 - **Réplicas**: 2 iniciales, escalables hasta 6 (via HPA)
## 📋 Despliegue en Kubernetes

### Requisitos previos
 - Clúster Kubernetes activo (minikube, kind, EKS, GKE, AKS, etc.)
 - `kubectl` configurado para acceder al clúster
 - Docker/Podman para construir imágenes
 - Helm (opcional, para cert-manager)

### Pasos para desplegar Traefik y servicios

**1. Aplicar manifiestos en orden:**
```bash
# Crear namespace y aplicar recursos de Traefik
kubectl apply -f k8s/namespace.yaml
kubectl apply -f k8s/traefik-crd.yaml
kubectl apply -f k8s/traefik-config.yaml
kubectl apply -f k8s/traefik-deployment-updated.yaml
kubectl apply -f k8s/ingressroutes.yaml

# Opcional: cert-manager para TLS automático
kubectl apply -f k8s/cert-manager.yaml

# Desplegar servicios
kubectl apply -f k8s/frontend-deployment-service.yaml
kubectl apply -f k8s/backend-deployments-services.yaml
kubectl apply -f k8s/databases.yaml
kubectl apply -f k8s/hpa.yaml
```

**2. Verificar instalación:**
```bash
# Ver todos los recursos en el namespace
kubectl get all -n musicshare

# Ver IngressRoutes
kubectl get ingressroutes -n musicshare

# Ver HorizontalPodAutoscalers
kubectl get hpa -n musicshare

# Ver logs de Traefik
kubectl logs -n musicshare deployment/traefik-gateway -f
```

**3. Acceder a servicios:**
 - **Frontend**: `http://<LOAD_BALANCER_IP>/`
 - **API Users**: `http://<LOAD_BALANCER_IP>/api/users/`
 - **API Music**: `http://<LOAD_BALANCER_IP>/api/music/`
 - **Dashboard Traefik**: `http://localhost:8080/dashboard/` (port-forward)

### Port-forward para acceso local
```bash
# Acceder al dashboard de Traefik
kubectl port-forward -n musicshare svc/traefik-gateway 8080:8080

# Acceder a la BD MongoDB
kubectl port-forward -n musicshare svc/mongodb 27017:27017

# Acceder a PostgreSQL
kubectl port-forward -n musicshare svc/postgres 5432:5432
```

## 📂 Archivos de configuración

 - `docker-compose.yml`: Guía informativa sobre la migración a Kubernetes
 - `k8s/namespace.yaml`: Namespace para MusicShare
 - `k8s/traefik-crd.yaml`: Custom Resource Definitions de Traefik
 - `k8s/traefik-config.yaml`: ConfigMap con configuración de Traefik
 - `k8s/traefik-deployment-updated.yaml`: Deployment y RBAC para Traefik
 - `k8s/ingressroutes.yaml`: Rutas y middleware para servicios
 - `k8s/frontend-deployment-service.yaml`: Frontend + Load Balancer
 - `k8s/backend-deployments-services.yaml`: Microservicios backend
 - `k8s/databases.yaml`: PostgreSQL, MongoDB, RabbitMQ
 - `k8s/hpa.yaml`: Escalado automático (HorizontalPodAutoscaler)
 - `k8s/cert-manager.yaml`: Certificados automáticos (Let's Encrypt)
 - `k8s/TRAEFIK_SETUP.md`: Guía detallada de instalación de Traefik
 - **Configuración en Kubernetes**:
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
   ```

### 2. **MusicService**
 - **Namespace**: `musicshare`
 - **Service Name**: `musicservice`
 - **Ruta**: `/api/music`
 - **Middleware**: `strip-music`
 - **Réplicas**: 2 iniciales, escalables hasta 6 (via HPA)
 - **Dependencias**: MongoDB, Metadata Service (gRPC)

### 3. **SocialService**
 - **Namespace**: `musicshare`
 - **Service Name**: `social-service`
 - **Ruta**: `/api/social`
 - **Middleware**: `strip-social`
 - **Réplicas**: 2 iniciales, escalables hasta 5 (via HPA)
 - **Dependencias**: PostgreSQL (social_db)

### 4. **NotificationService**
 - **Namespace**: `musicshare`
 - **Service Name**: `notificationservice`
 - **Ruta REST**: `/api/notifications`
 - **Ruta WebSocket**: `/ws`
 - **Réplicas**: 2 iniciales, escalables hasta 6 (via HPA)
 - **Dependencias**: RabbitMQ

### 5. **Frontend React**
 - **Deployment**: 3 réplicas (static, sin HPA)
 - **Service Type**: `LoadBalancer` (expuesto públicamente)
 - **Ruta**: `/` (match catch-all en IngressRoute)

### 6. **Metadata Service (gRPC)**
 - **Service Name**: `metadata-service`
 - **Puerto**: 50051 (gRPC)
 - **Tipo**: Service interno (ClusterIP)
 - **Nota**: NO expuesto a través de Traefik, solo consumido por MusicService internamente
          to: websecure
          scheme: https
  websecure:
    address: ":443"

providers:
  docker:
    endpoint: "unix:///var/run/docker.sock"
    exposedByDefault: false
    watch: true
    network: backend_net

accessLog: {}

log:
  level: INFO

metrics:
  prometheus:
    addEntryPointsLabels: true
Load Balancer Público (Service type: LoadBalancer)
     ↓
Frontend React (3 réplicas)
     ↓
Traefik Gateway (Deployment 2 réplicas, interno via ClusterIP)
    buckets: [0.1,0.3,1.2,5.0]
   ┌────────────────────────────────────────────┐
   │  Enrutamiento por IngressRoute + PathPrefix │
   └────────────────────────────────────────────┘
```
   ┌──────────────────────────────────────────────────────────┐
### Puertos Expuestos
   ├─→ /api/users      → UserService (2-6 réplicas via HPA)   │
   ├─→ /api/music      → MusicService (2-6 réplicas via HPA)  │
   ├─→ /api/social     → SocialService (2-5 réplicas via HPA) │
   ├─→ /api/notifications → NotificationService (2-6 réplicas)│
## �📖 Concepto Clave: Independencia de Servicios
   └──────────────────────────────────────────────────────────┘
## 🛠️ Flujo de Trabajo para Modificar un Servicio

## 🔑 Diferencia Clave: Load Balancer vs API Gateway

 - **Load Balancer Público** (`frontend-loadbalancer`): Expuesto al internet, distribuye tráfico al frontend React
 - **API Gateway** (Traefik): Desplegado internamente en el cluster, enruta a microservicios backend
 - **Separación**: El tráfico hacia los servicios API pasa **primero por el frontend, luego por Traefik**
Sigue estos pasos para aplicar cambios en el código de cualquier servicio (por ejemplo, `userservice`).

### Paso 1: Realiza tus Cambios en el Código

Edita los archivos de código fuente del servicio que quieras modificar. Por ejemplo, si quieres cambiar cómo se autentica un usuario, editarías los archivos dentro de la carpeta `userservice/app/`.

> **Ejemplo**: Modificar `userservice/app/crud.py` para añadir una nueva función.

### Paso 2: Reconstruye y Reinicia el Servicio Específico

Una vez que hayas guardado tus cambios, necesitas decirle a Docker que reconstruya la imagen de ese servicio específico con el nuevo código y que reinicie el contenedor.

Abre tu terminal en la raíz del proyecto y ejecuta el siguiente comando, reemplazando `<nombre-del-servicio>` por el servicio que modificaste:

```bash
docker-compose up -d --build <nombre-del-servicio>
```

  * `--build`: Le dice a Docker que reconstruya la imagen desde su `Dockerfile`.
  * `-d`: Ejecuta los contenedores en segundo plano (detached mode).

**Ejemplos prácticos:**

  * Para aplicar cambios en el **servicio de usuarios**:
    ```bash
    docker-compose up -d --build userservice
    ```
  * Para aplicar cambios en el **servicio de música**:
    ```bash
    docker-compose up -d --build music-service
    ```
  * Para aplicar cambios en el **frontend**:
    ```bash
    docker-compose up -d --build frontend
    ```

Docker será lo suficientemente inteligente como para reconstruir solo el servicio que especificaste y reiniciar únicamente los contenedores necesarios. El API Gateway detectará automáticamente el nuevo contenedor actualizado y comenzará a enviarle tráfico. **No necesitas hacer nada más.**

-----

## ⚠️ ¿Cuándo SÍ se debe modificar la configuración del Gateway?

La única vez que necesitas pensar en el API Gateway es cuando cambias el "**contrato**" de un servicio, es decir, su dirección o ruta pública. Esto se hace modificando las `labels` en el archivo `docker-compose.yml`.

**Solo necesitas actualizar `docker-compose.yml` si vas a:**

1.  **Cambiar una ruta pública**: Por ejemplo, si decides que el login ya no estará en `/api/users/auth/token` sino en `/auth/token`.
2.  **Cambiar el puerto interno** de un servicio.
3.  **Añadir un nuevo microservicio** que necesite ser accesible desde el exterior.

En esos casos, simplemente ajustas las `labels` del servicio correspondiente en `docker-compose.yml` y ejecutas `docker-compose up -d`. Traefik detectará los cambios y actualizará sus reglas de enrutamiento automáticamente.

## 🚀 Cómo Agregar un Nuevo Servicio al API Gateway

Si necesitas agregar un nuevo servicio (por ejemplo, `searchservice`), sigue estos pasos:

### 1. Define el servicio en `docker-compose.yml`

```yaml
searchservice:
  build:
    context: ./searchservice
    dockerfile: Dockerfile
  container_name: musicshare-searchservice
  restart: unless-stopped
  environment:
    PORT: 8084
  networks:
    - backend_net
  labels:
    - "traefik.enable=true"
    - "traefik.http.routers.searchservice.rule=PathPrefix(`/api/search`)"
    - "traefik.http.middlewares.searchservice-stripprefix.stripprefix.prefixes=/api/search"
    - "traefik.http.routers.searchservice.middlewares=searchservice-stripprefix"
    - "traefik.http.services.searchservice.loadbalancer.server.port=8084"
    - "traefik.http.routers.searchservice.entrypoints=websecure"
    - "traefik.http.routers.searchservice.tls=true"
```

### 2. Explica las Labels de Traefik

- **`traefik.enable=true`**: Habilita el servicio para ser descubierto por Traefik
- **`traefik.http.routers.[nombre].rule`**: Define la regla de enrutamiento (PathPrefix, Host, etc.)
- **`traefik.http.middlewares.[nombre]-stripprefix`**: Elimina el prefijo de la URL antes de reenviarla al servicio
- **`traefik.http.services.[nombre].loadbalancer.server.port`**: Puerto interno del contenedor
- **`traefik.http.routers.[nombre].entrypoints`**: Punto de entrada (web=HTTP, websecure=HTTPS)
- **`traefik.http.routers.[nombre].tls=true`**: Habilita TLS/SSL

### 3. Levanta el servicio

```bash
docker-compose up -d searchservice
```

Traefik detectará automáticamente el nuevo servicio y comenzará a enrutar el tráfico.

## 🔍 Monitoreo y Debugging

### Acceder al Dashboard de Traefik
```
http://localhost:8080
```

El dashboard muestra:
- Todos los routers configurados
- Servicios activos y su estado
- Middlewares aplicados
- Métricas de tráfico en tiempo real

### Ver logs de Traefik
```bash
docker logs musicshare_traefik -f
```

### Verificar que un servicio está registrado
```bash
docker logs musicshare_traefik | grep "Creating service"
```

## 🧠 Métricas y Observabilidad (Versión Simplificada)

Stack mínimo adoptado para reducir complejidad:

- Traefik expone métricas Prometheus en `:8080/metrics`.
- Prometheus las scrapea cada 10s (ver `prometheus/prometheus.yml`).
- Grafana consume un único datasource Prometheus (UID sugerido dashboard: `ms-trfk-lb-20251117`).

Levantar:
```powershell
docker compose up -d traefik prometheus grafana
start http://localhost:3010
```

Consultas recomendadas:
- Throughput total: `sum(rate(traefik_entrypoint_requests_total[1m]))`
- Latencia p95: `histogram_quantile(0.95, sum(rate(traefik_service_request_duration_seconds_bucket[5m])) by (le))`
- Errores 5xx por servicio: `sum by(service) (increase(traefik_service_requests_total{code=~"5.."}[5m]))`
- Distribución por router: `sum by(router) (rate(traefik_router_requests_total[1m]))`

Para pruebas manuales de carga usar `scripts/load-test.ps1`.

## 📊 Resumen de Configuración Actual

| Servicio | Ruta Pública | Puerto Interno | Strip Prefix | Réplicas | Estado |
|----------|--------------|----------------|--------------|----------|--------|
| UserService | `/api/users` | 8002 | ✅ | 2 | ✅ Configurado + LB |
| MusicService | `/api/music` | 8081 | ✅ | 2 | ✅ Configurado + LB |
| SocialService | `/api/social` | 8083 | ✅ | 2 | ✅ Configurado + LB |
| NotificationService | `/api/notifications` | 8082 | ✅ | 2 | ✅ Configurado + LB |
| NotificationService WS | `/ws` | 8082 | ❌ | 2 | ✅ Configurado + LB |
| Next.js SSR | `/upload` | 3000 | ❌ | 1 | ✅ Configurado |
| Formulario Post | `/formulario-post` | 80 | ✅ | 1 | ✅ Configurado |
| Frontend React | `/` | 80 | ❌ | 1 | ✅ Configurado |
| SearchService | `/api/search` | - | - | - | ❌ No implementado |
| MetadataService | - | 50051 (gRPC) | - | 1 | 🔒 Interno (correcto) |

**Leyenda**: LB = Load Balancing (Balanceo de Carga) activo

---

## ⚖️ Balanceo de Carga y Escalado Horizontal

### 🎯 Descripción

MusicShare implementa **balanceo de carga automático** mediante Traefik para distribuir el tráfico entre múltiples réplicas de cada microservicio. Esto permite:

- **Alta disponibilidad**: Si una réplica falla, las otras continúan sirviendo peticiones
- **Escalabilidad horizontal**: Aumenta la capacidad agregando más réplicas
- **Mejor rendimiento**: Distribuye la carga entre múltiples instancias

### 🔧 Configuración de Réplicas

Los servicios backend están configurados con **2 réplicas por defecto**:

```yaml
deploy:
  replicas: 2  # Número inicial de réplicas
  resources:
    limits:
      cpus: '0.5'
      memory: 512M
    reservations:
      cpus: '0.25'
      memory: 256M
  restart_policy:
    condition: on-failure
    delay: 5s
    max_attempts: 3
```

### 🔄 Algoritmo de Balanceo

Traefik utiliza **Round Robin** por defecto:
1. Primera petición → Réplica 1
2. Segunda petición → Réplica 2
3. Tercera petición → Réplica 1
4. Y así sucesivamente...

### 🍪 Sticky Sessions

Para servicios con estado (como sesiones de usuario), se configuran **sticky sessions** mediante cookies:

```yaml
labels:
  - "traefik.http.services.userservice.loadbalancer.sticky.cookie=true"
  - "traefik.http.services.userservice.loadbalancer.sticky.cookie.name=userservice_session"
```

Esto asegura que un usuario siempre se conecte a la misma réplica durante su sesión.

### 💓 Health Checks

Traefik verifica la salud de cada réplica automáticamente:

```yaml
labels:
  - "traefik.http.services.userservice.loadbalancer.healthcheck.path=/health"
  - "traefik.http.services.userservice.loadbalancer.healthcheck.interval=10s"
```

Si una réplica falla el health check, Traefik deja de enviarle tráfico hasta que se recupere.

### 📈 Escalar Servicios Manualmente

#### Usando Docker Compose

```powershell
# Escalar un servicio específico a N réplicas
docker compose up -d --scale userservice=3 --no-recreate

# Escalar múltiples servicios
docker compose up -d --scale userservice=3 --scale music-service=4 --no-recreate
```

#### Usando el Script de Escalado

MusicShare incluye un script PowerShell para facilitar el escalado:

```powershell
# Escalar un servicio específico
.\scripts\scale-service.ps1 -Service userservice -Replicas 5

# Escalar todos los servicios backend
.\scripts\scale-service.ps1 -Service all -Replicas 3

# Opciones disponibles:
# -Service: userservice, music-service, social-service, notificationservice, all
# -Replicas: 1-10 (número de réplicas deseadas)
```

**Características del script**:
- ✅ Validación de parámetros
- ✅ Muestra estado de réplicas en tiempo real
- ✅ Verifica salud de Traefik
- ✅ Salida con colores para mejor legibilidad

### 🧪 Probar el Balanceo de Carga

Utiliza el script de prueba de carga incluido:

```powershell
# Probar el balanceo en UserService con 20 peticiones
.\scripts\load-test.ps1 -Service userservice -Requests 20 -Delay 500

# Probar MusicService con 50 peticiones
.\scripts\load-test.ps1 -Service music-service -Requests 50 -Delay 200

# Parámetros:
# -Service: userservice, music-service, social-service
# -Requests: número de peticiones a realizar
# -Delay: milisegundos entre peticiones
```

**El script mostrará**:
- ✅ Estado de cada petición
- ✅ Tiempos de respuesta (promedio, mín, máx)
- ✅ Distribución de carga entre réplicas
- ✅ Porcentaje de peticiones por réplica

### 📊 Monitoreo en Tiempo Real

Accede al dashboard de Traefik para ver el balanceo en acción:

```
http://localhost:8080/dashboard/
```

En el dashboard podrás ver:
- **HTTP Routers**: Reglas de enrutamiento activas
- **HTTP Services**: Réplicas activas de cada servicio
- **Health Checks**: Estado de salud de cada réplica
- **Load Balancer**: Distribución de tráfico

### 🎯 Límites de Recursos

Cada réplica tiene límites definidos para evitar el consumo excesivo:

| Servicio | CPU Reservada | CPU Límite | RAM Reservada | RAM Límite |
|----------|---------------|------------|---------------|------------|
| UserService | 0.25 | 0.5 | 256MB | 512MB |
| MusicService | 0.5 | 0.75 | 512MB | 768MB |
| SocialService | 0.5 | 0.75 | 512MB | 1024MB |
| NotificationService | 0.25 | 0.5 | 256MB | 512MB |

### 🔮 Escalado Automático (Futuro)

Para implementar escalado automático basado en métricas:

1. **Integrar Prometheus + Grafana** para métricas en tiempo real
2. **Configurar alertas** basadas en:
   - CPU > 70% → Escalar +1 réplica
   - Requests/segundo > umbral → Escalar +1 réplica
   - Tiempo de respuesta > 500ms → Escalar +1 réplica
3. **Usar Kubernetes** para auto-scaling nativo con HPA (Horizontal Pod Autoscaler)

### 💡 Ejemplo de Flujo de Escalado

```
1. Sistema en carga normal: 2 réplicas de UserService
2. Tráfico aumenta → Detectado por métricas
3. Administrador ejecuta: .\scripts\scale-service.ps1 -Service userservice -Replicas 5
4. Docker Compose crea 3 réplicas adicionales
5. Traefik detecta automáticamente las nuevas réplicas
6. El tráfico se distribuye entre las 5 réplicas
7. Cuando la carga disminuye, se reduce a 2 réplicas nuevamente
```

### 🚨 Consideraciones Importantes

1. **Servicios con estado**: Asegúrate de usar sticky sessions o almacenamiento compartido
2. **Bases de datos**: No escales las bases de datos con este método (requiere replicación específica)
3. **Volúmenes compartidos**: Los uploads deben estar en volumen compartido para todas las réplicas
4. **Conexiones de BD**: Cada réplica abre sus propias conexiones, considera el pool de conexiones

---

## 🎯 Recomendaciones

### ✅ Configuración Correcta
1. **Todos los servicios REST públicos** están correctamente expuestos a través del API Gateway
2. **Redirección HTTP → HTTPS** configurada correctamente
3. **Strip prefix** aplicado adecuadamente para mantener APIs limpias
4. **Prioridades** bien definidas (frontend como catch-all con prioridad 1)
5. **MetadataService como servicio interno** es la decisión correcta arquitectónicamente
6. **Balanceo de carga activo** para servicios backend con 2 réplicas iniciales
7. **Health checks configurados** para monitoreo automático de réplicas
8. **Sticky sessions habilitadas** para mantener estado de sesión
9. **Límites de recursos definidos** para prevenir consumo excesivo

### 🔄 Escalabilidad Implementada
1. **UserService, MusicService, SocialService y NotificationService** son escalables horizontalmente
2. **Scripts de automatización** incluidos para facilitar operaciones de escalado
3. **Pruebas de carga** disponibles para verificar el balanceo
4. **Round Robin** como algoritmo de balanceo por defecto
5. **Métricas de Prometheus** habilitadas para monitoreo avanzado

### 🚀 Acciones Recomendadas
1. **SearchService**: Implementar el servicio y luego agregarlo al API Gateway con la ruta `/api/search`
2. **Certificados SSL**: En producción, configurar certificados válidos en `./traefik/certs`
3. **Dashboard en producción**: Cambiar `insecure: true` a `insecure: false` y configurar autenticación
4. **Monitoreo avanzado**: Integrar Grafana para visualización de métricas de Prometheus
5. **Auto-scaling**: Considerar migración a Kubernetes para escalado automático basado en métricas

### 🔐 Seguridad
- ✅ Sticky sessions implementadas para mantener sesiones de usuario
- ⚠️ Considerar agregar middleware de rate limiting por IP
- ⚠️ Implementar autenticación en el dashboard de Traefik para producción
- ✅ CORS configurado en cada servicio individualmente
- ⚠️ Usar certificados SSL válidos (Let's Encrypt o certificados corporativos) en producción
- ✅ Health checks protegen contra envío de tráfico a instancias no saludables

### 📈 Rendimiento
- ✅ Balanceo de carga distribuye tráfico entre réplicas
- ✅ Múltiples réplicas mejoran throughput
- ✅ Health checks automáticos evitan enviar tráfico a servicios caídos
- ⚠️ Considerar caché distribuido (Redis) para datos frecuentes
- ⚠️ Monitorear tiempos de respuesta y ajustar número de réplicas según carga

---

*Última actualización: 17 de noviembre de 2025*