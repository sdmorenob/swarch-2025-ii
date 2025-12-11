# Mapeo de imágenes para ECR

Reemplaza `ACCOUNT_ID` y `REGION` y publica las imágenes con la misma versión usada en los manifests.

```
aws ecr get-login-password --region REGION | docker login --username AWS --password-stdin ACCOUNT_ID.dkr.ecr.REGION.amazonaws.com

# Ejemplo build/push (ajusta paths):
docker build -t tasknotes/api-gateway:local ./api-gateway
TAG=ACCOUNT_ID.dkr.ecr.REGION.amazonaws.com/tasknotes/api-gateway:v1.0.0
docker tag tasknotes/api-gateway:local $TAG
docker push $TAG
```

## Repositorios sugeridos
- tasknotes/api-gateway
- tasknotes/frontend-micro
- tasknotes/frontend-ssr
- tasknotes/auth-service
- tasknotes/tasks-service
- tasknotes/notes-service
- tasknotes/tags-service
- tasknotes/categories-service-dotnet
- tasknotes/user-profile-service
- tasknotes/search-service
- tasknotes/logs-service-java

## Actualiza las imágenes en manifests
Buscar `image: tasknotes/<service>:local` y sustituir por `ACCOUNT_ID.dkr.ecr.REGION.amazonaws.com/tasknotes/<service>:v1.0.0`.
Usa `imagePullPolicy: IfNotPresent` o fija tags inmutables (`v1.0.0`).
