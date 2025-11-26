#!/usr/bin/env bash
set -euo pipefail

# Rotate mTLS certificates for internal gRPC if expiring soon
# - Checks CA and leaf certs using openssl -checkend
# - Reissues server certs (notes, tasks) and client cert (search)
# - Restarts affected services via docker compose

DIR="$(cd "$(dirname "$0")" && pwd)"
OUT="$DIR/grpc"
TASKNOTES_DIR="$(dirname "$DIR")"
COMPOSE_FILE="$TASKNOTES_DIR/docker-compose.e2e.dist.yml"

THRESHOLD_DAYS="${ROTATE_THRESHOLD_DAYS:-30}"
THRESHOLD_SEC=$(( THRESHOLD_DAYS * 86400 ))

if ! command -v openssl >/dev/null 2>&1; then
  echo "Error: openssl CLI not found in PATH" >&2
  exit 1
fi

CA_CRT="$OUT/ca.crt"
CA_KEY="$OUT/ca.key"
if [[ ! -f "$CA_CRT" || ! -f "$CA_KEY" ]]; then
  echo "Error: CA files not found in $OUT (expected ca.crt and ca.key)" >&2
  exit 1
fi

rotate_server() {
  local name="$1"
  local cn="$2"
  local san_dns="$3"
  local crt="$OUT/${name}.crt"
  local key="$OUT/${name}.key"
  if [[ ! -f "$crt" || ! -f "$key" ]]; then
    echo "Skipping $name: missing cert or key"
    return
  fi
  if openssl x509 -checkend "$THRESHOLD_SEC" -noout -in "$crt"; then
    echo "OK: $name cert valid > ${THRESHOLD_DAYS}d"
    return
  fi
  echo "Rotating server cert: $name"
  local csr="$OUT/${name}.csr"
  local ext="$OUT/${name}-san.cnf"
  openssl req -new -key "$key" -subj "/CN=${cn}" -out "$csr"
  cat > "$ext" <<EOF
[ v3_req ]
subjectAltName=DNS:${san_dns}
extendedKeyUsage = serverAuth
keyUsage = digitalSignature, keyEncipherment
EOF
  cp "$crt" "$crt.bak" || true
  openssl x509 -req -in "$csr" -CA "$CA_CRT" -CAkey "$CA_KEY" -CAcreateserial \
    -out "$crt" -days 365 -sha256 -extensions v3_req -extfile "$ext"
  rm -f "$csr" "$ext"
}

rotate_client() {
  local name="$1"
  local cn="$2"
  local crt="$OUT/${name}.crt"
  local key="$OUT/${name}.key"
  if [[ ! -f "$crt" || ! -f "$key" ]]; then
    echo "Skipping $name: missing cert or key"
    return
  fi
  if openssl x509 -checkend "$THRESHOLD_SEC" -noout -in "$crt"; then
    echo "OK: $name cert valid > ${THRESHOLD_DAYS}d"
    return
  fi
  echo "Rotating client cert: $name"
  local csr="$OUT/${name}.csr"
  local ext="$OUT/${name}-ext.cnf"
  openssl req -new -key "$key" -subj "/CN=${cn}" -out "$csr"
  cat > "$ext" <<EOF
[ v3_req ]
extendedKeyUsage = clientAuth
keyUsage = digitalSignature, keyEncipherment
EOF
  cp "$crt" "$crt.bak" || true
  openssl x509 -req -in "$csr" -CA "$CA_CRT" -CAkey "$CA_KEY" -CAcreateserial \
    -out "$crt" -days 365 -sha256 -extensions v3_req -extfile "$ext"
  rm -f "$csr" "$ext"
}

rotate_server "notes" "notes-service" "notes-service"
rotate_server "tasks" "tasks-service" "tasks-service"
rotate_client "search-client" "search-service"

echo "Restarting services to reload certificates"
docker compose -f "$COMPOSE_FILE" restart notes-service tasks-service search-service
echo "Done"