#!/bin/sh
set -e

APP_MODULE="main:combined_app"
HOST="0.0.0.0"
PORT_INSECURE="8083"
PORT_TLS="8443"

ENABLE_HTTPS=${ENABLE_HTTPS:-false}
CERT_FILE=${TLS_CERT_PATH:-/certs/gateway.crt}
KEY_FILE=${TLS_KEY_PATH:-/certs/gateway.key}

echo "[start] ENABLE_HTTPS=$ENABLE_HTTPS"

if [ "$ENABLE_HTTPS" = "true" ] && [ -f "$CERT_FILE" ] && [ -f "$KEY_FILE" ]; then
  echo "[start] Starting HTTPS on port $PORT_TLS"
  exec uvicorn "$APP_MODULE" --host "$HOST" --port "$PORT_TLS" \
    --ssl-certfile "$CERT_FILE" --ssl-keyfile "$KEY_FILE"
else
  echo "[start] Starting HTTP on port $PORT_INSECURE"
  exec uvicorn "$APP_MODULE" --host "$HOST" --port "$PORT_INSECURE"
fi