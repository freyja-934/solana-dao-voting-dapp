'use client';

import { UserAvatar } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
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
        return <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4 text-green-600" />;
      case 'no':
        return <XCircle className="h-3 w-3 sm:h-4 sm:w-4 text-red-600" />;
      case 'abstain':
        return <MinusCircle className="h-3 w-3 sm:h-4 sm:w-4 text-gray-600" />;
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
      <CardHeader className="pb-3 sm:pb-6">
        <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
          <Activity className="h-4 w-4 sm:h-5 sm:w-5" />
          <span>Voting Activity</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                <div className="flex items-center gap-3">
                  <Skeleton className="h-8 w-8 rounded-full" />
                  <div>
                    <Skeleton className="h-4 w-24 mb-1" />
                    <Skeleton className="h-3 w-16" />
                  </div>
                </div>
                <Skeleton className="h-6 w-16" />
              </div>
            ))}
          </div>
        ) : activities && activities.length > 0 ? (
          <div className="space-y-2 sm:space-y-3">
            {activities.map((activity, index) => {
              const displayName = activity.user?.username || 
                `${activity.userWallet.slice(0, 4)}...${activity.userWallet.slice(-4)}`;
              
              return (
                <div key={`${activity.userWallet}-${index}`} 
                     className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 p-2 sm:p-3 rounded-lg bg-muted/50">
                  <div className="flex items-center gap-2 sm:gap-3">
                    <UserAvatar address={activity.userWallet} size="sm" />
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-xs sm:text-sm truncate">{displayName}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatDate(activity.timestamp)}
                      </p>
                    </div>
                  </div>
                  <Badge 
                    variant={getVoteBadgeVariant(activity.choice)}
                    className="flex items-center gap-1 self-start sm:self-center"
                  >
                    {getVoteIcon(activity.choice)}
                    <span className="text-xs">{activity.choice.toUpperCase()}</span>
                  </Badge>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-6 sm:py-8 text-muted-foreground">
            <Activity className="h-8 w-8 sm:h-10 sm:w-10 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No votes yet</p>
            <p className="text-xs mt-1">Be the first to vote!</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
} 