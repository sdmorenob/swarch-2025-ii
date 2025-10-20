# TaskNotes - Arquitectura del Sistema

Este es un documento que se encuentra en desarrollo con la intención de contener una explicación más profunda y concisa del proyecto.

## Descripción General

TaskNotes es una aplicación web para gestión de tareas y notas que implementa una arquitectura de microservicios con las siguientes características:

- **Frontend**: React con TypeScript y Material-UI
- **Backend**: FastAPI (Python) con endpoints REST y WebSockets
- **Microservicio de Búsqueda**: Go con búsqueda full-text
- **Bases de Datos**: PostgreSQL (tareas) y MongoDB (notas)
- **Comunicación**: REST API y WebSockets para tiempo real
- **Despliegue**: Docker y Docker Compose

## Estilos Arquitectónicos Implementados

### 1. Layered Architecture (Arquitectura en Capas)
El sistema implementa una separación clara entre capas de presentación, lógica de negocio y datos:

- **Capa de Presentación:** Frontend React con TypeScript que maneja la interfaz de usuario y experiencia del usuario
- **Capa de Lógica de Negocio:** Backend FastAPI que procesa reglas de negocio, autenticación y orquestación de servicios
- **Capa de Datos:** Bases de datos especializadas (PostgreSQL para datos relacionales, MongoDB para documentos)
- **Beneficios:** Separación de responsabilidades, mantenibilidad, escalabilidad independiente por capas

### 2. Microservices Architecture (Arquitectura de Microservicios)
El sistema está descompuesto en servicios independientes y especializados:

- **Frontend Service:** Aplicación React para la interfaz de usuario
- **Backend API Service:** Servicio principal FastAPI para lógica de negocio
- **Search Microservice:** Servicio especializado en Go para búsqueda full-text
- **Database Services:** PostgreSQL y MongoDB como servicios de datos independientes
- **Características:** Despliegue independiente, tecnologías heterogéneas, escalabilidad granular, tolerancia a fallos

### 3. RESTful Architecture (Arquitectura REST)
Comunicación basada en principios REST para operaciones CRUD:

- **Recursos identificados:** `/api/v1/tasks`, `/api/v1/notes`, `/api/v1/categories`, `/api/v1/tags`
- **Métodos HTTP estándar:** GET, POST, PUT, DELETE para operaciones sobre recursos
- **Representaciones JSON:** Intercambio de datos en formato JSON con esquemas Pydantic
- **Stateless:** Cada petición contiene toda la información necesaria (JWT tokens)

### 4. Event-Driven Architecture (Arquitectura Orientada a Eventos)
Uso de WebSockets para comunicación asíncrona y actualizaciones en tiempo real:

- **Eventos del sistema:** `task_created`, `task_updated`, `task_deleted`, `note_created`, `note_updated`, `note_deleted`
- **Patrón Publisher-Subscriber:** Backend emite eventos, frontend suscrito a salas por usuario
- **Beneficios:** Desacoplamiento temporal, responsividad en tiempo real, sincronización automática

### 5. Client-Server Architecture (Arquitectura Cliente-Servidor)
Separación clara entre cliente (frontend) y servidores (backend, search-service):

- **Cliente:** Maneja presentación, validaciones del lado cliente, gestión de estado local
- **Servidores:** Procesan lógica de negocio, validaciones del lado servidor, persistencia de datos
- **Comunicación:** HTTP/HTTPS para peticiones síncronas, WebSockets para comunicación asíncrona

## Arquitectura C&C (Componentes y Conectores)

### Componentes

#### 1. React Frontend (TypeScript)
- **Responsabilidad:** Interfaz de usuario, gestión de estado del cliente, validaciones de entrada
- **Tecnologías:** React 18, TypeScript, Material-UI (MUI), Socket.IO Client, Axios
- **Patrones:** Component-based architecture, Hooks pattern, Context API para estado global
- **Funcionalidades:** Dashboard, gestión de tareas/notas, búsqueda en tiempo real, notificaciones

#### 2. FastAPI Backend (Python)
- **Responsabilidad:** Lógica de negocio, autenticación JWT, API REST, WebSocket server
- **Tecnologías:** FastAPI, SQLAlchemy ORM, Pydantic, Python-SocketIO, Alembic
- **Patrones:** Repository pattern, Dependency Injection, Schema validation
- **Funcionalidades:** CRUD operations, JWT auth, real-time events, data aggregation

