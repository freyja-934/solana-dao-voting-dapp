'use client';

import { Button } from '@/components/ui/button';
import { ProposalAccount } from '@/lib/anchor-client';
import { formatDate } from '@/utils/formatting';
import Link from 'next/link';
import { ProposalResults } from './ProposalResults';

interface ProposalCardProps {
  proposal: ProposalAccount;
}

export const ProposalCard: React.FC<ProposalCardProps> = ({ proposal }) => {
  const totalVotes = proposal.yesVotes.add(proposal.noVotes).add(proposal.abstainVotes);
  const isActive = 'active' in proposal.status;

  return (
    <div className="border rounded-lg p-6 hover:shadow-lg transition-shadow">
      <div className="flex justify-between items-start mb-4">
        <div className="flex-1">
          <h3 className="text-xl font-semibold mb-2">{proposal.title}</h3>
          <p className="text-gray-600 line-clamp-2">{proposal.description}</p>
        </div>
        <div className={`px-3 py-1 rounded-full text-sm ${
          isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
        }`}>
          {isActive ? 'Active' : 'Finalized'}
        </div>
      </div>

      <ProposalResults
        yesVotes={proposal.yesVotes}
        noVotes={proposal.noVotes}
        abstainVotes={proposal.abstainVotes}
      />

      <div className="flex justify-between items-center mt-4">
        <span className="text-sm text-gray-500">
          Created {formatDate(proposal.createdAt)}
        </span>
        <Link href={`/proposal/${proposal.id.toString()}`}>
          <Button variant="outline" size="sm">
            View Details
          </Button>
        </Link>
      </div>
    </div>
  );
};
