# Laboratorio 4: Patrones Arquitectónicos
## Integrantes:
- Anderson Steven Mateus Lopez
- Anderson David Morales Chila
## Deconstrucción de patrones
  
### **Microfrontends**

**A.** In your own technical words, what is the fundamental problem that the Microfrontends pattern aims to solve? How does it solve it? 

El problema fundamental que busca resolver los microfrontends es la complejidad y falta de escabilidad en interfaces de usuarios generalmente extensas.

El anterior problema se puede resolver dividiendo una gran interfaz en partes más pequeñas e independientes , lo que puede permitir a mejor manera:

* Uso de propias tecnologias  
* Desarrollo de modulos sin interferencia de otros.

**B.** How does this pattern impact system coupling and cohesion? 

**RTA:**

**Acoplamiento:**  
Es un acoplamiento debil entre equipos y partes del sistema, ya que cada microfrontend es una unidad independiente que puede desarrollarse, desplegarse y mantenerse por separado. 

**Cohesion:**

Puede presentar alta cohesión ya que se enfoca en una funcionalidad específica del negocio (por ejemplo, “perfil de usuario” o “carrito de compras”).

**C.** Explain the fundamental mechanism of the pattern. 

El mecanismo fundamental del patrón Microfrontends consiste en dividir una aplicación grande del lado del cliente (frontend) en módulos más pequeños e independientes, donde cada uno tiwne una función especifica del negocio y puede ser desarrollado por un equipo distinto.

**E.** What are the main benefits? 

1. **Desarrollo independiente:**

Cada equipo puede trabajar en su propio microfrontend sin interferir con los demás, lo que acelera el desarrollo y reduce los bloqueos entre equipos.

2. **Desarrollo independiente:**

Cada equipo puede trabajar en su propio microfrontend sin interferir con los demás, lo que acelera el desarrollo y reduce los bloqueos entre equipos.

3. **Despliegue autónomo:**

Los microfrontends pueden actualizarse o implementarse de forma individual, sin necesidad de desplegar toda la aplicación completa.

4. **Escalabilidad organizacional:**

Permite que varios equipos trabajen en paralelo sobre diferentes partes del sistema.

5. **Mantenibilidad y evolución más sencilla:**

Al estar dividido en módulos pequeños y enfocados, el código es más fácil de entender, probar y modificar.

**F.** What complexities or downsides appear? What trade-offs does it introduce in terms of performance, complexity, or security? 

Desde el punto de vista de la **complejidad**, trabajar con múltiples equipos y despliegues independientes hace que la coordinación sea más difícil. Es necesario mantener un control estricto sobre las versiones, lo visual y la comunicación entre módulos.

En cuanto al **rendimiento**, cada microfrontend puede cargar sus propios archivos, librerías o estilos, lo que puede aumentar el tamaño total de la aplicación y afectar los tiempos de carga si no se optimiza correctamente.

En **seguridad**, el hecho de tener varios módulos desplegados de forma independiente amplía los posibles puntos de entrada por lo cual deben existir  uenas politicas de seguridad y accesos con autenticación adecuada.

Como **trade-off**, los microfrontends permiten que cada equipo trabaje y despliegue de forma autónoma, lo cual acelera el desarrollo y mejora la escalabilidad organizacional. Sin embargo, esto se logra a costa de una mayor complejidad técnica, un mantenimiento más demandante y posibles impactos en el rendimiento inicial de la aplicación.

G. Describe a realistic system that would use this pattern. 

Un ejemplo de microfrontends es una plataforma de comercio electrónico a gran escala, como Amazon o Mercado Libre , debido a que ,en este tipo de plataformas, diferentes equipos pueden trabajar de manera independiente en secciones específicas del sitio: el módulo de búsqueda de productos, el carrito de compras, la gestión de usuarios, el sistema de pagos o la sección de reseñas y calificaciones.

* Illustrate the architecture at a high level.

De acuerdo al último ejemplo planteado, se propone este diagrama: 

![Esquema de microfrontends](./WhatsApp%20Image%202025-10-14%20at%208.22.49%20PM.jpeg)

