import api from '../config/api';
import type { 
  User, 
  Actividad, 
  Puntos, 
  Logro, 
  LoginResponse, 
  UserRegistrationRequest, 
  LoginRequest,
  LogroProgress,
  UserRanking
} from '../types';

export class AuthService {
  static async register(userData: UserRegistrationRequest): Promise<LoginResponse> {
    const response = await api.post('/simple-register', userData);
    return response.data;
  }

  static async login(credentials: LoginRequest): Promise<LoginResponse> {
    const response = await api.post('/login', credentials);
    return response.data;
  }

  static async getCurrentUser(): Promise<User> {
    const response = await api.get('/users/me');
    return response.data;
  }
}

export class ActividadService {
  static async createActividad(userId: number, actividad: Omit<Actividad, 'id_actividad' | 'id_usuario' | 'fecha'>): Promise<Actividad> {
    const response = await api.post(`/users/${userId}/activities`, actividad);
    return response.data;
  }

  static async getActividades(userId: number): Promise<Actividad[]> {
    const response = await api.get(`/users/${userId}/activities`);
    return response.data;
  }
}

export class PuntosService {
  static async getPuntos(userId: number): Promise<Puntos[]> {
    const response = await api.get(`/users/${userId}/points`);
    return response.data;
  }

  static async createPuntos(userId: number, puntosData: { cantidad: number }): Promise<Puntos> {
    const response = await api.post(`/users/${userId}/points`, puntosData);
    return response.data;
  }
}

export class LogrosService {
  static async getLogros(userId: number): Promise<Logro[]> {
    const response = await api.get(`/users/${userId}/achievements`);
    return response.data;
  }

  static async getAchievementsProgress(userId: number): Promise<LogroProgress[]> {
    const response = await api.get(`/users/${userId}/achievements-progress`);
    return response.data;
  }
}

export class RankingService {
  static async getUsersRanking(limit: number = 10): Promise<UserRanking[]> {
    const response = await api.get(`/users/ranking?limit=${limit}`);
    return response.data;
  }
}

export const fitnessService = {
  auth: AuthService,
  actividades: ActividadService,
  puntos: PuntosService,
  logros: LogrosService,
  ranking: RankingService,
};
