## Artifact – Prototipo 2 

### Equipo

- Nombre del equipo: Cuervos Team
- Integrantes: Jorge Andrés Torres Leal, Javier Andrés Carrillo Carrasco, Kevin Julian Gonzalez Guerra, Gabriel Castiblanco Céspedes, Lizeth Mariana Garcia Duarte, Michael Daniels Oviedo Quiroga, Javier Esteban Martinez Giron

### Sistema de Software

- Nombre: TaskNotes
 - Logo: ![TaskNotes Logo](docs/Logo_TaskNotes.png)
- Descripción: TaskNotes es un sistema para gestionar tareas y notas con categorías y etiquetas. Incluye búsqueda full‑text sobre notas, vista de panel con previsualizaciones y sincronización en tiempo real por WebSockets.

### Requisitos Funcionales y No Funcionales

- Requisitos Funcionales:
  - Crear, listar, editar y eliminar tareas (PostgreSQL) con prioridad, fecha de vencimiento, categoría y etiquetas.
  - Crear, listar, editar y eliminar notas (MongoDB) con categoría y etiquetas.
  - Previsualización de tareas y notas desde el dashboard (no edición directa).
  - Búsqueda full‑text de notas por contenido/título con filtros (categoría/etiquetas) vía microservicio de búsqueda.

- Requisitos No Funcionales:
  - Arquitectura distribuida.
  - Al menos dos componentes de presentación (uno: web front-end).
  - El front-end web sigue subarquitectura SSR (Server-Side Rendering).
  - Al menos cuatro componentes de lógica.
  - Al menos un componente para comunicación/orquestación entre componentes lógicos.
  - Al menos cuatro componentes de datos (relacional y NoSQL).
  - Al menos un componente responsable de procesos asíncronos.
  - Al menos dos tipos diferentes de conectores basados en HTTP.
  - Construido con al menos cinco lenguajes de propósito general.
  - Despliegue container-oriented.

### Estructuras Arquitectónicas

#### Component-and-Connector (C&C) Structure

- C&C View: ![C&C View](docs/CC_view.png)
# Descripción de *estilos y patrones* usados

- *Microservicios*: capacidades separadas (Auth, UserProfile, Task, Tags, Category, Notes, Search, Logs), cada una con despliegue y ciclo de vida propios.  
- *API Gateway (Edge/Gateway)*: único punto de entrada para el Frontend; ruteo y contratos REST hacia servicios.  
- *DB-per-service*: cada servicio posee su base de datos y su driver/SDK (PostgreSQL: psycopg2/Npgsql; MongoDB: Motor/Java Driver).  
- *Comunicación síncrona REST*: Frontend→Gateway→Servicios y parte del tráfico S2S.  
- *Comunicación binaria gRPC (S2S): entre *Search Service y Notes Service para baja latencia.  
- *Mensajería asíncrona: RabbitMQ como *Message Broker; patrón Producer → Worker (Logs Service) → persistencia en Logs_DB.  
- *Separación de preocupaciones*: Frontend, Gateway y servicios de dominio claramente delimitados.  
- *Segregación funcional: *Tags y Category como servicios independientes (bounded contexts específicos).

---
# Descripción de elementos y relaciones: 

## Elementos

### Borde del Sistema
- *Cliente / Navegador*  
  Interactúa con la SPA, emite solicitudes HTTP al Gateway.
- *React Frontend*  
  Orquestación ligera por vistas (BFF del cliente). Maneja JWT en memoria segura y cachea resultados de lectura.

- *Next.js SSR Frontend*  
  Landing Page.

### Capa de Entrada
- *API Gateway*
  - *Rol: terminación TLS, validación de **JWT, autorización simple (scopes/roles), **rate-limit, **routing* por path/host.
  - *Interfaces: API pública **REST* versionada (/v1/...).
  - *Políticas*: timeouts, circuit breakers, métricas (P50/P95/P99), logs de acceso.

### Servicios de Dominio
- *Auth Service* ↔ *Auth_DB (PostgreSQL/psycopg2)*  
  Emisión/validación de tokens, login/refresh/logout, listas de revocación.
- *UserProfile Service* ↔ *UserProfile_DB (PostgreSQL/Npgsql)*  
  Datos de perfil extendido (preferencias, idioma, avatar).
- *Task Service* ↔ *Task_DB (PostgreSQL/psycopg2)*  
  To-dos relacionadas con el usuario; filtros por estado/fecha.
