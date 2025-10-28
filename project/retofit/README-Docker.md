# RetroFit App - Docker Setup

Esta aplicación está completamente dockerizada para facilitar el desarrollo y despliegue.

## 🐳 Arquitectura Docker

La aplicación consta de los siguientes servicios:

- **Frontend**: React (puerto 3000)
- **Backend**: FastAPI (puerto 8000)  
- **Base de datos**: PostgreSQL (puerto 5432)
- **Adminer**: Administrador de BD (puerto 8080)

## 🚀 Inicio Rápido

### Prerrequisitos
- Docker
- Docker Compose

### 1. Clonar el repositorio
```bash
git clone <tu-repo>
cd RetoFit-App
```

### 2. Iniciar la aplicación
```bash
# Método 1: Usar docker-compose directamente
docker-compose up -d

# Método 2: Usar el script de desarrollo (Linux/Mac)
chmod +x dev.sh
./dev.sh start

# Método 3: En Windows PowerShell
docker-compose up -d
```

### 3. Acceder a la aplicación
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8000
- **Documentación API**: http://localhost:8000/docs
- **Adminer (BD)**: http://localhost:8080

## 🛠️ Comandos de Desarrollo

### Usando Docker Compose
```bash
# Iniciar servicios
docker-compose up -d

# Ver logs
docker-compose logs -f

# Parar servicios
docker-compose down

# Reconstruir imágenes
docker-compose build --no-cache

# Reiniciar un servicio específico
docker-compose restart backend
```

### Usando el script dev.sh (Linux/Mac)
```bash
./dev.sh start     # Iniciar servicios
./dev.sh stop      # Parar servicios
./dev.sh logs      # Ver logs
./dev.sh build     # Construir imágenes
./dev.sh clean     # Limpiar sistema
./dev.sh db        # Conectar a la BD
```

## 🗄️ Base de Datos

### Credenciales
- **Host**: localhost (o `db` desde otros contenedores)
- **Puerto**: 5432
- **Base de datos**: retrofit_db
- **Usuario**: retrofit_user
- **Contraseña**: retrofit_password

### Conectar desde Adminer
1. Ve a http://localhost:8080
2. Usa las credenciales de arriba
3. Sistema: PostgreSQL

### Conectar directamente a PostgreSQL
```bash
# Desde el host
psql -h localhost -p 5432 -U retrofit_user -d retrofit_db

# Desde el contenedor
docker-compose exec db psql -U retrofit_user -d retrofit_db
```

## 🔧 Desarrollo

### Modificar el código
Los archivos están montados como volúmenes, por lo que los cambios se reflejan inmediatamente:
- Frontend: Hot reload automático
- Backend: Uvicorn con reload automático

### Variables de entorno
Puedes crear archivos `.env` en cada directorio para personalizar la configuración:

#### Backend (.env en Autenticacion/backend/)
```
DATABASE_URL=postgresql://retrofit_user:retrofit_password@db:5432/retrofit_db
SECRET_KEY=tu-clave-secreta
```

#### Frontend (.env en frontend/)
```
REACT_APP_API_URL=http://localhost:8000
```

## 🚀 Producción

Para producción, crea un `docker-compose.prod.yml`:

```yaml
version: '3.8'
services:
  frontend:
    build:
      context: ./frontend
      target: production
    ports:
      - "80:80"
  
  backend:
    build: ./Autenticacion/backend
    environment:
      - DATABASE_URL=postgresql://user:pass@prod-db:5432/db
```

## 🛟 Troubleshooting

### Puerto en uso
```bash
# Ver qué está usando el puerto
netstat -tulpn | grep :3000

# Parar todos los contenedores
docker-compose down
```

### Problemas de permisos (Linux)
```bash
sudo chown -R $USER:$USER .
```

### Limpiar todo y empezar de nuevo
```bash
docker-compose down -v --remove-orphans
docker system prune -f
docker-compose up --build
```

### Logs detallados
```bash
# Ver logs de un servicio específico
docker-compose logs -f backend
docker-compose logs -f frontend
docker-compose logs -f db
```

## 📁 Estructura del Proyecto

```
RetoFit-App/
├── docker-compose.yml          # Orquestación de servicios
├── init.sql                    # Script de inicialización de BD
├── dev.sh                      # Script de desarrollo
├── Autenticacion/
│   └── backend/
│       ├── Dockerfile          # Imagen del backend
│       ├── .dockerignore
│       └── app/                # Código FastAPI
└── frontend/
    ├── Dockerfile              # Imagen del frontend
    ├── .dockerignore
    └── src/                    # Código React
```