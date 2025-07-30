'use client';

import { ProposalResults } from '@/components/proposal/ProposalResults';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { VoteButton } from '@/components/vote/VoteButton';
import { useAnchorProvider } from '@/hooks/useAnchorProvider';
import { fetchProposal, proposalQueries } from '@/queries/proposalQueries';
import { formatAddress, formatDate } from '@/utils/formatting';
import { useWallet } from '@solana/wallet-adapter-react';
import { useQuery } from '@tanstack/react-query';
import { useParams, useRouter } from 'next/navigation';

export default function ProposalDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { connected } = useWallet();
  const { program } = useAnchorProvider();
  
  const proposalId = parseInt(params.id as string);

  const { data: proposal, isLoading, error } = useQuery({
    queryKey: proposalQueries.detail(proposalId, program),
    queryFn: () => {
      if (!program) throw new Error('Program not available');
      return fetchProposal(program, proposalId);
    },
    enabled: !!program && !isNaN(proposalId),
  });

  if (!connected) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center py-12">
          <p className="text-xl text-gray-600 mb-4">
            Connect your wallet to view proposal details
          </p>
          <Button onClick={() => router.push('/')}>
            Back to Proposals
          </Button>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center py-12">
          <p className="text-gray-600">Loading proposal...</p>
        </div>
      </div>
    );
  }

  if (error || !proposal) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center py-12">
          <p className="text-red-600 mb-4">Failed to load proposal</p>
          <Button onClick={() => router.push('/')}>
            Back to Proposals
          </Button>
        </div>
      </div>
    );
  }

  const isActive = 'active' in proposal.status;

  return (
    <div className="container mx-auto px-4 py-8">
      <Button
        variant="ghost"
        className="mb-6"
        onClick={() => router.push('/')}
      >
        ← Back to Proposals
      </Button>

      <div className="max-w-4xl mx-auto">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8">
          <div className="flex justify-between items-start mb-6">
            <h1 className="text-3xl font-bold">{proposal.title}</h1>
            <div className={`px-3 py-1 rounded-full text-sm ${
              isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
            }`}>
              {isActive ? 'Active' : 'Finalized'}
            </div>
          </div>

          <div className="prose max-w-none mb-8">
            <p className="text-gray-600 dark:text-gray-300">{proposal.description}</p>
          </div>

          <Separator className="my-6" />

          <div className="grid md:grid-cols-2 gap-8">
            <div>
              <h2 className="text-xl font-semibold mb-4">Proposal Information</h2>
              <dl className="space-y-2">
                <div>
                  <dt className="text-sm text-gray-500">Proposal ID</dt>
                  <dd className="font-medium">#{proposal.id.toString()}</dd>
                </div>
                <div>
                  <dt className="text-sm text-gray-500">Created By</dt>
                  <dd className="font-medium">{formatAddress(proposal.creator.toBase58())}</dd>
                </div>
                <div>
                  <dt className="text-sm text-gray-500">Created At</dt>
                  <dd className="font-medium">{formatDate(proposal.createdAt)}</dd>
                </div>
              </dl>
            </div>

            <div>
              <h2 className="text-xl font-semibold mb-4">Voting Results</h2>
              <ProposalResults
                yesVotes={proposal.yesVotes}
                noVotes={proposal.noVotes}
                abstainVotes={proposal.abstainVotes}
              />
            </div>
          </div>

          {isActive && (
            <>
              <Separator className="my-6" />
              <div>
                <h2 className="text-xl font-semibold mb-4">Cast Your Vote</h2>
                <div className="flex gap-4">
                  <VoteButton proposalId={proposalId} choice={{ yes: {} }} />
                  <VoteButton proposalId={proposalId} choice={{ no: {} }} />
                  <VoteButton proposalId={proposalId} choice={{ abstain: {} }} />
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
