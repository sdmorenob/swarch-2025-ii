'use client';

import { useEffect, useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { getCurrentUser, getMyActivities, createActivity } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dumbbell } from 'lucide-react';

// Tipos para los datos
interface Activity {
  id_actividad: number;
  tipo: string;
  distancia_km: number;
  duracion_min: number;
  fecha: string;
}

export default function ActivitiesPage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<{ id: number; } | null>(null);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Estados para el formulario
  const [tipo, setTipo] = useState('');
  const [distancia, setDistancia] = useState('');
  const [duracion, setDuracion] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const userData = await getCurrentUser();
        setCurrentUser({ id: userData.id_usuario });

        const activitiesData = await getMyActivities(userData.id_usuario);
        console.log("Datos de actividades recibidos:", activitiesData);
        setActivities(activitiesData.activities || []); // El backend devuelve un objeto { activities: [...] }

      } catch (err: any) {
        console.error('Error fetching data:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [router]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!currentUser || !tipo || !distancia || !duracion) {
      setFormError('Todos los campos son obligatorios.');
      return;
    }

    try {
      const newActivity = {
        tipo,
        distancia_km: parseFloat(distancia),
        duracion_min: parseInt(duracion, 10),
        fecha: new Date().toISOString(), // Usamos la fecha actual
      };

      await createActivity(currentUser.id, newActivity);

      // Refrescar la lista de actividades
      const updatedActivities = await getMyActivities(currentUser.id);
      setActivities(updatedActivities.activities || []);

      // Limpiar el formulario
      setTipo('');
      setDistancia('');
      setDuracion('');

    } catch (err: any) {
      setFormError(err.message || 'Error al registrar la actividad.');
    }
  };

  if (loading) return <div>Cargando tus actividades...</div>;
  if (error) return <div className="text-red-500">Error: {error}</div>;

  return (
    <div className="grid gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Registrar Nueva Actividad</CardTitle>
          <CardDescription>Añade tu último entrenamiento para ganar puntos.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="tipo">Tipo de Actividad (Ej: Correr, Ciclismo)</Label>
              <Input id="tipo" value={tipo} onChange={(e) => setTipo(e.target.value)} placeholder="Correr" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="distancia">Distancia (km)</Label>
                <Input id="distancia" type="number" value={distancia} onChange={(e) => setDistancia(e.target.value)} placeholder="5.5" />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="duracion">Duración (min)</Label>
                <Input id="duracion" type="number" value={duracion} onChange={(e) => setDuracion(e.target.value)} placeholder="30" />
              </div>
            </div>
            {formError && <p className="text-sm text-red-500">{formError}</p>}
            <Button type="submit">Registrar Actividad</Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Mi Historial de Actividades</CardTitle>
          <CardDescription>Aquí puedes ver todas tus actividades registradas.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Actividad</TableHead>
                <TableHead>Distancia</TableHead>
                <TableHead>Duración</TableHead>
                <TableHead>Fecha</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {activities.length > 0 ? (
                activities.map((act) => (
                  <TableRow key={act.id_actividad}>
                    <TableCell className="font-medium">{act.tipo}</TableCell>
                    <TableCell>{act.distancia_km.toFixed(2)} km</TableCell>
                    <TableCell>{act.duracion_min} min</TableCell>
                    <TableCell>{new Date(act.fecha).toLocaleDateString()}</TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={4} className="text-center">Aún no has registrado ninguna actividad.</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}