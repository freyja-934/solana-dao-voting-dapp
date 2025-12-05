---
id: frontend-architecture
title: Frontend Architecture
sidebar_label: Frontend Architecture
---

# Frontend Architecture

The DAO Voting Platform frontend is built with Next.js 14 and modern React patterns, providing a seamless interface for blockchain governance. This document outlines the technical architecture, design patterns, and implementation details.

## Technology Stack

### Core Framework
- **Next.js 14 with App Router**: Server-side rendering and optimal performance
- **React 19**: Latest features including Server Components
- **TypeScript 5.3**: Type safety across 50+ components
- **Node.js 18+**: Runtime environment

### Styling & UI
- **TailwindCSS 4**: Utility-first CSS framework
- **Radix UI**: Unstyled, accessible component primitives
- **Lucide Icons**: Consistent icon system
- **CSS Modules**: Component-scoped styles when needed

### Blockchain Integration
- **@solana/web3.js**: Core Solana interactions
- **@coral-xyz/anchor**: Type-safe program calls
- **@solana/wallet-adapter**: Wallet connection management
- **bs58**: Base58 encoding for keys

### State & Data Management
- **React Query (TanStack Query)**: Server state management with 5-minute cache
- **React Context**: Global client state
- **Zustand**: Complex state management (future)

### Off-Chain Services
- **Supabase Client**: Database and authentication
- **NextAuth**: Session management
- **React Hook Form**: Form state management

## Core Design Patterns

### 1. Wallet Integration Pattern

The application uses Solana Wallet Adapter with a custom provider architecture for seamless blockchain interactions.

```typescript
// WalletContextProvider Configuration
export function WalletContextProvider({ children }: Props) {
  const wallets = useMemo(
    () => [
      new PhantomWalletAdapter(),
      new BackpackWalletAdapter(),
      new SolflareWalletAdapter(),
    ],
    []
  );

  return (
    <ConnectionProvider endpoint={RPC_ENDPOINT}>
      <WalletProvider wallets={wallets} autoConnect>
        <WalletModalProvider>
          {children}
        </WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  );
}
```

**Key Features**:
- Auto-connects to previously used wallet
- Supports Phantom, Backpack, Solflare wallets
- Graceful degradation for read-only access
- Custom `useAnchorProvider` hook for program interactions
- Wallet state persistence in localStorage

### 2. Data Fetching Strategy

Three-layer data architecture for optimal performance and UX:

#### Layer 1: On-Chain Data
Direct blockchain queries via Anchor for authoritative data:
```typescript
// Custom hook for proposal fetching
export function useProposals() {
  return useQuery({
    queryKey: ['proposals', daoAccount],
    queryFn: async () => {
      const proposals = await program.account.proposal.all([
        {
          memcmp: {
            offset: 8,
            bytes: daoAccount.toBase58(),
          },
        },
      ]);
      return proposals;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}
```

#### Layer 2: Off-Chain Data
Supabase for supplementary information:
```typescript
// Fetching comments from Supabase
export function useComments(proposalId: string) {
  return useQuery({
    queryKey: ['comments', proposalId],
    queryFn: async () => {
      const { data } = await supabase
        .from('comments')
        .select('*')
        .eq('proposal_id', proposalId)
        .order('created_at', { ascending: false });
      return data;
    },
  });
}
```

#### Layer 3: Hybrid Synchronization
React Query manages both sources with intelligent caching:
- Optimistic updates for better UX
- Background refetching every 30 seconds
- Stale-while-revalidate strategy
- Automatic retry with exponential backoff

### 3. Component Organization

```
/components
├── ui/                 # Reusable primitives
│   ├── Button.tsx     # Base button component
│   ├── Card.tsx       # Card container
│   ├── Dialog.tsx     # Modal dialogs
│   └── Input.tsx      # Form inputs
├── wallet/            # Wallet components
│   └── WalletButton.tsx
├── proposal/          # Proposal features
│   ├── ProposalCard.tsx
│   ├── CreateProposalModal.tsx
│   └── ProposalResults.tsx
├── voting/            # Voting interface
│   ├── VoteButton.tsx
│   ├── VotingPowerDisplay.tsx
│   └── VotingEligibilityBadge.tsx
├── profile/           # User management
│   └── ProfileSettingsModal.tsx
└── providers/         # Context providers
    ├── AppProviders.tsx
    └── WalletContextProvider.tsx
```

### 4. State Management

**Server State (React Query)**:
```typescript
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,      // Consider data fresh for 5 minutes
      gcTime: 10 * 60 * 1000,        // Keep in cache for 10 minutes
      refetchOnWindowFocus: true,     // Refetch when user returns
      retry: 3,                        // Retry failed requests 3 times
    },
    mutations: {
      retry: 1,                        // Retry mutations once
      onError: handleGlobalError,     // Global error handler
    },
  },
});
```

