import Image from 'next/image';
import Link from 'next/link';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import type { Challenge } from '@/lib/data';
import { Users } from 'lucide-react';

type ChallengeCardProps = {
  challenge: Challenge;
};

export function ChallengeCard({ challenge }: ChallengeCardProps) {
  // Manejo de participantes por defecto si no viene de la API
  const participantCount = challenge.participants?.length || 0;

  return (
    <Card className="flex h-full flex-col overflow-hidden transition-all hover:shadow-lg">
      <CardHeader className="p-0">
        <div className="relative h-48 w-full">
          <Image
            // --- CORRECCIÓN AQUÍ ---
            // Usamos `challenge.image_url` y proporcionamos una imagen de respaldo
            src={challenge.image_url || '/placeholder.png'} 
            // Usamos el nombre del reto como texto alternativo
            alt={challenge.name} 
            fill
            className="object-cover"
          />
        </div>
      </CardHeader>
      <CardContent className="flex-grow p-6">
        <Badge variant="secondary" className="mb-2 capitalize">
          {challenge.type}
        </Badge>
        <CardTitle className="mb-2 text-xl font-bold">{challenge.name}</CardTitle>
        <CardDescription className="line-clamp-3">
          {challenge.description}
        </CardDescription>
      </CardContent>
      <CardFooter className="flex justify-between p-6 pt-0">
        <div className="flex items-center text-sm text-muted-foreground">
          <Users className="mr-2 h-4 w-4" />
          <span>{participantCount} Participants</span>
        </div>
        <Button asChild>
          <Link href={`/dashboard/challenges/${challenge.id}`}>View Details</Link>
        </Button>
      </CardFooter>
    </Card>
  );
}