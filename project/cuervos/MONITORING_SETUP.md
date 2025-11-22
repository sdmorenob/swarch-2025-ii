# Observabilidad y Endurecimiento (Etapa 8)

Este documento describe la instrumentación, dashboards, logging correlacionado y notificaciones de Alertmanager implementados en Etapa 8, junto con los pasos para desplegarlos.

## Métricas por servicio

- Python (`auth`, `tasks`, `notes`, `tags`): cada servicio expone `GET /metrics` usando `prometheus_client`.
- Go (`search-service`): expone `GET /metrics` con `promhttp.Handler()` y ya instrumenta métricas de HTTP (conteos, latencia y estados) vía middleware.
- .NET (`categories-service-dotnet`, `user-profile-service`): exponen `/metrics` con `prometheus-net` (`app.UseHttpMetrics()` y `app.MapMetrics()`).
- Prometheus está configurado para scrapear estos endpoints en `prometheus/prometheus.yml`.

## Dashboards por servicio (Grafana)

- Se añadió `grafana/dashboards/service-detail.json` con las señales doradas por servicio:
  - Tráfico: `requests/s` (rate de métricas de requests por método).
  - Error rate: % de respuestas 5xx sobre el total.
  - Latencia: `P50/P90/P99` usando `histogram_quantile` sobre buckets de duración.
  - Saturación: CPU (`process_cpu_seconds_total`) y memoria (`process_resident_memory_bytes`).
- Importar el dashboard desde Grafana:
  - UI: `Dashboards` → `Import` → seleccionar `grafana/dashboards/service-detail.json` → Datasource `Prometheus`.
  - Si hay provisioning: asegurar que el provider apunta a `grafana/dashboards/*.json`.

## Logging correlacionado (trace-id)

- Gateway debe generar/propagar `X-Request-ID` (acepta también `X-Correlation-ID` o `Trace-Id`).
- Recomendación de middleware FastAPI (pseudocódigo):
  ```python
  @app.middleware("http")
  async def trace_middleware(request, call_next):
      trace_id = request.headers.get("X-Request-ID") or request.headers.get("X-Correlation-ID") or request.headers.get("Trace-Id") or str(uuid4())
      request.state.trace_id = trace_id
      response = await call_next(request)
      response.headers["X-Request-ID"] = trace_id
      return response
  ```
- Propagación en proxy del gateway: añadir encabezado `X-Request-ID` hacia servicios downstream en cada petición.
- Centralización de logs: configurar el colector/stack (ej. Loki/ELK) con filtros por `trace_id` y/o `X-Request-ID`.

## Alertmanager (Slack y Email)

- Se actualizó `TaskNotes/alertmanager/alertmanager.yml` con receptores Slack y Email y ruteo por severidad.
- Variables a configurar de forma segura (secretos/entorno):
  - `SLACK_WEBHOOK_URL`: webhook de Slack.
  - `SMTP_*`: host, usuario y contraseña para email.
- Ejemplo de montaje por Compose:
  - `alertmanager` servicio con `volumes: - ./TaskNotes/alertmanager/alertmanager.yml:/etc/alertmanager/alertmanager.yml:ro`.

## Retención y volumen de Prometheus

- Sin tocar el compose base, se añadió `TaskNotes/docker-compose.monitoring.override.yml`:
  - Establece `--storage.tsdb.retention.time=15d`.
  - Usa volumen persistente `prometheus_data` en `/prometheus`.
- Uso combinado:
  - `docker compose -f docker-compose.e2e.dist.yml -f TaskNotes/docker-compose.monitoring.override.yml up -d`
  - Ajustar `15d` según necesidades de retención.

## Verificación

- Prometheus: `http://localhost:9090` → Targets en `Status > Targets` deben estar `UP`.
- Grafana: importar panel `Service Detail` y verificar métricas por servicio con la variable `service`.
- Alertmanager: forzar un alerta de prueba (regla temporal o umbral bajo) y verificar notificación en Slack/Email.
- Logs: emitir solicitudes a través del gateway y comprobar que `X-Request-ID` aparece en los logs de servicios y en el gateway.

## Notas

- Asegurar etiquetas consistentes (`service`, `method`, `status`) en métricas HTTP para que el panel funcione.
- Mantener secretos fuera del repositorio (env, Docker secrets o gestor de secretos).