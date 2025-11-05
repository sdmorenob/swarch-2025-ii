# Laboratorio 1- Moviedoq - 1010132970
## Representación gráfica del sistema

                ┌────────────────────┐
                │      Client        │
                │ (Web Browser)      │
                └─────────┬──────────┘
                          │ HTTP
                          ▼
                 ┌───────────────────┐
                 │     Monolith      │
                 │  (Flask + MySQL)  │
                 ├───────────────────┤
                 │  Templates (UI)   │
                 │  Controllers      │
                 │  Services         │
                 │  Repositories     │
                 │  Models           │
                 └─────────┬─────────┘
                           │ SQLAlchemy
                           ▼
                 ┌───────────────────────┐
                 │       Database        │
                 │     MySQL (Docker)    │
                 └───────────────────────┘


# Propiedades

 - Se destaca la arquitectura en capas

**Templates (UI)** → Vista.
**Controllers** → Manejan rutas y peticiones.
  **Services** → Contienen la lógica
**Repositories** → Encapsulan el acceso a la base de datos.
**Models** → Definen el dominio de datos

 -Se usa **Docker** y `docker-compose`, lo que significa que:
-   El sistema puede ejecutarse igual en cualquier entorno (desarrollo, pruebas, producción).
    
-   El stack completo (app + base de datos) se levanta con un solo comando.

 -Gracias al patrón en capas, repositorios, y uso de servicios bien definidos, es sencillo agregar nuevas funciones o cambiar reglas sin reescribir todo.


 -Usa `SECRET_KEY` para proteger sesiones y mensajes Flash.

 -La aplicación tiene una interfaz web HTML clara, con navegación simple entre libros y géneros
