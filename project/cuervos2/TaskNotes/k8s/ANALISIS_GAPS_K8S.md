# Análisis de Gaps: Docker Compose vs Kubernetes Manifiestos

**Fecha:** 8 de diciembre de 2025  
**Objetivo:** Identificar diferencias entre implementación Docker Compose y manifiestos K8s

---

## 1. SERVICIOS BACKEND

### ✅ Servicios con Manifiestos Completos

| Servicio | Docker Compose | K8s Deployment | K8s Service | Réplicas DC | Réplicas K8s | Estado |
|----------|----------------|----------------|-------------|-------------|--------------|--------|
| **api-gateway** | ✅ (1 inst) | ✅ | ✅ | 1 | 2 | ✅ OK |
| **auth-service** | ✅ (2 inst) | ✅ | ✅ | 2 | 2 | ✅ OK |
| **tasks-service** | ✅ (2 inst) | ✅ | ✅ | 2 | 2 | ✅ OK |
| **notes-service** | ✅ (2 inst) | ✅ | ✅ | 2 | 2 | ✅ OK |
| **tags-service** | ✅ (2 inst) | ✅ | ✅ | 2 | 2 | ✅ OK |
| **categories-service** | ✅ (2 inst) | ✅ | ✅ | 2 | 2 | ✅ OK |
| **user-profile-service** | ✅ (2 inst) | ✅ | ✅ | 2 | 2 | ✅ OK |
| **search-service** | ✅ (1 inst) | ✅ | ✅ | 1 | 2 | ✅ OK (mejorado) |

### ❌ Servicios Faltantes en K8s

| Servicio | Docker Compose | K8s Deployment | K8s Service | Impacto |
|----------|----------------|----------------|-------------|---------|
| **logs-service-java** | ❓ No encontrado | ❌ | ❌ | 🔴 CRÍTICO - Consumer de logs |

---

## 2. FRONTENDS

| Componente | Docker Compose | K8s Deployment | K8s Service | Estado |
|------------|----------------|----------------|-------------|--------|
| **frontend-micro** | ✅ | ✅ | ✅ | ✅ OK |
| **frontend-ssr** | ✅ | ✅ | ✅ | ✅ OK |

---

## 3. INFRAESTRUCTURA

### Mensajería y Caché

| Componente | Docker Compose | K8s Deployment | K8s Service | Réplicas DC | Réplicas K8s | Estado |
|------------|----------------|----------------|-------------|-------------|--------------|--------|
| **rabbitmq** | ✅ | ✅ | ✅ | 1 | 1 | ✅ OK |
| **redis** | ✅ | ✅ | ✅ | 1 | 1 | ✅ OK |

### ⚠️ Load Balancer

| Componente | Docker Compose | K8s | Nota |
|------------|----------------|-----|------|
| **nginx-lb** | ✅ (presente) | ❌ No necesario | K8s usa Services nativos |

---

## 4. BASES DE DATOS

### PostgreSQL

| DB Instance | Docker Compose | K8s StatefulSet | K8s Service | K8s Secret | Estado |
|-------------|----------------|-----------------|-------------|------------|--------|
| **postgres-auth** | ✅ | ✅ | ✅ | ✅ | ✅ OK |
| **postgres-tasks** | ✅ | ✅ | ✅ | ✅ | ✅ OK |
| **postgres-tags** | ✅ | ✅ | ✅ | ✅ | ✅ OK |
| **postgres-categories** | ✅ | ✅ | ✅ | ✅ | ✅ OK |
| **postgres-user-profile** | ✅ | ✅ | ✅ | ✅ | ✅ OK |

**Configuración PostgreSQL:**
- Docker Compose: Usuario `postgres`, Password `postgres`
- K8s: Configurado con Secrets
- Volúmenes: PersistentVolumeClaims en K8s
- Init Script: `uuid-ossp.sql` necesita ser configurado en K8s

### MongoDB

| DB Instance | Docker Compose | K8s StatefulSet | K8s Service | Tipo Service | Réplicas DC | Réplicas K8s | Estado |
|-------------|----------------|-----------------|-------------|--------------|-------------|--------------|--------|
| **mongo-notes** | ✅ | ✅ (mongodb) | ✅ | ClusterIP | 1 | 1 | ⚠️ DEBE SER 3 |
| **mongo-logs** | ✅ | ❌ | ❌ | - | 1 | 0 | 🔴 FALTANTE |

**🔴 PROBLEMA CRÍTICO:** MongoDB debe tener 3 réplicas para cumplir **Cluster Pattern (Prototype 4)**

