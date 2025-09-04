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
````

---

## 2. Identified System Properties

A continuación, se describen cinco propiedades del sistema diseñado:

1. **Modularidad**
   El sistema sigue una arquitectura en capas dentro del monolito, lo cual permite separar responsabilidades (presentación, lógica de negocio, acceso a datos). Esto facilita la mantenibilidad y escalabilidad del código.

2. **Desplegabilidad**
   El uso de **Docker** y **docker-compose** permite que el sistema pueda levantarse en cualquier entorno con un único comando (`docker-compose up --build`). Esto asegura portabilidad y repetibilidad del despliegue.

3. **Persistencia**
   Gracias al uso de MySQL, los datos de libros y géneros se almacenan de forma persistente, independiente del ciclo de vida de los contenedores de la aplicación.

4. **Escalabilidad Horizontal Limitada**
   Aunque el sistema es monolítico, el diseño con contenedores permite replicar el servicio de aplicación (Flask) y balancear carga, aunque con las restricciones propias de la arquitectura monolítica.

5. **Usabilidad**
   La interfaz web construida con Flask y templates HTML proporciona una experiencia sencilla e intuitiva para el usuario final, con formularios básicos para gestionar libros y géneros.

---

