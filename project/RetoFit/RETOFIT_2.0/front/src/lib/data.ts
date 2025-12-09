import type { ImagePlaceholder } from './placeholder-images';
import { PlaceHolderImages } from './placeholder-images';

export type User = {
  id: string;
  name: string;
  avatar: string;
};

export type Challenge = {
  id: string;
  name: string;
  description: string;
  type: 'steps' | 'distance' | 'time';
  target: number;
  unit: 'steps' | 'km' | 'hours';
  participants: string[]; // array of user IDs
  image?: any; // Hacer el `image` estático opcional
  image_url?: string | null; // Añadir el campo que viene de la API
};

export type ProgressLog = {
  userId: string;
  challengeId: string;
  progress: number;
  date: Date;
};

export const users: User[] = [
  { id: 'user-1', name: 'Alex', avatar: '/avatars/01.png' },
  { id: 'user-2', name: 'Maria', avatar: '/avatars/02.png' },
  { id: 'user-3', name: 'David', avatar: '/avatars/03.png' },
  { id: 'user-4', name: 'Sophia', avatar: '/avatars/04.png' },
  { id: 'user-5', name: 'Ken', avatar: '/avatars/05.png' },
];

export const challenges: Challenge[] = [
  {
    id: 'challenge-1',
    name: '10,000 Steps a Day',
    description: 'Walk at least 10,000 steps every day for a month.',
    type: 'steps',
    target: 300000,
    unit: 'steps',
    participants: ['user-1', 'user-2', 'user-3', 'user-4', 'user-5'],
    image: PlaceHolderImages.find((img) => img.id === 'steps-challenge-1')!,
  },
  {
    id: 'challenge-2',
    name: 'Weekend Cyclist',
    description: 'Cycle 50km over the weekend.',
    type: 'distance',
    target: 50,
    unit: 'km',
    participants: ['user-1', 'user-3', 'user-5'],
    image: PlaceHolderImages.find((img) => img.id === 'cycling-challenge-1')!,
  },
  {
    id: 'challenge-3',
    name: 'Marathon Prep',
    description: 'Run a total of 100km in two weeks.',
    type: 'distance',
    target: 100,
    unit: 'km',
    participants: ['user-2', 'user-4'],
    image: PlaceHolderImages.find((img) => img.id === 'marathon-prep-1')!,
  },
  {
    id: 'challenge-4',
    name: 'Strength Builder',
    description: 'Complete 20 hours of weightlifting this month.',
    type: 'time',
    target: 20,
    unit: 'hours',
    participants: ['user-1', 'user-2', 'user-3', 'user-4', 'user-5'],
    image: PlaceHolderImages.find(
      (img) => img.id === 'weightlifting-challenge-1'
    )!,
  },
];

export const progressLogs: ProgressLog[] = [
  // Challenge 1
  { userId: 'user-1', challengeId: 'challenge-1', progress: 150000, date: new Date() },
  { userId: 'user-2', challengeId: 'challenge-1', progress: 250000, date: new Date() },
  { userId: 'user-3', challengeId: 'challenge-1', progress: 95000, date: new Date() },
  { userId: 'user-4', challengeId: 'challenge-1', progress: 290000, date: new Date() },
  { userId: 'user-5', challengeId: 'challenge-1', progress: 180000, date: new Date() },

  // Challenge 2
  { userId: 'user-1', challengeId: 'challenge-2', progress: 45, date: new Date() },
  { userId: 'user-3', challengeId: 'challenge-2', progress: 25, date: new Date() },
  { userId: 'user-5', challengeId: 'challenge-2', progress: 50, date: new Date() },

  // Challenge 3
  { userId: 'user-2', challengeId: 'challenge-3', progress: 80, date: new Date() },
  { userId: 'user-4', challengeId: 'challenge-3', progress: 100, date: new Date() },
  
  // Challenge 4
  { userId: 'user-1', challengeId: 'challenge-4', progress: 15, date: new Date() },
  { userId: 'user-2', challengeId: 'challenge-4', progress: 18, date: new Date() },
  { userId: 'user-3', challengeId: 'challenge-4', progress: 5, date: new Date() },
  { userId: 'user-4', challengeId: 'challenge-4', progress: 19, date: new Date() },
  { userId: 'user-5', challengeId: 'challenge-4', progress: 12, date: new Date() },
];
