# Plan de Implementación de Requerimientos No Funcionales (NFR)

Este documento detalla el estado actual y el plan por etapas para cumplir los escenarios de seguridad y rendimiento definidos en `REQUERIMIENTOS.md` (sección 2.2).

## Resumen del estado actual

- Reverse Proxy Pattern: Implementado.
  - `frontend-micro/nginx.conf` proxyea a `api-gateway`.
  - `api-gateway/main.py` actúa como reverse proxy hacia cada microservicio y verifica JWT.
- Secure Channel Pattern: Implementado (dev).
  - API Gateway sirve `HTTPS` en `8443` con `ENABLE_HTTPS`, certificados montados desde `certs/`.
  - gRPC interno (`search-service` ↔ `notes-service`/`tasks-service`) con TLS/mTLS opcional; certificados generados en `certs/grpc`.
  - Rotación automática de certificados mTLS disponible vía `certs/rotate-grpc-certs.(ps1|sh)`.
- Network Segmentation Pattern: Implementado.
  - Dos redes: `public-net` (Gateway y frontends) e `internal-net` (servicios y BD, `internal: true`).
  - Servicios internos sin exposición directa de puertos al host (superficie de ataque reducida).
- Load Balancer Pattern: Implementado (e2e) con `nginx-lb` y `least_conn`.
  - Réplicas por servicio (mínimo 2) y upstreams dedicados con `zone` compartida.
  - Tuning: `max_fails=5`, `fail_timeout=30s`, `max_conns=100` por backend, `proxy_next_upstream_timeout=5s`, `proxy_next_upstream_tries=2`.
  - Listeners activos: `:9002` (auth), `:9003` (tasks), `:9004` (notes), `:9005` (tags), `:9006` (categories), `:9007` (user-profile), `:9008` (search).
- Patrón de seguridad definido por el equipo: Faltante.
  - No hay rate limiting ni autenticación servicio-a-servicio más allá del JWT a nivel de Gateway.
- Pruebas de rendimiento: Faltante.
  - No hay scripts automatizados (k6/wrk) ni una matriz de escenarios.
- Patrón de rendimiento definido por el equipo: Faltante.
  - No hay caché de resultados ni mecanismos de degradación controlada.
 - Observabilidad: Implementado (dev).
   - Prometheus, Grafana y Alertmanager agregados; exporters para Nginx, Node, PostgreSQL, RabbitMQ y MongoDB.
   - Dashboards base en Grafana (Visión de Sistema, Métricas de Bases de Datos) y reglas de alerta (5xx, upstream unhealthy, DB health, colas estancadas).

## Objetivo

Cumplir: (1) cuatro escenarios de seguridad (Secure Channel, Reverse Proxy, Network Segmentation, +1 del equipo) y (2) dos escenarios de rendimiento/escala (Load Balancer +1 del equipo con pruebas de performance).

## Plan por etapas

### Etapa 0 — Preparación

- Crear carpeta `certs/` (dev) para certificados auto-firmados y `configs/` para configuraciones.
- Definir variables `.env` por servicio (ej.: `ENABLE_TLS`, `TLS_CERT_PATH`, `TLS_KEY_PATH`).
- Alinear tiempos de healthchecks y readiness para entornos con TLS.

### Etapa 1 — Secure Channel Pattern (TLS externo + mTLS interno gRPC)
Estado: Cumplido (dev)

- Externo (Cliente → API Gateway):
  - Generar certificado auto-firmado para dev y configurar `uvicorn` en `api-gateway` para servir HTTPS (puerto `8443`).
  - Docker Compose: montar `certs/gateway.crt` y `certs/gateway.key` en `api-gateway`; exponer `8443:8443`.
  - Aceptación: `https://localhost:8443/health` responde 200; el frontend funciona detrás de HTTPS.
- Interno (search-service ↔ notes-service/tasks-service vía gRPC):
  - Generar CA y emitir certs de servidor/cliente.
  - `search-service`: usar `grpc` con `credentials.NewClientTLSFromFile(...)`.
  - `notes-service` y `tasks-service`: iniciar gRPC con `grpc.server(..., credentials=server_creds)` en Python.
  - Aceptación: llamadas gRPC sólo funcionan con credenciales válidas; rechazar conexión insegura.

