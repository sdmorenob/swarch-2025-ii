# Secrets

Este directorio contiene los secrets de Kubernetes para RetoFit 2.0.

## Aplicar Secrets

```bash
# Aplicar todos los secrets YAML
kubectl apply -f k8s/02-secrets/

# Verificar
kubectl get secrets
```

## Crear TLS Secret (Nginx)

### Paso 1: Generar Certificados TLS

**IMPORTANTE**: Antes de crear el secret, debes generar los certificados TLS.

**Opción A - Script automatizado (Recomendado):**

```bash
# Desde el directorio k8s/
cd ..
.\generate-certs.ps1    # PowerShell (Windows)
./generate-certs.sh     # Bash (Linux/Mac/Git Bash)
```

**Opción B - Manualmente con OpenSSL:**

```bash
# Crear directorio si no existe
mkdir -p ../../nginx/tls

# Generar clave privada
openssl genrsa -out ../../nginx/tls/nginx-key.pem 2048

# Generar certificado autofirmado
openssl req -new -x509 -sha256 \
  -key ../../nginx/tls/nginx-key.pem \
  -out ../../nginx/tls/nginx.pem \
  -days 365 \
  -subj "/C=CO/ST=Cundinamarca/L=Bogota/O=RetoFit/OU=Development/CN=localhost" \
  -addext "subjectAltName=DNS:localhost,DNS:*.localhost,IP:127.0.0.1"
```

### Paso 2: Crear Secret en Kubernetes

```bash
# Desde el directorio raíz del proyecto
kubectl create secret generic nginx-tls-secret \
  --from-file=nginx.pem=./nginx/tls/nginx.pem \
  --from-file=nginx-key.pem=./nginx/tls/nginx-key.pem
```

⚠️ **Nota**: Los certificados generados son autofirmados para desarrollo local. Los navegadores mostrarán advertencias de seguridad - esto es normal.

## Verificar Secrets

```bash
# Ver todos los secrets
kubectl get secrets

# Ver detalles de un secret específico
kubectl describe secret jwt-secret

# Ver valor decodificado de un secret (para debugging)
kubectl get secret jwt-secret -o jsonpath='{.data.SECRET_KEY}' | base64 -d
```

## Secrets Incluidos

1. **jwt-secret** - JWT secret key compartido (auth, users, posts, api-gateway)
2. **database-secrets** - Credenciales PostgreSQL (5 bases de datos en AWS RDS)
3. **mongodb-secret** - Credenciales MongoDB (Railway)
4. **smtp-secret** - Credenciales Gmail SMTP (auth-service)
5. **cloudinary-secret** - Credenciales Cloudinary (posts-service)
6. **firebase-secret** - Configuración Firebase (frontend)
7. **gemini-secret** - API key Gemini (frontend)
8. **nginx-tls-secret** - Certificados TLS (crear manualmente con kubectl)

## Seguridad

⚠️ **IMPORTANTE**: Estos archivos contienen credenciales sensibles.

- **NO** commitear estos archivos a Git en producción
- Considerar usar External Secrets Operator o Sealed Secrets
- Rotar credenciales regularmente
- Usar RBAC para limitar acceso a secrets
