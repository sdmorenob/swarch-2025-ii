## TaskNotes – Prototipo 1 (Arquitecturas de Software 2025-II)

### Equipo
- Nombre del equipo: Cuervos Team
- Integrantes:  Jorge Andrés Torres Leal, Javier Andrés Carrillo Carrasco, Kevin Julian Gonzalez Guerra, Gabriel Castiblanco Céspedes, Lizeth Mariana Garcia Duarte, Michael Daniels Oviedo Quiroga, Javier Esteban Martinez Giron


### Sistema de Software
- Nombre: TaskNotes
- Logo: <img src="docs/Logo_TaskNotes.png" alt="Logo TaskNotes" width="200" height="200"/>
- Descripción: TaskNotes es un sistema para gestionar tareas y notas con categorías y etiquetas. Incluye búsqueda full‑text sobre notas, vista de panel con previsualizaciones y sincronización en tiempo real por WebSockets.

### Requisitos Funcionales (alcance del prototipo)
- Crear, listar, editar y eliminar tareas (PostgreSQL) con prioridad, fecha de vencimiento, categoría y etiquetas.
- Crear, listar, editar y eliminar notas (MongoDB) con categoría y etiquetas.
- Previsualización de tareas y notas desde el dashboard (no edición directa).
- Búsqueda full‑text de notas por contenido/título con filtros (categoría/etiquetas) vía microservicio de búsqueda.

### Requisitos No Funcionales (cumplimiento)
- Arquitectura distribuida: 3 servicios principales desplegados en contenedores.
- Presentación: Frontend web en React (TypeScript/JavaScript).
- Lógica/Servicios: Backend en FastAPI (Python) y microservicio de búsqueda en Go.
- Datos: PostgreSQL (relacional) y MongoDB (NoSQL).
- Conectores HTTP: REST JSON (FastAPI), GraphQL (Go search-service). WebSockets (Socket.IO) para eventos en tiempo real.
- Lenguajes de programación: TypeScript/JavaScript (frontend), Python (backend), Go (search-service).
- Despliegue container‑oriented: Docker y Docker Compose.   

### Connectors & Components View

![Connectors & Components view](Diagrama%20de%20componentes.drawio.svg)

### Description of Architectural Styles Used

1. **Microservices Architecture (Arquitectura de Microservicios):**
   TaskNotes adopta el estilo arquitectónico de **microservicios** para garantizar independencia, escalabilidad y mantenibilidad de los módulos del sistema. Cada servicio encapsula una responsabilidad de negocio específica y se comunica con otros mediante interfaces bien definidas basadas en HTTP, lo que permite su evolución y despliegue de forma independiente.

   **Motivación:**  
   Este estilo permite dividir el dominio en unidades autónomas (microservicios), facilitando el desarrollo paralelo, la escalabilidad selectiva y el uso de diferentes tecnologías según el tipo de procesamiento o persistencia requerido. También reduce el acoplamiento entre los componentes y mejora la capacidad de resiliencia frente a fallos.

   **Aplicación en TaskNotes:**  
   - **Frontend (TypeScript):** Presentación independiente que interactúa con los servicios backend mediante peticiones HTTP y WebSockets, sin acoplarse a sus implementaciones internas.  
   - **Backend (Python):** Microservicio de lógica de negocio que gestiona usuarios, tareas y notas, delegando la persistencia a PostgreSQL y MongoDB. Expone una API REST conforme a buenas prácticas de versionado y validación de datos.  
   - **Search Service (Go):** Microservicio especializado en búsqueda full-text que opera sobre MongoDB, separado del backend para optimizar rendimiento y escalabilidad horizontal.  
   - **Databases (PostgreSQL y MongoDB):** Cada microservicio mantiene su propio esquema o colección, siguiendo el patrón **Database per Service**, lo que reduce la dependencia entre componentes.  
   - **Comunicación:** Los servicios se integran mediante conectores basados en HTTP/REST/GraphQL y WebSockets definidos explícitamente en el `docker-compose.yml`, garantizando interoperabilidad y despliegue coordinado.

   **Ventajas observadas:**  
   - Escalabilidad independiente de cada microservicio según su carga.  
   - Despliegue container-based que simplifica la orquestación y el mantenimiento.  
   - Posibilidad de adoptar distintos lenguajes (TypeScript, Python, Go) sin afectar la interoperabilidad.  
   - Aislamiento de fallos y mejor control de disponibilidad.

