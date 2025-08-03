'use client';

import { TestSupabase } from '@/components/debug/TestSupabase';
import { CreateProposalModal } from '@/components/proposal/CreateProposalModal';
import { ProposalCard } from '@/components/proposal/ProposalCard';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { useProposals } from '@/hooks/useProposals';
import { useProposalStats } from '@/hooks/useProposalStats';
import { useWallet } from '@solana/wallet-adapter-react';

export default function Home() {
  const { connected } = useWallet();
  const { data: proposals, isLoading, error } = useProposals();
  const { data: stats } = useProposalStats();

  return (
    <div className="container mx-auto px-4 py-8">
      <div>
          <h1 className="text-4xl font-bold mb-2">Governance</h1>
          <p className="text-muted-foreground">
            Vote on community proposals to shape the future of our DAO
          </p>
        </div>
      <div className="flex justify-between items-center my-8 gap-4">
        <Card className='grow'>
          <CardHeader>Total Proposals</CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{stats?.total || 0}</p>
          </CardContent>
        </Card>
        <Card className='grow'>
          <CardHeader>Live Proposals</CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{stats?.active || 0}</p>
          </CardContent>
        </Card>
        <Card className='grow'>
          <CardHeader>Proposals Passed</CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{stats?.passed || 0}</p>
          </CardContent>
        </Card>
        <Card className='grow'>
          <CardHeader>Proposals Rejected</CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{stats?.rejected || 0}</p>
          </CardContent>
        </Card>
      </div>
      <div className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-3xl font-bold mb-2">DAO Proposals</h2>
          <p className="text-muted-foreground">
            Vote on community proposals to shape the future of our DAO
          </p>
        </div>
        <CreateProposalModal />
      </div>


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

      {proposals && proposals.length > 0 && (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {proposals.map((proposal, index) => (
            <ProposalCard key={index} proposal={proposal} />
          ))}
        </div>
      )}

      {/* Temporary debug component */}
      <TestSupabase />
    </div>
  );
}
