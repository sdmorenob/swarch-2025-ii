# SwArch-2025-II
# Laboratorio 1 - Diseño y Despliegue de un Monolito.

### Objetivo del Laboratorio

Diseñar, construir, desplegar y validar un sistema monolítico por capas (Flask + MySQL) contenerizado con Docker Compose, para comprender y representar gráficamente sus estructuras (despliegue y capas) y describir cinco propiedades del sistema usando el dominio mínimo de géneros y libros.

### Diagramas de Arquitectura

#### 1. **Diagrama de Despliegue** 

<img width="3840" height="861" alt="diagram_deploy" src="https://github.com/user-attachments/assets/28a88eb8-a7a2-43bb-9d0e-41c0472c6d9f" /> 
**Este diagrama muestra la arquitectura física del sistema, representando la infraestructura de Docker. Ilustra cómo el monolito de Flask (swarch-mo) y la base de datos MySQL (swarch-db) se ejecutan en contenedores separados, interconectados dentro de una red de Docker, y cómo la aplicación es accesible a través del puerto 5000.**


#### 2. **Diagrama de Componentes**
 <img width="2414" height="3840" alt="Untitled diagram _ Mermaid Chart-2025-09-04-232829" src="https://github.com/user-attachments/assets/57ebabf6-9262-49c3-89b1-f76f62be40b7" />
**Este diagrama ilustra la arquitectura lógica del monolito. Detalla la estructura en capas del sistema (Controllers, Services, Repositories, Models, Templates) y las dependencias que existen entre ellas, mostrando el flujo de la lógica de negocio, desde el cliente hasta la base de datos a través del ORM SQLAlchemy.**


### Propiedades del Sistema

#### 1. Portabilidad
El uso de Docker hace el sistema portable: el mismo entorno se ejecuta en cualquier plataforma (Docker Desktop, servidores o nube) sin conflictos de dependencias.
#### 2. Mantenibilidad
El diseño por capas del monolito facilita el mantenimiento. La separación de responsabilidades permite modificar o añadir funcionalidades sin afectar otras partes del código.
#### 3. Escalabilidad
Docker habilita la escalabilidad horizontal: se pueden levantar múltiples instancias para distribuir la carga y atender más usuarios.
#### 4. Usabilidad
La interfaz web en Flask es intencionalmente simple: rutas claras y formularios directos hacen el uso intuitivo para el usuario.
#### 5. Desplegabilidad
Todo el sistema se levanta con un solo comando (`docker compose up --build`) y puede reconstruirse limpio cuando se necesite (`docker compose down -v`). Esto facilita ejecutar la solución en cualquier máquina de forma consistente.
