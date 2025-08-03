'use client';

import { ReactNode } from 'react';
import { Toaster } from 'sonner';
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
          <Toaster 
            position="bottom-right"
            theme="dark"
            richColors
            expand={false}
            closeButton
          />
        </WalletContextProvider>
      </QueryProvider>
    </SessionProvider>
  );
} 