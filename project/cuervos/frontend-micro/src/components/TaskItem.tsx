/**
 * TaskItem
 * ------------------------------------------------------------
 * Tarjeta individual de tarea con edición inline opcional.
 * - Toggle de completado
 * - Edición de título, descripción, prioridad, categoría y etiquetas
 * - Normaliza due_date a YYYY-MM-DD para inputs tipo date
 */
import React, { useState, useRef, useEffect } from 'react';
import {
  Box,
  Typography,
  IconButton,
  Chip,
  TextField,
  FormControl,
  Select,
  MenuItem,
  Tooltip,
  Card,
  CardContent,
  CardActions,
  Collapse,
  InputLabel,
} from '@mui/material';
import {
  CheckCircle,
  RadioButtonUnchecked,
  Edit,
  Delete,
  Save,
  Cancel,
  ExpandMore,
  ExpandLess,
  CalendarToday,
  Flag,
  Label,
} from '@mui/icons-material';
import { apiService } from '../services/api';
import type { Task as TaskType, Category } from '../types';


interface TaskItemProps {
  task: TaskType;
  onUpdate: (task: TaskType) => void;
  onDelete: (taskId: string) => void;
  onEdit?: (task: TaskType) => void;
  categories: Category[];
  tags: { id: number | string; name: string; color?: string }[];
}

