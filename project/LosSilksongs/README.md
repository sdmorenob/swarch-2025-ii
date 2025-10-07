# MusicShare - Red Social Musical

MusicShare es una aplicación web que funciona como red social especializada donde los usuarios pueden compartir su música favorita, crear playlists y descubrir nueva música a través de una experiencia social interactiva.

---

## 🎯 Objetivo del prototipo

Construir un prototipo **vertical** de la arquitectura distribuida de MusicShare, con:
- Microservicios backend (Go, Python)
- Bases de datos: relacional (**Postgres**) y documental (**MongoDB**)
- Conectores HTTP entre servicios
- Despliegue completo con Docker Compose
- Frontend (planificado para siguiente iteración)

---

## 🏗️ Arquitectura del Sistema

### Componentes Implementados

```
┌─────────────────────────────────────────────────────────┐
│                    MUSIC SHARE                          │
│                                                         │
│   ┌───────────────┐        ┌───────────────┐            │
│   │ Music Service │◄──────►│  MongoDB      │            │
│   │     (Go)      │        │  Database     │            │
│   └───────────────┘        └───────────────┘            │
│                                                         │
│   ┌───────────────┐        ┌────────────────┐           │
│   │ User Service  │◄──────►│  Postgres      │           │
│   │ (FastAPI/Py)  │        │  Relational DB │           │
│   └───────────────┘        └────────────────┘           │
│                                                         │
│                 (conectados vía Docker network)         │
└─────────────────────────────────────────────────────────┘
```

- **MusicService (Go)**: subida y streaming de música, gestión de playlists, metadatos.
- **UserService (Python + FastAPI)**: registro/login JWT, gestión de usuarios, proxy hacia MusicService.
- **Postgres**: almacenamiento relacional de usuarios.
- **MongoDB**: almacenamiento documental de tracks y playlists.
- **Otros servicios (stub)**: Metadata, Notifications, Search.

---

## ✅ Estado Actual del Proyecto

### Music Service (Go)
- Upload de archivos de audio (MP3, FLAC, WAV, etc.)
- Extracción de metadatos ID3
- CRUD completo de playlists
- Streaming de audio
- API REST documentada

### User Service (FastAPI + Postgres)
- Registro de usuarios con hash de contraseña
- Login con JWT (OAuth2)
- Endpoint `/users/me` protegido
- Proxy hacia MusicService (`/proxy/users/{id}/playlists`)

### Bases de Datos
- **MongoDB**: tracks, metadatos y playlists
- **Postgres**: usuarios y credenciales

### Infraestructura
- `docker-compose.yml` con Postgres, MongoDB, MusicService y UserService
- Networking entre contenedores
- Volúmenes persistentes
- Health checks básicos

---

## ⚙️ Despliegue

### Requisitos
- [Docker](https://docs.docker.com/get-docker/)
- [Docker Compose](https://docs.docker.com/compose/)

### Pasos
```bash
# Clonar repositorio
git clone <repository-url>
cd MusicShare

# Levantar servicios
docker compose build
docker compose up -d

# Verificar estado
docker compose ps
```

Servicios levantados:
- `userservice` → [http://localhost:8001](http://localhost:8001)
- `musicservice` → [http://localhost:8080](http://localhost:8080)
- `postgres` → puerto 5432
- `mongodb` → puerto 27017

---

## 📖 Endpoints principales

### UserService
- **Health**: `GET /health`
- **Registro**: `POST /auth/register`
- **Login**: `POST /auth/token` (devuelve JWT)
- **Perfil**: `GET /users/me` (requiere `Authorization: Bearer <token>`)
- **Proxy playlists**: `GET /proxy/users/{id}/playlists`

### MusicService
- `POST /api/v1/tracks/upload` - Subir audio
- `GET /api/v1/tracks` - Listar tracks
- `GET /api/v1/tracks/{id}/stream` - Stream de audio
- CRUD completo de playlists
- Healthcheck en `/health`

---

## 📌 Notas
- El **frontend React** está planificado pero aún no implementado.
- Este prototipo cumple los requisitos de la materia: arquitectura distribuida, uso de 2 bases de datos, múltiples lenguajes (Go, Python), conectores HTTP, y despliegue en contenedores.
