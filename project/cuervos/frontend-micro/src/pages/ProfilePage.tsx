/**
 * ProfilePage
 * ------------------------------------------------------------
 * Página de perfil del usuario
 * - Muestra información personal del usuario autenticado
 * - Permite editar descripción y fecha de nacimiento (perfil)
 * - Usa el endpoint /user-profile/me y update de /user-profile/{id}
 */
import React, { useEffect, useMemo, useState } from 'react';
import {
  Container,
  Paper,
  Typography,
  Box,
  Avatar,
  Divider,
  TextField,
  Button,
  Alert,
  CircularProgress,
} from '@mui/material';
import { useAuth } from '../contexts/AuthContext';
import apiService from '../services/api';
import { UserProfile, ProfileUpdate } from '../types';

const toDateInputValue = (iso?: string | null) => {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const fromDateInputValue = (value: string): string | null => {
  if (!value) return null;
  // Interpretar como fecha local a medianoche y convertir a ISO
  const [y, m, d] = value.split('-').map(Number);
  const date = new Date(y, (m || 1) - 1, d || 1);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
};

const ProfilePage: React.FC = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [description, setDescription] = useState<string>('');
  const [birthdateInput, setBirthdateInput] = useState<string>('');

  const displayName = useMemo(
    () => user?.name || user?.full_name || profile?.name || 'Usuario',
    [user?.name, user?.full_name, profile?.name]
  );

  useEffect(() => {
    let mounted = true;
    const fetchProfile = async () => {
      setLoading(true);
      setError(null);
      setSuccess(null);
      try {
        const p = await apiService.getMyProfile();
        if (!mounted) return;
        setProfile(p);
        setDescription(p.description || '');
        setBirthdateInput(toDateInputValue(p.birthdate || null));
      } catch (e: any) {
        // Si el perfil no existe aún, inicializamos campos vacíos
        if (!mounted) return;
        setProfile(null);
        setDescription('');
        setBirthdateInput('');
        setError(
          typeof e?.message === 'string'
            ? e.message
            : 'No fue posible cargar el perfil'
        );
      } finally {
        if (mounted) setLoading(false);
      }
    };
    fetchProfile();
    return () => {
      mounted = false;
    };
  }, []);

  const handleSave = async () => {
    if (!profile) {
      setError('El perfil no está disponible para editar.');
      return;
    }
    setSaving(true);
    setError(null);
    setSuccess(null);
    const emailToSend = (user?.email || profile?.email || '').trim();
    const nameToSend = (
      profile?.name?.trim() ||
      user?.name?.trim() ||
      user?.full_name?.trim() ||
      (emailToSend ? emailToSend.split('@')[0]
        .replace(/[._]/g, ' ')
        .split(' ')
        .filter(Boolean)
        .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
        .join(' ') : '')
    );

    if (!emailToSend || !nameToSend) {
      setError('Faltan nombre o email para actualizar el perfil.');
      setSaving(false);
      return;
    }

    const payload: ProfileUpdate = {
      name: nameToSend,
      email: emailToSend,
      description: description || undefined,
      birthdate: fromDateInputValue(birthdateInput) || undefined,
    };
    try {
      const updated = await apiService.updateProfile(profile.id, payload);
      setProfile(updated);
      setSuccess('Perfil actualizado correctamente.');
    } catch (e: any) {
      setError(
        typeof e?.message === 'string' ? e.message : 'Error al actualizar el perfil'
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <Container maxWidth="md">
      <Paper elevation={3} sx={{ p: 4 }}>
        <Box display="flex" alignItems="center" mb={3}>
          <Avatar sx={{ width: 80, height: 80, mr: 3, fontSize: '2rem' }}>
            {displayName?.charAt(0) || 'U'}
          </Avatar>
          <Box>
            <Typography variant="h4" gutterBottom>
              Perfil de Usuario
            </Typography>
            <Typography variant="h6" color="text.secondary">
              {displayName}
            </Typography>
          </Box>
        </Box>

        <Divider sx={{ my: 3 }} />

        {loading ? (
          <Box display="flex" justifyContent="center" my={4}>
            <CircularProgress />
          </Box>
        ) : (
          <Box>
            {error && (
              <Alert severity="warning" sx={{ mb: 2 }}>
                {error}
              </Alert>
            )}
            {success && (
              <Alert severity="success" sx={{ mb: 2 }}>
                {success}
              </Alert>
            )}

            <Typography variant="h6" gutterBottom>
              Información Personal
            </Typography>
            <Typography variant="body1" paragraph>
              <strong>Nombre:</strong> {displayName}
            </Typography>
            <Typography variant="body1" paragraph>
              <strong>Email:</strong> {user?.email || profile?.email || 'No disponible'}
            </Typography>
            <Typography variant="body1" paragraph>
              <strong>Estado:</strong> {user?.is_active ? 'Activo' : 'Inactivo'}
            </Typography>
            <Typography variant="body1" paragraph>
              <strong>Fecha de registro:</strong>{' '}
              {user?.created_at
                ? new Date(user.created_at).toLocaleDateString()
                : 'No disponible'}
            </Typography>

            <Divider sx={{ my: 3 }} />

            <Typography variant="h6" gutterBottom>
              Información del Perfil
            </Typography>

            <Box display="flex" flexDirection="column" gap={2}>
              <TextField
                label="Descripción"
                multiline
                minRows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Cuéntanos algo sobre ti"
              />
              <TextField
                label="Fecha de nacimiento"
                type="date"
                value={birthdateInput}
                onChange={(e) => setBirthdateInput(e.target.value)}
                InputLabelProps={{ shrink: true }}
              />
              <Box display="flex" gap={2}>
                <Button
                  variant="contained"
                  color="primary"
                  onClick={handleSave}
                  disabled={saving || !profile}
                >
                  {saving ? 'Guardando...' : 'Guardar cambios'}
                </Button>
              </Box>
            </Box>
          </Box>
        )}
      </Paper>
    </Container>
  );
};

export default ProfilePage;