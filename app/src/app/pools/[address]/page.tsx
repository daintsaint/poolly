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

  // member state
  const [joining, setJoining] = useState(false);
  const [joinError, setJoinError] = useState("");
  const [joinTx, setJoinTx] = useState("");

  // host dashboard state
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

      // Fetch escrow balance
      const escrowAta = getAssociatedTokenAddressSync(
        poolAcc.mint,
        poolKey,
        true // pool is a PDA (off-curve)
      );
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

  useEffect(() => {
    loadPool();
  }, [loadPool]);

  async function joinPool() {
    if (!wallet || !pool) return;
    setJoining(true);
    setJoinError("");
    try {
      const provider = new AnchorProvider(connection, wallet, { commitment: "confirmed" });
      const program = getProgram(provider);

      const memberToken = getAssociatedTokenAddressSync(pool.mint, wallet.publicKey);
      const escrowToken = getAssociatedTokenAddressSync(pool.mint, pool.publicKey, true);

      const sig = await program.methods
        .joinPool()
        .accounts({
          pool: pool.publicKey,
          member: wallet.publicKey,
          memberToken,
          escrowToken,
          tokenProgram: TOKEN_PROGRAM_ID,
          associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
          systemProgram: SystemProgram.programId,
        })
        .rpc();

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
    setHostError("");
    setHostSuccess("");
    try {
      const provider = new AnchorProvider(connection, wallet, { commitment: "confirmed" });
      const program = getProgram(provider);

      await program.methods
        .submitProof(proofUri.trim())
        .accounts({ host: wallet.publicKey, pool: pool.publicKey })
        .rpc();

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
    setHostError("");
    setHostSuccess("");
    try {
      const provider = new AnchorProvider(connection, wallet, { commitment: "confirmed" });
      const program = getProgram(provider);

      const escrowToken = getAssociatedTokenAddressSync(pool.mint, pool.publicKey, true);
      const hostToken = getAssociatedTokenAddressSync(pool.mint, wallet.publicKey);
      const platformToken = getAssociatedTokenAddressSync(pool.mint, PLATFORM_WALLET);

      await program.methods
        .releaseFunds()
        .accounts({
          host: wallet.publicKey,
          pool: pool.publicKey,
          escrowToken,
          hostToken,
          platformToken,
          tokenProgram: TOKEN_PROGRAM_ID,
        })
        .rpc();

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
    setHostError("");
    setHostSuccess("");
    try {
      const provider = new AnchorProvider(connection, wallet, { commitment: "confirmed" });
      const program = getProgram(provider);

      const escrowToken = getAssociatedTokenAddressSync(pool.mint, pool.publicKey, true);
      const hostToken = getAssociatedTokenAddressSync(pool.mint, wallet.publicKey);

      await program.methods
        .closePool()
        .accounts({
          host: wallet.publicKey,
          pool: pool.publicKey,
          escrowToken,
          hostToken,
          tokenProgram: TOKEN_PROGRAM_ID,
        })
        .rpc();

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
    return <div className="animate-pulse h-64 rounded-xl bg-slate-800" />;
  }

  if (!pool) {
    return <p className="text-slate-500">Pool not found.</p>;
  }

  const category = CATEGORIES.find((c) => c.id === pool.category) ?? CATEGORIES[5];
  const fillPct = Math.round((pool.filledSlots / pool.maxSlots) * 100);
  const isHost = publicKey?.toBase58() === pool.host.toBase58();
  const active = isPoolActive(pool);
  const pending = isPoolPending(pool);
  const open = active || pending;
  const closed = !active && !pending;

  const hostAmount = escrowBalance ? (escrowBalance * 0.94).toFixed(2) : "—";

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      {/* Pool card */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6 space-y-5">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <span className="text-3xl">{category.icon}</span>
            <div>
              <h1 className="text-xl font-bold text-white">{pool.title}</h1>
              <p className="text-sm text-slate-500">{category.label}</p>
            </div>
          </div>
          <span
            className={`rounded-full px-3 py-1 text-sm font-medium ${
              active
                ? "bg-green-900/50 text-green-400"
                : pending
                ? "bg-yellow-900/50 text-yellow-400"
                : "bg-slate-800 text-slate-500"
            }`}
          >
            {active ? "Active" : pending ? "Pending" : "Closed"}
          </span>
        </div>

        {/* Price */}
        <div>
          <p className="text-3xl font-bold text-white">
            {formatUsdc(pool.pricePerSlot)}{" "}
            <span className="text-lg text-slate-400">USDC</span>
          </p>
          <p className="text-sm text-slate-500">
            per member every {pool.cycleDays} days
          </p>
        </div>

        {/* Fill bar */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-slate-400">{pool.filledSlots} members joined</span>
            <span className="text-slate-500">{pool.maxSlots - pool.filledSlots} slots left</span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-slate-800">
            <div
              className="h-full rounded-full bg-indigo-600 transition-all"
              style={{ width: `${fillPct}%` }}
            />
          </div>
          {pending && (
            <p className="text-xs text-slate-600">
              Activates when {pool.minSlots} members join ({pool.minSlots - pool.filledSlots} more needed)
            </p>
          )}
        </div>

        {/* Host */}
        <div className="rounded-lg bg-slate-800/50 p-3 text-sm">
          <span className="text-slate-500">Host: </span>
          <span className="font-mono text-slate-300">
            {pool.host.toBase58().slice(0, 8)}…{pool.host.toBase58().slice(-6)}
          </span>
          {isHost && (
            <span className="ml-2 rounded-full bg-indigo-800/60 px-2 py-0.5 text-xs text-indigo-300">
              you
            </span>
          )}
        </div>

        {pool.lastProofUri && (
          <div className="rounded-lg bg-slate-800/50 p-3 text-sm space-y-0.5">
            <p className="text-slate-500 text-xs">Last proof ({pool.totalCycles} cycles)</p>
            <a
              href={pool.lastProofUri}
              target="_blank"
              rel="noopener noreferrer"
              className="text-indigo-400 hover:text-indigo-300 break-all"
            >
              {pool.lastProofUri}
            </a>
          </div>
        )}

        {/* Member: join */}
        {open && !isHost && (
          <div className="space-y-3">
            {joinError && (
              <p className="rounded-lg bg-red-900/20 border border-red-800/40 p-3 text-sm text-red-400">
                {joinError}
              </p>
            )}
            {joinTx && (
              <p className="rounded-lg bg-green-900/20 border border-green-800/40 p-3 text-sm text-green-400">
                Joined! Tx: {joinTx.slice(0, 16)}…
              </p>
            )}
            <button
              onClick={joinPool}
              disabled={joining || !wallet || pool.filledSlots >= pool.maxSlots}
              className="w-full rounded-lg bg-indigo-600 py-3 font-semibold text-white hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {joining
                ? "Joining…"
                : !wallet
                ? "Connect wallet to join"
                : pool.filledSlots >= pool.maxSlots
                ? "Pool is full"
                : `Join for ${formatUsdc(pool.pricePerSlot)} USDC`}
            </button>
            <p className="text-center text-xs text-slate-600">
              Funds held in escrow · Released when host delivers
            </p>
          </div>
        )}

        {closed && !isHost && (
          <p className="text-center text-sm text-slate-500">This pool is closed.</p>
        )}
      </div>

      {/* Host dashboard */}
      {isHost && (
        <div className="rounded-2xl border border-indigo-800/40 bg-slate-900 p-6 space-y-6">
          <h2 className="text-lg font-bold text-white">Host Dashboard</h2>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-3">
            <div className="rounded-xl bg-slate-800 p-4 text-center">
              <p className="text-2xl font-bold text-indigo-400">
                {escrowBalance !== null ? escrowBalance.toFixed(2) : "—"}
              </p>
              <p className="text-xs text-slate-500 mt-1">USDC in escrow</p>
            </div>
            <div className="rounded-xl bg-slate-800 p-4 text-center">
              <p className="text-2xl font-bold text-green-400">{hostAmount}</p>
              <p className="text-xs text-slate-500 mt-1">you receive (94%)</p>
            </div>
            <div className="rounded-xl bg-slate-800 p-4 text-center">
              <p className="text-2xl font-bold text-slate-400">{pool.totalCycles}</p>
              <p className="text-xs text-slate-500 mt-1">cycles done</p>
            </div>
          </div>

          {hostError && (
            <p className="rounded-lg bg-red-900/20 border border-red-800/40 p-3 text-sm text-red-400">
              {hostError}
            </p>
          )}
          {hostSuccess && (
            <p className="rounded-lg bg-green-900/20 border border-green-800/40 p-3 text-sm text-green-400">
              {hostSuccess}
            </p>
          )}

          {/* Submit proof */}
          {!closed && (
            <div className="space-y-3">
              <div>
                <h3 className="text-sm font-semibold text-slate-300">Submit Proof of Delivery</h3>
                <p className="text-xs text-slate-500 mt-1">
                  Paste a link to evidence (screenshot, invoice, login confirmation) that you
                  delivered the service this cycle.
                </p>
              </div>
              <div className="flex gap-2">
                <input
                  type="url"
                  placeholder="https://drive.google.com/…"
                  value={proofUri}
                  onChange={(e) => setProofUri(e.target.value)}
                  className="flex-1 rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
                />
                <button
                  onClick={submitProof}
                  disabled={submittingProof || !proofUri.trim()}
                  className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {submittingProof ? "Submitting…" : "Submit"}
                </button>
              </div>
            </div>
          )}

          {/* Release funds */}
          {active && (
            <div className="space-y-2">
              <h3 className="text-sm font-semibold text-slate-300">Release Escrow Funds</h3>
              <p className="text-xs text-slate-500">
                Transfers all escrowed USDC to your wallet minus the 6% platform fee.
                Do this after submitting proof each cycle.
              </p>
              <button
                onClick={releaseFunds}
                disabled={releasingFunds || !wallet || (escrowBalance ?? 0) === 0}
                className="w-full rounded-lg bg-green-700 py-2.5 text-sm font-semibold text-white hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {releasingFunds
                  ? "Releasing…"
                  : `Release ${hostAmount} USDC to wallet`}
              </button>
            </div>
          )}

          {/* Close pool */}
          {!closed && (
            <div className="space-y-2 border-t border-slate-800 pt-4">
              <h3 className="text-sm font-semibold text-red-400">Danger Zone</h3>
              <p className="text-xs text-slate-500">
                Closing the pool marks it as closed and returns any remaining escrow
                funds to your wallet. Members will no longer be able to join.
              </p>
              {!confirmClose ? (
                <button
                  onClick={() => setConfirmClose(true)}
                  className="w-full rounded-lg border border-red-800/60 py-2 text-sm font-medium text-red-400 hover:bg-red-900/20 transition-colors"
                >
                  Close Pool
                </button>
              ) : (
                <div className="flex gap-2">
                  <button
                    onClick={closePool}
                    disabled={closingPool || !wallet}
                    className="flex-1 rounded-lg bg-red-700 py-2 text-sm font-semibold text-white hover:bg-red-600 disabled:opacity-50 transition-colors"
                  >
                    {closingPool ? "Closing…" : "Confirm Close"}
                  </button>
                  <button
                    onClick={() => setConfirmClose(false)}
                    className="rounded-lg border border-slate-700 px-4 py-2 text-sm text-slate-400 hover:text-white transition-colors"
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
  );
}
