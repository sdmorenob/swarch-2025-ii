//
// Tipos compartidos del frontend
// ------------------------------------------------------------
// Representan el shape de datos que viajan entre el frontend y el backend.
// Incluyen: User, Task, Note, Category, Tag, Auth, Search, PaginaciÃ³n, etc.
//

// User types
export interface User {
  id: string;
  email: string;
  full_name: string;
  name: string; // Alias for full_name for compatibility
  is_active: boolean;
  created_at: string;
  updated_at: string;
  avatar_url?: string; // Optional avatar URL
}

export interface UserCreate {
  email: string;
  password: string;
  name: string;
}

export interface UserLogin {
  email: string;
  password: string;
}

// Task types
export interface Task {
  id: string;
  title: string;
  description?: string;
  completed: boolean;
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled'; // Added status field
  priority: 'low' | 'medium' | 'high';
  due_date?: string;
  category_id?: string;
  user_id: string;
  created_at: string;
  updated_at: string;
  category?: Category;
  tags: Tag[];
}

export interface TaskCreate {
  title: string;
  description?: string;
  priority: 'low' | 'medium' | 'high';
  due_date?: string;
  category_id?: string;
  tag_ids?: string[];
}

export interface TaskUpdate {
  title?: string;
  description?: string;
  completed?: boolean;
  priority?: 'low' | 'medium' | 'high';
  due_date?: string;
  category_id?: string;
  tag_ids?: string[];
}

// Note types
export interface Note {
  id: string;
  title: string;
  content: string;
  user_id: string;
  category_id?: string;
  created_at: string;
  updated_at: string;
  category?: {
    id: string;
    name: string;
    color: string;
  };
  tags: {
    id: string;
    name: string;
    color: string;
  }[];
}

export interface NoteCreate {
  title: string;
  content: string;
  category_id?: string;
  tag_ids?: string[];
}

export interface NoteUpdate {
  title?: string;
  content?: string;
  category_id?: string;
  tag_ids?: string[];
}

export interface NoteHistory {
  id: string;
  note_id: string;
  title: string;
  content: string;
  changed_at: string;
  change_type: 'created' | 'updated' | 'deleted';
}

// Category types
export interface Category {
  id: string;
  name: string;
  color: string;
  user_id: string;
  created_at: string;
  updated_at: string;
  description?: string; // Optional for frontend compatibility
  notes_count?: number; // Optional for frontend compatibility
}

export interface CategoryCreate {
  name: string;
  color: string;
  description?: string;
}

export interface CategoryUpdate {
  name?: string;
  color?: string;
  description?: string;
}

// Tag types
export interface Tag {
  id: string;
  name: string;
  color: string;
  user_id: string;
  created_at: string;
  updated_at: string;
  description?: string; // Optional for frontend compatibility
  notes_count?: number; // Optional for frontend compatibility
}

export interface TagCreate {
  name: string;
  color: string;
  description?: string;
}

export interface TagUpdate {
  name?: string;
  color?: string;
  description?: string;
}

// Auth types
export interface AuthTokens {
  access_token: string;
  refresh_token: string;
  token_type: string;
}

export interface AuthResponse {
  user: User;
  access_token: string;
  refresh_token?: string;
  token_type: string;
}

// Search types
export interface SearchRequest {
  query: string;
  user_id: number;  // Required by Go search service
  limit?: number;
  offset?: number;
  category_id?: string;
  tag_ids?: string[];
  // Opcionales para búsqueda por nombre (GraphQL: category, tags)
  category_name?: string;
  tag_names?: string[];
}

export interface SearchResponse {
  notes: Note[];
  total: number;
  limit: number;
  offset: number;
}

// API Response types
export interface ApiResponse<T> {
  data: T;
  message?: string;
  success: boolean;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  size: number;
  pages: number;
}

// Form types
export interface FormErrors {
  [key: string]: string[];
}

// Theme types
export interface ThemeMode {
  mode: 'light' | 'dark';
}

// Socket types
export interface SocketEvents {
  'task_updated': (task: Task) => void;
  'task_created': (task: Task) => void;
  'task_deleted': (taskId: string) => void;
  'note_updated': (note: Note) => void;
  'note_created': (note: Note) => void;
  'note_deleted': (noteId: string) => void;
}

