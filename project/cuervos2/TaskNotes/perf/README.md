# Pruebas de Performance – Guía Completa

Este paquete contiene scripts para ejecutar pruebas de performance con k6 y wrk sobre el sistema (Gateway y microservicios). Incluye escenarios de carga (load) y estrés (stress), integración con Prometheus y InfluxDB, y dashboards predefinidos en Grafana.

## Checklist rápido

- Levantar entorno e2e: `docker compose -f TaskNotes/docker-compose.e2e.dist.yml up -d`
- Verificar salud del Gateway: los overrides `k6-*` esperan `service_healthy` automáticamente.
- Elegir servicio y levantar la prueba:
  - `search`: `SCENARIO=load USE_LOGIN_TOKEN_FOR_API=false docker compose -f TaskNotes/docker-compose.e2e.dist.yml -f TaskNotes/docker-compose.k6.search.override.yml up -d k6-search`
  - `tasks`: `SCENARIO=load USE_LOGIN_TOKEN_FOR_API=false docker compose -f TaskNotes/docker-compose.e2e.dist.yml -f TaskNotes/docker-compose.k6.tasks.override.yml up -d k6-tasks`
  - `tags`: `SCENARIO=load USE_LOGIN_TOKEN_FOR_API=false docker compose -f TaskNotes/docker-compose.e2e.dist.yml -f TaskNotes/docker-compose.k6.tags.override.yml up -d k6-tags`
  - `categories`: `SCENARIO=load USE_LOGIN_TOKEN_FOR_API=false docker compose -f TaskNotes/docker-compose.e2e.dist.yml -f TaskNotes/docker-compose.k6.categories.override.yml up -d k6-categories`
  - `user-profile`: `SCENARIO=load USE_LOGIN_TOKEN_FOR_API=false docker compose -f TaskNotes/docker-compose.e2e.dist.yml -f TaskNotes/docker-compose.k6.userprofile.override.yml up -d k6-userprofile`
  - `notes`: `SCENARIO=load USE_LOGIN_TOKEN_FOR_API=false docker compose -f TaskNotes/docker-compose.e2e.dist.yml -f TaskNotes/docker-compose.k6.notes.override.yml up -d k6-notes`
  - `auth`: `MODE=load USE_LOGIN_TOKEN_FOR_API=true docker compose -f TaskNotes/docker-compose.e2e.dist.yml -f TaskNotes/docker-compose.k6.auth.override.yml up -d k6-auth`
- Ver logs: `docker logs tasknotes-k6-<servicio>-1 --tail 200`. Busca `preflight ... status=200`.
- Visualizar en Grafana: usa los dashboards `k6-2587.json` y `k6-2587-service-detail.json` con los datasources provisionados.
- Si hay 401:
  - Usa `JWT_OVERRIDE` con un token real de `/auth/login` (ver sección “Generación de tokens”).
  - O activa `USE_LOGIN_TOKEN_FOR_API=true` para login automático en `setup()`.

## Requisitos

- k6 instalado y disponible en `PATH`.
- wrk (opcional) disponible en `PATH` (WSL o nativo).
- Entorno e2e levantado con `docker-compose.e2e.dist.yml` (para escenarios LB y Cache).

## Escenarios

- `load`: llegada constante a una tasa objetivo (RPS) por una duración específica.
- `stress`: rampa de llegada incrementando hasta un máximo y luego descendiendo.

Segmentación por etiquetas:
- `testid`: id de ejecución para comparar campañas.
- `service`: nombre del servicio bajo prueba (e.g., `search-service`, `auth-service`).
- `scenario`: nombre del escenario (`load`, `stress`, `login`, `api`).

## k6 (scripts y runner)

Scripts disponibles:
- `perf/k6/service_scenario.js`: genérico por servicio (GET/POST/PUT/DELETE). Soporta `load/stress` y modo por VUs o por RPS.
- `perf/k6/auth_scenarios.js`: tráfico de autenticación con dos escenarios: `login_perf` (login) y `api_traffic` (API con JWT).

