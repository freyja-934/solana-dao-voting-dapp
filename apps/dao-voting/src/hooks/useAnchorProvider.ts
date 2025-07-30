import { getProgram, getProvider } from '@/lib/anchor-client';
import { useAnchorWallet, useConnection } from '@solana/wallet-adapter-react';
import { useMemo } from 'react';

export function useAnchorProvider() {
  const { connection } = useConnection();
  const wallet = useAnchorWallet();

  const provider = useMemo(() => {
    if (!wallet) return null;
    return getProvider(wallet);
  }, [wallet]);

  const program = useMemo(() => {
    if (!provider) return null;
    return getProgram(provider);
  }, [provider]);

  return {
    provider,
    program,
    connection,
    wallet,
  };
}
