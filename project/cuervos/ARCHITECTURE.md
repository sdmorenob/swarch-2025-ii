# TaskNotes — Arquitectura (V2)

Este documento resume la arquitectura actual del sistema, enfocándose en el despliegue distribuido (`docker-compose.e2e.dist.yml`), servicios activos, almacenamiento de datos, autenticación, y comunicación entre componentes. Está inspirado en `ARCHITECTURE.md` y actualizado con el estado y decisiones recientes (p. ej., ajuste de HS256 en el API Gateway).

## Resumen Ejecutivo

- Arquitectura de microservicios con API Gateway central (FastAPI) y servicios especializados (Python, .NET, Go, Java).
- Autenticación JWT actualmente con `HS256` en entornos e2e/dev para simplicidad; opción `RS256 + JWKS` recomendada para producción distribuida.
- “Database per service”: múltiples instancias de PostgreSQL y MongoDB separadas por servicio.
- Comunicación vía HTTP/REST, WebSockets (Socket.IO), gRPC (búsqueda), y mensajería con RabbitMQ.

## Servicios

- API Gateway (`api-gateway`, Python FastAPI)
  - Responsabilidad: punto de entrada único (puerto `8083`), enrutamiento a microservicios, verificación JWT, agregación simple.
  - Configuración: URLs internas hacia `auth-service`, `tasks-service`, `notes-service`, `tags-service`, `categories-service`, `user-profile-service`, `search-service`.
  - Autenticación: verificación de tokens con `HS256` usando `JWT_SECRET_KEY` en e2e. Soporta `RS256` mediante `JWKS_URL` si el `auth-service` publica JWKS.
  - Tiempo real: servidor Socket.IO (sio_server.py) para eventos del sistema.

- Auth Service (`auth-service`, Python FastAPI)
  - Responsabilidad: registro/login, emisión de JWT.
  - Base de datos: PostgreSQL `tasknotes_auth_service` (`postgres-auth`).
  - JWKS: endpoint `/.well-known/jwks.json` disponible; publica claves cuando se configuran `JWT_PRIVATE_KEY`/`JWT_PUBLIC_KEY` y `JWT_ALGORITHM=RS256`.
  - Estado actual e2e: emisión/verificación en `HS256`.

- Tasks Service (`tasks-service`, Python FastAPI)
  - Responsabilidad: gestión de tareas.
  - Base de datos: PostgreSQL `tasknotes_tasks_service` (`postgres-tasks`).

- Tags Service (`tags-service`, Python FastAPI)
  - Responsabilidad: gestión de etiquetas.
  - Base de datos: PostgreSQL `tasknotes_tags_service` (`postgres-tags`).

- Categories Service (.NET) (`categories-service-dotnet`)
  - Responsabilidad: gestión de categorías.
  - Base de datos: PostgreSQL `tasknotes_categories_dotnet` (`postgres-categories`).

- User Profile Service (.NET) (`user-profile-service`)
  - Responsabilidad: perfiles de usuario, datos complementarios.
  - Base de datos: PostgreSQL `tasknotes_user_profile_service` (`postgres-user-profile`).

- Notes Service (`notes-service`, Python FastAPI)
  - Responsabilidad: notas en MongoDB, historial, búsqueda básica; emite eventos de tiempo real.
  - Base de datos: MongoDB `tasknotes` (contenedor `mongo-notes`, puerto `27017` expuesto en e2e).

- Search Service (`search-service`, Go)
  - Responsabilidad: búsqueda full-text e integración con notas/tareas.
  - Comunicación: gRPC hacia `notes-service`/`tasks-service` (`NOTES_GRPC_ADDR`, `TASKS_GRPC_ADDR`); expone HTTP (puerto `8008`).

- Logs Service (`logs-service-java`, Spring Boot)
  - Responsabilidad: consumo de eventos de RabbitMQ y persistencia en Mongo.
  - Mensajería: `exchange=tasknotes.events`, bindings por defecto `task.*`, `note.*`, `category.*`, `tag.*`, `user.updated`.
  - Base de datos: MongoDB `tasknotes_logs_service` (contenedor `mongo-logs`).
  - Colección: `event_logs` (modelo `@Document(collection = "event_logs")`).
  - Endpoints: `GET /logs`, `GET /logs/{id}`, `GET /healthz` (puerto `8010`).

## Bases de Datos

- PostgreSQL (por servicio, instancias separadas)
  - `tasknotes_auth_service` (Auth) — contenedor `postgres-auth`.
  - `tasknotes_tasks_service` (Tasks) — contenedor `postgres-tasks`.
  - `tasknotes_tags_service` (Tags) — contenedor `postgres-tags`.
  - `tasknotes_categories_dotnet` (Categories .NET) — contenedor `postgres-categories`.
  - `tasknotes_user_profile_service` (User Profile .NET) — contenedor `postgres-user-profile`.
  - Healthchecks por instancia; extensiones (p. ej. `uuid-ossp`) según necesidad.

