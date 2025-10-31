import { ChallengeCard } from '@/components/challenge-card';
import { getChallenges } from '@/lib/api'; // Importamos la nueva función
import type { Challenge } from '@/lib/data'; // Mantenemos el tipo para TypeScript

// Convertimos el componente en una función asíncrona
export default async function ChallengesPage() {
  // Llamamos a la API para obtener los retos
  const challenges: Challenge[] = await getChallenges();

  return (
    <div className="container mx-auto py-8">
      <div className="mb-8 text-center">
        <h1 className="text-4xl font-bold font-headline tracking-tight">
          Find Your Next Challenge
        </h1>
        <p className="mt-2 text-lg text-muted-foreground">
          Browse our list of challenges and push your limits.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {challenges.map((challenge) => (
          <ChallengeCard key={challenge.id} challenge={challenge} />
        ))}
      </div>
    </div>
  );
}