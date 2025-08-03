'use client';

import { ReactNode } from 'react';
import { QueryProvider } from './QueryProvider';
import { SessionProvider } from './SessionProvider';
import { UserProfileManager } from './UserProfileManager';
import { WalletContextProvider } from './WalletContextProvider';

interface AppProvidersProps {
  children: ReactNode;
}

export function AppProviders({ children }: AppProvidersProps) {
  return (
    <SessionProvider>
      <QueryProvider>
        <WalletContextProvider>
          <UserProfileManager />
          {children}
        </WalletContextProvider>
      </QueryProvider>
    </SessionProvider>
  );
} 