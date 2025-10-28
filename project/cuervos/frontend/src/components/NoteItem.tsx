/**
 * NoteItem
 * ------------------------------------------------------------
 * Tarjeta individual de nota con edición inline.
 * - Carga categorías/etiquetas para selects al entrar en edición
 * - Actualiza nota y refresca desde servidor para expandir category/tags
 */
import React, { useState, useRef, useEffect } from 'react';
import {
  Box,
  Typography,
  IconButton,
  Chip,
  TextField,
  Tooltip,
  Card,
  CardContent,
  CardActions,
  Collapse,
  FormControl,
  Select,
  MenuItem,
  InputLabel,
} from '@mui/material';
import {
  Edit,
  Delete,
  Save,
  Cancel,
  ExpandMore,
  ExpandLess,
  Label,
  Schedule,
} from '@mui/icons-material';
import { apiService } from '../services/api';
import type { Note, Category, Tag } from '../types';

interface NoteItemProps {
  note: Note;
  onUpdate: (note: Note) => void;
  onDelete: (noteId: string) => void;
}

const NoteItem: React.FC<NoteItemProps> = ({ note, onUpdate, onDelete }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [editData, setEditData] = useState({
    title: note.title,
    content: note.content,
    category: note.category?.name || '',
    tags: (note.tags || []).map(tag => tag.name).join(', '),
  });
  const [categories, setCategories] = useState<Category[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>(note.category?.id ? String(note.category.id) : '');
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>((note.tags || []).map(t => String(t.id)));
  
  const titleRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isEditing && titleRef.current) {
      titleRef.current.focus();
    }
  }, [isEditing]);

  useEffect(() => {
    const loadMeta = async () => {
      try {
        const [cats, tgs] = await Promise.all([
          apiService.getCategories(),
          apiService.getTags(),
        ]);
        setCategories(cats);
        setTags(tgs);
      } catch (e) {
        console.error('Error loading categories/tags for note:', e);
      }
    };
    loadMeta();
  }, []);

  const handleStartEdit = () => {
    setIsEditing(true);
    setIsExpanded(true);
  };

  const handleSave = async () => {
    try {
      const noteUpdateData = {
        title: editData.title,
        content: editData.content,
        category_id: selectedCategoryId && `${selectedCategoryId}`.trim() ? String(selectedCategoryId) : undefined,
        tag_ids: (selectedTagIds || []).map(id => String(id)),
      };
      
      await apiService.updateNote(note.id, noteUpdateData);
      
      // Obtener la nota actualizada del servidor
      const updatedNote = await apiService.getNote(note.id);
      onUpdate(updatedNote);
      setIsEditing(false);
    } catch (error) {
      console.error('Error saving note:', error);
    }
  };

  const handleCancel = () => {
    setEditData({
      title: note.title,
      content: note.content,
      category: note.category?.name || '',
      tags: (note.tags || []).map(tag => tag.name).join(', '),
    });
    setSelectedCategoryId(note.category?.id || '');
    setSelectedTagIds((note.tags || []).map(t => t.id));
    setIsEditing(false);
  };

  const handleDelete = async () => {
    if (window.confirm('¿Estás seguro de que quieres eliminar esta nota?')) {
      try {
        await apiService.deleteNote(note.id);
        onDelete(note.id);
      } catch (error) {
        console.error('Error deleting note:', error);
      }
    }
  };

  const getPreviewContent = (content: string, maxLength: number = 150) => {
    if (content.length <= maxLength) return content;
    return content.substring(0, maxLength) + '...';
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) return 'Ayer';
    if (diffDays < 7) return `Hace ${diffDays} días`;
    return date.toLocaleDateString();
  };

  return (
    <Card sx={{ mb: 2, backgroundColor: 'white' }}>
      <CardContent sx={{ pb: 1 }}>
        <Box display="flex" alignItems="flex-start" gap={1}>
          <Box flex={1}>
            {isEditing ? (
              <TextField
                ref={titleRef}
                fullWidth
                value={editData.title}
                onChange={(e) => setEditData({ ...editData, title: e.target.value })}
                variant="outlined"
                size="small"
                sx={{ mb: 1 }}
              />
            ) : (
              <Typography
                variant="h6"
                onClick={handleStartEdit}
                sx={{
                  cursor: 'pointer',
                  '&:hover': { backgroundColor: '#f5f5f5' },
                  p: 0.5,
                  borderRadius: 1,
                  fontWeight: 600,
                }}
              >
                {note.title}
              </Typography>
            )}

            <Box display="flex" alignItems="center" gap={1} flexWrap="wrap" mb={1}>
              {note.category && (
                <Chip 
                  icon={<Label />}
                  label={note.category.name} 
                  size="small" 
                  variant="outlined"
                  sx={{
                    backgroundColor: note.category.color ? `${note.category.color}20` : undefined,
                    borderColor: note.category.color || undefined,
                    color: note.category.color || undefined,
                  }}
                />
              )}
              
              <Chip
                icon={<Schedule />}
                label={formatDate(note.updated_at)}
                size="small"
                variant="outlined"
              />
            </Box>

            {(note.tags || []).length > 0 && (
              <Box mb={1}>
                {(note.tags || []).map((tag, index) => (
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

            {!isEditing && (
              <Typography 
                variant="body2" 
                color="textSecondary"
                onClick={handleStartEdit}
                sx={{
                  cursor: 'pointer',
                  '&:hover': { backgroundColor: '#f5f5f5' },
                  p: 0.5,
                  borderRadius: 1,
                  lineHeight: 1.5,
                }}
              >
                {isExpanded ? note.content : getPreviewContent(note.content)}
              </Typography>
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
            
            {note.content.length > 150 && !isEditing && (
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

        <Collapse in={isEditing}>
          <Box mt={2}>
            <TextField
              fullWidth
              label="Contenido"
              value={editData.content}
              onChange={(e) => setEditData({ ...editData, content: e.target.value })}
              multiline
              rows={6}
              sx={{ mb: 2 }}
            />
            
            <Box display="flex" gap={2} mb={2}>
              <FormControl fullWidth size="small">
                <InputLabel>Categoría</InputLabel>
                <Select
                  value={selectedCategoryId}
                  label="Categoría"
                  onChange={(e) => setSelectedCategoryId(e.target.value as string)}
                >
                  <MenuItem value="">Sin categoría</MenuItem>
                  {categories.map((cat) => (
                    <MenuItem key={cat.id} value={cat.id}>{cat.name}</MenuItem>
                  ))}
                </Select>
              </FormControl>

              <FormControl fullWidth size="small">
                <InputLabel>Etiquetas</InputLabel>
                <Select
                  multiple
                  value={selectedTagIds}
                  label="Etiquetas"
                  onChange={(e) => setSelectedTagIds(e.target.value as string[])}
                  renderValue={(selected) => (
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                      {(selected as string[]).map((tagId) => {
                        const tag = tags.find(t => t.id === tagId);
                        return tag ? <Chip key={tagId} label={tag.name} size="small" /> : null;
                      })}
                    </Box>
                  )}
                >
                  {tags.map((tag) => (
                    <MenuItem key={tag.id} value={tag.id}>{tag.name}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>
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

export default NoteItem;