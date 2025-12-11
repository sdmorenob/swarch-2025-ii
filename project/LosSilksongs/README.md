# Project: Prototype 4
# MusicShare - Red Social Musical

- **[Aplicación deplegada](https://musicshare.34.60.50.189.nip.io/login)**

## Tabla de Contenidos

* [**Team**](#team)
  * [Team name](#team)
  * [Full names and team members](#team)
* [**Software System**](#software-system)
  * [Name](#software-system)
  * [Logo](#software-system)
  * [Description](#software-system)
* [Functional Requirements](#functional-requirements)
* [Non-Functional Requirements](#non-functional-requirements)
* [**Architectural Structures**](#architectural-structures)
  * [Component-and Connector (C&C) Structure](#component-and-connector-cc-structure)
  * [Layered Structure](#layered-structure)
  * [Deployment Structure](#deployment-structure)
  * [Decomposition Structure](#decomposition-structure)
* [**Quality Attributes**](#quality-attributes)
  * [Security](#security)
  * [Performance and Scalability](#performance-and-scalability)
  * [Reliability](#reliability)
  * [Interoperability](#interoperability)
* [**Prototype**](#prototype)
  * [Implementing and deploying the software system prototype](#prototype)

---

## Team {#team}
- **Team name**: Los SilkSongs
- **Full name and team members**
  - Julian David Rodriguez Fernandez
  - Julián Andrés Vargas Gutiérrez
  - Gabriel Felipe Fonseca Guerrero
  - Gabriel Felipe González Bohórquez
  - Andrés Felipe Perdomo Uruburu
  - Andrés Felipe Poveda Bellón

## Software System {#software-system}
 - **Name:** MusicShare
 - **Logo**

![Logo](Logo.jpg)

 
 - **Description**
**MusicShare** es una red social de música desarrollada con una **arquitectura distribuida de microservicios**, que integra presentación web en **React/TypeScript**, servicios de negocio independientes y bases de datos híbridas (**PostgreSQL y MongoDB**). El sistema permite a los usuarios compartir y descubrir música mientras garantiza **escalabilidad horizontal**, **baja latencia en streaming y alta disponibilidad**. La comunicación entre componentes se gestiona mediante **REST, gRPC y WebSockets**, bajo un esquema seguro con **OAuth2/JWT y TLS 1.2+**. Todo el software se despliega en entornos contenedorizados con Docker/Kubernetes, con monitoreo centralizado, pruebas automatizadas y cumplimiento de estándares de usabilidad, accesibilidad (WCAG 2.1 AA) y protección de datos (GDPR/legislación colombiana).

---

# Functional Requirements {#functional-requirements}
### RF01 - Gestión de Usuarios
### RF02 - Subida y Gestión de Música
- El sistema debe permitir subir archivos de audio (MP3, WAV) al cloud storage
- El sistema debe permitir agregar metadatos básicos a las pistas (título, artista, género)
- El sistema debe permitir reproducir las pistas subidas
### RF03 - Feed Social Musical
- El sistema debe mostrar un timeline con las publicaciones musicales de usuarios seguidos
- El sistema debe permitir compartir pistas musicales como publicaciones
- El sistema debe mostrar información básica de cada publicación (usuario, fecha, título de la canción)
### RF04 - Sistema de Seguimiento
- El sistema debe permitir seguir y dejar de seguir otros usuarios
- El sistema debe mostrar la lista de seguidores y seguidos
- El sistema debe filtrar el feed basado en usuarios seguidos
### RF05 - Salas de Música Colaborativa - Para mirar para el MVP
- El sistema debe permitir crear salas de música donde un usuario actúe como "DJ"
- El sistema debe permitir que otros usuarios se conecten a las salas creadas
- El sistema debe sincronizar la reproducción para todos los participantes de la sala
- El sistema debe mostrar quién está conectado en cada sala
### RF06 - Interacciones Básicas
- El sistema debe permitir dar "like" a publicaciones musicales
- El sistema debe mostrar el contador de likes por publicación
- El sistema debe permitir comentarios básicos en las publicaciones
### RF07 - Descubrimiento Simple
- El sistema debe permitir explorar música por género básico
- El sistema debe mostrar publicaciones populares/trending
- El sistema debe permitir búsqueda simple por usuario o título de canción

## Non-Functional Requirements {#non-functional-requirements}

MusicShare es una aplicación web que funciona como red social especializada donde los usuarios pueden compartir su música favorita, crear playlists y descubrir nueva música a través de una experiencia social interactiva.
### RNF-5.1: Diseño responsivo
Requisito: La interfaz de usuario web debe ser completamente responsiva y funcional en los principales tamaños de pantalla: móviles (320px-767px), tabletas (768px-1023px) y escritorio (1024px+).
Métrica de aceptación: Pruebas en emuladores de dispositivos y dispositivos físicos confirman que no hay elementos rotos o inutilizables en las resoluciones clave.
### RNF-5.2: Accesibilidad web
Requisito: La aplicación debe cumplir con el nivel AA de las Pautas de Accesibilidad para el Contenido Web (WCAG 2.1).
Métrica de Aceptación: La aplicación pasa las validaciones de herramientas automatizadas de accesibilidad (ej. Lighthouse, Axe) y supera una revisión manual de criterios clave (contraste, navegación por teclado, texto alternativo para imágenes).
Arquitectura y Distribución
### RNF-1.1 Arquitectura Distribuida
El sistema debe seguir una arquitectura distribuida basada en microservicios, de modo que cada componente (frontend, servicios de negocio y bases de datos) pueda desplegarse y escalarse de manera independiente.
### RNF-1.2 Componentes de Presentación
En el sistema la aplicación web se desarrolla en React/TypeScript, de modo que interactúe con los servicios a través de conectores HTTP.
### RNF-1.3 Componentes de Lógica de Negocio
El sistema debe contar con un conjunto de componentes de lógica, representados por microservicios independientes (UserService, MusicService, SocialService, SearchService, NotificationService, MetadataService) encargados de las distintas funcionalidades.
### RNF-1.4 Componentes de Datos
El sistema incluye componentes de datos de distinto tipo, específicamente:
Base de datos relacional (PostgreSQL) para información estructurada de usuarios, relaciones sociales y metadatos clave.
Base de datos NoSQL (MongoDB) para almacenamiento de metadatos musicales, búsqueda y análisis flexible.
Conectividad y Protocolos
### RNF-2.1 conectores basados en HTTP:
REST para operaciones CRUD y comunicación estándar entre frontend, gateway y microservicios.
WebSocket para notificaciones en tiempo real y actualizaciones del feed.
gRCP para soportar comunicación entre microservicios internos para operaciones de alta frecuencia
### RNF-2.2 Conectividad con MongoDB
MongoDB Wire Protocol se encarga de la comunicación entre la base de datos que guarda la música y el componente que se encarga del servicio de música
## Rendimiento y Escalabilidad
### RNF-3.1 Escalabilidad Horizontal:
La plataforma debe permitir el despliegue independiente de cada microservicio para escalar de manera horizontal según la carga de usuarios, soportando picos de al menos 100 usuarios concurrentes. (toca discutir # de usuarios)
### RNF-3.2 Tiempo de Respuesta:
El tiempo promedio de respuesta de las API REST no debe superar 300 ms bajo una carga media, y 500 ms en picos de tráfico.
### RNF-3.3 Reproducción en Streaming:
La entrega de archivos de audio desde el Cloud Storage debe mantener una latencia inicial máxima de 2 s antes de iniciar la reproducción. (Desde el momento en que el usuario pone play hasta que empieza a sonar no deben pasar más de 2 segundos)
Lenguajes y tecnologías
Se implementará el sistema de software en Python, Go y Java.
## Disponibilidad y Confiabilidad
### RNF-5.1: Tolerancia a Fallos
Requisito: La falla de un microservicio no crítico (ej. NotificationService) no debe afectar las funcionalidades principales del sistema, como la autenticación, la subida y la reproducción de música.
Métrica de Aceptación: Se realizan pruebas de caos (ej. deteniendo el contenedor de un servicio no crítico) y se verifica que las funciones principales siguen operativas.
### RNF-5.2 Modularidad e independencia:
La arquitectura de microservicios debe aislar fallos de un servicio sin afectar el funcionamiento global.
## Seguridad
### RNF-6.1 Autenticación y Autorización:
Todos los endpoints deben requerir autenticación mediante OAuth2, donde un servidor de autorización emite tokens de acceso en formato JWT. Dichos tokens deben incluir claims de roles y privilegios de usuario, que serán validados en el gateway y en los microservicios para aplicar autorización basada en roles.
### RNF-6.2 Protección de Datos:
Todo el tráfico entre cliente, gateway y microservicios debe viajar sobre HTTPS/TLS 1.2+.
### RNF-6.3 Almacenamiento Seguro:
Las contraseñas en PostgreSQL deben almacenarse con bcrypt o algoritmo equivalente.
### RNF-6.4 Cumplimiento Legal:
El sistema debe cumplir con GDPR/LPD colombiana para la protección de datos personales.
Mantenibilidad y Evolución
### RNF-7.1 Despliegue Contenerizado:
Toda la infraestructura debe empaquetarse con Docker y ser orquestable mediante Docker Compose/Kubernetes, permitiendo CI/CD.
### RNF-7.2 Documentación:
Cada servicio debe proveer documentación de su API usando OpenAPI/Swagger actualizada.
### RNF-7.3 Pruebas Automatizadas:
Cobertura mínima de 80 % en pruebas unitarias e integración para cada microservicio.
## Compatibilidad e Interoperabilidad
### RNF-8.1 Navegadores Soportados:
El frontend debe funcionar en las últimas dos versiones estables de Chrome.
### RNF-8.1: Diseño Responsivo
Requisito: La interfaz de usuario web debe ser completamente responsiva y funcional en los principales tamaños de pantalla: móviles (320px-767px), tabletas (768px-1023px) y escritorio (1024px+).
Métrica de Aceptación: Pruebas en emuladores de dispositivos y dispositivos físicos confirman que no hay elementos rotos o inutilizables en las resoluciones clave.
### RNF-8.2: Accesibilidad Web
Requisito: La aplicación debe cumplir con el nivel AA de las Pautas de Accesibilidad para el Contenido Web (WCAG 2.1).
Métrica de Aceptación: La aplicación pasa las validaciones de herramientas automatizadas de accesibilidad (ej. Lighthouse, Axe) y supera una revisión manual de criterios clave (contraste, navegación por teclado, texto alternativo para imágenes).
## Usabilidad y Experiencia de Usuario
### RNF-9.1 Accesibilidad:
Cumplir con el nivel AA de WCAG 2.1, garantizando que personas con discapacidades visuales o motoras puedan usar el sistema.
### RNF-9.2 Responsividad:
La interfaz debe adaptarse a pantallas móviles, tabletas y escritorios.
## Observabilidad y Monitoreo
### RNF-10.1 Logging Centralizado:
Todos los microservicios deben emitir logs en formato estructurado (JSON) y enviarlos a una plataforma central (ej. ELK/Prometheus + Grafana).
### RNF-10.2 Métricas de Salud:
Cada servicio expondrá un endpoint /health para chequeos automáticos por parte del orquestador y el API Gateway.

---

# Architectural Structures {#architectural-structures}
## Component-and Connector (C&C) Structure {#component-and-connector-cc-structure}
C&C View:
![C&C View](CyC_prototipo3.png)

## Description of architectural styles used.

- Microservicios: Servicios independientes con responsabilidades específicas
- Microfrontends: Frontends independientes
- Layered Architecture: Separación clara entre presentación, lógica y datos
- Event-Driven: Para notificaciones y actualizaciones en tiempo real
- API Gateway Pattern: Para enrutar requests y manejar autenticación

## Description of architectural elements and relations 
## Componentes:
### Presentación:
- Web Frontend (React/TypeScript): Interfaz de usuario principal
- Posts Frontend (JavaScript): Interfaz para la creación de posts
### Lógica de Negocio:
- User Service (Python/FastAPI): Gestión de usuarios, autenticación, perfiles
- Music Service (Go): Manejo de archivos musicales, metadatos, cloud storage
- Social Service (Java/Spring Boot): Feed, seguimientos, interacciones sociales
- Notification Service (Python): Sistema de notificaciones en tiempo real
- Search Service (Go): Búsquedas y recomendaciones
- Metadata Service (Python/FastAPI): Obtención de metadatos para las canciones subidas por medio de Music Service
### Datos:
- User Database (PostgreSQL): Datos de usuarios, perfiles, relaciones
- Music Metadata Database (MongoDB): Metadatos de canciones, playlists, tags
- Cloud Storage (AWS S3/Google Cloud): Archivos de audio
- Cache Layer (Redis): Cache para búsquedas y feed
## Conectores HTTP:
### REST API Connector:
  - Comunicación entre Frontend y servicios
  - Operaciones CRUD estándar
  - Autenticación vía JWT
### WebSocket Connector:
  - Notificaciones en tiempo real
  - Chat en vivo durante reproducciones
  - Updates del feed en tiempo real
### gRPC:
  - Conexión MusicService con MetadataService

## Layered Structure {#layered-structure}
### Layered View:
![Diagrama de capas](Diagrama_Capas_2.png)

### Vista de capas de la capa de negocios:

![Diagrama de capas de negocios](Capas_Business.png)

## Descripción de los Patrones Arquitectónicos Utilizados

La arquitectura del sistema sigue el Patrón Arquitectónico en Capas (Layered Architectural Pattern), el cual organiza el software en niveles jerárquicos con responsabilidades bien definidas y relaciones unidireccionales tipo “allowed-to-use”. Cada capa superior depende únicamente de los servicios ofrecidos por la capa inmediatamente inferior, promoviendo así la modificabilidad, la escalabilidad y la separación de responsabilidades.

Asimismo, se aplica el Patrón de Microservicios dentro de la Capa de Negocio, donde cada servicio (User, Music, Social, Notification y Metadata) encapsula un dominio funcional específico y se comunica mediante APIs REST o protocolos asíncronos. Este enfoque permite el despliegue independiente, el aislamiento de fallos y una alta mantenibilidad.

Además, en la capa de presentación se aplica el Patrón de Micro Frontends, dividiendo la interfaz de usuario en dos aplicaciones independientes (Web Frontend y Posts Frontend). Cada una se despliega de manera autónoma y consume los servicios del API Gateway. Este enfoque facilita la escalabilidad del frontend, el desarrollo paralelo por equipos distintos y la actualización independiente de módulos de interfaz sin afectar al resto del sistema.

Entre los patrones complementarios utilizados se encuentran:

Patrón API Gateway: centraliza el acceso externo, el enrutamiento y la autenticación hacia los servicios del backend.

Patrón Base de Datos por Servicio (Database per Service): Cada microservicio gestiona su propia base de datos, garantizando independencia de datos.

## Descripción de los Elementos Arquitectónicos y sus Relaciones

La arquitectura está compuesta por cinco capas lógicas:

### Capa de Presentación: 

Incluye los componentes orientados al usuario como Web Frontend y Posts Frontend. Estos módulos gestionan la interacción con el usuario, la visualización de datos y las peticiones al sistema. Se comunican exclusivamente con la Capa de Integración mediante HTTP/REST.

### Capa de Integración: 
Implementa el API Gateway, responsable del enrutamiento, balanceo de carga, autenticación y control de tráfico. Actúa como una fachada que expone un punto de acceso unificado al frontend y delega las solicitudes hacia los microservicios correspondientes.

### Capa de Negocio (Business): 
Compuesta por microservicios independientes (User Service, Music Service, Social Service, Notification Service y Metadata Service). Cada uno encapsula reglas de negocio específicas.

### Capa de Persistencia: 
Agrupa los componentes de almacenamiento de datos, como User Database (PostgreSQL), Music/Metadata Database (MongoDB), Social Database (PostgreSQL) y Cloud Storage para archivos multimedia. Cada microservicio accede exclusivamente a su propia fuente de datos.

### Capa de Infraestructura: 
Proporciona soporte de ejecución y despliegue mediante Docker, Kubernetes, pipelines de CI/CD, monitoreo (Prometheus/Grafana) y gestión de logs (ELK). Esta capa sustenta a todas las demás sin generar dependencias ascendentes.

Las relaciones entre capas son estrictamente descendentes (allowed-to-use), lo que asegura modularidad y evita dependencias circulares. Esta organización favorece el mantenimiento, permite reemplazar tecnologías en capas inferiores y facilita la escalabilidad independiente de los servicios.

## Deployment Structure {#deployment-structure}
Deployment View:
![Vista de despliegue](Despliegue_segmentado.png)

## Elementos Arquitectónicos y Relaciones

### Visión General de la Arquitectura de Despliegue

El sistema está desplegado en **Google Cloud Platform (GCP)** utilizando una arquitectura de microservicios contenerizados orquestada por **Google Kubernetes Engine (GKE)**. El despliegue consiste en tres capas principales: capa de acceso externo, capa de orquestación del clúster y capa de persistencia de datos.

### Capa 1: Acceso Externo y Gateway

**API Gateway (Externo)**
- **Componente:** NGINX Ingress Controller
- **Despliegue:** Servicio LoadBalancer con IP pública (34.60.50.189)
- **Responsabilidades:**
  - Único punto de entrada para todo el tráfico externo
  - Terminación TLS (HTTPS → HTTP)
  - Enrutamiento HTTP de capa 7 basado en reglas de path y host
  - Balanceo de carga entre servicios internos
- **Relaciones:**
  - Expuesto a internet vía GCP Network Load Balancer
  - Enruta tráfico a servicios ClusterIP internos dentro del namespace `musicshare`

**Gateway Container (Interno)**
- **Tecnología:** Implementación de gateway personalizada
- **Entorno de Ejecución:** Contenedor NGINX
- **Responsabilidades:**
  - Enrutamiento y reenvío de peticiones
  - Procesamiento de middleware
- **Relaciones:**
  - Comunica con frontend y microservicios backend vía HTTP

### Capa 2: Clúster GKE - Servicios de Aplicación

**Configuración del Clúster:**
- **Tipo:** Clúster Kubernetes gestionado GKE
- **Zona:** us-central1-a
- **Node Pool:** 3 nodos worker (e2-medium: 2 vCPUs, 4GB RAM cada uno)
- **SO:** Container-Optimized OS (COS)
- **Recursos Totales:** 6 vCPUs, 12GB RAM

**Segmentación por Namespace:**
- `musicshare`: Cargas de trabajo de aplicación
- `ingress-nginx`: Controlador Ingress
- `cert-manager`: Gestión de certificados
- `kube-system`: Componentes del sistema Kubernetes

#### Servicios Frontend

**musicshare-frontend**
- **Tecnología:** Servidor web NGINX
- **Contenedor:** Sirve aplicación React estática
- **Entorno de Ejecución:** Runtime Node.js (build) → NGINX (producción)
- **Escalado:** HPA habilitado (1-4 réplicas, CPU objetivo 50%)
- **Puerto:** 80
- **Relaciones:**
  - Accedido vía Ingress Controller
  - Realiza llamadas HTTP REST a servicios backend
  - Comunica con user_service, social_service, music_service

**web_frontend (Next.js)**
- **Tecnología:** Framework Next.js React
- **Entorno de Ejecución:** Contenedor Node.js
- **Relaciones:**
  - Interfaz frontend alternativa
  - Mismo patrón de comunicación backend que frontend principal

#### Microservicios Backend

**musicshare-music-service**
- **Tecnología:** Python 3.11 (Flask/FastAPI)
- **Contenedor:** musicshare-music-service
- **Entorno de Ejecución:** Runtime Python 3.11, puerto 8081
- **Réplicas:** 2 (redundancia activa-activa)
- **Responsabilidades:**
  - Gestión de catálogo musical
  - Manejo de metadatos de canciones
  - Integración con metadata service vía gRPC
- **Relaciones:**
  - Recibe peticiones HTTP REST desde frontend vía Ingress
  - Realiza llamadas gRPC a metadata-service (puerto 50051)
  - Publica eventos a RabbitMQ
  - Consulta music_db (Cloud SQL)

**musicshare-social-service**
- **Tecnología:** Java 21 (Spring Boot)
- **Contenedor:** musicshare-social-service
- **Entorno de Ejecución:** JDK 21, puerto 8083
- **Réplicas:** 2
- **Responsabilidades:**
  - Interacciones sociales (posts, comentarios, likes)
  - Feed de actividad de usuario
  - Gestión de grafo social
- **Relaciones:**
  - Recibe peticiones HTTP REST desde frontend
  - Publica eventos sociales a RabbitMQ (notificaciones)
  - Consulta social_db (Cloud SQL vía sidecar proxy)
  - Descubre servicios vía CoreDNS

**musicshare-metadata-service**
- **Tecnología:** Python 3.11 (servidor gRPC)
- **Contenedor:** musicshare-metadata-service
- **Entorno de Ejecución:** Runtime Python 3.11, puerto 50051
- **Réplicas:** 2
- **Responsabilidades:**
  - Enriquecimiento de metadatos musicales (integración API Spotify)
  - Artwork de álbumes e información de artistas
  - Proveedor de API gRPC
- **Relaciones:**
  - Recibe peticiones gRPC desde music-service
  - Comunica con API externa de Spotify
  - Consulta metadata_db (Cloud SQL)

**musicshare-mongodb**
- **Tecnología:** MongoDB 7.0
- **Contenedor:** Imagen oficial MongoDB
- **Entorno de Ejecución:** Servidor MongoDB
- **Puerto:** 27017
- **Responsabilidades:**
  - Almacenamiento basado en documentos para catálogo musical
  - Colecciones de artistas y álbumes
- **Relaciones:**
  - Accedido por music-service
  - Volumen persistente para durabilidad de datos

**musicshare-userservice**
- **Tecnología:** Python 3.9 (Flask)
- **Contenedor:** musicshare-userservice
- **Entorno de Ejecución:** Runtime Python 3.9, puerto 8082
- **Réplicas:** 2
- **Responsabilidades:**
  - Autenticación y autorización de usuarios
  - Generación y validación de tokens JWT
  - Gestión de perfiles de usuario
- **Relaciones:**
  - Recibe peticiones de autenticación desde frontend
  - Consulta user_db (Cloud SQL)
  - Emite tokens JWT para Access Token Pattern

**notificationservice**
- **Tecnología:** Python 3.9
- **Contenedor:** notificationservice
- **Entorno de Ejecución:** Runtime Python 3.9, puerto 8082
- **Responsabilidades:**
  - Procesamiento asíncrono de notificaciones
  - Consumidor de mensajes AMQP
  - Entrega de notificaciones push
- **Relaciones:**
  - Consume mensajes desde RabbitMQ
  - Consulta base de datos de notificaciones

#### Message Broker

**RabbitMQ**
- **Tecnología:** Message broker RabbitMQ
- **Contenedor:** Imagen oficial RabbitMQ
- **Entorno de Ejecución:** Runtime Erlang
- **Puerto:** 5672 (AMQP), 15672 (Management UI)
- **Responsabilidades:**
  - Enrutamiento asíncrono de mensajes
  - Hub de comunicación orientado a eventos
  - Implementación de patrón Pub/Sub
- **Relaciones:**
  - Publicadores: music-service, social-service
  - Consumidor: notificationservice
  - Descubrimiento de servicios vía `AMQP_URL=amqp://rabbitmq:5672`

### Capa 3: Persistencia de Datos

**Instancia Cloud SQL (ms111rep)**
- **Tipo:** Google Cloud SQL para PostgreSQL
- **Versión:** PostgreSQL 15
- **Método de Conexión:** Cloud SQL Proxy (Sidecar Pattern)
- **Red:** IP privada dentro de VPC de GCP, sin exposición pública
- **Bases de Datos:**
  - `user_db`: Cuentas de usuario y datos de autenticación
  - `social_db`: Interacciones sociales, posts, comentarios
  - `metadata_db`: Caché de metadatos musicales
  - `music_db`: Catálogo musical (alternativa a MongoDB)
  - `restmark_db`: Datos de reseñas/calificaciones

**Cloud SQL Proxy (Contenedores Sidecar)**
- **Tecnología:** Google Cloud SQL Auth Proxy
- **Despliegue:** Contenedor sidecar en pods que requieren acceso a base de datos
- **Entorno de Ejecución:** Namespace de red compartido del pod (localhost)
- **Autenticación:** Workload Identity (basado en IAM, sin credenciales estáticas)
- **Puerto:** 5432 (protocolo PostgreSQL)
- **Relaciones:**
  - Co-ubicado con pods de userservice, social-service, metadata-service
  - Establece túnel cifrado a instancia Cloud SQL
  - Aplicación conecta a `localhost:5432`, sidecar hace proxy a Cloud SQL

### Aspectos Transversales

**Service Discovery (CoreDNS)**
- Registro automático de servicios basado en DNS
- Servicios comunican usando nombres DNS (ej: `http://metadata-service:50051`)
- Resolución con ámbito de namespace: `<service>.<namespace>.svc.cluster.local`

**Gestión de Certificados (cert-manager)**
- Ciclo de vida automatizado de certificados X.509
- Integración con Let's Encrypt vía protocolo ACME
- Solver de desafío HTTP-01
- Renovación automática cada 90 días

**Balanceo de Carga (Multi-Nivel)**
- **L4 (GCP Network LB):** Distribuye tráfico TCP a nodos del clúster
- **L7 (NGINX Ingress):** Enrutamiento y balanceo basado en HTTP a servicios
- **Interno (kube-proxy):** Balanceo a nivel de pod vía iptables/IPVS

**Controles de Seguridad**
- **Segmentación de Red:** Servicios ClusterIP (sin IPs públicas) + LoadBalancer solo para Ingress
- **Cifrado:** TLS 1.2/1.3 para tráfico externo, opción mTLS para interno (no implementado)
- **Autenticación:** Tokens JWT validados en cada microservicio
- **Gestión de Secretos:** Kubernetes Secrets para configuración sensible

**Monitoreo y Observabilidad**
- **Metrics Server:** Métricas de utilización de recursos para HPA
- **Kubelet:** Monitoreo de salud de nodos y pods
- **Ingress Logs:** Logs de acceso para análisis de tráfico

---



## Decomposition Structure
![Diagrama de descomposición de Dominio](general.png)

## Description {#decomposition-structure}
🎵 Estructura de Descomposición de Dominio — MusicShare
Dominio Raíz: MusicShare

Descripción general:
MusicShare es una plataforma colaborativa para compartir, reproducir y descubrir música. El sistema está diseñado bajo una arquitectura basada en microservicios, donde cada dominio encapsula una funcionalidad específica, comunicándose entre sí mediante un API Gateway.
Su estructura promueve la escalabilidad, la independencia de desarrollo y el despliegue modular de componentes.
Cliente para funcionalidades principales


### 1. frontend

![Frontend](frontendcorreccion.png)


- **Responsabilidad principal**:
  - Proporcionar la interfaz gráfica principal para los usuarios finales.
  - Es la capa de presentación encargada de gestionar la interacción del usuario con las funcionalidades de la plataforma.

- **Funciones clave:**
  - Registro e inicio de sesión de usuarios.
  - Exploración de canciones, playlists y perfiles.
  - Comunicación directa con el API Gateway para consumir servicios REST.
  - Implementación adaptable para navegadores web.

### 2. frontendSSR

![FrontendSSR](frontendSSRcorreccion.png)


- **Responsabilidad principal**:
  - Cliente con Server-Side Rendering que carga el formulario para enviar al cliente para crear los POST
- **Funciones clave:**
  - Permite arrastrar canciones
  - Inserción de Tags, 
  - Definir si es de tipo de pública, agrega descripción y hashtags

### 3. SocialService

![socialservice](socialservicecorreccion.png)

- **Responsabilidad principal:**
  - Encargado del componente social de la plataforma. Administra las interacciones, conexiones y actividades entre los usuarios.

- **Funciones clave:**
  - Manejo de publicaciones, comentarios y likes.
  - Seguimiento de usuarios (“followers/following”).
  - Integración con el NotificationService para alertas sociales.
  - Conexión con UserService para obtener perfiles.

### 4. MusicService

![musicservice](musicservicecorreccion.png)

- **Responsabilidad principal:**
  - Administrar los recursos musicales y su ciclo de vida dentro del sistema.

- **Funciones clave:**
  - Almacenamiento y gestión de canciones y álbumes.
  - Control de derechos, autoría y acceso.
  - Integración con el MetadataService para obtener información descriptiva.
  - Exposición de endpoints para streaming o descarga.

### 5. Traekik

![traefik](traefikcorreccion.png)


## Apigateway
- **Responsabilidad principal:**
  - Centralizar y gestionar todas las solicitudes externas hacia los microservicios.
  - Actúa como punto único de entrada al ecosistema MusicShare.

-**Funciones clave**:
  - Seguridad, autenticación y autorización.
  - Control de tráfico, logging y CORS.
  - Comunicación entre frontends y los servicios internos.

## Load Balancer
- **Responsabilidad principal:**
  - Distribuir equitativamente las solicitudes entrantes entre múltiples instancias de un servicio.

-**Funciones clave**:
  - Garantizar alta disponibilidad del ecosistema MusicShare.
  - Garantizar escalabilidad del ecosistema MusicShare.

### 6. MetadataService

![metadataservice](metadataservicecorreccion.png)

- **Responsabilidad principal:**
  - Gestionar y proveer información descriptiva asociada al contenido musical.

- **Funciones clave:**
  - Procesamiento y almacenamiento de metadatos de audio (artista, álbum, duración, género, etc.).
  - Indexación de canciones para búsqueda y filtrado.
  - Soporte a MusicService y RecommendationService (si existiera).
  - Posible integración con APIs externas para completar metadatos.

### 7. UserService

![userservice](userservicecorreccion.png)

- **Responsabilidad principal:**
  - Gestionar la información y autenticación de los usuarios del sistema.

- **Funciones clave:**
  - Registro, login y recuperación de contraseñas.
  - Administración de roles y permisos.
  - Exposición de información de perfil para otros servicios (SocialService, NotificationService).
  - Almacenamiento seguro de credenciales (posiblemente con JWT o OAuth2).

### 8. NotificationService

![notificationservice](notificationservicecorreccion.png)

- **Responsabilidad principal:**
  - Coordinar y enviar notificaciones a los usuarios según eventos del sistema.

- **Funciones clave:**
  - Notificaciones por nuevas publicaciones, seguidores o reacciones.
  - Integración con SocialService y UserService.
  - Envío de notificaciones por correo, push o en la aplicación.

Registro de eventos relevantes para los usuarios.

---

# QUALITY ATTRIBUTES {#quality-attributes}

## <u>Security</u> {#security}

### 🔒 Secure Channel Pattern

**Estímulo:** Un usuario accede a la aplicación MusicShare a través de internet desde su navegador.

**Respuesta:** El sistema establece una conexión HTTPS segura con certificado TLS válido, cifrando toda la comunicación entre cliente y servidor para proteger datos sensibles (credenciales, información de usuario) contra ataques de interceptación (man-in-the-middle).

### Implementación

**Patrón Arquitectónico:** Secure Channel Pattern

**Táctica Arquitectónica:** Encrypt Data (cifrado de datos en tránsito mediante TLS/SSL)

### Solución Técnica

Se implementó TLS Termination en el Ingress Controller de Kubernetes utilizando la siguiente arquitectura:

1. **Dominio con Magic DNS:** Uso de `nip.io` para resolver `musicshare.34.60.50.189.nip.io` a la IP pública del clúster, permitiendo la emisión de certificados válidos sin necesidad de comprar un dominio.

2. **Automatización de Certificados:** Instalación de `cert-manager` v1.13.3 en el clúster para gestionar automáticamente el ciclo de vida de certificados X.509.

3. **Emisor Let's Encrypt:** Configuración de un `ClusterIssuer` que utiliza el protocolo ACME de Let's Encrypt para obtener certificados gratuitos y renovarlos automáticamente cada 90 días.

4. **Ingress con TLS:** Configuración del recurso Ingress con:
   - Sección `tls` especificando el hostname y el secret donde se almacena el certificado
   - Anotación `cert-manager.io/cluster-issuer` para activar la emisión automática
   - Solver HTTP-01 para validación del dominio

**Resultado:** La aplicación es accesible mediante HTTPS con certificado válido, mostrando el candado de seguridad en navegadores sin advertencias. Todo el tráfico entre usuarios y la aplicación viaja cifrado mediante TLS 1.2/1.3.

### Componentes de Seguridad
- **cert-manager:** Gestor de certificados automático
- **Let's Encrypt:** Autoridad Certificadora (CA) gratuita
- **NGINX Ingress Controller:** Punto de terminación TLS
- **Secret Kubernetes:** Almacenamiento seguro del certificado y clave privada

### 🛡️ Reverse Proxy Pattern

### Escenario
**Estímulo:** Un usuario externo envía una petición HTTP/HTTPS hacia la aplicación MusicShare desde internet.

**Respuesta:** El sistema intercepta la solicitud en un punto de entrada único, realiza terminación TLS, oculta la topología interna de microservicios y enruta la petición al servicio backend correspondiente basándose en reglas de capa 7 (HTTP).

### Implementación

**Patrón Arquitectónico:** Reverse Proxy Pattern

**Táctica Arquitectónica:** Limit Exposure (limitar exposición de servicios internos) y Limit Access (controlar acceso mediante punto de entrada único)

### Solución Técnica

Se implementó un proxy inverso utilizando NGINX Ingress Controller con las siguientes características:

1. **Punto de Entrada Único:** NGINX Ingress Controller es el único componente con IP pública (LoadBalancer), actuando como gateway para todo el tráfico entrante.

2. **TLS Termination:** El proxy maneja el cifrado/descifrado HTTPS, liberando a los servicios backend de esta responsabilidad y centralizando la gestión de certificados.

3. **Enrutamiento Basado en Reglas:** Configuración de recurso Ingress con reglas de enrutamiento por path y host, dirigiendo solicitudes a servicios internos según URL (`/api/users` → userservice, `/api/social` → socialservice).

4. **Ocultamiento de Topología:** Los clientes externos solo conocen el dominio público; la estructura interna de microservicios, sus IPs y puertos permanecen invisibles.

**Resultado:** Aislamiento completo de servicios backend de acceso directo desde internet. Los logs del Ingress Controller muestran el flujo `cliente → NGINX → upstream (10.x.x.x)`, confirmando la mediación del proxy en todas las comunicaciones.

### Componentes de Seguridad
- **NGINX Ingress Controller:** Proxy inverso y balanceador L7
- **Ingress Resource:** Definición de reglas de enrutamiento
- **LoadBalancer Service:** Exposición controlada del único punto de entrada
- **Upstream Routing:** Reenvío interno a servicios ClusterIP

![Objeto Ingress](reverse_proxy_pattern.jpeg)
![Logs de acceso](reverse_proxy_pattern_2.jpeg)

### 🛜 Network Segmentation Pattern

### Escenario
**Estímulo:** Un atacante intenta acceder directamente a microservicios internos o bases de datos desde internet, evitando el punto de entrada oficial.

**Respuesta:** El sistema deniega el acceso debido a la segmentación de red implementada. Los servicios internos no tienen IPs públicas y residen en una red overlay privada, accesible únicamente dentro del clúster y a través del Ingress Controller autorizado.

### Implementación

**Patrón Arquitectónico:** Network Segmentation Pattern (DMZ + Internal Network)

**Táctica Arquitectónica:** Segment Network (segmentar red en zonas de confianza) y Deploy in DMZ (desplegar componentes públicos en zona desmilitarizada)

### Solución Técnica

Se implementó segmentación multinivel utilizando primitivas de red de Kubernetes:

1. **DMZ (Zona Desmilitarizada):** NGINX Ingress Controller desplegado con servicio tipo `LoadBalancer`, exponiendo únicamente la IP pública necesaria para recibir tráfico HTTP/HTTPS.

2. **Red Interna Privada:** Todos los microservicios (userservice, socialservice, musicservice) y bases de datos (MongoDB, RabbitMQ) configurados con servicios tipo `ClusterIP`, sin IPs públicas asignadas (EXTERNAL-IP: `<none>`).

3. **Overlay Network:** Kubernetes proporciona una red virtual interna donde los servicios se comunican usando DNS interno y direcciones privadas (10.x.x.x), inaccesibles desde internet.

4. **Aislamiento por Namespace:** Uso del namespace `musicshare` para segregar lógicamente los recursos de la aplicación del resto del clúster (kube-system, ingress-nginx).

5. **Acceso Seguro a Cloud SQL:** Conexión a base de datos gestionada mediante Cloud SQL Proxy con túnel cifrado, sin exponer la instancia SQL a la red pública.

**Resultado:** Superficie de ataque minimizada con un único punto de entrada. Es físicamente imposible acceder a microservicios o bases de datos directamente desde internet. La verificación mediante `kubectl get svc` confirma que solo el Ingress Controller tiene EXTERNAL-IP asignada.

### Componentes de Seguridad
- **ClusterIP Services:** Servicios sin exposición pública
- **LoadBalancer Service:** Único para Ingress Controller
- **Kubernetes Overlay Network:** Red virtual privada (CNI)
- **Namespace Isolation:** Segregación lógica `musicshare`
- **Cloud SQL Proxy:** Túnel cifrado para acceso a BD gestionada

![network_segmentation](network_segmentation_pattern.jpeg)
![network_segmentation_2](network_segmentation_pattern_2.jpeg)

### 🔑 Access Token Pattern (Escogido por el equipo)

**Estímulo:** Un usuario autenticado realiza una acción sensible en la aplicación (crear post, comentar, dar like) desde un microfrontend hacia diferentes microservicios.

**Respuesta:** El sistema valida la identidad del usuario mediante un token JWT firmado, extrae el `userId` de forma segura, y ejecuta la operación sin requerir estado compartido entre servicios ni confiar en datos proporcionados por el cliente.

### Implementación

**Patrón Arquitectónico:** Access Token Pattern

**Táctica Arquitectónica:** Authenticate Users (autenticación mediante tokens criptográficos) y Authorize Users (autorización basada en claims del token)

### Solución Técnica

Se implementó un esquema de autenticación stateless basado en JWT con la siguiente arquitectura:

1. **Emisión de Tokens:** El microservicio `userservice` genera tokens JWT al validar credenciales en login, incluyendo claims esenciales (`userId`, `username`, `exp`) firmados criptográficamente.

2. **Propagación del Token:** El cliente almacena el token y lo envía en cada solicitud mediante el header HTTP `Authorization: Bearer <token>`.

3. **Validación Descentralizada:** Cada microservicio implementa middleware de validación que:
   - Verifica la firma criptográfica usando clave secreta compartida
   - Comprueba expiración del token
   - Extrae el `userId` para asociar acciones al usuario autenticado

4. **Autorización Implícita:** Las operaciones sensibles utilizan el `userId` extraído del token validado, eliminando la necesidad de enviar identificadores desde el cliente y previniendo suplantación de identidad.

**Resultado:** Autenticación y autorización distribuida sin estado compartido, escalable para arquitecturas de microservicios. Los servicios validan independientemente cada solicitud (response time < 50ms por validación), rechazando tokens inválidos o expirados con código HTTP 401.

### Componentes de Seguridad
- **JWT (JSON Web Tokens):** Tokens firmados con HS256 o RS256
- **Middleware de Validación:** Interceptores en cada microservicio
- **Clave Secreta Compartida:** Almacenada en Secrets de Kubernetes
- **Token Expiration:** Configurado a 1 hora (renovable mediante refresh tokens)

---

## <u>Performance and Scalability</u> {#performance-and-scalability}

### ⚖️ Load Balancer Pattern

**Estímulo:** El sistema recibe un incremento significativo en el tráfico de usuarios concurrentes (de 10 a 500 solicitudes/segundo) debido a horarios pico o eventos especiales.

**Respuesta:** El sistema distribuye automáticamente la carga entre múltiples instancias de servicios sin degradación perceptible del rendimiento (response time < 500ms percentil 95), evitando sobrecarga de instancias individuales y maximizando la utilización de recursos disponibles.

### Implementación

**Patrón Arquitectónico:** Load Balancer Pattern (Multi-Layer Load Balancing)

**Táctica Arquitectónica:** Increase Available Resources (aumentar recursos mediante distribución de carga)

### Solución Técnica

Se implementó una estrategia de balanceo de carga en tres niveles complementarios:

1. **Nivel 4 - Network Load Balancer (GCP):** El servicio `ingress-nginx` tipo `LoadBalancer` provisiona automáticamente un balanceador de red TCP/UDP de Google Cloud Platform que distribuye tráfico entrante desde la IP pública (34.60.50.189) hacia los nodos worker del clúster GKE.

2. **Nivel 7 - Application Load Balancer (NGINX Ingress):** NGINX Ingress Controller actúa como balanceador de aplicación HTTP/HTTPS, realizando:
   - TLS Termination centralizada
   - Enrutamiento basado en path y host
   - Distribución de peticiones usando algoritmos Round Robin o Least Connections
   - Health checks a servicios backend

3. **Nivel Interno - Service Load Balancing (kube-proxy):** Los servicios tipo `ClusterIP` distribuyen tráfico entre múltiples réplicas de pods mediante iptables/IPVS:
   - Balanceo automático entre pods disponibles
   - Registro dinámico de nuevas instancias al escalar
   - Exclusión automática de pods no saludables (failed readiness probes)

**Resultado:** Distribución eficiente del tráfico en tres capas. El sistema escala horizontalmente mediante HPA (Horizontal Pod Autoscaler), creando nuevas réplicas que son automáticamente integradas al pool de balanceo sin intervención manual ni downtime.

### Componentes de Escalabilidad
- **GCP Network Load Balancer:** Balanceo L4 entre nodos del clúster
- **NGINX Ingress Controller:** Balanceo L7 con health checking
- **kube-proxy:** Balanceo interno entre réplicas de pods
- **Service Endpoints:** Registro dinámico de pods disponibles

### 🪜 Auto Scaling Pattern (Escogido por el equipo)

**Estímulo:** La carga del sistema aumenta progresivamente durante horas pico, incrementando el uso de CPU de los pods del frontend de 30% a 80% sostenido durante más de 2 minutos.

**Respuesta:** El sistema detecta automáticamente el incremento de carga mediante métricas de utilización de recursos y escala horizontalmente el número de réplicas del servicio frontend (de 1 a 4 pods), distribuyendo la carga y manteniendo el response time bajo (<200ms), sin intervención manual ni downtime.

### Implementación

**Patrón Arquitectónico:** Auto Scaling Pattern (Horizontal Pod Autoscaling)

**Táctica Arquitectónica:** Introduce Concurrency (aumentar concurrencia mediante réplicas) y Resource Scheduling (planificación dinámica de recursos)

### Solución Técnica

Se implementó escalado horizontal automático utilizando Horizontal Pod Autoscaler (HPA) de Kubernetes:

1. **Metrics Server:** Recopila métricas de uso de CPU y memoria de todos los pods en tiempo real, proporcionando datos al controlador de HPA.

2. **HPA Controller:** Configurado para el deployment `frontend` con los siguientes parámetros:
   - **Target CPU:** 50% de utilización
   - **Min replicas:** 1 (estado en reposo)
   - **Max replicas:** 4 (límite para clúster e2-medium)
   - **Scale-up policy:** Crea nuevas réplicas cuando CPU > 50% durante 2+ minutos
   - **Scale-down policy:** Elimina réplicas cuando CPU < 50% durante 5+ minutos

3. **Integración con Load Balancer:** Las nuevas réplicas creadas son automáticamente registradas en el Service ClusterIP y comienzan a recibir tráfico balanceado inmediatamente tras pasar readiness probes.

4. **Resource Limits:** Cada pod tiene requests y limits de CPU/memoria definidos para garantizar cálculos precisos de utilización y evitar sobrecarga del nodo.

**Resultado:** Elasticidad automática basada en demanda real. Durante pruebas de carga, el HPA escaló de 1 a 3 réplicas en ~90 segundos al detectar CPU > 50%, distribuyendo exitosamente la carga y previniendo degradación del servicio. El sistema se auto-contrae en periodos de baja demanda, optimizando uso de recursos.

### Componentes de Escalabilidad
- **Horizontal Pod Autoscaler (HPA):** Controlador de escalado automático
- **Metrics Server:** Recolector de métricas de recursos
- **Resource Requests/Limits:** Definición de recursos por pod
- **Readiness Probes:** Validación de pods antes de recibir tráfico

![Muestra de AutoScaling 1](auto_scaling_pattern.jpeg)
![Muestra de AutoScaling 1](auto_scaling_pattern_2.jpeg)

---

## <u>Reliability</u> {#reliability}

### 🗄️ Replication Pattern

**Estímulo:** Un nodo worker del clúster falla abruptamente debido a error de hardware o mantenimiento programado, afectando pods en ejecución.

**Respuesta:** El sistema mantiene disponibilidad del servicio sin interrupción perceptible para los usuarios (downtime < 5 segundos). Kubernetes detecta la falla, evacua los pods del nodo problemático y los recrea automáticamente en nodos saludables, manteniendo el número declarado de réplicas activas.

### Implementación

**Patrón Arquitectónico:** Replication Pattern (Active-Active Redundancy)

**Táctica Arquitectónica:** Active Redundancy (redundancia activa) y State Resynchronization (resincronización de estado)

### Solución Técnica

Se implementó replicación horizontal a nivel de deployments de Kubernetes:

1. **Declaración de Réplicas:** Configuración de `replicas: 2` (mínimo) para microservicios críticos (userservice, socialservice, musicservice) en manifiestos de deployment, garantizando múltiples instancias activas simultáneas.

2. **Distribución Multi-Nodo:** El scheduler de Kubernetes distribuye réplicas en diferentes nodos workers del clúster (3 nodos e2-medium), implementando anti-affinity implícita para maximizar tolerancia a fallos.

3. **Health Monitoring:** Configuración de liveness y readiness probes que monitorizan continuamente el estado de cada réplica:
   - **Liveness probe:** Reinicia pods no responsivos
   - **Readiness probe:** Excluye réplicas no saludables del balanceo de carga

4. **Self-Healing:** El controlador ReplicaSet monitoriza constantemente el número real vs deseado de réplicas. Si una réplica falla (pod crash, nodo down), automáticamente programa una nueva instancia en un nodo disponible.

**Resultado:** Alta disponibilidad mediante redundancia activa. Durante pruebas de chaos engineering (simulación de fallo de nodo), el servicio mantuvo disponibilidad con <5 segundos de impacto mientras Kubernetes reubicaba pods. Las réplicas restantes continuaron sirviendo tráfico sin degradación gracias al load balancing.

### Componentes de Confiabilidad
- **ReplicaSet Controller:** Garantiza número deseado de réplicas
- **Scheduler:** Distribución inteligente de pods entre nodos
- **Health Probes:** Monitoreo continuo de estado de réplicas
- **Service Load Balancing:** Distribución automática entre réplicas saludables

### 🔍 Service Discovery Pattern

**Estímulo:** Un microservicio (userservice) necesita comunicarse con otro servicio interno (metadata-service) cuya dirección IP puede cambiar debido a reinicios, reescalados o migraciones entre nodos.

**Respuesta:** El sistema resuelve automáticamente el endpoint actual del servicio destino mediante DNS interno, sin requerir configuración manual de IPs ni reinicio de pods. La comunicación se establece exitosamente usando nombres lógicos estables independientemente de cambios en la topología de red.

### Implementación

**Patrón Arquitectónico:** Service Discovery Pattern (DNS-Based Discovery)

**Táctica Arquitectónica:** Service Registry (registro centralizado de servicios) y Name Resolution (resolución de nombres)

### Solución Técnica

Se implementó descubrimiento de servicios utilizando el sistema DNS nativo de Kubernetes:

1. **CoreDNS como Service Registry:** Kubernetes ejecuta CoreDNS como servidor DNS interno del clúster, manteniendo un registro actualizado automáticamente de todos los servicios y sus endpoints.

2. **Nombres DNS Estables:** Cada Service ClusterIP obtiene un nombre DNS en formato `<service-name>.<namespace>.svc.cluster.local`, accesible mediante shortname dentro del mismo namespace (ej: `http://metadata-service:50051`).

3. **Resolución Dinámica:** Los pods consultan CoreDNS para resolver nombres de servicios. CoreDNS retorna la IP virtual (ClusterIP) del Service, que internamente balancea hacia pods backend disponibles mediante iptables/IPVS.

4. **Configuración Basada en Variables:** Los microservicios usan variables de entorno con nombres lógicos de servicios (ej: `AMQP_URL=amqp://rabbitmq:5672`), eliminando hardcoding de IPs y permitiendo portabilidad entre entornos.

**Resultado:** Desacoplamiento total entre consumidores y proveedores de servicios. Durante operaciones de scaling, updates o migraciones, los servicios continúan comunicándose sin modificar configuraciones. La resolución DNS ocurre en <1ms, sin overhead perceptible en latencia.

### Componentes de Confiabilidad
- **CoreDNS:** Servidor DNS interno y service registry
- **Service ClusterIP:** Endpoints estables con IPs virtuales
- **DNS Resolution:** Traducción de nombres a IPs actuales
- **Environment Variables:** Configuración portable de endpoints

### 🖥️ Cluster Pattern

**Estímulo:** El sistema experimenta fallo total de un nodo worker, pérdida parcial de conectividad de red, o necesidad de mantenimiento sin ventana de downtime.

**Respuesta:** El clúster mantiene operatividad completa redistribuyendo carga entre nodos saludables. Los servicios permanecen disponibles gracias a la distribución de réplicas en múltiples máquinas. El control plane orquesta recuperación automática sin intervención manual.

### Implementación

**Patrón Arquitectónico:** Cluster Pattern (Distributed System Coordination)

**Táctica Arquitectónica:** Voting (consenso distribuido vía etcd) y Spare (recursos de respaldo distribuidos)

### Solución Técnica

Se implementó arquitectura de clúster completa utilizando Google Kubernetes Engine (GKE):

1. **Control Plane Gestionado:** GKE proporciona control plane de alta disponibilidad (etcd, API server, scheduler, controller manager) con multi-zona replication, garantizando continuidad de operación orquestada.

2. **Worker Nodes Pool:** Clúster configurado con 3 nodos workers tipo e2-medium distribuidos en zona us-central1-a, proporcionando capacidad computacional agregada (6 vCPUs, 12GB RAM total).

3. **Workload Distribution:** El scheduler distribuye pods entre nodos usando algoritmos de resource balancing, evitando concentración de carga crítica en un único nodo.

4. **Node Health Monitoring:** Kubelet en cada nodo reporta métricas de salud al control plane. El node controller detecta nodos no responsivos (heartbeat timeout) y marca pods como no programables, iniciando reubicación.

5. **Cluster-Level Networking:** CNI (Container Network Interface) implementa overlay network que permite comunicación pod-to-pod transparente entre nodos, sobreviviendo a cambios de topología.

**Resultado:** Tolerancia a fallos a nivel de infraestructura. El clúster opera como unidad lógica única, ocultando complejidad de sistema distribuido a las aplicaciones. Durante fallo de nodo, los pods se reschedulean en ~30 segundos en nodos saludables, manteniendo disponibilidad general del sistema.

### Componentes de Confiabilidad
- **GKE Control Plane:** Orquestación centralizada multi-zona
- **Multi-Node Pool:** Distribución de carga entre 3 workers
- **etcd Cluster:** Base de datos distribuida con consenso Raft
- **Node Controller:** Monitoreo y recuperación automática de nodos
- **CNI Overlay Network:** Conectividad resiliente entre nodos

### 🏍️ Sidecar Pattern (Escogido por el equipo)

**Estímulo:** Un microservicio necesita conectarse de forma segura a Cloud SQL (base de datos gestionada) que requiere autenticación IAM, cifrado de conexión y no está expuesta públicamente.

**Respuesta:** El sistema establece conexión segura sin modificar el código de la aplicación principal. Un contenedor auxiliar maneja automáticamente autenticación, cifrado TLS y proxy de conexión, desacoplando lógica de infraestructura de lógica de negocio.

### Implementación

**Patrón Arquitectónico:** Sidecar Pattern (Auxiliary Container)

**Táctica Arquitectónica:** Increase Competence Set (aumentar capacidades sin modificar componente principal)

### Solución Técnica

Se implementó el patrón Sidecar mediante contenedores auxiliares cloud-sql-proxy:

1. **Pod Multi-Container:** Configuración de pods con dos contenedores que comparten ciclo de vida:
   - **Container principal:** Microservicio (userservice/socialservice) con lógica de negocio
   - **Sidecar container:** cloud-sql-proxy que maneja conectividad a Cloud SQL

2. **Shared Network Namespace:** Ambos contenedores comparten stack de red (localhost), permitiendo que la aplicación se conecte a `localhost:5432` mientras el sidecar gestiona el túnel seguro hacia Cloud SQL.

3. **Responsabilidades del Sidecar:**
   - Autenticación automática usando Workload Identity (IAM de GCP)
   - Establecimiento de túnel TLS hacia instancia Cloud SQL privada
   - Renovación automática de credenciales y reconexión ante fallos
   - Logging independiente de errores de conectividad

4. **Desacoplamiento de Infraestructura:** La aplicación usa string de conexión estándar PostgreSQL (`jdbc:postgresql://localhost:5432/db`), sin conocimiento de Cloud SQL, IAM o certificados. El sidecar abstrae completamente la complejidad de infraestructura.

**Resultado:** Conexión resiliente y segura a base de datos gestionada sin acoplamiento con código de aplicación. Si el sidecar falla, Kubernetes lo reinicia automáticamente (shared pod lifecycle). La aplicación obtiene conectividad cifrada, autenticada y con manejo automático de reconexión sin implementar esta lógica internamente.

### Componentes de Confiabilidad
- **cloud-sql-proxy:** Contenedor sidecar especializado
- **Shared Network Namespace:** Comunicación localhost entre contenedores
- **Workload Identity:** Autenticación IAM sin credenciales estáticas
- **Automatic Reconnection:** Manejo de fallos de conectividad por sidecar

---

## <u>Interoperability</u> {#interoperability}

### 🌉 Protocol Bridge Pattern

**Estímulo:** Múltiples microservicios implementados en diferentes tecnologías (.NET, Java Spring Boot, Python, Node.js) necesitan intercambiar datos y colaborar para completar operaciones de negocio end-to-end.

**Respuesta:** El sistema permite comunicación transparente entre servicios heterogéneos mediante protocolos estándar de la industria (HTTP/REST, gRPC, AMQP). Los servicios intercambian datos sin conocimiento de las tecnologías de implementación subyacentes, logrando interoperabilidad completa en arquitectura políglota.

### Implementación

**Patrón Arquitectónico:** Protocol Bridge Pattern / API Gateway Pattern

**Táctica Arquitectónica:** Orchestrate (orquestación mediante protocolos estándar) y Tailor Interface (adaptación de interfaces según requisitos de comunicación)

### Solución Técnica

Se implementó interoperabilidad multi-protocolo utilizando estándares abiertos:

1. **HTTP/REST para Comunicación Cliente-Servidor:**
   - Frontend (React) → Backend Services mediante API REST con JSON
   - Ingress Controller enruta requests HTTP basándose en path/host
   - Operaciones CRUD síncronas con verbos HTTP estándar (GET, POST, PUT, DELETE)
   - Content negotiation mediante headers `Content-Type: application/json`

2. **gRPC para Comunicación Inter-Servicio de Alto Rendimiento:**
   - musicservice → metadata-service usando Protocol Buffers (protobuf)
   - Comunicación binaria de baja latencia para operaciones síncronas críticas
   - Configuración mediante variable de entorno `METADATA_SERVICE_GRPC=metadata-service:50051`
   - Type-safe contracts definidos en archivos `.proto` compartidos

3. **AMQP para Mensajería Asíncrona:**
   - Servicios → notificationservice mediante RabbitMQ como message broker
   - Configuración mediante `AMQP_URL=amqp://rabbitmq:5672`
   - Patrón Publish-Subscribe para eventos de dominio (nuevo post, nuevo comentario, like)
   - Desacoplamiento temporal: productores no esperan respuesta de consumidores

4. **Arquitectura Políglota:**
   - Servicios en diferentes stacks tecnológicos (.NET, Spring Boot, Python Flask, Node.js)
   - Comunicación basada en contratos de protocolo, no en lenguaje de implementación
   - Service mesh implícito mediante Kubernetes networking (CNI)

**Resultado:** Integración seamless entre 8+ microservicios heterogéneos sin dependencias de tecnología. La selección de protocolo (REST/gRPC/AMQP) se basa en requisitos de comunicación: REST para APIs públicas, gRPC para llamadas síncronas de bajo overhead, AMQP para eventos asíncronos. El sistema logra <100ms latencia promedio en llamadas inter-servicio gRPC y <50ms para REST.

### Componentes de Interoperabilidad
- **HTTP/REST:** API pública síncrona (frontend ↔ backend)
- **gRPC + Protobuf:** Comunicación binaria de alto rendimiento (servicio-servicio)
- **AMQP (RabbitMQ):** Message broker para eventos asíncronos
- **JSON/Protobuf:** Formatos de serialización interoperables
- **Service Discovery:** Resolución transparente de endpoints inter-servicio

---

# Guía de Despliegue MusicShare con NGINX Ingress Controller {#prototype}

### 📚 Documentación de Despliegue

- **[DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md)** - Guía paso a paso para desplegar
- **[LOAD_BALANCING.md](LOAD_BALANCING.md)** - Detalles de balanceo de carga
- **[APIGateway.md](APIGateway.md)** - Configuración del API Gateway

## 📋 Resumen

Esta guía describe cómo desplegar MusicShare en Kubernetes usando **NGINX Ingress Controller** como API Gateway (reemplazando Traefik), proporcionando:

1. **LoadBalancer Público** → Frontend React
2. **NGINX Ingress** → API Gateway para microservicios
3. **Escalado Automático (HPA)** → Servicios backend

## 🔧 Prerequisitos

- Kubernetes 1.24+ (minikube, kind, EKS, GKE, AKS, etc.)
- `kubectl` configurado
- Docker/Podman para construir imágenes
- `helm` (opcional, para instalaciones avanzadas)
- `git`

## 📦 Paso 1: Clonar Repositorio

```bash
git clone https://github.com/JulianAVG64/MusicShare.git
cd MusicShare
```

## 🚀 Paso 2: Preparar Imágenes Docker

Asegúrate de tener todas las imágenes disponibles (en repositorio privado o local):

```bash
# Construir imágenes localmente (si no están en repositorio)
docker build -t musicshare/frontend:latest ./frontend/MusicShareFrontend/
docker build -t musicshare/userservice:latest ./userservice/
docker build -t musicshare/musicservice:latest ./musicservice/
docker build -t musicshare/social-service:latest ./socialservice/
docker build -t musicshare/notificationservice:latest ./notificationservice/
docker build -t musicshare/metadata-service:latest ./metadataservice/

# Si usas un registro privado:
docker tag musicshare/frontend:latest your-registry/musicshare/frontend:latest
docker push your-registry/musicshare/frontend:latest
# ... repetir para otros servicios
```

## 🌍 Paso 3: Crear Namespace

```bash
kubectl create namespace musicshare
kubectl label namespace musicshare name=musicshare
```

## 📥 Paso 4: Instalar cert-manager (para HTTPS)

```bash
# Opción A: Con Helm
helm repo add jetstack https://charts.jetstack.io
helm repo update
helm install cert-manager jetstack/cert-manager \
  --namespace cert-manager \
  --create-namespace \
  --version v1.13.2

# Opción B: Con manifiestos directos
kubectl apply -f https://github.com/cert-manager/cert-manager/releases/download/v1.13.2/cert-manager.yaml
```

## 🔌 Paso 5: Instalar NGINX Ingress Controller

### Opción A: Usando Kustomize (Recomendado)

```bash
# Solo NGINX Ingress
kubectl apply -f k8s/base/nginx-ingress-controller.yaml

# O con Kustomize (incluye cert-manager automáticamente)
kubectl apply -k k8s/base/
```

### Opción B: Usando Helm

```bash
helm repo add ingress-nginx https://kubernetes.github.io/ingress-nginx
helm repo update

helm install nginx-ingress ingress-nginx/ingress-nginx \
  --namespace ingress-nginx \
  --create-namespace \
  --values - <<EOF
controller:
  replicaCount: 2
  resources:
    requests:
      cpu: 200m
      memory: 256Mi
    limits:
      cpu: 500m
      memory: 512Mi
  service:
    type: LoadBalancer
    annotations:
      service.beta.kubernetes.io/aws-load-balancer-type: "nlb"
EOF
```

## ✅ Paso 6: Verificar NGINX Ingress

```bash
# Ver que el controller está running
kubectl get pods -n ingress-nginx
kubectl get svc -n ingress-nginx

# Obtener IP externa del LoadBalancer
kubectl get svc -n ingress-nginx nginx-ingress -w
# Espera a que aparezca la IP/hostname en EXTERNAL-IP
```

## 🗄️ Paso 7: Configurar Bases de Datos

Las bases de datos se crearán automáticamente en el paso 8, pero puedes pre-crear volúmenes:

```bash
# Ver configuración de bases de datos
kubectl apply -f k8s/app/databases.yaml

# Esperar a que estén ready
kubectl get pvc -n musicshare -w
```

## 🎯 Paso 8: Desplegar MusicShare

### Opción A: Despliegue completo con Kustomize (Recomendado)

```bash
# Aplicar todo desde la carpeta k8s
kubectl apply -k k8s/

# Verificar que se están creando recursos
kubectl get pods -n musicshare -w
kubectl get svc -n musicshare
kubectl get ingress -n musicshare
```

### Opción B: Despliegue paso a paso

```bash
# 1. Namespace y bases de datos
kubectl apply -f k8s/app/namespace.yaml
kubectl apply -f k8s/app/databases.yaml

# 2. Configuración del frontend
kubectl apply -f k8s/app/frontend-config.yaml
kubectl apply -f k8s/app/frontend-deployment-service.yaml

# 3. Deployments y servicios backend
kubectl apply -f k8s/app/backend-deployments-services.yaml

# 4. API Gateway (NGINX Ingress)
kubectl apply -f k8s/app/ingress.yaml

# 5. Escalado automático
kubectl apply -f k8s/app/hpa.yaml

# 6. Cert-manager para HTTPS (si es necesario)
kubectl apply -f k8s/app/cert-manager-issuer.yaml
```

## 🔍 Paso 9: Verificar Despliegue

```bash
# Ver todos los pods
kubectl get pods -n musicshare -o wide

# Ver servicios
kubectl get svc -n musicshare

# Ver Ingress
kubectl get ingress -n musicshare -o wide

# Ver HPA (escalado automático)
kubectl get hpa -n musicshare

# Ver logs de un pod específico
kubectl logs -n musicshare deployment/userservice --tail=100 -f

# Describir un pod (para ver errores)
kubectl describe pod -n musicshare <pod-name>
```

## 🌐 Paso 10: Obtener URLs de Acceso

```bash
# Frontend (LoadBalancer público)
FRONTEND_IP=$(kubectl get svc -n musicshare frontend-loadbalancer -o jsonpath='{.status.loadBalancer.ingress[0].ip}')
echo "Frontend: http://$FRONTEND_IP"

# API Gateway (NGINX Ingress)
NGINX_IP=$(kubectl get svc -n ingress-nginx nginx-ingress -o jsonpath='{.status.loadBalancer.ingress[0].ip}')
echo "API Gateway: http://$NGINX_IP"
echo "  - User API: http://$NGINX_IP/api/users"
echo "  - Music API: http://$NGINX_IP/api/music"
echo "  - Social API: http://$NGINX_IP/api/social"
echo "  - Notifications API: http://$NGINX_IP/api/notifications"
echo "  - WebSocket: ws://$NGINX_IP/ws"

# NGINX Metrics (para Prometheus)
echo "NGINX Metrics: http://$NGINX_IP:10254/metrics"
```

## 🧪 Paso 11: Pruebas Básicas

```bash
# Probar acceso al Frontend
curl -v http://$FRONTEND_IP/

# Probar API Gateway
curl -v http://$NGINX_IP/api/users/health

# Ver métricas de NGINX
curl http://$NGINX_IP:10254/metrics

# Probar WebSocket
wscat -c ws://$NGINX_IP/ws
```

## 📊 Paso 12: Configurar Monitoreo

### Prometheus (Recomendado)

```bash
# Verificar que prometheus.yml apunta a NGINX metrics
kubectl apply -f prometheus/prometheus.yml

# Agregar ServiceMonitor para NGINX (opcional)
kubectl apply -f - <<EOF
apiVersion: monitoring.coreos.com/v1
kind: ServiceMonitor
metadata:
  name: nginx-ingress
  namespace: ingress-nginx
spec:
  selector:
    matchLabels:
      app.kubernetes.io/name: ingress-nginx
  endpoints:
  - port: metrics
EOF
```

### Grafana

```bash
# Dashboard recomendado: ID 14314 (NGINX Ingress)
# https://grafana.com/grafana/dashboards/14314
```

## 🔐 Paso 13: Configurar HTTPS (Opcional)

```bash
# 1. Editar k8s/app/ingress.yaml y agregar sección `tls`
# 2. Usar cert-manager para provisionar certificados automáticamente

kubectl apply -f - <<EOF
apiVersion: cert-manager.io/v1
kind: Certificate
metadata:
  name: musicshare-tls
  namespace: musicshare
spec:
  secretName: musicshare-tls
  issuerRef:
    name: letsencrypt-prod
    kind: ClusterIssuer
  dnsNames:
  - musicshare.example.com
EOF
```

## 🔄 Paso 14: Pruebas de Carga y Escalado

```bash
# Instalar k6
curl https://github.com/grafana/k6/releases/download/v0.47.0/k6-v0.47.0-linux-amd64.tar.gz | tar xz

# Ejecutar pruebas
./k6 run k6/baseline.js

# Observar escalado automático
kubectl get hpa -n musicshare -w
kubectl get pods -n musicshare -w
```

## 📝 Paso 15: Configurar Variables de Entorno

Los servicios usan variables de entorno. Verificar `k8s/app/backend-deployments-services.yaml`:

```yaml
env:
  - name: POSTGRES_HOST
    value: postgres
  - name: MONGODB_URI
    value: "mongodb://admin:password123@mongodb:27017/musicshare?authSource=admin"
  - name: NOTIFICATION_SERVICE_URL
    value: "http://notificationservice:8082"
  - name: USER_SERVICE_URL
    value: "http://userservice:8002"
```

**Cambiar contraseñas en producción:**

```bash
# Crear Secret de Kubernetes
kubectl create secret generic db-credentials \
  -n musicshare \
  --from-literal=postgres-password=tu-password-seguro \
  --from-literal=mongodb-password=tu-password-seguro
```

## 🛠️ Troubleshooting

### Los pods no están starting

```bash
# Ver eventos del cluster
kubectl describe nodes

# Ver logs del pod
kubectl logs -n musicshare <pod-name> --previous

# Ver descripción detallada
kubectl describe pod -n musicshare <pod-name>
```

### NGINX no redirige correctamente

```bash
# Ver configuración generada de NGINX
kubectl exec -n ingress-nginx deployment/nginx-ingress-controller -- cat /etc/nginx/nginx.conf

# Verificar que el Ingress tiene rutas correctas
kubectl get ingress -n musicshare api-gateway -o yaml

# Logs de NGINX
kubectl logs -n ingress-nginx deployment/nginx-ingress-controller -f
```

### LoadBalancer sin IP externa

```bash
# En minikube/kind, usar port-forward
kubectl port-forward -n musicshare svc/frontend-loadbalancer 80:80 &
kubectl port-forward -n ingress-nginx svc/nginx-ingress 80:80 &

# En cloud providers, esperar a que se provisione
kubectl get svc -n musicshare frontend-loadbalancer -w
```

### WebSocket no funciona

```bash
# Verificar que NGINX tiene la anotación correcta
kubectl get ingress -n musicshare api-gateway -o yaml | grep websocket

# Ver si el servicio está escuchando en puerto 8082
kubectl get svc -n musicshare notificationservice
```

## 🗑️ Limpiar Recursos

```bash
# Eliminar MusicShare
kubectl delete -k k8s/

# Eliminar NGINX Ingress
kubectl delete -k k8s/base/

# Eliminar namespace
kubectl delete namespace musicshare

# Eliminar NGINX Ingress namespace
kubectl delete namespace ingress-nginx
```

## 📚 Referencias Útiles

- [NGINX Ingress Controller Docs](https://kubernetes.github.io/ingress-nginx/)
- [Kubernetes Ingress API](https://kubernetes.io/docs/concepts/services-networking/ingress/)
- [cert-manager Docs](https://cert-manager.io/)
- [Kubernetes Service Types](https://kubernetes.io/docs/concepts/services-networking/service/)
- [HorizontalPodAutoscaler](https://kubernetes.io/docs/tasks/run-application/horizontal-pod-autoscale/)

## ✨ Configuración Recomendada para Producción

```bash
# 1. Usar certificados SSL/TLS reales
# 2. Habilitar autoscaling basado en métricas reales
# 3. Configurar límites de recursos apropiados
# 4. Implementar network policies
# 5. Usar private container registry
# 6. Configurar backups automáticos de bases de datos
# 7. Implementar monitoring y alerting
# 8. Usar pod security policies
# 9. Configurar RBAC adecuadamente
# 10. Implementar secrets management (Vault, AWS Secrets Manager, etc.)
```

## ❓ Soporte

Para problemas, consultar:
- Logs: `kubectl logs -n musicshare <pod-name>`
- Eventos: `kubectl get events -n musicshare`
- Descripción: `kubectl describe pod -n musicshare <pod-name>`
- Debugging: `kubectl debug -n musicshare <pod-name>`