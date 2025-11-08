# Guía para Modificar Microservicios en MusicShare

Este documento describe el flujo de trabajo para realizar cambios en un microservicio individual dentro del proyecto MusicShare, que utiliza Traefik como API Gateway.

## 📖 Concepto Clave: Independencia de Servicios

Nuestra arquitectura está diseñada para que cada microservicio (`userservice`, `music-service`, etc.) sea independiente. El API Gateway (Traefik) actúa como un director de tráfico en la entrada principal. **A Traefik no le importa la lógica interna de los servicios, solo le importa la ruta y el puerto al que debe dirigir las solicitudes.**

Esto significa que puedes cambiar, arreglar o mejorar el código de un servicio (por ejemplo, la lógica de negocio en `userservice`) sin necesidad de tocar, detener o reconstruir ningún otro servicio, incluido el gateway.

-----

## 🛠️ Flujo de Trabajo para Modificar un Servicio

Sigue estos pasos para aplicar cambios en el código de cualquier servicio (por ejemplo, `userservice`).

### Paso 1: Realiza tus Cambios en el Código

Edita los archivos de código fuente del servicio que quieras modificar. Por ejemplo, si quieres cambiar cómo se autentica un usuario, editarías los archivos dentro de la carpeta `userservice/app/`.

> **Ejemplo**: Modificar `userservice/app/crud.py` para añadir una nueva función.

### Paso 2: Reconstruye y Reinicia el Servicio Específico

Una vez que hayas guardado tus cambios, necesitas decirle a Docker que reconstruya la imagen de ese servicio específico con el nuevo código y que reinicie el contenedor.

Abre tu terminal en la raíz del proyecto y ejecuta el siguiente comando, reemplazando `<nombre-del-servicio>` por el servicio que modificaste:

```bash
docker-compose up -d --build <nombre-del-servicio>
```

  * `--build`: Le dice a Docker que reconstruya la imagen desde su `Dockerfile`.
  * `-d`: Ejecuta los contenedores en segundo plano (detached mode).

**Ejemplos prácticos:**

  * Para aplicar cambios en el **servicio de usuarios**:
    ```bash
    docker-compose up -d --build userservice
    ```
  * Para aplicar cambios en el **servicio de música**:
    ```bash
    docker-compose up -d --build music-service
    ```
  * Para aplicar cambios en el **frontend**:
    ```bash
    docker-compose up -d --build frontend
    ```

Docker será lo suficientemente inteligente como para reconstruir solo el servicio que especificaste y reiniciar únicamente los contenedores necesarios. El API Gateway detectará automáticamente el nuevo contenedor actualizado y comenzará a enviarle tráfico. **No necesitas hacer nada más.**

-----

## ⚠️ ¿Cuándo SÍ se debe modificar la configuración del Gateway?

La única vez que necesitas pensar en el API Gateway es cuando cambias el "**contrato**" de un servicio, es decir, su dirección o ruta pública. Esto se hace modificando las `labels` en el archivo `docker-compose.yml`.

**Solo necesitas actualizar `docker-compose.yml` si vas a:**

1.  **Cambiar una ruta pública**: Por ejemplo, si decides que el login ya no estará en `/api/users/auth/token` sino en `/auth/token`.
2.  **Cambiar el puerto interno** de un servicio.
3.  **Añadir un nuevo microservicio** que necesite ser accesible desde el exterior.

En esos casos, simplemente ajustas las `labels` del servicio correspondiente en `docker-compose.yml` y ejecutas `docker-compose up -d`. Traefik detectará los cambios y actualizará sus reglas de enrutamiento automáticamente.