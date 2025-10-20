// Tipos basados en los modelos del backend FastAPI

export interface User {
  id: number;
  username: string;
  email: string;
  password_hash: string;
  is_verified: boolean;
  puntos_totales: number;
  total_actividades?: number;
  created_at: string;
  updated_at: string;
}

export interface UserRegistrationRequest {
  username: string;
  email: string;
  password: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  access_token: string;
  token_type: string;
  user: User;
}

export interface EmailVerificationRequest {
  email: string;
  codigo: string;
}

export interface EmailCheckRequest {
  email: string;
}

export interface ForgotPasswordRequest {
  email: string;
}

export interface ResetPasswordRequest {
  email: string;
  codigo: string;
  nueva_contraseña: string;
}

export interface Puntos {
  id_puntos: number;
  cantidad: number;
  fecha_obtencion: string;
  id_usuario: number;
  propietario?: User;
}

export interface PuntosCreate {
  cantidad: number;
}

export interface Logro {
  id: number;
  user_id: number;
  nombre: string;
  descripcion: string;
  puntos_requeridos: number;
  obtenido: boolean;
  fecha_obtenido?: string;
  user?: User;
}

export interface LogroCreate {
  user_id: number;
  nombre: string;
  descripcion: string;
  puntos_requeridos: number;
}

export interface Actividad {
  id_actividad: number;
  tipo: string;
  distancia_km?: number;
  duracion_min?: number;
  fecha: string;
  id_usuario: number;
  propietario?: User;
}

export interface ActividadCreate {
  tipo: string;
  distancia_km?: number;
  duracion_min?: number;
}

// Tipos para el estado de autenticación
export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

// Tipos para respuestas de API
export interface ApiResponse<T> {
  message: string;
  data?: T;
  error?: string;
}

export interface ErrorResponse {
  detail: string;
}

// Tipo para el progreso de logros con información completa
export interface LogroProgress {
  id: number;
  nombre: string;
  descripcion: string;
  meta: number;
  progreso_actual: number;
  porcentaje_completado: number;
  obtenido: boolean;
  fecha_obtenido?: string;
  tipo_regla: string;
}

// Tipo para el ranking de usuarios
export interface UserRanking {
  id: number;
  username: string;
  puntos_totales: number;
  total_actividades: number;
  avatar: string;
  position: number;
}