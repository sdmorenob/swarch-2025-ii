# # [SwArch - 2025II] - Laboratory 2 

---

### 📌 Diagrama de Componentes y Conectores (Notación Semi-formal)

![Diagram_of_components_lab2](https://github.com/user-attachments/assets/5f03a3f8-0603-48ed-af3e-c21f81f5872b)

---

## 🔎 Análisis de Componentes

**A. ¿Cuántos componentes forman parte del sistema?**

**5 componentes**:

1. **Frontend (events-fe)** - Interfaz de usuario
2. **Campus** - Servicio de gestión de eventos
3. **Recommendations** - Servicio de recomendaciones
4. **Event-db** - Base de datos de eventos (MySQL)
5. **Recommendation-db** - Base de datos de recomendaciones (MongoDB)

**B. ¿Qué tipos de bases de datos están presentes en el sistema?**

**2 tipos de bases de datos**:

1. **MySQL 8.0** (event-db):
   - Base de datos SQL
   - Almacena eventos del campus, usuarios y RSVPs

2. **MongoDB 6** (recommendation-db):
   - Base de datos NoSQL 
   - Almacena datos de recomendaciones y patrones de usuario

**C. ¿Cuál es el alcance de cada componente dentro de la arquitectura?**

| Componente            | Alcance            | Responsabilidades |
|-----------------------|-------------------|-------------------|
| **Frontend**          | Presentación      | - Construcción de la interfaz gráfica con Vue.js<br/>- Mostrar al usuario los eventos y sugerencias<br/>- Captura y envío de acciones del usuario |
| **Campus**            | Lógica de Negocio | - Exponer API REST para operaciones sobre eventos<br/>- Coordinar la interacción entre servicios<br/>- Consumir resultados del servicio de recomendaciones |
| **Recommendations**   | Lógica de Negocio | - Generar sugerencias de eventos a partir de datos<br/>- Proveer endpoints REST para el backend<br/>- Procesar información de usuarios para recomendaciones |
| **Event-db**          | Persistencia      | - Guardar y consultar información de eventos<br/>- Mantener datos de usuarios y confirmaciones (RSVP)<br/>- Asegurar consistencia mediante transacciones |
| **Recommendation-db** | Persistencia      | - Conservar datos de entrenamiento y consulta para recomendaciones<br/>- Registrar patrones de interacción de usuarios<br/>- Soportar crecimiento mediante un modelo flexible y distribuido |



**D. ¿Qué componentes son stateless vs. stateful?**

**Componentes Stateless (proceso):**
- **Frontend**
- **Campus**
- **Recommendations**

**Componentes Stateful (datos):**
- **Event-db (MySQL)**
- **Recommendation-db (MongoDB)**

---

## 🔗 Análisis de Conectores

**A. ¿Cuántos conectores tiene el sistema?**

**5 conectores:**
- Navegador → frontend (**HTTP**)  
- frontend → campus (**REST/HTTP**)  
- campus → recommendations (**REST/HTTP**)  
- campus → event-db (**MySQL/JDBC**)  
- recommendations → recommendation-db (**Mongo/driver**)  

**B. ¿Qué tipos de conectores se utilizan?**

- **HTTP/REST** (cliente → frontend, frontend → backend, backend → servicio).  
- **Conectores de base de datos**: **JDBC (MySQL)** y **driver MongoDB**.

**C. ¿Los conectores son síncronos o asíncronos?**

Todos los conectores son **síncronos** (HTTP/REST y acceso directo a BD por driver/JDBC).  

---

## ✅ Conclusiones

- El sistema analizado se compone de **cinco elementos principales**: un **frontend** en Vue.js, un **backend (campus)** en Spring Boot, un **servicio de recomendaciones** en FastAPI, y dos **bases de datos heterogéneas** (MySQL relacional y MongoDB documental).  

- La arquitectura sigue el **estilo de Componentes y Conectores (C&C)**: cada servicio es un **componente independiente** que se comunica a través de **conectores bien definidos** (REST/HTTP, JDBC, driver MongoDB).  

- Se logró identificar claramente los **límites de cada componente**, sus **responsabilidades** y si son **stateless** o **stateful**. Los servicios de negocio (`frontend`, `campus`, `recommendations`) son **stateless**, mientras que las bases de datos (`event-db`, `recommendation-db`) son **stateful**.  

- Los **conectores son todos síncronos**, lo que simplifica la interacción y hace predecible el flujo de datos. Esto refuerza el aprendizaje sobre cómo las decisiones arquitectónicas afectan la **dinámica del sistema**.  

- La práctica permitió aplicar en un caso real lo visto en clase: un sistema puede tener múltiples estilos combinados, pero la **vista C&C** ayuda a comprender cómo se conectan los elementos en tiempo de ejecución y a documentarlo con notación semiformal (UML con lollipop/socket).  

- Para finalizar, el laboratorio sirvió como un **primer acercamiento práctico** a la identificación, clasificación y documentación de **componentes y conectores** en una arquitectura de software, consolidando la teoría con una implementación real en Docker.  