### Etapa 2 — Reverse Proxy Pattern (verificación/documentación)

- Revisar rutas en `api-gateway/main.py` para todos los servicios; asegurar forwarding de headers (`X-User-Id`, `Authorization`).
- Documentar mapeos y políticas de seguridad (JWT requerido, scopes si aplican).
- Aceptación: cada ruta proxyea correctamente y mantiene identidad del usuario.

### Etapa 3 — Network Segmentation Pattern (red pública vs. interna)
Estado: Cumplido (e2e)

- Docker Compose: crear dos redes
  - `public-net` (bridge): expone sólo `api-gateway` y frontends.
  - `internal-net` (bridge, `internal: true`): todos los microservicios y bases de datos.
- Conectar `api-gateway` a ambas redes; desconectar servicios internos del host eliminando `ports:` cuando no sean estrictamente necesarios.
- Mover `search-service` a red interna (accesible vía Gateway) para reducir superficie de ataque.
- Aceptación: el host sólo tiene `8083` (o `8443`), `3000`, `8080` expuestos; servicios internos aislados.

### Etapa 4 — Load Balancer Pattern (réplicas + balanceo)
Estado: Implementado (e2e) con Nginx dedicado (least_conn)

- Réplicas: `tasks-service-2`, `notes-service-2`, `search-service-2` en Compose.
- Balanceador dedicado `nginx-lb`:
  - Upstreams con ambas instancias por servicio, `zone` para compartir estado y `least_conn` para distribuir por menor cantidad de conexiones activas.
  - Tuning por backend: `max_fails=5`, `fail_timeout=30s`, `max_conns=100`.
  - Retries controlados por ruta: `proxy_next_upstream_timeout 5s;` y `proxy_next_upstream_tries 2;`.
  - Healthcheck en `:9000/health`; listeners: `:9002` (auth), `:9003` (tasks), `:9004` (notes), `:9005` (tags), `:9006` (categories), `:9007` (user-profile), `:9008` (search).
- API Gateway usa `nginx-lb` como backend:
  - `TASKS_SERVICE_URL=http://nginx-lb:9003`
  - `NOTES_SERVICE_URL=http://nginx-lb:9004`
  - `SEARCH_SERVICE_URL=http://nginx-lb:9008`
- Aceptación: `nginx-lb` y `api-gateway` están `healthy`; peticiones se distribuyen entre réplicas y ante falla de una instancia el servicio se mantiene.

Cobertura ampliada (servicios adicionales):
- Réplicas agregadas: `auth-service-2`, `tags-service-2`, `categories-service-2`, `user-profile-service-2`.
- Nuevos listeners en `nginx-lb`:
  - `:9002` (auth) → `auth_upstream`
  - `:9005` (tags) → `tags_upstream`
  - `:9006` (categories) → `categories_upstream`
  - `:9007` (user-profile) → `user_profile_upstream`
- API Gateway actualizado:
  - `AUTH_SERVICE_URL=http://nginx-lb:9002`
  - `TAGS_SERVICE_URL=http://nginx-lb:9005`
  - `CATEGORIES_SERVICE_URL=http://nginx-lb:9006`
  - `USER_PROFILE_SERVICE_URL=http://nginx-lb:9007`

### Etapa 5 — Seguridad definida por el equipo (Rate Limiting + políticas)
Estado: Implementado (gateway)

