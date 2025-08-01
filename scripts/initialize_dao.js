const {
  Connection,
  Keypair,
  PublicKey,
  Transaction,
  TransactionInstruction,
  SystemProgram,
} = require('@solana/web3.js');
const fs = require('fs');
const os = require('os');
const path = require('path');

const PROGRAM_ID = new PublicKey('HPH6itf3pTzFGReDBju8XhvQ8kgN1Wtpmd4oqXgaXKqp');
const RPC_URL = 'https://devnet.helius-rpc.com/?api-key=0991e593-a2d1-4db3-8685-e00494fb96cd';

// Instruction discriminators (copied from anchor-client.ts)
const INSTRUCTION_DISCRIMINATORS = {
  initialize: Buffer.from([175, 175, 109, 31, 13, 152, 155, 237]),
};

async function getDaoStatePDA() {
  return await PublicKey.findProgramAddressSync(
    [Buffer.from('dao-state')],
    PROGRAM_ID
  );
}

function createInitializeInstruction(daoStatePda, authority, daoName) {
  const nameBuffer = Buffer.from(daoName, 'utf8');
  const data = Buffer.concat([
    INSTRUCTION_DISCRIMINATORS.initialize,
    Buffer.from([nameBuffer.length]), // String length prefix
    nameBuffer
  ]);

  return new TransactionInstruction({
    keys: [
      { pubkey: daoStatePda, isSigner: false, isWritable: true },
      { pubkey: authority, isSigner: true, isWritable: true },
      { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
    ],
    programId: PROGRAM_ID,
    data,
  });
}

async function fetchDaoState(connection) {
  try {
    const [daoStatePda] = await getDaoStatePDA();
    const accountInfo = await connection.getAccountInfo(daoStatePda);
    
    if (!accountInfo) return null;

    // Parse the account data (skip discriminator)
    const data = accountInfo.data.slice(8);
    
    // Manual parsing since borsh is complex with PublicKeys
    let offset = 0;
    const authority = new PublicKey(data.slice(offset, offset + 32));
    offset += 32;
    
    const nameLength = data.readUInt32LE(offset);
    offset += 4;
    const daoName = data.slice(offset, offset + nameLength).toString('utf8');
    offset += nameLength;
    
    const proposalCount = Number(data.readBigUInt64LE(offset));
    offset += 8;
    
    const bump = data.readUInt8(offset);

    return {
      authority,
      daoName,
      proposalCount,
      bump,
    };
  } catch (error) {
    console.error('Error fetching DAO state:', error);
    return null;
  }
}

function loadKeypair() {
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
    const payer = loadKeypair();
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
    console.log('🔗 View on Solana Explorer:');
    console.log(`https://explorer.solana.com/tx/${signature}?cluster=devnet`);

    // Verify initialization
    const daoState = await fetchDaoState(connection);
    if (daoState) {
      console.log('🎉 DAO Details:');
      console.log('  Name:', daoState.daoName);
      console.log('  Authority:', daoState.authority.toBase58());
      console.log('  Proposal Count:', daoState.proposalCount);
      console.log('  PDA Address:', daoStatePda.toBase58());
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