const AUTH_API = process.env.NEXT_PUBLIC_AUTH_API_URL;
const USER_API = process.env.NEXT_PUBLIC_USER_API_URL;
const GAMIFICATION_API = process.env.NEXT_PUBLIC_GAMIFICATION_API_URL;
const POSTS_API = process.env.NEXT_PUBLIC_POSTS_API_URL;
const ACTIVITIES_API = process.env.NEXT_PUBLIC_ACTIVITIES_API_URL;
const API_URL = process.env.NEXT_PUBLIC_ADMIN_API_URL || 'http://127.0.0.1:8080/api/admin';

import type { Challenge, ProgressLog } from '@/lib/data';
// --- Funciones para el Servicio de Autenticación ---

export async function loginUser(email: string, password: string) {
  const response = await fetch(`${AUTH_API}/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.detail || 'Error al iniciar sesión');
  }
  return response.json(); // Devuelve { access_token, token_type }
}

export async function registerUser(userData: { name: string, last_name?: string, email: string, password?: string, provider?: string }) {
  const response = await fetch(`${AUTH_API}/register`, {
      method: 'POST',
      headers: {
          'Content-Type': 'application/json',
      },
      body: JSON.stringify(userData),
  });

  if (!response.ok) {
      const errorData = await response.json();
      // El backend puede devolver errores en un array o como un objeto
      if (Array.isArray(errorData.detail)) {
          throw new Error(errorData.detail.map((e: any) => e.msg).join(', '));
      }
      throw new Error(errorData.detail || 'Error al registrar el usuario');
  }
  return response.json(); // Devuelve { status, message, user_id }
}

export async function socialLogin(userData: { name: string, email: string, provider: string, provider_id: string}) {
  const response = await fetch(`${AUTH_API}/social-login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(userData),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.detail || 'Error en el inicio de sesión social');
  }

  return response.json(); // Devuelve { access_token, token_type }
}


// --- Funciones para el Servicio de Usuarios ---

// Función genérica para hacer fetch con token
async function fetchWithToken(url: string, options: RequestInit = {}) {
  const token = localStorage.getItem('accessToken');
  console.log("Token en fetchWithToken:", token);
  if (!token) {
    throw new Error('No se encontró token de acceso. Por favor, inicie sesión.');
  }

  const headers: HeadersInit = {
    'Authorization': `Bearer ${token}`,
    ...options.headers,
  };

  const response = await fetch(url, { ...options, headers });
  console.log("Response status en fetchWithToken:", response);

  if (response.status === 401) {
    // Token inválido o expirado
    localStorage.removeItem('accessToken');
    window.location.href = '/login'; // Redirigir al login
    throw new Error('Sesión expirada.');
  }

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.detail || 'Ocurrió un error en la solicitud.');
  }

  return response.json();
}


export async function getCurrentUser(): Promise<{ is_profile_complete: boolean; [key: string]: any }> {
  return fetchWithToken(`${USER_API}/me`);
}

export async function updateUserProfile(profileData: {
  name?: string;
  last_name?: string;
  age?: number;
  weight?: number;
  height?: number;
  gender?: string;
  fitness_level?: string;
  favorite_sports?: string;
}) {
    return fetchWithToken(`${USER_API}/me`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profileData),
    });
}

export async function uploadProfilePicture(formData: FormData) {
    // Para FormData no se establece Content-Type, el navegador lo hace solo
    const token = localStorage.getItem('accessToken');
    const response = await fetch(`${USER_API}/upload-profile-picture`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData,
    });
     if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Error al subir la imagen.');
    }
    return response.json();
}

// --- Funciones para el Servicio de Gamificación ---

export async function getAchievementsProgress(userId: number) {
  return fetchWithToken(`${GAMIFICATION_API}/users/${userId}/achievements-progress`);
}

export async function getUserPoints(userId: number): Promise<{ puntos_totales: number }> {
  return fetchWithToken(`${GAMIFICATION_API}/users/${userId}/points`);
}

// --- Functions for the Posts Service ---

export async function getPosts(page = 1, limit = 10) {
  return fetchWithToken(`${POSTS_API}/posts?page=${page}&limit=${limit}`);
}

export async function getPost(postId: number) {
  return fetchWithToken(`${POSTS_API}/posts/${postId}`);
}

export async function createPost(content: string) {
  return fetchWithToken(`${POSTS_API}/posts`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ content }),
  });
}

