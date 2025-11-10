import React, { createContext, useContext, useEffect, useReducer } from 'react';
import socketService from '../services/socket';
import { User } from '../types';

interface SocketState {
  connected: boolean;
}

interface SocketAction {
  type: 'CONNECT' | 'DISCONNECT';
}

const initialState: SocketState = {
  connected: false,
};

function socketReducer(state: SocketState, action: SocketAction): SocketState {
  switch (action.type) {
    case 'CONNECT':
      return { connected: true };
    case 'DISCONNECT':
      return { connected: false };
    default:
      return state;
  }
}

interface SocketContextValue extends SocketState {
  connect: () => void;
  disconnect: () => void;
  joinUserRoom: (userId: number) => void;
  leaveUserRoom: (userId: number) => void;
  on: typeof socketService.on;
  off: typeof socketService.off;
}

const SocketContext = createContext<SocketContextValue | undefined>(undefined);

export const SocketProvider: React.FC<React.PropsWithChildren<{ user?: User | null }>> = ({ children, user }) => {
  const [state, dispatch] = useReducer(socketReducer, initialState);

  useEffect(() => {
    socketService.connect();

    const handleConnect = () => dispatch({ type: 'CONNECT' });
    const handleDisconnect = () => dispatch({ type: 'DISCONNECT' });

    socketService.onSystem('connect', handleConnect);
    socketService.onSystem('disconnect', handleDisconnect);

    return () => {
      socketService.offSystem('connect', handleConnect);
      socketService.offSystem('disconnect', handleDisconnect);
      socketService.disconnect();
    };
  }, []);

  useEffect(() => {
    if (user?.id) {
      socketService.joinUserRoom(user.id);
    }
    return () => {
      if (user?.id) {
        socketService.leaveUserRoom(user.id);
      }
    };
  }, [user?.id]);

  const value: SocketContextValue = {
    connected: state.connected,
    connect: () => socketService.connect(),
    disconnect: () => socketService.disconnect(),
    joinUserRoom: (userId: number) => socketService.joinUserRoom(userId),
    leaveUserRoom: (userId: number) => socketService.leaveUserRoom(userId),
    on: socketService.on.bind(socketService) as any,
    off: socketService.off.bind(socketService) as any,
  };

  return <SocketContext.Provider value={value}>{children}</SocketContext.Provider>;
};

export const useSocket = (): SocketContextValue => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};