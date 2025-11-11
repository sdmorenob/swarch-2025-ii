import { getToken, removeToken } from "./auth";

const API_BASE = "http://localhost:8002";

// --- 🔒 Función para validar si el token sigue vigente ---
function isTokenValid(token: string | null): boolean {
  if (!token) return false;

  try {
    const [, payload] = token.split(".");
    const decoded = JSON.parse(atob(payload));
    return decoded.exp * 1000 > Date.now();
  } catch (error) {
    console.error("Error decoding token:", error);
    return false;
  }
}

// --- 🧠 Middleware de requests ---
// export async function apiFetch(
//   url: string,
//   options: RequestInit = {}
// ): Promise<Response> {
//   const token = getToken();
export async function apiFetch(
  pathOrUrl: string,
  options: RequestInit = {}
): Promise<Response> {
  const token = getToken();





  // 1️⃣ Verificar si el token es válido antes de enviar
  if (!isTokenValid(token)) {
    console.warn("Token expirado o inválido. Cerrando sesión...");
    removeToken();
    window.location.href = "/login";
    throw new Error("Token inválido o expirado");
  }

  // 2️⃣ Construir URL (soporta path relativo o URL completa)
  const url = pathOrUrl.startsWith("http")
    ? pathOrUrl
    : `${API_BASE}${pathOrUrl}`;


  // 2️⃣ Preparar headers
  const headers = new Headers(options.headers || {});
//   headers.set("Content-Type", "application/json");
//   if (token) headers.set("Authorization", `Bearer ${token}`);
  if (!headers.has("Accept")) headers.set("Accept", "application/json");
  if (!headers.has("Content-Type") && !(options.body instanceof FormData))
    headers.set("Content-Type", "application/json");
  if (token) headers.set("Authorization", `Bearer ${token}`);
  // 3️⃣ Ejecutar la petición
  const res = await fetch(url, {
    ...options,
    headers,
  });

  // 4️⃣ Manejar errores comunes
  if (res.status === 401) {
    console.warn("Token rechazado por el backend");
    removeToken();
    window.location.href = "/login";
  }

//   if (!res.ok) {
//     const text = await res.text();
//     throw new Error(`Error ${res.status}: ${text}`);
//   }

  return res;
}