- *Tags Service* ↔ *Tags_DB (PostgreSQL/psycopg2)*  
  Catálogo de etiquetas; búsqueda por prefijo.
- *Category Service* ↔ *Categories_DB (PostgreSQL/Npgsql)*  
  Jerarquía padre-hijo de categorías; operaciones CRUD y mover nodo.
- *Notes Service* ↔ *Notes_DB (MongoDB/Motor)*  
  CRUD de notas (documentos flexibles, versiones, metadatos). Produce logs a RabbitMQ. Coopera con Tags/Category vía REST. Interfaz gRPC para hidratar datos a Search.
- *Search Service*  
  REST para /search. Colabora con *Notes* por *gRPC* para hidratar títulos/snippets/permisos. Produce logs a RabbitMQ.  
  > Nota: Idealmente debería consultar un *índice de búsqueda* (Elastic/OpenSearch/Meili) alimentado por eventos de Notes.
- *Logs Service (Worker)* ↔ *Logs_DB (MongoDB/Java Driver)*  
  Consumidor de RabbitMQ; formatea y persiste logs estructurados. No se expone al cliente.

### Mensajería
- *RabbitMQ (Broker)*  
  Exchanges (topic/direct) → colas *durables* con *DLQ* y *TTL*. Productores: Notes, Search (y otros). Consumidor: Logs Service.

### Capa de Datos
- *PostgreSQL*: Auth_DB, UserProfile_DB, Task_DB, Tags_DB, Categories_DB.  
- *MongoDB*: Notes_DB, Logs_DB.  
- *Prohibido* el acceso cruzado entre bases; la integración es por *APIs* o *eventos*.

## Relaciones

### Sincrónicas (REST/gRPC)
- *Frontend → Gateway* (REST): envío de operaciones de usuario con JWT.  
- *Gateway → Servicios* (REST): /auth, /profiles, /tasks, /tags, /categories, /notes, /search.  
- *Search ↔ Notes* (*gRPC*): recuperación eficiente de datos de notas (por lote/IDs), con contrato protobuf versionable.

*Contratos y Semántica*
- REST: idempotencia en GET, PUT, DELETE; POST/PATCH con Idempotency-Key si se admiten reintentos.  
- gRPC: streaming opcional, compresión, y campos opcionales para compatibilidad retroactiva.

### Asíncronas (RabbitMQ)
- *Productores: Notes, Search (publican **logs* no bloqueantes).  
- *Consumidor*: Logs Service (worker escalable horizontalmente).  
- *Garantías: *al menos una vez con ack; *orden por cola* (no global); *reintentos* con backoff; *DLQ* para fallos permanentes.  
- *Trazabilidad*: incluir trace_id/correlation_id en headers de mensaje para correlacionar con trazas.

#### Layered Structure (Estructura por Capas)

- View: 
![Layered View](docs/layered_view.svg)
- Descripción de patrones usados (si aplica): 
  **Layered Architecture Pattern**: El sistema implementa una arquitectura estrictamente en capas con cinco niveles jerárquicos. Cada capa solo puede acceder a la capa inmediatamente inferior (principio de capas estrictas), garantizando separación de responsabilidades y bajo acoplamiento. Se aplican los patrones **Database per Service** para aislamiento de datos, **API Gateway Pattern** para punto único de entrada, y **Event-Driven Architecture** para comunicación asíncrona entre servicios.

