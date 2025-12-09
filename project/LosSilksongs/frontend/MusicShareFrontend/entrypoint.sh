#!/bin/sh
set -e

# Define las variables de entorno por defecto si no están presentes
GRAPHQL_ENDPOINT="${GRAPHQL_ENDPOINT:-/graphql}"

echo "Setting GRAPHQL_ENDPOINT to: $GRAPHQL_ENDPOINT"

# Genera el archivo env-config.js que será cargado por el HTML
cat > /usr/share/nginx/html/env-config.js << EOF
window.__ENV__ = {
  GRAPHQL_ENDPOINT: '$GRAPHQL_ENDPOINT'
};
EOF

echo "env-config.js generated successfully"

# Define la plantilla y el archivo de salida
TEMPLATE_FILE="/etc/nginx/conf.d/default.conf.template"
OUTPUT_FILE="/etc/nginx/conf.d/default.conf"

# Sustituye la variable de entorno y crea el archivo de configuración final
envsubst '$USERSERVICE_URL,$MUSICSERVICE_URL,$SOCIALSERVICE_URL' < "$TEMPLATE_FILE" > "$OUTPUT_FILE"

echo "Nginx configuration updated:"
cat "$OUTPUT_FILE"

# Inicia Nginx en primer plano
exec nginx -g 'daemon off;'
