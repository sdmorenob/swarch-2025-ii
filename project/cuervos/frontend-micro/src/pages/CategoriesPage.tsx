/**
 * CategoriesPage
 * ------------------------------------------------------------
 * Página para la gestión completa de categorías
 * - CRUD completo: crear, leer, actualizar y eliminar categorías
 * - Selector de colores para personalización visual
 * - Modal de edición/creación con validación de formularios
 * - Grid responsivo para mostrar las categorías como cards
 * - Integración con API para persistencia de datos
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
  Snackbar,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  ColorLens as ColorIcon,
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import type { Category } from '../types';
import apiService from '../services/api';

const CategoriesPage: React.FC = () => {
  const { token } = useAuth();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    color: '#1976d2'
  });
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [successOpen, setSuccessOpen] = useState(false);

  const colors = [
    '#1976d2', '#dc004e', '#9c27b0', '#673ab7',
    '#3f51b5', '#2196f3', '#03a9f4', '#00bcd4',
    '#009688', '#4caf50', '#8bc34a', '#cddc39',
    '#ffeb3b', '#ffc107', '#ff9800', '#ff5722'
  ];

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const data = await apiService.getCategories();
      const normalized = Array.isArray(data)
        ? data
        : (data as any)?.items && Array.isArray((data as any).items)
          ? (data as any).items
          : (data as any)?.results && Array.isArray((data as any).results)
            ? (data as any).results
            : (data as any)?.categories && Array.isArray((data as any).categories)
              ? (data as any).categories
              : [];
      setCategories(normalized);
    } catch (err: any) {
      const status = err?.response?.status;
      if (status === 401) {
        setError('No autorizado. Inicia sesión para continuar.');
      } else {
        setError(err instanceof Error ? err.message : 'Error desconocido');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    try {
      const isUpdate = Boolean(editingCategory);
      if (isUpdate && editingCategory) {
        await apiService.updateCategory(editingCategory.id, {
          name: formData.name,
          description: formData.description || '',
          color: formData.color,
        });
      } else {
        await apiService.createCategory({
          name: formData.name,
          description: formData.description || '',
          color: formData.color,
        });
      }

      await fetchCategories();
      handleCloseDialog();
      setError(null);
      setSuccessMessage(isUpdate ? 'Categoría actualizada correctamente' : 'Categoría creada correctamente');
      setSuccessOpen(true);
    } catch (err: any) {
      const status = err?.response?.status;
      if (status === 409) {
        setError('Ya existe una categoría con ese nombre.');
      } else if (status === 401) {
        setError('No autorizado. Inicia sesión para continuar.');
      } else if (status === 422) {
        setError('Datos inválidos. Verifica nombre y color.');
      } else {
        setError(err instanceof Error ? err.message : 'Error desconocido');
      }
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('¿Estás seguro de que quieres eliminar esta categoría?')) {
      return;
    }

    try {
      await apiService.deleteCategory(id);
      await fetchCategories();
      setError(null);
      setSuccessMessage('Categoría eliminada correctamente');
      setSuccessOpen(true);
    } catch (err: any) {
      const status = err?.response?.status;
      if (status === 401) {
        setError('No autorizado. Inicia sesión para continuar.');
      } else {
        setError(err instanceof Error ? err.message : 'Error desconocido');
      }
    }
  };

  const handleOpenDialog = (category?: Category) => {
    if (category) {
      setEditingCategory(category);
      setFormData({
        name: category.name,
        description: category.description || '',
        color: category.color || '#1976d2'
      });
    } else {
      setEditingCategory(null);
      setFormData({
        name: '',
        description: '',
        color: '#1976d2'
      });
    }
    setOpenDialog(true);
    setError(null);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingCategory(null);
    setFormData({
      name: '',
      description: '',
      color: '#1976d2'
    });
  };

  const handleCloseSuccess = (_?: any, reason?: string) => {
    if (reason === 'clickaway') return;
    setSuccessOpen(false);
    setSuccessMessage(null);
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
              Gestión de Categorías
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Organiza tus tareas y notas por categorías
            </Typography>
          </div>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => handleOpenDialog()}
          >
            Nueva Categoría
          </Button>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}
        <Snackbar open={successOpen} autoHideDuration={3000} onClose={handleCloseSuccess}>
          <Alert onClose={handleCloseSuccess} severity="success" sx={{ width: '100%' }}>
            {successMessage}
          </Alert>
        </Snackbar>
      </Box>

      <Grid container spacing={3}>
        {categories.map((category) => (
          <Grid item xs={12} sm={6} md={4} key={category.id}>
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center" mb={2}>
                  <Box
                    width={20}
                    height={20}
                    borderRadius="50%"
                    bgcolor={category.color || '#1976d2'}
                    mr={1}
                  />
                  <Typography variant="h6" component="div">
                    {category.name}
                  </Typography>
                </Box>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  {category.description || 'Sin descripción'}
                </Typography>
              </CardContent>
              <CardActions>
                <Button
                  variant="outlined"
                  startIcon={<ColorIcon />}
                  onClick={() => handleOpenDialog(category)}
                >
                  Editar
                </Button>
                <IconButton color="error" onClick={() => handleDelete(category.id)}>
                  <DeleteIcon />
                </IconButton>
              </CardActions>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Dialog open={openDialog} onClose={handleCloseDialog} fullWidth maxWidth="sm">
        <DialogTitle>{editingCategory ? 'Editar Categoría' : 'Nueva Categoría'}</DialogTitle>
        <DialogContent>
          <Box display="flex" flexDirection="column" gap={2} mt={1}>
            <TextField
              label="Nombre"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              fullWidth
            />
            <TextField
              label="Descripción"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              fullWidth
              multiline
              minRows={2}
            />
            <Box>
              <Typography variant="subtitle2" gutterBottom>
                Color
              </Typography>
              <Box display="flex" flexWrap="wrap" gap={1}>
                {colors.map((color) => (
                  <Box
                    key={color}
                    width={28}
                    height={28}
                    borderRadius="50%"
                    bgcolor={color}
                    border={formData.color === color ? '2px solid #000' : '1px solid #ccc'}
                    sx={{ cursor: 'pointer' }}
                    onClick={() => setFormData({ ...formData, color })}
                  />
                ))}
              </Box>
            </Box>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancelar</Button>
          <Button variant="contained" onClick={handleSubmit} color="primary">
            {editingCategory ? 'Guardar Cambios' : 'Crear Categoría'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default CategoriesPage;