### Log aggregation 

**B.** How does this pattern impact system coupling and cohesion? 

**Acoplamiento:**  
El patron disminuye el acoplamiento operativo entre los servicios, ya que centraliza la recopilación y análisis de registros sin que cada servicio tenga que preocuparse por cómo se almacenan o visualizan los logs.

**Cohesion:**  
La cohesión del sistema mejora, ya que todos los datos de registro se unifican en un solo lugar, facilitando el monitoreo y la trazabilidad

**C.** Explain the fundamental mechanism of the pattern. 

Funciona mediante la recolección y centralización de los registros o logs generados por distintos componentes  de un sistema.En lugar de que cada servicio guarde sus logs de forma local, todos se envían o transmiten hacia un sistema centralizado (por ejemplo, un servicio en la nube).

**E.** What are the main benefits? 

1. **Monitoreo centralizado**:

Todos los registros del sistema se concentran en un solo lugar, facilitando el acceso y análisis de la información.

2. **Detección rápida de errores:**

Permite identificar fallos o comportamientos anómalos de manera más rápida ya que los logs de distintos servicios se pueden correlacionar fácilmente.

3. **Mejor trazabilidad:**

Se puede seguir el recorrido de una petición a través de múltiples servicios.

4. **Soporte para auditorías y seguridad:**

Al centralizar los registros, se facilita el cumplimiento de normas, auditorías y análisis de seguridad.

**F.** What complexities or downsides appear? What trade-offs does it introduce in terms of performance, complexity, or security? 

En cuanto a **complejidad**  aumenta, ya que mantener una infraestructura centralizada de logs requiere herramientas y configuraciones adicionales como  gestión de almacenamiento, rotación de registros y monitoreo.

En cuanto a **rendimiento** puede enviar continuamente logs desde diferentes servicios genera tráfico adicional en la red y puede consumir recursos importantes, especialmente en sistemas de gran escala.

En **seguridad**,centralizar todos los registros en un solo punto aumenta el riesgo de exposición si no se gestionan adecuadamente los accesos o si se almacenan datos sensibles sin las protecciones necesarias.

El **trade-off** se puede evidenciar desde que se puede centralizar los log, ya que , se gana trazabilidad, auditoría y facilidad para detectar errores, pero se pierde simplicidad operativa y se agrega carga al sistema.

G. Describe a realistic system that would use this pattern. 

Una empresa de manufactura opera una **plataforma IoT distribuida** que controla cientos de sensores y máquinas industriales.  
 Cada máquina envía datos en tiempo real sobre temperatura, vibración y estado operativo a un conjunto de **microservicios especializados**.

Todos estos dispositivos y servicios se generan en ubicaciones distintas (plantas, microcontroladores, gateways, contenedores en la nube).

* Illustrate the architecture at a high level.

De acuerdo al último ejemplo planteado, se propone este diagrama: 

![Esquema de log aggregation](./WhatsApp%20Image%202025-10-14%20at%208.22.49%20PM%20(2).jpeg)

## Análisis de escenarios
### Escenario 1
El Escenario 1 describe una crisis crítica en la plataforma fintech **_PagoGlobal_**, donde la dependencia síncrona y obligatoria de un servicio externo no escalable (**_FraudBlocker_**), que se ejecuta en infraestructura legacy, provoca fallos en cascada y la saturación de todo el sistema de pagos durante picos de tráfico. 

Para resolver este problema, centrado en la fiabilidad (reliability) y la disponibilidad frente a una dependencia síncrona y poco fiable, los siguientes patrones de la arquitectura de microservicios son los más adecuados:

**1. **_circuit breaker_****

Este es el patrón más directo para mitigar el riesgo de fallos en cascada.

- **Descripción:** el patrón **_circuit breaker_** es un proxy de invocación de procedimiento remoto (RPI) que está diseñado para rechazar inmediatamente las invocaciones durante un período de tiempo definido después de que el número de fallos consecutivos exceda un umbral específico.

