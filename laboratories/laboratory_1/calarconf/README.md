# Software Architecture Laboratory 1 - Book Management System

## System Architecture

### Arquitectura de contenedores(Container Architecture)
```mermaid
graph TB
    subgraph "Cliente"
        Browser[Web Browser<br/>localhost:5000]
    end
    
    subgraph "Docker Network"
        subgraph "swarch-mo Container"
            Flask[Flask Application<br/>Python 3.12<br/>Port: 5000]
            subgraph "Application Layers"
                Controllers[Controllers<br/>book_controller.py<br/>genre_controller.py]
                Services[Services<br/>book_service.py<br/>genre_service.py]
                Repositories[Repositories<br/>book_repository.py<br/>genre_repository.py]
                Models[Models<br/>book.py<br/>literary_genre.py]
            end
        end
        
        subgraph "swarch-db Container"
            MySQL[MySQL 8.0<br/>Database: swarch_db<br/>Port: 3306]
            Tables[Tables<br/>books<br/>literary_genres]
        end
    end
    
    Browser -->|HTTP Requests| Flask
    Controllers --> Services
    Services --> Repositories
    Repositories --> Models
    Flask -->|SQLAlchemy<br/>PyMySQL| MySQL
    MySQL --> Tables
    
    style Browser fill:#e1f5fe
    style Flask fill:#f3e5f5
    style MySQL fill:#e8f5e8
    style Controllers fill:#fff3e0
    style Services fill:#fce4ec
    style Repositories fill:#f1f8e9
    style Models fill:#e0f2f1

```
### Arquitectura de capas (Layered Architecture)
```mermaid
graph TB
    subgraph "Presentation Layer"
        Templates[HTML Templates<br/>base.html<br/>book_list.html<br/>book_create.html<br/>genre_list.html<br/>genre_create.html]
        Controllers[Controllers<br/>Request Handling<br/>Response Generation]
    end
    
    subgraph "Business Logic Layer"
        Services[Services<br/>Business Rules<br/>Data Validation<br/>Processing Logic]
    end
    
    subgraph "Data Access Layer"
        Repositories[Repositories<br/>Database Operations<br/>Query Abstraction<br/>CRUD Operations]
        Models[Domain Models<br/>SQLAlchemy ORM<br/>Entity Definitions]
    end
    
    subgraph "Data Storage Layer"
        Database[MySQL Database<br/>Persistent Storage<br/>ACID Transactions]
    end
    
    Templates --> Controllers
    Controllers --> Services
    Services --> Repositories
    Repositories --> Models
    Models --> Database
    
    Templates -.->|Renders| Controllers
    Controllers -.->|Business Logic| Services
    Services -.->|Data Access| Repositories
    Repositories -.->|ORM Mapping| Models
    Models -.->|SQL Queries| Database
    
    style Templates fill:#e3f2fd
    style Controllers fill:#e8f5e8
    style Services fill:#fff3e0
    style Repositories fill:#fce4ec
    style Models fill:#f1f8e9
    style Database fill:#e0f2f1
```
## System Properties

### 1. Modularidad (Modularity)
**Descripción**: El sistema implementa una arquitectura modular basada en el patrón MVC (Model-View-Controller) y Repository Pattern, donde cada componente tiene responsabilidades específicas y bien definidas.

**Evidencia técnica**:
- Separación clara entre controladores (`book_controller.py`, `genre_controller.py`)
- Servicios de negocio independientes (`book_service.py`, `genre_service.py`)
- Repositorios para acceso a datos (`book_repository.py`, `genre_repository.py`)
- Modelos de dominio separados (`book.py`, `literary_genre.py`)
- Configuración centralizada en `config.py`

**Beneficios**: Facilita el mantenimiento, testing unitario, y desarrollo paralelo de diferentes módulos.

### 2. Escalabilidad (Scalability)
**Descripción**: La arquitectura permite escalamiento tanto horizontal como vertical mediante contenedores Docker y separación de la capa de datos.

**Evidencia técnica**:
- Contenedorización con Docker permite replicar instancias de la aplicación
- Base de datos MySQL separada en contenedor independiente
- Uso de SQLAlchemy ORM que soporta connection pooling
- Arquitectura stateless en la capa de aplicación
- Posibilidad de implementar load balancing entre múltiples instancias

**Beneficios**: El sistema puede manejar mayor carga agregando más contenedores Flask y escalando la base de datos independientemente.

### 3. Mantenibilidad (Maintainability)
**Descripción**: El código está organizado siguiendo principios SOLID y patrones arquitectónicos que facilitan las modificaciones y extensiones futuras.

**Evidencia técnica**:
- Patrón Repository que abstrae el acceso a datos
- Separación de responsabilidades en capas bien definidas
- Uso de Blueprints de Flask para organizar rutas
- Configuración externalizada y ambiente-específica
- Estructura de directorios clara y convencional
- Uso de Flask-Migrate para control de versiones de base de datos

**Beneficios**: Cambios en una capa no afectan otras capas, facilita debugging y adición de nuevas funcionalidades.


### 4. Portabilidad (Portability)
**Descripción**: El sistema es completamente portable gracias a la contenedorización y manejo de dependencias, pudiendo ejecutarse en cualquier ambiente que soporte Docker.

**Evidencia técnica**:
- Docker Compose para orquestación multi-contenedor
- Dockerfile con especificación exacta del ambiente Python
- `requirements.txt` para manejo determinístico de dependencias
- Variables de ambiente para configuración específica del entorno
- Base de datos MySQL en contenedor con configuración estandarizada
- No dependencias del sistema operativo host

**Beneficios**: Deployment consistente entre desarrollo, testing y producción.

### 5. Separación de Responsabilidades (Separation of Concerns)
**Descripción**: Cada componente del sistema tiene una responsabilidad única y bien definida, siguiendo el principio de Single Responsibility Principle (SRP).

**Evidencia técnica**:
- **Controllers**: Manejan únicamente requests HTTP y responses
- **Services**: Contienen exclusivamente lógica de negocio y validaciones
- **Repositories**: Realizan solo operaciones de persistencia y consultas
- **Models**: Definen únicamente la estructura de datos y relaciones
- **Templates**: Se encargan solo de la presentación visual
- **Config**: Maneja únicamente configuración de la aplicación

**Beneficios**: Código más testeable, modificable y comprensible. Cada cambio tiene un scope limitado y predecible.





