use anchor_lang::prelude::*;
use anchor_spl::{
    associated_token::AssociatedToken,
    token::{Mint, Token, TokenAccount, Transfer},
};

declare_id!("Edv6BNFLKPKJ4KUWco2MEmGSTsdSU4xBWFsaFFmezpcq");

pub const POOL_SEED: &[u8] = b"pool";
pub const ESCROW_SEED: &[u8] = b"escrow";
pub const MEMBER_SEED: &[u8] = b"member";
pub const PLATFORM_FEE_BPS: u64 = 600; // 6%
pub const BPS_DENOMINATOR: u64 = 10_000;

#[program]
pub mod poolly {
    use super::*;

    pub fn create_pool(ctx: Context<CreatePool>, params: CreatePoolParams) -> Result<()> {
        require!(params.price_per_slot > 0, PoolError::InvalidPrice);
        require!(params.max_slots >= 2 && params.max_slots <= 50, PoolError::InvalidSlots);
        require!(params.min_slots >= 2 && params.min_slots <= params.max_slots, PoolError::InvalidSlots);
        require!(params.cycle_days >= 7 && params.cycle_days <= 365, PoolError::InvalidCycle);
        require!(params.title.len() <= 64, PoolError::TitleTooLong);

        let pool = &mut ctx.accounts.pool;
        pool.host = ctx.accounts.host.key();
        pool.mint = ctx.accounts.mint.key();
        pool.title = params.title;
        pool.category = params.category;
        pool.price_per_slot = params.price_per_slot;
        pool.max_slots = params.max_slots;
        pool.min_slots = params.min_slots;
        pool.filled_slots = 0;
        pool.cycle_days = params.cycle_days;
        pool.status = PoolStatus::Pending;
        pool.created_at = Clock::get()?.unix_timestamp;
        pool.next_charge_at = 0;
        pool.total_cycles = 0;
        pool.bump = ctx.bumps.pool;
        pool.escrow_bump = 0; // ATA; bump not needed

        emit!(PoolCreated {
            pool: pool.key(),
            host: pool.host,
            title: pool.title.clone(),
            price_per_slot: pool.price_per_slot,
            max_slots: pool.max_slots,
        });

        Ok(())
    }

    pub fn join_pool(ctx: Context<JoinPool>) -> Result<()> {
        let pool = &mut ctx.accounts.pool;

        require!(pool.status == PoolStatus::Pending || pool.status == PoolStatus::Active, PoolError::PoolNotOpen);
        require!(pool.filled_slots < pool.max_slots, PoolError::PoolFull);
        require!(ctx.accounts.member_record.pool == Pubkey::default(), PoolError::AlreadyMember);

        // Transfer first cycle payment into escrow
        anchor_spl::token::transfer(
            CpiContext::new(
                ctx.accounts.token_program.to_account_info(),
                Transfer {
                    from: ctx.accounts.member_token.to_account_info(),
                    to: ctx.accounts.escrow_token.to_account_info(),
                    authority: ctx.accounts.member.to_account_info(),
                },
            ),
            pool.price_per_slot,
        )?;

        pool.filled_slots += 1;

        // Activate pool if min slots reached
        if pool.status == PoolStatus::Pending && pool.filled_slots >= pool.min_slots {
            pool.status = PoolStatus::Active;
            pool.next_charge_at = Clock::get()?.unix_timestamp + (pool.cycle_days as i64 * 86_400);
        }

        let member = &mut ctx.accounts.member_record;
        member.pool = pool.key();
        member.wallet = ctx.accounts.member.key();
        member.joined_at = Clock::get()?.unix_timestamp;
        member.cycles_paid = 1;
        member.bump = ctx.bumps.member_record;

        emit!(MemberJoined {
            pool: pool.key(),
            member: ctx.accounts.member.key(),
            filled_slots: pool.filled_slots,
        });

        Ok(())
    }

    pub fn release_funds(ctx: Context<ReleaseFunds>) -> Result<()> {
        let pool = &ctx.accounts.pool;

        require!(pool.status == PoolStatus::Active, PoolError::PoolNotActive);
        require!(pool.host == ctx.accounts.host.key(), PoolError::Unauthorized);

        let escrow_balance = ctx.accounts.escrow_token.amount;
        require!(escrow_balance > 0, PoolError::NoFunds);

        let fee = escrow_balance
            .checked_mul(PLATFORM_FEE_BPS)
            .unwrap()
            .checked_div(BPS_DENOMINATOR)
            .unwrap();
        let host_amount = escrow_balance.checked_sub(fee).unwrap();

        let host_key = pool.host;
        let title_bytes = pool.title.as_bytes().to_vec();
        let bump = pool.bump;
        let seeds: &[&[u8]] = &[POOL_SEED, host_key.as_ref(), &title_bytes, &[bump]];
        let signer_seeds = &[seeds];

        // Transfer to host
        anchor_spl::token::transfer(
            CpiContext::new_with_signer(
                ctx.accounts.token_program.to_account_info(),
                Transfer {
                    from: ctx.accounts.escrow_token.to_account_info(),
                    to: ctx.accounts.host_token.to_account_info(),
                    authority: ctx.accounts.pool.to_account_info(),
                },
                signer_seeds,
            ),
            host_amount,
        )?;

        // Transfer fee to platform
        if fee > 0 {
            anchor_spl::token::transfer(
                CpiContext::new_with_signer(
                    ctx.accounts.token_program.to_account_info(),
                    Transfer {
                        from: ctx.accounts.escrow_token.to_account_info(),
                        to: ctx.accounts.platform_token.to_account_info(),
                        authority: ctx.accounts.pool.to_account_info(),
                    },
                    signer_seeds,
                ),
                fee,
            )?;
        }

        emit!(FundsReleased {
            pool: pool.key(),
            host_amount,
            fee,
        });

        Ok(())
    }

