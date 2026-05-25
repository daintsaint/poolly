"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import { useAnchorWallet, useConnection, useWallet } from "@solana/wallet-adapter-react";
import { AnchorProvider } from "@coral-xyz/anchor";
import { PublicKey, SystemProgram } from "@solana/web3.js";
import {
  getAssociatedTokenAddressSync,
  TOKEN_PROGRAM_ID,
  ASSOCIATED_TOKEN_PROGRAM_ID,
} from "@solana/spl-token";
import {
  getProgram,
  formatUsdc,
  isPoolActive,
  isPoolPending,
  type PoolAccount,
} from "@/lib/poolly-client";
import { CATEGORIES, PLATFORM_WALLET } from "@/lib/constants";

export default function PoolDetailPage() {
  const { address } = useParams<{ address: string }>();
  const { connection } = useConnection();
  const wallet = useAnchorWallet();
  const { publicKey } = useWallet();

  const [pool, setPool] = useState<PoolAccount | null>(null);
  const [loading, setLoading] = useState(true);
  const [escrowBalance, setEscrowBalance] = useState<number | null>(null);

  const [joining, setJoining] = useState(false);
  const [joinError, setJoinError] = useState("");
  const [joinTx, setJoinTx] = useState("");

  const [proofUri, setProofUri] = useState("");
  const [submittingProof, setSubmittingProof] = useState(false);
  const [releasingFunds, setReleasingFunds] = useState(false);
  const [closingPool, setClosingPool] = useState(false);
  const [hostError, setHostError] = useState("");
  const [hostSuccess, setHostSuccess] = useState("");
  const [confirmClose, setConfirmClose] = useState(false);

  const loadPool = useCallback(async () => {
    try {
      const provider = new AnchorProvider(connection, {} as never, {});
      const program = getProgram(provider);
      const poolKey = new PublicKey(address);
      const data = await program.account.pool.fetch(poolKey);
      const poolAcc: PoolAccount = { publicKey: poolKey, ...data };
      setPool(poolAcc);

      const escrowAta = getAssociatedTokenAddressSync(poolAcc.mint, poolKey, true);
      try {
        const bal = await connection.getTokenAccountBalance(escrowAta);
        setEscrowBalance(bal.value.uiAmount ?? 0);
      } catch {
        setEscrowBalance(0);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [address, connection]);

  useEffect(() => { loadPool(); }, [loadPool]);

  async function joinPool() {
    if (!wallet || !pool) return;
    setJoining(true);
    setJoinError("");
    try {
      const provider = new AnchorProvider(connection, wallet, { commitment: "confirmed" });
      const program = getProgram(provider);
      const memberToken = getAssociatedTokenAddressSync(pool.mint, wallet.publicKey);
      const escrowToken = getAssociatedTokenAddressSync(pool.mint, pool.publicKey, true);

      const sig = await program.methods.joinPool().accounts({
        pool: pool.publicKey, member: wallet.publicKey,
        memberToken, escrowToken,
        tokenProgram: TOKEN_PROGRAM_ID,
        associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
        systemProgram: SystemProgram.programId,
      }).rpc();

      setJoinTx(sig);
      await loadPool();
    } catch (e: unknown) {
      setJoinError(e instanceof Error ? e.message : "Transaction failed");
    } finally {
      setJoining(false);
    }
  }

  async function submitProof() {
    if (!wallet || !pool || !proofUri.trim()) return;
    setSubmittingProof(true);
    setHostError(""); setHostSuccess("");
    try {
      const provider = new AnchorProvider(connection, wallet, { commitment: "confirmed" });
      const program = getProgram(provider);
      await program.methods.submitProof(proofUri.trim())
        .accounts({ host: wallet.publicKey, pool: pool.publicKey }).rpc();
      setProofUri("");
      setHostSuccess("Proof submitted — cycle recorded on-chain.");
      await loadPool();
    } catch (e: unknown) {
      setHostError(e instanceof Error ? e.message : "Transaction failed");
    } finally {
      setSubmittingProof(false);
    }
  }

  async function releaseFunds() {
    if (!wallet || !pool) return;
    setReleasingFunds(true);
    setHostError(""); setHostSuccess("");
    try {
      const provider = new AnchorProvider(connection, wallet, { commitment: "confirmed" });
      const program = getProgram(provider);
      const escrowToken = getAssociatedTokenAddressSync(pool.mint, pool.publicKey, true);
      const hostToken = getAssociatedTokenAddressSync(pool.mint, wallet.publicKey);
      const platformToken = getAssociatedTokenAddressSync(pool.mint, PLATFORM_WALLET);

      await program.methods.releaseFunds().accounts({
        host: wallet.publicKey, pool: pool.publicKey,
        escrowToken, hostToken, platformToken,
        tokenProgram: TOKEN_PROGRAM_ID,
      }).rpc();

      setHostSuccess("Funds released to your wallet (6% platform fee deducted).");
      await loadPool();
    } catch (e: unknown) {
      setHostError(e instanceof Error ? e.message : "Transaction failed");
    } finally {
      setReleasingFunds(false);
    }
  }

  async function closePool() {
    if (!wallet || !pool) return;
    setClosingPool(true);
    setHostError(""); setHostSuccess("");
    try {
      const provider = new AnchorProvider(connection, wallet, { commitment: "confirmed" });
      const program = getProgram(provider);
      const escrowToken = getAssociatedTokenAddressSync(pool.mint, pool.publicKey, true);
      const hostToken = getAssociatedTokenAddressSync(pool.mint, wallet.publicKey);

      await program.methods.closePool().accounts({
        host: wallet.publicKey, pool: pool.publicKey,
        escrowToken, hostToken,
        tokenProgram: TOKEN_PROGRAM_ID,
      }).rpc();

      setConfirmClose(false);
      setHostSuccess("Pool closed. Any remaining escrow funds returned to you.");
      await loadPool();
    } catch (e: unknown) {
      setHostError(e instanceof Error ? e.message : "Transaction failed");
    } finally {
      setClosingPool(false);
    }
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-10">
        <div className="max-w-2xl mx-auto space-y-4">
          <div className="h-64 rounded-3xl animate-pulse" style={{ background: "rgba(255,255,255,0.04)" }}/>
          <div className="h-32 rounded-3xl animate-pulse" style={{ background: "rgba(255,255,255,0.04)" }}/>
        </div>
      </div>
    );
  }

  if (!pool) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-10 text-center">
        <p className="text-4xl mb-3">🌊</p>
        <p className="font-semibold text-white">Pool not found</p>
        <p className="text-sm mt-1" style={{ color: "var(--text-2)" }}>This address doesn&apos;t exist on-chain.</p>
      </div>
    );
  }

  const category  = CATEGORIES.find((c) => c.id === pool.category) ?? CATEGORIES[5];
  const fillPct   = Math.round((pool.filledSlots / pool.maxSlots) * 100);
  const isHost    = publicKey?.toBase58() === pool.host.toBase58();
  const active    = isPoolActive(pool);
  const pending   = isPoolPending(pool);
  const open      = active || pending;
  const closed    = !active && !pending;
  const hostAmount = escrowBalance ? (escrowBalance * 0.94).toFixed(2) : "—";

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <div className="max-w-2xl mx-auto space-y-5">

        {/* Main pool card */}
        <div className="card p-6 space-y-6">

          {/* Header */}
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-4">
              <div className="h-14 w-14 rounded-2xl flex items-center justify-center text-3xl shrink-0"
                style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}>
                {category.icon}
              </div>
              <div>
                <h1 className="text-xl font-bold text-white leading-tight">{pool.title}</h1>
                <p className="text-sm mt-0.5" style={{ color: "var(--text-3)" }}>{category.label}</p>
              </div>
            </div>
            <span className={`pill shrink-0 ${active ? "pill-active" : pending ? "pill-pending" : "pill-closed"}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${active ? "bg-emerald-400 pulse-ring" : pending ? "bg-amber-400" : "bg-slate-500"}`}/>
              {active ? "Active" : pending ? "Pending" : "Closed"}
            </span>
          </div>

          {/* Price */}
          <div className="flex items-end justify-between">
            <div>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-black text-white">{formatUsdc(pool.pricePerSlot)}</span>
                <span className="text-base" style={{ color: "var(--text-3)" }}>USDC</span>
              </div>
              <p className="text-sm mt-0.5" style={{ color: "var(--text-3)" }}>
                per member · every {pool.cycleDays} days
              </p>
            </div>
          </div>

          {/* Fill bar */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm" style={{ color: "var(--text-3)" }}>
              <span>{pool.filledSlots} / {pool.maxSlots} members</span>
              <span>
                {pool.maxSlots - pool.filledSlots > 0
                  ? `${pool.maxSlots - pool.filledSlots} spot${pool.maxSlots - pool.filledSlots !== 1 ? "s" : ""} left`
                  : "Full"}
              </span>
            </div>
            <div className="fill-track">
              <div className="fill-bar" style={{ width: `${fillPct}%` }}/>
            </div>
            {pending && (
              <p className="text-xs" style={{ color: "var(--text-3)" }}>
                Pool activates when {pool.minSlots} members join ({Math.max(0, pool.minSlots - pool.filledSlots)} more needed)
              </p>
            )}
          </div>

          {/* Host info */}
          <div className="flex items-center gap-2 rounded-xl px-3 py-2.5 text-sm"
            style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
            <span style={{ color: "var(--text-3)" }}>Host</span>
            <span className="font-mono text-xs" style={{ color: "var(--text-2)" }}>
              {pool.host.toBase58().slice(0, 8)}…{pool.host.toBase58().slice(-6)}
            </span>
            {isHost && (
              <span className="pill ml-1" style={{
                background: "rgba(124,58,237,0.15)", border: "1px solid rgba(124,58,237,0.3)",
                color: "#a78bfa", fontSize: "10px", padding: "2px 8px"
              }}>you</span>
            )}
          </div>

          {/* Last proof */}
          {pool.lastProofUri && (
            <div className="rounded-xl px-4 py-3 space-y-1"
              style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)" }}>
              <p className="text-xs font-medium uppercase tracking-wider" style={{ color: "var(--text-3)" }}>
                Last proof · {pool.totalCycles} cycle{pool.totalCycles !== 1 ? "s" : ""} completed
              </p>
              <a href={pool.lastProofUri} target="_blank" rel="noopener noreferrer"
                className="text-sm break-all" style={{ color: "#818cf8" }}>
                {pool.lastProofUri}
              </a>
            </div>
          )}

          {/* Join button (members) */}
          {open && !isHost && (
            <div className="space-y-3 pt-1">
              {joinError && (
                <div className="rounded-xl p-3 text-sm"
                  style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", color: "#f87171" }}>
                  {joinError}
                </div>
              )}
              {joinTx && (
                <div className="rounded-xl p-3 text-sm"
                  style={{ background: "rgba(16,185,129,0.08)", border: "1px solid rgba(16,185,129,0.2)", color: "#34d399" }}>
                  Joined! Transaction: {joinTx.slice(0, 20)}…
                </div>
              )}
              <button
                onClick={joinPool}
                disabled={joining || !wallet || pool.filledSlots >= pool.maxSlots}
                className="btn-primary w-full py-3.5 font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {joining ? "Joining…"
                  : !wallet ? "Connect wallet to join"
                  : pool.filledSlots >= pool.maxSlots ? "Pool is full"
                  : `Join for ${formatUsdc(pool.pricePerSlot)} USDC`}
              </button>
              <p className="text-center text-xs" style={{ color: "var(--text-3)" }}>
                Funds held in escrow · Released only when host delivers
              </p>
            </div>
          )}

          {closed && !isHost && (
            <p className="text-center text-sm py-2" style={{ color: "var(--text-3)" }}>
              This pool is closed and no longer accepting members.
            </p>
          )}
        </div>

        {/* Host dashboard */}
        {isHost && (
          <div className="rounded-3xl p-6 space-y-6"
            style={{
              background: "linear-gradient(135deg, rgba(124,58,237,0.06) 0%, rgba(99,102,241,0.04) 100%)",
              border: "1px solid rgba(124,58,237,0.18)",
            }}>

            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-xl flex items-center justify-center"
                style={{ background: "rgba(124,58,237,0.15)", border: "1px solid rgba(124,58,237,0.25)" }}>
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <rect x="1" y="1" width="5" height="5" rx="1.5" stroke="#a78bfa" strokeWidth="1.3"/>
                  <rect x="8" y="1" width="5" height="5" rx="1.5" stroke="#a78bfa" strokeWidth="1.3"/>
                  <rect x="1" y="8" width="5" height="5" rx="1.5" stroke="#a78bfa" strokeWidth="1.3"/>
                  <rect x="8" y="8" width="5" height="5" rx="1.5" stroke="#a78bfa" strokeWidth="1.3"/>
                </svg>
              </div>
              <h2 className="font-bold text-white">Host Dashboard</h2>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: "in escrow", value: escrowBalance !== null ? `${escrowBalance.toFixed(2)}` : "—", unit: "USDC", color: "#818cf8" },
                { label: "you receive (94%)", value: hostAmount, unit: "USDC", color: "#34d399" },
                { label: "cycles done", value: String(pool.totalCycles), unit: "", color: "var(--text-1)" },
              ].map((s) => (
                <div key={s.label} className="rounded-2xl p-4 text-center"
                  style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
                  <p className="text-xl font-bold" style={{ color: s.color }}>{s.value}</p>
                  {s.unit && <p className="text-xs mt-0.5" style={{ color: "var(--text-3)" }}>{s.unit}</p>}
                  <p className="text-xs mt-1" style={{ color: "var(--text-3)" }}>{s.label}</p>
                </div>
              ))}
            </div>

            {hostError && (
              <div className="rounded-xl p-3.5 text-sm"
                style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", color: "#f87171" }}>
                {hostError}
              </div>
            )}
            {hostSuccess && (
              <div className="rounded-xl p-3.5 text-sm"
                style={{ background: "rgba(16,185,129,0.08)", border: "1px solid rgba(16,185,129,0.2)", color: "#34d399" }}>
                {hostSuccess}
              </div>
            )}

            {/* Submit proof */}
            {!closed && (
              <div className="space-y-3">
                <div>
                  <h3 className="font-semibold text-white text-sm">Submit Proof of Delivery</h3>
                  <p className="text-xs mt-1" style={{ color: "var(--text-2)" }}>
                    Paste a link to evidence (screenshot, invoice, login confirmation) that you delivered the service this cycle.
                  </p>
                </div>
                <div className="flex gap-2">
                  <input
                    type="url"
                    placeholder="https://drive.google.com/…"
                    value={proofUri}
                    onChange={(e) => setProofUri(e.target.value)}
                    className="input-field flex-1"
                  />
                  <button
                    onClick={submitProof}
                    disabled={submittingProof || !proofUri.trim()}
                    className="btn-primary px-5 py-2 text-sm disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
                  >
                    {submittingProof ? "Submitting…" : "Submit"}
                  </button>
                </div>
              </div>
            )}

            {/* Release funds */}
            {active && (
              <div className="space-y-2">
                <h3 className="font-semibold text-white text-sm">Release Escrow Funds</h3>
                <p className="text-xs" style={{ color: "var(--text-2)" }}>
                  Transfers all escrowed USDC to your wallet minus the 6% platform fee. Do this after submitting proof each cycle.
                </p>
                <button
                  onClick={releaseFunds}
                  disabled={releasingFunds || !wallet || (escrowBalance ?? 0) === 0}
                  className="w-full rounded-xl py-3 text-sm font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{
                    background: "rgba(16,185,129,0.12)",
                    border: "1px solid rgba(16,185,129,0.25)",
                    color: "#34d399",
                  }}
                >
                  {releasingFunds ? "Releasing…" : `Release ${hostAmount} USDC to wallet`}
                </button>
              </div>
            )}

            {/* Close pool */}
            {!closed && (
              <div className="space-y-3 pt-2"
                style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
                <div>
                  <h3 className="font-semibold text-sm" style={{ color: "#f87171" }}>Danger Zone</h3>
                  <p className="text-xs mt-1" style={{ color: "var(--text-2)" }}>
                    Closing the pool marks it as closed and returns any remaining escrow funds to your wallet.
                  </p>
                </div>
                {!confirmClose ? (
                  <button
                    onClick={() => setConfirmClose(true)}
                    className="w-full rounded-xl py-2.5 text-sm font-medium transition-all"
                    style={{
                      background: "rgba(239,68,68,0.06)",
                      border: "1px solid rgba(239,68,68,0.2)",
                      color: "#f87171",
                    }}
                  >
                    Close Pool
                  </button>
                ) : (
                  <div className="flex gap-2">
                    <button
                      onClick={closePool}
                      disabled={closingPool || !wallet}
                      className="flex-1 rounded-xl py-2.5 text-sm font-semibold text-white disabled:opacity-50 transition-all"
                      style={{ background: "rgba(239,68,68,0.15)", border: "1px solid rgba(239,68,68,0.3)" }}
                    >
                      {closingPool ? "Closing…" : "Confirm Close"}
                    </button>
                    <button
                      onClick={() => setConfirmClose(false)}
                      className="btn-ghost px-5 py-2.5 text-sm rounded-xl"
                    >
                      Cancel
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