Runner PowerShell: `perf/run_k6.ps1` simplifica ejecuciones repetibles, exporta reportes y etiquetas.

Autenticación:
- Los scripts generan un JWT HS256 válido para el Gateway en `setup()` y lo reutilizan durante la corrida.
- Si prefieres tokens pre-generados, usa `-JwtOverride` o `JWT_OVERRIDE`.

Modo de ejecutor (solo `service_scenario.js`):
- Flag `EXECUTOR_MODE=rps|vus` (predeterminado: `vus`).
- `vus`: ejecutores `ramping-vus` por concurrencia.
- `rps`: ejecutores `constant-arrival-rate` / `ramping-arrival-rate` por tasa de llegada.
  - Selección y configuración en `perf/k6/service_scenario.js`.

Parámetros clave (runner):
- `-BaseUrl`, `-Scenario load|stress`, `-RpsList`, `-Duration`, `-Preset <servicio>-<escenario>`.
- `-K6Script service_scenario.js|auth_scenarios.js`, `-K6Scenario` (para scripts con múltiples escenarios, p.ej. `login_perf`).
- `-ExecutorMode vus|rps` (se exporta como `EXECUTOR_MODE`).
- Salida: `-OutPrometheus`, `-OutInflux` (`-InfluxUrl`, `-InfluxV1Database`).

Ejemplos (VUs por servicio):

```powershell
# Carga (por defecto)
pwsh perf/run_k6.ps1 -BaseUrl http://localhost:8083 -K6Script service_scenario.js -Scenario load -Preset search-load -RpsList "50,200" -Duration 2m

# Estrés
pwsh perf/run_k6.ps1 -BaseUrl http://localhost:8083 -K6Script service_scenario.js -Scenario stress -Preset search-stress -RpsList "50,200" -Duration 5m

# Enviar métricas a Prometheus
pwsh perf/run_k6.ps1 -BaseUrl http://localhost:8083 -K6Script service_scenario.js -Scenario load -OutPrometheus -PrometheusWriteUrl http://localhost:9090/api/v1/write -Preset search-load -RpsList "50" -Duration 2m

# Enviar métricas a InfluxDB v1
pwsh perf/run_k6.ps1 -BaseUrl http://localhost:8083 -K6Script service_scenario.js -Scenario load -OutInflux -InfluxUrl http://localhost:8086 -Preset search-load -RpsList "50" -Duration 2m
```

Los reportes se guardan en `perf/reports/k6-<script>-<scenario>-<rps>rps-<timestamp>.json` usando `--summary-export`.

Ejemplos (Auth):

```powershell
# Solo login (con PowerShell, requiere k6 en PATH)
powershell -File TaskNotes\perf\run_k6.ps1 -BaseUrl http://localhost:8083 -K6Script auth_scenarios.js -K6Scenario login_perf -Scenario load -RpsList "5,10" -Duration 1m -TestId auth-load-login-001

# API traffic con JWT pre-generado a Prometheus
$token = "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9..."
pwsh perf/run_k6.ps1 -BaseUrl https://localhost:8443 -K6Script auth_scenarios.js -K6Scenario api_traffic -JwtOverride $token -Scenario load -RpsList "50" -Duration 2m -OutPrometheus -PrometheusWriteUrl http://localhost:9090/api/v1/write -TestId auth-api-001
```

## wrk

Script Lua: `perf/wrk/search_post.lua` y runner `perf/run_wrk.ps1`.

Autenticación:
- No hagas login por request. Usa tokens pre-generados.
- Pasa un archivo `tokens.txt` (un JWT por línea) o un token único.

Ejemplos:

```powershell
# Carga (load) sobre HTTP
pwsh perf/run_wrk.ps1 -Url http://localhost:8083/search -Scenario load -RpsList "50,200" -DurationSeconds 120

# Estrés (stress) ramp-up y ramp-down secuencial
pwsh perf/run_wrk.ps1 -Url http://localhost:8083/search -Scenario stress -RpsList "50,200,1000" -DurationSeconds 60

# Con tokens pre-generados (recomendado)
pwsh perf/run_wrk.ps1 -Url https://localhost:8443/search -Scenario load -RpsList "50,200" -DurationSeconds 120 -TokensFile ./perf/wrk/tokens.txt

# Con un token único
pwsh perf/run_wrk.ps1 -Url https://localhost:8443/search -Scenario load -RpsList "50" -DurationSeconds 60 -AuthToken "eyJhbGciOi..."
```

Outputs en `perf/reports/wrk-<scenario>-<50rps|200rps|1000rps>-<timestamp>.txt`.

## Reportes y gráficos

Script: `perf/report.py` agrega k6/wrk a `perf/reports/summary.csv` y genera `p95_by_scenario.png` (si `matplotlib` está disponible).

```powershell
python perf/report.py
```

CSV: columnas `tool,scenario,rps,duration,p50,p90,p95,p99,error_rate`.

## Visualización en Grafana (Prometheus)

Para visualizar métricas de k6 en Grafana usando Prometheus:

- Prometheus (compose) está configurado con `--web.enable-remote-write-receiver` para aceptar Remote Write.
- Ejecuta k6 con salida `experimental-prometheus-rw` y apunta al endpoint de Prometheus.

Ejemplo:

```powershell
# API traffic con tokens pre-generados y salida a Prometheus
$token = "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9..."
pwsh perf/run_k6.ps1 -BaseUrl https://localhost:8443 -Scenario baseline -K6Script auth_scenarios.js -K6Scenario api_traffic -JwtOverride $token -RpsList "50" -Duration 2m -OutPrometheus -PrometheusWriteUrl http://localhost:9090/api/v1/write
```

Consultas PromQL útiles en Grafana (Datasource Prometheus):

- RPS aproximado: `rate(k6_http_reqs[1m])`
- Error rate: `rate(k6_http_req_failed[1m])`
- Latencia P95 (si exportado como gauge): `quantile_over_time(0.95, k6_http_req_duration[5m])`
- Latencia P95 con histogramas (si disponibles): `histogram_quantile(0.95, sum(rate(k6_http_req_duration_bucket[1m])) by (le))`

Tip: filtra por etiqueta `testid` y `service` (`{service="search-service"}`) para comparar por servicio.

## Visualización en Grafana (InfluxDB v1)

Para historizar ejecuciones y segmentarlas por `testid/service/scenario`, envía métricas de k6 a InfluxDB v1 (InfluxQL). Grafana está provisionado con el datasource `InfluxDB`.

1) InfluxDB (compose):
- Servicio `influxdb:1.8`, database `k6`, usuario `tasknotes`, password `changeme`.
- Puerto expuesto `http://localhost:8086` y volumen persistente `influxdb-data`.

2) Ejecutar k6 enviando a InfluxDB (v1):
```powershell
pwsh perf/run_k6.ps1 -OutInflux -InfluxUrl http://localhost:8086 -InfluxV1Database k6 -K6Script service_scenario.js -Scenario load -TestId prueba-001 -RpsList "50" -Duration 2m
```

3) Consultar en Grafana (Datasource InfluxDB – InfluxQL):
- Datasource `InfluxDB` apunta a `http://influxdb:8086`, database `k6`, user `tasknotes`.
- Usa paneles: `TaskNotes/grafana/dashboards/k6-2587.json` y `k6-2587-service-detail.json`.

Ejemplos de queries InfluxQL (en panel o explorador):
- RPS: `SELECT SUM("value")/60 FROM "http_reqs" WHERE $timeFilter GROUP BY time(1m)`
- Latencia media: `SELECT MEAN("value") FROM "http_req_duration" WHERE $timeFilter GROUP BY time(1m)`
- Filtrado: agrega `AND "testid"='prueba-001' AND "service"='search-service'`

4) Retención:
- Usa la base `k6` con autenticación. Gestiona retención desde la configuración de InfluxDB v1.