const TaskItem: React.FC<TaskItemProps> = ({ task, onUpdate, onDelete, onEdit, categories, tags }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const taskTags = (task.tags || []) as { id: number | string; name: string; color?: string }[];
  const [editData, setEditData] = useState({
    title: task.title,
    description: task.description || '',
    priority: task.priority,
    category: task.category?.name || '',
    tags: taskTags.map(tag => tag.name).join(', '),
    due_date: task.due_date ? new Date(task.due_date).toISOString().slice(0, 10) : '',
  });
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>(task.category?.id ? String(task.category.id) : '');
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>(taskTags.map(t => String(t.id)));
  
  const titleRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isEditing && titleRef.current) {
      titleRef.current.focus();
    }
  }, [isEditing]);

  const handleStartEdit = () => {
    if (onEdit) {
      onEdit(task);
    } else {
      setIsEditing(true);
      setIsExpanded(true);
    }
  };

  const handleSave = async () => {
    try {
      const category_id = selectedCategoryId && `${selectedCategoryId}`.trim() ? String(selectedCategoryId) : undefined;
      const tag_ids = (selectedTagIds || []).map(id => String(id));

      const taskUpdateData = {
        title: editData.title,
        description: editData.description,
        priority: editData.priority,
        category_id,
        tag_ids: tag_ids.length > 0 ? tag_ids : undefined,
        due_date: editData.due_date ? new Date(editData.due_date).toISOString() : undefined,
      };
      
      await apiService.updateTask(String(task.id), taskUpdateData);
      // Refrescar la tarea desde el servidor para obtener la estructura completa
      const updatedTask = await apiService.getTask(String(task.id));
      onUpdate(updatedTask);
      setIsEditing(false);
    } catch (error) {
      console.error('Error saving task:', error);
    }
  };

  const handleCancel = () => {
    setEditData({
      title: task.title,
      description: task.description || '',
      priority: task.priority,
      category: task.category?.name || '',
      tags: taskTags.map(tag => tag.name).join(', '),
      due_date: task.due_date || '',
    });
    setSelectedCategoryId(task.category?.id ? String(task.category.id) : '');
    setSelectedTagIds(taskTags.map(t => String(t.id)));
    setIsEditing(false);
  };

  const handleDelete = async () => {
    try {
      await apiService.deleteTask(String(task.id));
      onDelete(String(task.id));
    } catch (error) {
      console.error('Error deleting task:', error);
    }
  };

  return (
    <Card sx={{ mb: 2 }}>
      <CardContent>
        <Box display="flex" alignItems="center" gap={2}>
          <Box flex={1}>
            <Box display="flex" alignItems="center" gap={1}>
              <IconButton
                size="small"
                color={task.completed ? 'success' : 'default'}
                onClick={async () => {
                  try {
                    const updated = await apiService.updateTask(String(task.id), { completed: !task.completed });
                    onUpdate(updated);
                  } catch (error) {
                    console.error('Error updating task completion:', error);
                  }
                }}
              >
                {task.completed ? <CheckCircle /> : <RadioButtonUnchecked />}
              </IconButton>

              {isEditing ? (
                <TextField
                  inputRef={titleRef}
                  fullWidth
                  label="Título"
                  value={editData.title}
                  onChange={(e) => setEditData({ ...editData, title: e.target.value })}
                  size="small"
                />
              ) : (
                <Typography variant="h6">{task.title}</Typography>
              )}
            </Box>

            <Box display="flex" alignItems="center" gap={1} mt={1}>
              <Tooltip title="Prioridad">
                <Flag fontSize="small" />
              </Tooltip>
              <Typography variant="body2" color="textSecondary">
                {task.priority}
              </Typography>

              {task.category && (
                <>
                  <Tooltip title="Categoría">
                    <Label fontSize="small" />
                  </Tooltip>
                  <Chip
                    label={task.category.name}
                    size="small"
                    variant="outlined"
                    sx={{ ml: 1, backgroundColor: task.category.color ? `${task.category.color}20` : undefined, borderColor: task.category.color || undefined, color: task.category.color || undefined }}
                  />
                </>
              )}
              
              {task.due_date && (
                <>
                  <Tooltip title="Vencimiento">
                    <CalendarToday fontSize="small" />
                  </Tooltip>
                  <Typography variant="body2" color="textSecondary">
                    {new Date(task.due_date).toLocaleDateString()}
                  </Typography>
                </>
              )}
            </Box>

            {(taskTags || []).length > 0 && (
              <Box display="flex" gap={0.5} mt={1} flexWrap="wrap">
                {(taskTags || []).map((tag, index) => (
                  <Chip
                    key={index}
                    label={`#${tag.name}`}
                    size="small"
                    variant="outlined"
                    sx={{ 
                      mr: 0.5, 
                      mb: 0.5,
                      backgroundColor: tag.color ? `${tag.color}20` : undefined,
                      borderColor: tag.color || undefined,
                      color: tag.color || undefined,
                    }}
                  />
                ))}
              </Box>
            )}
          </Box>

          <Box display="flex" flexDirection="column" gap={0.5}>
            {!isEditing && (
              <>
                <Tooltip title="Editar">
                  <IconButton onClick={handleStartEdit} size="small" color="primary">
                    <Edit />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Eliminar">
                  <IconButton onClick={handleDelete} size="small" color="error">
                    <Delete />
                  </IconButton>
                </Tooltip>
              </>
            )}
            
            {task.description && (
              <Tooltip title={isExpanded ? "Contraer" : "Expandir"}>
                <IconButton 
                  onClick={() => setIsExpanded(!isExpanded)} 
                  size="small"
                >
                  {isExpanded ? <ExpandLess /> : <ExpandMore />}
                </IconButton>
              </Tooltip>
            )}
          </Box>
        </Box>

        <Collapse in={isExpanded || isEditing}>
          <Box mt={2}>
            {isEditing ? (
              <Box>
                <TextField
                  fullWidth
                  label="Descripción"
                  value={editData.description}
                  onChange={(e) => setEditData({ ...editData, description: e.target.value })}
                  multiline
                  rows={3}
                  sx={{ mb: 2 }}
                />
                
                <Box display="flex" gap={2} mb={2}>
                  <FormControl size="small" sx={{ minWidth: 140 }}>
                    <InputLabel>Prioridad</InputLabel>
                    <Select
                      value={editData.priority}
                      label="Prioridad"
                      onChange={(e) => setEditData({ ...editData, priority: e.target.value as any })}
                    >
                      <MenuItem value="low">🟢 Baja</MenuItem>
                      <MenuItem value="medium">🟡 Media</MenuItem>
                      <MenuItem value="high">🔴 Alta</MenuItem>
                    </Select>
                  </FormControl>

                  <FormControl size="small" sx={{ flex: 1 }}>
                    <InputLabel>Categoría</InputLabel>
                    <Select
                      value={selectedCategoryId}
                      label="Categoría"
                      onChange={(e) => setSelectedCategoryId(String(e.target.value))}
                    >
                      <MenuItem value="">Sin categoría</MenuItem>
                      {categories.map((cat) => (
                        <MenuItem key={cat.id} value={String(cat.id)}>{cat.name}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Box>
                
                <Box display="flex" gap={2} mb={2}>
                  <FormControl size="small" sx={{ flex: 1 }}>
                    <InputLabel>Etiquetas</InputLabel>
                    <Select
                      multiple
                      value={selectedTagIds}
                      label="Etiquetas"
                      onChange={(e) => {
                        const value = e.target.value as unknown as (string | number)[];
                        setSelectedTagIds(value.map(v => String(v)));
                      }}
                      renderValue={(selected) => (
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                          {(selected as string[]).map((tagId) => {
                          const tag = tags.find(t => String(t.id) === String(tagId));
                          return tag ? <Chip key={tagId} label={tag.name} size="small" /> : null;
                          })}
                        </Box>
                      )}
                    >
                      {tags.map((tag) => (
                        <MenuItem key={tag.id} value={String(tag.id)}>{tag.name}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>

                  <TextField
                    label="Fecha de vencimiento"
                    type="date"
                    value={editData.due_date}
                    onChange={(e) => setEditData({ ...editData, due_date: e.target.value })}
                    size="small"
                    InputLabelProps={{ shrink: true }}
                  />
                </Box>
              </Box>
            ) : (
              task.description && (
                <Typography variant="body2" color="textSecondary">
                  {task.description}
                </Typography>
              )
            )}
          </Box>
        </Collapse>
      </CardContent>

      {isEditing && (
        <CardActions sx={{ justifyContent: 'flex-end', pt: 0 }}>
          <IconButton onClick={handleCancel} color="default">
            <Cancel />
          </IconButton>
          <IconButton onClick={handleSave} color="primary">
            <Save />
          </IconButton>
        </CardActions>
      )}
    </Card>
  );
};

export default TaskItem;