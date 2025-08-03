'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useVotingPower } from '@/hooks/useVotingPower';
import { Activity, Award, MessageSquare, ThumbsUp, Vote } from 'lucide-react';

interface VotingPowerDisplayProps {
  walletAddress: string;
}

export function VotingPowerDisplay({ walletAddress }: VotingPowerDisplayProps) {
  const { data: votingPower, isLoading } = useVotingPower(walletAddress);

  if (isLoading || !votingPower) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Voting Power</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse h-20 bg-muted rounded" />
        </CardContent>
      </Card>
    );
  }

  const powerItems = [
    { 
      label: 'Base Power', 
      value: votingPower.base, 
      icon: Vote,
      description: 'Everyone starts with 1'
    },
    { 
      label: 'From Upvotes', 
      value: votingPower.fromUpvotes, 
      icon: ThumbsUp,
      description: `${votingPower.fromUpvotes * 10}+ upvotes received`
    },
    { 
      label: 'From Proposals', 
      value: votingPower.fromProposals, 
      icon: Award,
      description: `${votingPower.fromProposals / 2} proposals created`
    },
    { 
      label: 'From Voting', 
      value: votingPower.fromVotes, 
      icon: Activity,
      description: `${votingPower.fromVotes * 5}+ votes cast`
    },
    { 
      label: 'From Comments', 
      value: votingPower.fromComments, 
      icon: MessageSquare,
      description: `${votingPower.fromComments * 10}+ comments made`
    },
  ];

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center justify-between">
          <span>Voting Power</span>
          <span className="text-3xl font-bold text-primary">{votingPower.total}</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {powerItems.filter(item => item.value > 0).map((item, index) => {
            const Icon = item.icon;
            return (
              <div key={index} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <Icon className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">{item.label}</span>
                </div>
                <div className="text-right">
                  <span className="font-medium">+{item.value}</span>
                  <p className="text-xs text-muted-foreground">{item.description}</p>
                </div>
              </div>
            );
          })}
        </div>
        <div className="mt-4 pt-3 border-t">
          <p className="text-xs text-muted-foreground text-center">
            Your voting power affects how much weight your vote carries
          </p>
        </div>
      </CardContent>
    </Card>
  );
} 