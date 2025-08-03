'use client';

import { ProfileSettingsModal } from '@/components/profile/ProfileSettingsModal';
import { WalletButton } from '@/components/wallet/WalletButton';
import { useWallet } from '@solana/wallet-adapter-react';
import { User } from 'lucide-react';
import Link from 'next/link';

export const Header = () => {
  const { publicKey } = useWallet();

  return (
    <header className="border-b">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <Link href="/" className="text-2xl font-bold">
            🗳️ Solana DAO
          </Link>
          <nav className="flex items-center gap-4">
            <Link href="/" className="hover:underline">
              Proposals
            </Link>
            {publicKey && (
              <>
                <Link 
                  href={`/profile/${publicKey.toBase58()}`} 
                  className="flex items-center gap-1 hover:underline"
                >
                  <User className="h-4 w-4" />
                  My Profile
                </Link>
                <ProfileSettingsModal />
              </>
            )}
            <WalletButton />
          </nav>
        </div>
      </div>
    </header>
  );
};