- Descripción de elementos y relaciones:
  **Elementos por Capa:**
  
  • **Presentation Layer**: 
    - frontend-ssr: Landing Page SSR (Next.js :3000): Renderizado del servidor para SEO y experiencia inicial
    - frontend-micro: Frontend Micro (React + Nginx :8080): Aplicación web interactiva (SPA)
    - Relación interna: SSR puede redirigir a SPA mediante allow-to-use
  
  • **API Gateway Layer**:
    - api-getaway: API Gateway (FastAPI :8083): Punto único de entrada, validación JWT RS256, enrutamiento, CORS y rate limiting
  
  • **Business Services Layer** (subdividida en tres dominios):
    - *User Services*: user-profile-service (.NET :8007), auth-services (FastAPI :8001)
    - *Core Domain Services*: categories-service-dotnet (.NET :8006), tags-service (FastAPI :8005), notes-service (FastAPI :8004), task-services (FastAPI :8003)
    - *Supporting Services*: logs-service-java (Java Spring :8010), search-service (Go :8008)
  
  • **Integration Layer**:
    - *Comunicación Asíncrona*: rabbitmq (Message Broker para eventos)
  
  • **Data Layer**:
    - *PostgreSQL*: 6 bases especializadas (user-profile-service, auth-services, task-services, tags-service, categories-service-dotnet, logs-service-java)
    - *MongoDB*: 1 base para notes-service con full-text search nativo
  
  **Relaciones Arquitectónicas:**
  
  • **allowed-to-use-below**: Dependencias estrictas entre capas adyacentes (Presentation→Gateway→Services)
  • **allow-to-use**: Dependencias más flexibles (Services ↔ Integration ↔ Data)
  • **Database per Service**: Cada microservicio mantiene acceso exclusivo a su base de datos
  • **Event Publishing**: Servicios publican eventos a RabbitMQ; Logs Service consume todos los eventos
  • **Technology Diversity**: 5+ lenguajes (TypeScript, Python, C#, Go, Java) distribuidos por responsabilidades específicas 

#### Deployment Structure (Estructura de Despliegue)

- Deployment View: 
![Deployment View](docs/DeploymentView.png)

- Descripción de patrones usados (si aplica): 
El principal patrón arquitectónico implementado en TaskNotes es el **API Gateway Pattern**.

🔹 API Gateway Pattern
Este patrón se utiliza para **centralizar las peticiones externas** hacia los múltiples microservicios del sistema.  
En TaskNotes, el servicio `api-gateway` cumple esta función, actuando como punto único de entrada para el frontend y gestionando:

- **Ruteo de solicitudes** hacia microservicios como `auth-service`, `tasks-service`, `notes-service`, `categories-service`, `user-profile-service` y `search-service`.  
- **Unificación de seguridad y autenticación** mediante JWT.  
- **Transformación y agregación de respuestas**, reduciendo la carga sobre los clientes.  

Este enfoque permite:
- Simplificar la comunicación cliente-servidor.  
- Aislar la lógica de negocio en microservicios especializados.  
- Escalar componentes de forma independiente.  
- Mejorar la mantenibilidad del sistema.

Otros patrones complementarios presentes:
- **Microservices Architecture:** cada dominio funcional (tareas, notas, categorías, usuarios, etc.) opera como un servicio independiente con su propia base de datos.  
- **Database per Service Pattern:** garantiza independencia y evita acoplamientos entre servicios.   
- **Log Aggregation Pattern:** el `logs-service` centraliza los registros de eventos desde múltiples servicios para monitoreo y trazabilidad.  

- Descripción de elementos y relaciones: 

 🔹 Infrastructure Layer
- **RabbitMQ (3-management):** actúa como **message broker** para la comunicación asíncrona entre microservicios.  
- **PostgreSQL (15):** se ejecuta en instancias separadas por microservicio (`postgres-auth`, `postgres-tasks`, `postgres-tags`, `postgres-categories`, `postgres-user-profile`), aplicando el patrón *Database per Service*.  
- **MongoDB (6):** se usa para los microservicios `notes-service` y `logs-service`, especializados en almacenamiento documental.

 🔹 Backend Services
Cada microservicio es desplegado en su propio contenedor con las siguientes tecnologías:

| Microservicio          | Lenguaje / Runtime         | Puerto | Base de Datos / Broker          |
|-------------------------|----------------------------|--------|---------------------------------|
| Auth Service            | Python 3.11                | 8002   | PostgreSQL 15                   |
| Tasks Service           | Python 3.12                | 8003   | PostgreSQL 15 / RabbitMQ        |
| Notes Service           | Python 3.12                | 8004   | MongoDB 6 / RabbitMQ            |
| Tags Service            | Python 3.12                | 8005   | PostgreSQL 15 / RabbitMQ        |ga
| Categories Service      | .NET 8.0                   | 8006   | PostgreSQL 15 / RabbitMQ        |
| User Profile Service    | .NET 8.0                   | 8007   | PostgreSQL 15 / RabbitMQ        |
| Search Service          | Go 1.23 (gRPC)             | 8008   | N/A (consume Notes y Tasks)     |
| Logs Service            | Java 17 (Spring Boot)      | 8010   | MongoDB 6 / RabbitMQ            |
| API Gateway             | Python 3.10 (FastAPI)      | 8083   | -                               |

Cada servicio expone endpoints REST (o gRPC en el caso de `search-service`) y cuenta con un **health check** configurado en Docker Compose para garantizar su disponibilidad.

 🔹 Frontend Layer
- **frontend-micro:** aplicación React construida y servida por Nginx en el puerto `8080`.  
- **frontend-ssr:** aplicación Next.js (Node.js 20) que ofrece renderizado del lado del servidor (SSR) en el puerto `3000`.  
Ambas interactúan exclusivamente con el **API Gateway**.

 🔹 Communication Flow
1. El usuario interactúa con `frontend-ssr` o `frontend-micro`.  
2. Las peticiones se canalizan al `api-gateway`.  
3. El gateway redirige las solicitudes al microservicio correspondiente.  
4. Los microservicios intercambian eventos a través de **RabbitMQ** y registran su actividad en `logs-service`.  
5. Las bases de datos (PostgreSQL y MongoDB) persisten la información de manera independiente por dominio.

#### Decomposition Structure (Estructura de Descomposición)


#### - Decomposition View:



![TaskNotes Decomposition View](./docs/DecompositionView.png)

### Descripción de elementos y relaciones

#### Microservices

##### [API Gateway (FastAPI)](https://uml.planttext.com/plantuml/png/RLFRYjim47qFv1-6FEr2iWk5zdb3IBVkXInsTxTGogB84sM8BRdIEAqf_PZzW3xr4_9Z7VcIj2N6sAFHw9oZez5DOEMvBelnY8aB15NHp2Z6Rwg1YzSgyFmkkHoFPDfLm0xMZjcLa9D7pUJiUBIb724mUdJSL3WUXHtPIdbLGgNqJXdCk17ak41PKs14wsTWSfPl0ZzY4S2nh5Hahwfc0Yh01ubZ0SZp-QwseaeKe6MlSYLX0O81jntebxvkuUo6JEsLfiDl2ptJ51QhD9j2uOmXQw21pEaTybMoQXV-_4-6gdaBrx17JvlcYTqERIjf7lE3f8SuIxfd4cbl7p_2nPlinSjNu22D_yj1rchDQFygV9V9FqWOcMO1_PuqdfLIUVUzUVBujSR0hOYxc3cgI17j_l2hzQQl2g2W9ErTXqik33BcngDHi4MLem_mQNOl9RCa5qFwU2adK9mLubtD65e5QHkU9DGioLOen8PeDpK5IUx25AoJsZWoyjLoMiPvYfawyicg3HKuXO3Aw-qWDB7IQ1ehxjr5Avip5DYxZa9xF1bVeHUGIElAmpEJTcTta2tJXsIn5Ej9TrPcdV6dhTodxmFeeOVMXKo9kGhsobCtx5hGUJi8YStuZzldkOT-wtZRKR8wyiwpsqJkP2NSvPfin6pH7t7TrOPemNNeK4uSyjwWpTkB_GS0)
- Encargado del enrutamiento y proxy inverso de todas las solicitudes entrantes. Aplica validaciones JWT y políticas de CORS, y actúa como punto central para la comunicación REST/gRPC hacia los microservicios del dominio.

### User Services
[**user-profile-service (.NET)**](https://uml.planttext.com/plantuml/png/VLFBRjim4BmRy3yiV4g0F7uXXUsW1PB2g1lqKFImfjOoQufBKAiWRj2FwGVqb5kl-h4kRL9nWpI23k9oPdTcI5srWb6wner7OiKHT2t5yn1vRHsTw_UzDGGd5n_ddq_78mLn065OiGWtKDb8HYpxyMXZAu9MA1BBBj1ur6wj3nYnWO1cYpKjPQVz4m5zxIXropimUMFg11uJ5600BoBNslV2j1F05l8omK2VhulEgq9LGruYLgYV3Xfh8XyQM_wMaLFsQrjt4OtjdpnyeTMx49mrc2oTmMob0A47WHqKQZjm8sKQTXf5_qkKbwOwX1Msf1p3hckyAkIWJ8-E1lOj1ieQgy3MImidMhlJCOj32lEoSLeuxmcTRC1io6oL1vURVU77Vl_dYupKo22_1FNiv_4vWBHcc5_3b2EfP0z78X9dIVAVl2eQB9w1OrzRwIhbxA3_xQjqWlqVRmqdiVC6hNjLwOUZUSjyyfV_YCZLOgE0YecR_gdEsNkgMQE6TE-WGK_Vzo47YWStLRhV7SPy1LvA6J8leuR2C6n6QwkUYl_OYSAcd-vcQNKaklJNzqhFUF-3_GK0) 

- Maneja la información de usuario, perfiles y credenciales; utiliza Entity Framework y PostgreSQL.

[**auth-service (FastAPI)**](https://uml.planttext.com/plantuml/png/TL9DIyD05BmN-XyUFRM7YaYHuibFYjPYCO87aVAIlAPhDhlBxYOGnJ_crJ_cspIfLJJaa9sTsNapsLFdqVgoaFsU5ruIOEatOqUs4WdrUung0rv3hBtN1QJ2KkA5LltUHgG4pfCbxMl3N9SBPT1Y0GQJ73EAVCq71W6gJ3QdjJimsBSPm5lO0zZjPgJ8egULTRZAgNR3qG3GmQp5vmm54V3pj0MXLAotm4Cb4YjoS1-TmV3eS3A5M7WtUcxf4Lc1KhpYbWV6YWfJ15Aml5h0S3c_YAR_ipy_OYcIRtfKnY-SS5a6cEUwLckzKrzILPBiJ3WFPu4QJ4Dk5eakDBTeXSfSeth_LKM1GhNf5_ovItqhiK10-AEgpdrMekLWUzu7XeeV_W7ew8kIU1242ZboBBb1xfAKrrPfk7by2FKYf3h9oOvvRgCTTTexa_2bG7d2WLAn3WMrVu5xEaT7nvEjd5GL37PP-JqbbJONy0i0)

- Gestiona autenticación, emisión y validación de tokens JWT.

##### Core Domain Services
[**categories-service-dotnet (.NET)**](https://uml.planttext.com/plantuml/png/TL9TJi9047uduGuJdlG1pe2XlfYW2FfaV9Zk3h2Xx6nsfiR6c7W8B-01l82ltCIJk2iKr63JfDdP-NxJeIX6hTTLjwDEAmA3IWkEZgGl51-SeRvbzQJm-V8A1HbU1nQdZZtCDDP6wqXmugGV4b6VvwU9YGCeGycgl0Rh8fcyt-qidIKGfKYiJQ1kHrRE9nok8Q1PuO9csYGJ6O1-KQMDRcTt0xt_hPqCBizlJdlmbFS1zeZH7Z5Yhv6hYkB0I0zGu32HZ8FqtErc2AFfRG7P6DGUQganEeO6GbrMpY3G0tbb0V8mnR9qEhuUt6UEvpy6pa8eoinAZzeA5wZuIp7TCQHYIXJANukPkm73VkuMTJAnUVSsnONDXtU6ZohjeZQjofWjLOTatqU6TYjpGuWS75cq951ktYGbox9pCakKutcsQIUv1baUkjoEzsAJFpLTpAukVtRLKgTtIDv-_trV)
- Administración de categorías; expone API REST y publica eventos AMQP.

[**tags-service (FastAPI)**](https://uml.planttext.com/plantuml/png/LOz1QW9144Nt3Ns7pwnquHqCY91Tm1DKUegniAUhwAu9I0Za4Bb9Zf2Rv2JEg0Yk_tly_xVDgVeqvXXSF3ESXhPfN3yaCVw_Vx3ZfADf4nSjE7YTaa-LCGjgSCMxkkk8NYgdXOdXA3sZELTMFnl7q4vIZ2gDC4ed6lZWvxbh4QWCUIPYk2VedXQizjJyvUrrtU5peO07b_z-1qa4grAI66Nqd74JHJjG0vajqbSCMoxzzUK5)
- Servicio de etiquetas; mantiene relaciones con tareas y notas.

[**notes-service (FastAPI)**](https://uml.planttext.com/plantuml/png/ZPHTQXmn3CVV5_OEOfzQw7Qla3RRGg21RPP0ePIWjTLP9sDxQcb2XbBe8NgDFlK8kKbFKda-d2OiIuPvi6nPF_qbsoSicAJrzNmcJcg248LuoPHkdI7u-_CNhCb4tqHsucA0hQJMI9i8T4TiG2BieaZqO5qYattcixsp12oKA4hNq7p6DouqcD13W-O6AzfAfx2y0KDLgyTyDgx0ud4ABzuZovlDsSi5VCzk0CNHemklcsu1o72ku-m0-dtUj47pqXmeI4ABEgnX2EWYZ06_PESVJq9Q5DmXqyh7K4MxA-6pkNvR2ASnq9sx_nEWWzXGGWqSY1LONBFUN4xTtVLblTexbfYwus2jj5I9U29lHli06gV5xSSF0uv2SjzQCfJ0e50Lq_tldYzOyK6kZreRdkHU3UOZrUVzLC7tPkHSNSrP1pru57qCCGbxmfZqFGlpeFSWYSsUFFAgh_PeJ9pjO1R0chwwuCQsAMNJMGpYp02wnTfPRMekiwMXZOUHmp7b5Tqr66oXZTC5zsxiZFEEniEPWuBHE_NGgh5JkievfUDgKsprYWrgYyoBOV8_hcsY2y9mUd6vBbfUWST0rtqUdvQNgc9vPYUA_YSKRFyg_0C0)  
- Gestión de notas; soporta REST y gRPC, usa MongoDB para persistencia.

[**task-service (FastAPI)**](https://uml.planttext.com/plantuml/png/ZPFRIWCn48Rl2ts7eLSArhv2nGC85jOkWY0YusPQOtUJ9JCjhk9J-GY-c9Czn0CYBdinaqp-R_uSvYmOP5kLuv5OAGa4USDJfh2p1Or7Eknh40_tNiHNO6oWGgntuz63DGGi5CXBKsijRwohCM05DHORN5CkZIh61UZMPQlMpy3a6mVspf3bA3lVdy1BB0D8XHLQTrWt4q26XSQn0FIxoRPE-z8Uo4b0WngMq0bQ3xtWRIn-_I5fKF0UcMQrPra7ua4_w_F4EFQEdkpxcmCS9lFB2uWkTQS28VyAgBpsmad-hij_KXRjQ6ArgUVeI1lKu0i56jt64jMOez-HN3nGXJoB-thN9mCmxz94Eg6LTROJYxYiCUZ45XrnXwKrYegk3VrbipyzdcbWTTKpnfkHgFrimkP3LQVTW1wRuvKFrRzemM_ridKEaxLbDvWOfyxKtZfXE5vUdNmg7a25ZXxR-t8zlTA6f-TcmEW_9sVQL_01)
- Gestión de tareas; integra con tags y categories, publica eventos en RabbitMQ.

##### Supporting Services
[**logs-service-java (Spring Boot)**](https://uml.planttext.com/plantuml/png/dPF1JYCn38RlbVeELa-xXva7u0HeLreX5Gf5sWFYu4dCu3Q9Gv8M2jgdsaVWnKXcEWExz8GqXyIEVt_vdJcE2KFQM3ET94w6m4WRgqXXougg5MvnEiafyP046ab9B6WEf1ABcqxkMHF4H84axJnD9t7DpcD02nxL6bjQfbrMBGNeMaD5RP-1sQTUy6tf0xiMJaNIzncybEC0Ou55Te3U6rPO06Q04UOb-5BE0TmiDYw3PYXoAQ36iloWULkE_VbFzP4QCBYZqCdzphj1JK9RnwxwBb-97YMiwoRB7FN1ggohpa4ALPQvtTVzVF8IMV7hNzUpQ2_iKeHVrzSBAFvqFX-acOjhvSSfU0gHixLEKN_DVVnBR1eJLhOew15oCJRWpgP2b567HWVXhh1fECql8T-6sl0-X9FvvU9hQ6WV_8YqQSfeU-DseCJ5ZUt7kSq3bJXm7eGxMrwSmpqwRNAJZkeifwAylmubjhx3ybwVhAbNVRPM4kXel-cSQjZf0Mb9WT7mymYbAVuRoaZIhAZG5O81BN_7UV3Th_K6)
- Registro distribuido de logs y monitoreo de eventos, con persistencia en MongoDB y PostgreSQL.

[**search-service (Go + GraphQL)**](https://uml.planttext.com/plantuml/png/RPFDRjim383l0V8EH4ujbjJtxL8iBR93knPnRiCEhCp8GYJHa-HXnh2dwctNlDWe_wqROXW6IP7yI8g-ZGb3QfrTBf99bY0I1bLl8eNlHj5o8NPk836yS4hie3A1L3BibulQLEAVA12dhX7VU3A-mO0E6bGdr5IcJbBc0FJQzjd64rZz2uAh7SCxs1altqVscky-Ng_WPmu1c8CS6d-ZUGKOuL7ax03oV7bklTGezP1F0IiKqSAGs_0Q5FkZqMr0PSwlFljbKWVRfttvDQVuzHzeB2iMPLzcEQWJUbJZZ7yulsgZCXLUph_ZjvQaXDQRenYp5D5N37h_l8LQQa3md2IyWuJn52zMe4EZ2cMDD1GdxYudc9ZR_aooz6dptALD9r258L9kUQ3C8nvfatwHUdTuYZqg2pFgi-GHmneEgClMEGpT6hQOI7FePiCmgZr9zp7zLMF3FbwcrJ8MIs7kxzEep-1xNpLiP0AmloyFxw5OGp4iJj7t9cfDQ5CjpJbiY07xSLoaZMi5Lu6msh2ttVMmIAFzJRTYHUjGaPVhYx9KazE7D_TxRAtT9FgH9fgyj-Ih_c_w0m00)
- Búsqueda de texto e indexación; expone API REST/GraphQL.
 
##### Integration

[**rabbitmq (Message Broker)**](https://uml.planttext.com/plantuml/png/PP7TIiD048Nl0tc78LSAnGVmgZy4gvZM_WY2I9bindHiihlkJef5V2eVmHTpDxGAEkpDp9xpdM5tw0MTT6sJ9iBI43WiIvRs5SuAyXvhWh4pEtBdQH8ane8OA8s8QQ5YHqhOw3JPSaNWXHmPELXA4xzZRT5X2nRLBc1MSeZqO41TDnHfnnl8bdrciVYNcS5x50ByaTvrPSD-I-v2-GpGmyyW6Y3KOpzH2BGdBSR3pMe-0zBGQQ0tjGrB48ITXQs1jR6idex6YT7FN7SE5NzzQcYfOjH2i4V7M3RaeoqodJQNi1oDnzVhOh6vNzuEVhlfVBKUGFumcOvcL_bcDYho4p_NugX6iEGyXoUBx41iINjy8T_BFj8ad27fgl-PRm00)  
- Middleware de mensajería AMQP que orquesta la comunicación asincrónica entre microservicios (task-created, note-updated, category-event, etc.), asegurando desacoplamiento y fiabilidad en la entrega.

#### Data Layer

[**PostgreSQL Databases**](https://uml.planttext.com/plantuml/png/RP6_JWCn3CRta-uTh4xj0ZjJhxHYAIfSoeHGvKlCDUfT4YM-YWZnI4myGb-Cf7zG1w8CiVpx_DdED31w7lgkB5XpH-1iuDOJZEV8s60W4EJtMjAaB19Z7R25nZBR7fJs95bRKnPRhGW2aoVBqL5PX9qs3Ztsu53ki2N1CPNF0ZHjHxdQEGEZfvEfU5x-upk2pmm3_E6gkN4HRY7nLIUtrCSHO81pbP1vIEVrtXhwq8SV0mXN5aD0e-oL-ktC2meXJREq4Zk8CCjTv1bWLJzUc9Puevhnv0uKEJAAZ8mdI9j8KXxjyYuevET5zb8lGLhphjl1OvCMiJzyfwPMOlrGByGcfotCgtKrgyGYXqVXLrcaEqqsnn_w1G00)
- Almacenes relacionales dedicados a cada microservicio:  
auth-service, user-profile-service, task-service, tags-service, categories-service-dotnet, logs-service-java.

[**MongoDB Databases**](https://uml.planttext.com/plantuml/png/RP71QiCm38RlWRo3oAczRFUTIXROPLrXPQSnYk9ecMaY6Lif2sMFrDCU8Iyskqrx6lXYzFsVP7aL5BqEVPTdQhKZw8LRQMfOLAXOOo3OaZzOGyiyYumuK85QLAM7ndeoQeNpxCis1479a-ZeAC_2th93ZpquD7jiQQjZrAS0SjjHiiqLADQfQLN-qxI0Oo81Rkmyu9qRuHxMek8Bm01NnJ710E-FmlHjfr-EnUd4nWiZu0qR0d8Zb_p772bJu_YC1bK26E5FsmuUwpZsOJh5xERbQLELkxVNPnXljwgyvblIdP6kk-namTZJyY4A7N53R4P8-m2fbPXyz4VGH932MV2JP_6i8dl-ZJy0)
- Bases documentales usadas por notes-service y logs-service-java para persistencia no estructurada.


#### - Descripción de relaciones:

| Usa \ Es usado por          | API-GW | AUTH | PROFILES | TASKS | NOTES | TAGS | CATEGORIES | LOGS | SEARCH |
|-----------------------------|:------:|:----:|:---------:|:-----:|:-----:|:----:|:-----------:|:----:|:------:|
| **API-GW (FastAPI)**        | –      | 1    | 1         | 1     | 1     | 1    | 1           | 0    | 1      |
| **AUTH (FastAPI)**          | 0      | –    | 0         | 0     | 0     | 0    | 0           | 0    | 0      |
| **PROFILES (.NET)**         | 0      | 1    | –         | 0     | 0     | 0    | 0           | 0    | 0      |
| **TASKS (FastAPI)**         | 0      | 1    | 0         | –     | 1     | 1    | 1           | 0    | 0      |
| **NOTES (FastAPI)**         | 0      | 0    | 0         | 0     | –     | 1    | 1           | 0    | 0      |
| **TAGS (FastAPI)**          | 0      | 0    | 0         | 1     | 0     | –    | 1           | 0    | 0      |
| **CATEGORIES (.NET)**       | 0      | 0    | 0         | 0     | 0     | 0    | –           | 0    | 0      |
| **LOGS (Spring Boot)**      | 0      | 0    | 0         | 0     | 0     | 0    | 0           | –    | 0      |
| **SEARCH (Go)**             | 0      | 0    | 0         | 0     | 1     | 1    | 1           | 0    | –      |
>  **Leyenda:** “1” = el módulo en la columna *usa* al módulo en la fila.
### Prototipo

- Despliegue rápido (Docker Compose e2e distribuido):
  - `docker compose -f TaskNotes/docker-compose.e2e.dist.yml up -d --build`
  - `docker compose -f TaskNotes/docker-compose.e2e.dist.yml ps`
  - Apagar y limpiar volúmenes: `docker compose -f TaskNotes/docker-compose.e2e.dist.yml down -v`

- Más detalles:
  - Consulta `TaskNotes/DEPLOYMENT.md` para pasos extendidos, troubleshooting y comandos adicionales.

#### Guía Paso a Paso (Breve)

- Requisitos: Docker 24+, Docker Compose v2; puertos libres 3000, 8080, 8083, 8001–8010, 5672, 15672, 27017.
- Levantar entorno distribuido:
  - `docker compose -f TaskNotes/docker-compose.e2e.dist.yml up -d --build`
- Ver contenedores:
  - `docker compose -f TaskNotes/docker-compose.e2e.dist.yml ps`
- Chequear salud:
  - `Invoke-RestMethod -Uri http://localhost:8083/health` (Gateway)
  - `Invoke-RestMethod -Uri http://localhost:8008/health` (Search)
  - `Invoke-RestMethod -Uri http://localhost:8010/healthz` (Logs)
- Registrar y autenticar (HS256):
  - Registro: `Invoke-RestMethod -Method Post -Uri http://localhost:8083/auth/register -ContentType 'application/json' -Body (@{ email='testuser@example.com'; password='Passw0rd!' } | ConvertTo-Json)`
  - Login: `$login = Invoke-RestMethod -Method Post -Uri http://localhost:8083/auth/login -ContentType 'application/json' -Body (@{ email='testuser@example.com'; password='Passw0rd!' } | ConvertTo-Json)`
  - Token: `$token = $login.access_token`
- Probar API con token:
  - `Invoke-RestMethod -Uri http://localhost:8083/user/profile -Headers @{ Authorization = "Bearer $token" }`
- Abrir UIs:
  - SSR: `http://localhost:3000` | Web Micro: `http://localhost:8080`
- Inspección rápida de DBs:
  - Postgres Auth: `docker compose -f TaskNotes/docker-compose.e2e.dist.yml exec postgres-auth psql -U postgres -d tasknotes_auth_service -c "SELECT COUNT(*) FROM users;"`
  - Mongo Logs: `docker compose -f TaskNotes/docker-compose.e2e.dist.yml exec mongo-logs mongosh --quiet --eval "db = db.getSiblingDB('tasknotes_logs_service'); printjson(db.event_logs.countDocuments())"`
- Apagar y limpiar:
  - `docker compose -f TaskNotes/docker-compose.e2e.dist.yml down -v`
- Ampliar pasos y troubleshooting:
  - Ver [DEPLOYMENT.md](./DEPLOYMENT.md).
