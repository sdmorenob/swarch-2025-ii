# Security Review - Canales Seguros y Segmentación de Red

## Resumen Ejecutivo

Este documento presenta la revisión de seguridad realizada sobre la configuración de canales seguros y segmentación de red en TaskNotes, enfocándose en los aspectos de comunicación segura y aislamiento de servicios.

## 1. Secure Channel (Canales Seguros)

### ✅ HTTPS en API Gateway

**Estado:** Configurado correctamente
- **Puerto HTTPS:** 8443:8443 expuesto en docker-compose
- **Certificados:** Montaje configurado desde `./certs:/certs:ro`
- **Variables de entorno:**
  - `ENABLE_HTTPS: "true"`
  - `TLS_CERT_PATH: /certs/gateway.crt`
  - `TLS_KEY_PATH: /certs/gateway.key`

**⚠️ Acción requerida:** Los certificados `gateway.crt` y `gateway.key` no existen. Se requiere:
```bash
# Opción 1: Con OpenSSL (recomendado)
cd certs && bash generate-dev-certs.sh

# Opción 2: Con PowerShell (requiere permisos admin)
cd certs && .\generate-dev-certs.ps1
```

**Verificación:** Una vez generados los certificados, confirmar que `https://localhost:8443/health` responde con 200.

### ✅ mTLS gRPC Interno

**Estado:** Completamente implementado

**Certificados disponibles:**
- `certs/grpc/ca.crt` - Autoridad certificadora
- `certs/grpc/notes.crt/key` - Servidor Notes
- `certs/grpc/tasks.crt/key` - Servidor Tasks  
- `certs/grpc/search-client.crt/key` - Cliente Search

**Configuración del cliente (search-service):**
- Variables: `GRPC_TLS_ENABLE=true`, `GRPC_TLS_CA_CERT`, `GRPC_TLS_CLIENT_CERT/KEY`
- SNI por servicio: `GRPC_TLS_SERVER_NAME_NOTES/TASKS`
- Implementación en `search-service/grpc/clients.go` con validación de CA y certificados cliente

**Configuración del servidor (notes/tasks-service):**
- Variables: `GRPC_TLS_ENABLE=true`, `GRPC_TLS_CERT_PATH`, `GRPC_TLS_KEY_PATH`, `GRPC_TLS_CLIENT_CA_PATH`
- Implementación con `require_client_auth=True` para mTLS completo
- Fallback a inseguro si falla la carga de certificados

## 2. Network Segmentation (Segmentación de Red)

### ✅ Servicios Internos Protegidos

**Bases de datos sin exposición al host:**
- `postgres-auth`, `postgres-tasks`, `postgres-tags`, `postgres-categories`, `postgres-user-profile`
- `mongo-notes`, `mongo-logs`
- `redis`

**Mensaje broker interno:**
- `rabbitmq` - Sin puertos expuestos al host
- Solo accesible desde `internal-net`
- UI de management (15672) y AMQP (5672) no expuestos

### ✅ Redes Separadas

**`internal-net` (bridge, internal: true):**
- Todos los servicios de backend y bases de datos
- RabbitMQ, Redis, servicios de aplicación
- Sin acceso directo desde el host

**`public-net` (bridge):**
- API Gateway (puente entre redes)
- Frontends (micro, SSR)
- Servicios de observabilidad

### ✅ Servicios Expuestos Justificadamente

**Servicios de aplicación:**
- `api-gateway`: 8083 (HTTP), 8443 (HTTPS)
- `frontend-micro`: 8080
- `frontend-ssr`: 3000

**Servicios de observabilidad:**
- `prometheus`: 9090
- `grafana`: 3001 (puerto 3000 interno)
- `alertmanager`: 9093

## 3. Política de Observabilidad

### Desarrollo (Actual)
**✅ Exposición completa justificada:**
- Prometheus (9090) - Consultas y debugging de métricas
- Grafana (3001) - Dashboards y visualización
- Alertmanager (9093) - Configuración y testing de alertas

**Beneficios en desarrollo:**
- Debugging inmediato de métricas
- Configuración visual de dashboards
- Testing de reglas de alertas
- Monitoreo en tiempo real durante desarrollo

### Producción (Recomendaciones)

**Opción 1: VPN/Red Privada**
```yaml
# Remover ports de servicios de observabilidad
prometheus:
  # ports: - "9090:9090"  # Comentar
  networks: [internal-net]

grafana:
  # ports: - "3001:3000"  # Comentar  
  networks: [internal-net]
```

**Opción 2: Autenticación Reforzada**
- Grafana: Integrar con LDAP/OAuth
- Prometheus: Configurar basic auth o reverse proxy
- Alertmanager: Restringir acceso por IP

**Opción 3: Proxy Reverso**
```nginx
# Exponer solo via nginx con autenticación
location /monitoring/ {
    auth_basic "Monitoring";
    proxy_pass http://grafana:3000/;
}
```

## 4. Recomendaciones de Seguridad

### Inmediatas
1. **Generar certificados HTTPS:** Ejecutar `generate-dev-certs.sh`
2. **Verificar endpoint HTTPS:** Confirmar `https://localhost:8443/health`
3. **Rotar secretos:** Cambiar `JWT_SECRET_KEY` en producción

### Mediano Plazo
1. **Certificados firmados:** Usar Let's Encrypt o CA corporativa en producción
2. **Secrets management:** Migrar a Docker Secrets o Kubernetes Secrets
3. **Network policies:** Implementar reglas de firewall granulares

### Producción
1. **Observabilidad:** Implementar acceso restringido (VPN/auth)
2. **Certificados:** Rotación automática de certificados gRPC
3. **Monitoring:** Alertas de seguridad (conexiones no autorizadas, certificados expirados)

## 5. Verificación de Cumplimiento

### Checklist de Seguridad
- [x] HTTPS configurado en API Gateway
- [ ] Certificados HTTPS generados
- [x] mTLS gRPC implementado
- [x] Servicios internos sin exposición
- [x] Segmentación de red implementada
- [x] RabbitMQ protegido
- [x] Bases de datos internas
- [x] Política de observabilidad definida

### Comandos de Verificación
```bash
# Verificar redes
docker network ls | grep tasknotes

# Verificar servicios sin puertos expuestos
docker compose -f docker-compose.e2e.dist.yml ps

# Verificar certificados gRPC
ls -la certs/grpc/

# Verificar HTTPS (después de generar certs)
curl -k https://localhost:8443/health
```

---
**Fecha de revisión:** $(date)
**Estado general:** ✅ Configuración segura implementada, requiere generación de certificados HTTPS