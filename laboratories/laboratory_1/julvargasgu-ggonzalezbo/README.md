# Laboratory 1

## Objetivo
Diseñar, construir, desplegar y probar un sistema de software sencillo usando un **estilo arquitectónico monolítico**, con el fin de tener un primer acercamiento práctico a los conceptos de estructuras y propiedades del sistema.

—

## Estructura del sistema

El sistema está compuesto por:
- **Un monolito en Flask (Python)** organizado en capas:
  - Templates (vistas)
  - Controllers
  - Services
  - Repositories
  - Models
- **Base de datos MySQL** para la persistencia.
- **Docker** y **Docker Compose** para la construcción y despliegue.

—

##  Representación gráfica de la arquitectura
![diagrama](/diagrama.drawio.png)

—

## Propiedades del sistema

### 1. **Modularidad**
El sistema se organiza en capas dentro del monolito (templates → controllers → services → repositories → models).  
Cada capa tiene un propósito específico:
- **Templates:** gestionan la presentación al usuario.  
- **Controllers:** reciben las solicitudes HTTP y coordinan la lógica.  
- **Services:** contienen la lógica de negocio.  
- **Repositories:** gestionan el acceso a los datos.  
- **Models:** representan las entidades (libros y géneros).  

Gracias a esta separación, el código se vuelve más claro, fácil de entender y con bajo acoplamiento, lo que facilita la **extensión** del sistema (por ejemplo, agregar una nueva entidad como "Autor").

### 2. **Portabilidad**
La aplicación y la base de datos se ejecutan dentro de **contenedores Docker**.  
Esto significa que no importa si el sistema se despliega en Windows, Linux, MacOS o en un servidor remoto en la nube.  

### 3. **Mantenibilidad**
El diseño en capas y la estandarización del código facilitan la **evolución y corrección de errores**:  
- Si ocurre un error en la lógica de negocio, se revisa en la capa de **services**.  
- Si ocurre un problema en el acceso a la base de datos, se revisa en la capa de **repositories**.  
- Si se necesita mejorar la interfaz, se modifica únicamente la capa de **templates**.  

Esta división hace que el sistema pueda **crecer de forma ordenada**. Además, permite que distintos miembros de un equipo trabajen en paralelo en diferentes capas sin interferir entre sí.

### 4. **Escalabilidad**
El sistema sigue un **patrón monolítico**, lo cual implica que:
- Se puede escalar **verticalmente**: aumentando la memoria, CPU o recursos del contenedor que ejecuta el monolito.  
- También se puede escalar de forma **horizontal** replicando el contenedor Flask.  

Sin embargo, la escalabilidad es **limitada** en comparación con una arquitectura de microservicios, ya que todas las funcionalidades siguen estando empaquetadas dentro de la misma aplicación.  
Esto significa que, si un módulo necesita más recursos, se debe escalar todo el monolito.

### 5. **Disponibilidad**
La aplicación está compuesta por **dos contenedores independientes**:
- `swarch-mo` (monolito Flask)  
- `swarch-db` (MySQL)  

Esto permite una mayor **resiliencia**: si la base de datos necesita reiniciarse, el contenedor de Flask puede seguir funcionando y reconectarse una vez que la base de datos esté disponible nuevamente.  
