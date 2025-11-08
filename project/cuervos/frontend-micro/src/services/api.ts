/**
 * ApiService
 * ------------------------------------------------------------
 * Capa de acceso HTTP a la API (API Gateway) y al search-service.
 * - Inyecta el token Bearer en cada request (interceptor)
 * - Maneja refresh de token 401 (si aplica)
 * - Expone métodos tipados para auth, users, tasks, notes, categories, tags
 * - Expone búsqueda de notas contra el microservicio de Go
 */
import axios from 'axios';
import type { AxiosInstance, AxiosResponse } from 'axios';
import { 
  type User,
  type UserCreate,
  type UserLogin, 
  type Task, 
  type TaskCreate, 
  type TaskUpdate,
  type Note,
  type NoteCreate,
  type NoteUpdate,
  type NoteHistory,
  type Category,
  type CategoryCreate,
  type CategoryUpdate,
  type Tag,
  type TagCreate,
  type TagUpdate,
  type AuthResponse,
  type SearchRequest,
  type SearchResponse,
  type PaginatedResponse,
  type UserProfile, ProfileCreate, ProfileUpdate
} from '../types';

class ApiService {
  private api: AxiosInstance;
  private baseURL: string;

  constructor() {
    // Usar /api como fallback para que funcione detrás de Nginx dentro del contenedor
    this.baseURL = process.env.REACT_APP_API_URL || '/api';
    this.api = axios.create({
      baseURL: this.baseURL,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.api.interceptors.request.use(
      (config) => {
        const token = localStorage.getItem('access_token');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    this.api.interceptors.response.use(
      (response) => response,
      async (error) => {
        const originalRequest = error.config;
        
        if (error.response?.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true;
          
          try {
            const currentToken = localStorage.getItem('access_token');
            if (currentToken) {
              const response = await this.refreshToken(currentToken);
              localStorage.setItem('access_token', response.access_token);
              // Mantener refresh_token si existiera (compatibilidad)
              if (response.refresh_token) {
                localStorage.setItem('refresh_token', response.refresh_token);
              }
              
              originalRequest.headers.Authorization = `Bearer ${response.access_token}`;
              return this.api(originalRequest);
            }
          } catch (refreshError) {
            this.logout();
            window.location.href = '/login';
          }
        }
        
        return Promise.reject(error);
      }
    );
  }

  async login(data: UserLogin): Promise<AuthResponse> {
    const response: AxiosResponse<AuthResponse> = await this.api.post('/auth/login', data);
    
    // Store token in localStorage for authentication
    if (response.data.access_token) {
      localStorage.setItem('access_token', response.data.access_token);
    }
    if (response.data.refresh_token) {
      localStorage.setItem('refresh_token', response.data.refresh_token);
    }
    
    return response.data;
  }

  async register(data: UserCreate): Promise<AuthResponse> {
    const response: AxiosResponse<AuthResponse> = await this.api.post('/auth/register', data);
    
    // Store token in localStorage for authentication
    if (response.data.access_token) {
      localStorage.setItem('access_token', response.data.access_token);
    }
    if (response.data.refresh_token) {
      localStorage.setItem('refresh_token', response.data.refresh_token);
    }
    
    return response.data;
  }

  async getProfile(): Promise<User> {
    const response: AxiosResponse<User> = await this.api.get('/auth/me');
    return response.data;
  }

  // Compatibilidad con AuthContext
  async getCurrentUser(): Promise<User> {
    const response: AxiosResponse<User> = await this.api.get('/auth/me');
    return response.data;
  }

  async updateCurrentUser(userData: Partial<User>): Promise<User> {
    const response: AxiosResponse<User> = await this.api.put('/users/me', userData);
    return response.data;
  }

  // Refrescar usando Authorization: Bearer <token actual>
  async refreshToken(currentAccessToken: string): Promise<{ access_token: string; refresh_token?: string }> {
    const response: AxiosResponse<{ access_token: string; refresh_token?: string }> = await this.api.post(
      '/auth/refresh',
      {},
      { headers: { Authorization: `Bearer ${currentAccessToken}` } }
    );
    return response.data;
  }

  logout(): void {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
  }

  // Perfil de usuario (user-profile service)
  async getMyProfile(): Promise<UserProfile> {
    const response: AxiosResponse<UserProfile> = await this.api.get('/user-profile/me');
    return response.data;
  }

  async listProfiles(): Promise<UserProfile[]> {
    const response: AxiosResponse<UserProfile[]> = await this.api.get('/user-profile/');
    return response.data;
  }

  async createProfile(payload: ProfileCreate): Promise<UserProfile> {
    const response: AxiosResponse<UserProfile> = await this.api.post('/user-profile/', payload);
    return response.data;
  }

  async updateProfile(id: number, payload: ProfileUpdate): Promise<UserProfile> {
    const response: AxiosResponse<UserProfile> = await this.api.put(`/user-profile/${id}`, payload);
    return response.data;
  }

  // Task methods
  async getTasks(page: number = 1, size: number = 20): Promise<PaginatedResponse<Task>> {
    const response: AxiosResponse<PaginatedResponse<Task>> = await this.api.get(`/tasks/?page=${page}&size=${size}`);
    return response.data;
  }

  async createTask(taskData: TaskCreate): Promise<Task> {
    const response: AxiosResponse<Task> = await this.api.post('/tasks/', taskData);
    return response.data;
  }

  async getTask(id: string): Promise<Task> {
    const response: AxiosResponse<Task> = await this.api.get(`/tasks/${id}`);
    return response.data;
  }

  async updateTask(id: string, taskData: TaskUpdate): Promise<Task> {
    const response: AxiosResponse<Task> = await this.api.put(`/tasks/${id}`, taskData);
    return response.data;
  }

  async deleteTask(id: string): Promise<void> {
    await this.api.delete(`/tasks/${id}`);
  }

  async getTaskHistory(id: string): Promise<NoteHistory[]> {
    const response: AxiosResponse<NoteHistory[]> = await this.api.get(`/tasks/${id}/history`);
    return response.data;
  }

  // Note methods
  async getNotes(page: number = 1, size: number = 20): Promise<PaginatedResponse<Note>> {
    const response: AxiosResponse<PaginatedResponse<Note>> = await this.api.get(`/notes/?page=${page}&size=${size}`);
    return response.data;
  }

  async createNote(noteData: NoteCreate): Promise<Note> {
    const response: AxiosResponse<Note> = await this.api.post('/notes/', noteData);
    return response.data;
  }

  async getNote(id: string): Promise<Note> {
    const response: AxiosResponse<Note> = await this.api.get(`/notes/${id}`);
    return response.data;
  }

  async updateNote(id: string, noteData: NoteUpdate): Promise<Note> {
    const response: AxiosResponse<Note> = await this.api.put(`/notes/${id}`, noteData);
    return response.data;
  }

  async deleteNote(id: string): Promise<void> {
    await this.api.delete(`/notes/${id}`);
  }

  // Category methods
  async getCategories(): Promise<Category[]> {
    const response: AxiosResponse<Category[]> = await this.api.get('/categories');
    return response.data;
  }

  async createCategory(categoryData: CategoryCreate): Promise<Category> {
    const response: AxiosResponse<Category> = await this.api.post('/categories', categoryData);
    return response.data;
  }

  async updateCategory(id: number, categoryData: CategoryUpdate): Promise<Category> {
    const response: AxiosResponse<Category> = await this.api.put(`/categories/${id}`, categoryData);
    return response.data;
  }

  async deleteCategory(id: number): Promise<void> {
    await this.api.delete(`/categories/${id}`);
  }

  // Tag methods
  async getTags(): Promise<Tag[]> {
    const response: AxiosResponse<Tag[]> = await this.api.get('/tags');
    return response.data;
  }

  async createTag(tagData: TagCreate): Promise<Tag> {
    const response: AxiosResponse<Tag> = await this.api.post('/tags', tagData);
    return response.data;
  }
  
  async updateTag(id: number, tagData: TagUpdate): Promise<Tag> {
    const response: AxiosResponse<Tag> = await this.api.put(`/tags/${id}`, tagData);
    return response.data;
  }

  async deleteTag(id: number): Promise<void> {
    await this.api.delete(`/tags/${id}`);
  }

  // Search methods
  async searchNotes(request: SearchRequest): Promise<SearchResponse> {
    const response: AxiosResponse<SearchResponse> = await this.api.post('/search', request);
    return response.data;
  }

  async healthCheck(): Promise<{ status: string; service: string }> {
    const response: AxiosResponse<{ status: string; service: string }> = await this.api.get('/health');
    return response.data;
  }
}

export const apiService = new ApiService();
export default apiService;


