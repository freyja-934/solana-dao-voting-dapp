'use client';

import { Button } from '@/components/ui/button';
import { useWallet } from '@solana/wallet-adapter-react';
import { useWalletModal } from '@solana/wallet-adapter-react-ui';
import { FC, useCallback } from 'react';

export const WalletButton: FC = () => {
  const { publicKey, disconnect, connected, connecting } = useWallet();
  const { setVisible } = useWalletModal();

  const handleClick = useCallback(() => {
    if (connected) {
      disconnect();
    } else {
      setVisible(true);
    }
  }, [connected, disconnect, setVisible]);

  const truncateAddress = (address: string) => {
    return `${address.slice(0, 4)}...${address.slice(-4)}`;
  };

  return (
    <Button
      onClick={handleClick}
      disabled={connecting}
      variant={connected ? 'outline' : 'default'}
    >
      {connecting ? (
        'Connecting...'
      ) : connected && publicKey ? (
        truncateAddress(publicKey.toBase58())
      ) : (
        'Connect Wallet'
      )}
    </Button>
  );
};