- Rate limiting en `api-gateway`: middleware token-bucket por ruta y método, clave por `user_id` (si token) o IP; ventana configurable (`RATE_LIMIT_WINDOW_SECONDS`) y límites por método (`GET/POST/PUT/PATCH/DELETE`).
- Validaciones JWT adicionales: verificación de `iss` (`JWT_ISSUER`), `aud` (`JWT_AUDIENCE`), `exp`, `iat`, `nbf` y tolerancia de clock skew (`JWT_CLOCK_SKEW_SECONDS`); rechazo si faltan o son inválidas. TTL máximo del token (`JWT_MAX_TTL_SECONDS`).
- Scopes/roles opcionales: políticas declarativas por endpoint/método con bypass por rol `admin`; activables con `ENABLE_SCOPE_ENFORCEMENT=true`.
- Nota: actualmente desactivado (no hay diferenciación de roles admin/usuario en autenticación).
- Observabilidad: métricas Prometheus de rate limiting (`gateway_rate_limit_allowed_total`, `gateway_rate_limit_blocked_total` con etiquetas `endpoint`, `method`, `key_type`) y latencia por ruta (`gateway_request_duration_seconds`), más contador total por estado HTTP (`gateway_requests_total`).
- Aceptación: peticiones que exceden el límite obtienen 429; métricas reflejan permitidas/bloqueadas; rutas protegidas exigen scopes cuando se habilita enforcement.

### Etapa 6 — Rendimiento definido por el equipo (Cache Aside)
Estado: Implementado (e2e)

- Infra: `redis` agregado en `internal-net` sin puertos al host, con `healthcheck` y `restart: always`.
- `search-service` (Go): Cache-Aside de respuestas de búsqueda frecuentes con claves consistentes `search:{user_id}:{hash}` sobre (`query`,`category`,`tags`,`limit`,`skip`).
  - TTL configurable vía `CACHE_TTL_SECONDS` (default 120s; rango recomendado 60–180s).
  - Métricas Prometheus: `search_cache_hits_total{source}` y `search_cache_misses_total{source}` para REST/GraphQL.
- Invalidación: suscripción a `tasknotes.events` en RabbitMQ (`note.updated|deleted`, `task.updated|deleted`) para limpiar claves por `user_id`.
  - Cola dedicada: `search-service-cache-invalidation` con bindings a las rutas anteriores.
- Variables de entorno: `REDIS_URL=redis:6379`, `CACHE_TTL_SECONDS=120`, `RABBITMQ_URL=amqp://rabbitmq:5672`.
- Aceptación: reducción significativa de latencia P50/P95 en búsquedas repetidas; coherencia tras actualizaciones y métricas visibles en Prometheus.

### Etapa 7 — Pruebas de rendimiento (k6/wrk)

Estado: Implementado (scaffolding y scripts k6/wrk)

- Carpeta `perf/` con:
  - k6: `perf/k6/search_scenario.js` (escenarios `baseline|tls|lb|cache`, variables env: `BASE_URL`, `RPS`, `DURATION`, `QUERY`, `USER_ID`).
  - Runners: `perf/run_k6.ps1` y `perf/run_wrk.ps1` con nombres de reporte versionados (`<timestamp>`).
  - wrk: `perf/wrk/search_post.lua` (payload configurable por `QUERY`, `USER_ID`).
  - Reporte: `perf/report.py` agrega JSON/TXT a `summary.csv` y genera `p95_by_scenario.png` (si `matplotlib`).
  - Documentación: `perf/README.md` con escenarios, KPIs, comandos de ejecución.

- Escenarios y cargas:
  - Baseline (sin TLS/Cache/LB), TLS (Gateway `https://`), LB (vía `nginx-lb`), Cache (warm‑up y consultas repetidas).
  - Cargas: 50 / 200 / 1000 RPS por 2–5 minutos; recolectar P50/P90/P95/P99 y error rate.

- KPIs y objetivos:
  - `POST /search`: P95 < 300 ms con cache; error rate < 1% en 200 RPS.
  - Escalado horizontal: linealidad ~80% al duplicar réplicas y mejora P95 vs baseline.

- Reportes:
  - k6: `perf/reports/k6-<scenario>-<rps>rps-<timestamp>.json`.
  - wrk: `perf/reports/wrk-<scenario>-<50rps|200rps|1000rps>-<timestamp>.txt`.
  - Consolidación: `perf/reports/summary.csv` y gráfico `p95_by_scenario.png`.

- Aceptación:
  - Reportes reproducibles y versionados; documentación de conclusiones por escenario con comparación de KPIs.

