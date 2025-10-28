/**
 * SocketService
 * ------------------------------------------------------------
 * Envoltura simple para gestionar la conexión Socket.IO del cliente.
 * - Conecta con la URL del backend (REACT_APP_SOCKET_URL o localhost)
 * - Expone helpers para subscribirse a eventos (task_*, note_*)
 * - Permite unirse a la sala del usuario (user_{userId})
 */
import { io, Socket } from 'socket.io-client';
import { Task, Note, SocketEvents } from '../types';

class SocketService {
  private socket: Socket | null = null;
  private url: string;

  constructor() {
    this.url = process.env.REACT_APP_SOCKET_URL || 'http://localhost:8000';
  }

  connect(): void {
    if (this.socket?.connected) {
      return;
    }

    const token = localStorage.getItem('access_token');
    
    this.socket = io(this.url, {
      auth: {
        token: token
      },
      transports: ['websocket', 'polling']
    });

    this.socket.on('connect', () => {
      console.log('Connected to WebSocket server');
    });

    this.socket.on('disconnect', () => {
      console.log('Disconnected from WebSocket server');
    });

    this.socket.on('connect_error', (error) => {
      console.error('WebSocket connection error:', error);
    });
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  // Task events
  /** Suscribe callback a evento de creación de tarea. */
  onTaskCreated(callback: (task: Task) => void): void {
    this.socket?.on('task_created', callback);
  }

  /** Suscribe callback a evento de actualización de tarea. */
  onTaskUpdated(callback: (task: Task) => void): void {
    this.socket?.on('task_updated', callback);
  }

  /** Suscribe callback a evento de borrado de tarea. */
  onTaskDeleted(callback: (taskId: string) => void): void {
    this.socket?.on('task_deleted', callback);
  }

  // Note events
  /** Suscribe callback a evento de creación de nota. */
  onNoteCreated(callback: (note: Note) => void): void {
    this.socket?.on('note_created', callback);
  }

  /** Suscribe callback a evento de actualización de nota. */
  onNoteUpdated(callback: (note: Note) => void): void {
    this.socket?.on('note_updated', callback);
  }

  /** Suscribe callback a evento de borrado de nota. */
  onNoteDeleted(callback: (noteId: string) => void): void {
    this.socket?.on('note_deleted', callback);
  }

  // Remove listeners
  offTaskCreated(callback?: (task: Task) => void): void {
    this.socket?.off('task_created', callback);
  }

  offTaskUpdated(callback?: (task: Task) => void): void {
    this.socket?.off('task_updated', callback);
  }

  offTaskDeleted(callback?: (taskId: string) => void): void {
    this.socket?.off('task_deleted', callback);
  }

  offNoteCreated(callback?: (note: Note) => void): void {
    this.socket?.off('note_created', callback);
  }

  offNoteUpdated(callback?: (note: Note) => void): void {
    this.socket?.off('note_updated', callback);
  }

  offNoteDeleted(callback?: (noteId: string) => void): void {
    this.socket?.off('note_deleted', callback);
  }

  // Join/leave rooms
  /** Solicita al servidor unir el socket a la sala del usuario. */
  joinUserRoom(userId: string): void {
    this.socket?.emit('join_user_room', userId);
  }

  /** Solicita al servidor abandonar la sala del usuario. */
  leaveUserRoom(userId: string): void {
    this.socket?.emit('leave_user_room', userId);
  }

  // Check connection status
  isConnected(): boolean {
    return this.socket?.connected || false;
  }

  // Emit custom events
  emit(event: string, data: any): void {
    this.socket?.emit(event, data);
  }

  // Listen to custom events
  on(event: string, callback: (...args: any[]) => void): void {
    this.socket?.on(event, callback);
  }

  // Remove custom event listeners
  off(event: string, callback?: (...args: any[]) => void): void {
    this.socket?.off(event, callback);
  }
}

export const socketService = new SocketService();
export default socketService;