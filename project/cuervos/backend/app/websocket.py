"""
Módulo WebSocket (Socket.IO) de TaskNotes.

Cómo se integra con la app:
- En `app/main.py` se crea la app de FastAPI y luego se envuelve con `socketio.ASGIApp(sio, app)`,
  de modo que el mismo servidor Uvicorn sirve HTTP (REST) y WebSocket (Socket.IO).
- Los routers (por ejemplo, `tasks.py` y `notes.py`) emiten eventos en tiempo real usando `sio.emit(...)`.
  Se envían a una "sala" específica del usuario: `room=f"user_{current_user.id}"`.

Flujo típico en el frontend:
1) El cliente Socket.IO se conecta (evento `connect`).
2) Envía `join_user_room` con `user_id` para suscribirse a su sala personal.
3) Recibe eventos como `task_created`, `task_updated`, `task_deleted`, `note_created`, `note_updated`, `note_deleted`.

Eventos definidos aquí:
- `connect` y `disconnect`: conexión/desconexión de clientes.
- `join_user_room` / `leave_user_room`: suscripción a una sala de usuario (para actualizaciones en tiempo real).
"""

import socketio
from app.core.config import settings

# Instancia del servidor Socket.IO en modo ASGI, con CORS alineado al backend REST
sio = socketio.AsyncServer(
    cors_allowed_origins=settings.backend_cors_origins,
    async_mode='asgi'
)

# Socket.IO event handlers
@sio.event
async def connect(sid, environ, auth):
    """Se dispara cuando un cliente establece conexión Socket.IO.

    `sid` es el identificador de sesión del socket.
    Aquí podríamos validar un token si fuera necesario. Actualmente se permite todo
    y se envía un mensaje de bienvenida al cliente.
    """
    print(f"Client {sid} connected")
    
    # You can add authentication here if needed
    # For now, we'll allow all connections
    await sio.emit('connected', {'message': 'Connected to TaskNotes WebSocket'}, room=sid)

@sio.event
async def disconnect(sid):
    """Se dispara cuando el cliente se desconecta (cierra pestaña o pierde conexión)."""
    print(f"Client {sid} disconnected")

@sio.event
async def join_user_room(sid, data):
    """El cliente se suscribe a su sala personal `user_{user_id}`.

    Esto permite que el backend envíe solo al usuario correspondiente las
    notificaciones en tiempo real (creación/edición/borrado de tareas y notas).
    """
    user_id = data.get('user_id')
    if user_id:
        room = f"user_{user_id}"
        await sio.enter_room(sid, room)
        await sio.emit('joined_room', {'room': room}, room=sid)
        print(f"Client {sid} joined room {room}")

@sio.event
async def leave_user_room(sid, data):
    """El cliente abandona su sala personal (deja de recibir eventos dirigidos)."""
    user_id = data.get('user_id')
    if user_id:
        room = f"user_{user_id}"
        await sio.leave_room(sid, room)
        await sio.emit('left_room', {'room': room}, room=sid)
        print(f"Client {sid} left room {room}")

# App ASGI que envuelve al servidor Socket.IO. Se monta en `main.py`.
socket_app = socketio.ASGIApp(sio)