'use client';

import { ProfileSettingsModal } from '@/components/profile/ProfileSettingsModal';
import { WalletButton } from '@/components/wallet/WalletButton';
import { cn } from '@/lib/utils';
import { useWallet } from '@solana/wallet-adapter-react';
import { Settings, User } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { MobileNav } from './MobileNav';

export const Header = () => {
  const [showProfileSettings, setShowProfileSettings] = useState(false);
  const { publicKey } = useWallet();
  const pathname = usePathname();

  const isActiveLink = (href: string) => {
    if (href === '/') {
      return pathname === '/';
    }
    return pathname.startsWith(href);
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-white/10 glass-darker">
      <div className="container mx-auto px-6 sm:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link 
            href="/" 
            className="flex items-center gap-2 text-xl sm:text-2xl font-bold hover:opacity-80 transition-all duration-300 hover:scale-105"
          >
            <span className="text-2xl animate-float">🗳️</span>
            <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
              Solana DAO
            </span>
          </Link>
          
          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-6">
            <Link 
              href="/" 
              className={cn(
                "relative text-sm font-medium transition-all duration-300 hover:translate-y-[-1px]",
                isActiveLink('/') 
                  ? "text-white" 
                  : "text-white/60 hover:text-white"
              )}
              aria-label="View all proposals"
            >
              Proposals
              {isActiveLink('/') && (
                <span className="absolute -bottom-1 left-0 right-0 h-0.5 bg-gradient-to-r from-blue-400 to-purple-400 rounded-full" />
              )}
            </Link>
            {publicKey && (
              <>
                <Link 
                  href={`/profile/${publicKey.toBase58()}`} 
                  className={cn(
                    "relative flex items-center gap-2 text-sm font-medium transition-all duration-300 hover:translate-y-[-1px]",
                    isActiveLink(`/profile/${publicKey.toBase58()}`)
                      ? "text-white" 
                      : "text-white/60 hover:text-white"
                  )}
                  aria-label="View my profile"
                >
                  <User className="h-4 w-4" />
                  <span>My Profile</span>
                  {isActiveLink(`/profile/${publicKey.toBase58()}`) && (
                    <span className="absolute -bottom-1 left-0 right-0 h-0.5 bg-gradient-to-r from-blue-400 to-purple-400 rounded-full" />
                  )}
                </Link>
                <button
                  onClick={() => setShowProfileSettings(true)}
                  className="flex items-center gap-2 text-sm font-medium text-white/60 hover:text-white transition-all duration-300 hover:translate-y-[-1px]"
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
      
      <ProfileSettingsModal 
        open={showProfileSettings} 
        onOpenChange={setShowProfileSettings}
      />
    </header>
  );
};
