'use client';

import { ProfileSettingsModal } from '@/components/profile/ProfileSettingsModal';
import { Button } from '@/components/ui/button';
import { WalletButton } from '@/components/wallet/WalletButton';
import { cn } from '@/lib/utils';
import { useWallet } from '@solana/wallet-adapter-react';
import { Home, Menu, Settings, User, X } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';

export function MobileNav() {
  const [isOpen, setIsOpen] = useState(false);
  const [showProfileSettings, setShowProfileSettings] = useState(false);
  const { publicKey } = useWallet();

  const toggleMenu = () => setIsOpen(!isOpen);

  const navItems = [
    { href: '/', label: 'Proposals', icon: Home },
    ...(publicKey ? [
      { href: `/profile/${publicKey.toBase58()}`, label: 'My Profile', icon: User },
    ] : []),
  ];

  return (
    <>
      {/* Mobile Menu Button */}
      <Button
        variant="ghost"
        size="icon"
        className="md:hidden"
        onClick={toggleMenu}
        aria-label="Toggle navigation menu"
      >
        {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
      </Button>

      {/* Mobile Menu Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={toggleMenu}
          aria-hidden="true"
        />
      )}

      {/* Mobile Menu Drawer */}
      <div
        className={cn(
          "fixed inset-y-0 right-0 w-64 z-50 transform transition-transform duration-300 ease-in-out md:hidden",
          isOpen ? "translate-x-0" : "translate-x-full"
        )}
        style={{ backgroundColor: 'hsl(var(--background))' }}
      >
        <div className="flex flex-col h-full border-l bg-card">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b">
            <h2 className="text-lg font-semibold">Menu</h2>
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleMenu}
              aria-label="Close menu"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>

          {/* Navigation Items */}
          <nav className="flex-1 overflow-y-auto p-4">
            <ul className="space-y-2">
              {navItems.map((item) => {
                const Icon = item.icon;
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-accent transition-colors"
                      onClick={toggleMenu}
                    >
                      <Icon className="h-5 w-5" />
                      <span>{item.label}</span>
                    </Link>
                  </li>
                );
              })}
              {publicKey && (
                <li>
                  <button
                    onClick={() => {
                      setShowProfileSettings(true);
                      toggleMenu();
                    }}
                    className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-accent transition-colors w-full text-left"
                  >
                    <Settings className="h-5 w-5" />
                    <span>Profile Settings</span>
                  </button>
                </li>
              )}
            </ul>
          </nav>

          {/* Wallet Connection */}
          <div className="p-4 border-t">
            <WalletButton />
          </div>
        </div>
      </div>

      {/* Profile Settings Modal */}
      {showProfileSettings && (
        <ProfileSettingsModal />
      )}
    </>
  );
} 