- **Aplicación al escenario:** el servicio **_PaymentProcessor_** debe utilizar un **_circuit breaker_** al llamar a **_FraudBlocker_**. Si **_FraudBlocker_** comienza a fallar o a responder con una latencia inaceptablemente alta debido a la saturación durante eventos de pico, el **_PaymentProcessor_** dejará de enviar solicitudes al servicio externo, lo que permite que el **_PaymentProcessor_** falle rápidamente en las transacciones obligatorias y, crucialmente, continúe procesando las transacciones que no requieren la verificación de fraude. Esto evita que el fallo se propague a todo el sistema de pagos.

**2. Messaging (Mensajería Asíncrona)**

El problema principal en el Escenario 1 es que la comunicación síncrona reduce la disponibilidad del sistema: si un servicio (como **_FraudBlocker_**) no está disponible, el servicio que lo invoca también falla. La mensajería asíncrona es a menudo la mejor opción para la comunicación entre servicios.

- **Estrategia de Comunicación Asíncrona:** si la verificación de fraude de **_FraudBlocker_** pudiera realizarse de manera asíncrona (aunque el escenario la describe como "real-time" y "mandatory compliance step"), la disponibilidad general del sistema mejoraría significativamente.

- **Finish Processing After Returning a Response (Saga):** una solución avanzada que se ajusta a la necesidad de disponibilidad es que el **_PaymentProcessor_** use el enfoque Saga.

    - El servicio **_PaymentProcessor_** podría validar la solicitud solo con datos locales, crear la orden de pago en un estado PENDING (APPROVAL_PENDING), responder inmediatamente al cliente con el ID de la orden, y luego iniciar un proceso asíncrono (una Saga) para realizar la validación de fraude con **_FraudBlocker_** y otras autorizaciones.

    - Esto garantiza que, incluso si **_FraudBlocker_** está caído, **_PaymentProcessor_** sigue creando órdenes y respondiendo a sus clientes; la orden se validará más tarde cuando **_FraudBlocker_** vuelva a estar disponible. Este enfoque asegura que los servicios estén débilmente acoplados.

**3. Anti-Corruption Layer**

Dado que **_FraudBlocker_** es un servicio de terceros alojado en "legacy infrastructure", existe un alto riesgo de que su modelo de dominio y su API sean inconsistentes o de baja calidad.

- **Descripción:** un Anti-Corruption Layer (ACL) es una capa de software que traduce entre dos modelos de dominio diferentes para evitar que los conceptos de un modelo (el servicio externo) contaminen el modelo de dominio más limpio del servicio (el **_PaymentProcessor_**).

- **Aplicación al escenario:** un ACL debe implementarse en la interacción entre **_PaymentProcessor_** y **_FraudBlocker_**. Esto aísla el resto de la lógica de negocio de **_PagoGlobal_** de la complejidad o la baja calidad inconsistente del servicio externo legacy. Esto permite a **_PagoGlobal_** mantener un modelo de dominio más controlable.

### Escenario 2

Este escenario describe la plataforma **_MiSalud Digital_**, una nueva iniciativa del gobierno para centralizar los registros electrónicos de salud de todos los ciudadanos. Esta plataforma se caracteriza por ser una arquitectura de microservicios a gran escala (más de 70 servicios), construida por múltiples equipos contratados. El desafío central es la incapacidad de la organización para implementar y gestionar de forma consistente las preocupaciones transversales (**_cross-cutting concerns_**), lo que ha provocado problemas de seguridad, cumplimiento (compliance), resiliencia, y despliegue.

La propuesta inicial de usar librerías comunes para manejar estas características se convirtió en una "pesadilla logística" que requería semanas para coordinar la actualización y el redespliegue de los más de 70 servicios.

A continuación, se presentan los patrones arquitectónicos que son aplicables para resolver las problemáticas de esta iniciativa gubernamental:

**1. Para resolver los cumplimientos de seguridad Zero-Trust (mTLS) y la resiliencia inconsistente**

Ambos problemas (la necesidad de cifrado de tráfico interno y la falta de una política uniforme de resiliencia) son preocupaciones transversales que deben implementarse fuera del código de los servicios, dada la magnitud de la arquitectura (más de 70 servicios) y el fracaso de la solución basada en librerías.

