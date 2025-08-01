'use client';

import { Button } from '@/components/ui/button';
import { useInitializeDao } from '@/hooks/useInitializeDao';
import { useWallet } from '@solana/wallet-adapter-react';

export function InitializeDaoButton() {
  const { connected } = useWallet();
  const initializeDao = useInitializeDao();

  const handleInitialize = async () => {
    try {
      const signature = await initializeDao.mutateAsync('Solana Community DAO');
      console.log('DAO initialized successfully:', signature);
      alert('DAO initialized successfully! Transaction: ' + signature);
    } catch (error) {
      console.error('Failed to initialize DAO:', error);
      alert('Failed to initialize DAO: ' + (error as Error).message);
    }
  };

  if (!connected) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground mb-4">
          Connect your wallet to initialize the DAO
        </p>
      </div>
    );
  }

  return (
    <div className="text-center py-12">
      <h2 className="text-2xl font-bold mb-4">Initialize DAO</h2>
      <p className="text-muted-foreground mb-6">
        The DAO needs to be initialized before proposals can be created.
      </p>
      <Button 
        onClick={handleInitialize}
        disabled={initializeDao.isPending}
        size="lg"
      >
        {initializeDao.isPending ? 'Initializing...' : 'Initialize DAO'}
      </Button>
    </div>
  );
} 