'use client';

interface ProposalResultsProps {
  yesVotes: number;
  noVotes: number;
  abstainVotes: number;
}

export function ProposalResults({ yesVotes, noVotes, abstainVotes }: ProposalResultsProps) {
  const totalVotes = yesVotes + noVotes + abstainVotes;
  
  const yesPercentage = totalVotes > 0 ? (yesVotes / totalVotes) * 100 : 0;
  const noPercentage = totalVotes > 0 ? (noVotes / totalVotes) * 100 : 0;
  const abstainPercentage = totalVotes > 0 ? (abstainVotes / totalVotes) * 100 : 0;

  return (
    <div className="space-y-4">
      <div className="flex justify-between text-sm font-medium">
        <span>Total Votes: {totalVotes}</span>
      </div>
      
      <div className="space-y-3">
        {/* Yes votes */}
        <div>
          <div className="flex justify-between text-sm mb-1">
            <span className="text-green-600">Yes</span>
            <span>{yesVotes} ({yesPercentage.toFixed(1)}%)</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-green-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${yesPercentage}%` }}
            />
          </div>
        </div>

        {/* No votes */}
        <div>
          <div className="flex justify-between text-sm mb-1">
            <span className="text-red-600">No</span>
            <span>{noVotes} ({noPercentage.toFixed(1)}%)</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-red-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${noPercentage}%` }}
            />
          </div>
        </div>

        {/* Abstain votes */}
        <div>
          <div className="flex justify-between text-sm mb-1">
            <span className="text-gray-600">Abstain</span>
            <span>{abstainVotes} ({abstainPercentage.toFixed(1)}%)</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-gray-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${abstainPercentage}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