- **Patrón Service Mesh (Malla de Servicios):**

    - Una malla de servicios es una capa de infraestructura de red que media la comunicación entre servicios y aplicaciones externas.

    - Este patrón es ideal para el contexto de "**_MiSalud Digital_**" porque implementa preocupaciones transversales como el **_circuit breaker_** (cortacircuitos), el **_service discovery_** (descubrimiento de servicios), y el **_load balancing_** (equilibrio de carga). Esto proporciona una política de resiliencia uniforme en toda la plataforma, simplificando el **_microservice chasis_** al delegar funciones de red a la infraestructura.

    - En cuanto a la seguridad (mTLS), una **_Service Mesh_** puede asegurar la comunicación entre procesos utilizando IPC basado en TLS, lo cual aborda directamente el Mandato de Seguridad Zero-Trust de verificar la identidad criptográfica y encriptar todo el tráfico interno.

- **Patrón Sidecar:**

    - Este patrón es la manera común de implementar una **_Service Mesh_**. Consiste en ejecutar las preocupaciones transversales (como seguridad y resiliencia) en un proceso o contenedor auxiliar junto a la instancia del servicio, evitando la necesidad de modificar el código de la lógica de negocio de los más de 70 servicios.

**2. Para resolver el Requisito de Despliegues Progresivos (Canary Release)**

El equipo de Appointment-Scheduler necesita enrutar con precisión el 1% del tráfico de usuarios en vivo a la nueva versión para monitorear errores. Este requisito se centra en separar el despliegue del lanzamiento (release).

- **Patrón Service Mesh (Gestión de Tráfico):**

    - Las mallas de servicios (**_Service Mesh_**) como Istio proporcionan la capacidad de enrutamiento de tráfico basado en reglas.

    - Esto permite la implementación de lanzamientos progresivos (progressive rollouts) al utilizar reglas de enrutamiento que dirigen un pequeño porcentaje del tráfico (como el 1% requerido, similar al ejemplo de 5% de peso de tráfico en las reglas Istio) a la nueva versión.

**3. Para resolver el Cumplimiento (Compliance) y la Auditoría Fina (Fine-Grained Auditing)**

El contexto de la salud y el acceso a registros electrónicos de salud implica que el cumplimiento normativo es primordial. Se exige el registro de cada llamada a la API que acceda a datos de pacientes (con origen, destino, URL y latencia), y que dicho registro no pueda ser manipulado.

- **Patrón Audit Logging (Registro de Auditoría):**

    - Este patrón consiste en registrar las acciones del usuario en una base de datos para asegurar el cumplimiento (compliance). Es la solución directa para registrar las llamadas a la API que acceden a datos sensibles de pacientes.

    - Una opción para implementarlo es utilizar Event Sourcing, ya que este patrón proporciona automáticamente un registro de auditoría (audit log) para operaciones de creación y actualización, garantizando que sea preciso si se registra la identidad del usuario en cada evento.

- **Patrón Log Aggregation (Agregación de Registros):**

    - En una arquitectura de más de 70 servicios, las entradas de registro están dispersas. Para que la auditoría sea efectiva, se necesita agregar los registros y almacenarlos en un servidor de registro centralizado. Este patrón permite buscar y analizar los registros de auditoría de todas las instancias de servicio.

- **Patrón Distributed Tracing (Rastreo Distribuido):**

    - Para poder registrar la latencia y rastrear la ruta completa de una solicitud (origen, destino, ruta URL), este patrón es crucial. Asigna un ID único a cada solicitud externa y la rastrea a medida que fluye entre los servicios, permitiendo identificar la colaboración entre servicios durante las llamadas a la API.

### Escenario 3 

Este escenario describe una falla crítica en la empresa logística **_EntregaRápida_**, ocasionada por una integración deficiente entre sistemas legacy (basados en VMs) y servicios cloud-native (Kubernetes).

