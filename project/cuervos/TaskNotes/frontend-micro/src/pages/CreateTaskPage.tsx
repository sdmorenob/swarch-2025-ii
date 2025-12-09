import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Autocomplete,
  Grid,
  Alert,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { apiService } from '../services/api';
import { TaskCreate, Category, Tag } from '../types';

const CreateTaskPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [categories, setCategories] = useState<Category[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [formData, setFormData] = useState<TaskCreate>({
    title: '',
    description: '',
    priority: 'medium',
    category_id: '',
    tag_ids: [],
    due_date: undefined,
  });

  useEffect(() => {
    fetchCategories();
    fetchTags();
  }, []);

  const fetchCategories = async () => {
    try {
      const response = await apiService.getCategories();
      const normalized = Array.isArray(response)
        ? response
        : (response as any)?.items && Array.isArray((response as any).items)
          ? (response as any).items
          : (response as any)?.results && Array.isArray((response as any).results)
            ? (response as any).results
            : (response as any)?.categories && Array.isArray((response as any).categories)
              ? (response as any).categories
              : [];
      setCategories(normalized);
    } catch (error) {
      console.error('Error fetching categories:', error);
      setCategories([]);
    }
  };

  const fetchTags = async () => {
    try {
      const response = await apiService.getTags();
      const normalized = Array.isArray(response)
        ? response
        : (response as any)?.items && Array.isArray((response as any).items)
          ? (response as any).items
          : (response as any)?.results && Array.isArray((response as any).results)
            ? (response as any).results
            : (response as any)?.tags && Array.isArray((response as any).tags)
              ? (response as any).tags
              : [];
      setTags(normalized);
    } catch (error) {
      console.error('Error fetching tags:', error);
      setTags([]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Normalizar payload para el backend
      const payload: TaskCreate = {
        title: formData.title,
        description: formData.description || '',
        priority: formData.priority,
        category_id: formData.category_id && `${formData.category_id}`.trim() ? `${formData.category_id}` : undefined,
        tag_ids: (Array.isArray(formData.tag_ids) ? formData.tag_ids : []).map((t) => `${t}`),
        due_date: formData.due_date ? new Date(formData.due_date).toISOString() : undefined,
      };

      await apiService.createTask(payload);
      navigate('/dashboard');
    } catch (err: any) {
      // Asegurar que mostramos texto y no un objeto para evitar errores de React
      const detail = err?.response?.data?.detail;
      let message = 'Error al crear la tarea';
      if (typeof detail === 'string') {
        message = detail;
      } else if (Array.isArray(detail)) {
        // Pydantic errors array
        message = detail.map((d: any) => d?.msg || JSON.stringify(d)).join(' | ');
      } else if (detail && typeof detail === 'object') {
        message = detail.msg || JSON.stringify(detail);
      }
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: keyof TaskCreate, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const priorityOptions = [
    { value: 'low', label: 'Baja' },
    { value: 'medium', label: 'Media' },
    { value: 'high', label: 'Alta' },
  ];


  return (
    <Box sx={{ maxWidth: 800, mx: 'auto', p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Crear Nueva Tarea
      </Typography>
      
      <Card>
        <CardContent>
          <form onSubmit={handleSubmit}>
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Título"
                  value={formData.title}
                  onChange={(e) => handleInputChange('title', e.target.value)}
                  required
                  disabled={loading}
                />
              </Grid>

              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Descripción"
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  multiline
                  rows={4}
                  disabled={loading}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel>Prioridad</InputLabel>
                  <Select
                    value={formData.priority}
                    onChange={(e) => handleInputChange('priority', e.target.value)}
                    label="Prioridad"
                    disabled={loading}
                  >
                    {priorityOptions.map((option) => (
                      <MenuItem key={option.value} value={option.value}>
                        {option.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel>Categoría</InputLabel>
                  <Select
                    value={formData.category_id}
                    onChange={(e) => handleInputChange('category_id', e.target.value)}
                    label="Categoría"
                    disabled={loading}
                  >
                    <MenuItem value="">Sin categoría</MenuItem>
                    {(Array.isArray(categories) ? categories : []).map((category) => (
                      <MenuItem key={category.id} value={category.id}>
                        {category.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12}>
                <FormControl fullWidth>
                  <InputLabel>Etiquetas</InputLabel>
                  <Select
                    multiple
                    value={Array.isArray(formData.tag_ids) ? formData.tag_ids : []}
                    onChange={(e) => handleInputChange('tag_ids', e.target.value as string[])}
                    label="Etiquetas"
                    disabled={loading}
                    renderValue={(selected) => (
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                        {((Array.isArray(selected) ? selected : []) as string[]).map((tagId) => {
                          const tag = (Array.isArray(tags) ? tags : []).find(t => String(t.id) === String(tagId));
                          return tag ? (
                            <Chip key={tagId} label={tag.name} size="small" />
                          ) : null;
                        })}
                      </Box>
                    )}
                  >
                    {(Array.isArray(tags) ? tags : []).map((tag) => (
                      <MenuItem key={tag.id} value={tag.id}>
                        {tag.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Fecha de vencimiento"
                  type="datetime-local"
                  value={formData.due_date ? new Date(formData.due_date).toISOString().slice(0, 16) : ''}
                  onChange={(e) => handleInputChange('due_date', e.target.value ? new Date(e.target.value).toISOString() : undefined)}
                  InputLabelProps={{
                    shrink: true,
                  }}
                  disabled={loading}
                />
              </Grid>

              {error && (
                <Grid item xs={12}>
                  <Alert severity="error">{error}</Alert>
                </Grid>
              )}

              <Grid item xs={12}>
                <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
                  <Button
                    variant="outlined"
                    onClick={() => navigate('/dashboard')}
                    disabled={loading}
                  >
                    Cancelar
                  </Button>
                  <Button
                    type="submit"
                    variant="contained"
                    disabled={loading || !formData.title}
                  >
                    {loading ? 'Creando...' : 'Crear Tarea'}
                  </Button>
                </Box>
              </Grid>
            </Grid>
          </form>
        </CardContent>
      </Card>
    </Box>
  );
};

export default CreateTaskPage;
