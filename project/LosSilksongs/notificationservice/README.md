# 🛎️ Documentación del Servicio de Notificaciones

Este servicio es el centro de notificaciones en tiempo real de **MusicShare**. Utiliza una **API REST** para recibir notificaciones de otros servicios y **WebSockets** para enviar esas notificaciones instantáneamente a los clientes conectados.

Opcionalmente, también puede consumir mensajes desde una cola de **RabbitMQ** por retrocompatibilidad o para flujos de trabajo específicos.

## ✨ Cómo Funciona

El flujo de comunicación es simple y desacoplado:

1.  **Conexión del Cliente**: El frontend establece una conexión WebSocket persistente al endpoint `ws://<host>/ws/{user_id}` cuando un usuario inicia sesión.
2.  **Envío de Notificación**: Cuando un evento ocurre en otro microservicio (ej. `SocialService`), este realiza una simple llamada **`POST` HTTP** a la API REST de este servicio (`/api/v1/notify`).
3.  **Difusión Instantánea**: El Servicio de Notificaciones recibe la solicitud, identifica al usuario destinatario y envía el `payload` de la notificación a través de la conexión WebSocket correspondiente, si el usuario está en línea.
4.  **Recepción en el Frontend**: El frontend recibe el mensaje JSON y actualiza la interfaz de usuario para mostrar la notificación.

-----

## 🛠️ Guía de Uso para Otros Servicios (Productores)

Para enviar una notificación, tu servicio debe realizar una solicitud HTTP al endpoint principal.

### 🚀 Método 1: API REST (Recomendado)

Este es el método preferido por su simplicidad y porque no requiere dependencias adicionales.

  * **Método**: `POST`
  * **Endpoint**: `http://notificationservice:8082/api/v1/notify`

#### Formato del Body (JSON)

El cuerpo de la solicitud debe ser un objeto JSON con la siguiente estructura:

```json
{
  "recipient_id": "string",
  "payload": {
    "type": "string",
    "data": {}
  }
}
```

  * `recipient_id` (**requerido**): El ID del usuario que debe recibir la notificación.
  * `payload` (**requerido**): Un objeto JSON que contiene la notificación real que se enviará al frontend.
      * `type`: Una cadena que el frontend usa para identificar el tipo de notificación (ej. `NEW_FOLLOWER`, `NEW_SONG_IN_PLAYLIST`).
      * `data`: Un objeto con los datos relevantes para la notificación.

#### Ejemplo de Petición con `curl`

Así es como el `SocialService` podría notificar que un usuario ha comenzado a seguir a otro:

```bash
curl -X POST http://localhost:8082/api/v1/notify \
-H "Content-Type: application/json" \
-d '{
      "recipient_id": "user-bob-456",
      "payload": {
        "type": "NEW_FOLLOWER",
        "data": {
          "follower_id": "user-alice-123",
          "follower_name": "Alice",
          "message": "Alice ha comenzado a seguirte."
        }
      }
    }'
```

-----

### 🐇 Método 2: RabbitMQ (Alternativo)

Este método es útil para sistemas que ya dependen de colas de mensajes o para manejar grandes volúmenes de notificaciones de forma asíncrona.

  * **Host**: `rabbitmq`
  * **Cola (Queue)**: `notifications`
  * **Formato del Mensaje**: El mismo objeto JSON que se usa en la API REST.

*(El resto de la sección de RabbitMQ, incluyendo el ejemplo de Go, se mantiene igual que en tu versión original, ya que es correcta).*

-----

## 💻 Guía de Uso para el Frontend (Consumidor)

El frontend debe establecer y mantener una conexión WebSocket para recibir las notificaciones en tiempo real.

### Endpoint WebSocket

  * **URL**: `ws://<host_del_notification_service>:8082/ws/{user_id}`
  * **Ejemplo**: `ws://localhost:8082/ws/user-bob-456`

### Formato del Mensaje Recibido

El frontend recibirá a través del WebSocket el contenido del campo `payload` que fue enviado originalmente por el servicio productor.

Si un servicio envía esta petición REST:

```json
{
  "recipient_id": "user-bob-456",
  "payload": {
    "type": "NEW_FOLLOWER",
    "data": { "message": "Alice ha comenzado a seguirte." }
  }
}
```

El frontend conectado como `user-bob-456` recibirá este JSON:

```json
{
  "type": "NEW_FOLLOWER",
  "data": { "message": "Alice ha comenzado a seguirte." }
}
```

### Ejemplo de Cliente en React (`useNotifications` Hook)
