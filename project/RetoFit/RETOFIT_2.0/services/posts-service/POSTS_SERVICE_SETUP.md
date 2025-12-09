# POSTS SERVICE SETUP - Pasos de inicio

## Estado actual
- ✅ Base de datos configurada (tablas: posts, comments, likes)
- ✅ Dependencias instaladas
- ✅ Cliente Prisma generado

## Para arrancar el servicio posts-service:

### 1. Abrir una terminal Git Bash en `services/posts-service`

```bash
cd C:/Users/ca22a/Documents/2025-2/retofit/RETOFIT_2.0/services/posts-service
```

### 2. Iniciar el servidor

```bash
npm run dev
```

Deberías ver:
```
✅ Posts Service running on port 8005
```

### 3. Verificar que todos los servicios estén corriendo

Asegúrate de tener estos servicios activos:

- ✅ auth-service: http://127.0.0.1:8001
- ✅ activities-service: http://127.0.0.1:8002
- ✅ gamification-service: http://127.0.0.1:8003
- ✅ user-service: http://127.0.0.1:8004
- 🆕 **posts-service: http://127.0.0.1:8005** ← ESTE ES EL NUEVO

### 4. Reiniciar el frontend Next.js

```bash
cd C:/Users/ca22a/Documents/2025-2/retofit/RETOFIT_2.0/front
npm run dev
```

## Si hay errores comunes:

### Error: "Cannot find module 'X'"
```bash
npm install
```

### Error: "Port already in use"
```bash
# Matar procesos en el puerto
npx kill-port 8005
```

### Error: SSL/Database connection
Verificar que `.env` tenga:
```
DATABASE_URL="postgresql://postgres:Retofit2025@retofit.cd66iick6o60.us-east-2.rds.amazonaws.com:5432/RetoFit?sslmode=no-verify"
```

## Probar el servicio manualmente

### Crear un post (necesitas un token de autenticación)
```bash
curl -X POST http://127.0.0.1:8005/posts/posts \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer TU_TOKEN_AQUI" \
  -d '{"content": "Mi primer post de prueba"}'
```

### Listar posts
```bash
curl http://127.0.0.1:8005/posts/posts
```

## Variables de entorno del frontend

Verificar que `front/.env.local` tenga:
```
NEXT_PUBLIC_POSTS_API_URL=http://127.0.0.1:8005/posts
```
