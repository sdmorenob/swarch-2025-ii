# [SWARCH-L2] LABORATORIO 2

---

## Integrantes: Andrés Felipe Perdomo Uruburu, Gabriel Felipe Fonseca Guerrero

### 3.4 Preguntas

**A. ¿Cuántos componentes forman parte del sistema?**  
El sistema está compuesto por 5 elementos principales:

- Interfaz `events-fe` (Vite + Vue)
- Servicio backend `campus` (Spring Boot)
- Cliente (navegador web)
- Servicio backend `recommendations` (Python)
- Bases de datos:
  - `campus_db` (MySQL)
  - `recommendations_db` (MongoDB)

**B. ¿Qué tipos de bases de datos se emplean?**

- **MySQL** (de tipo relacional) para `campus_db`.
- **MongoDB** (orientada a documentos/NoSQL) para `recommendations_db`.

**C. Función de cada componente**

- **Cliente/Navegador**: Punto de interacción con el usuario.
- **Frontend (events-fe)**: Entrega la interfaz y consume los servicios REST del backend `campus`.
- **Backend campus**: Núcleo del sistema que gestiona los eventos, almacena información en MySQL y consulta al servicio de recomendaciones.
- **Backend recommendations**: Servicio en Python encargado de generar sugerencias y guardar resultados en MongoDB.
- **campus_db**: Base de datos relacional que guarda los eventos.
- **recommendations_db**: Base NoSQL que almacena las recomendaciones en formato de documentos.

**D. Componentes con y sin estado**

- **Sin estado**: Frontend, servicio de campus y servicio de recomendaciones (no mantienen estado interno, lo delegan a las bases de datos).
- **Con estado**: `campus_db` (MySQL) y `recommendations_db` (MongoDB).

---

### 3.5 Preguntas

**A. ¿Cuántos conectores se definen en el sistema?**  
Se identifican cinco conectores principales:

1. Cliente → Frontend (**HTTP**)
2. Frontend → Campus (**REST**)
3. Campus → campus_db (**JDBC**)
4. Campus → Recomendaciones (**gRPC**)
5. Recomendaciones → recommendations_db (**PyMongo**)

**B. ¿Qué clases de conectores se utilizan?**

- HTTP
- REST
- JDBC
- gRPC
- PyMongo

**C. ¿Los conectores son síncronos o asíncronos?**

Todos los conectores trabajan de forma **síncrona**, bajo un esquema de solicitud/respuesta:  
HTTP, REST, JDBC, gRPC y PyMongo.

---

### Bonus: Observación sobre mala práctica en el proyecto Campus

En el backend de Campus se detecta que las entidades **JPA** se exponen directamente en los controladores, utilizándolas como si fueran DTO.  
Esto representa una mala práctica, ya que mezcla la lógica de persistencia con la capa de presentación y puede revelar información sensible.  
La mejor opción es implementar **DTO** o modelos específicos para la comunicación en la API.

### Evidencia

![Recommended Events Screenshot](C:\Users\Andrés Felipe\Downloads\evidencia.png)
