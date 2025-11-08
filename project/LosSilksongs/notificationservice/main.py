import asyncio
import json
import logging
from typing import Dict, List
import threading

import pika
import uvicorn
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from pika.adapters.asyncio_connection import AsyncioConnection
import time
from pydantic import BaseModel # [-- NUEVO --] Importamos BaseModel

# --- Configuración de Logging ---
logging.basicConfig(
    level=logging.INFO,
    format='{"timestamp": "%(asctime)s", "level": "%(levelname)s", "message": "%(message)s"}',
    datefmt='%Y-%m-%dT%H:%M:%S%z'
)
logger = logging.getLogger(__name__)


# --- Gestor de Conexiones WebSocket ---
class ConnectionManager:
    """Gestiona las conexiones WebSocket activas, asociando cada conexión a un user_id."""
    def __init__(self):
        self.active_connections: Dict[str, WebSocket] = {}

    async def connect(self, websocket: WebSocket, user_id: str):
        """Acepta una nueva conexión y la almacena."""
        await websocket.accept()
        self.active_connections[user_id] = websocket
        logger.info(f"Nuevo cliente conectado: {user_id}. Total de conexiones: {len(self.active_connections)}")

    def disconnect(self, user_id: str):
        """Elimina una conexión del diccionario de activas."""
        if user_id in self.active_connections:
            del self.active_connections[user_id]
            logger.info(f"Cliente desconectado: {user_id}. Total de conexiones: {len(self.active_connections)}")

    async def send_personal_message(self, message: dict, user_id: str):
        """Envía un mensaje JSON a un usuario específico si está conectado."""
        if user_id in self.active_connections:
            websocket = self.active_connections[user_id]
            try:
                await websocket.send_json(message)
                logger.info(f"Mensaje enviado a {user_id}: {json.dumps(message)}")
            except Exception as e:
                logger.error(f"Error al enviar mensaje a {user_id}: {e}")
                self.disconnect(user_id)


# --- Inicialización de la Aplicación FastAPI y el Gestor ---
app = FastAPI(
    title="Notification Service",
    description="Servicio para gestionar notificaciones en tiempo real para MusicShare.",
    version="1.0.0"
)
manager = ConnectionManager()


# [-- NUEVO --] Modelo Pydantic para validar los datos de la notificación
class NotificationPayload(BaseModel):
    """Define la estructura esperada para una solicitud de notificación."""
    recipient_id: str
    payload: Dict


# --- Consumidor de RabbitMQ ---
# (El código del consumidor de RabbitMQ no cambia y se mantiene igual)
class RabbitMQConsumer:
    def __init__(self, connection_manager: ConnectionManager):
        self.manager = connection_manager
        self.amqp_url = "amqp://guest:guest@rabbitmq/"
        self.queue_name = "notifications"
        self.connection = None
        self.channel = None

    def on_message(self, ch, method, properties, body):
        try:
            payload_str = body.decode('utf-8')
            logger.info(f"Mensaje recibido de RabbitMQ: {payload_str}")
            data = json.loads(payload_str)
            recipient_id = data.get("recipient_id")
            notification_payload = data.get("payload")
            if recipient_id and notification_payload:
                asyncio.run_coroutine_threadsafe(
                    self.manager.send_personal_message(notification_payload, recipient_id),
                    asyncio.get_event_loop()
                )
            else:
                logger.warning(f"Mensaje malformado recibido, descartado: {payload_str}")
        except Exception as e:
            logger.error(f"Error procesando mensaje de RabbitMQ: {e}")

    def consume(self):
        while True:
            try:
                params = pika.URLParameters(self.amqp_url)
                self.connection = pika.BlockingConnection(params)
                self.channel = self.connection.channel()
                self.channel.queue_declare(queue=self.queue_name, durable=True)
                logger.info("Conectado a RabbitMQ y esperando mensajes...")
                self.channel.basic_consume(
                    queue=self.queue_name,
                    on_message_callback=self.on_message,
                    auto_ack=True
                )
                self.channel.start_consuming()
            except Exception as e:
                logger.error(f"Error de conexión con RabbitMQ: {e}. Reintentando en 5 segundos...")
                if self.connection:
                    self.connection.close()
                time.sleep(5)


# --- Eventos de Ciclo de Vida de la App ---
@app.on_event("startup")
async def startup_event():
    consumer = RabbitMQConsumer(manager)
    threading.Thread(target=consumer.consume, daemon=True).start()
    logger.info("Servicio de Notificaciones iniciado. Tarea de consumidor RabbitMQ creada.")

# --- Endpoints de la API ---
@app.get("/health")
async def health_check():
    """Endpoint de health check para verificar que el servicio está activo."""
    return {"status": "ok", "active_connections": len(manager.active_connections)}


# [-- NUEVO --] Endpoint REST para recibir y enviar notificaciones
@app.post("/notify")
async def create_notification(notification: NotificationPayload):
    """
    Recibe una notificación de otro microservicio y la envía al usuario
    correspondiente a través de WebSocket si está conectado.
    """
    logger.info(f"Solicitud de notificación recibida para el usuario: {notification.recipient_id}")
    await manager.send_personal_message(
        message=notification.payload,
        user_id=notification.recipient_id
    )
    return {"status": "notification_sent", "recipient_id": notification.recipient_id}


@app.websocket("/ws/{user_id}")
async def websocket_endpoint(websocket: WebSocket, user_id: str):
    """
    Endpoint WebSocket. Cada cliente (frontend) se conecta a esta URL única.
    Ej: ws://localhost:8082/ws/user123
    """
    await manager.connect(websocket, user_id)
    try:
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(user_id)
    except Exception as e:
        logger.error(f"Error inesperado en WebSocket para {user_id}: {e}")
        manager.disconnect(user_id)


# --- Punto de Entrada para Uvicorn (si se ejecuta directamente) ---
if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8082)