**Client State (React Context)**:
```typescript
// User context for profile management
export const UserContext = createContext<UserContextType>({
  user: null,
  isLoading: false,
  updateProfile: async () => {},
});

// Wallet state via Solana Wallet Adapter
const { publicKey, connected, signTransaction } = useWallet();
```

**Form State (Controlled Components)**:
```typescript
// Proposal creation form
const [title, setTitle] = useState('');
const [description, setDescription] = useState('');
const [errors, setErrors] = useState<ValidationErrors>({});

const validateForm = () => {
  const newErrors: ValidationErrors = {};
  if (title.length > 100) newErrors.title = 'Title too long';
  if (description.length > 500) newErrors.description = 'Description too long';
  return Object.keys(newErrors).length === 0;
};
```

**URL State (Next.js Router)**:
```typescript
// Using URL params for filtering
const searchParams = useSearchParams();
const status = searchParams.get('status') || 'all';
const sort = searchParams.get('sort') || 'recent';
```

### 5. Key Custom Hooks

#### useProposals
Fetches and caches proposal list with real-time updates:
```typescript
export function useProposals(filters?: ProposalFilters) {
  const { program } = useAnchorProvider();
  
  return useQuery({
    queryKey: ['proposals', filters],
    queryFn: async () => {
      const proposals = await fetchProposals(program, filters);
      return sortProposals(proposals, filters?.sort);
    },
    refetchInterval: 30000, // Refetch every 30 seconds
  });
}
```

#### useVote
Handles vote submission with optimistic updates:
```typescript
export function useVote() {
  const queryClient = useQueryClient();
  const { program } = useAnchorProvider();
  
  return useMutation({
    mutationFn: async ({ proposalId, voteType, weight }) => {
      return await castVote(program, proposalId, voteType, weight);
    },
    onMutate: async (variables) => {
      // Optimistic update
      await queryClient.cancelQueries(['proposals']);
      const previous = queryClient.getQueryData(['proposals']);
      
      queryClient.setQueryData(['proposals'], (old) => {
        // Update vote counts optimistically
        return updateProposalVotes(old, variables);
      });
      
      return { previous };
    },
    onError: (err, variables, context) => {
      // Rollback on error
      queryClient.setQueryData(['proposals'], context.previous);
      toast.error('Vote failed. Please try again.');
    },
    onSettled: () => {
      // Refetch to ensure consistency
      queryClient.invalidateQueries(['proposals']);
    },
  });
}
```

#### useVotingPower
Calculates user's voting weight based on holdings:
```typescript
export function useVotingPower() {
  const { publicKey } = useWallet();
  const { dao } = useDAO();
  
  return useQuery({
    queryKey: ['voting-power', publicKey?.toBase58()],
    queryFn: async () => {
      if (!publicKey) return 0;
      
      if (dao.votingToken) {
        // Token-based voting
        const tokenAccount = await getTokenAccount(publicKey, dao.votingToken);
        return tokenAccount.amount;
      } else if (dao.nftCollection) {
        // NFT-based voting
        const nfts = await getNFTsByOwner(publicKey, dao.nftCollection);
        return nfts.length;
      } else {
        // One wallet, one vote
        return 1;
      }
    },
    enabled: !!publicKey,
  });
}
```

#### useVotingEligibility
Checks if user meets voting requirements:
```typescript
export function useVotingEligibility() {
  const { votingPower } = useVotingPower();
  const { dao } = useDAO();
  
  const isEligible = useMemo(() => {
    if (!votingPower) return false;
    if (dao.nftCollection && votingPower === 0) return false;
    if (dao.minTokensRequired && votingPower < dao.minTokensRequired) return false;
    return true;
  }, [votingPower, dao]);
  
  return { isEligible, votingPower };
}
```

#### useDAORequirements
Fetches current DAO configuration and rules:
```typescript
export function useDAORequirements() {
  const { program } = useAnchorProvider();
  
  return useQuery({
    queryKey: ['dao-requirements'],
    queryFn: async () => {
      const dao = await program.account.dao.fetch(DAO_ACCOUNT);
      return {
        minVotes: dao.minVotesRequired.toNumber(),
        votingPeriod: dao.votingPeriod.toNumber(),
        nftCollection: dao.nftCollection,
        votingToken: dao.votingToken,
      };
    },
    staleTime: Infinity, // DAO config rarely changes
  });
}
```

## Performance Optimizations

### Static Generation
Marketing and informational pages use SSG:
```typescript
// app/about/page.tsx
export const dynamic = 'force-static';
export const revalidate = 86400; // Revalidate daily
```