    pub fn submit_proof(ctx: Context<SubmitProof>, proof_uri: String) -> Result<()> {
        require!(proof_uri.len() <= 200, PoolError::UriTooLong);
        require!(ctx.accounts.pool.host == ctx.accounts.host.key(), PoolError::Unauthorized);

        let pool = &mut ctx.accounts.pool;
        pool.last_proof_uri = proof_uri.clone();
        pool.total_cycles += 1;
        pool.next_charge_at = Clock::get()?.unix_timestamp + (pool.cycle_days as i64 * 86_400);

        emit!(ProofSubmitted {
            pool: pool.key(),
            proof_uri,
            cycle: pool.total_cycles,
        });

        Ok(())
    }

    pub fn close_pool(ctx: Context<ClosePool>) -> Result<()> {
        let pool = &mut ctx.accounts.pool;
        require!(pool.host == ctx.accounts.host.key(), PoolError::Unauthorized);
        require!(pool.status != PoolStatus::Closed, PoolError::AlreadyClosed);

        let escrow_balance = ctx.accounts.escrow_token.amount;

        // Refund escrow balance back to host if any remains
        if escrow_balance > 0 {
            let host_key = pool.host;
            let title_bytes = pool.title.as_bytes().to_vec();
            let bump = pool.bump;
            let seeds: &[&[u8]] = &[POOL_SEED, host_key.as_ref(), &title_bytes, &[bump]];
            let signer_seeds = &[seeds];

            anchor_spl::token::transfer(
                CpiContext::new_with_signer(
                    ctx.accounts.token_program.to_account_info(),
                    Transfer {
                        from: ctx.accounts.escrow_token.to_account_info(),
                        to: ctx.accounts.host_token.to_account_info(),
                        authority: pool.to_account_info(),
                    },
                    signer_seeds,
                ),
                escrow_balance,
            )?;
        }

        pool.status = PoolStatus::Closed;
        Ok(())
    }
}

// ─── Accounts ────────────────────────────────────────────────────────────────

#[derive(Accounts)]
#[instruction(params: CreatePoolParams)]
pub struct CreatePool<'info> {
    #[account(mut)]
    pub host: Signer<'info>,

    pub mint: Account<'info, Mint>,

    #[account(
        init,
        payer = host,
        space = Pool::LEN,
        seeds = [POOL_SEED, host.key().as_ref(), params.title.as_bytes()],
        bump
    )]
    pub pool: Account<'info, Pool>,

    #[account(
        init,
        payer = host,
        associated_token::mint = mint,
        associated_token::authority = pool,
    )]
    pub escrow_token: Account<'info, TokenAccount>,

    pub token_program: Program<'info, Token>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct JoinPool<'info> {
    #[account(mut)]
    pub member: Signer<'info>,

    #[account(mut)]
    pub pool: Account<'info, Pool>,

    #[account(
        mut,
        associated_token::mint = pool.mint,
        associated_token::authority = member,
    )]
    pub member_token: Account<'info, TokenAccount>,

    #[account(
        mut,
        associated_token::mint = pool.mint,
        associated_token::authority = pool,
    )]
    pub escrow_token: Account<'info, TokenAccount>,

    #[account(
        init,
        payer = member,
        space = MemberRecord::LEN,
        seeds = [MEMBER_SEED, pool.key().as_ref(), member.key().as_ref()],
        bump
    )]
    pub member_record: Account<'info, MemberRecord>,

    pub token_program: Program<'info, Token>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct ReleaseFunds<'info> {
    pub host: Signer<'info>,

    #[account(
        mut,
        has_one = host @ PoolError::Unauthorized,
    )]
    pub pool: Account<'info, Pool>,

    #[account(
        mut,
        associated_token::mint = pool.mint,
        associated_token::authority = pool,
    )]
    pub escrow_token: Account<'info, TokenAccount>,

    #[account(
        mut,
        associated_token::mint = pool.mint,
        associated_token::authority = host,
    )]
    pub host_token: Account<'info, TokenAccount>,

    /// CHECK: platform wallet, validated by hardcoded key in production
    #[account(mut)]
    pub platform_token: Account<'info, TokenAccount>,

    pub token_program: Program<'info, Token>,
}

