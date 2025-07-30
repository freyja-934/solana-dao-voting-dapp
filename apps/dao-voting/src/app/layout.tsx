import { Header } from "@/components/layout/Header";
import { QueryProvider } from "@/components/providers/QueryProvider";
import { WalletContextProvider } from "@/components/providers/WalletContextProvider";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Solana DAO Voting",
  description: "Decentralized governance voting on Solana",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <QueryProvider>
          <WalletContextProvider>
            <Header />
            <main className="min-h-screen">
              {children}
            </main>
          </WalletContextProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
