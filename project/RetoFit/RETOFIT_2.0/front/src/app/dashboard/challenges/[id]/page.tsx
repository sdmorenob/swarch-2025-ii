import { notFound } from 'next/navigation';
import Image from 'next/image';
// Ya no importamos 'getLeaderboardData' ni 'LeaderboardEntry'
import { getChallengeById } from '@/lib/api'; 
import { type Challenge } from '@/lib/data';
import { Footprints, Dumbbell, Timer, Users, Target } from 'lucide-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
// Ya no importamos 'Leaderboard'
import { ChallengeProgress } from '@/components/challenge-progress';

type ChallengePageProps = {
  params: {
    id: string;
  };
};

const getIcon = (type: 'steps' | 'distance' | 'time' | string) => {
  const className = 'h-5 w-5 text-primary';
  switch (type) {
    case 'steps':
      return <Footprints className={className} />;
    case 'distance':
      return <Timer className={className} />;
    case 'time':
      return <Dumbbell className={className} />;
    default:
      return <Target className={className} />;
  }
};

export default async function ChallengePage({ params }: ChallengePageProps) {
  // 1. Obtenemos solo el reto, ya no en paralelo
  const challenge = await getChallengeById(params.id);

  if (!challenge) {
    notFound();
  }
  console.log('Challenge fetched:', challenge);
  // Pasamos solo el reto al componente JSX
  return <ChallengePageContent challenge={challenge} />;
}

// Este componente ahora solo recibe 'challenge'
function ChallengePageContent({ challenge }: { challenge: Challenge }) {
  return (
    <div className="flex flex-col gap-8">
      {/* Header section (sin cambios) */}
      <div className="relative h-64 w-full rounded-lg overflow-hidden">
        <Image
          src={challenge.image.imageUrl}
          alt={challenge.image.description}
          fill
          className="object-cover"
          data-ai-hint={challenge.image.imageHint}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
        <div className="absolute bottom-0 left-0 p-6">
          <h1 className="text-4xl font-bold font-headline tracking-tight text-white">
            {challenge.name}
          </h1>
          <p className="mt-2 max-w-xl text-lg text-primary-foreground/80">
            {challenge.description}
          </p>
        </div>
      </div>

      {/* Main content grid: 
        Quitamos 'lg:grid-cols-3' y lo cambiamos para que ocupe el centro 
      */}
      <div className="grid grid-cols-1 gap-8 lg:max-w-4xl lg:mx-auto lg:w-full">
        {/* Left Column: Progress and Details 
          Cambiamos 'lg:col-span-2' para que ocupe todo el espacio
        */}
        <div className="lg:col-span-1 space-y-8">
          <ChallengeProgress
            challenge={challenge}
          />
          <Card>
            <CardHeader>
              <CardTitle>Challenge Details</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              <div className="flex items-center gap-3 rounded-lg border p-4">
                {getIcon(challenge.type)}
                <div>
                  <p className="text-sm font-medium">Type</p>
                  <p className="text-sm text-muted-foreground capitalize">
                    {challenge.type}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3 rounded-lg border p-4">
                <Target className="h-5 w-5 text-primary" />
                <div>
                  <p className="text-sm font-medium">Goal</p>
                  <p className="text-sm text-muted-foreground">
                    {challenge.target.toLocaleString()} {challenge.unit}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3 rounded-lg border p-4 sm:col-span-2">
                <Users className="h-5 w-5 text-primary" />
                <div>
                  <p className="text-sm font-medium">Participants</p>
                  <p className="text-sm text-muted-foreground">
                    {challenge.participants.length} people have joined this
                    challenge.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Leaderboard
          ELIMINAMOS TODA ESTA SECCIÓN
        */}
      </div>
    </div>
  );
}