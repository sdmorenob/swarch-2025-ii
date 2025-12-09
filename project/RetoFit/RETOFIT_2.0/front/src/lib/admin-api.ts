const ADMIN_API = process.env.NEXT_PUBLIC_ADMIN_API_URL;

// Función genérica para hacer fetch con el token de ADMIN
async function fetchWithAdminToken(url: string, options: RequestInit = {}) {
  const token = localStorage.getItem('admin_token');
  if (!token) {
    if (typeof window !== 'undefined') {
      window.location.href = '/admin/login';
    }
    throw new Error('No se encontró token de administrador. Por favor, inicie sesión.');
  }

  const headers: HeadersInit = {
    'Accept': 'application/json',
    'Authorization': `Bearer ${token}`,
    ...options.headers,
  };

  const response = await fetch(url, { ...options, headers })

  console.log("Response: ", response)

  if (response.status === 401) {
    localStorage.removeItem('admin_token');
    if (typeof window !== 'undefined') {
      window.location.href = '/admin/login'; // Redirigir al login de admin
    }
    throw new Error('Sesión de administrador expirada.');
  }

  if (!response.ok) {
    // Intenta leer el cuerpo del error para dar un mensaje más específico
    try {
      console.log("Error en AdminToken")
      const errorData = await response.json();
      throw new Error(errorData.error || errorData.message || 'Error en la solicitud al servicio de admin.');
    } catch (e) {
      throw new Error(`Error en el servicio de admin: ${response.statusText} (Status: ${response.status})`);
    }
  }

  return response.json();
}

/**
 * Obtiene las estadísticas y la lista de usuarios desde el microservicio de admin.
 */
export async function getAdminUsersData() {
  return fetchWithAdminToken(`${ADMIN_API}/users`);
}

/**
 * Crea un nuevo usuario desde el panel de admin.
 */
export async function createAdminUser(userData: { name: string, email: string, password?: string }) {
  return fetchWithAdminToken(`${ADMIN_API}/users`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(userData),
  });
}

/**
 * Actualiza el estado de un usuario (active/suspended).
 */
export async function updateUserStatus(userId: number, status: 'active' | 'suspended') {
  return fetchWithAdminToken(`${ADMIN_API}/users/${userId}/status`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status }),
  });
}

/**
 * Elimina un usuario desde el panel de admin.
 */
export async function deleteAdminUser(userId: number) {
  return fetchWithAdminToken(`${ADMIN_API}/users/${userId}`, {
    method: 'DELETE',
  });
}

/**
 * Crea un nuevo reto desde el panel de admin.
 */
export async function createAdminChallenge(challengeData: {
  name: string;
  description?: string;
  type: string;
  target: number;
  unit?: string;
  start_date?: string;
  end_date?: string;
}) {
  return fetchWithAdminToken(`${ADMIN_API}/challenges`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(challengeData),
  });
}

/**
 * Obtiene la lista de todos los retos desde el panel de admin.
 */
export async function getAdminChallenges() {
  return fetchWithAdminToken(`${ADMIN_API}/challenges`);
}

/**
 * Actualiza un reto existente desde el panel de admin.
 */
export async function updateAdminChallenge(challengeId: number, challengeData: any) {
  return fetchWithAdminToken(`${ADMIN_API}/challenges/${challengeId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(challengeData),
  });
}

/**
 * Elimina un reto desde el panel de admin.
 */
export async function deleteAdminChallenge(challengeId: number) {
  return fetchWithAdminToken(`${ADMIN_API}/challenges/${challengeId}`, {
    method: 'DELETE',
  });
}

/**
 * Obtiene las estadísticas principales para el dashboard de admin.
 */
export async function getAdminDashboardStats() {
  return fetchWithAdminToken(`${ADMIN_API}/dashboard-stats`);
}

/**
 * Obtiene las estadísticas de registro de usuarios para el gráfico de analíticas.
 */
export async function getAdminUserRegistrationAnalytics() {
  return fetchWithAdminToken(`${ADMIN_API}/analytics/user-registrations`);
}