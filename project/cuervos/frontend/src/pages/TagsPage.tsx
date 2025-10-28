/**
 * TagsPage
 * ------------------------------------------------------------
 * Página para la gestión completa de etiquetas (tags)
 * - CRUD completo: crear, leer, actualizar y eliminar etiquetas
 * - Selector de colores para personalización visual
 * - Modal de edición/creación con validación de formularios
 * - Grid responsivo para mostrar las etiquetas como cards
 * - Integración con API para persistencia de datos
 * - Similar a CategoriesPage pero para etiquetas
 */
import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Paper,
  Box,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Grid,
  Card,
  CardContent,
  CardActions,
  IconButton,
  Chip,
  Alert,
  CircularProgress,
  Stack,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Label as LabelIcon,
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import type { Tag } from '../types';

const TagsPage: React.FC = () => {
  const { token } = useAuth();
  const [tags, setTags] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingTag, setEditingTag] = useState<Tag | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    color: '#1976d2'
  });

  const colors = [
    '#1976d2', '#dc004e', '#9c27b0', '#673ab7',
    '#3f51b5', '#2196f3', '#03a9f4', '#00bcd4',
    '#009688', '#4caf50', '#8bc34a', '#cddc39',
    '#ffeb3b', '#ffc107', '#ff9800', '#ff5722'
  ];

  useEffect(() => {
    fetchTags();
  }, []);

  const fetchTags = async () => {
    try {
      setLoading(true);
      const response = await fetch('http://localhost:8000/api/v1/tags/', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new (Error as any)('Error al cargar etiquetas');
      }

      const data = await response.json();
      setTags(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    try {
        const url = editingTag 
          ? `http://localhost:8000/api/v1/tags/${editingTag.id}` 
          : 'http://localhost:8000/api/v1/tags/';
        
        const method = editingTag ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: formData.name,
          color: formData.color,
          description: formData.description || undefined,
        }),
      });

      if (!response.ok) {
        throw new (Error as any)('Error al guardar etiqueta');
      }

      await fetchTags();
      handleCloseDialog();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('¿Estás seguro de que quieres eliminar esta etiqueta?')) {
      return;
    }

    try {
      const response = await fetch(`http://localhost:8000/api/v1/tags/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new (Error as any)('Error al eliminar etiqueta');
      }

      await fetchTags();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
    }
  };

  const handleOpenDialog = (tag?: Tag) => {
    if (tag) {
      setEditingTag(tag);
      setFormData({
        name: tag.name,
        description: tag.description || '',
        color: tag.color || '#1976d2'
      });
    } else {
      setEditingTag(null);
      setFormData({
        name: '',
        description: '',
        color: '#1976d2'
      });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingTag(null);
    setFormData({
      name: '',
      description: '',
      color: '#1976d2'
    });
  };

  if (loading) {
    return (
      <Container maxWidth="lg">
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg">
      <Box mb={3}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <div>
            <Typography variant="h4" gutterBottom>
              Gestión de Etiquetas
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Crea y administra etiquetas para organizar tu contenido
            </Typography>
          </div>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => handleOpenDialog()}
          >
            Nueva Etiqueta
          </Button>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}
      </Box>

      {/* Vista de etiquetas como chips */}
      <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Todas las Etiquetas
        </Typography>
        <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
          {tags.map((tag) => (
            <Chip
              key={tag.id}
              label={`${tag.name} (${tag.notes_count || 0})`}
              icon={<LabelIcon />}
              sx={{
                backgroundColor: tag.color || '#1976d2',
                color: 'white',
                mb: 1,
                '& .MuiChip-icon': {
                  color: 'white'
                }
              }}
              onClick={() => handleOpenDialog(tag)}
            />
          ))}
        </Stack>
      </Paper>

      {/* Vista de tarjetas detallada */}
      <Grid container spacing={3}>
        {tags.map((tag) => (
          <Grid item xs={12} sm={6} md={4} key={tag.id}>
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center" mb={2}>
                  <LabelIcon 
                    sx={{ 
                      color: tag.color || '#1976d2',
                      mr: 1 
                    }} 
                  />
                  <Typography variant="h6" component="div">
                    {tag.name}
                  </Typography>
                </Box>
                {tag.description && (
                  <Typography variant="body2" color="text.secondary" mb={2}>
                    {tag.description}
                  </Typography>
                )}
                <Box display="flex" justifyContent="flex-end" alignItems="center">
                  <Box
                    width={24}
                    height={24}
                    borderRadius="4px"
                    bgcolor={tag.color || '#1976d2'}
                    border="1px solid #ccc"
                  />
                </Box>
              </CardContent>
              <CardActions>
                <IconButton
                  size="small"
                  onClick={() => handleOpenDialog(tag)}
                  color="primary"
                >
                  <EditIcon />
                </IconButton>
                <IconButton
                  size="small"
                  onClick={() => handleDelete(tag.id)}
                  color="error"
                >
                  <DeleteIcon />
                </IconButton>
              </CardActions>
            </Card>
          </Grid>
        ))}
      </Grid>

      {tags.length === 0 && !loading && (
        <Paper elevation={3} sx={{ p: 4, textAlign: 'center' }}>
          <Typography variant="h6" gutterBottom>
            No hay etiquetas creadas
          </Typography>
          <Typography variant="body1" color="text.secondary" mb={2}>
            Crea tu primera etiqueta para organizar tus notas
          </Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => handleOpenDialog()}
          >
            Crear Etiqueta
          </Button>
        </Paper>
      )}

      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          {editingTag ? 'Editar Etiqueta' : 'Nueva Etiqueta'}
        </DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Nombre"
            fullWidth
            variant="outlined"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            sx={{ mb: 2 }}
          />
          <TextField
            margin="dense"
            label="Descripción"
            fullWidth
            multiline
            rows={3}
            variant="outlined"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            sx={{ mb: 2 }}
          />
          <Typography variant="subtitle2" gutterBottom>
            Color
          </Typography>
          <Box display="flex" flexWrap="wrap" gap={1}>
            {colors.map((color) => (
              <Box
                key={color}
                width={32}
                height={32}
                borderRadius="4px"
                bgcolor={color}
                border={formData.color === color ? '3px solid #000' : '1px solid #ccc'}
                sx={{ cursor: 'pointer' }}
                onClick={() => setFormData({ ...formData, color })}
              />
            ))}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancelar</Button>
          <Button onClick={handleSubmit} variant="contained">
            {editingTag ? 'Actualizar' : 'Crear'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default TagsPage;