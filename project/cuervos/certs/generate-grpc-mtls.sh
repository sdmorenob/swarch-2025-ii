#!/usr/bin/env bash
set -euo pipefail

# Generate internal CA and issue mTLS certs for gRPC services
# - CA: certs/grpc/ca.crt, certs/grpc/ca.key
# - Notes server: certs/grpc/notes.crt, notes.key (SAN: DNS:notes-service)
# - Tasks server: certs/grpc/tasks.crt, tasks.key (SAN: DNS:tasks-service)
# - Search client: certs/grpc/search-client.crt, search-client.key

DIR="$(cd "$(dirname "$0")" && pwd)"
OUT="$DIR/grpc"
mkdir -p "$OUT"

echo "[1/6] Generating CA key and certificate"
openssl genrsa -out "$OUT/ca.key" 4096
openssl req -x509 -new -nodes -key "$OUT/ca.key" -sha256 -days 365 \
  -subj "/CN=TaskNotes-Internal-CA" -out "$OUT/ca.crt"

make_server() {
  local name="$1"
  local cn="$2"
  local san_dns="$3"
  echo "[2/x] Generating server key/csr for $name (CN=$cn, SAN=$san_dns)"
  openssl genrsa -out "$OUT/${name}.key" 2048
  openssl req -new -key "$OUT/${name}.key" -subj "/CN=${cn}" -out "$OUT/${name}.csr"
  cat > "$OUT/${name}-san.cnf" <<EOF
[ v3_req ]
subjectAltName=DNS:${san_dns}
extendedKeyUsage = serverAuth
keyUsage = digitalSignature, keyEncipherment
EOF
  openssl x509 -req -in "$OUT/${name}.csr" -CA "$OUT/ca.crt" -CAkey "$OUT/ca.key" -CAcreateserial \
    -out "$OUT/${name}.crt" -days 365 -sha256 -extensions v3_req -extfile "$OUT/${name}-san.cnf"
  rm -f "$OUT/${name}-san.cnf" "$OUT/${name}.csr"
}

make_client() {
  local name="$1"
  local cn="$2"
  echo "[x/6] Generating client key/csr for $name (CN=$cn)"
  openssl genrsa -out "$OUT/${name}.key" 2048
  openssl req -new -key "$OUT/${name}.key" -subj "/CN=${cn}" -out "$OUT/${name}.csr"
  cat > "$OUT/${name}-ext.cnf" <<EOF
[ v3_req ]
extendedKeyUsage = clientAuth
keyUsage = digitalSignature, keyEncipherment
EOF
  openssl x509 -req -in "$OUT/${name}.csr" -CA "$OUT/ca.crt" -CAkey "$OUT/ca.key" -CAcreateserial \
    -out "$OUT/${name}.crt" -days 365 -sha256 -extensions v3_req -extfile "$OUT/${name}-ext.cnf"
  rm -f "$OUT/${name}-ext.cnf" "$OUT/${name}.csr"
}

make_server "notes" "notes-service" "notes-service"
make_server "tasks" "tasks-service" "tasks-service"
make_client "search-client" "search-service"

echo "Done. Files in $OUT:" 
ls -1 "$OUT"
echo "\nMount this directory to services as /grpc-certs:ro"