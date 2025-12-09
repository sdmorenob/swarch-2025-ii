import os
import json
import pika

RABBITMQ_URL = os.getenv("RABBITMQ_URL", "amqp://rabbitmq:5672")
EXCHANGE_NAME = os.getenv("EVENTS_EXCHANGE", "tasknotes.events")


def _get_connection_channel():
    params = pika.URLParameters(RABBITMQ_URL)
    connection = pika.BlockingConnection(params)
    channel = connection.channel()
    channel.exchange_declare(exchange=EXCHANGE_NAME, exchange_type="topic", durable=True)
    return connection, channel


def publish_event(routing_key: str, payload: dict) -> None:
    connection, channel = _get_connection_channel()
    body = json.dumps(payload)
    channel.basic_publish(
        exchange=EXCHANGE_NAME,
        routing_key=routing_key,
        body=body,
        properties=pika.BasicProperties(content_type="application/json", delivery_mode=2),
    )
    connection.close()