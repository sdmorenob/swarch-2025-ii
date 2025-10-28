import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { AuthService } from '../services/authService';

interface SimpleRegistrationData {
  name: string;
  email: string;
  password: string;
}

interface SimpleRegisterProps {
  onSwitchToLogin: () => void;
}

export const SimpleRegister: React.FC<SimpleRegisterProps> = ({ onSwitchToLogin }) => {
  const [formData, setFormData] = useState<SimpleRegistrationData>({
    name: '',  // Cambiado de username a name
    email: '',
    password: '',
  });
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');
  const { isLoading } = useAuth();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      // Registrar usuario usando el endpoint simple
      await AuthService.simpleRegister(formData);
      
      setSuccess('¡Usuario registrado exitosamente! Ahora puedes iniciar sesión.');
      
      // Cambiar automáticamente al login después de 2 segundos
      setTimeout(() => {
        onSwitchToLogin();
      }, 2000);
      
    } catch (err: any) {
      const errorMsg = err.response?.data?.detail || err.response?.data?.message || 'Error al registrar usuario';
      setError(errorMsg);
    }
  };

  return (
    <div style={{ maxWidth: '400px', margin: '0 auto', padding: '20px' }}>
      <h2>Registrarse - RetoFit</h2>
      <p style={{ color: '#666', marginBottom: '20px' }}>
        (Versión simplificada sin verificación de email)
      </p>
      
      <form onSubmit={handleRegister}>
        <div style={{ marginBottom: '15px' }}>
          <label htmlFor="name">Nombre de Usuario:</label>
          <input
            type="text"
            id="name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            required
            style={{ 
              width: '100%', 
              padding: '8px', 
              marginTop: '5px',
              border: '1px solid #ccc',
              borderRadius: '4px'
            }}
          />
        </div>

        <div style={{ marginBottom: '15px' }}>
          <label htmlFor="email">Email:</label>
          <input
            type="email"
            id="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            required
            style={{ 
              width: '100%', 
              padding: '8px', 
              marginTop: '5px',
              border: '1px solid #ccc',
              borderRadius: '4px'
            }}
          />
        </div>

        <div style={{ marginBottom: '15px' }}>
          <label htmlFor="password">Contraseña:</label>
          <input
            type="password"
            id="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            required
            style={{ 
              width: '100%', 
              padding: '8px', 
              marginTop: '5px',
              border: '1px solid #ccc',
              borderRadius: '4px'
            }}
          />
        </div>

        {error && (
          <div style={{ 
            color: 'red', 
            marginBottom: '15px',
            padding: '10px',
            border: '1px solid red',
            borderRadius: '4px',
            backgroundColor: '#ffebee'
          }}>
            {error}
          </div>
        )}

        {success && (
          <div style={{ 
            color: 'green', 
            marginBottom: '15px',
            padding: '10px',
            border: '1px solid green',
            borderRadius: '4px',
            backgroundColor: '#e8f5e8'
          }}>
            {success}
          </div>
        )}

        <button
          type="submit"
          disabled={isLoading}
          style={{
            width: '100%',
            padding: '10px',
            backgroundColor: '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: isLoading ? 'not-allowed' : 'pointer',
            opacity: isLoading ? 0.6 : 1
          }}
        >
          {isLoading ? 'Registrando...' : 'Registrarse'}
        </button>
      </form>

      <div style={{ textAlign: 'center', marginTop: '20px' }}>
        <p>¿Ya tienes una cuenta?</p>
        <button
          type="button"
          onClick={onSwitchToLogin}
          style={{
            padding: '10px 20px',
            backgroundColor: '#6c757d',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          Iniciar Sesión
        </button>
      </div>
    </div>
  );
};