- MongoDB
  - `mongo-notes`: base `tasknotes` (puerto `27017` expuesto en e2e para inspección). Colecciones: `notes`, `note_history` (según backend).
  - `mongo-logs`: base `tasknotes_logs_service`. Colección: `event_logs` (índices según creación por Spring Data).

## Autenticación y Autorización

- Estado actual (e2e/dev): `HS256` en API Gateway y `auth-service`.
  - Verificación: Gateway valida tokens con `JWT_SECRET_KEY` compartido; no depende de JWKS.
  - Motivo: simplifica configuración y evita errores cuando el JWKS está vacío.

- Opción producción: `RS256` + JWKS
  - Configuración: en `auth-service` setear `JWT_PRIVATE_KEY`/`JWT_PUBLIC_KEY` (base64) y `JWT_ALGORITHM=RS256`. El endpoint `/.well-known/jwks.json` publicará claves.
  - Gateway: configurar `JWT_ALGORITHM=RS256` y `JWKS_URL=http://auth-service:8002/.well-known/jwks.json`.
  - Ventajas: separación de claves (privada en issuer, pública distribuida), mejor rotación, múltiples verificadores sin compartir secretos.
  - Consideraciones: invalidar tokens al cambiar algoritmo/clave; cachear JWKS con TTL y manejar actualización.

## Comunicación y Conectividad

- HTTP/REST
  - API Gateway en `http://localhost:8083` enruta hacia servicios internos.
  - Microservicios exponen puertos internos; el Gateway usa sus URLs (`*_SERVICE_URL`).

- WebSockets
  - Servidor Socket.IO para eventos en tiempo real (p. ej. cambios en notas/tareas).

- gRPC
  - `search-service` consume `notes-service`/`tasks-service` vía gRPC para indexación/búsqueda.

- Mensajería (RabbitMQ)
  - Exchange `tasknotes.events`; bindings configurables por env (`LOGS_BINDINGS`).
  - `logs-service-java` persiste eventos en Mongo (`event_logs`).

## Despliegue (Compose e2e)

- Orquestación: `docker-compose.e2e.dist.yml` con red `tasknotes-network`, healthchecks y `restart` policies.
- Exposición de puertos:
  - `api-gateway`: `8083`
  - `search-service`: `8008`
  - `logs-service-java`: `8010`
  - `mongo-notes`: `27017` (conveniencia)
  - Instancias de Postgres/Mongo por servicio usualmente no expuestas al host (seguridad).
- Variables de entorno clave:
  - Gateway: `AUTH_SERVICE_URL`, `TASKS_SERVICE_URL`, `NOTES_SERVICE_URL`, `TAGS_SERVICE_URL`, `CATEGORIES_SERVICE_URL`, `USER_PROFILE_SERVICE_URL`, `SEARCH_SERVICE_URL`, `JWT_ALGORITHM`, `JWT_SECRET_KEY`, `JWKS_URL` (si RS256).
  - Logs-service: `MONGODB_URL`, `RABBITMQ_URL/SPRING_RABBITMQ_*`, `EXCHANGE_NAME`, `LOGS_QUEUE`, `LOGS_BINDINGS`.

## Observabilidad y Datos de Auditoría

- Centralización de eventos de dominio en `event_logs` (Mongo). Cada evento incluye `routingKey`, `entity`, `eventType`, `userId`, `payload` y `createdAt`.
- Endpoint `GET /logs` con filtros por `routingKey`, `entity`, `eventType`, `userId`, y búsqueda sobre `payload`.

## Recomendaciones

- Mantener `HS256` en dev/e2e para rapidez; migrar a `RS256 + JWKS` en producción o entornos con múltiples verificadores externos.
- Cachear JWKS en el Gateway y definir TTL razonable; manejar rotación de claves sin downtime.
- Tokens con caducidad corta y `alg` explícito; monitoreo de errores de verificación.
- Asegurar que cada servicio exponga únicamente lo necesario y que las bases de datos no se publiquen al host salvo por necesidades específicas.

## Troubleshooting común

- Error 401 “No se pudo obtener JWKS”: ocurre cuando el Gateway está en `RS256` y el `auth-service` no publica claves (JWKS vacío). Solución rápida: usar `HS256` o configurar claves RSA en el `auth-service`.
- Esquema Mongo de logs: la colección correcta es `event_logs` en la base `tasknotes_logs_service` (`mongo-logs`). Para inspección: `db = db.getSiblingDB('tasknotes_logs_service'); db.event_logs.find().limit(5);`.
- Inspección de Postgres por servicio: usar `docker compose exec <postgres-*> psql -U postgres -d <db> -c "<SQL>"`.