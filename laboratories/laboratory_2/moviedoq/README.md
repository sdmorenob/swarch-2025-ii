# Laboratory 2 

 Michael Daniels Oviedo Quiroga  
 Software Architecture 2025-II  
 September 18  

---

## 3.3 Classify the Components

**A. How many components are part of the system?**  

El sistema tiene **5 componentes** definidos en el `docker-compose.yaml`:  
- `frontend` (interfaz de usuario)  
- `campus` (backend principal)  
- `recommendations` (servicio de recomendaciones)  
- `event-db` (base de datos MySQL)  
- `recommendation-db` (base de datos MongoDB)  


---


**B. What types of databases are present in the system?**  
El sistema utiliza dos tipos de bases de datos:  
- **MySQL (Base de datos relacional)** `event-db`  
- **MongoDB (Base de datos NoSQL, documental)**  `recommendation-db`  

---

**C. What is the scope of each component within the architecture?**  
- **frontend** → Maneja la interfaz que usan los usuarios.  
- **campus** → Es el backend principal, gestiona la lógica de negocio y se conecta a la base de datos de eventos y al servicio de recomendaciones.  
- **recommendations** → Servicio que se encarga de la lógica de recomendaciones.  
- **event-db** → Base de datos relacional donde se almacenan los eventos.  
- **recommendation-db** → Base de datos donde se almacenan los datos de las recomendaciones.  

---

**D. Which components are stateless vs. stateful?**  
- **Stateless**: `frontend`, `campus`, `recommendations`  (procesan y responden, pero no guardan estado propio)
- **Stateful**: `event-db`, `recommendation-db`  (almacenan y mantienen el estado de la información).

---

## 3.4 Discover the Connectors

**A. How many connectors does the system have?**  
El sistema tiene **4 conectores**:  
- `frontend → campus` (HTTP)  
- `campus → event-db` (JDBC/MySQL)  
- `campus → recommendations` (HTTP/REST)  
- `recommendations → recommendation-db` (driver de MongoDB)  

---

**B. What types of connectors are used?**  
- **HTTP/REST** (frontend ↔ campus, campus ↔ recommendations)  
- **JDBC/MySQL** (campus ↔ event-db)  
- **Driver MongoDB** (recommendations ↔ recommendation-db)  

---

**C. Are connectors synchronous or asynchronous?**  
Todos los conectores identificados son **síncronos**.  
No se definieron colas de mensajes ni otros conectores asíncronos en el `docker-compose.yaml`.  

---

## Component-and-Connector View using semi-formal notation.
![Component-and-Connector View](./components.png)