### Dynamic Imports
Wallet libraries loaded only when needed:
```typescript
const WalletMultiButton = dynamic(
  () => import('@solana/wallet-adapter-react-ui').then(mod => mod.WalletMultiButton),
  { 
    ssr: false,
    loading: () => <WalletButtonSkeleton />
  }
);
```
**Result**: 50% smaller initial bundle size

### Image Optimization
Next.js Image component for automatic optimization:
```typescript
<Image
  src="/proposal-banner.png"
  alt="Proposal"
  width={800}
  height={400}
  priority={isAboveFold}
  placeholder="blur"
  blurDataURL={generateBlurDataURL()}
/>
```

### Suspense Boundaries
Async components with loading states:
```typescript
<Suspense fallback={<ProposalListSkeleton />}>
  <ProposalList />
</Suspense>
```

### Memoization
Expensive calculations cached:
```typescript
const votingPercentage = useMemo(() => {
  const total = votesFor + votesAgainst + votesAbstain;
  if (total === 0) return { for: 0, against: 0, abstain: 0 };
  
  return {
    for: (votesFor / total) * 100,
    against: (votesAgainst / total) * 100,
    abstain: (votesAbstain / total) * 100,
  };
}, [votesFor, votesAgainst, votesAbstain]);
```

## Error Handling

### Error Boundary
Global error catching at app level:
```typescript
export function ErrorBoundary({ children }: { children: ReactNode }) {
  return (
    <ReactErrorBoundary
      fallback={<ErrorFallback />}
      onReset={() => window.location.reload()}
    >
      {children}
    </ReactErrorBoundary>
  );
}
```

### Toast Notifications
User-friendly error messages:
```typescript
toast.error('Failed to submit vote', {
  description: 'Please check your wallet connection and try again.',
  action: {
    label: 'Retry',
    onClick: () => retryVote(),
  },
});
```

### RPC Retry Logic
Automatic retry for transient failures:
```typescript
const sendTransactionWithRetry = async (
  transaction: Transaction,
  maxRetries = 3
) => {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await connection.sendTransaction(transaction);
    } catch (error) {
      if (i === maxRetries - 1) throw error;
      await sleep(Math.pow(2, i) * 1000); // Exponential backoff
    }
  }
};
```

### Loading States
Graceful loading indicators:
```typescript
if (isLoading) return <ProposalCardSkeleton />;
if (error) return <ErrorMessage error={error} />;
if (!data) return <EmptyState />;
```

### Wallet Disconnection
Handle wallet disconnection gracefully:
```typescript
useEffect(() => {
  if (!connected && requiresWallet) {
    router.push('/connect-wallet');
    toast.info('Please connect your wallet to continue');
  }
}, [connected, requiresWallet]);
```

## Folder Structure

```
apps/dao-voting/src/
├── app/                    # Next.js App Router
│   ├── layout.tsx         # Root layout
│   ├── page.tsx          # Home page
│   ├── proposal/
│   │   └── [id]/
│   │       └── page.tsx  # Proposal details
│   └── profile/
│       └── [address]/
│           └── page.tsx  # User profile
├── components/            # React components
│   ├── ui/               # Base components
│   ├── proposal/         # Proposal features
│   ├── voting/           # Voting features
│   ├── wallet/           # Wallet features
│   └── providers/        # Context providers
├── hooks/                # Custom React hooks
├── lib/                  # Utilities and clients
│   ├── anchor-client.ts # Anchor setup
│   ├── supabase.ts      # Supabase client
│   ├── constants.ts     # App constants
│   └── utils.ts         # Helper functions
├── queries/              # React Query definitions
└── styles/               # Global styles
    └── globals.css      # Global CSS
```

## Development Best Practices

### Component Guidelines
1. Use functional components with hooks
2. Implement proper TypeScript types
3. Keep components small and focused
4. Use composition over inheritance
5. Implement error boundaries for critical sections

### State Management Rules
1. Server state in React Query
2. Client state in React Context
3. Form state in controlled components
4. URL state in Next.js router
5. Avoid prop drilling with Context

### Performance Guidelines
1. Use `React.memo` for expensive components
2. Implement virtual scrolling for long lists
3. Lazy load heavy components
4. Optimize bundle size with dynamic imports
5. Use Suspense for async operations

### Testing Strategy
1. Unit tests for utility functions
2. Component tests with React Testing Library
3. Integration tests for critical flows
4. E2E tests with Playwright
5. Visual regression with Percy

### Code Quality
1. ESLint for code standards
2. Prettier for formatting
3. TypeScript strict mode
4. Husky for pre-commit hooks
5. Regular dependency updates
