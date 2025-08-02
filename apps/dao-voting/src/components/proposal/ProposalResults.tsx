'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ProposalAccount } from '@/lib/anchor-client';
import { calculateVotePercentage } from '@/utils/formatting';

interface ProposalResultsProps {
  proposal: ProposalAccount;
}

export function ProposalResults({ proposal }: ProposalResultsProps) {
  const { yesVotes, noVotes, abstainVotes } = proposal;
  const totalVotes = yesVotes + noVotes + abstainVotes;
  
  const yesPercentage = calculateVotePercentage(yesVotes, totalVotes);
  const noPercentage = calculateVotePercentage(noVotes, totalVotes);
  const abstainPercentage = calculateVotePercentage(abstainVotes, totalVotes);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Voting Results</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-green-600 font-medium">Yes</span>
            <span className="text-muted-foreground">{yesVotes} votes ({yesPercentage}%)</span>
          </div>
          <div className="w-full bg-secondary rounded-full h-2">
            <div
              className="bg-green-600 h-2 rounded-full transition-all"
              style={{ width: `${yesPercentage}%` }}
            />
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-red-600 font-medium">No</span>
            <span className="text-muted-foreground">{noVotes} votes ({noPercentage}%)</span>
          </div>
          <div className="w-full bg-secondary rounded-full h-2">
            <div
              className="bg-red-600 h-2 rounded-full transition-all"
              style={{ width: `${noPercentage}%` }}
            />
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-gray-600 font-medium">Abstain</span>
            <span className="text-muted-foreground">{abstainVotes} votes ({abstainPercentage}%)</span>
          </div>
          <div className="w-full bg-secondary rounded-full h-2">
            <div
              className="bg-gray-600 h-2 rounded-full transition-all"
              style={{ width: `${abstainPercentage}%` }}
            />
          </div>
        </div>

        <div className="pt-4 border-t">
          <div className="flex justify-between text-sm">
            <span className="font-medium">Total Votes</span>
            <span className="text-muted-foreground">{totalVotes}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
