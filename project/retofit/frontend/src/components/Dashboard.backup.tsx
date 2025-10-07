import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { PuntosService, LogrosService, ActividadService } from '../services/fitnessService';
import { AddActivity } from './AddActivityNew';
import type { Puntos, Logro, Actividad } from '../types';

export const Dashboard: React.FC = () => {
  const { user, logout, refreshUser } = useAuth();
  const [puntos, setPuntos] = useState<Puntos[]>([]);
  const [logros, setLogros] = useState<Logro[]>([]);
  const [actividades, setActividades] = useState<Actividad[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadUserData = async () => {
      if (!user) return;

      try {
        setLoading(true);
        
        // Cargar datos en paralelo
        const [puntosData, logrosData, actividadesData] = await Promise.all([
          PuntosService.getPuntos(user.id),
          LogrosService.getLogros(user.id),
          ActividadService.getActividades(user.id)
        ]);

        setPuntos(puntosData);
        setLogros(logrosData);
        setActividades(actividadesData);
      } catch (error) {
        console.error('Error al cargar datos del usuario:', error);
      } finally {
        setLoading(false);
      }
    };

    loadUserData();
  }, [user]);

  const handleActivityAdded = () => {
    // Recargar datos cuando se agrega una nueva actividad
    const reloadData = async () => {
      if (!user) return;

      try {
        // Actualizar datos del usuario (incluye puntos totales actualizados)
        await refreshUser();
        
        // Actualizar listas de datos
        const [puntosData, logrosData, actividadesData] = await Promise.all([
          PuntosService.getPuntos(user.id),
          LogrosService.getLogros(user.id),
          ActividadService.getActividades(user.id)
        ]);

        setPuntos(puntosData);
        setLogros(logrosData);
        setActividades(actividadesData);
      } catch (error) {
        console.error('Error al cargar datos del usuario:', error);
      }
    };

    reloadData();
  };

  if (!user) {
    return <div>No hay usuario logueado</div>;
  }

  if (loading) {
    return <div style={{ padding: '20px', textAlign: 'center' }}>Cargando datos...</div>;
  }

  return (
    <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
      <header style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        marginBottom: '30px',
        padding: '20px',
        backgroundColor: '#f8f9fa',
        borderRadius: '8px'
      }}>
        <div>
          <h1>¡Hola, {user.username}! </h1>
          <p>Puntos totales: <strong>{user.puntos_totales}</strong></p>
        </div>
        <button onClick={logout} style={{
          padding: '10px 20px',
          backgroundColor: '#dc3545',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: 'pointer'
        }}>
          Cerrar Sesión
        </button>
      </header>

      <div style={{ marginBottom:
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
        gap: '20px', 
        marginBottom: '30px'
      }}>
        <div style={{ 
          padding: '20px', 
          backgroundColor: '#e8f5e8', 
          borderRadius: '8px',
          textAlign: 'center'
        }}>
          <h3> Actividades</h3>
          <p style={{ fontSize: '24px', fontWeight: 'bold' }}>
            {user.total_actividades || 0}
          </p>
        </div>
        
        <div style={{ 
          padding: '20px', 
          backgroundColor: '#f3e5f5', 
          borderRadius: '8px',
          textAlign: 'center'
        }}>
          <h3> Puntos</h3>
          <p style={{ fontSize: '24px', fontWeight: 'bold' }}>
            {puntos.reduce((total, punto) => total + punto.cantidad, 0)}
          </p>
        </div>
        
        <div style={{ 
          padding: '20px', 
          backgroundColor: '#fff3e0', 
          borderRadius: '8px',
          textAlign: 'center'
        }}>
          <h3> Logros</h3>
          <p style={{ fontSize: '24px', fontWeight: 'bold' }}>
            {logrosProgress.filter(l => l.obtenido).length} / {logrosProgress.length}
          </p>
        </div>
      </div>

      <div style={{ marginBottom: '30px' }}>
        <h2>Actividades Recientes</h2>
        {actividades.length > 0 ? (
          <div style={{ display: 'grid', gap: '15px' }}>
            {actividades.slice(0, 5).map((actividad) => (
              <div key={actividad.id_actividad} style={{
                padding: '15px',
                border: '1px solid #ddd',
                borderRadius: '8px',
                backgroundColor: 'white'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <div>
                    <h4>{actividad.tipo}</h4>
                    <p>Duración: {actividad.duracion_min} minutos</p>
                    {actividad.distancia_km && (
                      <p>Distancia: {actividad.distancia_km} km</p>
                    )}
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <small>{new Date(actividad.fecha).toLocaleDateString()}</small>
                  </div>
               
      <div>
        <h2>Logros y Progreso</h2>
        {logrosProgress.length > 0 ? (
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))',
            gap: '20px'
          }}>
            {logrosProgress.map((logro) => (
              <div key={logro.id} style={{
                padding: '20px',
                border: 2px solid ,
                borderRadius: '12px',
                backgroundColor: logro.obtenido ? '#f1f8e9' : '#f9f9f9',
                opacity: logro.obtenido ? 1 : 0.6,
                filter: logro.obtenido ? 'none' : 'grayscale(30%)',
                transform: logro.obtenido ? 'scale(1)' : 'scale(0.98)',
                transition: 'all 0.3s ease'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', marginBottom: '10px' }}>
                  <span style={{ fontSize: '24px', marginRight: '10px' }}>
                    {logro.obtenido ? '' : ''}
                  </span>
                  <h4 style={{ margin: 0, color: logro.obtenido ? '#2e7d32' : '#666' }}>
                    {logro.nombre}
                  </h4>
                </div>
                
                <p style={{ color: '#666', marginBottom: '15px' }}>
                  {logro.descripcion}
                </p>
                
                <div style={{ marginBottom: '10px' }}>
                  <div style={{
                    width: '100%',
                    height: '8px',
                    backgroundColor: '#e0e0e0',
                    borderRadius: '4px',
                    overflow: 'hidden'
                  }}>
                    <div style={{
                      width: ${Math.min(logro.porcentaje_completado, 100)}%,
                      height: '100%',
                      backgroundColor: logro.obtenido ? '#4caf50' : '#2196f3',
                      transition: 'width 0.3s ease'
                    }} />
                  </div>
                </div>
                
                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  fontSize: '14px', 
                  color: '#666' 
                }}>
                  <span>Progreso: {logro.progreso_actual} / {logro.meta}</span>
                  <span>{Math.round(logro.porcentaje_completado)}%</span>
                </div>
                
                {logro.obtenido && logro.fecha_obtenido && (
                  <div style={{ 
                    marginTop: '10px', 
                    fontSize: '12px', 
                    color: '#4caf50', 
                    fontWeight: 'bold' 
                  }}>
                     Obtenido: {new Date(logro.fecha_obtenido).toLocaleDateString()}
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <p>No hay logros disponibles.</p>
        )}
      </div>
    </div>
  );
};
 </div>
              </div>
            ))}
          </div>
        ) : (
          <p>No hay actividades registradas aún.</p>
        )}
      </div>
 '30px' }}>
        <AddActivity onActivityAdded={handleActivityAdded} />
      </div>
