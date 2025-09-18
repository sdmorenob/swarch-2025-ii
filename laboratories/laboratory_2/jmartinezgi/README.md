# Laboratorio 2 – Arquitectura de Componentes - Javier Esteban Martinez Giron

## 1. Clasificación de Componentes

| Componente         | Tipo        | Lenguaje   | Framework/Sistema | Puerto(s) | Dependencias                  |
|--------------------|------------|------------|-------------------|-----------|-------------------------------|
| **events-fe**      | FrontEnd   | JavaScript | Vue.js            | 80        | campus                        |
| **campus**         | BackEnd    | Java       | Spring            | 8080      | event-db, recomendations      |
| **recomendations** | BackEnd    | Python     | FastAPI           | 8000      | recomendations-db             |
| **event-db**       | Database   | SQL        | MySQL v8.0        | 3306      | —                             |
| **recomendations-db** | Database | NoSQL      | MongoDB v6.0      | 27017     | —                             |

## 2. Respuestas a Preguntas de Componentes

**A. ¿Cuántos componentes hacen parte del sistema?**  
Respuesta: Son 5 componentes: 1 FrontEnd, 2 BackEnd y 2 bases de datos.

**B. ¿Qué tipos de bases de datos están presentes en el sistema?**  
Respuesta: Se usan 2 tipos de bases de datos:  
- SQL (MySQL v8.0, event-db)  
- NoSQL (MongoDB v6.0, recomendations-db)

**C. ¿Cuál es el alcance de cada componente dentro de la arquitectura?**
- **events-fe:** Interfaz de usuario, consume servicios de campus.
- **campus:** Lógica de negocio principal, conecta con event-db y recomendations.
- **recomendations:** Servicio de recomendaciones, gestiona datos en recomendations-db.
- **event-db:** Almacena eventos, accesible por campus.
- **recomendations-db:** Almacena datos de recomendaciones, accesible por recomendations.

**D. ¿Cuáles componentes son stateless y cuáles son stateful?**
- **Stateless:** events-fe, campus, recomendations son compnentes stateless, pues, no tienen persistencia de la interacción de los usuarios.
- **Stateful:** event-db, recomendations-db son statefull, pues, persisten los datos de las interacciónes que realizan los usuarios.

## 3. Identificación de conectores:

| Conector                                   | Tipo de conector | Especificación       | Sincronía      |
|--------------------------------------------|------------------|----------------------|----------------|
| **events-fe - campus**                     | REST             | HTTP/JSON            | Asíncrona      |
| **campus - event-db**                      | DB Connector     | SQL/TCP              | Asíncrona      |
| **campus - recomendations**                | gRPC             | HTTP/2/Protobuf      | Asíncrona      |
| **recomendations - recomendations-db**     | DB Connector     | MongoDB/TCP          | Asíncrona      |

\* Se consideran asíncronas pues, al revisar los archivos de cada componente y su funcionamiento, se identifica la implementación de este tipo de comunicación.

## 4. Respuestas a Preguntas de conectores

**A. ¿Cúantos conectores tiene el sistema?**  
Respuesta: 4 Conectores.

**B. ¿Qué tipos de conectores se usan?**  
Respuesta: REST, gRPC y DB Connector.

**C. ¿Los conectores son síncronos o asíncronos?**
Respuesta: Son asíncronos, pues por lo revisado en los diferentes archivos se evidencía este tipo de comunicación, además, se podría considerar que la aplicación sigue aceptando interacciónes del usuario.

## 5. Respuestas a Pregunta Bonos

**A. En el proyecto de Spring (campus), ¿cuál es la mala práctica que se observa con los modelos de entidad de la base de datos?**
Respuesta: Se evidencia el uso de la palabra reservada **record** en los modelos, lo cual es otra forma de definir objetos que almacenan datos (dataobject), una desventaja es que son menos flexibles, pues, no permiten modificar los registros despues de creados. Mientras **class** es más flexible, permitiendo modificar los registros.

## 6. Diagrama Componente-Conector

![Diagrama component-Conector](SoftArch-LAB2.drawio.svg)