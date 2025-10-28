# TaskNotes - Guía de Despliegue

## Requisitos Previos

### Software Necesario
- Docker (versión 20.10 o superior)
- Docker Compose (versión 2.0 o superior)
- Git

### Recursos del Sistema
- **Mínimo**: 4GB RAM, 2 CPU cores, 10GB espacio en disco
- **Recomendado**: 8GB RAM, 4 CPU cores, 20GB espacio en disco

## Despliegue Local (Desarrollo)

### 1. Clonar el Repositorio
```bash
git clone <repository-url>
cd TaskNotes
```

### 2. Configurar Variables de Entorno

#### Backend
```bash
cd backend
cp .env.example .env
# Editar .env con tus configuraciones
```

#### Microservicio de Búsqueda
```bash
cd search-service
cp .env.example .env
# Editar .env con tus configuraciones
```

### 3. Construir y Ejecutar
```bash
# Desde el directorio raíz del proyecto
docker-compose up -d --build
```

### 4. Verificar el Despliegue
```bash
# Verificar que todos los servicios estén ejecutándose
docker-compose ps

# Verificar logs
docker-compose logs -f
```

### 5. Acceder a la Aplicación
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8000
- **Documentación API**: http://localhost:8000/docs
- **Microservicio de Búsqueda**: http://localhost:8081

## Configuración de Base de Datos

### Migraciones de PostgreSQL
```bash
# Ejecutar migraciones
docker-compose exec backend alembic upgrade head

# Crear nueva migración (si es necesario)
docker-compose exec backend alembic revision --autogenerate -m "descripción"
```

### Verificar MongoDB
```bash
# Conectar a MongoDB
docker-compose exec mongodb mongosh

# Verificar colecciones
use tasknotes
show collections
```

## Despliegue en Producción

### 1. Configuración de Seguridad

#### Variables de Entorno de Producción
```bash
# backend/.env
SECRET_KEY=<clave-secreta-fuerte-aleatoria>
POSTGRES_URL=postgresql://user:password@postgres:5432/tasknotes
MONGODB_URL=mongodb://admin:password@mongodb:27017/tasknotes?authSource=admin
CORS_ORIGINS=["https://tu-dominio.com"]
```

#### Generar Clave Secreta
```bash
python -c "import secrets; print(secrets.token_urlsafe(32))"
```

### 2. Docker Compose para Producción

Crear `docker-compose.prod.yml`:
```yaml
version: '3.8'

services:
  postgres:
    image: postgres:15
    environment:
      POSTGRES_DB: tasknotes
      POSTGRES_USER: ${POSTGRES_USER}
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data
    restart: unless-stopped
    networks:
      - internal

  mongodb:
    image: mongo:7
    environment:
      MONGO_INITDB_ROOT_USERNAME: ${MONGO_USER}
      MONGO_INITDB_ROOT_PASSWORD: ${MONGO_PASSWORD}
    volumes:
      - mongodb_data:/data/db
    restart: unless-stopped
    networks:
      - internal

  backend:
    build: ./backend
    environment:
      POSTGRES_URL: postgresql://${POSTGRES_USER}:${POSTGRES_PASSWORD}@postgres:5432/tasknotes
      MONGODB_URL: mongodb://${MONGO_USER}:${MONGO_PASSWORD}@mongodb:27017/tasknotes?authSource=admin
      SECRET_KEY: ${SECRET_KEY}
    depends_on:
      - postgres
      - mongodb
    restart: unless-stopped
    networks:
      - internal

  frontend:
    build: ./frontend
    ports:
      - "80:80"
      - "443:443"
    depends_on:
      - backend
    restart: unless-stopped
    networks:
      - internal

  search-service:
    build: ./search-service
    environment:
      MONGODB_URL: mongodb://${MONGO_USER}:${MONGO_PASSWORD}@mongodb:27017/tasknotes?authSource=admin
    depends_on:
      - mongodb
    restart: unless-stopped
    networks:
      - internal

volumes:
  postgres_data:
  mongodb_data:

networks:
  internal:
    driver: bridge
```

