'use client';

import { ProfileSettingsModal } from '@/components/profile/ProfileSettingsModal';
import { WalletButton } from '@/components/wallet/WalletButton';
import { useWallet } from '@solana/wallet-adapter-react';
import { Settings, User } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';
import { MobileNav } from './MobileNav';

export const Header = () => {
  const [showProfileSettings, setShowProfileSettings] = useState(false);
  const { publicKey } = useWallet();

  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link 
            href="/" 
            className="flex items-center gap-2 text-xl sm:text-2xl font-bold hover:opacity-80 transition-opacity"
          >
            <span className="text-2xl">🗳️</span>
            <span>Solana DAO</span>
          </Link>
          
          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-6">
            <Link 
              href="/" 
              className="text-sm font-medium hover:text-primary transition-colors"
              aria-label="View all proposals"
            >
              Proposals
            </Link>
            {publicKey && (
              <>
                <Link 
                  href={`/profile/${publicKey.toBase58()}`} 
                  className="flex items-center gap-2 text-sm font-medium hover:text-primary transition-colors"
                  aria-label="View my profile"
                >
                  <User className="h-4 w-4" />
                  <span>My Profile</span>
                </Link>
                <button
                  onClick={() => setShowProfileSettings(true)}
                  className="flex items-center gap-2 text-sm font-medium hover:text-primary transition-colors"
                  aria-label="Open profile settings"
                >
                  <Settings className="h-4 w-4" />
                  <span>Settings</span>
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
