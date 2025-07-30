export const config = {
  // Solana Configuration
  rpcUrl: process.env.NEXT_PUBLIC_RPC_URL || 'https://api.devnet.solana.com',
  commitment: process.env.NEXT_PUBLIC_COMMITMENT || 'confirmed',
  
  // Program ID (will be updated after anchor deploy)
  programId: process.env.NEXT_PUBLIC_PROGRAM_ID || '',
  
  // Optional: Analytics
  gaId: process.env.NEXT_PUBLIC_GA_ID || ''
}; 