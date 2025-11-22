#!/usr/bin/env sh
set -e

OUT_DIR=$(dirname "$0")
CERT="$OUT_DIR/gateway.crt"
KEY="$OUT_DIR/gateway.key"

echo "Generating self-signed cert in $OUT_DIR ..."

openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout "$KEY" -out "$CERT" \
  -subj "/C=CO/ST=Dev/L=Local/O=TaskNotes/OU=Gateway/CN=localhost" \
  -addext "subjectAltName=DNS:localhost,IP:127.0.0.1,IP:::1"

echo "Done: cert=$CERT key=$KEY"