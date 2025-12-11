# Guía de Inicio Rápido para Despliegue en GKE: MusicShare

Esta guía contiene los comandos ajustados específicamente para tu entorno de Google Kubernetes Engine (GKE) basándose en la configuración de tu clúster.

**Información del Entorno:**
- **Proyecto GCP:** `musicshare-480712`
- **Clúster GKE:** `musicshare-cluster`
- **Región/Zona:** `us-central1-a`
- **Endpoint Público:** `35.193.56.248`

---

## 🚀 Paso 1: Configurar `gcloud` y `kubectl`

Estos comandos configurarán tu SDK de Google Cloud y `kubectl` para que apunten a tu clúster GKE.

```powershell
# 1. Autenticarse con Google Cloud (si no lo has hecho)
gcloud auth login

# 2. Establecer el proyecto por defecto
gcloud config set project musicshare-480712

# 3. Obtener las credenciales de tu clúster para kubectl
gcloud container clusters get-credentials musicshare-cluster --region us-central1-a

# 4. Verificar la conexión al clúster
kubectl cluster-info
kubectl get nodes
```

---

## 📦 Paso 2: Crear Artifact Registry para Imágenes Docker

Si aún no tienes un repositorio en Artifact Registry para tus imágenes, créalo con este comando.

```powershell
# Crear un repositorio de Docker llamado 'musicshare-docker' en la región 'us-central1'
gcloud artifacts repositories create musicshare-docker `
  --repository-format=docker `
  --location=us-central1 `
  --description="Repositorio de imágenes para MusicShare"

# Configurar Docker para autenticarse con Artifact Registry
gcloud auth configure-docker us-central1-docker.pkg.dev
```

---

## 🛠️ Paso 3: Construir y Publicar las Imágenes Docker

Ahora, construye cada una de las imágenes de tus microservicios y súbelas a tu Artifact Registry.

```powershell
# Variables para simplificar los comandos
$REGISTRY = "us-central1-docker.pkg.dev"
$PROJECT = "musicshare-480712"
$REPO = "musicshare-docker"

# 1. Frontend
docker build -t "$REGISTRY/$PROJECT/$REPO/frontend:latest" ./frontend/MusicShareFrontend/
docker push "$REGISTRY/$PROJECT/$REPO/frontend:latest"

# 2. User Service
docker build -t "$REGISTRY/$PROJECT/$REPO/userservice:latest" ./userservice/
docker push "$REGISTRY/$PROJECT/$REPO/userservice:latest"

# 3. Music Service
docker build -t "$REGISTRY/$PROJECT/$REPO/musicservice:latest" ./musicservice/
docker push "$REGISTRY/$PROJECT/$REPO/musicservice:latest"

# 4. Social Service
docker build -t "$REGISTRY/$PROJECT/$REPO/social-service:latest" ./socialservice/
docker push "$REGISTRY/$PROJECT/$REPO/social-service:latest"

# 5. Notification Service
docker build -t "$REGISTRY/$PROJECT/$REPO/notificationservice:latest" ./notificationservice/
docker push "$REGISTRY/$PROJECT/$REPO/notificationservice:latest"

# 6. Metadata Service
docker build -t "$REGISTRY/$PROJECT/$REPO/metadata-service:latest" ./metadataservice/
docker push "$REGISTRY/$PROJECT/$REPO/metadata-service:latest"
```
**Importante:** Antes de desplegar, asegúrate de que los archivos de manifiesto de Kubernetes (`.yaml`) usen estas nuevas URLs de imágenes.

---

## 🔑 Paso 4: Crear Secretos para la Base de Datos Cloud SQL

Crea un secreto de Kubernetes con las credenciales para conectarte a tu instancia de Cloud SQL.

```powershell
# IMPORTANTE: Reemplaza con el "Nombre de conexión de la instancia" que encuentras en la consola de Cloud SQL
$INSTANCE_CONNECTION_NAME="musicshare-480712:us-central1:musicshare-postgres" # Ejemplo, ajústalo al tuyo

# IMPORTANTE: Reemplaza con la contraseña que configuraste para el usuario 'musicshare_user'
$DB_PASSWORD="tu-contraseña-segura"

# Crear el namespace si no existe
kubectl create namespace musicshare --dry-run=client -o yaml | kubectl apply -f -

# Crear el secreto en el namespace 'musicshare'
kubectl create secret generic cloudsql-db-credentials `
  --from-literal=username=musicshare_user `
  --from-literal=password=$DB_PASSWORD `
  --from-literal=database=musicshare `
  --from-literal=instance_connection_name=$INSTANCE_CONNECTION_NAME `
  -n musicshare

# Verificar que el secreto fue creado
kubectl get secret cloudsql-db-credentials -n musicshare
```

---

## 🚀 Paso 5: Desplegar la Aplicación en GKE

Con las imágenes publicadas y los secretos creados, puedes desplegar la aplicación usando tus manifiestos de Kustomize.

**Nota:** Asegúrate de haber seguido las instrucciones anteriores para modificar `backend-deployments-services.yaml` y `kustomization.yaml` para usar Cloud SQL Proxy y no la base de datos local.

```powershell
# Desplegar todos los recursos de la aplicación
kubectl apply -k k8s/

# Monitorear el despliegue de los pods en tiempo real
kubectl get pods -n musicshare -w
```

---

## 🌐 Paso 6: Verificar y Obtener IP de Acceso

Una vez que todos los pods estén en estado `Running`, obtén la dirección IP externa del Ingress Controller para acceder a tu aplicación.

```powershell
# Esperar a que el Load Balancer de NGINX obtenga una IP externa
kubectl get svc -n ingress-nginx -w

# Obtener la IP externa una vez que esté asignada
$INGRESS_IP = kubectl get svc -n ingress-nginx nginx-ingress-ingress-nginx-controller -o jsonpath='{.status.loadBalancer.ingress[0].ip}'
echo "La aplicación es accesible en: http://$INGRESS_IP" '
echo "API Gateway: http://$INGRESS_IP/api/users/health"
```

Puedes usar la IP obtenida para acceder a la interfaz de usuario y probar los endpoints de la API.
