import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { PuntosService, LogrosService, ActividadService, RankingService } from '../services/fitnessService';
import { AddActivity } from './AddActivityNew';
import type { Puntos, LogroProgress, Actividad, UserRanking } from '../types';

export const Dashboard: React.FC = () => {
  const { user, logout, refreshUser } = useAuth();
  const [puntos, setPuntos] = useState<Puntos[]>([]);
  const [logrosProgress, setLogrosProgress] = useState<LogroProgress[]>([]);
  const [actividades, setActividades] = useState<Actividad[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Estados para paginación de actividades
  const [currentPage, setCurrentPage] = useState(1);
  const actividadesPorPagina = 4;
  
  // Estado para el ranking
  const [ranking, setRanking] = useState<UserRanking[]>([]);

  // Calcular paginación
  const totalPaginas = Math.ceil(actividades.length / actividadesPorPagina);
  const indiceInicio = (currentPage - 1) * actividadesPorPagina;
  const indiceFin = indiceInicio + actividadesPorPagina;
  const actividadesPaginadas = actividades.slice(indiceInicio, indiceFin);

  // Funciones de navegación
  const irAPagina = (pagina: number) => {
    setCurrentPage(pagina);
  };

  const paginaAnterior = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  const paginaSiguiente = () => {
    if (currentPage < totalPaginas) {
      setCurrentPage(currentPage + 1);
    }
  };

  useEffect(() => {
    const loadData = async () => {
      if (!user) return;
      
      try {
        setLoading(true);
        
        const [puntosData, logrosData, actividadesData] = await Promise.all([
          PuntosService.getPuntos(user.id),
          LogrosService.getAchievementsProgress(user.id),
          ActividadService.getActividades(user.id)
        ]);

        setPuntos(puntosData);
        setLogrosProgress(logrosData);
        setActividades(actividadesData);
      } catch (error) {
        console.error('Error al cargar datos:', error);
      } finally {
        setLoading(false);
      }
    };

    const cargarRanking = async () => {
      try {
        const rankingData = await RankingService.getUsersRanking();
        setRanking(rankingData);
      } catch (error) {
        console.error('Error al cargar el ranking:', error);
      }
    };

    loadData();
    cargarRanking();
  }, [user]);

  const handleActivityAdded = async () => {
    if (!user) return;

    try {
      await refreshUser();
      
      const [puntosData, logrosData, actividadesData] = await Promise.all([
        PuntosService.getPuntos(user.id),
        LogrosService.getAchievementsProgress(user.id),
        ActividadService.getActividades(user.id)
      ]);

      setPuntos(puntosData);
      setLogrosProgress(logrosData);
      setActividades(actividadesData);
      
      // Actualizar el ranking también
      const rankingData = await RankingService.getUsersRanking();
      setRanking(rankingData);
      
      // Resetear a la primera página para mostrar las actividades más recientes
      setCurrentPage(1);
    } catch (error) {
      console.error('Error al recargar datos:', error);
    }
  };

  if (!user) {
    return <div>No hay usuario logueado</div>;
  }

  if (loading) {
    return <div style={{ padding: '20px', textAlign: 'center' }}>Cargando datos...</div>;
  }

  return (
    <div style={{ padding: '20px', maxWidth: '1400px', margin: '0 auto', backgroundColor: '#f8f9fa' }}>
      <div style={{ display: 'flex', gap: '30px' }}>
        {/* Contenido principal */}
        <div style={{ flex: '1' }}>
      {/* Header mejorado */}
      <header style={{ 
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        padding: '30px',
        borderRadius: '16px',
        color: 'white',
        marginBottom: '30px',
        boxShadow: '0 10px 30px rgba(0,0,0,0.1)'
      }}>
        <h1 style={{ margin: 0, fontSize: '28px', fontWeight: '600' }}>
          ¡Hola, {user.username}! 👋
        </h1>
        <p style={{ margin: '8px 0 0 0', opacity: 0.9 }}>
          ¡Sigue así! Cada paso te acerca más a tus metas.
        </p>
      </header>
      
      <AddActivity onActivityAdded={handleActivityAdded} />
      
      {/* Estadísticas con diseño de tarjetas mejorado */}
      <div style={{ marginTop: '30px' }}>
        <h2 style={{ 
          color: '#333', 
          marginBottom: '20px',
          fontSize: '24px',
          fontWeight: '600'
        }}>
          📊 Resumen de tu progreso
        </h2>
        
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', 
          gap: '20px',
          marginBottom: '30px'
        }}>
          {/* Tarjeta de Actividades */}
          <div style={{
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            padding: '25px',
            borderRadius: '16px',
            color: 'white',
            position: 'relative',
            overflow: 'hidden',
            boxShadow: '0 8px 25px rgba(102, 126, 234, 0.25)',
            transform: 'translateY(0)',
            transition: 'all 0.3s ease'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-5px)';
            e.currentTarget.style.boxShadow = '0 15px 35px rgba(102, 126, 234, 0.35)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = '0 8px 25px rgba(102, 126, 234, 0.25)';
          }}>
            <div style={{
              position: 'absolute',
              top: '-20px',
              right: '-20px',
              width: '100px',
              height: '100px',
              backgroundColor: 'rgba(255,255,255,0.1)',
              borderRadius: '50%'
            }} />
            <div style={{ position: 'relative', zIndex: 1 }}>
              <div style={{ fontSize: '36px', marginBottom: '10px' }}>🏃‍♂️</div>
              <div style={{ fontSize: '32px', fontWeight: 'bold', marginBottom: '5px' }}>
                {user.total_actividades || 0}
              </div>
              <div style={{ fontSize: '16px', opacity: 0.9 }}>
                Actividad{(user.total_actividades || 0) !== 1 ? 'es' : ''} completada{(user.total_actividades || 0) !== 1 ? 's' : ''}
              </div>
            </div>
          </div>

          {/* Tarjeta de Puntos */}
          <div style={{
            background: 'linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)',
            padding: '25px',
            borderRadius: '16px',
            color: '#8b4513',
            position: 'relative',
            overflow: 'hidden',
            boxShadow: '0 8px 25px rgba(252, 182, 159, 0.25)',
            transform: 'translateY(0)',
            transition: 'all 0.3s ease'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-5px)';
            e.currentTarget.style.boxShadow = '0 15px 35px rgba(252, 182, 159, 0.35)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = '0 8px 25px rgba(252, 182, 159, 0.25)';
          }}>
            <div style={{
              position: 'absolute',
              top: '-20px',
              right: '-20px',
              width: '100px',
              height: '100px',
              backgroundColor: 'rgba(139, 69, 19, 0.1)',
              borderRadius: '50%'
            }} />
            <div style={{ position: 'relative', zIndex: 1 }}>
              <div style={{ fontSize: '36px', marginBottom: '10px' }}>⭐</div>
              <div style={{ fontSize: '32px', fontWeight: 'bold', marginBottom: '5px' }}>
                {puntos.reduce((total, punto) => total + punto.cantidad, 0)}
              </div>
              <div style={{ fontSize: '16px', opacity: 0.8 }}>
                Puntos acumulados
              </div>
            </div>
          </div>

          {/* Tarjeta de Logros */}
          <div style={{
            background: 'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)',
            padding: '25px',
            borderRadius: '16px',
            color: '#2d5016',
            position: 'relative',
            overflow: 'hidden',
            boxShadow: '0 8px 25px rgba(168, 237, 234, 0.25)',
            transform: 'translateY(0)',
            transition: 'all 0.3s ease'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-5px)';
            e.currentTarget.style.boxShadow = '0 15px 35px rgba(168, 237, 234, 0.35)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = '0 8px 25px rgba(168, 237, 234, 0.25)';
          }}>
            <div style={{
              position: 'absolute',
              top: '-20px',
              right: '-20px',
              width: '100px',
              height: '100px',
              backgroundColor: 'rgba(45, 80, 22, 0.1)',
              borderRadius: '50%'
            }} />
            <div style={{ position: 'relative', zIndex: 1 }}>
              <div style={{ fontSize: '36px', marginBottom: '10px' }}>🏆</div>
              <div style={{ fontSize: '32px', fontWeight: 'bold', marginBottom: '5px' }}>
                {logrosProgress.filter(l => l.obtenido).length} / {logrosProgress.length}
              </div>
              <div style={{ fontSize: '16px', opacity: 0.8 }}>
                Logros desbloqueados
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Sección de Logros con efectos visuales */}
      <div style={{ marginTop: '30px' }}>
        <h2>🏆 Logros y Progreso</h2>
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))',
          gap: '20px',
          marginTop: '20px'
        }}>
          {logrosProgress.map((logro) => (
            <div key={logro.id} style={{
              padding: '20px',
              border: `2px solid ${logro.obtenido ? '#4caf50' : '#ddd'}`,
              borderRadius: '12px',
              backgroundColor: logro.obtenido ? '#f1f8e9' : '#f9f9f9',
              opacity: logro.obtenido ? 1 : 0.7,
              filter: logro.obtenido ? 'none' : 'grayscale(20%)',
              transform: logro.obtenido ? 'scale(1)' : 'scale(0.98)',
              transition: 'all 0.3s ease'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', marginBottom: '15px' }}>
                <span style={{ fontSize: '28px', marginRight: '12px' }}>
                  {logro.obtenido ? '🏆' : '🔒'}
                </span>
                <h3 style={{ margin: 0, color: logro.obtenido ? '#2e7d32' : '#666' }}>
                  {logro.nombre}
                </h3>
              </div>
              
              <p style={{ color: '#666', marginBottom: '15px' }}>
                {logro.descripcion}
              </p>
              
              <div style={{ marginBottom: '12px' }}>
                <div style={{
                  width: '100%',
                  height: '10px',
                  backgroundColor: '#e0e0e0',
                  borderRadius: '5px',
                  overflow: 'hidden'
                }}>
                  <div style={{
                    width: `${Math.min(logro.porcentaje_completado, 100)}%`,
                    height: '100%',
                    backgroundColor: logro.obtenido ? '#4caf50' : '#2196f3',
                    transition: 'width 0.5s ease'
                  }} />
                </div>
              </div>
              
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                fontSize: '13px', 
                color: '#666'
              }}>
                <span>Progreso: {logro.progreso_actual} / {logro.meta}</span>
                <span>{Math.round(logro.porcentaje_completado)}%</span>
              </div>
              
              {logro.obtenido && logro.fecha_obtenido && (
                <div style={{ 
                  marginTop: '12px', 
                  fontSize: '12px', 
                  color: '#4caf50', 
                  fontWeight: 'bold'
                }}>
                  ✅ Obtenido: {new Date(logro.fecha_obtenido).toLocaleDateString()}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Sección de Actividades con paginación */}
      <div style={{ marginTop: '30px' }}>
        <h2>📋 Mis Actividades</h2>
        
        {actividades.length > 0 ? (
          <>
            {/* Actividades paginadas */}
            <div style={{ 
              display: 'grid', 
              gap: '15px',
              marginTop: '20px'
            }}>
              {actividadesPaginadas.map((actividad) => (
                <div key={actividad.id_actividad} style={{
                  padding: '20px',
                  border: '1px solid #ddd',
                  borderRadius: '12px',
                  backgroundColor: 'white',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                  transition: 'transform 0.2s ease',
                  cursor: 'pointer'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 4px 8px rgba(0,0,0,0.15)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 2px 4px rgba(0,0,0,0.1)';
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', marginBottom: '10px' }}>
                        <span style={{ fontSize: '24px', marginRight: '10px' }}>
                          {actividad.tipo === 'carrera' ? '🏃‍♂️' : 
                           actividad.tipo === 'ciclismo' ? '🚴‍♂️' : 
                           actividad.tipo === 'gimnasio' ? '🏋️‍♂️' : '💪'}
                        </span>
                        <h3 style={{ margin: 0, textTransform: 'capitalize', color: '#333' }}>
                          {actividad.tipo}
                        </h3>
                      </div>
                      
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: '10px' }}>
                        <div style={{ padding: '8px', backgroundColor: '#f0f7ff', borderRadius: '6px' }}>
                          <div style={{ fontSize: '12px', color: '#666' }}>⏱️ Duración</div>
                          <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#2196f3' }}>
                            {actividad.duracion_min || 0} min
                          </div>
                        </div>
                        
                        {actividad.distancia_km && (
                          <div style={{ padding: '8px', backgroundColor: '#fff3e0', borderRadius: '6px' }}>
                            <div style={{ fontSize: '12px', color: '#666' }}>📍 Distancia</div>
                            <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#ff9800' }}>
                              {actividad.distancia_km} km
                            </div>
                          </div>
                        )}
                        
                        <div style={{ padding: '8px', backgroundColor: '#e8f5e8', borderRadius: '6px' }}>
                          <div style={{ fontSize: '12px', color: '#666' }}>⭐ Puntos</div>
                          <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#4caf50' }}>
                            {/* Calcular puntos: 1 por cada 10 min + 1 por km */}
                            {Math.floor((actividad.duracion_min || 0) / 10) + Math.floor(actividad.distancia_km || 0)}
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div style={{ textAlign: 'right', minWidth: '100px' }}>
                      <div style={{ fontSize: '12px', color: '#666', marginBottom: '4px' }}>
                        📅 Fecha
                      </div>
                      <div style={{ fontSize: '14px', fontWeight: 'bold' }}>
                        {new Date(actividad.fecha).toLocaleDateString('es-ES', {
                          day: '2-digit',
                          month: '2-digit',
                          year: 'numeric'
                        })}
                      </div>
                      <div style={{ fontSize: '12px', color: '#999' }}>
                        {new Date(actividad.fecha).toLocaleTimeString('es-ES', {
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Controles de paginación */}
            {totalPaginas > 1 && (
              <div style={{ 
                display: 'flex', 
                justifyContent: 'center', 
                alignItems: 'center', 
                gap: '10px',
                marginTop: '20px',
                padding: '20px'
              }}>
                <button 
                  onClick={paginaAnterior}
                  disabled={currentPage === 1}
                  style={{
                    padding: '8px 16px',
                    backgroundColor: currentPage === 1 ? '#f5f5f5' : '#2196f3',
                    color: currentPage === 1 ? '#999' : 'white',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
                    transition: 'all 0.2s ease'
                  }}
                >
                  ← Anterior
                </button>

                <div style={{ display: 'flex', gap: '5px' }}>
                  {Array.from({ length: totalPaginas }, (_, index) => {
                    const numeroPagina = index + 1;
                    return (
                      <button
                        key={numeroPagina}
                        onClick={() => irAPagina(numeroPagina)}
                        style={{
                          padding: '8px 12px',
                          backgroundColor: currentPage === numeroPagina ? '#2196f3' : '#f5f5f5',
                          color: currentPage === numeroPagina ? 'white' : '#333',
                          border: 'none',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          minWidth: '40px',
                          transition: 'all 0.2s ease'
                        }}
                      >
                        {numeroPagina}
                      </button>
                    );
                  })}
                </div>

                <button 
                  onClick={paginaSiguiente}
                  disabled={currentPage === totalPaginas}
                  style={{
                    padding: '8px 16px',
                    backgroundColor: currentPage === totalPaginas ? '#f5f5f5' : '#2196f3',
                    color: currentPage === totalPaginas ? '#999' : 'white',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: currentPage === totalPaginas ? 'not-allowed' : 'pointer',
                    transition: 'all 0.2s ease'
                  }}
                >
                  Siguiente →
                </button>

                <div style={{ marginLeft: '20px', fontSize: '14px', color: '#666' }}>
                  Página {currentPage} de {totalPaginas} • {actividades.length} actividad{actividades.length !== 1 ? 'es' : ''} total{actividades.length !== 1 ? 'es' : ''}
                </div>
              </div>
            )}
          </>
        ) : (
          <div style={{ 
            textAlign: 'center', 
            padding: '40px', 
            backgroundColor: '#f9f9f9', 
            borderRadius: '12px',
            marginTop: '20px'
          }}>
            <div style={{ fontSize: '48px', marginBottom: '15px' }}>🏃‍♂️</div>
            <h3 style={{ color: '#666', marginBottom: '10px' }}>No hay actividades registradas</h3>
            <p style={{ color: '#999' }}>¡Comienza agregando tu primera actividad usando el formulario de arriba!</p>
          </div>
        )}
      </div>
        </div>
        
        {/* Sidebar de ranking */}
        <div style={{ width: '320px', flexShrink: 0 }}>
          {/* Botón de cerrar sesión */}
          <button 
            onClick={logout} 
            style={{ 
              width: '100%',
              padding: '12px',
              marginBottom: '20px',
              backgroundColor: '#dc3545',
              color: 'white',
              border: 'none',
              borderRadius: '12px',
              fontSize: '14px',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              boxShadow: '0 4px 15px rgba(220, 53, 69, 0.3)'
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.backgroundColor = '#c82333';
              e.currentTarget.style.transform = 'translateY(-2px)';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.backgroundColor = '#dc3545';
              e.currentTarget.style.transform = 'translateY(0)';
            }}
          >
            🚪 Cerrar Sesión
          </button>
          
          <div style={{
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            padding: '24px',
            borderRadius: '16px',
            color: 'white',
            boxShadow: '0 10px 30px rgba(0,0,0,0.1)',
            position: 'sticky',
            top: '20px'
          }}>
            <h3 style={{ 
              margin: '0 0 20px 0', 
              fontSize: '20px', 
              fontWeight: '600',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              🏆 Ranking de Puntos
            </h3>
            
            {ranking.length === 0 ? (
              <p style={{ opacity: 0.8, textAlign: 'center', margin: '20px 0' }}>
                Cargando ranking...
              </p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {ranking.map((userRanking) => (
                  <div 
                    key={userRanking.id}
                    style={{
                      background: user?.id === userRanking.id ? 'rgba(255,255,255,0.25)' : 'rgba(255,255,255,0.1)',
                      padding: '16px',
                      borderRadius: '12px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      border: user?.id === userRanking.id ? '2px solid rgba(255,255,255,0.4)' : 'none',
                      transition: 'all 0.3s ease'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{
                        width: '32px',
                        height: '32px',
                        borderRadius: '50%',
                        background: userRanking.position <= 3 
                          ? `linear-gradient(135deg, ${
                              userRanking.position === 1 ? '#FFD700, #FFA500' :
                              userRanking.position === 2 ? '#C0C0C0, #A9A9A9' :
                              '#CD7F32, #8B4513'
                            })` 
                          : 'rgba(255,255,255,0.2)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '14px',
                        fontWeight: '600',
                        color: userRanking.position <= 3 ? '#fff' : 'inherit'
                      }}>
                        {userRanking.position <= 3 ? (
                          userRanking.position === 1 ? '🥇' :
                          userRanking.position === 2 ? '🥈' : '🥉'
                        ) : userRanking.position}
                      </div>
                      <div>
                        <div style={{ fontWeight: '600', fontSize: '14px' }}>
                          {userRanking.username}
                          {user?.id === userRanking.id && ' (Tú)'}
                        </div>
                        <div style={{ opacity: 0.8, fontSize: '12px' }}>
                          {userRanking.total_actividades} actividades
                        </div>
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontWeight: '600', fontSize: '16px' }}>
                        {userRanking.puntos_totales}
                      </div>
                      <div style={{ opacity: 0.8, fontSize: '12px' }}>
                        puntos
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
