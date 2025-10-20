import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { ActividadService } from '../services/fitnessService';
import type { ActividadCreate } from '../types';

interface AddActivityProps {
  onActivityAdded: () => void;
}

export const AddActivity: React.FC<AddActivityProps> = ({ onActivityAdded }) => {
  const { user } = useAuth();
  const [formData, setFormData] = useState<ActividadCreate>({
    tipo: '',
    distancia_km: undefined,
    duracion_min: undefined,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const activityTypes = [
    'carrera', 'caminata', 'ciclismo', 'natacion', 'gimnasio', 
    'yoga', 'pilates', 'futbol', 'baloncesto', 'tenis', 'otro'
  ];

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'duracion_min' || name === 'distancia_km' 
        ? (value ? Number(value) : undefined) 
        : value,
    }));
  };

  const calculatePoints = (duracion?: number, distancia?: number): number => {
    let points = 0;
    if (duracion) {
      points += Math.floor(duracion / 10);
    }
    if (distancia) {
      points += Math.floor(distancia);
    }
    return Math.max(points, 1);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setError('');
    setSuccess('');
    setIsLoading(true);

    try {
      // Crear la actividad (el backend calcula y otorga puntos automáticamente)
      await ActividadService.createActividad(user.id, formData);
      
      // Calcular puntos solo para mostrar al usuario
      const points = calculatePoints(formData.duracion_min, formData.distancia_km);

      setSuccess(`¡Actividad registrada! Ganaste ${points} puntos 🎉`);
      setFormData({
        tipo: '',
        distancia_km: undefined,
        duracion_min: undefined,
      });
      
      onActivityAdded();
      
    } catch (err: any) {
      console.error('Error completo:', err);
      setError(err.response?.data?.detail || 'Error al registrar la actividad');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{ 
      backgroundColor: 'white', 
      padding: '20px', 
      borderRadius: '8px', 
      border: '1px solid #ddd',
      marginBottom: '20px'
    }}>
      <h3>Registrar Nueva Actividad 🏃‍♂️</h3>
      
      <form onSubmit={handleSubmit}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '15px' }}>
          <div>
            <label htmlFor="tipo">Tipo de Actividad:</label>
            <select
              id="tipo"
              name="tipo"
              value={formData.tipo}
              onChange={handleChange}
              required
              style={{ 
                width: '100%', 
                padding: '8px', 
                marginTop: '5px',
                border: '1px solid #ccc',
                borderRadius: '4px'
              }}
            >
              <option value="">Seleccionar...</option>
              {activityTypes.map(type => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="duracion_min">Duración (minutos):</label>
            <input
              type="number"
              id="duracion_min"
              name="duracion_min"
              value={formData.duracion_min || ''}
              onChange={handleChange}
              min="1"
              style={{ 
                width: '100%', 
                padding: '8px', 
                marginTop: '5px',
                border: '1px solid #ccc',
                borderRadius: '4px'
              }}
            />
          </div>
        </div>

        <div style={{ marginBottom: '15px' }}>
          <label htmlFor="distancia_km">Distancia (km) - opcional:</label>
          <input
            type="number"
            id="distancia_km"
            name="distancia_km"
            value={formData.distancia_km || ''}
            onChange={handleChange}
            min="0"
            step="0.1"
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
            padding: '12px',
            backgroundColor: '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: isLoading ? 'not-allowed' : 'pointer',
            opacity: isLoading ? 0.6 : 1,
            fontSize: '16px'
          }}
        >
          {isLoading ? 'Registrando...' : 'Registrar Actividad'}
        </button>
      </form>
    </div>
  );
};