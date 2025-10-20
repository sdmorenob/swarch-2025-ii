/**
 * Componente Login
 * ------------------------------------------------------------
 * Formulario de inicio de sesión con:
 * - Validación de campos email y password
 * - Manejo de estados de carga y errores
 * - Navegación automática después del login exitoso
 * - Integración con AuthContext para autenticación
 */
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Paper,
  TextField,
  Button,
  Typography,
  Box,
  Alert,
  CircularProgress,
} from '@mui/material';
import { Assignment } from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';

const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  /**
   * Maneja el envío del formulario de login
   * - Previene el comportamiento por defecto del form
   * - Limpia errores previos y activa estado de carga
   * - Llama al método login del AuthContext
   * - Navega al dashboard si es exitoso, muestra error si falla
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login({ email, password });
      navigate('/'); // Redirige al dashboard después del login exitoso
    } catch (error) {
      setError('Credenciales inválidas. Por favor, intenta de nuevo.');
    }
    setLoading(false);
  };

  return (
    <Paper elevation={3} sx={{ p: 4, maxWidth: 400, mx: 'auto', mt: 8 }}>
      <Box display="flex" flexDirection="column" alignItems="center" mb={3}>
        <Assignment sx={{ fontSize: 48, color: 'primary.main', mb: 2 }} />
        <Typography variant="h4" component="h1" gutterBottom>
          TaskNotes
        </Typography>
        <Typography variant="h6" color="textSecondary">
          Iniciar Sesión
        </Typography>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <form onSubmit={handleSubmit}>
        <TextField
          fullWidth
          label="Correo Electrónico"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          margin="normal"
          required
          disabled={loading}
        />
        <TextField
          fullWidth
          label="Contraseña"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          margin="normal"
          required
          disabled={loading}
        />
        <Button
          type="submit"
          fullWidth
          variant="contained"
          sx={{ mt: 3, mb: 2 }}
          disabled={loading}
        >
          {loading ? <CircularProgress size={24} /> : 'Iniciar Sesión'}
        </Button>
      </form>

      <Box textAlign="center">
        <Typography variant="body2">
          ¿No tienes una cuenta?{' '}
          <Link to="/register" style={{ textDecoration: 'none' }}>
            Regístrate aquí
          </Link>
        </Typography>
      </Box>
    </Paper>
  );
};

export default Login;