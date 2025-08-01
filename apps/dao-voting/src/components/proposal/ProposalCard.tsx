'use client';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ProposalAccount } from '@/lib/anchor-client';
import Link from 'next/link';

interface ProposalCardProps {
  proposal: ProposalAccount;
}

export function ProposalCard({ proposal }: ProposalCardProps) {
  const totalVotes = proposal.yesVotes + proposal.noVotes + proposal.abstainVotes;
  const yesPercentage = totalVotes > 0 ? (proposal.yesVotes / totalVotes) * 100 : 0;

  return (
    <Link href={`/proposal/${proposal.id}`}>
      <Card className="hover:shadow-md transition-shadow cursor-pointer">
        <CardHeader>
          <div className="flex justify-between items-start">
            <CardTitle className="text-lg">{proposal.title}</CardTitle>
            <Badge variant={proposal.status === 'active' ? 'default' : 'secondary'}>
              {proposal.status === 'active' ? 'Active' : 'Finalized'}
            </Badge>
          </div>
          <CardDescription className="line-clamp-2">
            {proposal.description}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Total Votes: {totalVotes}</span>
              <span>Yes: {yesPercentage.toFixed(1)}%</span>
            </div>
            <div className="flex gap-4 text-xs text-muted-foreground">
              <span>Yes: {proposal.yesVotes}</span>
              <span>No: {proposal.noVotes}</span>
              <span>Abstain: {proposal.abstainVotes}</span>
            </div>
            <div className="text-xs text-muted-foreground">
              Created: {new Date(proposal.createdAt * 1000).toLocaleDateString()}
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
