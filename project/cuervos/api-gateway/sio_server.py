"""
Módulo WebSocket (Socket.IO) para API Gateway de TaskNotes.

Este módulo proporciona soporte para WebSocket/Socket.IO en el API Gateway,
permitiendo comunicación en tiempo real entre el frontend y los microservicios.
"""

import socketio
import os

# Configuración CORS para Socket.IO - más permisiva para debugging
cors_origins = "*"

# Instancia del servidor Socket.IO en modo ASGI
sio = socketio.AsyncServer(
    cors_allowed_origins=cors_origins,
    async_mode='asgi',
    logger=True,
    engineio_logger=True
)

# Socket.IO event handlers
@sio.event
async def connect(sid, environ, auth):
    """Se dispara cuando un cliente establece conexión Socket.IO."""
    print(f"Client {sid} connected to API Gateway WebSocket")
    
    # Enviar mensaje de bienvenida
    await sio.emit('connected', {'message': 'Connected to TaskNotes API Gateway WebSocket'}, room=sid)

@sio.event
async def disconnect(sid):
    """Se dispara cuando el cliente se desconecta."""
    print(f"Client {sid} disconnected from API Gateway WebSocket")

@sio.event
async def join_user_room(sid, data):
    """El cliente se suscribe a su sala personal `user_{user_id}`."""
    user_id = data.get('user_id')
    if user_id:
        room = f"user_{user_id}"
        await sio.enter_room(sid, room)
        await sio.emit('joined_room', {'room': room}, room=sid)
        print(f"Client {sid} joined room {room}")

@sio.event
async def leave_user_room(sid, data):
    """El cliente abandona su sala personal."""
    user_id = data.get('user_id')
    if user_id:
        room = f"user_{user_id}"
        await sio.leave_room(sid, room)
        await sio.emit('left_room', {'room': room}, room=sid)
        print(f"Client {sid} left room {room}")

# Función para emitir eventos a una sala específica (para uso por otros servicios)
async def emit_to_user(user_id: int, event: str, data: dict):
    """Emite un evento a la sala de un usuario específico."""
    room = f"user_{user_id}"
    await sio.emit(event, data, room=room)
    print(f"Emitted {event} to room {room}")

# App ASGI que envuelve al servidor Socket.IO
socket_app = socketio.ASGIApp(sio)