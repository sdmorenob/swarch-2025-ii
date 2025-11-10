import os
import json
import pika
import logging

RABBITMQ_URL = os.getenv("RABBITMQ_URL", "amqp://localhost:5672")
EXCHANGE_NAME = os.getenv("EVENTS_EXCHANGE", "tasknotes.events")

_connection = None
_channel = None

logger = logging.getLogger("events")


def _ensure_channel():
    global _connection, _channel
    if _channel and _channel.is_open:
        return _channel
    try:
        params = pika.URLParameters(RABBITMQ_URL)
        _connection = pika.BlockingConnection(params)
        _channel = _connection.channel()
        _channel.exchange_declare(exchange=EXCHANGE_NAME, exchange_type='topic', durable=True)
        return _channel
    except Exception as e:
        logger.error(f"RabbitMQ connection/exchange setup failed: {e}")
        return None


def publish_event(routing_key: str, payload: dict):
    ch = _ensure_channel()
    if ch is None:
        logger.warning(f"Skipping event '{routing_key}': RabbitMQ unavailable")
        return
    try:
        body = json.dumps(payload).encode("utf-8")
        ch.basic_publish(
            exchange=EXCHANGE_NAME,
            routing_key=routing_key,
            body=body,
            properties=pika.BasicProperties(content_type='application/json', delivery_mode=2)
        )
    except Exception as e:
        logger.error(f"Failed to publish event '{routing_key}': {e}")