#### 3. Go Search Microservice
- **Responsabilidad:** Búsqueda full-text optimizada en notas, indexación de contenido
- **Tecnologías:** Go 1.21, Gin framework, MongoDB Go Driver, CORS middleware
- **Patrones:** Single responsibility, RESTful API design
- **Funcionalidades:** Full-text search, content indexing, query optimization, result pagination

#### 4. PostgreSQL Database
- **Responsabilidad:** Almacenamiento de datos estructurados y relacionales
- **Tecnologías:** PostgreSQL 15, ACID compliance, relational constraints
- **Esquemas:** Users, Tasks, Categories, Tags, TaskTags (many-to-many)
- **Características:** Transacciones ACID, integridad referencial, índices optimizados

#### 5. MongoDB Database
- **Responsabilidad:** Almacenamiento de documentos no estructurados y historial
- **Tecnologías:** MongoDB 6.0, Document-based storage, Aggregation pipelines
- **Colecciones:** Notes, Notes_history, full-text indexes
- **Características:** Flexibilidad de esquema, búsqueda full-text nativa, escalabilidad horizontal

### Conectores

#### 1. HTTP/REST API Connectors
- **Frontend ↔ Backend:**
  - Protocolo: HTTP/HTTPS, formato JSON
  - Endpoints: `/api/v1/*` para todas las operaciones CRUD
  - Autenticación: Bearer tokens en headers Authorization
  - Manejo de errores: Códigos HTTP estándar y mensajes descriptivos

- **Frontend ↔ Search Service:**
  - Protocolo: HTTP/HTTPS directo al microservicio
  - Endpoint: `POST /search` para búsquedas full-text
  - Autenticación: Bearer token validation
  - Configuración: Variable `REACT_APP_SEARCH_URL`

#### 2. WebSocket Connections
- **Frontend ↔ Backend WebSocket Server:**
  - Protocolo: WebSocket sobre HTTP/HTTPS
  - Autenticación: JWT token en handshake
  - Salas: Segmentación por usuario (`user_{id}`)
  - Eventos: Bidireccionales para actualizaciones en tiempo real

#### 3. Database Connections
- **Backend ↔ PostgreSQL:**
  - Driver: SQLAlchemy ORM con asyncpg
  - Pool de conexiones: Configurado para alta concurrencia
  - Migraciones: Alembic para versionado de esquemas
  - Transacciones: Manejo automático con context managers

- **Backend ↔ MongoDB:**
  - Driver: PyMongo con soporte asíncrono
  - Conexión: URI con autenticación y configuración de replica set
  - Operaciones: CRUD operations y aggregation pipelines

- **Search Service ↔ MongoDB:**
  - Driver: Official Go MongoDB driver
  - Conexión: Directa para operaciones de búsqueda optimizadas
  - Índices: Text indexes para búsqueda full-text eficiente

## Diagrama de Arquitectura

```
┌─────────────────┐    HTTP/WS     ┌─────────────────┐
│                 │◄──────────────►│                 │
│   Frontend      │                │   Backend API   │
│   (React)       │                │   (FastAPI)     │
│                 │                │                 │
└─────────────────┘                └─────────────────┘
                                            │
                                            │ HTTP
                                            ▼
                                   ┌─────────────────┐
                                   │                 │
                                   │ Search Service  │
                                   │     (Go)        │
                                   │                 │
                                   └─────────────────┘
                                            │
                                            │ MongoDB
                                            ▼
┌─────────────────┐                ┌─────────────────┐
│                 │                │                 │
│   PostgreSQL    │◄───────────────┤    MongoDB      │
│   (Tareas)      │   SQLAlchemy   │   (Notas)       │
│                 │                │                 │
└─────────────────┘                └─────────────────┘
```

### Diagrama Mermaid

```mermaid
graph TD
  A[Frontend (React/TS)] -- HTTP REST & WebSocket --> B[Backend API (FastAPI)]
  A -- HTTP REST --> C[Search-Service (Go)]
  B -- SQLAlchemy --> D[(PostgreSQL)]
  B -- Motor/PyMongo --> E[(MongoDB)]
  C -- Go Mongo Driver --> E
  subgraph Bases de Datos
    D
    E
  end
```