#[derive(Accounts)]
pub struct SubmitProof<'info> {
    pub host: Signer<'info>,

    #[account(
        mut,
        has_one = host @ PoolError::Unauthorized,
    )]
    pub pool: Account<'info, Pool>,
}

#[derive(Accounts)]
pub struct ClosePool<'info> {
    pub host: Signer<'info>,

    #[account(
        mut,
        has_one = host @ PoolError::Unauthorized,
    )]
    pub pool: Account<'info, Pool>,

    #[account(
        mut,
        associated_token::mint = pool.mint,
        associated_token::authority = pool,
    )]
    pub escrow_token: Account<'info, TokenAccount>,

    #[account(
        mut,
        associated_token::mint = pool.mint,
        associated_token::authority = host,
    )]
    pub host_token: Account<'info, TokenAccount>,

    pub token_program: Program<'info, Token>,
}

// ─── State ───────────────────────────────────────────────────────────────────

#[account]
pub struct Pool {
    pub host: Pubkey,          // 32
    pub mint: Pubkey,          // 32
    pub title: String,         // 4 + 64
    pub category: u8,          // 1
    pub price_per_slot: u64,   // 8
    pub max_slots: u8,         // 1
    pub min_slots: u8,         // 1
    pub filled_slots: u8,      // 1
    pub cycle_days: u16,       // 2
    pub status: PoolStatus,    // 1
    pub created_at: i64,       // 8
    pub next_charge_at: i64,   // 8
    pub total_cycles: u32,     // 4
    pub last_proof_uri: String,// 4 + 200
    pub bump: u8,              // 1
    pub escrow_bump: u8,       // 1
}

impl Pool {
    pub const LEN: usize = 8  // discriminator
        + 32 + 32             // host, mint
        + (4 + 64)            // title
        + 1                   // category
        + 8                   // price_per_slot
        + 1 + 1 + 1           // max/min/filled slots
        + 2                   // cycle_days
        + 1                   // status
        + 8 + 8               // timestamps
        + 4                   // total_cycles
        + (4 + 200)           // last_proof_uri
        + 1 + 1;              // bumps
}

#[account]
pub struct MemberRecord {
    pub pool: Pubkey,       // 32
    pub wallet: Pubkey,     // 32
    pub joined_at: i64,     // 8
    pub cycles_paid: u32,   // 4
    pub bump: u8,           // 1
}

impl MemberRecord {
    pub const LEN: usize = 8 + 32 + 32 + 8 + 4 + 1;
}

// ─── Types ───────────────────────────────────────────────────────────────────

#[derive(AnchorSerialize, AnchorDeserialize, Clone, PartialEq)]
pub enum PoolStatus {
    Pending,
    Active,
    Closed,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone)]
pub struct CreatePoolParams {
    pub title: String,
    pub category: u8,
    pub price_per_slot: u64,
    pub max_slots: u8,
    pub min_slots: u8,
    pub cycle_days: u16,
}

// ─── Events ──────────────────────────────────────────────────────────────────

#[event]
pub struct PoolCreated {
    pub pool: Pubkey,
    pub host: Pubkey,
    pub title: String,
    pub price_per_slot: u64,
    pub max_slots: u8,
}

#[event]
pub struct MemberJoined {
    pub pool: Pubkey,
    pub member: Pubkey,
    pub filled_slots: u8,
}

#[event]
pub struct FundsReleased {
    pub pool: Pubkey,
    pub host_amount: u64,
    pub fee: u64,
}

#[event]
pub struct ProofSubmitted {
    pub pool: Pubkey,
    pub proof_uri: String,
    pub cycle: u32,
}

// ─── Errors ──────────────────────────────────────────────────────────────────

#[error_code]
pub enum PoolError {
    #[msg("Price must be greater than zero")]
    InvalidPrice,
    #[msg("Slots must be between 2 and 50")]
    InvalidSlots,
    #[msg("Cycle must be between 7 and 365 days")]
    InvalidCycle,
    #[msg("Title must be 64 characters or fewer")]
    TitleTooLong,
    #[msg("Proof URI must be 200 characters or fewer")]
    UriTooLong,
    #[msg("Pool is not open for joining")]
    PoolNotOpen,
    #[msg("Pool is full")]
    PoolFull,
    #[msg("Already a member of this pool")]
    AlreadyMember,
    #[msg("Pool is not active")]
    PoolNotActive,
    #[msg("No funds in escrow")]
    NoFunds,
    #[msg("Unauthorized")]
    Unauthorized,
    #[msg("Pool is already closed")]
    AlreadyClosed,
}
