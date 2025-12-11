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

const Register: React.FC = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Las contraseñas no coinciden.');
      return;
    }

    if (password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres.');
      return;
    }

    setLoading(true);
    try {
      await register({ name, email, password });
      navigate('/');
    } catch (error) {
      setError('Error al crear la cuenta. Por favor, intenta de nuevo.');
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
          Crear Cuenta
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
          label="Nombre Completo"
          value={name}
          onChange={(e) => setName(e.target.value)}
          margin="normal"
          required
          disabled={loading}
        />
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
        <TextField
          fullWidth
          label="Confirmar Contraseña"
          type="password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
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
          {loading ? <CircularProgress size={24} /> : 'Crear Cuenta'}
        </Button>
      </form>

      <Box textAlign="center">
        <Typography variant="body2">
          ¿Ya tienes una cuenta?{' '}
          <Link to="/login" style={{ textDecoration: 'none' }}>
            Inicia sesión aquí
          </Link>
        </Typography>
      </Box>
    </Paper>
  );
};

export default Register;