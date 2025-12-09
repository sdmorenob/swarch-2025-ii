# TaskNotes – Prototype 4

## 1. Artifact

### Team
- **Team Name:** [Cuervos Team]
- **Members:**
  - [Jorge Andrés Torres Leal]
  - [Javier Andrés Carrillo Carrasco]
  - [Kevin Julian Gonzalez Guerra]
  - [Gabriel Castiblanco Céspedes]
  - [Lizeth Mariana Garcia Duarte]
  - [Michael Daniels Oviedo Quiroga]
  - [Javier Esteban Martinez Giron]

### Software System
- **Name:** TaskNotes
- **Logo:** ![TaskNotes Logo](docs/Logo_TaskNotes.png)
- **Description:**  
  TaskNotes es un sistema para gestionar tareas y notas con categorías y etiquetas. Incluye búsqueda full‑text sobre notas, vista de panel con previsualizaciones y sincronización en tiempo real por WebSockets.

---

## 2. Functional and Non-Functional Requirements

### Functional Requirements
  - Crear, listar, editar y eliminar tareas (PostgreSQL) con prioridad, fecha de vencimiento, categoría y etiquetas.
  - Crear, listar, editar y eliminar notas (MongoDB) con categoría y etiquetas.
  - Previsualización de tareas y notas desde el dashboard (no edición directa).
  - Búsqueda full‑text de notas por contenido/título con filtros (categoría/etiquetas) vía microservicio de búsqueda.

### Non-Functional Requirements
- The software system must respond to at least four different reliability (high
availability, resilience or fault tolerance) scenarios:
- In scenario 1: the software system must implement the Replication Pattern.
- In scenario 2: the software system must implement the Service Discovery
Pattern.
- In scenario 3: the software system must implement the Cluster Pattern.
- In scenario 4: the software system must implement a pattern defined by the
team.
- The software system must respond to an interoperability scenario.
- Security scenarios of Prototype 3 must be ensured again during the architectural
redesign to be carried out for reliability.
- Performance and scalability scenarios of Prototype 3 must be revalidated during
the architectural redesign to ensure system reliability. The redesign must explicitly
address scalability by adopting an autoscaling method to handle variable
workloads efficiently. Comprehensive performance testing is required again to
confirm that the autoscaling approach meets reliability and scalability objectives.

---

## 3. Architectural Structures

### Component-and-Connector (C&C) Structure
- **C&C View:**  
  [Diagrama C&C]
- **Description of architectural styles and patterns used:**  
  [Microservicios, API Gateway, DB-per-service, etc.]
- **Description of architectural elements and relations:**  
  [Explicación de componentes y cómo se comunican]

### Layered Structure
- **Layered View:**  
  [Diagrama de capas]
- **Description of architectural patterns used (if applicable):**  
  [Ejemplo: Presentación, Lógica, Datos]
- **Description of architectural elements and relations:**  
  [Explicación de capas y sus relaciones]

### Deployment Structure
- **Deployment View:**  
  [Diagrama de despliegue en AWS/Kubernetes]
- **Description of architectural patterns used (if applicable):**  
  [Cluster, Replication, Service Discovery, Autoscaling, etc.]
- **Description of architectural elements and relations:**  
  [Explicación de nodos, pods, servicios, redes, etc.]

### Decomposition Structure
- **Decomposition View:**  
  [Diagrama de descomposición]
- **Description of architectural elements and relations:**  
  [Explicación de módulos, paquetes, microservicios]

---

## 4. Quality Attributes

### Security
- **Security scenarios:**  
  [Lista de escenarios de seguridad]
- **Applied architectural tactics:**  
  [Ejemplo: TLS, JWT, mTLS, segmentación de red]
- **Applied architectural patterns:**  
  [Ejemplo: API Gateway, Zero Trust, etc.]

### Performance and Scalability
- **Performance scenarios:**  
  [Escenarios de carga, concurrencia, etc.]
- **Applied architectural tactics:**  
  [Ejemplo: Cache Aside, Rate Limiting, HPA]
- **Applied architectural patterns:**  
  [Ejemplo: Autoscaling, Load Balancer]
- **Performance testing analysis and results:**  
  [Resultados de pruebas con k6, métricas, análisis]

### Reliability
- **Reliability scenarios:**  
  [Escenarios de alta disponibilidad, tolerancia a fallos, resiliencia]
- **Applied architectural tactics:**  
  [Ejemplo: Replication, Cluster, Service Discovery]
- **Applied architectural patterns:**  
  [Patrones implementados en K8s]

### Interoperability
- **Interoperability scenario:**  
  [Escenario de interoperabilidad REST/gRPC]
- **Applied architectural tactics:**  
  [Ejemplo: DNS interno, API Gateway]
- **Applied architectural patterns:**  
  [Ejemplo: Service Mesh, API Gateway]

---

## 5. Prototype

### Instructions for deploying the software system locally
- [Pasos para desplegar con Docker Compose]
- [Pasos para desplegar en Kubernetes (Minikube/AWS EKS)]
- [Variables de entorno, configuración, comandos útiles]

---

**Notas:**  
- Agrega diagramas, tablas y ejemplos donde corresponda.  
- Incluye referencias a los archivos de configuración y manifests relevantes.  
- Documenta cualquier decisión arquitectónica importante.
