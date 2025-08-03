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
  description: 'Decentralized voting platform for Solana DAOs',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <AppProviders>
          <div className="min-h-screen bg-background">
            <Header />
            <main>{children}</main>
          </div>
        </AppProviders>
      </body>
    </html>
  );
}