Notas:
- El runner añade etiquetas globales `testid` y `scenario`; los scripts añaden `service`.
- Para comparar servicios en los dashboards, usa la etiqueta `service`.

## KPIs del Plan

- `POST /search`: P95 < 300 ms con cache; error rate < 1% bajo 200 RPS.
- Escalado horizontal (LB): mejora de P95 frente a baseline a igual RPS.

## Autenticación (HS256 dev/e2e)

- Enfoques soportados:
  - Generación automática HS256: usa `JWT_SECRET`, `JWT_ISSUER`, `JWT_AUDIENCE`, `USER_ID`, `JWT_TTL_SECONDS`. Se crea en `setup()` y se reutiliza.
  - Token fijo vía `JWT_OVERRIDE`: genera con `generate_tokens.ps1` o login y pásalo por env var.
  - Login solo para validar autenticación: en `auth_scenarios.js` el flujo `login` mide `/auth/login`; el tráfico de API usa un JWT único sin login por request.

- Preflight antes de carga (para todos los servicios con `service_scenario.js`): el `setup()` ejecuta una request controlada al endpoint bajo prueba y loguea `login_status` y `preflight status` para detectar problemas de acceso antes de iniciar VUs.
  - Ejemplo de log: `login_status=0 preflight POST /search/ status=200`.

- Variables clave en Docker:
  - `USE_LOGIN_TOKEN_FOR_API=true|false`: intenta `register+login` en `setup()` y usa el `access_token` si disponible; si falla, cae a HS256.
  - `AUTH_BASE_URL`: base para `register/login` (por defecto `http://api-gateway:8083`).
  - `TEST_EMAIL`, `TEST_PASSWORD`: credenciales del usuario de prueba.
  - `JWT_OVERRIDE`: token real emitido por `/auth/login` para eliminar discrepancias.

- Gateway en entorno de pruebas:
  - HS256 con tolerancia: `SKIP_JWT_SIGNATURE_VERIFY=true` (dev/e2e) permite omitir verificación de firma y valida `exp/iat` para evitar 401 por firma cuando se usan tokens de prueba.
  - Configuración: `TaskNotes/docker-compose.e2e.dist.yml:672`. Lógica: `TaskNotes/api-gateway/main.py:209–230`.

## Docker Compose (todo en Docker)

Overrides disponibles:
- `TaskNotes/docker-compose.k6.search.override.yml`: `search-service` (POST `/search/`) con salida a Prometheus e InfluxDB; espera salud del Gateway.
- `TaskNotes/docker-compose.k6.tasks.override.yml`: `tasks-service` (GET `/tasks`) con salida a Prometheus e InfluxDB; espera salud del Gateway.
- `TaskNotes/docker-compose.k6.tags.override.yml`: `tags-service` (GET `/tags`) con salida a Prometheus e InfluxDB; espera salud del Gateway.
- `TaskNotes/docker-compose.k6.categories.override.yml`: `categories-service` (GET `/categories`) con salida a Prometheus e InfluxDB; espera salud del Gateway.
- `TaskNotes/docker-compose.k6.userprofile.override.yml`: `user-profile-service` (GET `/user-profile/`) con salida a Prometheus e InfluxDB; espera salud del Gateway.
- `TaskNotes/docker-compose.k6.notes.override.yml`: `notes-service` (GET `/notes`) con salida a Prometheus e InfluxDB; espera salud del Gateway.
- `TaskNotes/docker-compose.k6.auth.override.yml`: `auth-service` (`login_perf` + `api_traffic`) con salida a Prometheus e InfluxDB; espera salud del Gateway.

Ejemplos:
```powershell
# Levantar k6 para auth
docker compose -f TaskNotes/docker-compose.e2e.dist.yml -f TaskNotes/docker-compose.k6.auth.override.yml up -d k6-auth

# Ver logs de ejecución
docker logs tasknotes-k6-auth-1 --tail 200

# Parar
docker compose -f TaskNotes/docker-compose.e2e.dist.yml -f TaskNotes/docker-compose.k6.auth.override.yml down
```

