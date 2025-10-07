# RetoFit - App

## Equipo

### Nombre del equipo: 
**Retofit**

### Miembros:
- **Cristhian Alarcón**
- **Andres Caro**
- **Anderson Mateus**
- **Anderson David Morales Chila**
- **Daniel Ochoa**
### Logo
![alt text](image-1.png)
## Sistema de software
El sistema es una aplicación para ayudar y hacer un seguimiento a los ejercicios físicos de un usuario. Además, se intenta incentivar un mayor ejercicio físico con retos, logros, la creación de comunidades y mensajes motivacionales.

## Requisitos funcionales y no funcionales

### Requisitos funcionales
---
- **RF-1:** Registrar nuevos usuarios mediante correo electrónico, redes sociales o autenticación federada (OAuth2, Google, Facebook).
- **RF-2:** Permitir login seguro y recuperación de contraseña.
- **RF-3:** Gestionar perfiles (edad, peso, altura, nivel de condición física).
- **RF-4:** Guardar historial de entrenamientos y métricas de progreso.
- **RF-5:** Crear y unirse a retos individuales o grupales.
- **RF-6:** Mostrar rankings globales, por grupos y entre amigos.
- **RF-7** Actualizar en tiempo real la clasificación según las actividades registradas.
- **RF-8:** Notificar avances, recordatorios y mensajes motivacionales.
- **RF-9:** Asignar puntos y medallas por logros alcanzados.
- **RF-10:** Permitir compartir logros en redes sociales.
- **RF-11:** Registrar actividades físicas manualmente.
- **RF-12:** Seguir a otros usuarios y ver su progreso.
- **RF-13:** Crear grupos privados o públicos de retos.
- **RF-14:** Permitir interacción básica (likes, comentarios en logros).
- **RF-15:** Gestión de contenidos (retos oficiales, banners de campañas).
- **RF-16:** Monitoreo de estadísticas de uso (usuarios activos, actividades registradas).
- **RF-17:** Gestión de reportes o usuarios que incumplen normas.

