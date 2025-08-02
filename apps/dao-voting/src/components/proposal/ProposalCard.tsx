'use client';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { ProposalAccount } from '@/lib/anchor-client';
import { formatDate, formatTimeRemaining, isProposalExpired } from '@/utils/formatting';
import { Clock } from 'lucide-react';
import Link from 'next/link';

interface ProposalCardProps {
  proposal: ProposalAccount;
}

export function ProposalCard({ proposal }: ProposalCardProps) {
  const totalVotes = proposal.yesVotes + proposal.noVotes + proposal.abstainVotes;
  const isActive = proposal.status === 'active';
  const expired = isActive && isProposalExpired(proposal.expiresAt);

  return (
    <Link href={`/proposal/${proposal.id}`}>
      <Card className="transition-colors hover:bg-accent cursor-pointer">
        <CardHeader>
          <div className="flex items-start justify-between">
            <CardTitle className="text-xl">{proposal.title}</CardTitle>
            <Badge 
              variant={
                !isActive ? 'secondary' : 
                expired ? 'destructive' : 
                'default'
              }
            >
              {!isActive ? 'Finalized' : expired ? 'Expired' : 'Active'}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground line-clamp-2">{proposal.description}</p>
          <div className="mt-4 space-y-2">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Clock className="h-4 w-4" />
              {isActive && !expired ? (
                <span className="text-primary">{formatTimeRemaining(proposal.expiresAt)}</span>
              ) : (
                <span>Ended {formatDate(proposal.expiresAt)}</span>
              )}
            </div>
          </div>
        </CardContent>
        <CardFooter>
          <div className="flex items-center gap-4 w-full text-sm">
            <div className="flex items-center gap-1">
              <span className="font-medium text-green-600">{proposal.yesVotes}</span>
              <span className="text-muted-foreground">Yes</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="font-medium text-red-600">{proposal.noVotes}</span>
              <span className="text-muted-foreground">No</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="font-medium text-gray-600">{proposal.abstainVotes}</span>
              <span className="text-muted-foreground">Abstain</span>
            </div>
            <div className="ml-auto text-muted-foreground">
              {totalVotes} {totalVotes === 1 ? 'vote' : 'votes'}
            </div>
          </div>
        </CardFooter>
      </Card>
    </Link>
  );
}
