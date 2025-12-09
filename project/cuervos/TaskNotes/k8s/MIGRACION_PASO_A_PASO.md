# Migración a Kubernetes – Paso a paso (TaskNotes)

Este registro documenta las acciones realizadas para migrar el entorno `e2e` de Docker Compose hacia Kubernetes, reemplazando la replicación y balanceo interno por `Deployment` + `Service` y preparando `HPA` para escalado automático.

## 1) Namespace y ConfigMaps base
- Creado `tasknotes` (`k8s/base/namespace.yaml`).
- Creado `ConfigMap` de Rate Limiting para el Gateway: `k8s/base/configmap-gateway-rate-limit.yaml`.
- Creado `ConfigMap` de caché para el `search-service`: `k8s/base/configmap-search-cache.yaml`.
- Nuevo `ConfigMap` con URLs internas del Gateway: `k8s/base/configmap-gateway-upstreams.yaml`.

Comandos sugeridos:
```
kubectl apply -f TaskNotes/k8s/base/namespace.yaml
kubectl apply -n tasknotes -f TaskNotes/k8s/base/configmap-gateway-rate-limit.yaml
kubectl apply -n tasknotes -f TaskNotes/k8s/base/configmap-search-cache.yaml
kubectl apply -n tasknotes -f TaskNotes/k8s/base/configmap-gateway-upstreams.yaml
```

## 2) Gateway y Frontends expuestos (NodePort)
- `api-gateway` Deployment y Service (NodePort 30083/30443):
  - `k8s/base/api-gateway-deployment.yaml`
  - `k8s/base/api-gateway-service.yaml`
- Frontends:
  - `frontend-micro`: `k8s/base/frontend-micro-deployment.yaml`, `k8s/base/frontend-micro-service.yaml` (NodePort 30080)
  - `frontend-ssr`: `k8s/base/frontend-ssr-deployment.yaml`, `k8s/base/frontend-ssr-service.yaml` (NodePort 30030)

Aplicación:
```
kubectl apply -n tasknotes -f TaskNotes/k8s/base/api-gateway-deployment.yaml
kubectl apply -n tasknotes -f TaskNotes/k8s/base/api-gateway-service.yaml
kubectl apply -n tasknotes -f TaskNotes/k8s/base/frontend-micro-deployment.yaml
kubectl apply -n tasknotes -f TaskNotes/k8s/base/frontend-micro-service.yaml
kubectl apply -n tasknotes -f TaskNotes/k8s/base/frontend-ssr-deployment.yaml
kubectl apply -n tasknotes -f TaskNotes/k8s/base/frontend-ssr-service.yaml
```

## 3) Microservicios core (ClusterIP + sondas)
Se agregaron Deployments y Services (ClusterIP) con 2 réplicas y sondas `/healthz` en sus puertos HTTP:
- `auth-service` (8002): `k8s/base/auth-service-deployment.yaml`, `k8s/base/auth-service-service.yaml`
- `tasks-service` (HTTP 8003, gRPC 50052): `k8s/base/tasks-service-deployment.yaml`, `k8s/base/tasks-service-service.yaml`
- `notes-service` (HTTP 8004, gRPC 50051): `k8s/base/notes-service-deployment.yaml`, `k8s/base/notes-service-service.yaml`
- `tags-service` (8005): `k8s/base/tags-service-deployment.yaml`, `k8s/base/tags-service-service.yaml`
- `categories-service` (8006, .NET): `k8s/base/categories-service-deployment.yaml`, `k8s/base/categories-service-service.yaml`
- `user-profile-service` (8007): `k8s/base/user-profile-service-deployment.yaml`, `k8s/base/user-profile-service-service.yaml`
- `search-service` (8008): `k8s/base/search-service-deployment.yaml`, `k8s/base/search-service-service.yaml`

Aplicación:
```
kubectl apply -n tasknotes -f TaskNotes/k8s/base/auth-service-deployment.yaml
kubectl apply -n tasknotes -f TaskNotes/k8s/base/auth-service-service.yaml
kubectl apply -n tasknotes -f TaskNotes/k8s/base/tasks-service-deployment.yaml
kubectl apply -n tasknotes -f TaskNotes/k8s/base/tasks-service-service.yaml
kubectl apply -n tasknotes -f TaskNotes/k8s/base/notes-service-deployment.yaml
kubectl apply -n tasknotes -f TaskNotes/k8s/base/notes-service-service.yaml
kubectl apply -n tasknotes -f TaskNotes/k8s/base/tags-service-deployment.yaml
kubectl apply -n tasknotes -f TaskNotes/k8s/base/tags-service-service.yaml
kubectl apply -n tasknotes -f TaskNotes/k8s/base/categories-service-deployment.yaml
kubectl apply -n tasknotes -f TaskNotes/k8s/base/categories-service-service.yaml
kubectl apply -n tasknotes -f TaskNotes/k8s/base/user-profile-service-deployment.yaml
kubectl apply -n tasknotes -f TaskNotes/k8s/base/user-profile-service-service.yaml
kubectl apply -n tasknotes -f TaskNotes/k8s/base/search-service-deployment.yaml
kubectl apply -n tasknotes -f TaskNotes/k8s/base/search-service-service.yaml
```

