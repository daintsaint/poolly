use anchor_lang::prelude::*;
use anchor_spl::{
    associated_token::AssociatedToken,
    token::{Mint, Token, TokenAccount, Transfer},
};

declare_id!("Edv6BNFLKPKJ4KUWco2MEmGSTsdSU4xBWFsaFFmezpcq");

pub const POOL_SEED: &[u8]   = b"pool";
pub const MEMBER_SEED: &[u8] = b"member";
pub const PLATFORM_FEE_BPS: u64  = 600;   // 6%
pub const BPS_DENOMINATOR:  u64  = 10_000;
// Replace with a multisig before mainnet
pub const ADMIN_PUBKEY: &str = "HR1eiDbC9NKtUtLLfX4FS2DXnPA3NmZyYhcAdgg95W6U";

// ─── Program ─────────────────────────────────────────────────────────────────

#[program]
pub mod poolly {
    use super::*;

    // ── Create pool ──────────────────────────────────────────────────────────

    pub fn create_pool(ctx: Context<CreatePool>, params: CreatePoolParams) -> Result<()> {
        require!(params.price_per_slot > 0, PoolError::InvalidPrice);
        require!(params.max_slots >= 2 && params.max_slots <= 50, PoolError::InvalidSlots);
        require!(params.min_slots >= 1 && params.min_slots <= params.max_slots, PoolError::InvalidSlots);
        require!(params.cycle_days >= 7 && params.cycle_days <= 365, PoolError::InvalidCycle);
        require!(params.title.len() >= 1 && params.title.len() <= 64, PoolError::TitleTooLong);

        let pool = &mut ctx.accounts.pool;
        pool.host         = ctx.accounts.host.key();
        pool.mint         = ctx.accounts.mint.key();
        pool.title        = params.title;
        pool.category     = params.category;
        pool.price_per_slot = params.price_per_slot;
        pool.max_slots    = params.max_slots;
        pool.min_slots    = params.min_slots;
        pool.filled_slots = 0;
        pool.cycle_days   = params.cycle_days;
        pool.status       = PoolStatus::Pending;
        pool.created_at   = Clock::get()?.unix_timestamp;
        pool.next_charge_at = 0;
        pool.total_cycles = 0;
        pool.is_disputed  = false;
        pool.bump         = ctx.bumps.pool;

        emit!(PoolCreated {
            pool: pool.key(),
            host: pool.host,
            title: pool.title.clone(),
            price_per_slot: pool.price_per_slot,
            max_slots: pool.max_slots,
        });

        Ok(())
    }

    // ── Join pool ────────────────────────────────────────────────────────────

    pub fn join_pool(ctx: Context<JoinPool>) -> Result<()> {
        let pool = &mut ctx.accounts.pool;

        require!(
            pool.status == PoolStatus::Pending || pool.status == PoolStatus::Active,
            PoolError::PoolNotOpen
        );
        require!(pool.filled_slots < pool.max_slots, PoolError::PoolFull);
        require!(!pool.is_disputed, PoolError::PoolDisputed);

        // Transfer first cycle payment into escrow
        anchor_spl::token::transfer(
            CpiContext::new(
                ctx.accounts.token_program.to_account_info(),
                Transfer {
                    from:      ctx.accounts.member_token.to_account_info(),
                    to:        ctx.accounts.escrow_token.to_account_info(),
                    authority: ctx.accounts.member.to_account_info(),
                },
            ),
            pool.price_per_slot,
        )?;

        pool.filled_slots += 1;

        // Activate pool if min slots reached
        if pool.status == PoolStatus::Pending && pool.filled_slots >= pool.min_slots {
            pool.status       = PoolStatus::Active;
            pool.next_charge_at = Clock::get()?.unix_timestamp + (pool.cycle_days as i64 * 86_400);
        }

        let member = &mut ctx.accounts.member_record;
        member.pool      = pool.key();
        member.wallet    = ctx.accounts.member.key();
        member.joined_at = Clock::get()?.unix_timestamp;
        member.cycles_paid = 1;
        member.bump      = ctx.bumps.member_record;

        emit!(MemberJoined {
            pool:         pool.key(),
            member:       ctx.accounts.member.key(),
            filled_slots: pool.filled_slots,
        });

        Ok(())
    }

    // ── Leave pool (member exit + refund) ────────────────────────────────────