Consejos:
- Usa `--remove-orphans` si cambias servicios entre overrides.
- Verifica salud del `api-gateway` antes de correr: `depends_on` con `service_healthy` está configurado en todos los `k6-*`.
- Todos los `k6-*` exportan métricas a Prometheus e InfluxDB v1.

Plantillas por servicio (carga):

```powershell
# search-service (POST /search/)
$env:SCENARIO = "load"; $env:USE_LOGIN_TOKEN_FOR_API = "false"; docker compose -f TaskNotes/docker-compose.e2e.dist.yml -f TaskNotes/docker-compose.k6.search.override.yml up -d k6-search

# tasks-service (GET /tasks)
$env:SCENARIO = "load"; $env:USE_LOGIN_TOKEN_FOR_API = "false"; docker compose -f TaskNotes/docker-compose.e2e.dist.yml -f TaskNotes/docker-compose.k6.tasks.override.yml up -d k6-tasks

# tags-service (GET /tags)
$env:SCENARIO = "load"; $env:USE_LOGIN_TOKEN_FOR_API = "false"; docker compose -f TaskNotes/docker-compose.e2e.dist.yml -f TaskNotes/docker-compose.k6.tags.override.yml up -d k6-tags

# categories-service (GET /categories)
$env:SCENARIO = "load"; $env:USE_LOGIN_TOKEN_FOR_API = "false"; docker compose -f TaskNotes/docker-compose.e2e.dist.yml -f TaskNotes/docker-compose.k6.categories.override.yml up -d k6-categories

# user-profile-service (GET /user-profile/)
$env:SCENARIO = "load"; $env:USE_LOGIN_TOKEN_FOR_API = "false"; docker compose -f TaskNotes/docker-compose.e2e.dist.yml -f TaskNotes/docker-compose.k6.userprofile.override.yml up -d k6-userprofile

# notes-service (GET /notes)
$env:SCENARIO = "load"; $env:USE_LOGIN_TOKEN_FOR_API = "false"; docker compose -f TaskNotes/docker-compose.e2e.dist.yml -f TaskNotes/docker-compose.k6.notes.override.yml up -d k6-notes
```

Auth end‑to‑end:

```powershell
# auth-service (login + api) con token de login y fallback HS256
$env:MODE = "load"; $env:DURATION = "2m"; $env:USE_LOGIN_TOKEN_FOR_API = "true"; docker compose -f TaskNotes/docker-compose.e2e.dist.yml -f TaskNotes/docker-compose.k6.auth.override.yml up -d k6-auth
```

## Notas operativas y troubleshooting

- Baseline auténtico (sin LB/Cache): usa consultas aleatorias para evitar cacheado en `/search`.
- Cache: `auth_scenarios.js` puede hacer warm-up cuando `SCENARIO=cache`.
- TLS: ajusta `BASE_URL` a `https://localhost:8443` y habilita `K6_INSECURE_SKIP_TLS_VERIFY` cuando pruebes contra certificados dev.
- Si `k6` no está en PATH, ejecuta mediante Docker: `grafana/k6:latest` montando el directorio `perf`.
- Errores de conexión: asegúrate de que `api-gateway` esté `Healthy` y que las rutas (`SEARCH_PATH`, `PATH`) terminen con `/` cuando aplique.
- 401/Signature verification failed:
  - Valida con el preflight: busca `login_status` y `preflight status` en los logs de `k6-*`.
  - Usa `JWT_OVERRIDE` con un token de `/auth/login` si necesitas compatibilidad estricta.
  - En dev/e2e, `SKIP_JWT_SIGNATURE_VERIFY=true` reduce fricción con tokens HS256 de prueba.

### Errores comunes y solución

- Conexión rechazada (`connection refused`):
  - Verifica que `api-gateway` esté `Healthy`. Todos los overrides `k6-*` ya usan `depends_on` con `service_healthy`.
  - Revisa `BASE_URL` en overrides (`https://api-gateway:8443`) y que el servicio esté en `internal-net`.
  - Consulta logs: `docker logs tasknotes-api-gateway-1 --tail 200`.