## ¿Por qué arquitectura distribuida?

- Separación en múltiples procesos/servicios desplegables de forma independiente:
  - `frontend` (Nginx + app estática)
  - `backend` (FastAPI)
  - `search-service` (Go)
  - `postgres` y `mongodb` como servicios de datos independientes
- Comunicación entre componentes vía red (HTTP/REST, WebSockets) orquestada por `docker-compose`:
  - No es un monolito; cada servicio tiene ciclo de vida, escala y tecnología propia
- Poliglotismo intencional (TypeScript, Python, Go) y “database-per-service” (PostgreSQL para tareas; MongoDB para notas/búsqueda)
- Escalabilidad independiente: el `search-service` puede escalar sin afectar el backend; lo mismo el frontend/CDN
- Aislamiento de fallos: reinicios/restarts por servicio; healthchecks independientes
- Deploy evolutivo: se puede versionar y actualizar cada servicio por separado

Conclusión: cumple las propiedades clave de una arquitectura distribuida (múltiples servicios autónomos, comunicación por red, despliegue independiente y heterogeneidad tecnológica), por lo que la aplicación efectivamente sigue una arquitectura distribuida basada en microservicios ligeros.

## Patrones Arquitectónicos

### 1. Microservicios
- Separación de responsabilidades
- Escalabilidad independiente
- Tecnologías específicas por servicio

### 2. API Gateway Pattern
- El backend FastAPI actúa como gateway
- Enrutamiento a microservicios
- Autenticación centralizada

### 3. Database per Service
- PostgreSQL para datos relacionales (tareas)
- MongoDB para documentos (notas)
- Separación de concerns

### 4. Event-Driven Architecture
- WebSockets para actualizaciones en tiempo real
- Eventos de dominio (task_created, note_updated, etc.)

### 5. Layered Architecture
- Presentación (Frontend)
- Aplicación (Backend API)
- Dominio (Modelos y Lógica)
- Infraestructura (Bases de Datos)

## Decisiones de Diseño

### Tecnológicas

1. **React + TypeScript**: Desarrollo frontend robusto con tipado estático
2. **FastAPI**: Alto rendimiento, documentación automática, async/await
3. **Go para Búsqueda**: Rendimiento optimizado para operaciones de búsqueda
4. **PostgreSQL**: ACID compliance para datos críticos (tareas)
5. **MongoDB**: Flexibilidad para documentos y búsqueda full-text
6. **Socket.IO**: Comunicación bidireccional en tiempo real

### Arquitectónicas

1. **Separación de Bases de Datos**: 
   - PostgreSQL para datos estructurados y relacionales
   - MongoDB para documentos y capacidades de búsqueda

2. **Microservicio de Búsqueda Independiente**:
   - Optimización específica para búsqueda
   - Escalabilidad independiente
   - Tecnología especializada (Go)

3. **Comunicación Híbrida**:
   - REST para operaciones CRUD
   - WebSockets para actualizaciones en tiempo real

## Calidad de Atributos

### Rendimiento
- Microservicio de búsqueda optimizado en Go
- Índices de base de datos apropiados
- Conexiones async en Python
- Paginación en todas las consultas

### Escalabilidad
- Arquitectura de microservicios
- Bases de datos especializadas
- Contenedores Docker
- Load balancing posible con Nginx

### Mantenibilidad
- Separación clara de responsabilidades
- Tipado estático (TypeScript, Python type hints)
- Documentación automática (FastAPI)
- Estructura modular

### Disponibilidad
- Health checks en todos los servicios
- Restart policies en Docker
- Manejo de errores robusto
- Timeouts configurables

### Seguridad
- Autenticación JWT
- Validación de entrada (Pydantic)
- CORS configurado
- Variables de entorno para secretos
- Usuario no-root en contenedores

## Consideraciones de Despliegue

### Desarrollo
```bash
docker-compose up -d
```

### Producción
- Usar secretos externos (no .env)
- Configurar SSL/TLS
- Implementar load balancer
- Monitoreo y logging
- Backups automatizados

### Escalabilidad Horizontal
- Múltiples instancias del backend
- Réplicas del microservicio de búsqueda
- Clustering de bases de datos
- CDN para assets estáticos