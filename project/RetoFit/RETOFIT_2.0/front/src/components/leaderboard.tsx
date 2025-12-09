'use client';

import { useState, useEffect } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { Crown } from 'lucide-react';
import type { Challenge, ProgressLog, User } from '@/lib/data';
import { users as allUsers, progressLogs as allProgressLogs } from '@/lib/data';
import { cn } from '@/lib/utils';

type LeaderboardProps = {
  challenge: Challenge;
};

type LeaderboardEntry = {
  user: User;
  progress: number;
  rank: number;
};

export function Leaderboard({ challenge }: LeaderboardProps) {
  const [leaderboardData, setLeaderboardData] = useState<LeaderboardEntry[]>([]);

  const generateLeaderboard = () => {
    const participants = allUsers.filter((u) =>
      challenge.participants.includes(u.id)
    );

    const sortedData = participants
      .map((user) => {
        const progressLog = allProgressLogs.find(
          (p) => p.userId === user.id && p.challengeId === challenge.id
        );
        return { user, progress: progressLog?.progress || 0 };
      })
      .sort((a, b) => b.progress - a.progress)
      .map((item, index) => ({ ...item, rank: index + 1 }));

    return sortedData;
  };
  
  // Initial load
  useEffect(() => {
    setLeaderboardData(generateLeaderboard());
  }, [challenge.id]);

  // Simulate real-time updates
  useEffect(() => {
    const interval = setInterval(() => {
      setLeaderboardData((currentData) => {
        // Pick a random user to update, but not the first one to keep the current user's experience stable
        if (currentData.length < 2) return currentData;
        const randomIndex = Math.floor(Math.random() * (currentData.length -1)) + 1;
        
        const newData = [...currentData];
        const userToUpdate = newData[randomIndex];
        
        // Make a small random progress
        const randomProgress = Math.random() * (challenge.target / 100);
        const newProgress = Math.min(userToUpdate.progress + randomProgress, challenge.target);
        
        newData[randomIndex] = { ...userToUpdate, progress: newProgress };
        
        // Re-sort and re-rank
        return newData
          .sort((a, b) => b.progress - a.progress)
          .map((item, index) => ({ ...item, rank: index + 1 }));
      });
    }, 3000); // Update every 3 seconds

    return () => clearInterval(interval);
  }, [challenge.target]);

  return (
    <div className="w-full">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[50px]">Rank</TableHead>
              <TableHead>User</TableHead>
              <TableHead className="text-right">Progress</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {leaderboardData.map(({ user, progress, rank }) => {
              const progressPercentage = (progress / challenge.target) * 100;
              return (
                <TableRow key={user.id} className="transition-all duration-500">
                  <TableCell className="font-medium text-center">
                    {rank === 1 ? (
                      <Crown className="h-6 w-6 text-yellow-500" />
                    ) : (
                      rank
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="h-9 w-9">
                        <AvatarImage src={user.avatar} alt={user.name} />
                        <AvatarFallback>
                          {user.name.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="font-medium">{user.name}</div>
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex flex-col items-end gap-1">
                      <span className="font-semibold">{`${progress.toLocaleString()} / ${challenge.target.toLocaleString()} ${challenge.unit}`}</span>
                       <Progress value={progressPercentage} className="h-2 w-[100px]" />
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
    </div>
  );
}