### Etapa 8 — Observabilidad y endurecimiento

Estado: Implementado (dev) — Prometheus, Grafana y Alertmanager

- Prometheus server agregado en Compose (`prometheus`), UI en `http://localhost:9090`.
- Grafana provisionada con dashboards base: "System Overview" y "Database Metrics"; UI en `http://localhost:3001`.
- Alertmanager configurado con reglas de alerta:
  - HTTP 5xx sostenidos en Gateway/Nginx.
  - Upstreams con fallos (`max_fails`) o tiempo de respuesta elevado.
  - Salud de PostgreSQL/Mongo y colas en RabbitMQ con backlog.
- Exporters y targets en `prometheus.yml`:
  - `nginx` → `nginx-exporter:9113`
  - `api-gateway` → `api-gateway:8083/metrics`
  - `node` → `node-exporter:9100`
  - `postgres` → `postgres-exporter:9187`
  - `rabbitmq` → `rabbitmq-exporter:9419`
  - `mongo` → `mongodb-exporter:9216`
- Documentación de ejecución y acceso: ver `MONITORING_SETUP.md`.

- Próximos pasos:
  - Instrumentar microservicios (Python, Go, .NET) con métricas negocio y latencia por operación.
  - Centralizar logs del Gateway con `trace-id` para correlación.
  - Revisar exposición de consolas (RabbitMQ, Mongo) sólo en dev; proteger en prod.

## Cambios esperados en archivos

- `TaskNotes/docker-compose.e2e.dist.yml`:
  - Definir `public-net` e `internal-net` con `internal: true`.
  - Remover `ports:` de servicios internos; añadir `redis`; exponer `8443` en `api-gateway`.
  - Duplicar servicios para LB (mínimo 2 instancias) o añadir `traefik`.
- `api-gateway/main.py`:
  - Soporte HTTPS (`uvicorn` flags) y upstream pool + round-robin + health checks.
  - Rate limiting middleware.
- `nginx-lb/nginx.conf`:
  - Balanceo `least_conn`, `zone` por upstream, `max_conns`, `max_fails`, `fail_timeout`, y límites de `proxy_next_upstream` consistentes por servicio.
- `monitoring/`:
  - `prometheus.yml`, reglas de alerta y provisioning de Grafana (dashboards base).
  - `MONITORING_SETUP.md` con pasos de despliegue y endpoints.
- `search-service` (Go):
  - TLS gRPC client creds; integración Redis para cache.
- `notes-service`/`tasks-service` (Python):
  - gRPC con TLS server creds.

## Criterios de aceptación por escenario

- Secure Channel: todo acceso externo via HTTPS; mTLS activo para gRPC; no se aceptan conexiones en claro.
- Reverse Proxy: Gateway enruta correctamente, preserva identidad y headers.
- Network Segmentation: sólo servicios públicos expuestos; aislamiento por redes verificable.
- Load Balancer: distribución bajo carga; tolerancia a fallos de instancias.
- Seguridad del equipo: límites aplicados; auditoría por usuario/ruta.
- Rendimiento del equipo: cache funcional; mejora P95 medible; invalidación correcta.
- Pruebas de performance: scripts y reportes versionados; objetivos cumplidos.

## Riesgos y mitigaciones

- Complejidad TLS/mTLS: empezar en dev con certs auto-firmados y scripts de generación.
- Cache inconsistente: usar invalidación por eventos y TTL conservador.
- LB en Compose: si se complica, migrar a `traefik` o a un orquestador con `deploy.replicas`.

## Cronograma sugerido

- Semana 1: Etapas 0–1 (TLS externo) y diseño mTLS.
- Semana 2: Etapas 3–4 (Segmentación y LB básico).
- Semana 3: Etapas 5–6 (Rate limiting y Cache Aside).
- Semana 4: Etapa 7 (Pruebas de performance) y 8 (observabilidad).

---

> Nota: en e2e se puede dejar `mongo-notes` expuesto sólo para inspección; en producción debe quedar interno.