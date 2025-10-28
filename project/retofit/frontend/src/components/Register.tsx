import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { AuthService } from '../services/authService';
import type { UserRegistrationRequest, EmailVerificationRequest } from '../types';

export const Register: React.FC = () => {
  const [step, setStep] = useState<'register' | 'verify'>('register');
  const [formData, setFormData] = useState<UserRegistrationRequest>({
    username: '',
    email: '',
    password: '',
  });
  const [verificationData, setVerificationData] = useState<EmailVerificationRequest>({
    email: '',
    codigo: '',
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

  const handleVerificationChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setVerificationData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      // Primero verificar si el email existe
      await AuthService.checkEmail({ email: formData.email });
      
      // Si no existe, proceder con el registro
      await AuthService.register(formData);
      
      setVerificationData({ email: formData.email, codigo: '' });
      setStep('verify');
      setSuccess('¡Registro exitoso! Revisa tu email para el código de verificación.');
    } catch (err: any) {
      const errorMsg = err.response?.data?.detail || err.response?.data?.message || 'Error al registrar usuario';
      setError(errorMsg);
    }
  };

  const handleVerification = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      await AuthService.verifyEmail(verificationData);
      setSuccess('¡Email verificado exitosamente! Ahora puedes iniciar sesión.');
      // Opcional: redirigir automáticamente al login después de unos segundos
      setTimeout(() => {
        setStep('register');
        setFormData({ username: '', email: '', password: '' });
        setVerificationData({ email: '', codigo: '' });
      }, 2000);
    } catch (err: any) {
      const errorMsg = err.response?.data?.detail || 'Código de verificación incorrecto';
      setError(errorMsg);
    }
  };

  if (step === 'verify') {
    return (
      <div style={{ maxWidth: '400px', margin: '0 auto', padding: '20px' }}>
        <h2>Verificar Email - RetoFit</h2>
        <p>Se ha enviado un código de verificación a: <strong>{verificationData.email}</strong></p>
        
        <form onSubmit={handleVerification}>
          <div style={{ marginBottom: '15px' }}>
            <label htmlFor="codigo">Código de Verificación:</label>
            <input
              type="text"
              id="codigo"
              name="codigo"
              value={verificationData.codigo}
              onChange={handleVerificationChange}
              required
              placeholder="Ingresa el código de 6 dígitos"
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
              backgroundColor: '#28a745',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: isLoading ? 'not-allowed' : 'pointer',
              opacity: isLoading ? 0.6 : 1,
              marginBottom: '10px'
            }}
          >
            {isLoading ? 'Verificando...' : 'Verificar Email'}
          </button>

          <button
            type="button"
            onClick={() => setStep('register')}
            style={{
              width: '100%',
              padding: '10px',
              backgroundColor: '#6c757d',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Volver al Registro
          </button>
        </form>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '400px', margin: '0 auto', padding: '20px' }}>
      <h2>Registrarse - RetoFit</h2>
      
      <form onSubmit={handleRegister}>
        <div style={{ marginBottom: '15px' }}>
          <label htmlFor="username">Nombre de Usuario:</label>
          <input
            type="text"
            id="username"
            name="username"
            value={formData.username}
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
    </div>
  );
};