---

## 5. OBSERVABILIDAD

| Componente | Docker Compose | K8s Deployment | K8s Service | Estado |
|------------|----------------|----------------|-------------|--------|
| **prometheus** | ✅ | ❌ | ❌ | 🟡 PENDIENTE |
| **grafana** | ✅ | ❌ | ❌ | 🟡 PENDIENTE |
| **alertmanager** | ✅ | ❌ | ❌ | 🟡 PENDIENTE |

---

## 6. VARIABLES DE ENTORNO CRÍTICAS

### ✅ Configuradas Correctamente en K8s

**Gateway Upstreams (ConfigMap):**
- AUTH_SERVICE_URL
- TASKS_SERVICE_URL
- NOTES_SERVICE_URL
- TAGS_SERVICE_URL
- CATEGORIES_SERVICE_URL
- USER_PROFILE_SERVICE_URL
- SEARCH_SERVICE_URL

**Rate Limiting (ConfigMap):**
- RATE_LIMIT_WINDOW_SECONDS
- RATE_LIMIT_GET_PER_WINDOW
- RATE_LIMIT_POST_PER_WINDOW
- RATE_LIMIT_PUT_PER_WINDOW
- RATE_LIMIT_PATCH_PER_WINDOW
- RATE_LIMIT_DELETE_PER_WINDOW

**Search Service Cache (ConfigMap):**
- REDIS_URL
- CACHE_TTL_SECONDS
- RABBITMQ_URL

### ❌ Variables Faltantes o Requieren Validación

**TLS/mTLS en gRPC (Docker Compose tiene):**
```yaml
# Docker Compose (tasks-service, notes-service)
GRPC_TLS_ENABLE: "true"
GRPC_TLS_CERT_PATH: /grpc-certs/tasks.crt
GRPC_TLS_KEY_PATH: /grpc-certs/tasks.key
GRPC_TLS_CLIENT_CA_PATH: /grpc-certs/ca.crt
```
🔴 **FALTA:** Secret con certificados gRPC en K8s y montaje en Deployments

**HTTPS en Gateway (Docker Compose tiene):**
```yaml
ENABLE_HTTPS: "true"
TLS_CERT_PATH: /certs/gateway.crt
TLS_KEY_PATH: /certs/gateway.key
```
🔴 **FALTA:** Secret con certificados TLS del gateway

---

## 7. HEALTHCHECKS vs PROBES

### Docker Compose Healthchecks

**Patrón común en servicios Python:**
```yaml
healthcheck:
  test: ["CMD-SHELL", "python -c \"import urllib.request,ssl,sys; ctx=ssl._create_unverified_context();  sys.exit(0) if urllib.request.urlopen('http://localhost:8002/healthz').status==200 else sys.exit(1)\" "]
  interval: 30s
  timeout: 10s
  retries: 5
```

**PostgreSQL:**
```yaml
healthcheck:
  test: ["CMD-SHELL", "pg_isready -U postgres -d tasknotes_auth_service"]
  interval: 30s
  timeout: 10s
  retries: 5
```

**MongoDB:**
```yaml
healthcheck:
  test: ["CMD", "mongosh", "--eval", "db.adminCommand('ping')"]
  interval: 30s
  timeout: 10s
  retries: 5
```

### K8s Probes Actuales

**Necesitan revisión:** Los manifiestos K8s actuales tienen probes básicos que deben validarse contra healthchecks de Docker Compose.

---

## 8. VOLÚMENES Y PERSISTENCIA

### Docker Compose

```yaml
volumes:
  pgdata_auth:
  pgdata_tasks:
  pgdata_tags:
  pgdata_categories:
  pgdata_user_profile:
  mongodata_notes:
  mongodata_logs:
```

### K8s

**✅ Configurado:**
- StatefulSets tienen `volumeClaimTemplates`
- StorageClass debe definirse para AWS EBS (gp3)

**❌ Pendiente:**
- Tamaño de volúmenes debe ajustarse (actualmente muy pequeño)
- MongoDB logs no tiene StatefulSet

---

## 9. NETWORKING

### Docker Compose

```yaml
networks:
  internal-net:
    driver: bridge
    internal: true  # ❗ Red interna sin acceso externo
  public-net:
    driver: bridge
```

**Servicios en internal-net:**
- Todos los servicios backend
- Todas las bases de datos
- RabbitMQ, Redis

**Servicios en public-net:**
- api-gateway (bridge entre redes)
- frontends
- observabilidad

