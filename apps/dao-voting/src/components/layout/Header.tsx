'use client';

import { ProfileSettingsModal } from '@/components/profile/ProfileSettingsModal';
import { WalletButton } from '@/components/wallet/WalletButton';
import { useWallet } from '@solana/wallet-adapter-react';
import { User } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';
import { MobileNav } from './MobileNav';

export const Header = () => {
  const [showProfileSettings, setShowProfileSettings] = useState(false);
  const { publicKey } = useWallet();

  return (
    <header className="border-b">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <Link href="/" className="text-2xl font-bold">
            🗳️ Solana DAO
          </Link>
          
          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-4">
            <Link 
              href="/" 
              className="hover:underline hover:text-primary transition-colors"
              aria-label="View all proposals"
            >
              Proposals
            </Link>
            {publicKey && (
              <>
                <Link 
                  href={`/profile/${publicKey.toBase58()}`} 
                  className="flex items-center gap-1 hover:underline hover:text-primary transition-colors"
                  aria-label="View my profile"
                >
                  <User className="h-4 w-4" />
                  <span>My Profile</span>
                </Link>
                <button
                  onClick={() => setShowProfileSettings(true)}
                  className="hover:underline hover:text-primary transition-colors"
                  aria-label="Open profile settings"
                >
                  Settings
                </button>
              </>
            )}
            <WalletButton />
          </nav>

          {/* Mobile Navigation */}
          <MobileNav />
        </div>
      </div>
      
      {showProfileSettings && <ProfileSettingsModal />}
    </header>
  );
};