2. **Client-Server Architecture (Arquitectura Cliente-Servidor):**
    El sistema implementa también el estilo **Cliente-Servidor**, donde el cliente (frontend) y los servidores (backend y microservicio de búsqueda) se comunican mediante protocolos estándar (HTTP/HTTPS y WebSockets). Este estilo garantiza la separación de responsabilidades entre la presentación y la lógica de negocio.

    **Motivación:**  
    Este enfoque facilita la portabilidad del cliente, permite escalar el backend de forma centralizada y mantiene la seguridad mediante control de autenticación y autorización en el lado del servidor.

    **Aplicación en TaskNotes:**  
    - **Cliente (TypeScript):** Renderiza la interfaz, gestiona el estado local y realiza validaciones básicas antes de enviar datos.  
    - **Servidores (Python y Go):** Procesan la lógica, aplican validaciones de negocio, consultan las bases de datos y devuelven respuestas JSON.  
    - **Comunicación:** El frontend interactúa con los servidores usando conexiones basadas en **HTTP/REST** para operaciones síncronas (CRUD, login, búsqueda) y **WebSockets** para notificaciones en tiempo real.  
    - **Autenticación:** Uso de JWT para mantener sesiones seguras y validar el acceso a los recursos.  

    **Ventajas observadas:**  
    - Mayor mantenibilidad al desacoplar la capa de presentación de la capa de negocio.  
    - Mejor reutilización de los servicios backend por otros posibles clientes (por ejemplo, una app móvil).  
    - Simplificación de la gestión de estados y eventos en tiempo real mediante WebSockets.

    **Justificación Global:**  
    La combinación de estilos **Microservicios** y **Cliente-Servidor** resulta adecuada para un entorno académico y profesional donde se requiere demostrar distribución, heterogeneidad tecnológica y comunicación entre componentes autónomos. Permite además extender el sistema fácilmente hacia nuevas funcionalidades o clientes, manteniendo la coherencia arquitectónica y la trazabilidad de los datos.

### Description of Architectural Elements and Relations

#### Components (Componentes)

1. **React Frontend (TypeScript)**
   - **Responsabilidad:** Interfaz de usuario, gestión de estado del cliente, validaciones de entrada
   - **Tecnologías:** React 18, TypeScript, Material-UI (MUI), Socket.IO Client, Axios
   - **Funcionalidades:** Dashboard, gestión de tareas/notas, búsqueda en tiempo real, notificaciones

2. **FastAPI Backend (Python)**
   - **Responsabilidad:** Lógica de negocio, autenticación JWT, API REST, WebSocket server
   - **Tecnologías:** FastAPI, SQLAlchemy ORM, Pydantic, Python-SocketIO, Alembic
   - **Funcionalidades:** CRUD operations, JWT auth, real-time events, data aggregation

3. **Go Search Microservice**
   - **Responsabilidad:** Búsqueda full-text optimizada en notas, indexación de contenido
   - **Tecnologías:** Go 1.21, Gin framework, MongoDB Go Driver, CORS middleware
   - **Funcionalidades:** Full-text search, content indexing, query optimization, result pagination

4. **PostgreSQL Database**
   - **Responsabilidad:** Almacenamiento de datos estructurados y relacionales
   - **Tecnologías:** PostgreSQL 15, ACID compliance, relational constraints
   - **Esquemas:** Users, Tasks, Categories, Tags, TaskTags (many-to-many)
   - **Características:** Transacciones ACID, integridad referencial, índices optimizados

5. **MongoDB Database**
   - **Responsabilidad:** Almacenamiento de documentos no estructurados y historial
   - **Tecnologías:** MongoDB 6.0, Document-based storage, Aggregation pipelines
   - **Colecciones:** Notes, Notes_history, full-text indexes
   - **Características:** Flexibilidad de esquema, búsqueda full-text nativa, escalabilidad horizontal

#### Connectors (Conectores)

1. **HTTP/REST API Connections**
   - **Frontend ↔ Backend:**
     - Protocolo: HTTP/HTTPS, formato JSON
     - Endpoints: `/api/v1/*` para todas las operaciones CRUD
     - Autenticación: Bearer tokens en headers Authorization
     - Manejo de errores: Códigos HTTP estándar y mensajes descriptivos

2. **WebSocket Connections**
   - **Frontend ↔ Backend WebSocket Server:**
     - Protocolo: WebSocket sobre HTTP/HTTPS
     - Autenticación: JWT token en handshake
     - Salas: Segmentación por usuario (`user_{id}`)
     - Eventos: Bidireccionales para actualizaciones en tiempo real

