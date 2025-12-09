# Guía rápida: getServerSideProps (SSR) para el microfront de Upload Music

Esta guía explica cómo usar `getServerSideProps` en el Pages Router de Next.js para renderizar el formulario de carga de música (Upload Music) con SSR y pasarle props al componente cliente.

## ¿Qué es getServerSideProps?
- Ejecuta en el servidor en cada request.
- Puedes hacer fetch de datos y pasarlos a la página vía `props`.
- No corre en el navegador, así que ten en cuenta que no hay acceso a `window`, `localStorage`, etc.

## Ejemplo mínimo (Next.js)
```ts
import type { InferGetServerSidePropsType, GetServerSideProps } from 'next'

type Repo = {
  name: string
  stargazers_count: number
}

export const getServerSideProps = (async () => {
  const res = await fetch('https://api.github.com/repos/vercel/next.js')
  const repo: Repo = await res.json()
  return { props: { repo } }
}) satisfies GetServerSideProps<{ repo: Repo }>

export default function Page({
  repo,
}: InferGetServerSidePropsType<typeof getServerSideProps>) {
  return (
    <main>
      <p>{repo.stargazers_count}</p>
    </main>
  )
}
```

## Aplicado a MusicShare
Nuestra página SSR ya vive en `pages/index.tsx` y usa `getServerSideProps` para preparar datos que después se pasan al componente cliente `UploadMusicClient`.

Archivo: `frontendSSR/music-upload/pages/index.tsx`
```tsx
import type { InferGetServerSidePropsType, GetServerSideProps } from "next";
import UploadMusicClient from "../components/UploadMusicClient";

type ServerData = {
  theme: "cupcake" | "dark";
  timestamp: string;
};

export const getServerSideProps = (async (context) => {
  // Aquí puedes hacer fetch a APIs públicas o leer cookies/session del request
  // Ejemplo simple: pasar un tema y un timestamp
  const data: ServerData = {
    theme: "cupcake",
    timestamp: new Date().toISOString(),
  };

  return { props: { data } };
}) satisfies GetServerSideProps<{ data: ServerData }>;

export default function UploadPage({
  data,
}: InferGetServerSidePropsType<typeof getServerSideProps>) {
  return (
    <main className="p-8">
      <UploadMusicClient theme={data.theme} />
    </main>
  );
}
```

Puntos clave:
- El tipo de props que devuelve `getServerSideProps` queda reflejado en el tipo del componente a través de `InferGetServerSidePropsType`.
- `UploadMusicClient` es un componente cliente (tiene `"use client"` en su archivo). La página SSR lo renderiza y le pasa props serializables.

## Pasar datos del servidor al formulario
Puedes enriquecer `ServerData` con más campos, por ejemplo:
- Preferencias de usuario leídas desde cookies.
- Flags de features.
- URLs públicas para servicios (si necesitas mostrarlas o usarlas del lado cliente).

Ejemplo ampliado:
```ts
// ...
type ServerData = {
  theme: "cupcake" | "dark";
  csrfToken?: string;
  publicApiBase: string;
};

export const getServerSideProps = (async ({ req }) => {
  const csrfToken = req.cookies?.csrf ?? undefined;
  const publicApiBase = process.env.NEXT_PUBLIC_API_BASE ?? "https://localhost";
  return { props: { data: { theme: "cupcake", csrfToken, publicApiBase } } };
}) satisfies GetServerSideProps<{ data: ServerData }>;
```
Luego, pásalo al cliente si lo necesita.

## Buenas prácticas
- Solo retorna datos serializables (objetos/strings/números/arrays). Evita `Date` o clases; serializa a string si hace falta.
- Maneja errores de fetch y decide si:
  - devuelves una página con fallback,
  - haces `notFound: true`, o
  - rediriges con `redirect`.
- No hagas llamadas bloqueantes innecesarias en SSR: todo lo que no sea imprescindible para la primera pintura, déjalo al cliente.

## Notas de despliegue en este repo
- Este microfront se sirve detrás de Traefik bajo la ruta `/upload`.
- La página SSR es `pages/index.tsx`; Traefik reenvía `/upload` hacia este servicio.
- Los assets estáticos de Next.js se sirven desde `/_next/...` y ya están enrutados a este servicio.

Con esto, el formulario de Upload Music queda renderizado por SSR y recibe props iniciales del servidor, manteniendo la lógica del componente cliente intacta.
