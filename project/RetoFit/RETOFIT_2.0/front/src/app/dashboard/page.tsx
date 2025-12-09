'use client';

import Link from 'next/link';
import { useEffect, useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import {
  Activity,
  Trophy,
  Footprints,
  Dumbbell,
  Timer,
  Star,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Progress } from '@/components/ui/progress';
import { getCurrentUser, getAchievementsProgress, getUserPoints } from '@/lib/api';

// (Las interfaces no cambian)
interface UserData {
  is_profile_complete: boolean;
  id: number;
  username: string;
}

interface UserApiResponse {
  is_profile_complete: boolean;
  id_usuario: number; 
  nombre: string;     
}

interface ChallengeData {
  id: number;
  nombre: string;
  meta: number;
  progreso_actual: number;
  porcentaje_completado: number;
  obtenido: boolean;
  tipo_regla: string; 
}


export default function Dashboard() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<{ id: number; username: string; is_profile_complete: boolean; } | null>(null);
  const [myChallenges, setMyChallenges] = useState<ChallengeData[]>([]);
  const [totalPoints, setTotalPoints] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const userData = await getCurrentUser();
        setCurrentUser({
          id: userData.id_usuario,
          username: userData.nombre,
          is_profile_complete: userData.is_profile_complete
        });

        const [challengesData, pointsData] = await Promise.all([
          getAchievementsProgress(userData.id_usuario),
          getUserPoints(userData.id_usuario)
        ]);

        setMyChallenges(challengesData);
        setTotalPoints(pointsData.puntos_totales);

      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [router]);

  // --- FUNCIÓN DE ICONOS ACTUALIZADA ---
  const getIcon = (ruleType: string) => {
    const className = "h-4 w-4 text-muted-foreground";
    if (ruleType.includes('DISTANCIA')) return <Timer className={className} />;
    if (ruleType.includes('ACTIVIDADES')) return <Footprints className={className} />;
    if (ruleType.includes('PUNTOS')) return <Star className={className} />; // <-- Añadido
    return <Dumbbell className={className} />;
  };
  
  // --- FUNCIÓN DE UNIDADES ACTUALIZADA ---
  const getUnit = (ruleType: string) => {
    if (ruleType.includes('DISTANCIA')) return 'km';
    if (ruleType.includes('ACTIVIDADES')) return 'actividades';
    if (ruleType.includes('PUNTOS')) return 'puntos'; // <-- Añadido
    return 'unidades';
  }

  const activeChallenges = myChallenges.filter(c => !c.obtenido);
  const completedChallenges = myChallenges.filter(c => c.obtenido);

  if (loading) {
    return <div>Cargando tu dashboard...</div>;
  }

  if (error) {
    return <div className="text-red-500">Error: {error}</div>;
  }

  return (
    <>
      <div className="flex items-center">
        <h1 className="text-lg font-semibold md:text-2xl font-headline">
          ¡Bienvenido de nuevo, {currentUser?.username}!
        </h1>
      </div>
      {/* ... (Las cards de resumen no cambian) ... */}
      <div className="grid gap-4 md:grid-cols-2 md:gap-8 lg:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Logros Activos
            </CardTitle>
            <Trophy className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeChallenges.length}</div>
            <p className="text-xs text-muted-foreground">
              Sigue superando tus límites
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Logros Completados
            </CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{completedChallenges.length}</div>
            <p className="text-xs text-muted-foreground">
              ¡Sigue así!
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Mis Puntos
            </CardTitle>
            <Star className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalPoints.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              Ganados por tus actividades
            </p>
          </CardContent>
        </Card>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Mis Logros Activos</CardTitle>
          <CardDescription>
            Este es un vistazo a tu progreso actual.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Reto</TableHead>
                <TableHead className="hidden md:table-cell">Tipo</TableHead>
                <TableHead>Progreso</TableHead>
                <TableHead>
                  <span className="sr-only">Acciones</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {activeChallenges.map((challenge) => (
                <TableRow key={challenge.id}>
                  <TableCell>
                    <div className="font-medium">{challenge.nombre}</div>
                    <div className="hidden text-sm text-muted-foreground md:inline">
                      Meta: {challenge.meta.toLocaleString()} {getUnit(challenge.tipo_regla)}
                    </div>
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    {getIcon(challenge.tipo_regla)}
                  </TableCell>
                  <TableCell>
                    {/* ===== INICIO DEL CAMBIO IMPORTANTE ===== */}
                    <div className="flex flex-col gap-2">
                      <Progress value={challenge.porcentaje_completado} aria-label={`${challenge.porcentaje_completado.toFixed(0)}% completado`} />
                      <span className="text-xs text-muted-foreground">
                        {challenge.progreso_actual.toLocaleString()} / {challenge.meta.toLocaleString()} {getUnit(challenge.tipo_regla)} ({challenge.porcentaje_completado.toFixed(0)}%)
                      </span>
                    </div>
                    {/* ===== FIN DEL CAMBIO ===== */}
                  </TableCell>
                  <TableCell>
                    <Link href={`/dashboard/challenges/${challenge.id}`}>
                      <Button size="sm" variant="outline">
                        Ver
                      </Button>
                    </Link>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </>
  );
}