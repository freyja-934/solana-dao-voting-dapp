'use client';

import { ProfileSettingsModal } from '@/components/profile/ProfileSettingsModal';
import { Button } from '@/components/ui/button';
import { WalletButton } from '@/components/wallet/WalletButton';
import { cn } from '@/lib/utils';
import { useWallet } from '@solana/wallet-adapter-react';
import { Home, Menu, Settings, User, X } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';

export const MobileNav = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [showProfileSettings, setShowProfileSettings] = useState(false);
  const { publicKey } = useWallet();
  const pathname = usePathname();

  // Close menu on route change
  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

  // Prevent body scroll when menu is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  const toggleMenu = () => setIsOpen(!isOpen);

  const isActiveLink = (href: string) => {
    if (href === '/') {
      return pathname === '/';
    }
    return pathname.startsWith(href);
  };

  const navItems = [
    { href: '/', label: 'Proposals', icon: Home },
    ...(publicKey ? [
      { href: `/profile/${publicKey.toBase58()}`, label: 'My Profile', icon: User },
    ] : []),
  ];

  const handleSettingsClick = () => {
    setShowProfileSettings(true);
    setIsOpen(false); // Close mobile menu when opening settings
  };

  return (
    <>
      {/* Menu Button */}
      <Button
        variant="ghost"
        size="icon"
        onClick={toggleMenu}
        className="md:hidden relative z-50"
        aria-label="Open menu"
      >
        <Menu className="h-5 w-5" />
      </Button>

      {/* Backdrop */}
      <div 
        className={cn(
          "fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity duration-300 md:hidden",
          isOpen ? "opacity-100 z-40" : "opacity-0 pointer-events-none"
        )}
        onClick={toggleMenu}
        aria-hidden="true"
      />

      {/* Drawer */}
      <div
        className={cn(
          "fixed inset-y-0 right-0 w-64 bg-background shadow-xl transition-transform duration-300 ease-in-out md:hidden z-50",
          isOpen ? "translate-x-0" : "translate-x-full"
        )}
      >
        <div className="flex flex-col h-full border-l glass-darker">
          {/* Header */}
          <div className="flex items-center justify-between p-5 border-b border-white/10">
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
          <nav className="flex-1 overflow-y-auto p-5">
            <ul className="space-y-2">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = isActiveLink(item.href);
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className={cn(
                        "flex items-center gap-3 px-3 py-2 rounded-md transition-all duration-200",
                        isActive 
                          ? "bg-white/10 text-white font-medium" 
                          : "hover:bg-accent text-white/70 hover:text-white"
                      )}
                      onClick={toggleMenu}
                    >
                      <Icon className={cn(
                        "h-4 w-4",
                        isActive && "text-blue-400"
                      )} />
                      <span>{item.label}</span>
                      {isActive && (
                        <span className="ml-auto w-1 h-4 bg-gradient-to-b from-blue-400 to-purple-400 rounded-full" />
                      )}
                    </Link>
                  </li>
                );
              })}
              
              {/* Settings Button */}
              {publicKey && (
                <li>
                  <button
                    onClick={handleSettingsClick}
                    className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-accent transition-all duration-200 w-full text-left text-white/70 hover:text-white"
                  >
                    <Settings className="h-4 w-4" />
                    <span>Settings</span>
                  </button>
                </li>
              )}
            </ul>
          </nav>

          {/* Wallet Connection */}
          <div className="p-5 border-t border-white/10">
            <WalletButton />
          </div>
        </div>
      </div>

      {/* Profile Settings Modal */}
      <ProfileSettingsModal 
        open={showProfileSettings}
        onOpenChange={setShowProfileSettings}
      />
    </>
  );
} 