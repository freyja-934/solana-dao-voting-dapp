'use client';

import { CreateProposalModal } from '@/components/proposal/CreateProposalModal';
import { ProposalCard } from '@/components/proposal/ProposalCard';
import { ProposalCardSkeleton } from '@/components/proposal/ProposalCardSkeleton';
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

      {connected && (
        <div className="my-8">
          <CreateProposalModal />
        </div>
      )}

      {/* Stats Cards */}
      {stats && (
        <div className="grid gap-4 md:grid-cols-4 mb-8">
          <Card>
            <CardHeader className="pb-3">
              <p className="text-sm text-muted-foreground">Total Proposals</p>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{stats.total}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <p className="text-sm text-muted-foreground">Live Proposals</p>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-green-600">{stats.active}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <p className="text-sm text-muted-foreground">Proposals Passed</p>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-blue-600">{stats.passed}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <p className="text-sm text-muted-foreground">Proposals Rejected</p>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-red-600">{stats.rejected}</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Loading State */}
      {isLoading && (
        <div className="space-y-8">
          <div>
            <h2 className="text-2xl font-bold mb-4">Loading Proposals...</h2>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {[...Array(6)].map((_, i) => (
                <ProposalCardSkeleton key={i} />
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Error State */}
      {error && (
        <Card className="border-destructive">
          <CardContent className="pt-6">
            <p className="text-center text-destructive">
              Failed to load proposals. Please try refreshing the page.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Empty State */}
      {connected && proposals && proposals.length === 0 && !isLoading && (
        <Card>
          <CardContent className="py-12">
            <p className="text-center text-muted-foreground mb-4">
              No proposals yet. Be the first to create one!
            </p>
          </CardContent>
        </Card>
      )}

      {/* Proposals List */}
      {proposals && proposals.length > 0 && !isLoading && (
        <div className="space-y-8">
          {/* Active Proposals */}
          {(() => {
            const now = Math.floor(Date.now() / 1000);
            const activeProposals = proposals.filter(p => p.status === 'active' && p.expiresAt > now);
            const expiredProposals = proposals.filter(p => p.status !== 'active' || p.expiresAt <= now);
            
            return (
              <>
                {activeProposals.length > 0 && (
                  <div>
                    <h2 className="text-2xl font-bold mb-4">Active Proposals</h2>
                    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                      {activeProposals.map((proposal) => (
                        <ProposalCard key={proposal.id} proposal={proposal} />
                      ))}
                    </div>
                  </div>
                )}
                
                {expiredProposals.length > 0 && (
                  <div>
                    <h2 className="text-2xl font-bold mb-4 text-muted-foreground">Past Proposals</h2>
                    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                      {expiredProposals.map((proposal) => (
                        <ProposalCard key={proposal.id} proposal={proposal} />
                      ))}
                    </div>
                  </div>
                )}
              </>
            );
          })()}
        </div>
      )}
    </div>
  );
}
