'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getCurrentUser, getAchievementsProgress } from '@/lib/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Trophy, Award } from 'lucide-react';

// Interface para definir la estructura de un logro
interface Achievement {
  id: string;
  nombre: string;
  descripcion: string;
  obtenido: boolean;
  fecha_obtenido?: string;
}

export default function AchievementsPage() {
  const router = useRouter();
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const userData = await getCurrentUser();
        const progressData = await getAchievementsProgress(userData.id_usuario);

        // Filtramos para quedarnos solo con los logros que ya han sido obtenidos
        const earnedAchievements = progressData.filter(ach => ach.obtenido);
        setAchievements(earnedAchievements);

      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [router]);

  if (loading) return <div>Cargando tus logros...</div>;
  if (error) return <div className="text-red-500">Error: {error}</div>;

  return (
    <>
      <div className="flex items-center mb-6">
        <Trophy className="h-6 w-6 mr-3 text-yellow-500" />
        <h1 className="text-lg font-semibold md:text-2xl font-headline">
          Mis Logros
        </h1>
      </div>

      {achievements.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {achievements.map((ach) => (
            <Card key={ach.id} className="border-2 border-yellow-500/50">
              <CardHeader>
                <div className="flex items-center">
                  <Award className="h-5 w-5 mr-3 text-yellow-600" />
                  <CardTitle>{ach.nombre}</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">{ach.descripcion}</p>
                {ach.fecha_obtenido && (
                  <p className="text-xs text-gray-400 mt-4">
                    Obtenido el: {new Date(ach.fecha_obtenido).toLocaleDateString()}
                  </p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="pt-6">
            <p className="text-center text-muted-foreground">
              Aún no has ganado ningún logro. ¡Sigue registrando actividades para desbloquearlos!
            </p>
          </CardContent>
        </Card>
      )}
    </>
  );
}