### 3. Configuración SSL/TLS

#### Nginx con SSL
Actualizar `frontend/nginx.conf`:
```nginx
server {
    listen 80;
    server_name tu-dominio.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name tu-dominio.com;

    ssl_certificate /etc/ssl/certs/cert.pem;
    ssl_certificate_key /etc/ssl/private/key.pem;
    
    # Configuración SSL moderna
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512;
    ssl_prefer_server_ciphers off;
    
    # ... resto de la configuración
}
```

### 4. Desplegar en Producción
```bash
# Usar archivo de producción
docker-compose -f docker-compose.prod.yml up -d --build

# Ejecutar migraciones
docker-compose -f docker-compose.prod.yml exec backend alembic upgrade head
```

## Monitoreo y Mantenimiento

### Health Checks
```bash
# Verificar estado de servicios
curl http://localhost:8000/health
curl http://localhost:8081/health
```

### Logs
```bash
# Ver logs de todos los servicios
docker-compose logs -f

# Ver logs de un servicio específico
docker-compose logs -f backend
```

### Backups

#### PostgreSQL
```bash
# Backup
docker-compose exec postgres pg_dump -U user tasknotes > backup_$(date +%Y%m%d_%H%M%S).sql

# Restore
docker-compose exec -T postgres psql -U user tasknotes < backup.sql
```

#### MongoDB
```bash
# Backup
docker-compose exec mongodb mongodump --db tasknotes --out /backup

# Restore
docker-compose exec mongodb mongorestore --db tasknotes /backup/tasknotes
```

## Escalabilidad

### Load Balancer con Nginx
```nginx
upstream backend_servers {
    server backend1:8000;
    server backend2:8000;
    server backend3:8000;
}

upstream search_servers {
    server search1:8081;
    server search2:8081;
}

server {
    location /api/ {
        proxy_pass http://backend_servers;
    }
    
    location /search/ {
        proxy_pass http://search_servers;
    }
}
```

### Múltiples Instancias
```yaml
# En docker-compose.yml
backend:
  deploy:
    replicas: 3
    
search-service:
  deploy:
    replicas: 2
```

## Troubleshooting

### Problemas Comunes

#### 1. Error de Conexión a Base de Datos
```bash
# Verificar que las bases de datos estén ejecutándose
docker-compose ps

# Verificar logs de la base de datos
docker-compose logs postgres
docker-compose logs mongodb
```

#### 2. Error de CORS
- Verificar `CORS_ORIGINS` en variables de entorno
- Asegurar que el frontend esté en la lista de orígenes permitidos

#### 3. Error de Autenticación JWT
- Verificar que `SECRET_KEY` esté configurada
- Verificar que los tokens no hayan expirado

#### 4. Error de Búsqueda
```bash
# Verificar índices de MongoDB
docker-compose exec mongodb mongosh
use tasknotes
db.notes.getIndexes()
```

### Comandos Útiles

#### Reiniciar Servicios
```bash
# Reiniciar un servicio específico
docker-compose restart backend

# Reiniciar todos los servicios
docker-compose restart
```

#### Limpiar Datos
```bash
# Eliminar volúmenes (¡CUIDADO: elimina todos los datos!)
docker-compose down -v

# Reconstruir imágenes
docker-compose build --no-cache
```

#### Acceso a Contenedores
```bash
# Acceder al contenedor del backend
docker-compose exec backend bash

# Acceder a PostgreSQL
docker-compose exec postgres psql -U user tasknotes

# Acceder a MongoDB
docker-compose exec mongodb mongosh
```

## Consideraciones de Seguridad

### Producción
1. **Cambiar todas las contraseñas por defecto**
2. **Usar HTTPS en producción**
3. **Configurar firewall apropiadamente**
4. **Mantener Docker y dependencias actualizadas**
5. **Usar secretos externos (no archivos .env)**
6. **Implementar rate limiting**
7. **Configurar logging y monitoreo**

### Desarrollo
1. **No usar datos reales en desarrollo**
2. **Mantener .env fuera del control de versiones**
3. **Usar diferentes puertos si es necesario**