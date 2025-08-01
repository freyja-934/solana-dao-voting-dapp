#!/usr/bin/env node

// This script initializes the DAO on devnet
// Run with: node scripts/initialize-dao.js

const path = require('path');
const fs = require('fs');

// Add the dao-voting directory to module resolution
const daoVotingPath = path.join(__dirname, '../apps/dao-voting');
require('module-alias/register');
require('module-alias').addAlias('@', path.join(daoVotingPath, 'src'));

// Import from dao-voting src
const { 
  Connection,
  Keypair,
  PublicKey,
  Transaction,
  TransactionInstruction,
  SystemProgram,
} = require('@solana/web3.js');

const PROGRAM_ID = new PublicKey('HPH6itf3pTzFGReDBju8XhvQ8kgN1Wtpmd4oqXgaXKqp');
const RPC_URL = 'https://devnet.helius-rpc.com/?api-key=0991e593-a2d1-4db3-8685-e00494fb96cd';

// Instruction discriminator for initialize
const INITIALIZE_DISCRIMINATOR = Buffer.from([175, 175, 109, 31, 13, 152, 155, 237]);

async function getDaoStatePDA() {
  return await PublicKey.findProgramAddressSync(
    [Buffer.from('dao-state')],
    PROGRAM_ID
  );
}

function createInitializeInstruction(daoStatePda, authority, daoName) {
  const nameBuffer = Buffer.from(daoName, 'utf8');
  
  // Create proper Anchor string serialization (4-byte length prefix)
  const lengthBuffer = Buffer.alloc(4);
  lengthBuffer.writeUInt32LE(nameBuffer.length, 0);
  
  const data = Buffer.concat([
    INITIALIZE_DISCRIMINATOR,
    lengthBuffer,
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
  const os = require('os');
  const keypairPath = path.join(os.homedir(), '.config/solana/id.json');
  
  if (!fs.existsSync(keypairPath)) {
    throw new Error(`Solana keypair not found at ${keypairPath}. Please run 'solana-keygen new' first.`);
  }
  
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

    // Check balance
    const balance = await connection.getBalance(payer.publicKey);
    console.log('Payer balance:', balance / 1000000000, 'SOL');
    
    if (balance < 10000000) { // 0.01 SOL
      console.warn('⚠️  Low balance. You may need more SOL for transactions.');
    }

    // Check if DAO is already initialized
    const [daoStatePda] = await getDaoStatePDA();
    console.log('DAO State PDA:', daoStatePda.toBase58());

    const existingDao = await fetchDaoState(connection);
    if (existingDao) {
      console.log('✅ DAO already initialized!');
      console.log('📋 DAO Details:');
      console.log('  Name:', existingDao.daoName);
      console.log('  Authority:', existingDao.authority.toBase58());
      console.log('  Proposal Count:', existingDao.proposalCount);
      console.log('  PDA Address:', daoStatePda.toBase58());
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
    console.log('📤 Sending transaction...');
    const signature = await connection.sendRawTransaction(transaction.serialize());
    console.log('Transaction sent:', signature);

    // Confirm transaction
    console.log('⏳ Confirming transaction...');
    const confirmation = await connection.confirmTransaction(signature, 'confirmed');
    
    if (confirmation.value.err) {
      throw new Error(`Transaction failed: ${confirmation.value.err}`);
    }

    console.log('✅ DAO initialized successfully!');
    console.log('🔗 View on Solana Explorer:');
    console.log(`   https://explorer.solana.com/tx/${signature}?cluster=devnet`);

    // Verify initialization
    const daoState = await fetchDaoState(connection);
    if (daoState) {
      console.log('🎉 DAO Details:');
      console.log('  Name:', daoState.daoName);
      console.log('  Authority:', daoState.authority.toBase58());
      console.log('  Proposal Count:', daoState.proposalCount);
      console.log('  PDA Address:', daoStatePda.toBase58());
    }

    console.log('\n✨ Your DAO is ready! You can now:');
    console.log('  1. Visit your app at http://localhost:3001');
    console.log('  2. Connect your wallet');
    console.log('  3. Create and vote on proposals');

  } catch (error) {
    console.error('❌ Error initializing DAO:', error);
    
    if (error.message.includes('memory allocation failed')) {
      console.log('\n💡 This might be a program issue. Try:');
      console.log('  1. Check if the program is correctly deployed');
      console.log('  2. Verify the instruction format matches the program');
    }
    
    process.exit(1);
  }
}

if (require.main === module) {
  main().then(() => {
    console.log('🏁 Script completed successfully');
    process.exit(0);
  }).catch((error) => {
    console.error('💥 Script failed:', error);
    process.exit(1);
  });
} 