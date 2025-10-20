/**
 * DashboardPage
 * ------------------------------------------------------------
 * Panel con estadísticas rápidas, listas recientes y previsualizaciones.
 * - Usa API para cargar últimas tareas/notas
 * - Se suscribe a WebSocket para actualizar estadísticas en tiempo real
 * - Preview modal (solo lectura) para tareas y notas
 */
import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Button,
  IconButton,
  Chip,
  LinearProgress,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider,
  Paper,
  Avatar,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import {
  Add,
  Assignment,
  Note,
  CheckCircle,
  Schedule,
  TrendingUp,
  Today,
  Upcoming,
  Star,
  Close,
  Flag,
  Label,
  CalendarToday,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useSocket } from '../contexts/SocketContext';
import type { Task, Note as NoteType } from '../types';
import { apiService } from '../services/api';

const DashboardPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { socket } = useSocket();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [notes, setNotes] = useState<NoteType[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalTasks: 0,
    completedTasks: 0,
    pendingTasks: 0,
    totalNotes: 0,
  });
  
  // Preview modal states
  const [taskPreview, setTaskPreview] = useState<Task | null>(null);
  const [notePreview, setNotePreview] = useState<NoteType | null>(null);
  const [taskPreviewOpen, setTaskPreviewOpen] = useState(false);
  const [notePreviewOpen, setNotePreviewOpen] = useState(false);

  useEffect(() => {
    loadDashboardData();
  }, []);

  // WebSocket listeners for real-time updates
  useEffect(() => {
    if (socket) {
      const handleTaskUpdated = (updatedTask: Task) => {
        setTasks(prevTasks => {
          const updatedTasks = prevTasks.map(task => 
            task.id === updatedTask.id ? updatedTask : task
          );
          
          // Recalculate stats with updated tasks
          const totalTasks = updatedTasks.length;
          const completedTasks = updatedTasks.filter(task => 
            task.completed === true || task.status === 'completed'
          ).length;
          const pendingTasks = totalTasks - completedTasks;
          
          setStats(prevStats => ({
            ...prevStats,
            totalTasks,
            completedTasks,
            pendingTasks,
          }));
          
          return updatedTasks;
        });
      };

      const handleTaskDeleted = (deletedTaskData: { id: number }) => {
        setTasks(prevTasks => {
          const updatedTasks = prevTasks.filter(task => task.id.toString() === deletedTaskData.id.toString());
          
          // Recalculate stats with updated tasks
          const totalTasks = updatedTasks.length;
          const completedTasks = updatedTasks.filter(task => 
            task.completed === true || task.status === 'completed'
          ).length;
          const pendingTasks = totalTasks - completedTasks;
          
          setStats(prevStats => ({
            ...prevStats,
            totalTasks,
            completedTasks,
            pendingTasks,
          }));
          
          return updatedTasks;
        });
      };

      const handleNoteUpdated = (updatedNote: NoteType) => {
        setNotes(prevNotes => 
          prevNotes.map(note => 
            note.id === updatedNote.id ? updatedNote : note
          )
        );
      };

      socket.on('task_updated', handleTaskUpdated);
      socket.on('task_deleted', handleTaskDeleted);
      socket.on('note_updated', handleNoteUpdated);

      return () => {
        socket.off('task_updated', handleTaskUpdated);
        socket.off('task_deleted', handleTaskDeleted);
        socket.off('note_updated', handleNoteUpdated);
      };
    }
  }, [socket]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const [tasksResponse, notesResponse] = await Promise.all([
        apiService.getTasks(1, 10),
        apiService.getNotes(1, 5),
      ]);

      setTasks(tasksResponse.items);
      setNotes(notesResponse.items);

      // Calculate stats
      const totalTasks = tasksResponse.total;
      const completedTasks = tasksResponse.items.filter(task => 
        task.completed === true || task.status === 'completed'
      ).length;
      const pendingTasks = totalTasks - completedTasks;

      setStats({
        totalTasks,
        completedTasks,
        pendingTasks,
        totalNotes: notesResponse.total,
      });
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };



  const getTaskStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle color="success" />;
      case 'in_progress':
        return <Schedule color="primary" />;
      default:
        return <Assignment color="action" />;
    }
  };

  const completionPercentage = stats.totalTasks > 0 ? (stats.completedTasks / stats.totalTasks) * 100 : 0;

  // Preview handlers
  const handleTaskPreview = (task: Task) => {
    setTaskPreview(task);
    setTaskPreviewOpen(true);
  };

  const handleNotePreview = (note: NoteType) => {
    setNotePreview(note);
    setNotePreviewOpen(true);
  };

  const closeTaskPreview = () => {
    setTaskPreviewOpen(false);
    setTaskPreview(null);
  };

  const closeNotePreview = () => {
    setNotePreviewOpen(false);
    setNotePreview(null);
  };

  const getPreviewContent = (content: string, maxLength: number = 200) => {
    if (content.length <= maxLength) return content;
    return content.substring(0, maxLength) + '...';
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'error';
      case 'medium':
        return 'warning';
      case 'low':
        return 'success';
      default:
        return 'default';
    }
  };

  if (loading) {
    return (
      <Box sx={{ width: '100%', mt: 2 }}>
        <LinearProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" gutterBottom>
          Welcome back, {user?.name}!
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Here's what's happening with your tasks and notes today.
        </Typography>
      </Box>

      {/* Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Assignment color="primary" sx={{ mr: 1 }} />
                <Typography variant="h6">Total Tasks</Typography>
              </Box>
              <Typography variant="h4">{stats.totalTasks}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <CheckCircle color="success" sx={{ mr: 1 }} />
                <Typography variant="h6">Completed</Typography>
              </Box>
              <Typography variant="h4">{stats.completedTasks}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Schedule color="warning" sx={{ mr: 1 }} />
                <Typography variant="h6">Pending</Typography>
              </Box>
              <Typography variant="h4">{stats.pendingTasks}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Note color="info" sx={{ mr: 1 }} />
                <Typography variant="h6">Notes</Typography>
              </Box>
              <Typography variant="h4">{stats.totalNotes}</Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Progress Card */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                <Typography variant="h6">Task Progress</Typography>
                <TrendingUp color="primary" />
              </Box>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                {completionPercentage.toFixed(1)}% of tasks completed
              </Typography>
              <LinearProgress
                variant="determinate"
                value={completionPercentage}
                sx={{ height: 8, borderRadius: 4 }}
              />
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                <Typography variant="h6">Quick Actions</Typography>
              </Box>
              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                <Button
                  variant="contained"
                  startIcon={<Add />}
                  onClick={() => navigate('/tasks/new')}
                  size="small"
                >
                  New Task
                </Button>
                <Button
                  variant="outlined"
                  startIcon={<Add />}
                  onClick={() => navigate('/notes/new')}
                  size="small"
                >
                  New Note
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Recent Tasks and Notes */}
      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                <Typography variant="h6">Recent Tasks</Typography>
                <Button size="small" onClick={() => navigate('/tasks')}>
                  View All
                </Button>
              </Box>
              {tasks.length === 0 ? (
                <Typography variant="body2" color="text.secondary">
                  No tasks yet. Create your first task to get started!
                </Typography>
              ) : (
                <List>
                  {tasks.slice(0, 5).map((task, index) => (
                    <React.Fragment key={task.id}>
                      <ListItem
                        sx={{ px: 0, cursor: 'pointer' }}
                        onClick={() => handleTaskPreview(task)}
                      >
                        <ListItemIcon>
                          {getTaskStatusIcon(task.status)}
                        </ListItemIcon>
                        <ListItemText
                          primary={task.title}
                          secondary={
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                              <Chip
                                label={task.priority}
                                size="small"
                                color={getPriorityColor(task.priority) as any}
                                variant="outlined"
                              />
                              {task.due_date && (
                                <Typography variant="caption" color="text.secondary">
                                  Due: {new Date(task.due_date).toLocaleDateString()}
                                </Typography>
                              )}
                            </Box>
                          }
                        />
                      </ListItem>
                      {index < tasks.length - 1 && <Divider />}
                    </React.Fragment>
                  ))}
                </List>
              )}
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                <Typography variant="h6">Recent Notes</Typography>
                <Button size="small" onClick={() => navigate('/notes')}>
                  View All
                </Button>
              </Box>
              {notes.length === 0 ? (
                <Typography variant="body2" color="text.secondary">
                  No notes yet. Create your first note!
                </Typography>
              ) : (
                <List>
                  {notes.map((note, index) => (
                    <React.Fragment key={note.id}>
                      <ListItem
                        sx={{ px: 0, cursor: 'pointer' }}
                        onClick={() => handleNotePreview(note)}
                      >
                        <ListItemIcon>
                          <Note color="primary" />
                        </ListItemIcon>
                        <ListItemText
                          primary={note.title}
                          secondary={
                            <Typography variant="caption" color="text.secondary">
                              {new Date(note.updated_at).toLocaleDateString()}
                            </Typography>
                          }
                        />
                      </ListItem>
                      {index < notes.length - 1 && <Divider />}
                    </React.Fragment>
                  ))}
                </List>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Task Preview Modal */}
      <Dialog open={taskPreviewOpen} onClose={closeTaskPreview} maxWidth="md" fullWidth>
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Typography variant="h6">Task Preview</Typography>
            <IconButton onClick={closeTaskPreview} size="small">
              <Close />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent>
          {taskPreview && (
            <Box>
              <Typography variant="h5" gutterBottom>
                {taskPreview.title}
              </Typography>
              
              <Box sx={{ display: 'flex', gap: 1, mb: 2, flexWrap: 'wrap' }}>
                <Chip
                  icon={<Flag />}
                  label={taskPreview.priority ? taskPreview.priority.toUpperCase() : 'MEDIUM'}
                  size="small"
                  color={getPriorityColor(taskPreview.priority || 'medium') as any}
                />
                <Chip
                  icon={<Assignment />}
                  label={taskPreview.status ? taskPreview.status.replace('_', ' ').toUpperCase() : 'PENDING'}
                  size="small"
                  variant="outlined"
                />
                {taskPreview.category && (
                  <Chip
                    icon={<Label />}
                    label={taskPreview.category.name}
                    size="small"
                    variant="outlined"
                    sx={{
                      backgroundColor: taskPreview.category.color ? `${taskPreview.category.color}20` : undefined,
                      borderColor: taskPreview.category.color || undefined,
                      color: taskPreview.category.color || undefined,
                    }}
                  />
                )}
                {taskPreview.due_date && (
                  <Chip
                    icon={<CalendarToday />}
                    label={`Due: ${new Date(taskPreview.due_date).toLocaleDateString()}`}
                    size="small"
                    variant="outlined"
                  />
                )}
              </Box>

              {taskPreview.description && (
                <Box sx={{ mb: 2 }}>
                  <Typography variant="h6" gutterBottom>
                    Description
                  </Typography>
                  <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>
                    {taskPreview.description}
                  </Typography>
                </Box>
              )}

              {taskPreview.tags && taskPreview.tags.length > 0 && (
                <Box sx={{ mb: 2 }}>
                  <Typography variant="h6" gutterBottom>
                    Tags
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                    {taskPreview.tags.map((tag) => (
                      <Chip
                        key={tag.id}
                        label={`#${tag.name}`}
                        size="small"
                        variant="outlined"
                        sx={{
                          backgroundColor: tag.color ? `${tag.color}20` : undefined,
                          borderColor: tag.color || undefined,
                          color: tag.color || undefined,
                        }}
                      />
                    ))}
                  </Box>
                </Box>
              )}

              <Box sx={{ mt: 2, pt: 2, borderTop: 1, borderColor: 'divider' }}>
                <Typography variant="caption" color="text.secondary">
                  Created: {new Date(taskPreview.created_at).toLocaleString()}
                </Typography>
                <br />
                <Typography variant="caption" color="text.secondary">
                  Updated: {new Date(taskPreview.updated_at).toLocaleString()}
                </Typography>
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={closeTaskPreview}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Note Preview Modal */}
      <Dialog open={notePreviewOpen} onClose={closeNotePreview} maxWidth="md" fullWidth>
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Typography variant="h6">Note Preview</Typography>
            <IconButton onClick={closeNotePreview} size="small">
              <Close />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent>
          {notePreview && (
            <Box>
              <Typography variant="h5" gutterBottom>
                {notePreview.title}
              </Typography>
              
              {notePreview.category && (
                <Box sx={{ mb: 2 }}>
                  <Chip
                    icon={<Label />}
                    label={notePreview.category.name}
                    size="small"
                    variant="outlined"
                    sx={{
                      backgroundColor: notePreview.category.color ? `${notePreview.category.color}20` : undefined,
                      borderColor: notePreview.category.color || undefined,
                      color: notePreview.category.color || undefined,
                    }}
                  />
                </Box>
              )}

              <Box sx={{ mb: 2 }}>
                <Typography variant="h6" gutterBottom>
                  Content
                </Typography>
                <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>
                  {notePreview.content}
                </Typography>
              </Box>

              {notePreview.tags && notePreview.tags.length > 0 && (
                <Box sx={{ mb: 2 }}>
                  <Typography variant="h6" gutterBottom>
                    Tags
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                    {notePreview.tags.map((tag) => (
                      <Chip
                        key={tag.id}
                        label={`#${tag.name}`}
                        size="small"
                        variant="outlined"
                        sx={{
                          backgroundColor: tag.color ? `${tag.color}20` : undefined,
                          borderColor: tag.color || undefined,
                          color: tag.color || undefined,
                        }}
                      />
                    ))}
                  </Box>
                </Box>
              )}

              <Box sx={{ mt: 2, pt: 2, borderTop: 1, borderColor: 'divider' }}>
                <Typography variant="caption" color="text.secondary">
                  Created: {new Date(notePreview.created_at).toLocaleString()}
                </Typography>
                <br />
                <Typography variant="caption" color="text.secondary">
                  Updated: {new Date(notePreview.updated_at).toLocaleString()}
                </Typography>
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={closeNotePreview}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default DashboardPage;