padding: '20px', textAlign: 'center' }}>Cargando datos...</div>;
  }

  return (
    <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
      {/* Header */}
      <header style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        marginBottom: '30px',
        padding: '20px',
        backgroundColor: '#f8f9fa',
        borderRadius: '8px'
      }}>
        <div>
          <h1>¡Hola, {user.username}! 👋</h1>
          <p>Puntos totales: <strong>{user.puntos_totales}</strong></p>
        </div>
        <button 
          onClick={logout}
          style={{
            padding: '10px 20px',
            backgroundColor: '#dc3545',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          Cerrar Sesión
        </button>
      </header>

      {/* Formulario para agregar actividad */}
      <AddActivity onActivityAdded={handleActivityAdded} />

      {/* Estadísticas rápidas */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '20px',
        marginBottom: '30px'
      }}>
        <div style={{ 
          padding: '20px', 
          backgroundColor: '#e3f2fd', 
          borderRadius: '8px',
          textAlign: 'center'
        }}>
          <h3>🏃‍♂️ Actividades</h3>
          <p style={{ fontSize: '24px', fontWeight: 'bold' }}>
            {user.total_actividades || actividades.length}
          </p>
        </div>
        
        <div style={{ 
          padding: '20px', 
          backgroundColor: '#f3e5f5', 
          borderRadius: '8px',
          textAlign: 'center'
        }}>
          <h3>⭐ Puntos</h3>
          <p style={{ fontSize: '24px', fontWeight: 'bold' }}>
            {puntos.reduce((total, punto) => total + punto.cantidad, 0)}
          </p>
        </div>
        
        <div style={{ 
          padding: '20px', 
          backgroundColor: '#fff3e0', 
          borderRadius: '8px',
          textAlign: 'center'
        }}>
          <h3>🏆 Logros</h3>
          <p style={{ fontSize: '24px', fontWeight: 'bold' }}>{logros.filter(l => l.obtenido).length}</p>
        </div>
      </div>

      {/* Actividades recientes */}
      <div style={{ marginBottom: '30px' }}>
        <h2>Actividades Recientes</h2>
        {actividades.length > 0 ? (
          <div style={{ 
            display: 'grid', 
            gap: '15px'
          }}>
            {actividades.slice(0, 5).map((actividad) => (
              <div key={actividad.id_actividad} style={{
                padding: '15px',
                border: '1px solid #ddd',
                borderRadius: '8px',
                backgroundColor: 'white'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <div>
                    <h4>{actividad.tipo}</h4>
                    <p>Duración: {actividad.duracion_min} minutos</p>
                    {actividad.distancia_km && (
                      <p>Distancia: {actividad.distancia_km} km</p>
                    )}
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <small>{new Date(actividad.fecha).toLocaleDateString()}</small>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p>No hay actividades registradas.</p>
        )}
      </div>

      {/* Logros */}
      <div>
        <h2>Logros</h2>
        {logros.length > 0 ? (
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
            gap: '15px'
          }}>
            {logros.map((logro) => (
              <div key={logro.id} style={{
                padding: '15px',
                border: `2px solid ${logro.obtenido ? '#4caf50' : '#ddd'}`,
                borderRadius: '8px',
                backgroundColor: logro.obtenido ? '#f1f8e9' : '#f9f9f9',
                opacity: logro.obtenido ? 1 : 0.6
              }}>
                <h4>{logro.obtenido ? '🏆' : '🔒'} {logro.nombre}</h4>
                <p>{logro.descripcion}</p>
                <p><strong>Puntos requeridos:</strong> {logro.puntos_requeridos}</p>
                {logro.obtenido && logro.fecha_obtenido && (
                  <p><strong>Obtenido:</strong> {new Date(logro.fecha_obtenido).toLocaleDateString()}</p>
                )}
              </div>
            ))}
          </div>
        ) : (
          <p>No hay logros disponibles.</p>
        )}
      </div>
    </div>
  );
};