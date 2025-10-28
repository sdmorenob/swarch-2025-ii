/**
 * AuthContext
 * ------------------------------------------------------------
 * Maneja estado global de autenticación:
 * - user/isAuthenticated/isLoading/error
 * - login/register/logout/updateUser/clearError
 * - Al autenticar, conecta Socket.IO y se une a la sala del usuario
 */
import React, { createContext, useContext, useReducer, useEffect } from 'react';
import type { ReactNode } from 'react';
import type { User, UserLogin, UserCreate } from '../types';
import { apiService } from '../services/api';
import { socketService } from '../services/socket';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

type AuthAction =
  | { type: 'AUTH_START' }
  | { type: 'AUTH_SUCCESS'; payload: User }
  | { type: 'AUTH_FAILURE'; payload: string }
  | { type: 'LOGOUT' }
  | { type: 'CLEAR_ERROR' }
  | { type: 'UPDATE_USER'; payload: User };

interface AuthContextType extends AuthState {
  login: (credentials: UserLogin) => Promise<void>;
  register: (userData: UserCreate) => Promise<void>;
  logout: () => void;
  clearError: () => void;
  updateUser: (userData: Partial<User>) => Promise<void>;
  token: string | null;
}

const initialState: AuthState = {
  user: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,
};

/**
 * Reducer para manejar el estado de autenticación
 * Maneja todas las transiciones de estado relacionadas con auth
 */
const authReducer = (state: AuthState, action: AuthAction): AuthState => {
  switch (action.type) {
    // Inicia proceso de autenticación (login/register/check)
    case 'AUTH_START':
      return {
        ...state,
        isLoading: true,
        error: null,
      };
    // Autenticación exitosa - establece usuario y estado autenticado
    case 'AUTH_SUCCESS':
      return {
        ...state,
        user: action.payload,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      };
    // Fallo en autenticación - limpia usuario y establece error
    case 'AUTH_FAILURE':
      return {
        ...state,
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: action.payload,
      };
    // Logout - limpia completamente el estado de autenticación
    case 'LOGOUT':
      return {
        ...state,
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: null,
      };
    // Limpia errores sin afectar otros estados
    case 'CLEAR_ERROR':
      return {
        ...state,
        error: null,
      };
    // Actualiza información del usuario (ej: después de editar perfil)
    case 'UPDATE_USER':
      return {
        ...state,
        user: action.payload,
      };
    default:
      return state;
  }
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  /**
   * Efecto para verificar autenticación existente al montar el componente
   * - Busca token en localStorage
   * - Si existe, valida con el servidor y reconecta WebSocket
   * - Si falla, limpia tokens y establece estado no autenticado
   */
  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('access_token');
      if (token) {
        try {
          dispatch({ type: 'AUTH_START' });
          const user = await apiService.getCurrentUser();
          dispatch({ type: 'AUTH_SUCCESS', payload: user });
          
          // Conectar WebSocket y unirse a la sala del usuario para notificaciones
          socketService.connect();
          socketService.joinUserRoom(user.id);
        } catch (error) {
          console.error('Auth check failed:', error);
          // Token inválido o expirado - limpiar localStorage
          localStorage.removeItem('access_token');
          localStorage.removeItem('refresh_token');
          dispatch({ type: 'AUTH_FAILURE', payload: 'Session expired' });
        }
      }
    };

    checkAuth();
  }, []);

  /**
   * Efecto para desconectar WebSocket cuando el usuario no está autenticado
   * Previene conexiones innecesarias y limpia recursos
   */
  useEffect(() => {
    if (!state.isAuthenticated) {
      socketService.disconnect();
    }
  }, [state.isAuthenticated]);

  /**
   * Función de login
   * - Envía credenciales al servidor
   * - Almacena tokens en localStorage (manejado por apiService)
   * - Conecta WebSocket y se une a sala del usuario
   * - Maneja errores y los propaga para mostrar en UI
   */
  const login = async (credentials: UserLogin): Promise<void> => {
    try {
      dispatch({ type: 'AUTH_START' });
      const authResponse = await apiService.login(credentials);
      dispatch({ type: 'AUTH_SUCCESS', payload: authResponse.user });
      
      // Conectar WebSocket para recibir actualizaciones en tiempo real
      socketService.connect();
      socketService.joinUserRoom(authResponse.user.id);
    } catch (error: any) {
      const errorMessage = error.response?.data?.detail || 'Login failed';
      dispatch({ type: 'AUTH_FAILURE', payload: errorMessage });
      throw error;
    }
  };

  /**
   * Función de registro
   * - Crea nueva cuenta de usuario
   * - Automáticamente autentica al usuario después del registro
   * - Conecta WebSocket para el nuevo usuario
   */
  const register = async (userData: UserCreate): Promise<void> => {
    try {
      dispatch({ type: 'AUTH_START' });
      const authResponse = await apiService.register(userData);
      dispatch({ type: 'AUTH_SUCCESS', payload: authResponse.user });
      
      // Conectar WebSocket para el usuario recién registrado
      socketService.connect();
      socketService.joinUserRoom(authResponse.user.id);
    } catch (error: any) {
      const errorMessage = error.response?.data?.detail || 'Registration failed';
      dispatch({ type: 'AUTH_FAILURE', payload: errorMessage });
      throw error;
    }
  };

  /**
   * Función de logout
   * - Desconecta WebSocket y abandona sala del usuario
   * - Limpia tokens del localStorage
   * - Resetea estado de autenticación
   */
  const logout = (): void => {
    if (state.user) {
      socketService.leaveUserRoom(state.user.id);
    }
    socketService.disconnect();
    apiService.logout();
    dispatch({ type: 'LOGOUT' });
  };

  const clearError = (): void => {
    dispatch({ type: 'CLEAR_ERROR' });
  };

  const updateUser = async (userData: Partial<User>): Promise<void> => {
    try {
      const updatedUser = await apiService.updateCurrentUser(userData);
      dispatch({ type: 'UPDATE_USER', payload: updatedUser });
    } catch (error: any) {
      const errorMessage = error.response?.data?.detail || 'Update failed';
      dispatch({ type: 'AUTH_FAILURE', payload: errorMessage });
      throw error;
    }
  };

  const value: AuthContextType = {
    ...state,
    login,
    register,
    logout,
    clearError,
    updateUser,
    token: localStorage.getItem('access_token'),
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new (Error as any)('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;