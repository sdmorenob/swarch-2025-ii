import React, { useState } from 'react';
import { Login } from './Login';
import { SimpleRegister } from './SimpleRegister';

export const Auth: React.FC = () => {
  const [currentView, setCurrentView] = useState<'login' | 'register'>('login');

  const switchToRegister = () => setCurrentView('register');
  const switchToLogin = () => setCurrentView('login');

  if (currentView === 'register') {
    return <SimpleRegister onSwitchToLogin={switchToLogin} />;
  }

  return <Login onSwitchToRegister={switchToRegister} />;
};