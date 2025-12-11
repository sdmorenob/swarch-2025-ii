# TaskNotes en Kubernetes (Minikube) – Arquitectura Objetivo

Este documento define cómo cumplir los requisitos de confiabilidad, interoperabilidad, seguridad y desempeño en Kubernetes (Minikube), y traza el plan de despliegue y validación del autoscaling.

## Objetivo y Alcance
- Replicación (Escenario 1): ejecutar múltiples réplicas de servicios stateless con probes y `Deployment`.
- Service Discovery (Escenario 2): usar `Service` de Kubernetes (DNS interno `svc.cluster.local`) entre microservicios.
- Cluster (Escenario 3): implementar un clúster de datos con `StatefulSet` (MongoDB replicaset con `Headless Service`).
- Patrón del equipo (Escenario 4): mantener Cache Aside en `search-service` y rate limiting en `api-gateway`.
- Interoperabilidad: confirmar comunicación REST (Gateway → microservicios) y gRPC interno (search → notes) vía DNS de `Service`.
- Seguridad: reutilizar escenarios del Prototype 3 (JWT, transporte TLS opcional en `Ingress`).
- Desempeño y escalabilidad: configurar `HorizontalPodAutoscaler` y revalidar pruebas con k6; confirmar que el enfoque de autoscaling cumple objetivos de fiabilidad y escalabilidad.

## Componentes y tipos
- `api-gateway`: `Deployment` (stateless), `Service` expuesto (`NodePort` o `Ingress`).
- Frontends (`frontend-micro`, `frontend-ssr`): `Deployment` + `Service` expuesto.
- Microservicios core (`auth-service`, `tasks-service`, `notes-service`, `search-service`, `tags-service`, `categories-service`, `user-profile-service`, `logs-service`): `Deployment` + `Service` `ClusterIP`.
- Infra: `rabbitmq`, `redis`: `Deployment` o `StatefulSet` simple + `Service` `ClusterIP`.
- Base de datos: `mongodb` como `StatefulSet` (replicaset 3) + `Headless Service` para descubrimiento de pods.
- Observabilidad: `prometheus`, `grafana` (opcional en K8s; en Minikube se pueden usar servicios existentes expuestos).
- Namespace: `tasknotes` para aislar recursos.

## Patrones de Confiabilidad
- Replicación (Escenario 1):
  - Réplicas iniciales: `api-gateway=2`, `search-service=2`, `notes-service=2`, `tasks-service=2`.
  - Probes: `readinessProbe` y `livenessProbe` HTTP/gRPC según cada servicio.
- Service Discovery (Escenario 2):
  - Todos los servicios con `Service` (`ClusterIP`). DNS interno: `nombre-servicio.tasknotes.svc.cluster.local`.
  - El Gateway resuelve microservicios por nombre de `Service`.
- Cluster (Escenario 3):
  - `mongodb` como `StatefulSet` (3 réplicas) con `Headless Service` (`clusterIP: None`).
  - Init para `rs.initiate()` y configuración de miembros via environment.
  - Nota: en Minikube (1 nodo) las réplicas corren en el mismo nodo; sirve para validar patrón y failover de pod.
- Patrón del equipo (Escenario 4):
  - Cache Aside: `search-service` con Redis interno; invalidación por mensajes RabbitMQ.
  - Rate Limiting: `api-gateway` con token bucket, configurable por env.

## Autoscaling (HPA)
- Prerrequisitos: habilitar `metrics-server` en Minikube (`minikube addons enable metrics-server`).
- `HorizontalPodAutoscaler` (v2) sobre `api-gateway` y `search-service`:
  - Objetivo CPU: 70% (se puede ajustar tras pruebas).
  - Rango réplicas: `minReplicas: 2`, `maxReplicas: 5`.
- Recursos (ejemplo inicial):
  - `api-gateway`: `requests: cpu 200m, memory 256Mi`; `limits: cpu 500m, memory 512Mi`.
  - `search-service`: `requests: cpu 200m, memory 256Mi`; `limits: cpu 700m, memory 512Mi`.

## Configuración y credenciales
- `ConfigMap`: variables no sensibles (URLs internos, timeouts, flags de rate limiting y cache TTL).
- `Secret`: credenciales (JWT secret para desarrollo, contraseñas de DB, usuario RabbitMQ).
- Montaje: variables de entorno en `Deployment`; `Secret` como `envFrom` o claves puntuales.

## Exposición de servicios
- Opción simple: `NodePort` para `api-gateway` y UIs; base URL local `http://<minikube-ip>:<nodeport>`.
- Opción recomendada: `Ingress` (addon de Minikube); mapea host local (ej. `tasknotes.local`) a `api-gateway`/UIs, con TLS opcional.

## Validación de interoperabilidad
- REST: `frontend-*` → `api-gateway` → microservicios (`ClusterIP`). Validar rutas principales (`/notes`, `/tasks`, `/auth/login`).
- gRPC: `search-service` → `notes-service` (DNS por `Service`). Confirmar búsquedas desde GraphQL/REST.

## Plan de pruebas de desempeño y escalado
1) Calentamiento: tráfico bajo durante 2–3 minutos para estabilizar.
2) Carga: aumentar RPS gradualmente con k6 (escenario `progressive`) contra `api-gateway`.
3) Observación:
   - `kubectl get hpa -n tasknotes` → ver `TARGETS` y réplicas.
   - `kubectl top pods -n tasknotes` → confirmar uso de CPU/memoria.
   - Logs del Gateway y `search-service`.
4) Criterios de aceptación ("confirm that the autoscaling approach meets reliability and scalability objectives"):
   - Escalado hacia arriba cuando `CPU > objetivo` sostenido por ≥1 min.
   - Latencia P95 estable o mejora tras escalar; error rate bajo (<1–2%).
   - No hay timeouts sostenidos; el sistema se mantiene disponible durante picos.
   - Escalado hacia abajo al reducir carga sin thrashing excesivo.

## Notas de implementación
- Imágenes: usar `minikube image load <imagen>` o construir dentro del entorno (`eval $(minikube docker-env)` en Linux/macOS; en Windows PowerShell usar `minikube -p minikube docker-env | Invoke-Expression`).
- Probes: ajustar `initialDelaySeconds`, `timeoutSeconds`, `periodSeconds` según servicio.
- Límites/solicitudes: comenzar conservador y ajustar según métricas.
- Compatibilidad dev: si TLS complica, exponer HTTP (`NodePort`) y mantener JWT simple.

## Próximos pasos (manifiestos)
- `namespace.yaml`: crear `Namespace tasknotes`.
- `api-gateway-deployment.yaml` + `api-gateway-service.yaml` (NodePort o Ingress).
- `*-service-deployment.yaml` + `*-service.yaml` para microservicios principales.
- `mongodb-statefulset.yaml` + `mongodb-headless-service.yaml`.
- `hpa-api-gateway.yaml` y `hpa-search-service.yaml`.
- `configmap.yaml` y `secrets.yaml` con variables esenciales.