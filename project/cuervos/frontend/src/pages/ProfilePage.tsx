/**
 * ProfilePage
 * ------------------------------------------------------------
 * Página de perfil del usuario
 * - Muestra información personal del usuario autenticado
 * - Avatar generado con la primera letra del nombre
 * - Información de solo lectura: nombre, email, estado y fecha de registro
 * - Layout centrado con Paper de Material-UI para mejor presentación
 */
import React from 'react';
import {
  Container,
  Paper,
  Typography,
  Box,
  Avatar,
  Divider,
} from '@mui/material';
import { useAuth } from '../contexts/AuthContext';

const ProfilePage: React.FC = () => {
  const { user } = useAuth();

  return (
    <Container maxWidth="md">
      <Paper elevation={3} sx={{ p: 4 }}>
        <Box display="flex" alignItems="center" mb={3}>
          <Avatar sx={{ width: 80, height: 80, mr: 3, fontSize: '2rem' }}>
            {user?.name?.charAt(0) || user?.full_name?.charAt(0) || 'U'}
          </Avatar>
          <Box>
            <Typography variant="h4" gutterBottom>
              Perfil de Usuario
            </Typography>
            <Typography variant="h6" color="text.secondary">
              {user?.name || user?.full_name || 'Usuario'}
            </Typography>
          </Box>
        </Box>
        
        <Divider sx={{ my: 3 }} />
        
        <Box>
          <Typography variant="h6" gutterBottom>
            Información Personal
          </Typography>
          <Typography variant="body1" paragraph>
            <strong>Nombre:</strong> {user?.name || user?.full_name || 'No disponible'}
          </Typography>
          <Typography variant="body1" paragraph>
            <strong>Email:</strong> {user?.email || 'No disponible'}
          </Typography>
          <Typography variant="body1" paragraph>
            <strong>Estado:</strong> {user?.is_active ? 'Activo' : 'Inactivo'}
          </Typography>
          <Typography variant="body1" paragraph>
            <strong>Fecha de registro:</strong> {user?.created_at ? new Date(user.created_at).toLocaleDateString() : 'No disponible'}
          </Typography>
        </Box>
      </Paper>
    </Container>
  );
};

export default ProfilePage;