    pub fn leave_pool(ctx: Context<LeavePool>) -> Result<()> {
        // Extract needed values before any mutable borrow
        let status      = ctx.accounts.pool.status.clone();
        let host        = ctx.accounts.pool.host;
        let min_slots   = ctx.accounts.pool.min_slots;
        let price       = ctx.accounts.pool.price_per_slot;
        let host_key    = ctx.accounts.pool.host;
        let title_bytes = ctx.accounts.pool.title.as_bytes().to_vec();
        let bump        = ctx.accounts.pool.bump;
        let pool_key    = ctx.accounts.pool.key();
        let member_key  = ctx.accounts.member.key();

        require!(
            status == PoolStatus::Pending || status == PoolStatus::Active,
            PoolError::PoolNotOpen
        );
        require!(member_key != host, PoolError::HostCannotLeave);

        let seeds: &[&[u8]] = &[POOL_SEED, host_key.as_ref(), &title_bytes, &[bump]];
        let signer_seeds = &[seeds];

        anchor_spl::token::transfer(
            CpiContext::new_with_signer(
                ctx.accounts.token_program.to_account_info(),
                Transfer {
                    from:      ctx.accounts.escrow_token.to_account_info(),
                    to:        ctx.accounts.member_token.to_account_info(),
                    authority: ctx.accounts.pool.to_account_info(),
                },
                signer_seeds,
            ),
            price,
        )?;

        // Re-borrow mutably for state update
        let pool = &mut ctx.accounts.pool;
        pool.filled_slots -= 1;
        if status == PoolStatus::Active && pool.filled_slots < min_slots {
            pool.status = PoolStatus::Pending;
        }

        emit!(MemberLeft { pool: pool_key, member: member_key, filled_slots: pool.filled_slots });

        Ok(())
    }

    // ── Submit proof (host delivers) ─────────────────────────────────────────

    pub fn submit_proof(ctx: Context<SubmitProof>, proof_uri: String) -> Result<()> {
        require!(proof_uri.len() >= 1 && proof_uri.len() <= 200, PoolError::UriTooLong);

        let pool = &mut ctx.accounts.pool;
        require!(pool.host == ctx.accounts.host.key(), PoolError::Unauthorized);
        require!(pool.status == PoolStatus::Active, PoolError::PoolNotActive);
        require!(!pool.is_disputed, PoolError::PoolDisputed);

        pool.last_proof_uri = proof_uri.clone();
        pool.total_cycles  += 1;
        pool.next_charge_at = Clock::get()?.unix_timestamp + (pool.cycle_days as i64 * 86_400);

        emit!(ProofSubmitted {
            pool:      pool.key(),
            proof_uri,
            cycle:     pool.total_cycles,
        });

        Ok(())
    }

    // ── Release funds (host payout) ──────────────────────────────────────────

