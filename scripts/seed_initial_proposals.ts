import * as anchor from "@coral-xyz/anchor";
import { AnchorProvider, BN, Program } from "@coral-xyz/anchor";
import { PublicKey, SystemProgram } from "@solana/web3.js";
import * as fs from "fs";
import path from "path";

// Polyfill for BN
declare global {
  var BN: any;
}
global.BN = BN;

// Load the IDL
const idlPath = path.join(__dirname, "../programs/dao_program/target/idl/dao_program.json");
const idl = JSON.parse(fs.readFileSync(idlPath, "utf8"));

// Initialize provider
const provider = AnchorProvider.env();
anchor.setProvider(provider);

// Initialize program
const programId = new PublicKey("HPH6itf3pTzFGReDBju8XhvQ8kgN1Wtpmd4oqXgaXKqp");

// Create program instance
let program: Program;
try {
  program = new Program(idl, programId, provider);
} catch (error) {
  console.error("Error creating program:", error);
  process.exit(1);
}

async function main() {
  console.log("Starting to seed initial proposals...");
  console.log("Program ID:", programId.toBase58());
  console.log("Provider URL:", provider.connection.rpcEndpoint);

  try {
    // Get DAO state PDA
    const [daoStatePda] = await PublicKey.findProgramAddressSync(
      [Buffer.from("dao-state")],
      programId
    );

    // Check if DAO is initialized
    let daoState;
    try {
      daoState = await program.account.daoState.fetch(daoStatePda);
      console.log("DAO already initialized:", daoState.daoName);
    } catch {
      console.log("Initializing DAO...");
      const tx = await program.methods
        .initialize("Solana Community DAO")
        .accounts({
          daoState: daoStatePda,
          authority: provider.wallet.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .rpc();
      console.log("DAO initialized successfully. Transaction:", tx);
      daoState = await program.account.daoState.fetch(daoStatePda);
    }

    // Sample proposals
    const proposals = [
      {
        title: "Increase Treasury Allocation for Development",
        description: "Propose to increase the treasury allocation for development initiatives from 20% to 30% to accelerate product development and attract more developers to our ecosystem.",
      },
      {
        title: "Implement Quarterly Community Calls",
        description: "Establish regular quarterly community calls to improve transparency and communication between the DAO leadership and community members. These calls would include updates, Q&A sessions, and voting discussions.",
      },
      {
        title: "Create Developer Grants Program",
        description: "Launch a grants program to fund developers building tools and applications for our DAO ecosystem. Initial funding of 10,000 tokens to be allocated across 5-10 projects.",
      },
    ];

    // Create proposals
    for (let i = 0; i < proposals.length; i++) {
      const currentCount = daoState.proposalCount.toNumber();
      const [proposalPda] = await PublicKey.findProgramAddressSync(
        [Buffer.from("proposal"), Buffer.from(new Uint8Array(new BN(currentCount).toArrayLike(Buffer, "le", 8)))],
        programId
      );

      console.log(`\nCreating proposal ${i + 1}: ${proposals[i].title}`);
      
      const tx = await program.methods
        .createProposal(proposals[i].title, proposals[i].description)
        .accounts({
          daoState: daoStatePda,
          proposal: proposalPda,
          creator: provider.wallet.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .rpc();

      // Refresh DAO state for next iteration
      daoState = await program.account.daoState.fetch(daoStatePda);
      
      console.log(`✅ Proposal created: ${proposals[i].title}`);
      console.log(`   Transaction: ${tx}`);
    }

    console.log("\n🎉 Successfully seeded initial proposals!");
    console.log(`Total proposals: ${daoState.proposalCount.toString()}`);

  } catch (error) {
    console.error("Error seeding proposals:", error);
    process.exit(1);
  }
}

main().then(() => process.exit(0));