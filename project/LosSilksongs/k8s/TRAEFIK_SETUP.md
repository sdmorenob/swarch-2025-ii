# Guía de instalación y configuración de Traefik en MusicShare

## Paso 1: Instalar cert-manager (para TLS automático, opcional)

```bash
# Agregar repositorio de Jetstack
helm repo add jetstack https://charts.jetstack.io
helm repo update

# Instalar cert-manager
helm install cert-manager jetstack/cert-manager \
  --namespace cert-manager \
  --create-namespace \
  --version v1.13.2
```

## Paso 2: Aplicar manifiestos de Traefik (en orden)

```bash
# 1. Crear namespace
kubectl apply -f k8s/namespace.yaml

# 2. Aplicar CRDs de Traefik (IngressRoute, Middleware, etc.)
kubectl apply -f k8s/traefik-crd.yaml

# 3. Aplicar configuración de Traefik (ConfigMap)
kubectl apply -f k8s/traefik-config.yaml

# 4. Aplicar Deployment de Traefik con ServiceAccount y RBAC
kubectl apply -f k8s/traefik-deployment-updated.yaml

# 5. Aplicar IngressRoutes para los servicios
kubectl apply -f k8s/ingressroutes.yaml

# 6. Aplicar cert-manager ClusterIssuers (si instalaste cert-manager)
kubectl apply -f k8s/cert-manager.yaml
```

## Paso 3: Desplegar otros servicios

```bash
kubectl apply -f k8s/frontend-deployment-service.yaml
kubectl apply -f k8s/backend-deployments-services.yaml
kubectl apply -f k8s/databases.yaml
kubectl apply -f k8s/hpa.yaml
```

## Verificar instalación

```bash
# Ver Traefik pods
kubectl get pods -n musicshare -l app=traefik-gateway

# Ver IngressRoutes
kubectl get ingressroutes -n musicshare

# Ver Middlewares
kubectl get middlewares -n musicshare

# Ver servicios
kubectl get svc -n musicshare

# Ver logs de Traefik
kubectl logs -n musicshare deployment/traefik-gateway -f

# Acceder al dashboard de Traefik
# Port-forward para acceso local:
kubectl port-forward -n musicshare svc/traefik-gateway 8080:8080
# Luego abrir: http://localhost:8080/dashboard/
```

## Rutas disponibles

Con esta configuración, tendrás acceso a:

- Frontend: `http://localhost/` (o el LoadBalancer IP)
- User Service: `http://localhost/api/users/`
- Music Service: `http://localhost/api/music/`
- Social Service: `http://localhost/api/social/`
- Notification Service: `http://localhost/api/notifications/`
- WebSocket: `http://localhost/ws`
- Dashboard Traefik: `http://localhost:8080/dashboard/`

## Configuración de TLS (HTTPS)

Si deseas activar HTTPS con certificados automáticos usando cert-manager:

1. Editar `k8s/ingressroutes.yaml`
2. Agregar sección `tls` a cada IngressRoute:

```yaml
spec:
  entryPoints:
    - web
    - websecure
  routes:
    ...
  tls:
    certResolver: letsencrypt-prod
```

3. Reemplazar `email` y dominio en `k8s/cert-manager.yaml`
4. Aplicar los cambios

## Troubleshooting

### Traefik no ve los IngressRoutes
- Verifica que el CRD esté instalado: `kubectl get crd | grep ingressroute`
- Revisa logs: `kubectl logs -n musicshare deployment/traefik-gateway`
- Verifica ServiceAccount y RBAC: `kubectl get clusterrole traefik-musicshare`

### LoadBalancer pending
- En minikube: `minikube tunnel` en otra terminal
- En AWS/GKE: Esperar a que AWS asigne una IP pública

### Certificados no se generan
- Verifica cert-manager: `kubectl get pods -n cert-manager`
- Revisa Issuers: `kubectl describe clusterissuer letsencrypt-prod -n cert-manager`

## Nota sobre arquitectura

- **Load Balancer público** (tipo `LoadBalancer`): `frontend-loadbalancer`
- **API Gateway** (Traefik): Deployment interno (ClusterIP), enruta a todos los microservicios
- **Separación**: El LB público apunta al frontend; Traefik maneja el enrutado API interno
