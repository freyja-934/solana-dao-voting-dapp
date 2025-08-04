import { ErrorBoundary } from '@/components/ErrorBoundary';
import { Header } from '@/components/layout/Header';
import { AppProviders } from '@/components/providers/AppProviders';
import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
  display: 'swap',
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Solana DAO Voting',
  description: 'Decentralized governance platform for Solana DAOs',
  keywords: ['Solana', 'DAO', 'Voting', 'Governance', 'Blockchain'],
  authors: [{ name: 'Solana DAO' }],
  openGraph: {
    title: 'Solana DAO Voting',
    description: 'Decentralized governance platform for Solana DAOs',
    type: 'website',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} font-sans antialiased`}
      >
        {/* Skip Navigation Links for Accessibility */}
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-50 bg-gradient-primary text-white px-4 py-2 rounded-md shadow-lg"
        >
          Skip to main content
        </a>
        <a
          href="#proposals"
          className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-52 focus:z-50 bg-gradient-primary text-white px-4 py-2 rounded-md shadow-lg"
        >
          Skip to proposals
        </a>
        
        <ErrorBoundary>
          <AppProviders>
            <div className="relative min-h-screen">
              <Header />
              <main 
                id="main-content" 
                tabIndex={-1}
                className="relative z-0"
              >
                {children}
              </main>
              <footer className="mt-auto border-t border-white/10 backdrop-blur-sm bg-black/20">
                <div className="container mx-auto px-6 sm:px-8 py-6">
                  <p className="text-center text-sm text-white/60">
                    © 2024 Solana DAO. Built with ❤️ on Solana.
                  </p>
                </div>
              </footer>
            </div>
          </AppProviders>
        </ErrorBoundary>
      </body>
    </html>
  );
}
