use anchor_lang::prelude::*;

declare_id!("5RzYB945gtiaM3k2WjiuhptSNQ8M3VmXQbBmJsSTCwC5");

#[program]
pub mod dao_program {
    use super::*;

    pub fn initialize(ctx: Context<Initialize>, dao_name: String) -> Result<()> {
        require!(dao_name.len() <= 50, ErrorCode::NameTooLong);
        
        let dao_state = &mut ctx.accounts.dao_state;
        dao_state.authority = ctx.accounts.authority.key();
        dao_state.dao_name = dao_name;
        dao_state.proposal_count = 0;
        dao_state.bump = ctx.bumps.dao_state;
        
        emit!(DaoInitialized {
            authority: ctx.accounts.authority.key(),
            dao_name: dao_state.dao_name.clone(),
        });
        
        Ok(())
    }

    pub fn create_proposal(
        ctx: Context<CreateProposal>,
        title: String,
        description: String,
    ) -> Result<()> {
        require!(title.len() <= 100, ErrorCode::TitleTooLong);
        require!(description.len() <= 500, ErrorCode::DescriptionTooLong);
        
        let dao_state = &mut ctx.accounts.dao_state;
        let proposal = &mut ctx.accounts.proposal;
        
        proposal.id = dao_state.proposal_count;
        proposal.creator = ctx.accounts.creator.key();
        proposal.title = title;
        proposal.description = description;
        proposal.yes_votes = 0;
        proposal.no_votes = 0;
        proposal.abstain_votes = 0;
        proposal.status = ProposalStatus::Active;
        proposal.created_at = Clock::get()?.unix_timestamp;
        proposal.bump = ctx.bumps.proposal;
        
        dao_state.proposal_count += 1;
        
        emit!(ProposalCreated {
            proposal_id: proposal.id,
            creator: proposal.creator,
            title: proposal.title.clone(),
            created_at: proposal.created_at,
        });
        
        Ok(())
    }

    pub fn cast_vote(ctx: Context<CastVote>, vote_choice: VoteChoice) -> Result<()> {
        let proposal = &mut ctx.accounts.proposal;
        let vote_record = &mut ctx.accounts.vote_record;
        
        require!(
            proposal.status == ProposalStatus::Active,
            ErrorCode::ProposalNotActive
        );
        
        vote_record.voter = ctx.accounts.voter.key();
        vote_record.proposal_id = proposal.id;
        vote_record.choice = vote_choice.clone();
        vote_record.timestamp = Clock::get()?.unix_timestamp;
        vote_record.bump = ctx.bumps.vote_record;
        
        match vote_choice {
            VoteChoice::Yes => proposal.yes_votes += 1,
            VoteChoice::No => proposal.no_votes += 1,
            VoteChoice::Abstain => proposal.abstain_votes += 1,
        }
        
        emit!(VoteCast {
            proposal_id: proposal.id,
            voter: ctx.accounts.voter.key(),
            choice: vote_choice,
            timestamp: vote_record.timestamp,
        });
        
        Ok(())
    }

    pub fn finalize_proposal(ctx: Context<FinalizeProposal>) -> Result<()> {
        let proposal = &mut ctx.accounts.proposal;
        
        require!(
            proposal.status == ProposalStatus::Active,
            ErrorCode::ProposalNotActive
        );
        
        require!(
            ctx.accounts.authority.key() == ctx.accounts.dao_state.authority,
            ErrorCode::Unauthorized
        );
        
        proposal.status = ProposalStatus::Finalized;
        
        let total_votes = proposal.yes_votes + proposal.no_votes + proposal.abstain_votes;
        let passed = proposal.yes_votes > proposal.no_votes;
        
        emit!(ProposalFinalized {
            proposal_id: proposal.id,
            status: proposal.status.clone(),
            total_votes,
            passed,
        });
        
        Ok(())
    }
}

