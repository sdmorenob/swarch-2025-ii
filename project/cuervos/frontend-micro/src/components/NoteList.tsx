/**
 * NoteList
 * ------------------------------------------------------------
 * Componente principal para la gestión de notas
 * - CRUD completo: crear, leer, actualizar y eliminar notas
 * - Búsqueda avanzada usando el microservicio de Go
 * - Filtrado por categorías y ordenamiento
 * - Tabs para alternar entre notas locales y resultados de búsqueda
 * - Modal de edición/creación con selección de categorías y etiquetas
 * - Integración con WebSocket para actualizaciones en tiempo real
 */
import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Box,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Tabs,
  Tab,
  Switch,
  FormControlLabel,
} from '@mui/material';
import { Search, CheckCircle, Error } from '@mui/icons-material';
import { apiService } from '../services/api';
import { useSocket } from '../contexts/SocketContext';
import { useAuth } from '../contexts/AuthContext';
import NoteItem from './NoteItem';
import type { Note, Category, Tag } from '../types';

const NoteList: React.FC = () => {
  const [notes, setNotes] = useState<Note[]>([]);
  const [filteredNotes, setFilteredNotes] = useState<Note[]>([]);
  const [searchResults, setSearchResults] = useState<Note[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [open, setOpen] = useState(false);
  const [editingNote, setEditingNote] = useState<Note | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentTab, setCurrentTab] = useState(0);
  const [sortBy, setSortBy] = useState('created_at');
  const [filterCategory, setFilterCategory] = useState('all');
  const [searchServiceStatus, setSearchServiceStatus] = useState<'unknown' | 'available' | 'unavailable'>('unknown');
  const [searchTotal, setSearchTotal] = useState(0);
  const [searchLimit, setSearchLimit] = useState(20);
  const [searchOffset, setSearchOffset] = useState(0);

  const [formData, setFormData] = useState({
    title: '',
    content: '',
    category_id: '',
    tag_ids: [] as string[],
  });
  const socketCtx = useSocket();
  const { user } = useAuth();

  useEffect(() => {
    fetchNotes();
    fetchCategories();
    fetchTags();
  }, []);

  useEffect(() => {
    const handleNoteUpdated = (updatedNote: Note) => {
      setNotes(prev => prev.map(note => note.id === updatedNote.id ? updatedNote : note));
    };
    socketCtx.on('note_updated', handleNoteUpdated as any);
    return () => {
      socketCtx.off('note_updated', handleNoteUpdated as any);
    };
  }, [socketCtx]);

  useEffect(() => {
    let filtered = [...notes];

    // Filtrar por tab
    if (currentTab === 1) { // Recientes
      const dayAgo = new Date();
      dayAgo.setDate(dayAgo.getDate() - 1);
      filtered = filtered.filter(note => new Date(note.updated_at) > dayAgo);
    } else if (currentTab === 2) { // Por categoría
      filtered = filtered.filter(note => note.category);
    }

    // Filtrar por categoría
    if (filterCategory !== 'all') {
      filtered = filtered.filter(note => note.category?.name === filterCategory);
    }

    // Filtrar por búsqueda
    if (searchQuery.trim()) {
      filtered = filtered.filter(note => 
        note.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        note.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (note.tags || []).some(tag => tag.name.toLowerCase().includes(searchQuery.toLowerCase()))
      );
    }

    // Ordenar
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'title':
          return a.title.localeCompare(b.title);
        case 'updated_at':
          return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
        case 'created_at':
        default:
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      }
    });

    if (!searchQuery.trim()) { setFilteredNotes(filtered); }
  }, [notes, currentTab, sortBy, filterCategory, searchQuery]);

  // useEffect para activar búsqueda con Search Service
  useEffect(() => {
    if (searchQuery.trim()) {
      // Debounce: esperar 500ms después de que el usuario deje de escribir
      const timeoutId = setTimeout(() => {
        performSearch(searchQuery);
      }, 500);

      return () => clearTimeout(timeoutId);
    }
  }, [searchQuery]);

  const fetchNotes = async () => {
    try {
      const response = await apiService.getNotes(1, 100); // Obtener hasta 100 notas por ahora
      setNotes(response.items || []);
    } catch (error) {
      console.error('Error fetching notes:', error);
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

  const performSearch = async (query: string, opts?: { append?: boolean }) => {
  try {
    console.log(` Iniciando b�squeda para: "${query}"`);
    if (!user?.id) {
      throw new (Error as any)('Usuario no autenticado');
    }
    const userId = user.id;
    // Validación opcional por coherencia
    if (isNaN(userId)) {
      throw new (Error as any)('ID de usuario inv�lido');
    }

    const categoryName = filterCategory !== 'all' ? filterCategory : undefined;
    const offset = opts?.append ? (searchOffset + searchLimit) : 0;
    const limit = searchLimit;

    const searchResponse = await apiService.searchNotes({
      query,
      user_id: userId,
      limit,
      offset,
      category_name: categoryName,
    });

    const results = searchResponse?.notes || [];
    console.log(` Search Service respondi� con ${results.length} resultados de ${searchResponse.total}`);
    setSearchServiceStatus('available');
    if (opts?.append) {
      setSearchResults(prev => [...prev, ...results]);
      setFilteredNotes(prev => [...prev, ...results]);
    } else {
      setSearchResults(results);
      setFilteredNotes(results);
    }
    setSearchTotal(searchResponse.total || 0);
    setSearchLimit(searchResponse.limit || limit);
    setSearchOffset(searchResponse.offset || offset);
  } catch (searchError) {
    console.warn('? Search Service no disponible, usando b�squeda local:', searchError);
    const localResults = notes.filter(note =>
      note.title.toLowerCase().includes(query.toLowerCase()) ||
      note.content.toLowerCase().includes(query.toLowerCase()) ||
      (note.category?.name || '').toLowerCase().includes(query.toLowerCase()) ||
      (note.tags || []).some(tag => tag.name.toLowerCase().includes(query.toLowerCase()))
    );
    console.log(` Usando solo resultados locales: ${localResults.length} notas`);
    setSearchServiceStatus('unavailable');
    setFilteredNotes(localResults);
    setSearchTotal(localResults.length);
    setSearchOffset(0);
  }
};

  const handleSubmit = async () => {
    try {
      const noteData = {
        title: formData.title,
        content: formData.content,
        category_id: formData.category_id || undefined,
        tag_ids: formData.tag_ids.length > 0 ? formData.tag_ids.map(String) : undefined,
      };

      if (editingNote) {
        await apiService.updateNote(editingNote.id, noteData);
      } else {
        await apiService.createNote(noteData);
      }

      setOpen(false);
      setEditingNote(null);
      setFormData({
        title: '',
        content: '',
        category_id: '',
        tag_ids: [],
      });
      fetchNotes();
    } catch (error) {
      console.error('Error saving note:', error);
    }
  };

  const handleNoteUpdate = (updatedNote: Note) => {
    setNotes(prev => 
      prev.map(note => 
        note.id === updatedNote.id ? updatedNote : note
      )
    );
  };

  const handleNoteDelete = (noteId: string) => {
    setNotes(prev => prev.filter(note => note.id !== noteId));
  };

  const getUniqueCategories = () => {
    const categories = notes.map(note => note.category?.name).filter(Boolean);
    return [...new Set(categories)];
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Gestión de Notas
      </Typography>
      
      <Box sx={{ mb: 3, display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
        <Button
          variant="contained"
          color="primary"
          onClick={() => setOpen(true)}
        >
          Crear Nueva Nota
        </Button>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <TextField
            placeholder="Buscar notas..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            size="small"
            sx={{ minWidth: 200 }}
            InputProps={{
              startAdornment: <Search sx={{ mr: 1, color: 'text.secondary' }} />,
            }}
          />
          {searchServiceStatus !== 'unknown' && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              {searchServiceStatus === 'available' ? (
                <>
                  <CheckCircle sx={{ color: 'success.main', fontSize: 16 }} />
                  <Typography variant="caption" color="success.main">
                    Search Service
                  </Typography>
                </>
              ) : (
                <>
                  <Error sx={{ color: 'warning.main', fontSize: 16 }} />
                  <Typography variant="caption" color="warning.main">
                    Solo local
                  </Typography>
                </>
              )}
            </Box>
          )}
        </Box>

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


      </Box>

      <Tabs value={currentTab} onChange={(e, newValue) => setCurrentTab(newValue)} sx={{ mb: 3 }}>
        <Tab label={`Todas (${notes.length})`} />
        <Tab label={`Recientes (${notes.filter(n => {
          const dayAgo = new Date();
          dayAgo.setDate(dayAgo.getDate() - 1);
          return new Date(n.updated_at) > dayAgo;
        }).length})`} />
        <Tab label={`Por categoría (${notes.filter(n => n.category).length})`} />
      </Tabs>

      <Grid container spacing={3}>
        {(Array.isArray(filteredNotes) ? filteredNotes : []).map((note) => (
          <Grid item xs={12} md={6} lg={4} key={note.id}>
            <NoteItem
              note={note}
              onUpdate={handleNoteUpdate}
              onDelete={handleNoteDelete}
            />
          </Grid>
        ))}
      </Grid>

      {filteredNotes.length === 0 && (
        <Box sx={{ textAlign: 'center', mt: 4 }}>
          <Typography variant="h6" color="text.secondary">
            {searchQuery ? "No se encontraron notas" : "No hay notas que mostrar"}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {searchQuery 
              ? "Intenta con otros términos de búsqueda" 
              : "Crea tu primera nota haciendo clic en 'Crear Nueva Nota'"
            }
          </Typography>
        </Box>
      )}

      {searchQuery && searchServiceStatus === 'available' && (searchResults.length < searchTotal) && (
  <Box sx={{ mt: 2, textAlign: 'center' }}>
    <Button variant='outlined' onClick={() => performSearch(searchQuery, { append: true })}>
      Mostrar m�s
    </Button>
    <Typography variant='caption' sx={{ ml: 1 }}>
      {searchResults.length} / {searchTotal}
    </Typography>
  </Box>
)}<Dialog open={open} onClose={() => setOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          {editingNote ? 'Editar Nota' : 'Nueva Nota'}
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
            label="Contenido"
            value={formData.content}
            onChange={(e) => setFormData({ ...formData, content: e.target.value })}
            margin="normal"
            multiline
            rows={8}
            required
          />
          <FormControl fullWidth margin="normal">
            <InputLabel>Categoría</InputLabel>
            <Select
              value={formData.category_id}
              label="Categoría"
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
              label="Etiquetas"
              onChange={(e) => {
                const value = e.target.value as unknown as (string | number)[];
                setFormData({ ...formData, tag_ids: value.map(v => String(v)) });
              }}
              renderValue={(selected) => (
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                  {(Array.isArray(selected) ? (selected as string[]) : []).map((tagId) => {
                    const tag = tags.find(t => String(t.id) === String(tagId));
                    return tag ? (
                      <Box key={tagId} sx={{ mr: 0.5 }}>
                        {`#${tag.name}`}
                      </Box>
                    ) : null;
                  })}
                </Box>
              )}
            >
              {(Array.isArray(tags) ? tags : []).map((tag) => (
                <MenuItem key={tag.id} value={String(tag.id)}>{tag.name}</MenuItem>
              ))}
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>Cancelar</Button>
          <Button onClick={handleSubmit} variant="contained">
            {editingNote ? 'Actualizar' : 'Crear'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default NoteList;





