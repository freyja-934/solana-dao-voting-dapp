'use client';

import { CreateProposalModal } from '@/components/proposal/CreateProposalModal';
import { ProposalCard } from '@/components/proposal/ProposalCard';
import { ProposalCardSkeleton } from '@/components/proposal/ProposalCardSkeleton';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { useProposals } from '@/hooks/useProposals';
import { useProposalStats } from '@/hooks/useProposalStats';
import { useWallet } from '@solana/wallet-adapter-react';
import { AlertCircle } from 'lucide-react';

export default function Home() {
  const { connected } = useWallet();
  const { data: proposals, isLoading, error } = useProposals();
  const { data: stats } = useProposalStats();

  return (
    <div className="container mx-auto px-6 sm:px-8 lg:px-10 py-8 md:py-12 max-w-7xl">
      {/* Page Header */}
      <header className="mb-8 md:mb-12">
        <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-3">
          Governance
        </h1>
        <p className="text-muted-foreground text-lg md:text-xl max-w-3xl">
          Vote on community proposals to shape the future of our DAO
        </p>
      </header>

      {/* Create Proposal Button - Only show when connected */}
      {connected && (
        <section className="mb-8 md:mb-10">
          <CreateProposalModal />
        </section>
      )}

      {/* Stats Cards */}
      {stats && (
        <section className="mb-8 md:mb-12" aria-label="Proposal statistics">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="pb-2 px-4 pt-4">
                <p className="text-sm font-medium text-muted-foreground">Total Proposals</p>
              </CardHeader>
              <CardContent className="px-4 pb-4">
                <p className="text-2xl font-bold">{stats.total}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2 px-4 pt-4">
                <p className="text-sm font-medium text-muted-foreground">Live Proposals</p>
              </CardHeader>
              <CardContent className="px-4 pb-4">
                <p className="text-2xl font-bold text-green-600">{stats.active}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2 px-4 pt-4">
                <p className="text-sm font-medium text-muted-foreground">Proposals Passed</p>
              </CardHeader>
              <CardContent className="px-4 pb-4">
                <p className="text-2xl font-bold text-blue-600">{stats.passed}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2 px-4 pt-4">
                <p className="text-sm font-medium text-muted-foreground">Proposals Rejected</p>
              </CardHeader>
              <CardContent className="px-4 pb-4">
                <p className="text-2xl font-bold text-red-600">{stats.rejected}</p>
              </CardContent>
            </Card>
          </div>
        </section>
      )}

      {/* Loading State */}
      {isLoading && (
        <section aria-busy="true" aria-label="Loading proposals">
          <h2 className="text-xl md:text-2xl font-semibold mb-6">Loading Proposals...</h2>
          <div className="grid gap-6 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
            {[...Array(6)].map((_, i) => (
              <ProposalCardSkeleton key={i} />
            ))}
          </div>
        </section>
      )}

      {/* Error State */}
      {error && (
        <section className="my-12">
          <Card className="border-destructive max-w-2xl mx-auto">
            <CardContent className="pt-6 pb-6 text-center">
              <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
              <h2 className="text-lg font-semibold mb-2">Unable to Load Proposals</h2>
              <p className="text-muted-foreground">
                Failed to load proposals. Please check your connection and try refreshing the page.
              </p>
            </CardContent>
          </Card>
        </section>
      )}

      {/* Empty State */}
      {connected && proposals && proposals.length === 0 && !isLoading && (
        <section className="my-12">
          <Card className="max-w-2xl mx-auto">
            <CardContent className="py-12 text-center">
              <h2 className="text-lg font-semibold mb-2">No Proposals Yet</h2>
              <p className="text-muted-foreground">
                Be the first to create a proposal and start shaping the future of our DAO!
              </p>
            </CardContent>
          </Card>
        </section>
      )}

      {/* Proposals List */}
      {proposals && proposals.length > 0 && !isLoading && (
        <>
          {/* Active Proposals */}
          {(() => {
            const now = Math.floor(Date.now() / 1000);
            const activeProposals = proposals.filter(p => p.status === 'active' && p.expiresAt > now);
            const expiredProposals = proposals.filter(p => p.status !== 'active' || p.expiresAt <= now);
            
            return (
              <>
                {activeProposals.length > 0 && (
                  <section className="mb-10 md:mb-12" id="proposals" aria-label="Active proposals">
                    <h2 className="text-xl md:text-2xl font-semibold mb-6">
                      Active Proposals
                    </h2>
                    <div className="grid gap-6 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
                      {activeProposals.map((proposal) => (
                        <ProposalCard key={proposal.id} proposal={proposal} />
                      ))}
                    </div>
                  </section>
                )}
                
                {expiredProposals.length > 0 && (
                  <section aria-label="Past proposals">
                    <h2 className="text-xl md:text-2xl font-semibold mb-6 text-muted-foreground">
                      Past Proposals
                    </h2>
                    <div className="grid gap-6 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
                      {expiredProposals.map((proposal) => (
                        <ProposalCard key={proposal.id} proposal={proposal} />
                      ))}
                    </div>
                  </section>
                )}
              </>
            );
          })()}
        </>
      )}
    </div>
  );
}
