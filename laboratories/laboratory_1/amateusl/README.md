### Laboratorio 1 - Diseño y Despliegue de un Monolito.

## 🎯 Objetivo del Laboratorio
Implementar un sistema monolítico por capas, basado en Flask y MySQL, y contenerizado mediante **Docker Compose**, con el fin de diseñarlo, desarrollarlo, desplegarlo y validarlo. Además, se busca analizar y representar gráficamente su arquitectura (tanto de despliegue como de capas) y documentar cinco de sus propiedades empleando el dominio básico de géneros y libros.

---
##  Diagramas de Arquitectura



##Propiedades Arquitectónicas del Sistema

1. ** Modularidad**
	La arquitectura monolítica está organizada en capas internas , lo cual  permite aislar responsabilidades y reduce el acoplamiento interno.

2. **Mantenibilidad**  
   Gracias a la separación en capas, es sencillo localizar errores o modificar funcionalidades sin afectar el resto del sistema.

3. **Portabilidad / Despliegue reproducible**  
   El uso de contenedores Docker permite que el sistema se ejecute en cualquier entorno de manera uniforme y sin configuraciones adicionales.

4. **Escalabilidad (limitada por el monolito)**  
   Es posible escalar horizontalmente replicando el contenedor, pero no escalar componentes individuales de forma independiente.

5. **Confiabilidad e Integridad de Datos**  
   La base de datos MySQL y el uso de SQLAlchemy aseguran persistencia y consistencia de la información, preservando las relaciones entre libros y géneros.

---




