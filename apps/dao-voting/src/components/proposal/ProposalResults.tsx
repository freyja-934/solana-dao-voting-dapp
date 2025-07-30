'use client';

import { calculateVotePercentage } from '@/utils/formatting';
import { BN } from '@coral-xyz/anchor';

interface ProposalResultsProps {
  yesVotes: BN;
  noVotes: BN;
  abstainVotes: BN;
}

export const ProposalResults: React.FC<ProposalResultsProps> = ({
  yesVotes,
  noVotes,
  abstainVotes,
}) => {
  const totalVotes = yesVotes.add(noVotes).add(abstainVotes);
  const hasVotes = totalVotes.gt(new BN(0));

  const yesPercent = calculateVotePercentage(yesVotes, totalVotes);
  const noPercent = calculateVotePercentage(noVotes, totalVotes);
  const abstainPercent = calculateVotePercentage(abstainVotes, totalVotes);

  return (
    <div className="space-y-3">
      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span>Yes</span>
          <span>{yesVotes.toString()} ({yesPercent}%)</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="bg-green-500 h-2 rounded-full transition-all"
            style={{ width: `${yesPercent}%` }}
          />
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span>No</span>
          <span>{noVotes.toString()} ({noPercent}%)</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="bg-red-500 h-2 rounded-full transition-all"
            style={{ width: `${noPercent}%` }}
          />
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span>Abstain</span>
          <span>{abstainVotes.toString()} ({abstainPercent}%)</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="bg-gray-500 h-2 rounded-full transition-all"
            style={{ width: `${abstainPercent}%` }}
          />
        </div>
      </div>

      {!hasVotes && (
        <p className="text-center text-gray-500 text-sm mt-4">No votes yet</p>
      )}
    </div>
  );
};
