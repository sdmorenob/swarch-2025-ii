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
  private url: string | undefined;

  constructor() {
    // Preferir mismo origen para funcionar detrás de Nginx en Docker
    if (process.env.REACT_APP_SOCKET_URL) {
      this.url = process.env.REACT_APP_SOCKET_URL;
    } else if (typeof window !== 'undefined') {
      this.url = window.location.origin;
    } else {
      this.url = undefined;
    }
  }

  connect(): void {
    if (this.socket?.connected) {
      return;
    }

    const token = localStorage.getItem('access_token');
    
    this.socket = this.url
      ? io(this.url, {
          auth: { token },
          transports: ['polling', 'websocket'],
          path: '/socket.io',
        })
      : io({
          auth: { token },
          transports: ['polling', 'websocket'],
          path: '/socket.io',
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

  // Suscripción a eventos de sistema (no tipados en SocketEvents)
  onSystem(event: 'connect' | 'disconnect' | 'connect_error', handler: (...args: any[]) => void): void {
    this.socket?.on(event, handler);
  }

  offSystem(event: 'connect' | 'disconnect' | 'connect_error', handler: (...args: any[]) => void): void {
    this.socket?.off(event, handler);
  }

  joinUserRoom(userId: number): void {
    this.socket?.emit('join', { room: `user_${userId}` });
  }

  leaveUserRoom(userId: number): void {
    this.socket?.emit('leave', { room: `user_${userId}` });
  }

  on<EventName extends keyof SocketEvents>(event: EventName, handler: SocketEvents[EventName]): void {
    this.socket?.on(event, handler as any);
  }

  off<EventName extends keyof SocketEvents>(event: EventName, handler: SocketEvents[EventName]): void {
    this.socket?.off(event, handler as any);
  }
}

export const socketService = new SocketService();
export default socketService;