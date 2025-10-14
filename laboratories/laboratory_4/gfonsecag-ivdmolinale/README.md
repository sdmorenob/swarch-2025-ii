Gabriel Felipe Fonseca Guerrero
Ivan David Molina
# 2.Patterns Deconstruction
- 1-Microfrontends 
- 2-Log aggregation
## A. In your own technical words, what is the fundamental problem that the Microfrontends pattern aims to solve? How does it solve it?
- 1) El problema que busca resolver es que todo el frontend esté agrupado en único pedazo de código con la misma técnología, como un monolíto. La razón de que sea un problema es que requiere de mayor coordinación, menor flexibilidad, modularidad, pueden afectarse otras partes de front implementando un cambio. Lo que resuelve, en vez de tenerlo en un solo bloque, modulariza, y crea micro-frontends que los vuelve independientes, corrigiendo los defectos que se nombraron anteriormente
- 2) El problema fundamental es que cuando se tienen muchos microservicios, un evento de error puede estar relacionado con cientos de servicios y no hay un registro para el entendimiento del error. La forma en que resuelve este problema es centralizar los registros, trazas y métricas para mayor capacidad de busqueda y analizis 
## B. How does this pattern impact system coupling and cohesion? 
- 1) No afecta el acoplamiento entre servicios en el backend, pero si afecta y modifica el frontend. Respecto al acomplamiento, busca minimizar las dependencias entre diferentes partes de la interfaz. Al reducir el acoplamiento puede evolucionar y actualizarse de forma independiente si afectar al resto del sistema. Además con la cohesión, cada microfronend está diseñado para tener una alta cohesión, mejor dicho que todos sus componentes y código estén fuertemente relacionados y trabajan para implementar una funcionalidad específica.
- 2) De manera similar reduce el acomplamiento y aumenta la cohesión la diferencia radica en que gira en torno a que cada componente ya no necesita saber como interactua o intercambia información con otros para el registro de eventos ya que los logs se envían a un sistema de agregación centralizado.
## C. Explain the fundamental mechanism of the pattern.
- 1) Para el microfronend se divide un todo cohesivo (una aplicación grande) en fragmentos más pequeños e independientes que se pueden desarrollar, implementar y desplegar pro separado, estós se integran en tiempo de ejecución (runtime) o se puede integrar en el servidor.
- 2) Tiene un proceso de centralización de los datos donde se recopilan, normalizan, almacenan, hacen de buffer, analizan y visualizan.
## D. Illustrate the architecture at a high level. 
- 1) 
+-------------------------------------------------------------------+
|                          Navegador del Cliente                    |
|                                                                   |
|  +-------------------------------------------------------------+  |
|  |                    Aplicación Contenedora (Shell App)       |  |
|  |  +------------------+  +------------------+  +-----------+  |  |
|  |  |  Microfrontend   |  |  Microfrontend   |  | Navegación|  |  |
|  |  |     "Catálogo"   |  |   "Carrito"      |  |  Shared   |  |
|  |  | (Equipo A, React)|  | (Equipo B, Vue)  |  | Component |  |
|  |  +------------------+  +------------------+  +-----------+  |
|  +-------------------------------------------------------------+  |
|        |                  |                 |                    |
+--------|------------------|-----------------|--------------------+
         |                  |                 |
         v                  v                 v
    +----------+       +----------+      +-----------+
    | API Catá|logo   | API Carrito|    | Servidor de| Assets
    +----------+       +----------+      +-----------+
- 2) 
+-------------+     +-------------+     +-------------+
|  Servicio A |     |  Servicio B |     |  Servicio C |
|  (Logs a    |     |  (Logs a    |     |  (Logs a    |
|   stdout)   |     |   stdout)   |     |   archivo)  |
+-------------+     +-------------+     +-------------+
       |                    |                    |
       v                    v                    v
+--------------------------------------------------------------------------------+
|                          Nodo / Contenedor                                    |
|  +----------------+     +----------------+     +----------------+             |
|  |   Agente       |     |   Agente       |     |   Agente       |             |
|  |  (Fluent Bit)  |---->|  (Fluent Bit)  |---->|  (Fluent Bit)  |------------|
|  +----------------+     +----------------+     +----------------+             |
+--------------------------------------------------------------------------------+
                                       |
                                       v
                              +----------------+
                              |   Transporte   |
                              |    (Kafka)     |
                              +----------------+
                                       |
                                       v
                              +----------------+
                              |  Indexación &  |
                              | Almacenamiento |
                              | (Elasticsearch)|
                              +----------------+
                                       |
                                       v
                              +----------------+
                              | Visualización  |
                              |    (Kibana)    |
                              +----------------+
## E. What are the main benefits? 
- 1) Indepen
- 2) Visibilidad unificada, la resulución de problemas más rápida de la seguridad.
## F. What complexities or downsides appear? What trade-offs does it introduce in terms of performance, complexity, or security? 
- 1) 
- 2) 
## G. Describe a realistic system that would use this pattern. 
- 1) 
- 2) 
# 3. Anaysis of Scenarios
## 3.1 Scenario1 
## 3.2 Scenario2

