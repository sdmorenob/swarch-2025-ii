/**
 * TasksPage
 * ------------------------------------------------------------
 * Página principal para la gestión de tareas
 * - Muestra título y descripción de la sección
 * - Renderiza el componente TaskList que maneja toda la funcionalidad CRUD
 * - Layout responsivo con Container de Material-UI
 */
import React from 'react';
import {
  Container,
  Typography,
  Box,
} from '@mui/material';
import TaskList from '../components/TaskList';

const TasksPage: React.FC = () => {
  return (
    <Container maxWidth="xl">
      <Box mb={3}>
        <Typography variant="h4" gutterBottom>
          Gestión de Tareas
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Administra tus tareas y proyectos
        </Typography>
      </Box>
      
      <TaskList />
    </Container>
  );
};

export default TasksPage;