# Landing Page Microfrontend - Reto-Fit

Este es el microfrontend de la página de aterrizaje (landing page) de Reto-Fit, construido con Next.js 15 y desplegado de manera independiente del frontend principal.

## 🏗️ Arquitectura

Este microfrontend está separado del frontend principal para:
- Mejorar la escalabilidad y el rendimiento
- Permitir despliegues independientes
- Facilitar el mantenimiento
- Optimizar la carga inicial para usuarios no autenticados

## 🚀 Desarrollo

### Requisitos
- Node.js 18 o superior
- npm

### Instalación

```bash
npm install
```

### Modo desarrollo

```bash
npm run dev
```

El servidor se iniciará en `http://localhost:3001`

### Build

```bash
npm run build
npm start
```

## 🐳 Docker

### Build de la imagen

```bash
docker build -t landing-page:latest .
```

### Ejecutar contenedor

```bash
docker run -p 3001:3001 landing-page:latest
```

## 🔧 Configuración

### Variables de entorno

Crea un archivo `.env.local` basado en `.env.example`:

```env
NEXT_PUBLIC_FRONTEND_URL=http://localhost:3000
```

En producción con nginx, esta URL debe apuntar al dominio principal de la aplicación.

## 📁 Estructura

```
landing-page/
├── src/
│   ├── app/              # App Router de Next.js
│   │   ├── page.tsx      # Página principal (landing)
│   │   ├── layout.tsx    # Layout raíz
│   │   └── globals.css   # Estilos globales
│   ├── components/       # Componentes React
│   │   ├── ui/          # Componentes UI (shadcn)
│   │   └── icons.tsx    # Iconos
│   └── lib/             # Utilidades
├── public/              # Archivos estáticos
│   └── images/         # Imágenes del equipo
├── Dockerfile          # Multi-stage build para producción
├── next.config.ts      # Configuración de Next.js
└── package.json        # Dependencias
```

## 🔗 Integración

Este microfrontend se integra con el frontend principal a través de:
- Enlaces directos a las rutas de autenticación (`/login`, `/signup`)
- Variables de entorno para configurar la URL del frontend principal
- Nginx como reverse proxy para enrutamiento

## 🌐 Rutas

- `/` - Landing page principal
- Links externos al frontend principal:
  - `/login` → Frontend principal
  - `/signup` → Frontend principal
  - `/dashboard` → Frontend principal (requiere autenticación)

## 📦 Dependencias principales

- **Next.js 15** - Framework React
- **React 18** - Biblioteca UI
- **Tailwind CSS** - Estilos
- **shadcn/ui** - Componentes UI
- **Lucide React** - Iconos

## 🚢 Despliegue

El microfrontend se despliega junto con el resto de la aplicación usando Docker Compose. Nginx actúa como reverse proxy dirigiendo el tráfico:
- `/` → Landing page (puerto 3001)
- `/login`, `/signup`, `/dashboard`, etc. → Frontend principal (puerto 3000)
