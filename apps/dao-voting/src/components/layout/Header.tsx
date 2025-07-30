'use client';

import { WalletButton } from '@/components/wallet/WalletButton';
import Link from 'next/link';

export const Header = () => {
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
            <WalletButton />
          </nav>
        </div>
      </div>
    </header>
  );
};