3. **GraphQL Connections**
   - **Frontend ↔ Search Service:**
     - Protocolo: HTTP/HTTPS directo al microservicio
     - Endpoint: `POST /search` para búsquedas full-text
     - Autenticación: Bearer token validation
     - Configuración: Variable `REACT_APP_SEARCH_URL`

4. **Database Connections**
   - **Backend ↔ PostgreSQL:**
     - Driver: SQLAlchemy ORM con asyncpg
     - Pool de conexiones: Configurado para alta concurrencia
     - Transacciones: Manejo automático con context managers
   
   - **Backend ↔ MongoDB:**
     - Driver: PyMongo con soporte asíncrono
     - Conexión: URI con autenticación y configuración de replica set
     - Operaciones: CRUD operations y aggregation pipelines
   
   - **Search Service ↔ MongoDB:**
     - Driver: Official Go MongoDB driver
     - Conexión: Directa para operaciones de búsqueda optimizadas
     - Índices: Text indexes para búsqueda full-text eficiente

#### Architectural Patterns and Quality Attributes

**Patterns Implementados:**
- **Database per Service:** Cada servicio tiene su base de datos especializada
- **Event Sourcing:** Historial de cambios en MongoDB para auditoría
- **CQRS (Command Query Responsibility Segregation):** Separación entre operaciones de escritura (Backend) y lectura optimizada (Search Service)

**Quality Attributes:**
- **Scalability:** Microservicios independientes, bases de datos especializadas
- **Maintainability:** Separación de responsabilidades, código tipado
- **Performance:** Búsqueda optimizada, conexiones asíncronas, caching
- **Security:** JWT authentication, CORS configuration, input validation
- **Reliability:** Health checks, error handling, graceful degradation

### Uso del servicio de búsqueda (@search-service)
- Frontend utiliza `REACT_APP_SEARCH_URL` para construir la URL, por defecto `http://localhost:8081`.
- Método principal: `POST /search` con cuerpo `{ query, user_id, limit?, skip?, category?, tags? }`.
- Código relevante en `frontend/src/services/api.ts` (`searchNotes`).

#### Integración completa del microservicio de búsqueda

- Despliegue: el servicio `search-service` se construye y levanta desde `docker-compose.yml` con la variable `MONGODB_URL` apuntando al mismo MongoDB que usa el backend. Tiene healthcheck en `/health`.
- Conectividad: el frontend consume directamente al `search-service` vía HTTP usando la variable `REACT_APP_SEARCH_URL` (si no se define, usa `http://localhost:8081`).
- Autenticación: el frontend envía el header `Authorization: Bearer <access_token>`. En este prototipo, el servicio valida la presencia del header pero no verifica la firma JWT (pendiente para producción).
- CORS: el `search-service` habilita CORS para `*` únicamente para el prototipo.

##### Variables de entorno

- Frontend (opcional en `frontend/.env`):
  - `REACT_APP_SEARCH_URL=http://localhost:8081`
- Docker Compose ya define el servicio:
  - `search-service` expone `8081:8081` y depende de `mongodb`.
- Back-end (informativo):
  - `SEARCH_SERVICE_URL=http://search-service:8081` (para uso futuro si se desea proxificar desde FastAPI).

##### Endpoint y payloads

- `POST /search`
  - Headers: `Content-Type: application/json`, `Authorization: Bearer <token>`
  - Body:
    ```json
    {
      "query": "texto a buscar",
      "user_id": 1,
      "limit": 20,
      "skip": 0,
      "category": "<nombreCategoriaOpcional>",
      "tags": ["tag1", "tag2"]
    }
    ```
  - Respuesta:
    ```json
    {
      "notes": [ { "id": "...", "title": "...", "content": "...", "category": "...", "tags": ["..."], "user_id": 1, "created_at": "...", "updated_at": "..." } ],
      "total": 3,
      "query": "texto a buscar"
    }
    ```

##### Uso desde el frontend

