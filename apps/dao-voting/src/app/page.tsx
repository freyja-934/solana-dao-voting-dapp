'use client';

import { CreateProposalModal } from '@/components/proposal/CreateProposalModal';
import { ProposalCard } from '@/components/proposal/ProposalCard';
import { useProposals } from '@/hooks/useProposals';
import { useWallet } from '@solana/wallet-adapter-react';

export default function Home() {
  const { connected } = useWallet();
  const { data: proposals, isLoading, error } = useProposals();

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-4xl font-bold mb-2">DAO Proposals</h1>
          <p className="text-muted-foreground">
            Vote on community proposals to shape the future of our DAO
          </p>
        </div>
        <CreateProposalModal />
      </div>

      {!connected && (
        <div className="text-center py-12">
          <p className="text-xl text-muted-foreground mb-4">
            Connect your wallet to view and create proposals
          </p>
        </div>
      )}

      {connected && isLoading && (
        <div className="text-center py-12">
          <p className="text-muted-foreground">Loading proposals...</p>
        </div>
      )}

      {connected && error && (
        <div className="text-center py-12">
          <p className="text-destructive">Failed to load proposals. Please try again later.</p>
        </div>
      )}

      {connected && proposals && proposals.length === 0 && (
        <div className="text-center py-12">
          <p className="text-muted-foreground mb-4">No proposals yet. Be the first to create one!</p>
        </div>
      )}

      {connected && proposals && proposals.length > 0 && (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {proposals.map((proposal, index) => (
            <ProposalCard key={index} proposal={proposal} />
          ))}
        </div>
      )}
    </div>
  );
}
