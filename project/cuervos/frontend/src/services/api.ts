/**
 * ApiService
 * ------------------------------------------------------------
 * Capa de acceso HTTP a la API (FastAPI) y al search-service.
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
  type PaginatedResponse
} from '../types';

class ApiService {
  private api: AxiosInstance;
  private baseURL: string;

  constructor() {
    // Base URL del backend FastAPI (REACT_APP_API_URL) o localhost por defecto
    this.baseURL = process.env.REACT_APP_API_URL || 'http://localhost:8000';
    this.api = axios.create({
      baseURL: `${this.baseURL}/api/v1`,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Request interceptor to add auth token
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

    // Response interceptor to handle token refresh
    this.api.interceptors.response.use(
      (response) => response,
      async (error) => {
        const originalRequest = error.config;
        
        if (error.response?.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true;
          
          try {
            const refreshToken = localStorage.getItem('refresh_token');
            if (refreshToken) {
              const response = await this.refreshToken(refreshToken);
              localStorage.setItem('access_token', response.access_token);
              localStorage.setItem('refresh_token', response.refresh_token);
              
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

  // Auth methods
  /**
   * Login de usuario. Guarda tokens en localStorage y retorna payload de auth.
   */
  async login(credentials: UserLogin): Promise<AuthResponse> {
    const response: AxiosResponse<AuthResponse> = await this.api.post('/auth/login', credentials);
    
    // Store tokens
    localStorage.setItem('access_token', response.data.access_token);
    if (response.data.refresh_token) {
      localStorage.setItem('refresh_token', response.data.refresh_token);
    }
    
    return response.data;
  }

  /**
   * Registro de usuario. Guarda tokens y retorna payload de auth.
   */
  async register(userData: UserCreate): Promise<AuthResponse> {
    const response: AxiosResponse<AuthResponse> = await this.api.post('/auth/register', userData);
    
    // Store tokens
    localStorage.setItem('access_token', response.data.access_token);
    if (response.data.refresh_token) {
      localStorage.setItem('refresh_token', response.data.refresh_token);
    }
    
    return response.data;
  }

  /**
   * Solicita nuevo access_token (si el backend lo soporta).
   */
  async refreshToken(refreshToken: string): Promise<{ access_token: string; refresh_token: string }> {
    const response = await this.api.post('/auth/refresh', { refresh_token: refreshToken });
    return response.data;
  }

  /**
   * Limpia tokens del almacenamiento (cerrar sesión client-side).
   */
  logout(): void {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
  }

  // User methods
  /** Obtiene el usuario actual autenticado. */
  async getCurrentUser(): Promise<User> {
    const response: AxiosResponse<User> = await this.api.get('/users/me');
    return response.data;
  }

  /** Actualiza datos del usuario actual. */
  async updateCurrentUser(userData: Partial<User>): Promise<User> {
    const response: AxiosResponse<User> = await this.api.put('/users/me', userData);
    return response.data;
  }

  // Task methods
  /** Lista tareas paginadas. */
  async getTasks(page: number = 1, size: number = 20): Promise<PaginatedResponse<Task>> {
    const response: AxiosResponse<PaginatedResponse<Task>> = await this.api.get('/tasks', {
      params: { page, size }
    });
    return response.data;
  }

  /** Obtiene una tarea por id. */
  async getTask(id: string): Promise<Task> {
    const response: AxiosResponse<Task> = await this.api.get(`/tasks/${id}`);
    return response.data;
  }

  /** Crea una nueva tarea. */
  async createTask(taskData: TaskCreate): Promise<Task> {
    const response: AxiosResponse<Task> = await this.api.post('/tasks/', taskData);
    return response.data;
  }

  /** Actualiza una tarea existente. */
  async updateTask(id: string, taskData: TaskUpdate): Promise<Task> {
    const response: AxiosResponse<Task> = await this.api.put(`/tasks/${id}`, taskData);
    return response.data;
  }

  /** Elimina una tarea. */
  async deleteTask(id: string): Promise<void> {
    await this.api.delete(`/tasks/${id}`);
  }

  // Note methods
  /** Lista notas paginadas. */
  async getNotes(page: number = 1, size: number = 20): Promise<PaginatedResponse<Note>> {
    const response: AxiosResponse<PaginatedResponse<Note>> = await this.api.get('/notes', {
      params: { page, size }
    });
    return response.data;
  }

  /** Obtiene una nota por id. */
  async getNote(id: string): Promise<Note> {
    const response: AxiosResponse<Note> = await this.api.get(`/notes/${id}`);
    return response.data;
  }

  /** Crea una nueva nota. */
  async createNote(noteData: NoteCreate): Promise<Note> {
    const response: AxiosResponse<Note> = await this.api.post('/notes/', noteData);
    return response.data;
  }

  /** Actualiza una nota existente. */
  async updateNote(id: string, noteData: NoteUpdate): Promise<Note> {
    const response: AxiosResponse<Note> = await this.api.put(`/notes/${id}`, noteData);
    return response.data;
  }

  /** Elimina una nota. */
  async deleteNote(id: string): Promise<void> {
    await this.api.delete(`/notes/${id}`);
  }

  /** Obtiene historial de una nota. */
  async getNoteHistory(id: string): Promise<NoteHistory[]> {
    const response: AxiosResponse<NoteHistory[]> = await this.api.get(`/notes/${id}/history`);
    return response.data;
  }

  // Category methods
  /** Lista categorías del usuario. */
  async getCategories(): Promise<Category[]> {
    const response: AxiosResponse<Category[]> = await this.api.get('/categories/');
    return response.data;
  }

  /** Crea categoría. */
  async createCategory(categoryData: CategoryCreate): Promise<Category> {
    const response: AxiosResponse<Category> = await this.api.post('/categories/', categoryData);
    return response.data;
  }

  /** Actualiza categoría. */
  async updateCategory(id: string, categoryData: CategoryUpdate): Promise<Category> {
    const response: AxiosResponse<Category> = await this.api.put(`/categories/${id}`, categoryData);
    return response.data;
  }

  /** Elimina categoría. */
  async deleteCategory(id: string): Promise<void> {
    await this.api.delete(`/categories/${id}`);
  }

  // Tag methods
  /** Lista etiquetas del usuario. */
  async getTags(): Promise<Tag[]> {
    const response: AxiosResponse<Tag[]> = await this.api.get('/tags/');
    return response.data;
  }

  /** Crea etiqueta. */
  async createTag(tagData: TagCreate): Promise<Tag> {
    const response: AxiosResponse<Tag> = await this.api.post('/tags/', tagData);
    return response.data;
  }

  /** Actualiza etiqueta. */
  async updateTag(id: string, tagData: TagUpdate): Promise<Tag> {
    const response: AxiosResponse<Tag> = await this.api.put(`/tags/${id}`, tagData);
    return response.data;
  }

  /** Elimina etiqueta. */
  async deleteTag(id: string): Promise<void> {
    await this.api.delete(`/tags/${id}`);
  }

  // Search methods
  /**
   * Busca notas en el search-service (Go) por texto completo.
   * Requiere `REACT_APP_SEARCH_URL` o usa http://localhost:8081.
   */
  async searchNotes(searchRequest: SearchRequest): Promise<SearchResponse> {
    const searchServiceURL = process.env.REACT_APP_SEARCH_URL || 'http://localhost:8081';
    // Consulta alineada al esquema GraphQL real del search-service
    const gqlQuery = `
      query SearchNotes($input: SearchRequestInput!) {
        searchNotes(input: $input) {
          total
          query
          notes {
            id
            title
            content
            userId
            category
            categoryId
            tags
            tagIds
            createdAt
            updatedAt
          }
        }
      }
    `;

    // Mapear tipos del frontend (snake_case) al input GraphQL (camelCase)
    const gqlInput = {
      query: searchRequest.query,
      userId: searchRequest.user_id,
      limit: searchRequest.limit,
      skip: searchRequest.offset ?? 0,
      category: searchRequest.category_name,
      tags: searchRequest.tag_names,
    };

    const body = {
      query: gqlQuery,
      variables: { input: gqlInput },
    };

    const response: AxiosResponse<{ data: { searchNotes: { total: number; query: string; notes: Array<{ id: string; title: string; content: string; userId: number; category?: string; categoryId?: string; tags?: string[]; tagIds?: string[]; createdAt?: string; updatedAt?: string }> } } }> = await axios.post(
      `${searchServiceURL}/graphql`,
      body,
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
        },
      }
    );

    const data = response.data.data.searchNotes;

    // Transformar la respuesta GraphQL al shape esperado por el frontend (SearchResponse + Note)
    const notes = (data.notes || []).map((n) => ({
      id: n.id,
      title: n.title,
      content: n.content,
      user_id: String(n.userId ?? ''),
      category_id: n.categoryId ?? undefined,
      created_at: n.createdAt ?? '',
      updated_at: n.updatedAt ?? '',
      category: n.category ? { id: String(n.categoryId ?? ''), name: n.category, color: '#4b5563' } : undefined,
      tags: (n.tags || []).map((name, idx) => ({ id: String((n.tagIds || [])[idx] ?? ''), name, color: '#6b7280' })),
    }));

    return {
      notes,
      total: data.total ?? 0,
      limit: gqlInput.limit ?? 0,
      offset: gqlInput.skip ?? 0,
    };
  }

  // Health check
  /** Health-check del backend FastAPI. */
  async healthCheck(): Promise<{ status: string }> {
    const response: AxiosResponse<{ status: string }> = await axios.get(`${this.baseURL}/health`);
    return response.data;
  }
}

export const apiService = new ApiService();
export default apiService;