#[derive(Accounts)]
#[instruction(dao_name: String)]
pub struct Initialize<'info> {
    #[account(
        init,
        payer = authority,
        space = 8 + DaoState::INIT_SPACE,
        seeds = [b"dao-state"],
        bump
    )]
    pub dao_state: Account<'info, DaoState>,
    #[account(mut)]
    pub authority: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct CreateProposal<'info> {
    #[account(
        mut,
        seeds = [b"dao-state"],
        bump = dao_state.bump
    )]
    pub dao_state: Account<'info, DaoState>,
    #[account(
        init,
        payer = creator,
        space = 8 + Proposal::INIT_SPACE,
        seeds = [b"proposal", dao_state.proposal_count.to_le_bytes().as_ref()],
        bump
    )]
    pub proposal: Account<'info, Proposal>,
    #[account(mut)]
    pub creator: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct CastVote<'info> {
    #[account(
        mut,
        seeds = [b"proposal", proposal.id.to_le_bytes().as_ref()],
        bump = proposal.bump
    )]
    pub proposal: Account<'info, Proposal>,
    #[account(
        init,
        payer = voter,
        space = 8 + VoteRecord::INIT_SPACE,
        seeds = [b"vote", proposal.key().as_ref(), voter.key().as_ref()],
        bump
    )]
    pub vote_record: Account<'info, VoteRecord>,
    #[account(mut)]
    pub voter: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct FinalizeProposal<'info> {
    #[account(
        seeds = [b"dao-state"],
        bump = dao_state.bump
    )]
    pub dao_state: Account<'info, DaoState>,
    #[account(
        mut,
        seeds = [b"proposal", proposal.id.to_le_bytes().as_ref()],
        bump = proposal.bump
    )]
    pub proposal: Account<'info, Proposal>,
    pub authority: Signer<'info>,
}

#[account]
#[derive(InitSpace)]
pub struct DaoState {
    pub authority: Pubkey,
    #[max_len(50)]
    pub dao_name: String,
    pub proposal_count: u64,
    pub bump: u8,
}

#[account]
#[derive(InitSpace)]
pub struct Proposal {
    pub id: u64,
    pub creator: Pubkey,
    #[max_len(100)]
    pub title: String,
    #[max_len(500)]
    pub description: String,
    pub yes_votes: u64,
    pub no_votes: u64,
    pub abstain_votes: u64,
    pub status: ProposalStatus,
    pub created_at: i64,
    pub bump: u8,
}

#[account]
#[derive(InitSpace)]
pub struct VoteRecord {
    pub voter: Pubkey,
    pub proposal_id: u64,
    pub choice: VoteChoice,
    pub timestamp: i64,
    pub bump: u8,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, PartialEq, Eq, InitSpace)]
pub enum ProposalStatus {
    Active,
    Finalized,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, PartialEq, Eq, InitSpace)]
pub enum VoteChoice {
    Yes,
    No,
    Abstain,
}

#[event]
pub struct DaoInitialized {
    pub authority: Pubkey,
    pub dao_name: String,
}

#[event]
pub struct ProposalCreated {
    pub proposal_id: u64,
    pub creator: Pubkey,
    pub title: String,
    pub created_at: i64,
}

#[event]
pub struct VoteCast {
    pub proposal_id: u64,
    pub voter: Pubkey,
    pub choice: VoteChoice,
    pub timestamp: i64,
}

#[event]
pub struct ProposalFinalized {
    pub proposal_id: u64,
    pub status: ProposalStatus,
    pub total_votes: u64,
    pub passed: bool,
}

#[error_code]
pub enum ErrorCode {
    #[msg("DAO name must be 50 characters or less")]
    NameTooLong,
    #[msg("Proposal title must be 100 characters or less")]
    TitleTooLong,
    #[msg("Proposal description must be 500 characters or less")]
    DescriptionTooLong,
    #[msg("Proposal is not active")]
    ProposalNotActive,
    #[msg("Unauthorized action")]
    Unauthorized,
}
