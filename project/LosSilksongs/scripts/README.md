# Scripts de MusicShare

Este directorio contiene scripts de utilidad para la gestión y operación del sistema MusicShare.

## 📜 Scripts Disponibles

### 🔧 scale-service.ps1

Script para escalar servicios de MusicShare dinámicamente.

**Uso:**
```powershell
.\scale-service.ps1 -Service <nombre-servicio> -Replicas <número>
```

**Parámetros:**
- `-Service`: Nombre del servicio a escalar
  - Opciones: `userservice`, `music-service`, `social-service`, `notificationservice`, `all`
- `-Replicas`: Número de réplicas deseadas (1-10)

**Ejemplos:**
```powershell
# Escalar UserService a 5 réplicas
.\scale-service.ps1 -Service userservice -Replicas 5

# Escalar todos los servicios a 3 réplicas
.\scale-service.ps1 -Service all -Replicas 3

# Reducir MusicService a 1 réplica
.\scale-service.ps1 -Service music-service -Replicas 1
```

**Características:**
- ✅ Validación de parámetros
- ✅ Muestra estado de réplicas en tiempo real
- ✅ Verifica salud de Traefik
- ✅ Salida con colores para mejor legibilidad
- ✅ Resumen del sistema después del escalado

---

### 🧪 load-test.ps1

Script para probar el balanceo de carga realizando múltiples peticiones HTTP.

**Uso:**
```powershell
.\load-test.ps1 -Service <servicio> -Requests <número> -Delay <ms>
```

**Parámetros:**
- `-Service`: Servicio a probar (por defecto: `userservice`)
  - Opciones: `userservice`, `music-service`, `social-service`
- `-Requests`: Número de peticiones a realizar (por defecto: 20)
- `-Delay`: Milisegundos entre peticiones (por defecto: 500)

**Ejemplos:**
```powershell
# Prueba básica con valores por defecto
.\load-test.ps1

# Prueba intensiva en MusicService
.\load-test.ps1 -Service music-service -Requests 100 -Delay 100

# Prueba rápida en SocialService
.\load-test.ps1 -Service social-service -Requests 50 -Delay 200
```

**Resultados Mostrados:**
- ✅ Estado de cada petición (código HTTP, tiempo de respuesta)
- ✅ Estadísticas agregadas (promedio, mín, máx)
- ✅ Distribución de carga entre réplicas
- ✅ Porcentaje de peticiones por réplica
- ✅ Lista de réplicas activas

**Interpretación de Resultados:**

```
Distribución de Carga:
  • Réplica 1: 10 peticiones (50%)
  • Réplica 2: 10 peticiones (50%)
✅ El balanceo de carga está funcionando correctamente
```

Si todas las peticiones van a la misma réplica, puede deberse a:
- Sticky sessions activas (comportamiento esperado para sesiones)
- Solo una réplica en ejecución
- Problemas con el balanceador

---

### 📄 init-mongo.js

Script de inicialización para MongoDB. Se ejecuta automáticamente al levantar el contenedor de MongoDB.

**Función:**
- Crea la base de datos `musicshare`
- Configura usuario y permisos
- Inicializa colecciones básicas

**No requiere ejecución manual** - Docker Compose lo ejecuta automáticamente.

---

## 🚀 Casos de Uso Comunes

### Prepararse para Alta Demanda

```powershell
# 1. Escalar todos los servicios
.\scale-service.ps1 -Service all -Replicas 5

# 2. Verificar que el balanceo funciona
.\load-test.ps1 -Service userservice -Requests 50
.\load-test.ps1 -Service music-service -Requests 50

# 3. Monitorear en el dashboard
# Abrir http://localhost:8080/dashboard/
```

### Volver a Configuración Normal

```powershell
# Reducir a 2 réplicas (configuración por defecto)
.\scale-service.ps1 -Service all -Replicas 2
```

### Debug de Problemas de Balanceo

```powershell
# 1. Verificar número de réplicas
docker compose ps

# 2. Ejecutar prueba de carga
.\load-test.ps1 -Service userservice -Requests 20 -Delay 1000

# 3. Ver logs de Traefik
docker logs musicshare_traefik -f

# 4. Verificar health checks en el dashboard
# http://localhost:8080/dashboard/
```

### Prueba de Failover

```powershell
# 1. Escalar a 3 réplicas
.\scale-service.ps1 -Service userservice -Replicas 3

# 2. Ejecutar prueba de carga en terminal 1
.\load-test.ps1 -Service userservice -Requests 100 -Delay 500

# 3. Mientras corre, detener una réplica en terminal 2
docker stop <container-id-de-una-replica>

# 4. Observar que las peticiones continúan exitosas
# El balanceador automáticamente deja de enviar tráfico a la réplica caída
```

---

## 📊 Monitoreo y Observabilidad

### Dashboard de Traefik
```
http://localhost:8080/dashboard/
```

Muestra:
- HTTP Routers configurados
- HTTP Services y sus backends (réplicas)
- Estado de health checks
- Middlewares aplicados

### Logs de Servicios

```powershell
# Ver logs de todas las réplicas de un servicio
docker compose logs userservice -f

# Ver logs de una réplica específica
docker logs <container-id> -f

# Ver logs de Traefik
docker logs musicshare_traefik -f
```

### Estado de Réplicas

```powershell
# Ver todas las réplicas en ejecución
docker compose ps

# Filtrar por servicio específico
docker compose ps userservice

# Ver consumo de recursos
docker stats
```

---

## 🔧 Troubleshooting

### El script scale-service.ps1 no se ejecuta

**Problema:** PowerShell bloquea la ejecución de scripts.

**Solución:**
```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

### Las réplicas no se distribuyen correctamente

**Causas posibles:**
1. **Sticky sessions activas**: Es comportamiento esperado
2. **Solo una réplica corriendo**: Verificar con `docker compose ps`
3. **Health checks fallando**: Revisar dashboard de Traefik

**Solución:**
```powershell
# Verificar salud de réplicas
.\load-test.ps1 -Service userservice -Requests 20

# Revisar logs
docker compose logs userservice
```

### El test de carga falla con errores SSL

**Problema:** Certificados auto-firmados no son confiables.

**Solución:** El script ya incluye lógica para ignorar errores SSL. Si persiste:
```powershell
# Verificar que el servicio está corriendo
docker compose ps

# Probar endpoint directamente
curl https://localhost/api/users/health -k
```

---

## 📝 Notas Importantes

1. **Requisitos**: Scripts diseñados para PowerShell 5.1+ en Windows
2. **Permisos**: Ejecutar con permisos de administrador si hay problemas
3. **Docker Compose**: Requiere Docker Compose v2.x
4. **Certificados**: Los scripts ignoran errores SSL para localhost en desarrollo

---

## 🔮 Futuros Scripts

Próximos scripts a implementar:

- `backup-databases.ps1`: Backup automático de PostgreSQL y MongoDB
- `restore-databases.ps1`: Restaurar desde backup
- `deploy-production.ps1`: Deploy a ambiente productivo
- `health-check-all.ps1`: Verificar salud de todos los servicios
- `generate-report.ps1`: Generar reporte de estado del sistema

---

*Para más información sobre el API Gateway y balanceo de carga, consulta [APIGateway.md](../APIGateway.md)*
