# TaskNotes — Guía de Despliegue (V2)

Esta guía describe el despliegue y verificación actuales del sistema, alineados con el entorno distribuido `docker-compose.e2e.dist.yml` y la configuración de autenticación acordada (HS256 por defecto, RS256 + JWKS opcional para producción).

## Requisitos Previos

- Docker 20.10+
- Docker Compose v2+
- Recursos recomendados: 8GB RAM, 4 CPU, 20GB de disco
- Sistema: Windows, macOS o Linux

## Entornos Disponibles

- `docker-compose.e2e.dist.yml`: entorno distribuido por servicio (recomendado para e2e).
- `docker-compose.dev.yml`: entorno de desarrollo monolítico (backend + search + DBs).
- `docker-compose.micro.yml`: entorno micro con menos servicios para pruebas rápidas.

Esta guía usa `docker-compose.e2e.dist.yml`.

## Despliegue Rápido (e2e)

- Desde la raíz del repo:
  - `docker compose -f TaskNotes/docker-compose.e2e.dist.yml up -d --build`
- Ver estado:
  - `docker compose -f TaskNotes/docker-compose.e2e.dist.yml ps`
- Logs en vivo (ejemplo gateway):
  - `docker compose -f TaskNotes/docker-compose.e2e.dist.yml logs -f api-gateway`

## Servicios y Puertos

- API Gateway: `http://localhost:8083`
- Search Service (Go): `http://localhost:8008`
- Logs Service (Java): `http://localhost:8010`
- User Profile (.NET): `http://localhost:8007`
- Mongo (notes): `localhost:27017` (expuesto en e2e para inspección)
- Resto de servicios (Auth/Tasks/Tags/Categories): accesibles internamente vía red Docker

## Verificaciones Iniciales

- Salud del Gateway (PowerShell):
  - `Invoke-RestMethod -Uri http://localhost:8083/health`
- Salud del Logs Service:
  - `Invoke-RestMethod -Uri http://localhost:8010/healthz`
- Salud del Search Service:
  - `Invoke-RestMethod -Uri http://localhost:8008/health`

## Autenticación (HS256 por defecto)

- Registrar usuario (vía Gateway):
  - `Invoke-RestMethod -Method Post -Uri http://localhost:8083/auth/register -ContentType 'application/json' -Body (@{ email='testuser@example.com'; password='Passw0rd!' } | ConvertTo-Json)`
- Login para obtener token:
  - `$login = Invoke-RestMethod -Method Post -Uri http://localhost:8083/auth/login -ContentType 'application/json' -Body (@{ email='testuser@example.com'; password='Passw0rd!' } | ConvertTo-Json)`
  - `$token = $login.access_token`
- Acceder perfil:
  - `Invoke-RestMethod -Uri http://localhost:8083/user/profile -Headers @{ Authorization = "Bearer $token" }`

Notas:
- En e2e/dev el Gateway verifica tokens con `HS256` usando `JWT_SECRET_KEY` y no depende de JWKS.

## Inspección de Bases de Datos

- PostgreSQL (ej. Auth Service):
  - Contar usuarios:
    - `docker compose -f TaskNotes/docker-compose.e2e.dist.yml exec postgres-auth psql -U postgres -d tasknotes_auth_service -c "SELECT COUNT(*) FROM users;"`
  - Ver columnas:
    - `docker compose -f TaskNotes/docker-compose.e2e.dist.yml exec postgres-auth psql -U postgres -d tasknotes_auth_service -c "SELECT column_name, data_type, is_nullable FROM information_schema.columns WHERE table_schema='public' AND table_name='users';"`
  - Listar tablas públicas:
    - `docker compose -f TaskNotes/docker-compose.e2e.dist.yml exec postgres-auth psql -U postgres -d tasknotes_auth_service -c "SELECT table_name FROM information_schema.tables WHERE table_schema='public';"`

