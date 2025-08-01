import { getConnection } from '@/lib/anchor-client';
import { useWallet } from '@solana/wallet-adapter-react';
import { useMemo } from 'react';

export function useAnchorProvider() {
  const wallet = useWallet();

  const solanaConnection = useMemo(() => {
    return getConnection();
  }, []);

  return {
    connection: solanaConnection,
    wallet,
  };
}
