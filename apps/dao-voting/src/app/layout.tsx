import { ErrorBoundary } from '@/components/ErrorBoundary';
import { Header } from '@/components/layout/Header';
import { AppProviders } from '@/components/providers/AppProviders';
import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'Solana DAO Voting',
  description: 'Decentralized governance platform for Solana DAOs',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {/* Skip Navigation Links */}
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 bg-primary text-primary-foreground px-4 py-2 rounded-md z-50"
        >
          Skip to main content
        </a>
        <a
          href="#proposals"
          className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-48 bg-primary text-primary-foreground px-4 py-2 rounded-md z-50"
        >
          Skip to proposals
        </a>
        
        <ErrorBoundary>
          <AppProviders>
            <div className="min-h-screen bg-background">
              <Header />
              <main id="main-content" tabIndex={-1}>
                {children}
              </main>
            </div>
          </AppProviders>
        </ErrorBoundary>
      </body>
    </html>
  );
}
