use anchor_lang::prelude::*;
use anchor_spl::token::{Token, TokenAccount};

declare_id!("HPH6itf3pTzFGReDBju8XhvQ8kgN1Wtpmd4oqXgaXKqp");

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
        dao_state.voting_config = VotingConfig {
            nft_required: false,
            nft_collection: None,
            nft_verified_collection: false,
            token_required: false,
            token_mint: None,
            min_token_amount: 0,
            require_both: false,
        };
        
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
        voting_duration: i64,  // Duration in seconds
    ) -> Result<()> {
        let dao_state = &mut ctx.accounts.dao_state;
        let proposal = &mut ctx.accounts.proposal;
        
        let clock = Clock::get()?;
        let current_timestamp = clock.unix_timestamp;
        
        proposal.id = dao_state.proposal_count;
        proposal.creator = ctx.accounts.creator.key();
        proposal.title = title;
        proposal.description = description;
        proposal.yes_votes = 0;
        proposal.no_votes = 0;
        proposal.abstain_votes = 0;
        proposal.status = ProposalStatus::Active;
        proposal.created_at = current_timestamp;
        proposal.expires_at = current_timestamp + voting_duration;  // Set expiration
        proposal.bump = ctx.bumps.proposal;
        
        dao_state.proposal_count = dao_state.proposal_count.checked_add(1).unwrap();
        
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
        
        // Check if proposal has expired
        let clock = Clock::get()?;
        let current_timestamp = clock.unix_timestamp;
        require!(
            current_timestamp <= proposal.expires_at,
            ErrorCode::ProposalExpired
        );
        
        match vote_choice {
            VoteChoice::Yes => proposal.yes_votes += 1,
            VoteChoice::No => proposal.no_votes += 1,
            VoteChoice::Abstain => proposal.abstain_votes += 1,
        }
        
        vote_record.voter = ctx.accounts.voter.key();
        vote_record.proposal_id = proposal.id;
        vote_record.choice = vote_choice.clone();
        vote_record.timestamp = current_timestamp;
        vote_record.bump = ctx.bumps.vote_record;
        
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
        
        let clock = Clock::get()?;
        let current_timestamp = clock.unix_timestamp;
        
        if current_timestamp > proposal.expires_at {
            proposal.status = ProposalStatus::Expired;
        } else {
            let total_votes = proposal.yes_votes + proposal.no_votes;
            if total_votes == 0 {
                proposal.status = ProposalStatus::Rejected;
            } else {
                let yes_percentage = (proposal.yes_votes as f64 / total_votes as f64) * 100.0;
                proposal.status = if yes_percentage > 50.0 {
                    ProposalStatus::Passed
                } else {
                    ProposalStatus::Rejected
                };
            }
        }
        
        let total_votes = proposal.yes_votes + proposal.no_votes + proposal.abstain_votes;
        let passed = matches!(proposal.status, ProposalStatus::Passed);
        
        emit!(ProposalFinalized {
            proposal_id: proposal.id,
            status: proposal.status.clone(),
            total_votes,
            passed,
        });
        
        Ok(())
    }

    pub fn update_voting_config(
        ctx: Context<UpdateVotingConfig>,
        config: VotingConfig,
    ) -> Result<()> {
        let dao_state = &mut ctx.accounts.dao_state;
        
        // Only authority can update
        require!(
            ctx.accounts.authority.key() == dao_state.authority,
            ErrorCode::Unauthorized
        );
        
        // Validate config
        if config.nft_required {
            require!(
                config.nft_collection.is_some(),
                ErrorCode::InvalidConfiguration
            );
        }
        
        if config.token_required {
            require!(
                config.token_mint.is_some() && config.min_token_amount > 0,
                ErrorCode::InvalidConfiguration
            );
        }
        
        dao_state.voting_config = config;
        
        emit!(VotingConfigUpdated {
            authority: ctx.accounts.authority.key(),
            config: dao_state.voting_config.clone(),
            timestamp: Clock::get()?.unix_timestamp,
        });
        
        Ok(())
    }

    pub fn cast_vote_with_validation(
        ctx: Context<CastVoteWithValidation>,
        vote_choice: VoteChoice,
    ) -> Result<()> {
        let dao_state = &ctx.accounts.dao_state;
        let config = &dao_state.voting_config;
        
        // Check NFT requirement if enabled
        if config.nft_required {
            validate_nft_ownership(&ctx)?;
        }
        
        // Check token requirement if enabled
        if config.token_required {
            validate_token_balance(&ctx)?;
        }
        
        // Rest of voting logic
        let proposal = &mut ctx.accounts.proposal;
        let vote_record = &mut ctx.accounts.vote_record;
        
        require!(
            proposal.status == ProposalStatus::Active,
            ErrorCode::ProposalNotActive
        );
        
        let clock = Clock::get()?;
        let current_timestamp = clock.unix_timestamp;
        require!(
            current_timestamp <= proposal.expires_at,
            ErrorCode::ProposalExpired
        );
        
        match vote_choice {
            VoteChoice::Yes => proposal.yes_votes += 1,
            VoteChoice::No => proposal.no_votes += 1,
            VoteChoice::Abstain => proposal.abstain_votes += 1,
        }
        
        vote_record.voter = ctx.accounts.voter.key();
        vote_record.proposal_id = proposal.id;
        vote_record.choice = vote_choice.clone();
        vote_record.timestamp = current_timestamp;
        vote_record.bump = ctx.bumps.vote_record;
        
        emit!(VoteCast {
            proposal_id: proposal.id,
            voter: ctx.accounts.voter.key(),
            choice: vote_choice,
            timestamp: vote_record.timestamp,
        });
        
        Ok(())
    }
}

