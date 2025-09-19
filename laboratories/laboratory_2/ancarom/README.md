# Laboratorio 2: Componentes y Conectores

**Nombre:** Andres David Caro Mora

---

## 1. Descripción de Componentes

A continuación, se describen los componentes identificados en el sistema, analizando el archivo `docker-compose.yaml` como base.

**A. ¿Cuántos componentes son parte del sistema?**

El sistema está compuesto por **5 componentes** principales, orquestados a través de Docker Compose.

**B. ¿Qué tipos de bases de datos están presentes en el sistema?**

Hay dos tipos de bases de datos en la arquitectura:
* Una base de datos relacional: **MySQL** (`event-db`).
* Una base de datos NoSQL orientada a documentos: **MongoDB** (`recommendation-db`).

**C. y D. ¿Cuál es el alcance y el estado (stateless/stateful) de cada componente?**

| Componente          | Alcance (Responsabilidad)                                   | Estado       |
| ------------------- | ----------------------------------------------------------- | ------------ |
| `frontend`          | Provee la interfaz de usuario web con la que interactúa el cliente. | `Stateless`  |
| `campus`            | Actúa como API Gateway y servicio principal. Orquesta la lógica de negocio. | `Stateless`  |
| `recommendations`   | Microservicio especializado en generar recomendaciones de eventos. | `Stateless`  |
| `event-db`          | Almacena de forma persistente los datos principales (eventos, usuarios, RSVPs). | **`Stateful`** |
| `recommendation-db` | Almacena de forma persistente los datos necesarios para las recomendaciones. | **`Stateful`** |

---

## 2. Descripción de Conectores

Se identificaron 4 flujos de comunicación principales en el sistema, que utilizan 3 tipos de conectores distintos.

**A. ¿Cuántos conectores tiene el sistema?**

El sistema tiene **4 conectores** (enlaces de comunicación distintos).

**B. y C. ¿Qué tipos de conectores se usan y son síncronos o asíncronos?**

Todos los conectores identificados en este sistema operan de manera **síncrona**.

| # | Tipo de Conector           | Participantes                               | Descripción                                                                 |
|---|----------------------------|---------------------------------------------|-----------------------------------------------------------------------------|
| 1 | **API REST (HTTP)** | `Cliente Externo` → `campus`                | Expone los servicios al mundo exterior a través de un protocolo estándar (JSON sobre HTTP).   |
| 2 | **gRPC** | `campus` → `recommendations`                | Comunicación interna de alto rendimiento entre microservicios, usando un formato binario. |
| 3 | **Driver de Base de Datos (MySQL)** | `campus` → `event-db`                       | Conexión específica para la persistencia y consulta de datos en la base de datos relacional. |
| 4 | **Driver de Base de Datos (MongoDB)** | `recommendations` → `recommendation-db`   | Conexión específica para la persistencia y consulta de datos en la base de datos NoSQL. |

---

## 3. Vista de Componentes y Conectores

El siguiente diagrama muestra la relación entre los componentes y los conectores que los unen, utilizando una notación semi-formal.

![Diagrama de Componentes y Conectores](/image.png)

---

## 4. Bonus (Opcional)

**¿Cuál es la mala práctica vista con los modelos de entidad de la BD en el proyecto Spring (campus)?**

La mala práctica más probable en el proyecto es **exponer las entidades de la base de datos (`@Entity`) directamente a través de la API en los controladores (`@RestController`)**.

**¿Por qué es una mala práctica?**

1.  **Acoplamiento Fuerte:** Se acopla la representación de la API directamente a la estructura de la base de datos. Cualquier cambio en la tabla de la base de datos (ej. renombrar una columna) romperá el contrato de la API.
2.  **Exposición de Datos Sensibles:** Es fácil exponer accidentalmente campos internos o sensibles que no deberían ser visibles para el cliente (ej. contraseñas hasheadas, timestamps de auditoría, etc.).
3.  **Falta de Flexibilidad:** Limita la capacidad de optimizar la respuesta de la API para diferentes clientes. La estructura de la respuesta queda rígidamente definida por la estructura de la base de datos.

La solución correcta es usar **DTOs (Data Transfer Objects)**, que son clases simples diseñadas específicamente para definir la estructura de los datos que entran y salen de la API, desacoplando así la capa de API de la capa de persistencia.
