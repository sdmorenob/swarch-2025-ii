# SwArch-2025-II
Laboratorio 1: Arquitectura Monolítica
Este documento contiene los entregables solicitados para el Laboratorio 1, incluyendo la representación gráfica de la arquitectura del sistema y la descripción de sus propiedades identificadas.

1. Representación Gráfica de la Estructura del Sistema
El sistema se diseñó siguiendo un estilo arquitectónico 

cliente-servidor y un patrón de capas dentro del componente monolítico. A continuación, se presentan los diagramas que representan estas estructuras.



Vista de Componentes (Estilo Cliente-Servidor)
Esta vista muestra los componentes principales del sistema y cómo interactúan entre sí. El sistema está compuesto por un cliente (navegador web), un servidor monolítico que contiene toda la lógica de negocio, y una base de datos para la persistencia de los datos.


Fragmento de código

graph TD
    subgraph "Cliente"
        A[🌐 Navegador Web]
    end

    subgraph "Servidor"
        B(Monolito en Python/Flask)
    end

    subgraph "Base de Datos"
        C[(🐘 MySQL)]
    end

    A -- HTTP Requests --> B
    B -- Queries SQL --> C
    C -- Resultados --> B
    B -- HTML Responses --> A
Navegador Web: Es el cliente que envía peticiones (por ejemplo, para ver o crear un libro) al servidor.


Monolito: Es una única unidad de despliegue que recibe las peticiones, procesa la lógica de negocio y se comunica con la base de datos.



MySQL: Es el sistema gestor de base de datos que almacena y recupera los datos de los libros y géneros literarios.

Vista de Capas (Patrón Interno del Monolito)
Esta vista detalla la estructura interna del componente monolítico, la cual sigue un patrón de arquitectura en capas bien definido para separar las responsabilidades.

Fragmento de código

graph TD
    subgraph "Monolito (Aplicación Flask)"
        direction TB
        L5(Templates)
        L4(Controllers)
        L3(Services)
        L2(Repositories)
        L1(Models)

        L5 -- "Renderiza datos" --> L4
        L4 -- "Recibe peticiones HTTP y usa" --> L3
        L3 -- "Coordina y usa" --> L2
        L2 -- "Accede a la BD usando" --> L1
    end

    DB[(Base de Datos)]

    L1 -- "Mapea tablas de" --> DB
La organización del código sigue la siguiente estructura de capas:


Templates: Capa de presentación (HTML) que renderiza la interfaz de usuario.



Controllers: Maneja las peticiones HTTP del usuario, invoca a los servicios y devuelve una respuesta.


Services: Contiene la lógica de negocio principal. Orquesta las operaciones y valida los datos antes de pasarlos a los repositorios.



Repositories: Se encarga del acceso directo a los datos, abstrae las consultas a la base de datos.



Models: Representa la estructura de los datos (tablas de la base de datos) y sus relaciones.


2. Descripción de Propiedades del Sistema
A continuación se describen cinco propiedades identificadas en el sistema, derivadas de su arquitectura monolítica.

Propiedades Identificadas
Simplicidad en el Desarrollo: Al ser una aplicación monolítica, todo el código fuente se encuentra en un único proyecto. Esto simplifica el desarrollo inicial, ya que no es necesario gestionar la comunicación entre diferentes servicios o repositorios. Abrir el proyecto en un IDE permite acceder a todas las capas de forma directa, lo que facilita la depuración y el razonamiento sobre el flujo del código.


Desplegabilidad Sencilla: El sistema se empaqueta y despliega como una sola unidad. El archivo 

docker-compose.yaml define dos servicios (la aplicación y la base de datos), pero la aplicación en sí (swarch-mo) es un único contenedor. Para desplegar una nueva versión, solo es necesario construir una nueva imagen de Docker y reiniciar el contenedor, lo cual es un proceso muy directo.



Rendimiento: La comunicación entre las distintas capas (por ejemplo, de un controlador a un servicio, o de un servicio a un repositorio) se realiza mediante llamadas a funciones dentro del mismo proceso. Esto es extremadamente rápido y eficiente, ya que no hay latencia de red involucrada, a diferencia de lo que ocurriría en una arquitectura de microservicios.

Escalabilidad Limitada: La escalabilidad es una propiedad que describe cómo el sistema maneja un aumento de la carga. En este diseño monolítico, la única forma de escalar es replicar la aplicación completa. No es posible escalar de forma independiente solo una parte del sistema (por ejemplo, el servicio de libros si fuera el más usado). Si el sistema crece, esta aproximación puede ser ineficiente en el uso de recursos.


Alto Acoplamiento: Aunque la arquitectura en capas ayuda a organizar el código, los diferentes módulos (libros y géneros) están acoplados dentro de la misma base de código. Por ejemplo, el 

BookService depende directamente del GenreRepository para validar un género. Un cambio en un componente (como el modelo 


LiteraryGenre) podría requerir cambios en múltiples capas que lo utilizan. Este acoplamiento puede dificultar el mantenimiento a largo plazo a medida que la aplicación crece.