export async function uploadPostImage(postId: number, formData: FormData) {
  const token = localStorage.getItem('accessToken');
  const response = await fetch(`${POSTS_API}/posts/${postId}/upload`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${token}` },
    body: formData,
  });
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || 'Error al subir la imagen.');
  }
  return response.json();
}

export async function updatePost(postId: number, content: string) {
  return fetchWithToken(`${POSTS_API}/posts/${postId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ content }),
  });
}

export async function deletePost(postId: number) {
  return fetchWithToken(`${POSTS_API}/posts/${postId}`, {
    method: 'DELETE',
  });
}

export async function getComments(postId: number) {
  return fetchWithToken(`${POSTS_API}/posts/${postId}/comments`);
}

export async function createComment(postId: number, content: string) {
  return fetchWithToken(`${POSTS_API}/posts/${postId}/comments`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ content }),
  });
}

export async function deleteComment(commentId: number) {
  return fetchWithToken(`${POSTS_API}/comments/${commentId}`, {
    method: 'DELETE',
  });
}

export async function toggleLike(postId: number) {
  return fetchWithToken(`${POSTS_API}/posts/${postId}/like`, {
    method: 'POST',
  });
}

export async function getLikes(postId: number) {
  return fetchWithToken(`${POSTS_API}/posts/${postId}/likes`);
}


export async function getMyActivities(userId: number) {
  // Nota: El token ya está incluido en fetchWithToken
  return fetchWithToken(`${ACTIVITIES_API}/users/${userId}/activities`);
}

export async function createActivity(userId: number, activityData: {
  tipo: string;
  distancia_km: number;
  duracion_min: number;
  fecha: string; // Formato ISO 8601: "2025-10-21T10:00:00Z"
}) {
  return fetchWithToken(`${ACTIVITIES_API}/users/${userId}/activities`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(activityData),
  });
}

// --- Funciones para el Servicio de Administración ---

export async function getChallenges() {
  // Hacemos una llamada fetch normal porque este endpoint es público
  //try {
  //  const data = await getAdminChallenges();
  //  setChallenges(data);
  //} catch (err: any) {
  //  toast({ title: "Error", description: err.message, variant: "destructive" });
  //} finally {
  //  setListIsLoading(false);
  //}
  const response = await fetch("http://api-gateway:8080/api/admin/challenges");

  console.log("Response challenges: ", response);

  if (!response.ok) {
    // Si hay un error en la respuesta de la API, lo lanzamos
    throw new Error('Failed to fetch challenges');
  }

  return response.json();
}

export async function getChallengeById(id: string): Promise<Challenge | null> {
  try {
    const res = await fetch(`http://api-gateway:8080/api/admin/challenges/${id}`);

    if (!res.ok) {
      if (res.status === 404) {
        return null; // Reto no encontrado
      }
      throw new Error('Error al obtener los datos del reto');
    }

    // La API de PHP ya debería devolver los datos en el formato correcto (ver paso 1)
    const data = await res.json();
    return data as Challenge;

  } catch (error) {
    console.error('getChallengeById Error:', error);
    return null;
  }
}

export async function getUserProgress(
  challengeId: string,
  userId: string
): Promise<ProgressLog> {
  try {
    const res = await fetch(`${API_URL}/challenges/${challengeId}/progress/${userId}`);
    
    if (!res.ok) {
      throw new Error('Error al obtener el progreso del usuario');
    }
    
    const data = await res.json();
    
    // La API devuelve un objeto con { challenge_id, user_id, progress }
    // Lo adaptamos al tipo ProgressLog que espera el frontend
    return {
      challengeId: data.challenge_id,
      userId: data.user_id,
      progress: data.progress,
      date: data.updated_at ? new Date(data.updated_at) : new Date(),
    };

  } catch (error) {
    console.error('getUserProgress Error:', error);
    // Si falla (ej. 404 o 500), devolvemos un estado por defecto
    // La ruta GET ya devuelve un 0 por defecto si no lo encuentra, 
    // pero esto es una doble seguridad.
    return {
      challengeId: challengeId,
      userId: userId,
      progress: 0,
      date: new Date(),
    };
  }
}

/**
 * Guarda (actualiza/crea) el progreso de un usuario.
 */
export async function logUserProgress(
  challengeId: string,
  userId: string,
  newProgress: number
): Promise<{ ok: boolean; data?: ProgressLog }> {
  try {
    const res = await fetch(`${API_URL}/challenges/${challengeId}/progress/${userId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ progress: newProgress }),
    });

    if (!res.ok) {
      throw new Error('Error al guardar el progreso');
    }
    
    const data = await res.json();
    return { ok: true, data };
  } catch (error) {
    console.error('logUserProgress Error:', error);
    return { ok: false };
  }
}