- Método ya implementado en `frontend/src/services/api.ts`:
  ```ts
  async searchNotes(searchRequest: SearchRequest): Promise<SearchResponse> {
    const searchServiceURL = process.env.REACT_APP_SEARCH_URL || 'http://localhost:8081';
    const response = await axios.post(`${searchServiceURL}/search`, searchRequest, {
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('access_token')}` },
    });
    return response.data;
  }
  ```

- Ejemplo de invocación desde la consola del navegador (con sesión iniciada):
  ```js
  apiService.searchNotes({ query: 'reunión', user_id: 1, limit: 10, skip: 0 })
    .then(r => console.log(r))
    .catch(console.error);
  ```

##### Probar manualmente con curl

```bash
TOKEN="$(jq -r .access_token <<< "$(curl -s -X POST http://localhost:8000/api/v1/auth/login -H 'Content-Type: application/json' -d '{"email":"user@example.com","password":"password"}')")"
curl -X POST http://localhost:8081/search \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"query":"nota","user_id":1,"limit":10,"skip":0}'
```

##### Troubleshooting

- 404/ECONNREFUSED en `http://localhost:8081/health`:
  - Verifica que el contenedor `tasknotes_search` esté `Up` (`docker-compose ps`).
- CORS en desarrollo:
  - El servicio permite `*` en este prototipo; si cambias el dominio, asegúrate de ajustar CORS si lo restringes.
- Resultados vacíos:
  - Asegúrate de tener índice de texto en `notes` y que las notas tengan `user_id` correcto. El pipeline filtra por `user_id`.


### Instrucciones de despliegue local 

Para más detalles de despliegue diríjase a [Guía Rápida](DEPLOYMENT_FIXED.md)

Estas instrucciones asumen que tienes Docker y Docker Compose instalados.

Requisitos: Docker 24+, Docker Compose, puertos disponibles 3000, 8000, 8081, 5432, 27017.

1) Clonar el repositorio y ubicarse en `TaskNotes/`.
2) Variables de entorno (opcional):
   - Backend (`docker-compose.yml` ya define valores por defecto):
     - `POSTGRES_URL=postgresql://user:password@postgres:5432/tasknotes`
     - `MONGODB_URL=mongodb://admin:password@mongodb:27017/tasknotes?authSource=admin`
     - `CORS_ORIGINS=["http://localhost:3000"]`
     - `SEARCH_SERVICE_URL=http://search-service:8081`
   - Frontend: crear `frontend/.env` si deseas sobreescribir el valor por defecto
     - `REACT_APP_API_URL=http://localhost:8000`
     - `REACT_APP_SEARCH_URL=http://localhost:8081`
3) Construir y levantar servicios:
```
docker-compose up --build
```
4) Acceder a:
   - Frontend: `http://localhost:3000`
   - Backend (docs): `http://localhost:8000/docs`
   - Search health: `http://localhost:8081/health`

### Estructura de carpetas (resumen)
- `backend/`: FastAPI, routers (`tasks.py`, `notes.py`, `categories.py`, `tags.py`), modelos SQLAlchemy y esquemas Pydantic.
- `frontend/`: React + MUI, páginas (`DashboardPage`, `TasksPage`, `NotesPage`), componentes (`TaskList`, `TaskItem`, `NoteItem`), `services/api.ts`.
- `search-service/`: Go (Gin), `main.go` con rutas `/health`, `/search`.
- `docker-compose.yml`: orquesta Postgres, MongoDB, backend, frontend, search‑service, Redis (opcional).

### Flujo principal
1) Autenticación (JWT) → almacenamiento de `access_token`/`refresh_token` en `localStorage`.
2) CRUD de tareas/notas desde React contra FastAPI.
3) WebSockets:
   - Backend emite `task_created`, `task_updated`, `note_created`, etc. por sala `user_{id}`.
   - Frontend escucha y sincroniza listas en tiempo real.
4) Búsqueda: React envía `searchNotes` → `search-service` (Go) → MongoDB → resultados paginados.

### Consideraciones de datos
- Tareas (PostgreSQL): guardan `category_id` y relaciones N‑a‑N con `tags`. Las respuestas del backend devuelven `category` y `tags` expandidos con `{ id, name, color }` para facilitar la UI.
- Notas (MongoDB): `category_id` y `tag_ids` como strings; endpoints expanden y retornan objetos de categoría/etiquetas con color.

### Desarrollo local (sin Docker)
- Backend:
  - `cd backend`
  - Crear venv e instalar `requirements.txt`
  - Ejecutar: `uvicorn app.main:socket_app --reload`
- Frontend:
  - `cd frontend`
  - `npm install && npm start`
- Search‑Service:
  - `cd search-service`
  - `go run main.go`

### Pruebas rápidas
- Crear categoría/etiqueta desde UI, luego crear tarea/nota y verificar chips con color.
- Dashboard: clic en tarea/nota muestra previsualización (no edición).
- Buscar: usa el cuadro de búsqueda (si está expuesto) o invoca desde consola del navegador `apiService.searchNotes({ query: 'texto', user_id: 1 })` ajustando el `user_id`.

### Limitaciones conocidas del prototipo
- Validaciones mínimas de JWT en `search-service` (acepta cabecera sin verificar); para producción integrar verificación.
- Esquemas simplificados; migraciones de DB fuera de alcance del prototipo.

### Licencia
MIT