Notas:
- `search-service` inyecta `REDIS_URL`, `CACHE_TTL_SECONDS`, `RABBITMQ_URL` desde `tasknotes-search-cache` y usa `NOTES_GRPC_ADDR=notes-service:50051`, `TASKS_GRPC_ADDR=tasks-service:50052`.
- El Gateway ahora referencia DNS internos (`http://<service>:<port>`) desde `tasknotes-gateway-upstreams`.
- Algunos servicios dependen de bases de datos (Postgres/Mongo/RabbitMQ). Se crearán en pasos siguientes; mientras tanto podrían quedar en `CrashLoopBackOff` si no encuentran sus dependencias.

## 4) Autoscaling (HPA)
- Agregado `HPA` para `api-gateway` y `search-service`:
  - `k8s/base/hpa-api-gateway.yaml` (CPU 60%, 2–6 réplicas)
  - `k8s/base/hpa-search-service.yaml` (CPU 65%, 2–6 réplicas)

Aplicación:
```
minikube addons enable metrics-server
kubectl apply -n tasknotes -f TaskNotes/k8s/base/hpa-api-gateway.yaml
kubectl apply -n tasknotes -f TaskNotes/k8s/base/hpa-search-service.yaml
```

## 5) Construcción y carga de imágenes locales (Minikube)
Si usas imágenes `:local`:
```
eval $(minikube -p minikube docker-env)
docker build -t tasknotes/api-gateway:local api-gateway
docker build -t tasknotes/frontend-micro:local frontend-micro
docker build -t tasknotes/frontend-ssr:local frontend-ssr
docker build -t tasknotes/auth-service:local auth-service
docker build -t tasknotes/tasks-service:local tasks-service
docker build -t tasknotes/notes-service:local notes-service
docker build -t tasknotes/tags-service:local tags-service
docker build -t tasknotes/categories-service-dotnet:local categories-service-dotnet
docker build -t tasknotes/user-profile-service:local user-profile-service
docker build -t tasknotes/search-service:local search-service
```

## 6) Pruebas rápidas
- Obtén IP de Minikube: `minikube ip`.
- Verifica frontends: `http://<minikube-ip>:30080` y `http://<minikube-ip>:30030`.
- Verifica Gateway: `http://<minikube-ip>:30083` (HTTP) y `https://<minikube-ip>:30443` (HTTPS si se configura TLS).
- Ajusta `RATE_LIMIT_*` desde `tasknotes-gateway-rate-limit` sin redeploy.

## 7) Postgres para categories-service y user-profile-service

Desplegamos instancias dedicadas de Postgres para los servicios .NET y actualizamos sus Deployments para usar las conexiones correctas.

Manifests incluidos:

- Secrets: `postgres-categories-credentials`, `postgres-userprofile-credentials`.
- StatefulSets: `postgres-categories`, `postgres-userprofile`.
- Services: `postgres-categories`, `postgres-userprofile`.

Aplicación:

```powershell
kubectl apply -f TaskNotes/k8s/base/postgres-categories-secret.yaml
kubectl apply -f TaskNotes/k8s/base/postgres-categories-statefulset.yaml
kubectl apply -f TaskNotes/k8s/base/postgres-categories-service.yaml

kubectl apply -f TaskNotes/k8s/base/postgres-userprofile-secret.yaml
kubectl apply -f TaskNotes/k8s/base/postgres-userprofile-statefulset.yaml
kubectl apply -f TaskNotes/k8s/base/postgres-userprofile-service.yaml

kubectl apply -f TaskNotes/k8s/base/categories-service-deployment.yaml
kubectl apply -f TaskNotes/k8s/base/user-profile-service-deployment.yaml
```

Variables establecidas:

- `categories-service` (`POSTGRES_CONNECTION`): `Host=postgres-categories;Port=5432;Database=tasknotes_categories_dotnet;Username=postgres;Password=postgres`
- `user-profile-service` (`ConnectionStrings__Default`): `Host=postgres-userprofile;Port=5432;Database=tasknotes;Username=postgres;Password=postgres`

Notas:

- PVC de 1Gi por StatefulSet para persistencia.
- Probes TCP en `5432` para `readiness` y `liveness`.
- Verificar salud: `kubectl get pods -n tasknotes` y `kubectl describe pod <pod>`.

