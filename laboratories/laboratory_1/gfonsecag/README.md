# Laboratory 1 - Monolithic System with Flask and MySQL

## 📊 Graphical representation of the system structure(s)

<img width="1097" height="253" alt="image" src="https://github.com/user-attachments/assets/373d8bfb-716b-41ff-91d7-287261a51312" />

------------------------------------------------------------------------

## ⚙️ Five Identified System Properties

### Modularity

The system is divided into layers (templates, controllers, services,
repositories, and models).\
Each layer has a clear responsibility, which improves code organization
and comprehension.

### Maintainability

Separation of concerns allows developers to modify or extend
functionality in one layer without heavily impacting others.\
Example: A new repository can be added without touching controllers.

### Portability

The use of Docker ensures that the system can run consistently across
different environments (developer machines, test servers, production).\
Deployment is simplified with `docker-compose up --build`.

### Scalability (Vertical)

Although the architecture is monolithic, it can handle increased load by
allocating more resources (CPU, RAM) to the container.\
Future migration to microservices is possible thanks to the layered
design.

### Availability

The system uses MySQL with environment-based configuration, ensuring the
application can connect to the database reliably.\
Docker containers can be restarted automatically if one of the services
fails.
