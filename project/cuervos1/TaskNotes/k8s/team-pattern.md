# Escenario 4 (Patrón del equipo): Rate Limiting + Cache Aside

Este escenario combina dos prácticas simples y efectivas para mejorar confiabilidad y resistencia bajo carga variable:

- Rate Limiting en el `api-gateway` para suavizar picos, proteger microservicios y mitigar abuso/DoS.
- Cache Aside en `search-service` para acelerar lecturas y reducir presión sobre `notes-service`.

## Objetivos
- Mantener disponibilidad y latencia estable ante picos de tráfico.
- Reducir errores por saturación (timeouts, 5xx) mediante control de entrada.
- Disminuir consumo de CPU/IO en servicios de lectura, evitando hot paths repetidos.

## Componentes
- `api-gateway`: token bucket por usuario/IP y método HTTP.
- `search-service`: lectura unificada con Redis y invalidación por eventos RabbitMQ.

## Configuración en Kubernetes
Se proveen `ConfigMap` para habilitar y parametrizar el patrón:

1) `configmap-gateway-rate-limit.yaml`:
   - `RATE_LIMIT_WINDOW_SECONDS`: ventana de recarga de tokens.
   - `RATE_LIMIT_GET_PER_WINDOW`, `RATE_LIMIT_POST_PER_WINDOW`, `RATE_LIMIT_PUT_PER_WINDOW`, `RATE_LIMIT_PATCH_PER_WINDOW`, `RATE_LIMIT_DELETE_PER_WINDOW`.

2) `configmap-search-cache.yaml`:
   - `REDIS_URL`: DNS interno hacia Redis (`redis.tasknotes.svc.cluster.local:6379`).
   - `CACHE_TTL_SECONDS`: TTL de caché en segundos.
   - `RABBITMQ_URL`: conexión a RabbitMQ (`amqp://rabbitmq.tasknotes.svc.cluster.local:5672`).

## Cómo aplicarlo
1) Crear `Namespace` `tasknotes` (si aún no existe):
```yaml
apiVersion: v1
kind: Namespace
metadata:
  name: tasknotes
```

2) Aplicar los `ConfigMap`:
```bash
kubectl apply -n tasknotes -f k8s/base/configmap-gateway-rate-limit.yaml
kubectl apply -n tasknotes -f k8s/base/configmap-search-cache.yaml
```

3) Referenciar los `ConfigMap` en los `Deployment` (ejemplos en `k8s/snippets/deployment-env-examples.yaml`).

## Parámetros recomendados (desarrollo)
- Rate Limiting:
  - `RATE_LIMIT_WINDOW_SECONDS=5`
  - `GET=50`, `POST=15`, `PUT=15`, `PATCH=10`, `DELETE=8`
- Cache:
  - `CACHE_TTL_SECONDS=120` para resultados de búsqueda.

## Validación rápida
- Generar carga con k6 al Gateway y observar:
  - Disminución de 5xx/timeouts en microservicios bajo picos.
  - Latencia P95 estable y throughput sostenido.
  - Logs del Gateway con respuestas `429` cuando se exceden límites.
- Para `search-service`:
  - Primeras consultas “miss”, posteriores “hit” (si se expone métricas), y menor presión sobre `notes-service`.

## Consideraciones
- En Minikube, Redis y RabbitMQ pueden ser `Deployment` simples; en producción considerar `StatefulSet`/operadores.
- Ajustar límites por endpoint crítico (login, mutaciones) con valores más estrictos.
- Mantener invalidación de caché por usuario para simplicidad; granularidad fina puede añadirse después.