### Laboratorio 1 - Diseño y Despliegue de un Monolito.

## 🎯 Objetivo del Laboratorio
Implementar un sistema monolítico por capas, basado en Flask y MySQL, y contenerizado mediante **Docker Compose**, con el fin de diseñarlo, desarrollarlo, desplegarlo y validarlo. Además, se busca analizar y representar gráficamente su arquitectura (tanto de despliegue como de capas) y documentar cinco de sus propiedades empleando el dominio básico de géneros y libros.

---
##  Diagramas de Arquitectura

1. **Diagrama De Componentes**

<img width="612" height="569" alt="DiagramaDeComponentes drawio" src="https://github.com/user-attachments/assets/daefbee2-953c-4d46-bc9c-eaeaef2b4d6b" />

El diagrama representa la organización en capas (Templates, Controllers, Services, Repositories y Models) y cómo se comunican entre sí. El flujo comienza con el usuario en el navegador web, pasa por los controladores que gestionan las peticiones, atraviesa la lógica de negocio en los servicios, continúa hacia los repositorios encargados del acceso a datos y finalmente llega a los modelos, los cuales interactúan directamente con la base de datos MySQL mediante SQLAlchemy.

2. **Diagrama De Despliegue**
   
<img width="681" height="106" alt="DiagramaDeDespliegue drawio" src="https://github.com/user-attachments/assets/50ae7333-36ed-4967-88bb-cc6acbf51128" />

Este diagrama de despliegue ilustra la ejecución del sistema en contenedores Docker. La aplicación monolítica Flask se expone en http://localhost:5000 y se comunica con un contenedor independiente que ejecuta MySQL, el cual gestiona la persistencia de los datos.


## Propiedades Arquitectónicas del Sistema

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

## Evidencias

![evidencia1](https://github.com/user-attachments/assets/4de76cb0-a267-4fe8-a561-402129c979bb)

![photo_5030625362387776411_y](https://github.com/user-attachments/assets/70856162-26b5-457c-a761-c9d64099c51c)






