import {
    Connection,
    Keypair,
    PublicKey,
    Transaction
} from '@solana/web3.js';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import {
    createInitializeInstruction,
    fetchDaoState,
    getDaoStatePDA
} from '../apps/dao-voting/src/lib/anchor-client';

const PROGRAM_ID = new PublicKey('HPH6itf3pTzFGReDBju8XhvQ8kgN1Wtpmd4oqXgaXKqp');
const RPC_URL = 'https://devnet.helius-rpc.com/?api-key=0991e593-a2d1-4db3-8685-e00494fb96cd';

async function loadKeypair(): Promise<Keypair> {
  const keypairPath = path.join(os.homedir(), '.config/solana/id.json');
  const keypairData = JSON.parse(fs.readFileSync(keypairPath, 'utf8'));
  return Keypair.fromSecretKey(new Uint8Array(keypairData));
}

async function main() {
  console.log('🚀 Initializing Solana DAO...');
  console.log('Program ID:', PROGRAM_ID.toBase58());
  console.log('RPC URL:', RPC_URL);

  try {
    // Load keypair
    const payer = await loadKeypair();
    console.log('Payer:', payer.publicKey.toBase58());

    // Create connection
    const connection = new Connection(RPC_URL, 'confirmed');

    // Check if DAO is already initialized
    const [daoStatePda] = await getDaoStatePDA();
    console.log('DAO State PDA:', daoStatePda.toBase58());

    const existingDao = await fetchDaoState(connection);
    if (existingDao) {
      console.log('✅ DAO already initialized!');
      console.log('DAO Name:', existingDao.daoName);
      console.log('Authority:', existingDao.authority.toBase58());
      console.log('Proposal Count:', existingDao.proposalCount);
      return;
    }

    console.log('⏳ Initializing DAO...');

    // Create initialize instruction
    const daoName = "Solana Community DAO";
    const initializeIx = createInitializeInstruction(
      daoStatePda,
      payer.publicKey,
      daoName
    );

    // Create and send transaction
    const transaction = new Transaction().add(initializeIx);
    transaction.recentBlockhash = (await connection.getLatestBlockhash()).blockhash;
    transaction.feePayer = payer.publicKey;

    // Sign transaction
    transaction.sign(payer);

    // Send transaction
    const signature = await connection.sendRawTransaction(transaction.serialize());
    console.log('Transaction sent:', signature);

    // Confirm transaction
    const confirmation = await connection.confirmTransaction(signature, 'confirmed');
    
    if (confirmation.value.err) {
      throw new Error(`Transaction failed: ${confirmation.value.err}`);
    }

    console.log('✅ DAO initialized successfully!');
    console.log('Transaction confirmed:', signature);

    // Verify initialization
    const daoState = await fetchDaoState(connection);
    if (daoState) {
      console.log('🎉 DAO Details:');
      console.log('  Name:', daoState.daoName);
      console.log('  Authority:', daoState.authority.toBase58());
      console.log('  Proposal Count:', daoState.proposalCount);
    }

  } catch (error) {
    console.error('❌ Error initializing DAO:', error);
    process.exit(1);
  }
}

main().then(() => {
  console.log('🏁 Script completed');
  process.exit(0);
}).catch((error) => {
  console.error('💥 Script failed:', error);
  process.exit(1);
}); 