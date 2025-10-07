/**
 * SocketContext
 * ------------------------------------------------------------
 * Provee acceso React Context a la conexión Socket.IO (socket y connected).
 * Se conecta automáticamente cuando hay un usuario autenticado.
 *
 * Nota: El proyecto también tiene `services/socket.ts` como wrapper funcional.
 * Este contexto usa el cliente directamente para casos simples de lectura.
 */
import React, { createContext, useContext, useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from './AuthContext';

interface SocketContextType {
  socket: Socket | null;
  connected: boolean;
}

const SocketContext = createContext<SocketContextType | undefined>(undefined);

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (context === undefined) {
    throw new (Error as any)('useSocket must be used within a SocketProvider');
  }
  return context;
};

interface SocketProviderProps {
  children: ReactNode;
}

export const SocketProvider: React.FC<SocketProviderProps> = ({ children }) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [connected, setConnected] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      const newSocket = io('http://localhost:8000', {
        auth: {
          token: localStorage.getItem('access_token'),
        },
      });

      newSocket.on('connect', () => {
        console.log('Connected to WebSocket server');
        setConnected(true);
      });

      newSocket.on('disconnect', () => {
        console.log('Disconnected from WebSocket server');
        setConnected(false);
      });

      newSocket.on('task_updated', (data) => {
        console.log('Task updated:', data);
        // Aquí se pueden manejar las actualizaciones en tiempo real
      });

      newSocket.on('note_updated', (data) => {
        console.log('Note updated:', data);
        // Aquí se pueden manejar las actualizaciones en tiempo real
      });

      setSocket(newSocket);

      return () => {
        newSocket.close();
      };
    }
  }, [user]);

  const value = {
    socket,
    connected,
  };

  return <SocketContext.Provider value={value}>{children}</SocketContext.Provider>;
};