### Requisitos no funcionales
---
- **RNF-1:** Integrar autenticación con Google/Facebook (OAuth2).
- **RNF-2:** Integrar autenticación con JWT (o OAuth2 si ya está definido).
- **RNF-3:** Cifrar contraseñas con bcrypt/argon2.
- **RNF-4:** Configurar expiración y refresh tokens.
- **RNF-5:** Generar token seguro de recuperación (con expiración).
- **RNF-6:**  Asegurar que las rutas /login y /password/* solo funcionen sobre HTTPS.
- **RNF-7:** Validar rangos y tipos de datos (ej. edad positiva, peso y altura en valores realistas).
- **RNF-8:** Añadir seguridad: solo el usuario dueño puede editar/consultar su perfil.
- **RNF-9:** Validar consistencia de datos antes de guardarlos (ej. duración > 0, fecha válida).
- **RNF-10:** Validar que un usuario no se pueda unir dos veces al mismo reto.
- **RNF-11:** Optimizar consultas a base de datos para soportar cálculo de rankings en tiempo real.
- **RNF-12:** Implementar caché o actualización periódica de rankings para mejorar rendimiento.
- **RNF-13:** Definir reglas para asignación de puntos (ej. 10 puntos por cada actividad registrada, 50 por completar un reto).
- **RNF-14:** Definir reglas para asignación de medallas (ej. medalla por primer reto completado, medalla por 100 km acumulados).
- **RNF-15:** Validar que un usuario no pueda seguirse a sí mismo.
- **RNF-16:** Implementar validación de entrada para evitar spam (ej: límite de caracteres en comentarios).
- **RNF-17:** Implementar paginación en la consulta de comentarios.
- **RNF-18:** Implementar validaciones de fechas para la activación de retos y banners.
- **RNF-19:** Implementar agregaciones en la base de datos para optimizar consultas de métricas.
- **RNF-20:** Implementar caché de resultados de métricas para mejorar rendimiento.

## Estructura arquitectónica
### Estructura de componentes y conectores
---
#### Vista C&C
---
![Vista arquitectónica del proyecto](image.png)
#### Descripción de los estilos arquitectónicos usados
---


1. **Microservicios**

   * Cada dominio (auth, actividades, retos, logros, estadísticas, puntos) es un servicio independiente con su propia base de datos.
   * Ventajas: despliegues independientes, escalado por servicio, separación de responsabilidades.
   * Costes: complejidad operativa, necesidad de métricas/observabilidad.

2. **API Gateway / Edge Service (Backend for Frontend pattern)**

   * Unifica la entrada desde el cliente, maneja autenticación JWT, enrutamiento y políticas (caching, throttling).
   * Permite versionado y adaptaciones específicas para la app web.

3. **Event-Driven / Message-Oriented (Kafka)**

   * Usado para compartir eventos entre servicios y para procesos asíncronos (ej. calcular estadísticas tras subir actividad).
   * Permite consistencia eventual y desacoplamiento.

4. **Ports & Adapters (Hexagonal) / Adaptadores**

   * Internamente cada servicio sigue separación entre API, lógica de negocio y adaptadores (DB, mensajería).
   * Reflejado en carpetas `api/`, `services/`, `models/`, `adapters/`.

5. **Layered (Frontend)**

   * Frontend en capas: UI → componentes → hooks → servicios API.

6. **Database per service (patrón de persistencia)**

   * Cada microservicio posee su propia persistencia (evita coupling fuerte por esquema compartido).

7. **Integration via ESB (ligera)**

   * `bus/` actúa como mediador o conjunto de adaptadores (no es obligatorio si usas solo Kafka + gateway, pero en tu árbol existe).


#### Descripción de los elementos arquitectónicos y relaciones
---

#### Componentes 

* **Cliente / Navegador** (`Cliente`)

  * Interfaz del usuario (React).
  * Carpeta: `frontend/`
* **Frontend (Aplicación Web React)** (`Aplicacion Web`)

  * SPA, llamadas al API, autenticación, WebSockets/Push opcional.
  * Carpeta: `frontend/src/`
* **API Gateway / Edge** (`API Gateway`)

  * Punto de entrada unificado, ruteo, rate-limit, autenticación inicial, TLS.
  * Puede ser un componente separado (NGINX, Kong, o implementado en Node/Express).
  * Mapea a configuraciones en `config/` y/o `bus/` (si el gateway está ahí).
* **Enterprise Service Bus (ESB) / Integration Layer** (`bus/`)

  * Adaptadores a servicios, transformación, orquestación ligera, mediación entre protocolos.
  * Carpeta: `bus/` (`routes/`, `adapters/`)
* **Microservicios** (cada uno con su responsabilidad y DB propia):

  * `auth-service` (Login/Registro/JWT). Carpeta: `services/auth-service/`
  * `actividades` (subir/registrar actividad diaria). → `services/*`
  * `retos` (gestión de retos). → `services/*`
  * `logros` (definición y asignación de logros). → `services/*`
  * `estadisticas` (procesamiento de métricas/agregados). → `services/*`
  * `puntos` (cálculo y ledger de puntajes). → `services/*`
  * En tu árbol algunos servicios están escritos en FastAPI (Python), otros en Go.
* **Broker/Event Bus (Kafka)** (`Servicio Kafka`)

  * Publicación/subscripción de eventos (ej. `actividad_creada`, `reto_completado`, `puntos_actualizados`).
* **Bases de datos**

  * SQL por servicio (usuarios_db, actividades_db, retos_db, logros_db) y NoSQL para series/agregados/puntajes (`estadisticas_db`, `puntajes_db`).
* **Infra / Orquestación**

  * `docker-compose.yml`, `Dockerfile` por servicio, monitorización/observabilidad (no en árbol, pero recomendado).
* **Common / Shared** (`common/`)

  * Schemas, OpenAPI, protobufs, utilidades compartidas.

#### Conectores (tipos y propósito)

* **HTTP(S) REST (síncrono request-response)**

  * Cliente ↔ Frontend (HTTP), Frontend ↔ API Gateway, API Gateway ↔ microservicios (interno).
  * Formato: JSON (OpenAPI).
* **gRPC (opcional, síncrono)**

  * Entre microservicios con alta performance o tipado fuerte. Usar `proto/` en `common/` si lo añades.
* **Message Queue / Pub-Sub (asíncrono)**

  * Microservicios ↔ Kafka (publicar eventos, consumir para procesos posteriores).
  * Uso típico: eventual consistency, desacoplamiento, procesamiento de largas tareas.
* **DB Connectors** (SQL drivers, ORM)

  * Servicio ↔ su base de datos (conexión directa; patróndatabase-per-service).
* **Adapters / ESB connectors** (Node.js)

  * `bus/adapters/` implementa conexiones a sistemas externos (pago, notificaciones push, analytics).
* **WebSocket / Server-Sent Events (opcional)**

  * Para notificaciones en tiempo real (reto completado, puntos actualizados).
* **Interna: Docker network**

  * Conectividad entre contenedores en desarrollo (`docker-compose`).

---



#### Descripción detallada de elementos arquitectónicos y relaciones

A continuación describo cada elemento con responsabilidades, interfaz típica y relaciones:

#### Cliente / Navegador

* **Responsabilidad:** Interfaz de usuario, presentacion, llamadas al servidor, manejo de sesiones (JWT en localStorage o cookie secure).
* **Interfaces:** HTTP(S) hacia API Gateway; WebSocket opcional para notificaciones.
* **Relaciones:** Se comunica sólo con el `API Gateway`/`Aplicacion Web`.

#### Aplicación Web (React)

* **Responsabilidad:** Composición de páginas, autorización, llamadas a endpoints (`/login`, `/retos`, `/actividades`, `/puntos`), manejo UI/UX.
* **Conectores:** Axios/fetch (HTTP), WebSocket client, useContext/Redux para estado.
* **Relaciones:** Llama `API Gateway` (o directamente a microservicios en entornos de desarrollo).

#### API Gateway

* **Responsabilidad:** Autenticación inicial, validación de tokens, ruteo, aggregación de llamadas si aplica, limitación de tasa.
* **Interfaz:** Exponer endpoints REST al frontend; forward requests a microservicios o al ESB.
* **Relaciones:** Consume/llama microservicios vía HTTP/gRPC; publica eventos a Kafka si necesita.

#### ESB (`bus/`)

* **Responsabilidad:** Orquestar integraciones, transformar payloads, exponer adaptadores para servicios externos (p.ej. notificaciones, pagos).
* **Interfaz:** Rutas REST internas, middlewares, adapters a servicios.
* **Relaciones:** Fuente/coordinador entre gateway y microservicios, y entre microservicios y sistemas externos.

### Microservicios (p. ej. `auth-service`, `actividades`, `retos`, etc.)

Para cada servicio:

* **Responsabilidad:** Lógica de dominio concreta (auth maneja tokens; actividades registra actividades; retos gestiona retos; puntos calcula y almacena puntajes; estadísticas genera agregados).
* **Interfaces:** REST API (OpenAPI); producción y consumo de eventos en Kafka.
* **Persistencia:** DB propia (SQL o NoSQL).
* **Relaciones:**

  * `actividades` publica `actividad_creada` → `estadisticas` y `puntos` consumen.
  * `retos` publica `reto_finalizado` → `logros` y `puntos` reaccionan.
  * `auth` es consultado por gateway para validar JWT (o el gateway valida sin llamar al auth si usa JWT firmado).

### Kafka / Message Broker

* **Responsabilidad:** Transporte asíncrono de eventos, tolerancia a fallos, buffer para consumidores lentos.
* **Topicos típicos:** `actividad_creada`, `reto_completado`, `puntos_actualizados`, `logro_obtenido`.
* **Relaciones:** Productores: `actividades`, `retos`, `puntos`. Consumidores: `estadisticas`, `logros`, `puntos` (para agregados).

### Bases de datos

* **SQL (ej. PostgreSQL):** usuarios_db, actividades_db, retos_db, logros_db.
* **NoSQL (ej. Mongo):** estadisticas_db (tiempos/series/agregados), puntajes_db (fast lookup, leaderboard).
* **Relaciones:** Cada microservicio solo toca su DB; si necesita leer datos de otro servicio, consulta vía API o consume eventos.

### CI / Infra (Docker)

* Cada servicio empaquetado en contenedor (`Dockerfile`). `docker-compose.yml` para orquestación local. En producción usar Kubernetes u otro orchestrator.

---

## Prototipo
### Intrucciones para despiegue local
---
Sigue estos pasos para ejecutar el prototipo en tu máquina local.

**Prerrequisitos:**

  * Node.js (v20 o superior) - *Requerido por Vite 7.1.7*
  * npm o yarn
  * Python (v3.11 o superior)
  * pip

**1. Configurar el Backend (FastAPI)**

```bash
# 1. Navega a la carpeta del backend
cd Autenticacion/backend

# 2. (Recomendado) Crea y activa un entorno virtual
python -m venv venv
source venv/bin/activate  # En Windows: venv\Scripts\activate

# 3. Instala las dependencias de Python
pip install -r requirements.txt

# 4. Configura las variables de entorno
#    Crea un archivo .env a partir del .env.example y añade la URL de tu base de datos PostgreSQL.
#    En Windows: copy .env.example .env
#    En Linux/Mac: cp .env.example .env
#    Edita el archivo .env con tus credenciales de AWS RDS.

# 5. Ejecuta el servidor del backend
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

El backend estará disponible en `http://localhost:8000`.

**2. Configurar el Frontend (React)**

```bash
# 1. Abre una nueva terminal y navega a la carpeta del frontend
cd frontend

# 2. Instala las dependencias de Node.js
npm install

# 3. Ejecuta la aplicación de desarrollo
npm run dev
```

El frontend estará disponible en `http://localhost:5173` (puerto por defecto de Vite) y se conectará automáticamente al backend.

---

## 🐳 Despliegue con Docker (Recomendado)

**¿Por qué Docker?**
- ✅ **Setup automático**: Un solo comando para levantar todo el proyecto
- ✅ **Consistencia**: Mismo ambiente en desarrollo y producción 
- ✅ **Dependencias aisladas**: No necesitas instalar Node.js ni Python localmente
- ✅ **Fácil colaboración**: Cualquier miembro del equipo puede ejecutar el proyecto inmediatamente

### Prerrequisitos

- [Docker Desktop](https://www.docker.com/products/docker-desktop/) instalado y ejecutándose

### Instrucciones de despliegue

```bash
# 1. Clona el repositorio
git clone <url-del-repositorio>
cd RetoFit-App

# 2. Levanta todos los servicios con un solo comando
docker compose up --build -d

# 3. ¡Listo! La aplicación estará disponible en:
# - Frontend: http://localhost:3000
# - Backend API: http://localhost:8000
# - Documentación API: http://localhost:8000/docs
```

### Comandos útiles

```bash
# Ver el estado de los contenedores
docker compose ps

# Ver logs en tiempo real
docker compose logs -f

# Ver logs de un servicio específico
docker compose logs -f backend
docker compose logs -f frontend

# Detener todos los servicios
docker compose down

# Reconstruir después de cambios en el código
docker compose up --build -d

# Limpiar completamente (contenedores, imágenes, volúmenes)
docker compose down -v
docker system prune -a
```

### Arquitectura Docker

```
┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │    Backend      │
│   (React)       │    │   (FastAPI)     │
│   Port: 3000    │────│   Port: 8000    │
└─────────────────┘    └─────────────────┘
                              │
                              │
                    ┌─────────────────┐
                    │   AWS RDS       │
                    │  (PostgreSQL)   │
                    │  [Producción]   │
                    └─────────────────┘
```

**Servicios:**
- **Frontend**: React con Vite, hot reload habilitado
- **Backend**: FastAPI con recarga automática
- **Base de datos**: Conecta a AWS RDS PostgreSQL (misma que usa el entorno local)
- **Red**: Todos los servicios en la misma red Docker para comunicación interna

### Configuración de ambiente

El backend usa el archivo `.env` para conectarse a AWS RDS:

```bash
# Autenticacion/backend/.env
DATABASE_URL=postgresql://postgres:Retofit2025@retofit.cd66iick6o60.us-east-2.rds.amazonaws.com:5432/RetoFit

# Configuración de email
MAIL_USERNAME=retofitapp@gmail.com
MAIL_PASSWORD=ubid jqul mzmg nnwh
MAIL_FROM=retofitapp@gmail.com
MAIL_PORT=587
MAIL_SERVER=smtp.gmail.com
MAIL_USE_TLS=true
MAIL_USE_SSL=false

# Configuración de JWT
SECRET_KEY=6eff0d82513eeb2fbf1091546512c260fa28edd85baab216b748ea169ba43354
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30

# URLs
FRONTEND_URL=http://localhost:5173
```

### Troubleshooting

**¿Los contenedores no se conectan?**
```bash
# Verifica que Docker Desktop esté ejecutándose
docker --version

# Reinicia los servicios
docker compose restart
```

**¿Cambios en el código no se reflejan?**
```bash
# Reconstruye las imágenes
docker compose up --build -d
```

**¿Error de permisos en Windows?**
- Asegúrate de que Docker Desktop tenga permisos de administrador
- Verifica que la carpeta del proyecto esté en una unidad accesible por Docker
