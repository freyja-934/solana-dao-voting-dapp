import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { expect } from "chai";
import { DaoProgram } from "../target/types/dao_program";

describe("dao_program", () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace.DaoProgram as Program<DaoProgram>;
  
  const daoName = "Test DAO";
  let daoStatePda: anchor.web3.PublicKey;
  let daoStateBump: number;

  before(async () => {
    [daoStatePda, daoStateBump] = await anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from("dao-state")],
      program.programId
    );
  });

  it("Initializes the DAO", async () => {
    const tx = await program.methods
      .initialize(daoName)
      .accounts({
        daoState: daoStatePda,
        authority: provider.wallet.publicKey,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .rpc();

    console.log("Initialize transaction:", tx);

    const daoState = await program.account.daoState.fetch(daoStatePda);
    expect(daoState.daoName).to.equal(daoName);
    expect(daoState.authority.toString()).to.equal(provider.wallet.publicKey.toString());
    expect(daoState.proposalCount.toNumber()).to.equal(0);
  });

  it("Creates a proposal", async () => {
    const title = "First Proposal";
    const description = "This is a test proposal for our DAO";
    
    const proposalId = 0;
    const [proposalPda] = await anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from("proposal"), Buffer.from(new Uint8Array(new BigUint64Array([BigInt(proposalId)]).buffer))],
      program.programId
    );

    const tx = await program.methods
      .createProposal(title, description)
      .accounts({
        daoState: daoStatePda,
        proposal: proposalPda,
        creator: provider.wallet.publicKey,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .rpc();

    console.log("Create proposal transaction:", tx);

    const proposal = await program.account.proposal.fetch(proposalPda);
    expect(proposal.title).to.equal(title);
    expect(proposal.description).to.equal(description);
    expect(proposal.creator.toString()).to.equal(provider.wallet.publicKey.toString());
    expect(proposal.yesVotes.toNumber()).to.equal(0);
    expect(proposal.noVotes.toNumber()).to.equal(0);
    expect(proposal.abstainVotes.toNumber()).to.equal(0);
    expect(proposal.status).to.deep.equal({ active: {} });

    const daoState = await program.account.daoState.fetch(daoStatePda);
    expect(daoState.proposalCount.toNumber()).to.equal(1);
  });

  it("Casts a vote on a proposal", async () => {
    const proposalId = 0;
    const [proposalPda] = await anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from("proposal"), Buffer.from(new Uint8Array(new BigUint64Array([BigInt(proposalId)]).buffer))],
      program.programId
    );

    const [votePda] = await anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from("vote"), proposalPda.toBuffer(), provider.wallet.publicKey.toBuffer()],
      program.programId
    );

    const voteChoice = { yes: {} };

    const tx = await program.methods
      .castVote(voteChoice)
      .accounts({
        proposal: proposalPda,
        voteRecord: votePda,
        voter: provider.wallet.publicKey,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .rpc();

    console.log("Cast vote transaction:", tx);

    const proposal = await program.account.proposal.fetch(proposalPda);
    expect(proposal.yesVotes.toNumber()).to.equal(1);
    expect(proposal.noVotes.toNumber()).to.equal(0);
    expect(proposal.abstainVotes.toNumber()).to.equal(0);

    const voteRecord = await program.account.voteRecord.fetch(votePda);
    expect(voteRecord.voter.toString()).to.equal(provider.wallet.publicKey.toString());
    expect(voteRecord.proposalId.toNumber()).to.equal(proposalId);
    expect(voteRecord.choice).to.deep.equal({ yes: {} });
  });

  it("Prevents double voting", async () => {
    const proposalId = 0;
    const [proposalPda] = await anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from("proposal"), Buffer.from(new Uint8Array(new BigUint64Array([BigInt(proposalId)]).buffer))],
      program.programId
    );

    const [votePda] = await anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from("vote"), proposalPda.toBuffer(), provider.wallet.publicKey.toBuffer()],
      program.programId
    );

    const voteChoice = { no: {} };

    try {
      await program.methods
        .castVote(voteChoice)
        .accounts({
          proposal: proposalPda,
          voteRecord: votePda,
          voter: provider.wallet.publicKey,
          systemProgram: anchor.web3.SystemProgram.programId,
        })
        .rpc();
      
      expect.fail("Should have thrown an error");
    } catch (error) {
      expect(error.toString()).to.include("already in use");
    }
  });

  it("Creates multiple proposals", async () => {
    const proposals = [
      { title: "Second Proposal", description: "Another test proposal" },
      { title: "Third Proposal", description: "Yet another test proposal" },
    ];

    for (let i = 0; i < proposals.length; i++) {
      const daoStateBefore = await program.account.daoState.fetch(daoStatePda);
      const proposalId = daoStateBefore.proposalCount.toNumber();
      
      const [proposalPda] = await anchor.web3.PublicKey.findProgramAddressSync(
        [Buffer.from("proposal"), Buffer.from(new Uint8Array(new BigUint64Array([BigInt(proposalId)]).buffer))],
        program.programId
      );

      await program.methods
        .createProposal(proposals[i].title, proposals[i].description)
        .accounts({
          daoState: daoStatePda,
          proposal: proposalPda,
          creator: provider.wallet.publicKey,
          systemProgram: anchor.web3.SystemProgram.programId,
        })
        .rpc();

      const proposal = await program.account.proposal.fetch(proposalPda);
      expect(proposal.title).to.equal(proposals[i].title);
      expect(proposal.description).to.equal(proposals[i].description);
    }

    const daoState = await program.account.daoState.fetch(daoStatePda);
    expect(daoState.proposalCount.toNumber()).to.equal(3);
  });

  it("Finalizes a proposal", async () => {
    const proposalId = 0;
    const [proposalPda] = await anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from("proposal"), Buffer.from(new Uint8Array(new BigUint64Array([BigInt(proposalId)]).buffer))],
      program.programId
    );

    const tx = await program.methods
      .finalizeProposal()
      .accounts({
        daoState: daoStatePda,
        proposal: proposalPda,
        authority: provider.wallet.publicKey,
      })
      .rpc();

    console.log("Finalize proposal transaction:", tx);

    const proposal = await program.account.proposal.fetch(proposalPda);
    expect(proposal.status).to.deep.equal({ finalized: {} });
  });

  it("Prevents voting on finalized proposal", async () => {
    const proposalId = 0;
    const [proposalPda] = await anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from("proposal"), Buffer.from(new Uint8Array(new BigUint64Array([BigInt(proposalId)]).buffer))],
      program.programId
    );

    const newVoter = anchor.web3.Keypair.generate();
    
    const signature = await provider.connection.requestAirdrop(
      newVoter.publicKey,
      2 * anchor.web3.LAMPORTS_PER_SOL
    );
    await provider.connection.confirmTransaction(signature);

    const [votePda] = await anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from("vote"), proposalPda.toBuffer(), newVoter.publicKey.toBuffer()],
      program.programId
    );

    try {
      await program.methods
        .castVote({ yes: {} })
        .accounts({
          proposal: proposalPda,
          voteRecord: votePda,
          voter: newVoter.publicKey,
          systemProgram: anchor.web3.SystemProgram.programId,
        })
        .signers([newVoter])
        .rpc();
      
      expect.fail("Should have thrown an error");
    } catch (error) {
      expect(error.message).to.include("ProposalNotActive");
    }
  });

  it("Validates proposal title length", async () => {
    const longTitle = "a".repeat(101);
    const description = "Valid description";
    
    const daoState = await program.account.daoState.fetch(daoStatePda);
    const proposalId = daoState.proposalCount.toNumber();
    
    const [proposalPda] = await anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from("proposal"), Buffer.from(new Uint8Array(new BigUint64Array([BigInt(proposalId)]).buffer))],
      program.programId
    );

    try {
      await program.methods
        .createProposal(longTitle, description)
        .accounts({
          daoState: daoStatePda,
          proposal: proposalPda,
          creator: provider.wallet.publicKey,
          systemProgram: anchor.web3.SystemProgram.programId,
        })
        .rpc();
      
      expect.fail("Should have thrown an error");
    } catch (error) {
      expect(error.message).to.include("TitleTooLong");
    }
  });
});