    pub fn release_funds(ctx: Context<ReleaseFunds>) -> Result<()> {
        let pool = &ctx.accounts.pool;

        require!(pool.status == PoolStatus::Active, PoolError::PoolNotActive);
        require!(pool.host == ctx.accounts.host.key(), PoolError::Unauthorized);
        require!(!pool.is_disputed, PoolError::PoolDisputed);

        let escrow_balance = ctx.accounts.escrow_token.amount;
        require!(escrow_balance > 0, PoolError::NoFunds);

        let fee = escrow_balance
            .checked_mul(PLATFORM_FEE_BPS).unwrap()
            .checked_div(BPS_DENOMINATOR).unwrap();
        let host_amount = escrow_balance.checked_sub(fee).unwrap();

        let host_key    = pool.host;
        let title_bytes = pool.title.as_bytes().to_vec();
        let bump        = pool.bump;
        let seeds: &[&[u8]] = &[POOL_SEED, host_key.as_ref(), &title_bytes, &[bump]];
        let signer_seeds = &[seeds];

        anchor_spl::token::transfer(
            CpiContext::new_with_signer(
                ctx.accounts.token_program.to_account_info(),
                Transfer {
                    from:      ctx.accounts.escrow_token.to_account_info(),
                    to:        ctx.accounts.host_token.to_account_info(),
                    authority: ctx.accounts.pool.to_account_info(),
                },
                signer_seeds,
            ),
            host_amount,
        )?;

        if fee > 0 {
            anchor_spl::token::transfer(
                CpiContext::new_with_signer(
                    ctx.accounts.token_program.to_account_info(),
                    Transfer {
                        from:      ctx.accounts.escrow_token.to_account_info(),
                        to:        ctx.accounts.platform_token.to_account_info(),
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

    // ── Flag dispute (any member) ────────────────────────────────────────────

    pub fn flag_dispute(ctx: Context<FlagDispute>) -> Result<()> {
        let pool = &mut ctx.accounts.pool;

        require!(pool.status == PoolStatus::Active, PoolError::PoolNotActive);
        require!(!pool.is_disputed, PoolError::AlreadyDisputed);

        pool.is_disputed = true;

        emit!(DisputeFlagged {
            pool:   pool.key(),
            member: ctx.accounts.member.key(),
        });

        Ok(())
    }

    // ── Resolve dispute (admin only) ─────────────────────────────────────────
    // in_favor_of_host = true  → clear dispute flag, host can release_funds normally
    // in_favor_of_host = false → close pool, members can claim_refund

    pub fn resolve_dispute(ctx: Context<ResolveDispute>, in_favor_of_host: bool) -> Result<()> {
        let admin_key: Pubkey = ADMIN_PUBKEY.parse().unwrap();
        require!(ctx.accounts.admin.key() == admin_key, PoolError::NotAdmin);

        let pool = &mut ctx.accounts.pool;
        require!(pool.is_disputed, PoolError::NotDisputed);

        pool.is_disputed = false;

        if !in_favor_of_host {
            pool.status = PoolStatus::Closed; // members claim refunds
        }

        emit!(DisputeResolved {
            pool:             pool.key(),
            in_favor_of_host,
        });

        Ok(())
    }

    // ── Claim refund (member, after pool is closed) ──────────────────────────

    pub fn claim_refund(ctx: Context<ClaimRefund>) -> Result<()> {
        // Extract before any borrow
        let status      = ctx.accounts.pool.status.clone();
        let price       = ctx.accounts.pool.price_per_slot;
        let host_key    = ctx.accounts.pool.host;
        let title_bytes = ctx.accounts.pool.title.as_bytes().to_vec();
        let bump        = ctx.accounts.pool.bump;
        let pool_key    = ctx.accounts.pool.key();
        let member_key  = ctx.accounts.member.key();

        require!(status == PoolStatus::Closed, PoolError::PoolNotClosed);

        let escrow_balance = ctx.accounts.escrow_token.amount;
        require!(escrow_balance > 0, PoolError::NoFunds);

        let refund = price.min(escrow_balance);

        let seeds: &[&[u8]] = &[POOL_SEED, host_key.as_ref(), &title_bytes, &[bump]];
        let signer_seeds = &[seeds];

        anchor_spl::token::transfer(
            CpiContext::new_with_signer(
                ctx.accounts.token_program.to_account_info(),
                Transfer {
                    from:      ctx.accounts.escrow_token.to_account_info(),
                    to:        ctx.accounts.member_token.to_account_info(),
                    authority: ctx.accounts.pool.to_account_info(),
                },
                signer_seeds,
            ),
            refund,
        )?;

        emit!(RefundClaimed { pool: pool_key, member: member_key, amount: refund });

        Ok(())
    }

    // ── Close pool (host) ────────────────────────────────────────────────────
    // Marks pool closed. Escrow is frozen — members call claim_refund to recover.
    // Host should call release_funds BEFORE closing if they want their payout.

    pub fn close_pool(ctx: Context<ClosePool>) -> Result<()> {
        let pool = &mut ctx.accounts.pool;
        require!(pool.host == ctx.accounts.host.key(), PoolError::Unauthorized);
        require!(pool.status != PoolStatus::Closed, PoolError::AlreadyClosed);

        pool.status = PoolStatus::Closed;

        emit!(PoolClosed { pool: pool.key() });

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
pub struct LeavePool<'info> {
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
        mut,
        close = member,
        seeds = [MEMBER_SEED, pool.key().as_ref(), member.key().as_ref()],
        bump = member_record.bump,
    )]
    pub member_record: Account<'info, MemberRecord>,

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

    /// CHECK: platform wallet receives 6% fee
    #[account(mut)]
    pub platform_token: Account<'info, TokenAccount>,

    pub token_program: Program<'info, Token>,
}

#[derive(Accounts)]
pub struct FlagDispute<'info> {
    #[account(mut)]
    pub member: Signer<'info>,

    #[account(mut)]
    pub pool: Account<'info, Pool>,

    /// Verifies caller is a pool member
    #[account(
        seeds = [MEMBER_SEED, pool.key().as_ref(), member.key().as_ref()],
        bump = member_record.bump,
    )]
    pub member_record: Account<'info, MemberRecord>,
}

#[derive(Accounts)]
pub struct ResolveDispute<'info> {
    pub admin: Signer<'info>,

    #[account(mut)]
    pub pool: Account<'info, Pool>,
}

#[derive(Accounts)]
pub struct ClaimRefund<'info> {
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
        mut,
        close = member,
        seeds = [MEMBER_SEED, pool.key().as_ref(), member.key().as_ref()],
        bump = member_record.bump,
    )]
    pub member_record: Account<'info, MemberRecord>,

    pub token_program: Program<'info, Token>,
}

