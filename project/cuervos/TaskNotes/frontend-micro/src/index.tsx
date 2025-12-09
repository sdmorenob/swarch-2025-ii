/**
 * Punto de entrada de la aplicación React
 * ------------------------------------------------------------
 * Este archivo inicializa la aplicación React y la monta en el DOM.
 * - Configura React 18 con createRoot para el nuevo concurrent rendering
 * - Envuelve la app en StrictMode para detectar problemas en desarrollo
 */
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

// Crear el root de React 18 para el nuevo sistema de renderizado concurrente
const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);

// Renderizar la aplicación con StrictMode para mejores prácticas de desarrollo
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);