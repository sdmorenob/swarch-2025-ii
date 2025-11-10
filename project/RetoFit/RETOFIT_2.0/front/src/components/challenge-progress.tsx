'use client';

// Añadimos 'useEffect'
import { useState, useEffect, useActionState } from 'react'; // <-- Añade useActionState
import { useFormStatus } from 'react-dom'; // <-- Quita useFormState de aquí
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import type { Challenge, ProgressLog } from '@/lib/data';
// YA NO importamos 'users'
import { recognizeMilestone } from '@/ai/flows/dynamic-milestone-recognition';
import { Loader2 } from 'lucide-react';
// Importamos 'logUserProgress' Y 'getUserProgress'
import { logUserProgress, getUserProgress } from '@/lib/api';

type ChallengeProgressProps = {
  challenge: Challenge;
  // 'initialProgress' ya no se recibe como prop
};

// YA NO necesitamos 'currentUser'
// const currentUser = users[0]; 

export function ChallengeProgress({
  challenge,
}: ChallengeProgressProps) {
  // Creamos estados para manejar la carga y los datos del usuario
  const [currentProgress, setCurrentProgress] = useState(0); // Empezamos en 0
  const [userId, setUserId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const { toast } = useToast();

  // useEffect se ejecuta cuando el componente se carga en el navegador
  useEffect(() => {
    async function fetchUserData() {
      // 1. Asumimos que tu login page guarda el token en localStorage
      const token = localStorage.getItem('accessToken');
      
      if (!token) {
        setError('No estás autenticado. Por favor, inicia sesión.');
        setIsLoading(false);
        return;
      }

      try {
        // 2. Validamos el token contra el auth-service (puerto 8001)
        const authRes = await fetch('http://127.0.0.1:8080/api/auth/validate-token', {
          headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!authRes.ok) {
          throw new Error('Sesión inválida o expirada.');
        }

        const authData = await authRes.json();
        
        // 3. Obtenemos el ID del usuario (¡Gracias al Paso 1!)
        const realUserId = authData.data.id;
        if (!realUserId) {
          throw new Error('No se pudo obtener el ID de usuario del token.');
        }
        setUserId(realUserId); // Guardamos el ID en el estado

        // 4. Obtenemos el progreso real de este usuario
        const progressData = await getUserProgress(challenge.id, realUserId);
        setCurrentProgress(progressData.progress);

      } catch (err: any) {
        setError(err.message || 'Error al cargar tus datos.');
      } finally {
        setIsLoading(false);
      }
    }

    fetchUserData();
  }, [challenge.id]); // Se ejecuta si el 'challenge.id' cambia

  const progressPercentage = (currentProgress / challenge.target) * 100;

  async function handleLogProgress(
    _prevState: any,
    formData: FormData
  ): Promise<{ message: string | null; error: string | null }> {
    
    // Si el ID de usuario aún no se ha cargado, no hacer nada
    if (!userId) {
      return { message: null, error: 'Usuario no verificado. Refresca la página.' };
    }

    const amount = Number(formData.get('amount'));

    if (isNaN(amount) || amount <= 0) {
      return { message: null, error: 'Please enter a valid positive number.' };
    }

    const newProgress = currentProgress + amount;
    const oldProgress = currentProgress; // Guardamos el progreso anterior para rollback

    // Actualización optimista de la UI
    setCurrentProgress(newProgress);
    
    try {
        // --- 1. ACCIÓN CRÍTICA: GUARDAR EN LA BD ---
        const saveResult = await logUserProgress(
          challenge.id,
          userId,
          newProgress
        );

        if (!saveResult.ok) {
          // Si esto falla, sí es un error real
          throw new Error('Failed to save progress to database.');
        }

        // --- 2. ACCIÓN SECUNDARIA: RECONOCER HITO ---
        // Lo ponemos en su propio try/catch para que no rompa lo demás
        try {
            const milestoneResult = await recognizeMilestone({
              userId: userId.toString(), // <-- El arreglo está aquí
              challengeName: challenge.name,
              progress: newProgress,
              target: challenge.target,
            });
      
            if (milestoneResult.achievedMilestone) {
              toast({
                title: '🎉 Milestone Reached! 🎉',
                description: milestoneResult.reward,
                duration: 5000,
              });
            }
        } catch (aiError) {
            // Si la IA falla, solo lo mostramos en consola.
            // No le mostramos un error al usuario ni revertimos su progreso.
            console.warn("Milestone check failed (but progress was saved):", aiError);
        }

        // Si el guardado (acción 1) fue exitoso, devolvemos éxito
        return { message: `Successfully logged ${amount} ${challenge.unit}!`, error: null };

    } catch(e) {
        // Este CATCH ahora solo se activa si el guardado en BD falla
        setCurrentProgress(oldProgress); // Revertir al progreso anterior
        console.error(e);
        return { message: null, error: 'Could not log progress. Please try again.' };
    }
  }

  const [state, formAction] = useActionState(handleLogProgress, { message: null, error: null });

  // --- Renderizado Condicional ---

  // Estado de Carga
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Your Progress</CardTitle>
        </CardHeader>
        <CardContent className="flex justify-center items-center h-48">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="ml-2">Cargando tu progreso...</p>
        </CardContent>
      </Card>
    );
  }

  // Estado de Error
  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Error</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-destructive">{error}</p>
          {/* Aquí podrías poner un <Button> para ir al login */}
        </CardContent>
      </Card>
    );
  }

  // Estado Exitoso (el componente normal)
  return (
    <Card>
      <CardHeader>
        <CardTitle>Your Progress</CardTitle>
        <CardDescription>
          You are at {Math.floor(progressPercentage)}% of your goal. Keep going!
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Progress value={progressPercentage} className="h-4" />
        <div className="text-center font-mono text-2xl font-bold tracking-tighter">
          {currentProgress.toLocaleString()} /{' '}
          {challenge.target.toLocaleString()} {challenge.unit}
        </div>
      </CardContent>
      <CardFooter>
        <form action={formAction} className="w-full space-y-4">
          <div className="grid w-full items-center gap-1.5">
            <Label htmlFor="amount">Log New Progress</Label>
            <div className="flex w-full items-center space-x-2">
              <Input
                type="number"
                id="amount"
                name="amount"
                placeholder={`e.g., 5000 for ${challenge.unit}`}
                required
              />
              <SubmitButton />
            </div>
            {state?.error && <p className="text-sm text-destructive">{state.error}</p>}
            {state?.message && <p className="text-sm text-green-600">{state.message}</p>}
          </div>
        </form>
      </CardFooter>
    </Card>
  );
}

function SubmitButton() {
    const { pending } = useFormStatus();
    return (
        <Button type="submit" disabled={pending}>
            {pending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Log
        </Button>
    )
}