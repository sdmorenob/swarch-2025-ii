# RetoFit 2.0 🏋️‍♂️

Bienvenido al repositorio oficial del proyecto RetoFit 2.0. Este es un monorepo que contiene la aplicación completa, incluyendo el frontend y todos los microservicios del backend.
## Equipo

### Nombre del equipo
<div style="font-size: 24px"><center><p><strong> RetoFit Team </strong></p></center></div>

### Miembros:
- **Cristhian Alejandro Alarcón Florido** (calarconf@unal.edu.co)
- **Andres David Caro Mora** (ancarom@unal.edu.co)
- **Anderson Steven Mateus Lopez** (amateusl@unal.edu.co)
- **Anderson David Morales Chila** (amoralesch@unal.edu.co)
- **Daniel Alejandro Ochoa Ruiz** (daochoar@unal.edu.co)
- **Cristian David Machado Guzmán** (cmachado@unal.edu.co)

## Sistema de Software

### Nombre
<div align="center"><h3><strong> RetoFit </strong></h3>
<img height="250px" width="250px" src="https://raw.githubusercontent.com/RetoFit/Image_Repository/refs/heads/main/svg-export-4x.png" alt="Logo"></div>

### 📜 Descripción

RETOFIT es una plataforma diseñada para ayudar y hacer un seguimiento a los ejercicios físicos de un usuario. Además, se intenta incentivar un mayor ejercicio físico con retos, logros y la creación de comunidades. La arquitectura está basada en microservicios para garantizar la escalabilidad y mantenibilidad del sistema.

## 💻 Pila Tecnológica

