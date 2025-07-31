import { getProgram, getProvider } from '@/lib/anchor-client';
import { useAnchorWallet, useConnection } from '@solana/wallet-adapter-react';
import { useEffect, useMemo, useState } from 'react';

export function useAnchorProvider() {
  const { connection } = useConnection();
  const wallet = useAnchorWallet();
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const provider = useMemo(() => {
    if (!wallet || !isClient) return null;
    return getProvider(wallet);
  }, [wallet, isClient]);

  const program = useMemo(() => {
    if (!provider || !isClient) return null;
    try {
      return getProgram(provider);
    } catch (error) {
      console.error('Failed to create program:', error);
      return null;
    }
  }, [provider, isClient]);

  return {
    provider,
    program,
    connection,
    wallet,
  };
}
