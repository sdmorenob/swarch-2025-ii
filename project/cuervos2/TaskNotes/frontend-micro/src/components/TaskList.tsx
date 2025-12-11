/**
 * TaskList
 * ------------------------------------------------------------
 * Lista, filtra y ordena tareas. Crea/edita vía diálogo.
 * - Consume categorías y etiquetas para selects
 * - Sincroniza con tiempo real (SocketContext)
 * - Normaliza IDs como string (category_id/tag_ids)
 */
import React, { useState, useEffect, useMemo } from 'react';
import {
  Box,
  Typography,
  Button,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Chip,
  Tab,
  Tabs,
  Grid,
  Container,
  Paper,
  IconButton,
  Tooltip,
  Switch,
  FormControlLabel,
  Fab,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import type { SelectChangeEvent } from '@mui/material';
import {
  Add as AddIcon,
  Search as SearchIcon,
  FilterList as FilterIcon,
  Sort as SortIcon,
  ViewList as ViewListIcon,
  ViewModule as ViewModuleIcon
} from '@mui/icons-material';
import { apiService } from '../services/api';
import { useSocket } from '../contexts/SocketContext';
import TaskItem from './TaskItem';
import type { Category, Tag, Task as TaskType } from '../types';


const TaskList: React.FC = () => {
  const [tasks, setTasks] = useState<TaskType[]>([]);
  const [filteredTasks, setFilteredTasks] = useState<TaskType[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [open, setOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<TaskType | null>(null);
  const [currentTab, setCurrentTab] = useState(0);
  const [sortBy, setSortBy] = useState('created_at');
  const [filterPriority, setFilterPriority] = useState('all');
  const [filterCategory, setFilterCategory] = useState('all');
  const [showCompleted, setShowCompleted] = useState(true);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    priority: 'medium' as 'low' | 'medium' | 'high',
    category_id: '',
    tag_ids: [] as string[],
    due_date: '',
  });
  const socketCtx = useSocket();

  useEffect(() => {
    fetchTasks();
    fetchCategories();
    fetchTags();
  }, []);

  useEffect(() => {
    const handleUpdated = (updatedTask: TaskType) => {
      setTasks(prev => prev.map(task => (task.id === updatedTask.id ? updatedTask : task)));
    };
    const handleCreated = (newTask: TaskType) => {
      setTasks(prev => [...prev, newTask]);
    };
    const handleDeleted = (taskId: string) => {
      setTasks(prev => prev.filter(task => String(task.id) !== String(taskId)));
    };

    socketCtx.on('task_updated', handleUpdated as any);
    socketCtx.on('task_created', handleCreated as any);
    socketCtx.on('task_deleted', handleDeleted as any);

    return () => {
      socketCtx.off('task_updated', handleUpdated as any);
      socketCtx.off('task_created', handleCreated as any);
      socketCtx.off('task_deleted', handleDeleted as any);
    };
  }, [socketCtx]);

  useEffect(() => {
    let filtered = [...tasks];

    // Filtrar por completado
    if (!showCompleted) {
      filtered = filtered.filter(task => !task.completed);
    }

    // Filtrar por tab
    if (currentTab === 1) { // Pendientes
      filtered = filtered.filter(task => !task.completed);
    } else if (currentTab === 2) { // Completadas
      filtered = filtered.filter(task => task.completed);
    } else if (currentTab === 3) { // Vencidas
      const now = new Date();
      filtered = filtered.filter(task => 
        task.due_date && new Date(task.due_date) < now && !task.completed
      );
    }

    // Filtrar por prioridad
    if (filterPriority !== 'all') {
      filtered = filtered.filter(task => task.priority === filterPriority);
    }

    // Filtrar por categoría
    if (filterCategory !== 'all') {
      filtered = filtered.filter(task => task.category?.name === filterCategory);
    }

    // Ordenar
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'title':
          return a.title.localeCompare(b.title);
        case 'priority':
          const priorityOrder = { high: 3, medium: 2, low: 1 };
          return priorityOrder[b.priority] - priorityOrder[a.priority];
        case 'due_date':
          if (!a.due_date && !b.due_date) return 0;
          if (!a.due_date) return 1;
          if (!b.due_date) return -1;
          return new Date(a.due_date).getTime() - new Date(b.due_date).getTime();
        case 'created_at':
        default:
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      }
    });

    setFilteredTasks(filtered);
  }, [tasks, currentTab, sortBy, filterPriority, filterCategory, showCompleted]);

  const fetchTasks = async () => {
    try {
      const response = await apiService.getTasks(1, 100); // Obtener hasta 100 tareas por ahora
      setTasks(response.items || []);
    } catch (error) {
      console.error('Error fetching tasks:', error);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await apiService.getCategories();
      setCategories(response);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const fetchTags = async () => {
    try {
      const response = await apiService.getTags();
      setTags(response);
    } catch (error) {
      console.error('Error fetching tags:', error);
    }
  };

  const handleSubmit = async () => {
    try {
      const taskData = {
        title: formData.title,
        description: formData.description,
        priority: formData.priority,
        category_id: formData.category_id || undefined,
        tag_ids: formData.tag_ids.length > 0 ? formData.tag_ids : undefined,
        due_date: formData.due_date ? new Date(formData.due_date).toISOString() : undefined,
      };

      if (editingTask) {
        await apiService.updateTask(String(editingTask.id), taskData);
      } else {
        await apiService.createTask(taskData);
      }

      setOpen(false);
      setEditingTask(null);
      setFormData({
        title: '',
        description: '',
        priority: 'medium',
        category_id: '',
        tag_ids: [],
        due_date: '',
      });
      fetchTasks();
    } catch (error) {
      console.error('Error saving task:', error);
    }
  };

  const handleTaskUpdate = (updatedTask: TaskType) => {
    setTasks(prev => 
      prev.map(task => 
        task.id === updatedTask.id ? updatedTask : task
      )
    );
  };

  const handleTaskDelete = (taskId: string) => {
    setTasks(prev => prev.filter(task => String(task.id) !== String(taskId)));
  };

  const handleEdit = (task: TaskType) => {
    const taskTags = (task.tags || []) as { id: number | string; name: string }[];
    setEditingTask(task);
    setFormData({
      title: task.title,
      description: task.description || '',
      priority: task.priority,
      category_id: task.category ? String(task.category.id) : '',
      tag_ids: taskTags.map(tag => String(tag.id)),
      due_date: task.due_date ? new Date(task.due_date).toISOString().slice(0, 10) : '',
    });
    setOpen(true);
  };

  const getUniqueCategories = () => {
    const categories = tasks.map(task => task.category?.name).filter(Boolean);
    return [...new Set(categories)];
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'error';
      case 'medium': return 'warning';
      case 'low': return 'success';
      default: return 'default';
    }
  };

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" component="h1">
          Mis Tareas
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setOpen(true)}
        >
          Nueva Tarea
        </Button>
      </Box>

      <Box sx={{ mb: 3, display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
        <FormControl size="small" sx={{ minWidth: 120 }}>
          <InputLabel>Ordenar por</InputLabel>
          <Select
            value={sortBy}
            label="Ordenar por"
            onChange={(e) => setSortBy(e.target.value)}
          >
            <MenuItem value="created_at">Fecha creación</MenuItem>
            <MenuItem value="title">Título</MenuItem>
            <MenuItem value="priority">Prioridad</MenuItem>
            <MenuItem value="due_date">Fecha vencimiento</MenuItem>
          </Select>
        </FormControl>

        <FormControl size="small" sx={{ minWidth: 120 }}>
          <InputLabel>Prioridad</InputLabel>
          <Select
            value={filterPriority}
            label="Prioridad"
            onChange={(e) => setFilterPriority(e.target.value)}
          >
            <MenuItem value="all">Todas</MenuItem>
            <MenuItem value="high">Alta</MenuItem>
            <MenuItem value="medium">Media</MenuItem>
            <MenuItem value="low">Baja</MenuItem>
          </Select>
        </FormControl>

        <FormControl size="small" sx={{ minWidth: 120 }}>
          <InputLabel>Categoría</InputLabel>
          <Select
            value={filterCategory}
            label="Categoría"
            onChange={(e) => setFilterCategory(e.target.value)}
          >
            <MenuItem value="all">Todas</MenuItem>
            {getUniqueCategories().map(category => (
              <MenuItem key={category} value={category}>{category}</MenuItem>
            ))}
          </Select>
        </FormControl>

        <FormControlLabel
          control={
            <Switch
              checked={showCompleted}
              onChange={(e) => setShowCompleted(e.target.checked)}
            />
          }
          label="Mostrar completadas"
        />
      </Box>

      <Tabs value={currentTab} onChange={(e, newValue) => setCurrentTab(newValue)} sx={{ mb: 3 }}>
        <Tab label={`Todas (${tasks.length})`} />
        <Tab label={`Pendientes (${tasks.filter(t => !t.completed).length})`} />
        <Tab label={`Completadas (${tasks.filter(t => t.completed).length})`} />
        <Tab label={`Vencidas (${tasks.filter(t => t.due_date && new Date(t.due_date) < new Date() && !t.completed).length})`} />
      </Tabs>

      <Grid container spacing={3}>
         {(Array.isArray(filteredTasks) ? filteredTasks : []).map((task) => (
           <Grid item xs={12} md={6} lg={4} key={task.id}>
             <TaskItem
               task={task}
               onUpdate={handleTaskUpdate}
               onDelete={handleTaskDelete}
               onEdit={handleEdit}
               categories={categories}
               tags={tags}
             />
           </Grid>
         ))}
       </Grid>

      {filteredTasks.length === 0 && (
        <Box sx={{ textAlign: 'center', mt: 4 }}>
          <Typography variant="h6" color="text.secondary">
            No hay tareas que mostrar
          </Typography>
        </Box>
      )}

      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          {editingTask ? 'Editar Tarea' : 'Nueva Tarea'}
        </DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="Título"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            margin="normal"
            required
          />
          <TextField
            fullWidth
            label="Descripción"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            margin="normal"
            multiline
            rows={3}
          />
          <FormControl fullWidth margin="normal">
            <InputLabel>Prioridad</InputLabel>
            <Select
              value={formData.priority}
              onChange={(e) => setFormData({ ...formData, priority: e.target.value as any })}
            >
              <MenuItem value="low">Baja</MenuItem>
              <MenuItem value="medium">Media</MenuItem>
              <MenuItem value="high">Alta</MenuItem>
            </Select>
          </FormControl>
          <FormControl fullWidth margin="normal">
            <InputLabel>Categoría</InputLabel>
            <Select
              value={formData.category_id}
              onChange={(e) => setFormData({ ...formData, category_id: String(e.target.value) })}
            >
              <MenuItem value="">Sin categoría</MenuItem>
              {(Array.isArray(categories) ? categories : []).map((category) => (
                <MenuItem key={category.id} value={String(category.id)}>
                  {category.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControl fullWidth margin="normal">
            <InputLabel>Etiquetas</InputLabel>
            <Select
              multiple
              value={formData.tag_ids}
              onChange={(e) => {
                const value = e.target.value as unknown as (string | number)[];
                setFormData({ ...formData, tag_ids: value.map(v => String(v)) });
              }}
              renderValue={(selected) => (
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                  {(Array.isArray(selected) ? (selected as string[]) : []).map((tagId) => {
                    const tag = tags.find(t => String(t.id) === String(tagId));
                    return tag ? (
                      <Chip key={tagId} label={tag.name} size="small" />
                    ) : null;
                  })}
                </Box>
              )}
            >
              {(Array.isArray(tags) ? tags : []).map((tag) => (
                <MenuItem key={tag.id} value={String(tag.id)}>
                  {tag.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <TextField
            fullWidth
            label="Fecha de vencimiento"
            type="date"
            value={formData.due_date}
            onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
            margin="normal"
            InputLabelProps={{ shrink: true }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>Cancelar</Button>
          <Button onClick={handleSubmit} variant="contained">
            {editingTask ? 'Actualizar' : 'Crear'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default TaskList;