-   **Frontend:** [Next.js](https://nextjs.org/) (React Framework)
-   **Backend:** 
    - [Python](https://www.python.org/) + [FastAPI](https://fastapi.tiangolo.com/).
    - Go.
    - Node.js.
    - PHP.
    - Java.
-   **Arquitectura:** Microservicios

## Requisitos funcionales y no funcionales

### Requisitos funcionales
---
- **RF-1:** Registrar nuevos usuarios mediante correo electrónico, redes sociales o autenticación federada (OAuth2, Google, Facebook).
- **RF-2:** Permitir login seguro y recuperación de contraseña.
- **RF-3:** Gestionar perfiles (edad, peso, altura, nivel de condición física).
- **RF-4:** Guardar historial de entrenamientos y métricas de progreso.
- **RF-5:** Crear y unirse a retos individuales o grupales.
- **RF-6:** Notificar avances, asignar puntos y medallas por logros alcanzados.
- **RF-7:** Registrar actividades físicas manualmente.
- **RF-8:** Permitir compartir/publicar logros.
- **RF-9:** Permitir interacción básica (likes, comentarios en logros).
- **RF-10:** Administración de contenidos (retos oficiales, banners de campañas).
- **RF-11:** Monitoreo de estadísticas de uso (usuarios activos, actividades registradas).

### Requisitos no funcionales
---
- **RNF-1:** Integrar autenticación con JWT.
- **RNF-2:** Generar token seguro de recuperación (con expiración).
- **RNF-3:** Asegurar que las rutas /login y /password/* solo funcionen sobre HTTPS.
- **RNF-4:** Añadir seguridad: solo el usuario dueño puede editar/consultar su perfil.
- **RNF-5:** Validar consistencia de datos antes de guardarlos (ej. duración > 0, fecha válida).
- **RNF-6:** Validar que un usuario no se pueda unir dos veces al mismo reto. 
- **RNF-7:** Definir reglas para asignación de puntos (ej. 10 puntos por cada actividad registrada, 50 por completar un reto).
- **RNF-8:** Definir reglas para asignación de medallas (ej. medalla por primer reto completado, medalla por 100 km acumulados).
- **RNF-9:** Implementar validaciones de fechas para la activación de retos y banners.
- **RNF-10:** El software debe seguir una arquitectura distribuida.
- **RNF-11:** El software debe incluir al menos dos componentes diferentes de tipo presentación.
- **RNF-12:** El front-end web debe seguir una subarquitectura SSR (Server-Side Rendering).
- **RNF-13:** El software debe incluir al menos 4 componentes de tipo lógico.
- **RNF-14:** El software debe incluir al menos un componente que permita la comunicación/orquestación entre los componentes lógicos.
- **RNF-15:** El software debe incluir al menos 4 componentes del tipo de datos (incluyendo bases de datos relacionales y no relacionales).
- **RNF-16:** El software debe incluir al menos un componente que sea responsable de manejar procesos asincrónicos dentro del sistema.
- **RNF-17:** El software debe incluir al menos dos tipos diferentes de conectores basados en HTTP.
- **RNF-18:** El software debe construirse usando al menos 5 lenguajes de programación diferentes de proposito general.
- **RNF-19:** El despliegue del software debe ser orientado a contenedores.

## Estructura arquitectónica
### Estructura de componentes y conectores
---
#### C&C View
<div align="center"><img width="80%" alt="image" src="https://raw.githubusercontent.com/RetoFit/Image_Repository/refs/heads/main/Blank%20diagram%20-%20Page%201.png" /></div>

#### **Estilos y patrones arquitectónicos usados**

#### Estilos arquitectónicos


El estilo arquitectónico usado es el de ***microservicios*** ya que el sistema de software se divide en pequeños servicios o componentes de backend con una responsabilidad y función específicas. Consta de 6 de estos microservicios que se describiran más adelante.

#### Patrones arquitectónicos

El principal patrón usado fue el ***api gateway***, el cual consiste en que desde el exterior del sistema solo hay un único punto de acceso, que en este caso es el ***api gateway***.

#### **Elementos y relaciones arquitectónicas**
Consta de 15 componentes y 16 conectores. En este caso, se tienen 2 componentes de presentación:

- **Frontend web:**

    Interfaz gráfica del sistema que se usa desde el navegador web.

- **Frontend móvil:**

    Interfaz gráfica del que se usa específicamente desde dispositivos moviles. Por ende, esta mejor optimizada para estos dispositivos.

Adicionalmente, se tiene un componente de comunicación:

- **Api Gateway**:

    Único punto de entrada al sistema desde el exterior, encargado de enrutar al microservicio al que se le ha pedido la solicitud. También, ayuda en la enrutación dentro del sistema cuando algunos servicios necesitan información de otros.

Tiene 6 componentes de lógica de negocio:

- **Auth:** 
    
    Este microservicio se encarga del registro, autenticación y autorización (login) del sistema.

- **Users:**

    Se encarga de la gestión de la base de datos de usuarios. En él, se registran y modifican los perfiles de los usuarios que tenga el sistema.

- **Physical_activities:**

    Se encarga de registrar las actividades físicas (como correr, ciclismo, caminar) de los usuarios registrados en el sistema.

- **Admin:**

    Se encarga de suspender o eliminar usuarios, ver las estadísticas de estos (por ejemplo, cuántos hay, qué condición física tienen, su género, etc). También, es el encargado de crear y mostrar los retos dentro de la plataforma.

- **Gamification:**

    Se encarga de asignar y calcular los puntos, de acuerdo a la actividad del usuario dentro del sistema.

- **Posts:**

    Servicio encargado de las publicaciones de los usuarios, asi como la interacción entre ellos (me gusta y responder).

A su vez cada componente de lógica de negocio tiene su base de datos, es decir que hay 6 componentes de datos.

- **retofit_auth_db:**

    Tiene la información de las cuentas de los usuarios como el correo y la contraseña.

- **retofit_users_db:**

    Tiene la información de los perfiles de los usuarios con datos como la edad, estado físico, deporte favorito, etc.

- **retofit_activities_db:**

    Tiene la información de las actividades físicas realizadas por el usuarrio como los kilómetros recorridos y en cuánto tiempo los recorrió.

- **retofit_retos_db:**

    Tiene la información de todos los retos creados por el administrador, asi como el porcentaje de avance de los usuarios.

- **retofit_gamification_db:**

    Tiene los puntos que tiene cada usuario por la realización de actividades.

- **retofit_posts_db:**

    Contiene la información relacionada al contenido de los posts, ya sea el texto escrito o la imagen compartida. Además de los *me gusta* y las respuestas hechas a cada post.

En cuanto a los conectores, existen los siguientes: 

- **HTTP:**

    Conecta directamente el navegador con el frontend web.

- **Rest:**

    Existen 8 de estos conectores dentro del sistema, de los cuales 2 se utilizan para comunicarse los dos componentes de presentación con el ***Api Gateway***, y los 6 restantes para la comunicación entre el ***api gateway*** y cada uno de los microservicios.

- **TCP:** 

    Los conectores TCP, se usaron para comunicar cada microservicio con su base de datos. Cada lenguaje utilizó su propio controlador para la respectiva base de datos.

- **gRPC:**

    Este conector se utilizó para realizar una petición desde el microservicio ***Physical_activities*** directamente hacia el microservicio ***Users***. Esto se hizó para confirmar que el usuario exista realmente en la base de datos.


---

#### Layered View
<div align="center"><img width="80%" alt="image" src="https://raw.githubusercontent.com/RetoFit/Image_Repository/refs/heads/main/vista_layer.png" /></div>

#### Deployment View
<div align="center"><img width="80%" alt="Blank diagram - Page 1" src="https://github-production-user-asset-6210df.s3.amazonaws.com/143036159/506242026-a37b41c8-8c9f-408d-b7bd-966b1f58776a.png?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Credential=AKIAVCODYLSA53PQK4ZA%2F20251027%2Fus-east-1%2Fs3%2Faws4_request&X-Amz-Date=20251027T230841Z&X-Amz-Expires=300&X-Amz-Signature=37f7cef0d8cb080a470f3daa1a412427bdb763ec82abef92ed668e6970239457&X-Amz-SignedHeaders=host" /></div>

#### Decomposition View
<div align="center"><img width="80%" alt="image" src="https://github-production-user-asset-6210df.s3.amazonaws.com/143036159/506176222-4b5a3a8a-a8ed-4f8d-b16c-bd2aed4c2a72.png?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Credential=AKIAVCODYLSA53PQK4ZA%2F20251027%2Fus-east-1%2Fs3%2Faws4_request&X-Amz-Date=20251027T230954Z&X-Amz-Expires=300&X-Amz-Signature=4a519e9ed9d857eab986cf3968577adcfc697b2b2e316e102ee49444deb6deb9&X-Amz-SignedHeaders=host" /></div>

## Prototipo
## 🚀 Guía de Instalación y Ejecución
**========== Docker NO sirve ==========**

Recordar tener docker instalado y ejecutandose.

Para iniciar la aplicación en docker, se tiene que seguir los siguientes pasos:

**1. Contruir todos los contenedores**

```shell
docker compose build
```

**2. Lanzar todos los contenedores**

```shell
docker compose up -d
```

Abre la siguiente url en el navegador:

- http://localhost:3000


---
**Ver el estado de todos los contenedores**

```shell
docker compose ps
```

**Ver logs de un servicio específico**

```shell
docker compose logs -f [nombre-servicio]
```
**Para apagar y borrar todos los contenedores**

```shell
docker compose down
```
---

Sigue estos pasos para configurar y ejecutar el proyecto en tu entorno de desarrollo local.

### ✅ Requisitos Previos

Asegúrate de tener instalado lo siguiente:

- Java (versión 17.+). Ni superior ni inferior.
- Maven.
- [Node.js](https://nodejs.org/) (versión 18 o superior)
- [Python](https://www.python.org/downloads/) (versión 3.9 o superior)
- `npm` (se instala con Node.js) o `yarn`
- PHP (versión 8.0 o superior)
- Composer (gestor de dependencias para PHP)

### Clonar el Repositorio

Primero, clona este repositorio en tu máquina local.

```shell
git clone <URL_DEL_REPOSITORIO_GIT>
cd RETOFIT_2.0
```

### Opción automática de instalación y ejecución

#### Linux

Ejecutar los siguientes comandos en la raíz del proyecto:

1. Dar permisos de ejecución a los archivos ```instalaciones.sh``` y a ```arrance_sin_docker.sh```.

```bash
chmod +x arrance_sin_docker.sh

chmod +x instalaciones.sh
```

2. Ejecutar ```instalaciones.sh```

```bash
./instalaciones.sh
```

3. Ejecutar ```arrance_sin_docker.sh```

```bash
./arrance_sin_docker.sh
```

#### Windows

Ejecutar los siguientes comandos en la raíz del proyecto y como administrador en el ```Powershell```:

1. Ejecutar ```instalaciones.ps1```

```powershell
.\instalaciones.ps1
```

2. Ejecutar ```arrance_sin_docker.ps1```

```powershell
.\arrance_sin_docker.ps1
```

Si hay errores de permisos:

```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

3. En el navegador poner la dirección: **http://localhost:3000/**

### Opción manual

En caso de que los scripts no se ejecuten correctamente, este proceso, se puede hacer de forma manual. Debe seguir los siguientes pasos:

### 1. Configurar el Frontend

El frontend es una aplicación de Next.js. Para ejecutarla, sigue estos pasos:

```shell
# 1. Navega a la carpeta del frontend
cd front

# 2. Instala todas las dependencias del proyecto
npm install

# 3. Ejecuta el servidor de desarrollo
npm run dev
```

✨ ¡Listo! La aplicación de frontend estará disponible en **[http://localhost:3000](http://localhost:3000)**.

### 2. Configurar el Backend (Microservicios)

El backend consta de varios microservicios independientes. Cada uno debe ser configurado y ejecutado en su propia terminal.

### a. Proceso General para cada servicio en FastApi

Para los microservicios: `auth-service`, `gamification-service` y `user-service`, debes seguir estos pasos desde la raíz del proyecto:

1.  **Navegar a la carpeta del servicio**: `cd services/<nombre-del-servicio>`
2.  **Crear un entorno virtual**: 
    - En **Windows**: `python -m venv venv`
    - En **Linux**: `python3 -m venv venv`
3.  **Activar el entorno virtual**:
    -   En **Windows**: `venv\Scripts\activate`
    -   En **macOS/Linux**: `source venv/bin/activate`
4.  **Instalar las dependencias**: `pip install -r requirements.txt`

Una vez completados estos pasos, puedes ejecutar el servicio específico como se describe a continuación.

#### ▶️ Ejecutar los Microservicios en FastApi

Abre una terminal separada para cada servicio.

**1. Authentication Service (`auth-service`)**

```shell
# Navega a la carpeta del servicio
cd services/auth-service

# (Asegúrate de que tu entorno virtual esté activado)
# Ejecuta el servidor
uvicorn app.main:app --reload --port 8001
```
✅ El servicio de autenticación estará escuchando en **[http://localhost:8001](http://localhost:8001)**.

**2. Gamification Service (`gamification-service`)**

```shell
# Navega a la carpeta del servicio
cd services/gamification-service

# (Asegúrate de que tu entorno virtual esté activado)
# Ejecuta el servidor
uvicorn app.main:app --reload --port 8003
```
✅ El servicio de gamificación estará escuchando en **[http://localhost:8003](http://localhost:8003)**.

**3. User Service (`user-service`)**

```shell
# Navega a la carpeta del servicio
cd services/user-service

# (Asegúrate de que tu entorno virtual esté activado)
# Ejecuta el servidor
uvicorn app.main:app --reload --port 8004
```
✅ El servicio de usuarios estará escuchando en **[http://localhost:8004](http://localhost:8004)**.

### b. Proceso para el servicio de actividades en `Go`

Primero, te ubicas en la carpeta de ***physical_activities_service***-

```shell
# Navega a la carpeta del servicio
cd services/user-physical_activities_service
```

Luego, ejecutas los siguientes comandos para instalar las librerias y dependencias, y ejecutar el servicio:

```shell
# Instalar librerías
go mod tidy

# Ejecutar servicio
go run cmd/rest_api/main.go
```

### c. Proceso para el servicio de administración en `PHP`

Nos ubicamos en la carpeta ***admin-service***.

```shell
cd services/admin-service
```

Luego, instala las dependencias del proyecto con Composer.

Este comando lee el archivo `composer.json` y descarga todas las librerías necesarias (como Slim Framework y Guzzle) en la carpeta `vendor/`.

```shell
composer install
```

Despues, inicia el servidor de desarrollo integrado de PHP.

El servicio se ejecutará en el puerto 8006. El flag `-t public` es
importante porque establece el directorio `public/` como la raíz del servicio.

```shell
php -S localhost:8006 -t public
```

Este patrón de comunicación se realiza mediante **Guzzle**, un cliente **HTTP** para **PHP**. Esto permite que los microservicios, aunque escritos en diferentes lenguajes, colaboren entre sí de forma transparente.

### d. Proceso para el servicio de administración en `Node.js + TypeScript`

#### 1. Navegar al directorio del servicio

```bash
cd services/posts-service
```

#### 2. Instalar dependencias

```bash
npm install
```

#### 3. Generar cliente de Prisma

```bash
npx prisma generate
```
#### 4. Ejecutar migraciones de base de datos (OPCIONAL)

```bash
npx prisma migrate dev --name init
```

Si te pregunta por el nombre de la migración, usa "init" o "posts_service_initial".

#### 5. Iniciar el servidor en modo desarrollo

```bash
npm run dev
```

El servidor estará disponible en `http://localhost:8005`

### 3. Configurar el Api Gateway

#### 1. Navegar al directorio del api gateway

```bash
cd api_gateway
```

#### 2. Compilar api gateway

```bash
mvn clean package -DskipTests
```

#### 3. Ejecutar ***.jar***

```bash
java -jar target/*.jar
```

## 📁 Estructura del Proyecto

```
RETOFIT_2.0/
├── api_gateway/                     # Api Gateway (Java)
│   ├── src/
|   |   └── main/ 
|   |       ├── java/
|   |       |   └── com/
|   |       |       └── example/
|   |       |           └── api_gateway/
|   |       |               ├── config/
|   |       |               |   └── CorsConfig.java
|   |       |               ├── filter/
|   |       |               |   └── LoggingFilter.java
|   |       |               └── Application.java
│   |       └── resources/
|   |           └── application.yml
│   ├── pom.xml
├── front/                     # Frontend (Next.js)
│   ├── components/
│   ├── pages/
│   └── ...
├── services/                  # Microservicios
|    ├── activities-service/    # (Deprecated)
|    ├── auth-service/          # (Python) Servicio de Autenticación
|    ├── admin-service/         # (PHP) Servicio de Administración
|    ├── gamification-service/  # (Python) Servicio de Gamificación
|    ├── physical_activities_service/  # (Go) Servicio de actividades
|    ├── posts-service          # (Node.js + TypeScript) Servicio de foro
|    └── user-service/          # (Python) Servicio de Usuarios
├── .gitignore
└── README.md
```
