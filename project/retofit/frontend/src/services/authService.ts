import api from '../config/api';
import type {
  LoginRequest,
  LoginResponse,
  UserRegistrationRequest,
  EmailVerificationRequest,
  EmailCheckRequest,
  ForgotPasswordRequest,
  ResetPasswordRequest,
  User,
  ApiResponse
} from '../types';

export class AuthService {
  // Verificar si el email existe
  static async checkEmail(data: EmailCheckRequest): Promise<ApiResponse<any>> {
    const response = await api.post('/check-email', data);
    return response.data;
  }

  // Registrar usuario
  static async register(data: UserRegistrationRequest): Promise<ApiResponse<any>> {
    const response = await api.post('/register', data);
    return response.data;
  }

  // Registrar usuario simple sin verificación (para testing)
  static async simpleRegister(data: { name: string; email: string; password: string }): Promise<ApiResponse<any>> {
    const response = await api.post('/simple-register', data);
    return response.data;
  }

  // Verificar email con código
  static async verifyEmail(data: EmailVerificationRequest): Promise<ApiResponse<any>> {
    const response = await api.post('/verify-email', data);
    return response.data;
  }

  // Login
  static async login(data: LoginRequest): Promise<LoginResponse> {
    const response = await api.post('/login', data);
    
    // Guardar token y usuario en localStorage
    if (response.data.access_token) {
      localStorage.setItem('access_token', response.data.access_token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
    }
    
    return response.data;
  }

  // Logout
  static async logout(): Promise<void> {
    localStorage.removeItem('access_token');
    localStorage.removeItem('user');
  }

  // Obtener usuario actual
  static async getCurrentUser(): Promise<User> {
    const response = await api.get('/users/me');
    return response.data;
  }

  // Solicitar reset de password
  static async forgotPassword(data: ForgotPasswordRequest): Promise<ApiResponse<any>> {
    const response = await api.post('/forgot-password', data);
    return response.data;
  }

  // Reset password con código
  static async resetPassword(data: ResetPasswordRequest): Promise<ApiResponse<any>> {
    const response = await api.post('/reset-password', data);
    return response.data;
  }

  // Verificar si hay un token válido
  static isAuthenticated(): boolean {
    const token = localStorage.getItem('access_token');
    return !!token;
  }

  // Obtener usuario desde localStorage
  static getStoredUser(): User | null {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      try {
        return JSON.parse(userStr);
      } catch {
        return null;
      }
    }
    return null;
  }
}