### K8s

**✅ Configurado:**
- Services tipo ClusterIP para servicios internos
- NodePort para Gateway y Frontends (desarrollo)
- Ingress para exposición externa (AWS ALB)

**❌ Falta:**
- **NetworkPolicies** para replicar segmentación de Docker Compose
- Políticas de deny-all por defecto
- Allow lists específicas

---

## 10. SECRETS Y CREDENCIALES

### ✅ Secrets Creados en K8s

- `mongodb-root-secret`
- `postgres-auth-secret`
- `postgres-tasks-secret`
- `postgres-tags-secret`
- `postgres-categories-secret`
- `postgres-userprofile-secret`
- `rabbitmq-secret`

### ❌ Secrets Faltantes

- `tls-gateway-secret` (certificados HTTPS gateway)
- `grpc-certs-secret` (certificados mTLS gRPC)
- JWT secret para auth-service (actualmente hardcoded?)

---

## 11. AUTOSCALING (HPA)

### ✅ HPAs Configurados

- `hpa-api-gateway.yaml` (2-6 réplicas, CPU 60%)
- `hpa-search-service.yaml` (2-5 réplicas, CPU 65%)

### ❌ HPAs Faltantes (según plan)

- `hpa-notes-service.yaml` (2-5 réplicas, CPU 70%)
- `hpa-tasks-service.yaml` (2-4 réplicas, CPU 70%)

### ⚠️ Resources no definidos

Los Deployments actuales **NO tienen** `resources.requests` ni `resources.limits`, necesarios para que HPA funcione.

---

## 12. INGRESS

### ✅ Ingress Definidos

- `ingress-api-gateway.yaml`
- `ingress-frontends.yaml`

### ⚠️ Validación Pendiente

- Anotaciones específicas de AWS ALB
- Configuración de TLS con ACM
- Health checks del ALB

---

## RESUMEN DE GAPS CRÍTICOS

### 🔴 CRÍTICO (Bloquea cumplimiento de NFRs)

1. **logs-service-java NO EXISTE en K8s** - Consumer de RabbitMQ faltante
2. **MongoDB tiene 1 réplica, necesita 3** - No cumple Cluster Pattern (Prototype 4)
3. **mongo-logs DB faltante** - logs-service necesita su propia DB
4. **Certificados TLS/mTLS faltantes** - No cumple Secure Channel (Prototype 3)
5. **Resources (requests/limits) no definidos** - HPA no funcionará
6. **NetworkPolicies faltantes** - No cumple Network Segmentation (Prototype 3)

### 🟡 IMPORTANTE (Afecta funcionalidad)

7. **Observabilidad (Prometheus/Grafana/Alertmanager) no migrada** - Monitoreo limitado
8. **Init scripts de PostgreSQL no montados** - uuid-ossp extension faltante
9. **HPAs para notes-service y tasks-service faltantes** - Autoscaling incompleto
10. **JWT secrets no externalizados** - Seguridad mejorable

### 🟢 MENOR (Mejoras opcionales)

11. **Tamaños de volúmenes muy pequeños** - Aumentar para producción
12. **Probes podrían ser más robustos** - Ajustar timeouts/retries

---

## PRIORIDADES DE IMPLEMENTACIÓN

### Fase Inmediata (Antes de AWS)

1. ✅ **Crear logs-service-java manifiestos** (Deployment + Service)
2. ✅ **Crear mongo-logs StatefulSet** + Service
3. ✅ **Aumentar MongoDB réplicas de 1 a 3** + configurar ReplicaSet
4. ✅ **Crear Secrets para TLS** (gateway + gRPC)
5. ✅ **Añadir resources a todos los Deployments**
6. ✅ **Crear HPAs faltantes** (notes, tasks)

### Fase Pre-Despliegue AWS

7. ✅ **Crear NetworkPolicies** (microservices, databases, gateway)
8. ✅ **Migrar Prometheus/Grafana/Alertmanager**
9. ✅ **Validar Ingress para AWS ALB**
10. ✅ **Configurar StorageClass gp3 para EBS**

### Fase Post-Despliegue

11. ✅ **Ajustar tamaños de volúmenes**
12. ✅ **Optimizar probes basado en observación**
13. ✅ **Externalizar JWT secrets a AWS Secrets Manager**

---

## SIGUIENTE ACCIÓN

**Crear manifiestos faltantes para logs-service y mongo-logs, luego actualizar MongoDB a 3 réplicas.**
