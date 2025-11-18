# Performance Testing Analysis and Results

Este documento cumple el requerimiento del entregable indicado en `REQUERIMIENTOS.md`:
- `Performance testing analysis and results.`

## Alcance y herramientas
- Herramientas: `k6`, `wrk`.
- Monitoreo y visualización: `Prometheus + Grafana`, `InfluxDB v1 + Grafana`.
- Reportes artefacto: export de k6 (`--summary-export`), salida de `wrk` y agregación con `perf/report.py`.

## Metodología de prueba
- Escenarios: `load` (carga constante) y `stress` (rampa ascendente y descendente).
- Cargas objetivo: `50`, `200`, `1000` RPS según capacidad local.
- Duración por corrida: típicamente `2m` por RPS.
- Autenticación: tokens pre-generados para evitar login por request (ver `perf/generate_tokens.ps1`).
- Segmentación: usar `-TestId` para identificar y comparar ejecuciones en Grafana.

## Ambiente
- Gateway: `http://localhost:8083` y `https://localhost:8443`.
- Grafana: `http://localhost:3001/`.
- Prometheus: remoto write habilitado `--web.enable-remote-write-receiver`.
- InfluxDB v1:
  - URL: `http://localhost:8086`
  - Database: `k6` (autenticación habilitada)

## Ejecución reproducible

### k6 → Prometheus
```powershell
pwsh perf/run_k6.ps1 -BaseUrl https://localhost:8443 -Scenario load -RpsList "50,200,1000" -Duration 2m -OutPrometheus -PrometheusWriteUrl http://localhost:9090/api/v1/write -TestId prueba-001
```

### k6 → InfluxDB v1 (historización)
```powershell
pwsh perf/run_k6.ps1 -OutInflux -InfluxUrl http://localhost:8086 -InfluxV1Database k6 -K6Script service_scenario.js -Scenario load -TestId prueba-002 -RpsList "50,200" -Duration 2m
```

### wrk
```powershell
pwsh perf/run_wrk.ps1 -Url https://localhost:8443/search -Scenario load -RpsList "50,200" -DurationSeconds 120 -TokensFile ./perf/wrk/tokens.txt
```

## Artefactos generados
- CSV agregado: `TaskNotes/perf/reports/summary.csv`.
- Gráfico P95 (k6): `TaskNotes/perf/reports/p95_by_scenario.png`.

Para generarlos:
```powershell
python TaskNotes/perf/report.py
```

## Dashboards en Grafana
- Prometheus:
  - `TaskNotes - k6 Performance` (`uid: tasknotes-k6`)
  - `k6 Prometheus (simplified)`
  - Oficial de k6 (importado)
- InfluxDB v2 (Flux):
  - `K6 Test Results`
  - `performance-test-dasboard`

Tips:
- Selecciona rango “última hora” y usa la variable `testid` para comparar ejecuciones.
- Exporta capturas (PNG) de paneles clave: RPS, errores, P95.

Datasource y segmentación:
- `InfluxDB` está configurado como datasource por defecto (Flux) con `uid: InfluxDB`.
- La variable `testid` (Flux: `schema.tagValues(bucket: v.defaultBucket, tag: "testid")`) permite filtrar y comparar ejecuciones etiquetadas desde k6 (parámetro `-TestId`).

## Resultados y análisis
Incluye aquí los hallazgos de las corridas recientes. Plantilla sugerida:

- Load:
  - RPS sostenido: …
  - Latencia p50/p95/p99: …
  - Errores %: …
  - Observaciones: …
- Stress:
  - RPS y latencias durante ramp-up: …
  - Comportamiento durante ramp-down: …
  - Errores % bajo picos: …
  - Observaciones: …

## Conclusiones
- Cumplimiento de NFRs: indicar qué métricas cumplen los objetivos definidos en `docs/NFR_Plan.md`.
- Cuellos de botella: listar componentes y posibles optimizaciones.
- Próximos pasos: tuning de servicios, caché, DB, batching, pooling, etc.

## Evidencias
- CSV: `TaskNotes/perf/reports/summary.csv`.
- Gráfico: `TaskNotes/perf/reports/p95_by_scenario.png`.
- Capturas de Grafana: adjuntar o referenciar desde `TaskNotes/docs/`.