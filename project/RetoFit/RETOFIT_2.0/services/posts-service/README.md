# Posts Service - RETOFIT

Microservicio de publicaciones para RETOFIT. Maneja posts, comentarios y likes tipo red social.

## Características

- ✅ Crear, leer, actualizar y eliminar publicaciones
- ✅ Subir imágenes a las publicaciones (con optimización automática)
- ✅ Sistema de comentarios
- ✅ Sistema de likes (toggle)
- ✅ Paginación en el feed
- ✅ Autenticación JWT (integrada con auth-service)
- ✅ Validación de permisos (solo el autor puede editar/eliminar)

## Tecnologías

- **Node.js** + **TypeScript**
- **Express** - Framework web
- **Prisma** - ORM para PostgreSQL
- **Multer** - Subida de archivos
- **Sharp** - Procesamiento de imágenes
- **JWT** - Autenticación

## Instalación

```bash
# Instalar dependencias
npm install

# Configurar variables de entorno
cp .env.example .env
# O en Windows: Copy-Item .env.example .env

# Generar cliente de Prisma
npm run prisma:generate

# IMPORTANTE: No ejecutar prisma db push (eliminará tablas existentes)
# En su lugar, ejecutar el script SQL manualmente:
# 1. Conectarse a PostgreSQL
# 2. Ejecutar: prisma/migrations/0001_create_posts_tables.sql

# Modo desarrollo (con hot-reload)
npm run dev

# Producción
npm run build
npm start
```

## 🔧 Configuración

### Variables de Entorno

El archivo `.env.example` contiene todas las credenciales necesarias:

```bash
# Copiar el archivo de ejemplo
cp .env.example .env
```

**Nota:** El archivo `.env.example` ya tiene las credenciales de:
- Base de datos PostgreSQL (AWS RDS)
- JWT Secret (compartido con otros servicios)
- Cloudinary (almacenamiento de imágenes en la nube)

### Cloudinary

Las imágenes se suben automáticamente a Cloudinary (no se almacenan localmente). Esto permite que:
- ✅ Todos los desarrolladores vean las mismas imágenes
- ✅ Las imágenes se optimicen automáticamente (webp, compresión)
- ✅ URLs públicas HTTPS funcionan en producción

Puedes ver las imágenes en: https://console.cloudinary.com/console/media_library

## Configurar Base de Datos

**⚠️ ADVERTENCIA**: NO uses `npx prisma db push` porque eliminará las tablas de otros servicios.

### Ejecutar la migración SQL manualmente:

**Opción 1: Con psql (línea de comandos)**
```bash
psql "postgresql://postgres:Retofit2025@retofit.cd66iick6o60.us-east-2.rds.amazonaws.com:5432/RetoFit" -f prisma/migrations/0001_create_posts_tables.sql
```

**Opción 2: Con un cliente SQL** (DBeaver, pgAdmin, TablePlus, etc.)
- Conectarse a la base de datos
- Abrir el archivo `prisma/migrations/0001_create_posts_tables.sql`
- Ejecutar el script

Esto creará las tablas `posts`, `comments` y `likes` sin tocar las tablas existentes.

## Variables de Entorno

Archivo `.env` ya configurado con:

```env
DATABASE_URL=<tu-conexión-postgresql>
SECRET_KEY=<misma-que-otros-servicios>
ALGORITHM=HS256
PORT=8005
MAX_FILE_SIZE=5242880
UPLOAD_DIR=./uploads
```

## Endpoints

### Posts

- `GET /posts/posts` - Listar posts (feed) con paginación
  - Query params: `?page=1&limit=10`
- `GET /posts/posts/:id` - Obtener un post específico
- `POST /posts/posts` - Crear post
  - Body: `{ "content": "texto del post" }`
- `POST /posts/posts/:id/upload` - Subir imagen a un post
  - FormData: `image` (archivo)
- `PUT /posts/posts/:id` - Actualizar post (solo autor)
  - Body: `{ "content": "nuevo texto" }`
- `DELETE /posts/posts/:id` - Eliminar post (solo autor)

### Comentarios

- `GET /posts/posts/:id/comments` - Listar comentarios de un post
- `POST /posts/posts/:id/comments` - Comentar en un post
  - Body: `{ "content": "texto del comentario" }`
- `DELETE /posts/comments/:id` - Eliminar comentario (solo autor)

### Likes

- `POST /posts/posts/:id/like` - Dar/quitar like (toggle)
- `GET /posts/posts/:id/likes` - Obtener likes de un post

## Autenticación

Todos los endpoints requieren un token JWT válido en el header:

```
Authorization: Bearer <token>
```

El token debe ser generado por `auth-service` y contener el `sub` (email del usuario).

## Estructura de Datos

### Post
```json
{
  "id": 1,
  "userEmail": "user@example.com",
  "content": "Mi primer post!",
  "imageUrl": "http://localhost:8005/uploads/optimized-post-123456.jpg",
  "createdAt": "2025-10-13T12:00:00Z",
  "updatedAt": "2025-10-13T12:00:00Z",
  "likesCount": 5,
  "commentsCount": 3,
  "isLikedByUser": true,
  "comments": [...],
  "likes": [...]
}
```

### Comment
```json
{
  "id": 1,
  "postId": 1,
  "userEmail": "user@example.com",
  "content": "Gran post!",
  "createdAt": "2025-10-13T12:05:00Z"
}
```

## Prisma Studio

Para ver la base de datos visualmente:

```bash
npm run prisma:studio
```

## Puerto

El servicio corre en `http://localhost:8005`