## 8) Próximos pasos
- Desplegar dependencias: `MongoDB` (StatefulSet), `Redis` y `RabbitMQ`.
- Crear `Secrets` para credenciales (JWT, DBs). Usar `stringData` para facilidad.
- Añadir `Ingress` para dominios y TLS en lugar de `NodePort`.
- Ejecutar pruebas de carga (k6) y validar `HPA`.
- Integrar observabilidad (Prometheus/Grafana) y seguridad (Prototype 3 en K8s).

## 8) Dependencias (DB/MQ/Cache)
- Redis (ClusterIP):
  - `k8s/base/redis-deployment.yaml`, `k8s/base/redis-service.yaml`
- RabbitMQ (ClusterIP) con credenciales:
  - Secret: `k8s/base/rabbitmq-secret.yaml`
  - Deployment: `k8s/base/rabbitmq-deployment.yaml`
  - Service: `k8s/base/rabbitmq-service.yaml`
  - Actualizado `ConfigMap` de `search-service` (`RABBITMQ_URL=amqp://tasknotes:tasknotes@rabbitmq.tasknotes.svc.cluster.local:5672`).
- MongoDB (StatefulSet 1 réplica):
  - Secret root: `k8s/base/mongodb-root-secret.yaml`
  - Init script: `k8s/base/mongodb-init-configmap.yaml` (montado en `/docker-entrypoint-initdb.d/init.js`)
  - StatefulSet y Service: `k8s/base/mongodb-statefulset.yaml`, `k8s/base/mongodb-service.yaml`
- `notes-service` actualizado con `MONGODB_URL` usando el Secret (`admin/password`).

Aplicación:
```
kubectl apply -n tasknotes -f TaskNotes/k8s/base/redis-deployment.yaml
kubectl apply -n tasknotes -f TaskNotes/k8s/base/redis-service.yaml
kubectl apply -n tasknotes -f TaskNotes/k8s/base/rabbitmq-secret.yaml
kubectl apply -n tasknotes -f TaskNotes/k8s/base/rabbitmq-deployment.yaml
kubectl apply -n tasknotes -f TaskNotes/k8s/base/rabbitmq-service.yaml
kubectl apply -n tasknotes -f TaskNotes/k8s/base/mongodb-root-secret.yaml
kubectl apply -n tasknotes -f TaskNotes/k8s/base/mongodb-init-configmap.yaml
kubectl apply -n tasknotes -f TaskNotes/k8s/base/mongodb-statefulset.yaml
kubectl apply -n tasknotes -f TaskNotes/k8s/base/mongodb-service.yaml
kubectl rollout restart deployment notes-service -n tasknotes
```

## 9) Ingress HTTP para Gateway y Frontends

Para acceder mediante hosts locales y un único punto de entrada, se agregaron dos recursos Ingress:

- `api-gateway-ingress` con host `api.tasknotes.local` → Service `api-gateway:8083`.
- `frontends-ingress` con hosts `ssr.tasknotes.local` → `frontend-ssr:3000` y `micro.tasknotes.local` → `frontend-micro:80`.

Instalación del controlador NGINX Ingress (baremetal genérico):

```
kubectl apply -f https://raw.githubusercontent.com/kubernetes/ingress-nginx/main/deploy/static/provider/baremetal/deploy.yaml
kubectl wait --namespace ingress-nginx --for=condition=available deploy/ingress-nginx-controller --timeout=300s
```

Aplicar los manifests de Ingress:

```
kubectl apply -n tasknotes -f TaskNotes/k8s/base/ingress-api-gateway.yaml
kubectl apply -n tasknotes -f TaskNotes/k8s/base/ingress-frontends.yaml
```

Configurar hosts locales en Windows (`C:\\Windows\\System32\\drivers\\etc\\hosts`):

```
127.0.0.1   api.tasknotes.local
127.0.0.1   ssr.tasknotes.local
127.0.0.1   micro.tasknotes.local
```

Si tu Ingress expone otra IP (por ejemplo en Minikube: `minikube ip`), usa esa IP.

Validaciones rápidas:

- `kubectl get ingress -n tasknotes` debe mostrar dos reglas activas.
- Acceso HTTP:
  - `http://api.tasknotes.local/healthz`
  - `http://ssr.tasknotes.local/`
  - `http://micro.tasknotes.local/`

Opcional: habilitar TLS dev

- Crea un `Secret` TLS con los certificados de `TaskNotes/certs` y referencia en los Ingress (`spec.tls`).
- Usa `https://` en los hosts locales y habilita `K6_INSECURE_SKIP_TLS_VERIFY` para pruebas.