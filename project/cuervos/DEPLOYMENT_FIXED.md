# TaskNotes - Guía de Despliegue (Corregida)

## ✅ Correcciones Aplicadas

Este documento refleja las correcciones aplicadas al proyecto TaskNotes para resolver los problemas identificados.

### Problemas Corregidos

1. **✅ Configuración de Base de Datos**: Unificadas las credenciales entre docker-compose.yml y config.py
2. **✅ CORS**: Configuración centralizada usando settings
3. **✅ Variables de Entorno**: Creados archivos env.example
4. **✅ Health Checks**: Agregado curl a Dockerfiles y health checks al docker-compose
5. **✅ Dependencias**: Actualizada versión de TypeScript para compatibilidad
6. **✅ Validación**: Mejorada validación de entrada en microservicio de búsqueda

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
cp env.example .env
# Editar .env con tus configuraciones si es necesario
```

#### Microservicio de Búsqueda
```bash
cd search-service
cp env.example .env
# Editar .env con tus configuraciones si es necesario
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

# Verificar health checks
docker-compose ps
# Todos los servicios deben mostrar "healthy" en la columna STATUS
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

## Testing del Sistema

### 1. Verificar Health Checks
```bash
# Backend
curl http://localhost:8000/health

# Search Service
curl http://localhost:8081/health

# Respuesta esperada: {"status": "healthy", "service": "..."}
```

### 2. Probar Funcionalidades
1. **Crear una cuenta de usuario** a través del frontend
2. **Crear tareas** con diferentes categorías y prioridades
3. **Agregar notas** y probar la funcionalidad de búsqueda
4. **Probar actualizaciones en tiempo real** abriendo múltiples pestañas del navegador

### 3. Probar Búsqueda
```bash
# Ejemplo de búsqueda en notas
curl -X POST http://localhost:8081/search \
  -H "Content-Type: application/json" \
  -d '{
    "query": "texto a buscar",
    "user_id": 1,
    "limit": 10
  }'
```

## Troubleshooting

### Problemas Comunes y Soluciones

#### 1. Error de Conexión a Base de Datos
```bash
# Verificar que las bases de datos estén ejecutándose
docker-compose ps

# Verificar logs de la base de datos
docker-compose logs postgres
docker-compose logs mongodb

# Reiniciar servicios si es necesario
docker-compose restart postgres mongodb
```

#### 2. Error de CORS
- Verificar que `BACKEND_CORS_ORIGINS` esté configurado correctamente
- Asegurar que el frontend esté en la lista de orígenes permitidos
- Verificar que el backend esté usando la configuración centralizada

#### 3. Error de Health Check
```bash
# Verificar que curl esté instalado en los contenedores
docker-compose exec backend curl --version
docker-compose exec search-service curl --version

# Verificar endpoints de health
docker-compose exec backend curl http://localhost:8000/health
docker-compose exec search-service curl http://localhost:8081/health
```

#### 4. Error de Búsqueda
```bash
# Verificar índices de MongoDB
docker-compose exec mongodb mongosh
use tasknotes
db.notes.getIndexes()

# Crear índice de texto si no existe
db.notes.createIndex({title: "text", content: "text"})
```

### Comandos Útiles

#### Reiniciar Servicios
```bash
# Reiniciar un servicio específico
docker-compose restart backend

# Reiniciar todos los servicios
docker-compose restart

# Reconstruir y reiniciar
docker-compose up -d --build
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

## Mejoras Implementadas

### Seguridad
- ✅ Validación de entrada mejorada en microservicio de búsqueda
- ✅ Límites de longitud para queries, categorías y etiquetas
- ✅ Validación de parámetros de paginación

### Configuración
- ✅ Variables de entorno centralizadas
- ✅ Configuración de CORS unificada
- ✅ Credenciales de base de datos consistentes

### Monitoreo
- ✅ Health checks en todos los servicios
- ✅ Logs estructurados
- ✅ Timeouts configurables

### Despliegue
- ✅ Dockerfiles optimizados
- ✅ Dependencias actualizadas
- ✅ Configuración de producción lista

## Próximos Pasos Recomendados

1. **Implementar tests automatizados**
2. **Agregar logging estructurado**
3. **Implementar rate limiting**
4. **Configurar SSL/TLS para producción**
5. **Implementar backup automatizado**
6. **Agregar métricas y monitoreo**

## Contacto

Para reportar problemas o sugerir mejoras, crear un issue en el repositorio del proyecto.
