# 🎯 Implementación de Balanceo de Carga - MusicShare

## 📋 Resumen Ejecutivo

Se ha implementado con éxito un sistema de **balanceo de carga automático** en MusicShare utilizando Traefik como API Gateway y Load Balancer. El sistema permite escalar horizontalmente los microservicios backend para mejorar el rendimiento, disponibilidad y resiliencia.

---


### 1. 🔧 Configuración de Docker Compose

**Servicios Escalables:**
- ✅ **NotificationService**: 2 réplicas iniciales

**Cambios Realizados:**
- Políticas de reinicio automático

**Ejemplo de Configuración:**
```yaml
deploy:
  replicas: 2
  resources:
      memory: 512M
    reservations:
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
- Verificación automática cada 10 segundos
```yaml
  - "traefik.http.services.userservice.loadbalancer.sticky.cookie=true"
  - "traefik.http.services.userservice.loadbalancer.sticky.cookie.name=userservice_session"
```
- Mantiene sesiones de usuario en la misma réplica
- Cookie persistente por servicio

#### Algoritmo de Balanceo
- **Round Robin** (por defecto)
- Distribución equitativa entre réplicas saludables

#### Logs y Métricas
- Logs en formato JSON
- Métricas de Prometheus habilitadas
- Dashboard web en puerto 8080

### 3. 🛠️ Scripts de Automatización

#### scale-service.ps1
Script PowerShell para escalar servicios dinámicamente.

- Soporte para escalar servicios individuales o todos
- Verificación de estado post-escalado
- Salida con colores para mejor UX

**Uso:**
```powershell
.\scripts\scale-service.ps1 -Service userservice -Replicas 5
.\scripts\scale-service.ps1 -Service all -Replicas 3
```

#### load-test.ps1
Script para probar el balanceo de carga mediante peticiones HTTP.

- Análisis de distribución de carga

**Uso:**
```powershell
.\scripts\load-test.ps1 -Service userservice -Requests 20 -Delay 500
```

### 4. 📚 Documentación

**Archivos Actualizados:**
- ✅ `APIGateway.md` - Sección completa sobre balanceo de carga
- ✅ `README.md` - Información de uso y comandos rápidos
- ✅ `scripts/README.md` - Documentación detallada de scripts
- ✅ `.env.loadbalancing.example` - Ejemplos de configuración

---

## 🚀 Cómo Usar el Sistema

### Iniciar el Sistema con Réplicas

```powershell
# Construir y levantar todos los servicios
docker compose build
docker compose up -d

# Verificar que las réplicas están corriendo
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
