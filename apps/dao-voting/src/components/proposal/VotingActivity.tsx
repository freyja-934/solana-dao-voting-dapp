'use client';

import { UserAvatar } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useProposalVotingActivity } from '@/hooks/useProposalVotingActivity';
import { formatDate } from '@/utils/formatting';
import { Activity, CheckCircle, MinusCircle, XCircle } from 'lucide-react';

interface VotingActivityProps {
  proposalId: number;
}

export function VotingActivity({ proposalId }: VotingActivityProps) {
  const { data: activities, isLoading } = useProposalVotingActivity(proposalId);

  const getVoteIcon = (choice: 'yes' | 'no' | 'abstain') => {
    switch (choice) {
      case 'yes':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'no':
        return <XCircle className="h-4 w-4 text-red-600" />;
      case 'abstain':
        return <MinusCircle className="h-4 w-4 text-gray-600" />;
    }
  };

  const getVoteBadgeVariant = (choice: 'yes' | 'no' | 'abstain') => {
    switch (choice) {
      case 'yes':
        return 'default' as const;
      case 'no':
        return 'destructive' as const;
      case 'abstain':
        return 'secondary' as const;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="h-5 w-5" />
          Voting Activity
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="text-center py-8 text-muted-foreground">
            Loading voting activity...
          </div>
        ) : activities && activities.length > 0 ? (
          <div className="space-y-3">
            {activities.map((activity, index) => {
              const displayName = activity.user?.username || 
                `${activity.userWallet.slice(0, 4)}...${activity.userWallet.slice(-4)}`;
              
              return (
                <div key={`${activity.userWallet}-${index}`} 
                     className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                  <div className="flex items-center gap-3">
                    <UserAvatar address={activity.userWallet} size="sm" />
                    <div>
                      <p className="font-medium text-sm">{displayName}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatDate(activity.timestamp)}
                      </p>
                    </div>
                  </div>
                  <Badge 
                    variant={getVoteBadgeVariant(activity.choice)}
                    className="flex items-center gap-1"
                  >
                    {getVoteIcon(activity.choice)}
                    {activity.choice.toUpperCase()}
                  </Badge>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            No votes yet. Be the first to vote!
          </div>
        )}
      </CardContent>
    </Card>
  );
} 