La causa principal es la ausencia de un mecanismo de descubrimiento dinámico para el servicio Routing-Service, el cual escala automáticamente mediante un Horizontal Pod Autoscaler (HPA). La solución provisional —un script que actualiza manualmente las IPs de los pods cada cinco minutos— genera un punto único de fallo: cuando la infraestructura escala rápidamente, las IPs cambian más rápido de lo que el script puede actualizar, provocando timeouts, agotamiento de threads y, finalmente, una interrupción total del servicio de despacho.

Para resolver este problema, centrado en la resiliencia, elasticidad y compatibilidad entre entornos heterogéneos, se proponen los siguientes patrones arquitectónicos de microservicios:

**1. **_service discovery_****

**Descripción:** el patrón **_service discovery_** permite que los servicios encuentren dinámicamente las instancias disponibles de otros servicios sin depender de direcciones IP o configuraciones estáticas. Esto se logra a través de un Service Registry, donde cada instancia activa se registra automáticamente y los clientes pueden consultar la ubicación actual del servicio destino.

**Aplicación al escenario:** el Routing-Service debería registrarse automáticamente en un registro de servicios (por ejemplo, el DNS interno de Kubernetes o Consul).

El Dispatch-Service, en lugar de depender de un archivo con IPs, podría consultar ese registro dinámicamente o comunicarse a través de un nombre lógico (routing-service.default.svc.cluster.local).

De esta forma, la detección y balanceo de instancias se gestionan automáticamente, eliminando el script manual y evitando la obsolescencia de las direcciones IP.

**2. **_Service Mesh_** (con Sidecar Pattern)**

**Descripción:** un **_Service Mesh_** es una capa de infraestructura que abstrae la comunicación entre microservicios, proporcionando funciones como descubrimiento, balanceo de carga, seguridad (mTLS), circuit breaking y observabilidad sin modificar el código de las aplicaciones.

El Sidecar Pattern complementa este enfoque al ejecutar un proxy (como **_Envoy_**) junto a cada instancia del servicio, gestionando la comunicación y aplicando las políticas de red de manera transparente.

**Aplicación al escenario:** la adopción de un **_Service Mesh_** (por ejemplo, **_Istio_** o **_Linkerd_**) permitiría manejar automáticamente la conexión entre los pods del **_Routing-Service_** y el **_Dispatch-Service_**, incluso si este último sigue corriendo en VMs.

Cada pod del **_Routing-Service_** tendría un sidecar proxy que se comunica con el mesh, asegurando un enrutamiento resiliente, reintentos automáticos y métricas centralizadas.

El **_Dispatch-Service_** podría conectarse a un **_Ingress Gateway_** del mesh, que se encarga de dirigir el tráfico a las instancias disponibles en Kubernetes.

**3. **_circuit breaker_****

**Descripción:** este patrón protege a los servicios consumidores de depender de servicios lentos o no disponibles. Actúa como un interruptor que abre el circuito después de un número definido de fallos, evitando que las llamadas sucesivas bloqueen recursos o generen tiempos de espera excesivos.

**Aplicación al escenario:** el **_Dispatch-Service_** debería implementar un **_circuit breaker_** para las llamadas al **_Routing-Service_**.

En caso de que las conexiones fallen debido a pods no disponibles o IPs expiradas, el **_circuit breaker_** se activará y rechazará temporalmente las solicitudes, evitando que los hilos se bloqueen y que la aplicación se sature.

Esto puede configurarse directamente en el proxy del **_Service Mesh_**, sin modificar el código del **_Dispatch-Service_**.

**4. Strangler Application**

**Descripción:** este patrón permite migrar gradualmente un sistema legacy hacia una arquitectura moderna, coexistiendo ambos sistemas durante el proceso. Las nuevas funcionalidades se implementan en la nueva plataforma, mientras que las antiguas se mantienen operativas hasta su reemplazo completo.

**Aplicación al escenario:** el sistema de **_EntregaRápida_** se encuentra en una transición entre VMs y Kubernetes.

Aplicar el patrón Strangler permitiría mantener el **_Dispatch-Service_** legacy mientras se implementa gradualmente su versión cloud-native.

Durante esta transición, la comunicación entre ambos entornos se canaliza a través del **_Service Mesh_**, garantizando compatibilidad y continuidad del negocio sin interrupciones.