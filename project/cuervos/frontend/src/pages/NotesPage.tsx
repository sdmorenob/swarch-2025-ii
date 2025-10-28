/**
 * NotesPage
 * ------------------------------------------------------------
 * Página principal para la gestión de notas
 * - Muestra título y descripción de la sección
 * - Renderiza el componente NoteList que maneja toda la funcionalidad CRUD
 * - Layout responsivo con Container de Material-UI
 */
import React from 'react';
import {
  Container,
  Typography,
  Box,
} from '@mui/material';
import NoteList from '../components/NoteList';

const NotesPage: React.FC = () => {
  return (
    <Container maxWidth="xl">
      <Box mb={3}>
        <Typography variant="h4" gutterBottom>
          Gestión de Notas
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Crea y organiza tus notas
        </Typography>
      </Box>
      
      <NoteList />
    </Container>
  );
};

export default NotesPage;