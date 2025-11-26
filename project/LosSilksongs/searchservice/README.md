# SearchService - MusicShare

## 📋 Descripción

El SearchService es un microservicio (pendiente de implementación) que proporcionará capacidades de búsqueda avanzada para la plataforma MusicShare.

## 🎯 Funcionalidades Planeadas

- Búsqueda de canciones por título, artista o álbum
- Búsqueda de usuarios
- Búsqueda de playlists
- Búsqueda de posts sociales
- Autocompletado y sugerencias
- Filtros avanzados

## 🔌 Integración con API Gateway

Una vez implementado, este servicio será expuesto a través del API Gateway de Traefik en la ruta:

```
/api/search
```

### Configuración sugerida para docker-compose.yml

```yaml
searchservice:
  build:
    context: ./searchservice
    dockerfile: Dockerfile
  container_name: musicshare-searchservice
  restart: unless-stopped
  environment:
    PORT: 8084
    # Agregar variables de conexión a bases de datos si es necesario
  networks:
    - backend_net
    - data_net
  labels:
    - "traefik.enable=true"
    - "traefik.http.routers.searchservice.rule=PathPrefix(`/api/search`)"
    - "traefik.http.middlewares.searchservice-stripprefix.stripprefix.prefixes=/api/search"
    - "traefik.http.routers.searchservice.middlewares=searchservice-stripprefix"
    - "traefik.http.services.searchservice.loadbalancer.server.port=8084"
    - "traefik.http.routers.searchservice.entrypoints=websecure"
    - "traefik.http.routers.searchservice.tls=true"
```

## 🚀 Tecnologías Sugeridas

- **Framework**: FastAPI (Python), Express (Node.js), o Gin (Go)
- **Motor de búsqueda**: Elasticsearch o PostgreSQL Full-Text Search
- **Base de datos**: Conexión a MongoDB/PostgreSQL existentes

## 📊 Estado Actual

⚠️ **En planificación**: Este servicio aún no ha sido implementado. Actualmente solo existe el directorio placeholder.

## 🔗 Dependencias

- MongoDB (datos de canciones, playlists)
- PostgreSQL (datos de usuarios)
- MusicService (metadatos de música)
- UserService (información de usuarios)
- SocialService (posts y contenido social)

---

*Nota: Este documento será actualizado cuando se implemente el servicio.*
