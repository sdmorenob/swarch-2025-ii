# Laboratory 1 – Deliverable

## 1. Graphical Representation of the System Structure

El sistema sigue un **estilo arquitectónico monolítico** con un enfoque cliente-servidor.  
Se divide en dos componentes principales:

- **Monolith (Flask App)**: Implementado en Python, con una arquitectura en capas:  
  - Templates  
  - Controllers  
  - Services  
  - Repositories  
  - Models  

- **Database (MySQL)**: Motor de base de datos relacional.

La comunicación entre componentes se realiza a través de SQLAlchemy (ORM).  
El despliegue se maneja con Docker y docker-compose.

### Diagrama de arquitectura

```mermaid
flowchart TD
    subgraph Client
        Browser["Web Browser"]
    end

    subgraph Monolith["Flask Monolith"]
        Templates --> Controllers
        Controllers --> Services
        Services --> Repositories
        Repositories --> Models
    end

    subgraph Database["MySQL Database"]
        DB[(swarch_db)]
    end

    Browser <-- HTTP (5000) --> Monolith
    Models <-- SQLAlchemy --> DB