#[derive(Accounts)]
pub struct ClosePool<'info> {
    pub host: Signer<'info>,

    #[account(
        mut,
        has_one = host @ PoolError::Unauthorized,
    )]
    pub pool: Account<'info, Pool>,
}

// ─── State ───────────────────────────────────────────────────────────────────

#[account]
pub struct Pool {
    pub host: Pubkey,           // 32
    pub mint: Pubkey,           // 32
    pub title: String,          // 4 + 64
    pub category: u8,           // 1
    pub price_per_slot: u64,    // 8
    pub max_slots: u8,          // 1
    pub min_slots: u8,          // 1
    pub filled_slots: u8,       // 1
    pub cycle_days: u16,        // 2
    pub status: PoolStatus,     // 1
    pub created_at: i64,        // 8
    pub next_charge_at: i64,    // 8
    pub total_cycles: u32,      // 4
    pub last_proof_uri: String, // 4 + 200
    pub is_disputed: bool,      // 1
    pub bump: u8,               // 1
}

impl Pool {
    pub const LEN: usize = 8      // discriminator
        + 32 + 32                  // host, mint
        + (4 + 64)                 // title
        + 1                        // category
        + 8                        // price_per_slot
        + 1 + 1 + 1                // max/min/filled slots
        + 2                        // cycle_days
        + 1                        // status
        + 8 + 8                    // timestamps
        + 4                        // total_cycles
        + (4 + 200)                // last_proof_uri
        + 1                        // is_disputed
        + 1;                       // bump
}

#[account]
pub struct MemberRecord {
    pub pool:        Pubkey, // 32
    pub wallet:      Pubkey, // 32
    pub joined_at:   i64,   // 8
    pub cycles_paid: u32,   // 4
    pub bump:        u8,    // 1
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
    pub title:          String,
    pub category:       u8,
    pub price_per_slot: u64,
    pub max_slots:      u8,
    pub min_slots:      u8,
    pub cycle_days:     u16,
}

// ─── Events ──────────────────────────────────────────────────────────────────

#[event] pub struct PoolCreated    { pub pool: Pubkey, pub host: Pubkey, pub title: String, pub price_per_slot: u64, pub max_slots: u8 }
#[event] pub struct MemberJoined   { pub pool: Pubkey, pub member: Pubkey, pub filled_slots: u8 }
#[event] pub struct MemberLeft     { pub pool: Pubkey, pub member: Pubkey, pub filled_slots: u8 }
#[event] pub struct FundsReleased  { pub pool: Pubkey, pub host_amount: u64, pub fee: u64 }
#[event] pub struct ProofSubmitted { pub pool: Pubkey, pub proof_uri: String, pub cycle: u32 }
#[event] pub struct DisputeFlagged { pub pool: Pubkey, pub member: Pubkey }
#[event] pub struct DisputeResolved{ pub pool: Pubkey, pub in_favor_of_host: bool }
#[event] pub struct RefundClaimed  { pub pool: Pubkey, pub member: Pubkey, pub amount: u64 }
#[event] pub struct PoolClosed     { pub pool: Pubkey }

// ─── Errors ──────────────────────────────────────────────────────────────────

#[error_code]
pub enum PoolError {
    #[msg("Price must be greater than zero")]                    InvalidPrice,
    #[msg("Slots must be between 1 and 50")]                     InvalidSlots,
    #[msg("Cycle must be between 7 and 365 days")]               InvalidCycle,
    #[msg("Title must be 1–64 characters")]                      TitleTooLong,
    #[msg("Proof URI must be 1–200 characters")]                 UriTooLong,
    #[msg("Pool is not open for joining")]                       PoolNotOpen,
    #[msg("Pool is full")]                                       PoolFull,
    #[msg("Already a member of this pool")]                      AlreadyMember,
    #[msg("Pool is not active")]                                 PoolNotActive,
    #[msg("Pool is not closed")]                                 PoolNotClosed,
    #[msg("No funds in escrow")]                                 NoFunds,
    #[msg("Unauthorized")]                                       Unauthorized,
    #[msg("Pool is already closed")]                             AlreadyClosed,
    #[msg("Host cannot leave their own pool — close it instead")] HostCannotLeave,
    #[msg("Pool is under dispute — release blocked")]            PoolDisputed,
    #[msg("Pool is already flagged as disputed")]                AlreadyDisputed,
    #[msg("Pool has no active dispute")]                         NotDisputed,
    #[msg("Caller is not the admin")]                            NotAdmin,
}
