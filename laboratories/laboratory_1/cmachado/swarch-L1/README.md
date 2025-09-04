# Laboratorio 1 Arquitectura de software: Sistema Flask + MySQL con Docker

---

## 1. Diagrama de Despliegue (PlantUML)

Este diagrama representa los contenedores creados con Docker y cómo se relacionan entre sí.


# Sistema Flask + MySQL con Docker

Este proyecto implementa una arquitectura de software basada en **Flask** para la aplicación web y **MySQL** como motor de base de datos, todo desplegado en contenedores mediante **Docker Compose**.  
La organización interna sigue una arquitectura en capas para mejorar mantenibilidad y escalabilidad.

---

## 1. Diagrama de Despliegue (PlantUML)

Este diagrama representa los contenedores creados con Docker y cómo se relacionan entre sí.
<img width="835" height="653" alt="image" src="https://github.com/user-attachments/assets/bf6b8c40-30ea-48c5-badb-02233699c5f6" />

## 2. Arquitectura en Capas (Mermaid)
<img width="310" height="621" alt="image" src="https://github.com/user-attachments/assets/4719bde0-d34c-420a-9b64-875f040f7b9b" />

- El sistema sigue una arquitectura en capas para separar responsabilidades:

- Controllers: manejan las peticiones HTTP (rutas de Flask).

- Services: implementan la lógica de negocio.

- Repositories: se encargan del acceso a datos.

- Models: definen las entidades y el mapeo ORM.

- Database: almacenamiento persistente en MySQL.

## 3. Vista de Servicios con Docker Compose (Mermaid)
<img width="385" height="525" alt="image" src="https://github.com/user-attachments/assets/390841a1-a08e-4fc2-848b-aa57319a5f64" />
Representa la relación entre los servicios definidos en docker-compose.yaml.

## 4. Propiedades del Sistema

El sistema presenta las siguientes propiedades de calidad:

### 🔹 Escalabilidad
La aplicación puede crecer fácilmente, levantando múltiples contenedores de la app Flask y balanceando carga para soportar mayor número de usuarios.

### 🔹 Despliegue sencillo
Gracias a Docker Compose, todo el sistema se puede levantar con un solo comando (`docker-compose up`), reduciendo la complejidad de instalación y configuración.

### 🔹 Portabilidad
Al estar encapsulado en contenedores Docker, el sistema puede ejecutarse en cualquier entorno (Windows, Linux, macOS) sin necesidad de ajustes adicionales.

### 🔹 Mantenibilidad
La separación en capas (controllers, services, repositories, models) facilita la localización de errores y la incorporación de nuevas funcionalidades sin afectar otras partes del sistema.

### 🔹 Reusabilidad
Los componentes como servicios y repositorios están diseñados de forma modular, lo que permite reutilizarlos en futuros proyectos con requisitos similares.