- 401 en preflight o durante carga:
  - Confirma que el preflight muestra `status=200` antes de iniciar VUs.
  - Activa `USE_LOGIN_TOKEN_FOR_API=true` para obtener `access_token` en `setup()` o proporciona `JWT_OVERRIDE`.
  - Alinea claims (`iss`,`aud`,`sub`) y `JWT_SECRET` con el Gateway.
  - En dev/e2e, habilita `SKIP_JWT_SIGNATURE_VERIFY=true` (ya configurado en el compose e2e).

- TLS/certificados dev:
  - Usa `https://localhost:8443` y `K6_INSECURE_SKIP_TLS_VERIFY=true`.
  - Evita mezclar HTTP y HTTPS en `BaseUrl`/`AUTH_BASE_URL`.

- Rate limiting/Timeouts:
  - Reduce `TARGET_VUS` o `API_RPS` y aumenta gradualmente (`LOAD_STAGE_UP`).
  - Aumenta `JWT_TTL_SECONDS` para pruebas largas y evita expiración.
  - Realiza warm-up de cache cuando el escenario lo soporte.

- Métricas no llegan a Prometheus/InfluxDB:
  - Verifica endpoints: `http://prometheus:9090/api/v1/write`, `http://influxdb:8086`.
  - Revisa credenciales Influx v1 (`tasknotes/changeme`) y database `k6`.
  - Confirma que los servicios estén corriendo y accesibles desde la red interna.

- DNS/resolución de servicios en Docker:
  - Usa nombres de servicio (`api-gateway`, `auth-service`, `prometheus`, `influxdb`).
  - Todos los servicios relevantes comparten `internal-net` en los overrides.

## Generación de tokens (PowerShell)

Usa `perf/generate_tokens.ps1` para obtener `access_token` reales y guardarlos en archivo (útil para `wrk` o para `JWT_OVERRIDE`):

```powershell
# Generar 10 tokens contra HTTPS del Gateway
pwsh TaskNotes/perf/generate_tokens.ps1 -BaseUrl https://localhost:8443 -TokenCount 10 -OutputFile TaskNotes/perf/wrk/tokens.txt

# Usar el primer token como JWT_OVERRIDE
$t = Get-Content TaskNotes/perf/wrk/tokens.txt | Select-Object -First 1
$env:JWT_OVERRIDE = $t
docker compose -f TaskNotes/docker-compose.e2e.dist.yml -f TaskNotes/docker-compose.k6.search.override.yml up -d k6-search
```

## Playbook rápido

- Preparación:
  - Levanta e2e: `docker compose -f TaskNotes/docker-compose.e2e.dist.yml up -d`
  - Verifica `api-gateway` Healthy (los overrides `k6-*` ya lo esperan).

- Ejecutar prueba autenticada por servicio:
  - Con HS256 de prueba: `SCENARIO=load USE_LOGIN_TOKEN_FOR_API=false` y levanta el override del servicio.
  - Con token emitido: genera token con `generate_tokens.ps1` y exporta `JWT_OVERRIDE` antes de levantar el override.

- Diagnóstico rápido de acceso:
  - Logs del contenedor: `docker logs tasknotes-k6-<servicio>-1 --tail 200 | Select-String -Pattern "login_status|preflight"`
  - Espera ver: `preflight ... status=200`.
  - Si hay 401, usa `JWT_OVERRIDE` o `USE_LOGIN_TOKEN_FOR_API=true`.

- Visualización:
  - Abre Grafana y selecciona los dashboards `k6-2587.json` / `k6-2587-service-detail.json`.
  - Filtra por `testid`, `service` y `scenario`.

- Auth end‑to‑end:
  - `MODE=load USE_LOGIN_TOKEN_FOR_API=true docker compose -f TaskNotes/docker-compose.e2e.dist.yml -f TaskNotes/docker-compose.k6.auth.override.yml up -d k6-auth`
  - Lee el `access_token` desde logs si necesitas `JWT_OVERRIDE`.