- MongoDB (Logs — colección `event_logs`):
  - Listar bases:
    - `docker compose -f TaskNotes/docker-compose.e2e.dist.yml exec mongo-logs mongosh --quiet --eval "printjson(db.getMongo().getDBNames())"`
  - Listar colecciones de `tasknotes_logs_service`:
    - `docker compose -f TaskNotes/docker-compose.e2e.dist.yml exec mongo-logs mongosh --quiet --eval "db = db.getSiblingDB('tasknotes_logs_service'); printjson(db.getCollectionNames())"`
  - Contar documentos en `event_logs`:
    - `docker compose -f TaskNotes/docker-compose.e2e.dist.yml exec mongo-logs mongosh --quiet --eval "db = db.getSiblingDB('tasknotes_logs_service'); printjson(db.event_logs.countDocuments())"`
  - Ver 5 últimos:
    - `docker compose -f TaskNotes/docker-compose.e2e.dist.yml exec mongo-logs mongosh --quiet --eval "db = db.getSiblingDB('tasknotes_logs_service'); printjson(db.event_logs.find().sort({createdAt:-1}).limit(5).toArray())"`

## Opción de Producción: RS256 + JWKS

- Generar claves RSA (dentro de `auth-service`):
  - `python generate_keys.py` (genera `private_key.pem` y `public_key.pem`)
- Exportar claves a env (base64):
  - `setx JWT_PRIVATE_KEY (Get-Content -Path auth-service\private_key.pem -Raw | [Convert]::ToBase64String([Text.Encoding]::UTF8.GetBytes($_)))`
  - `setx JWT_PUBLIC_KEY  (Get-Content -Path auth-service\public_key.pem  -Raw | [Convert]::ToBase64String([Text.Encoding]::UTF8.GetBytes($_)))`
  - Ajusta cómo cargas variables según tu orquestación (Compose/secret manager).
- Configurar `auth-service`:
  - `JWT_ALGORITHM=RS256`, `JWT_PRIVATE_KEY`, `JWT_PUBLIC_KEY`.
  - Verificar `/.well-known/jwks.json` publica claves.
- Configurar Gateway:
  - `JWT_ALGORITHM=RS256`, `JWKS_URL=http://auth-service:8002/.well-known/jwks.json`.
- Consideraciones:
  - Cambiar de HS256 a RS256 invalida tokens emitidos previamente.
  - Cachea JWKS con TTL y maneja rotación de claves.

## Troubleshooting

- 401 “No se pudo obtener JWKS”:
  - Causa: Gateway en RS256 y `auth-service` sin claves RSA → JWKS vacío.
  - Solución rápida: usar HS256 (actual e2e) o configurar RSA y JWKS.
- Advertencia Compose “version is obsolete”:
  - Mensaje informativo; puedes remover el atributo `version` del compose para limpiar la advertencia.
- PowerShell y quoting:
  - Usa comillas dobles en SQL y `printjson(...)` en `mongosh` para ver resultados.
- Servicios “unhealthy”:
  - Ver logs del servicio afectado: `docker compose -f TaskNotes/docker-compose.e2e.dist.yml logs -f <service>`.
  - Verifica dependencias (DB, RabbitMQ) y variables de entorno.
- Limpieza de datos:
  - `docker compose -f TaskNotes/docker-compose.e2e.dist.yml down -v` (elimina volúmenes; resetea bases).

## Comandos Útiles

- Reiniciar servicio: `docker compose -f TaskNotes/docker-compose.e2e.dist.yml restart <service>`
- Reconstruir: `docker compose -f TaskNotes/docker-compose.e2e.dist.yml up -d --build`
- Acceso a contenedores:
  - Postgres Auth: `docker compose -f TaskNotes/docker-compose.e2e.dist.yml exec postgres-auth bash`
  - Mongo Logs: `docker compose -f TaskNotes/docker-compose.e2e.dist.yml exec mongo-logs mongosh`

## Próximos Pasos

- Añadir cache de JWKS en Gateway (TTL + fallback).
- Exponer consola de RabbitMQ sólo en dev (si es necesario) y proteger en prod.
- Automatizar migraciones y seeds por servicio.
- Integrar métricas y logs centralizados.