fn validate_nft_ownership(ctx: &Context<CastVoteWithValidation>) -> Result<()> {
    // Verify NFT token account
    if let Some(nft_account) = &ctx.accounts.nft_token_account {
        require!(
            nft_account.owner == ctx.accounts.voter.key(),
            ErrorCode::NotNFTOwner
        );
        require!(
            nft_account.amount == 1,
            ErrorCode::InvalidNFT
        );
        
        // For now, we'll just check that they own an NFT
        // In a full implementation, we'd verify the collection through metadata
        // This requires parsing Metaplex metadata which is complex
    } else {
        return err!(ErrorCode::NFTRequired);
    }
    
    Ok(())
}

fn validate_token_balance(ctx: &Context<CastVoteWithValidation>) -> Result<()> {
    let config = &ctx.accounts.dao_state.voting_config;
    let min_amount = config.min_token_amount;
    
    if let Some(token_account) = &ctx.accounts.voter_token_account {
        require!(
            token_account.owner == ctx.accounts.voter.key(),
            ErrorCode::InvalidTokenAccount
        );
        require!(
            token_account.mint == config.token_mint.unwrap(),
            ErrorCode::InvalidTokenMint
        );
        require!(
            token_account.amount >= min_amount,
            ErrorCode::InsufficientTokenBalance
        );
    } else {
        return err!(ErrorCode::TokenRequired);
    }
    
    Ok(())
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

#[derive(Accounts)]
pub struct UpdateVotingConfig<'info> {
    #[account(
        mut,
        seeds = [b"dao-state"],
        bump = dao_state.bump
    )]
    pub dao_state: Account<'info, DaoState>,
    pub authority: Signer<'info>,
}

#[derive(Accounts)]
pub struct CastVoteWithValidation<'info> {
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
    
    // Optional NFT validation accounts
    pub nft_token_account: Option<Account<'info, TokenAccount>>,
    
    // Optional token validation accounts
    pub voter_token_account: Option<Account<'info, TokenAccount>>,
    
    pub system_program: Program<'info, System>,
    pub token_program: Program<'info, Token>,
}

#[account]
#[derive(InitSpace)]
pub struct DaoState {
    pub authority: Pubkey,
    #[max_len(50)]
    pub dao_name: String,
    pub proposal_count: u64,
    pub bump: u8,
    pub voting_config: VotingConfig,
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
    pub expires_at: i64,  // New field: Unix timestamp when voting expires
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
    Passed,
    Rejected,
    Expired,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, PartialEq, Eq, InitSpace)]
pub enum VoteChoice {
    Yes,
    No,
    Abstain,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, InitSpace)]
pub struct VotingConfig {
    // NFT Requirements
    pub nft_required: bool,
    pub nft_collection: Option<Pubkey>,
    pub nft_verified_collection: bool,
    
    // Token Requirements  
    pub token_required: bool,
    pub token_mint: Option<Pubkey>,
    pub min_token_amount: u64,
    
    // Combined Requirements
    pub require_both: bool, // If true, need BOTH NFT and tokens
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

#[event]
pub struct VotingConfigUpdated {
    pub authority: Pubkey,
    pub config: VotingConfig,
    pub timestamp: i64,
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
    #[msg("Proposal has expired")]
    ProposalExpired,
    #[msg("Unauthorized action")]
    Unauthorized,
    #[msg("Must hold NFT from required collection to vote")]
    NFTRequired,
    #[msg("Not the owner of the required NFT")]
    NotNFTOwner,
    #[msg("Invalid NFT")]
    InvalidNFT,
    #[msg("Must hold minimum token amount to vote")]
    TokenRequired,
    #[msg("Must hold minimum token amount to vote")]
    InsufficientTokenBalance,
    #[msg("Invalid token account")]
    InvalidTokenAccount,
    #[msg("Invalid token mint")]
    InvalidTokenMint,
    #[msg("Invalid configuration parameters")]
    InvalidConfiguration,
}
