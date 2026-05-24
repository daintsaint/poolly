"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useAnchorWallet, useConnection, useWallet } from "@solana/wallet-adapter-react";
import { AnchorProvider, BN } from "@coral-xyz/anchor";
import { PublicKey } from "@solana/web3.js";
import { getProgram, formatUsdc, isPoolActive, isPoolPending, type PoolAccount } from "@/lib/poolly-client";
import { CATEGORIES } from "@/lib/constants";

export default function PoolDetailPage() {
  const { address } = useParams<{ address: string }>();
  const { connection } = useConnection();
  const wallet = useAnchorWallet();
  const { publicKey } = useWallet();

  const [pool, setPool] = useState<PoolAccount | null>(null);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);
  const [error, setError] = useState("");
  const [txSig, setTxSig] = useState("");

  useEffect(() => {
    async function load() {
      try {
        const provider = new AnchorProvider(connection, {} as never, {});
        const program = getProgram(provider);
        const poolKey = new PublicKey(address);
        const data = await program.account.pool.fetch(poolKey);
        setPool({ publicKey: poolKey, ...data });
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [address, connection]);

  async function joinPool() {
    if (!wallet || !pool) return;
    setJoining(true);
    setError("");
    try {
      const provider = new AnchorProvider(connection, wallet, { commitment: "confirmed" });
      const program = getProgram(provider);
      const sig = await program.methods
        .joinPool()
        .accounts({ pool: pool.publicKey, member: wallet.publicKey })
        .rpc();
      setTxSig(sig);
      // Reload pool
      const data = await program.account.pool.fetch(pool.publicKey);
      setPool({ publicKey: pool.publicKey, ...data });
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Transaction failed");
    } finally {
      setJoining(false);
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

  return (
    <div className="mx-auto max-w-2xl space-y-6">
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
        <div className="flex items-center gap-6">
          <div>
            <p className="text-3xl font-bold text-white">
              {formatUsdc(pool.pricePerSlot)}{" "}
              <span className="text-lg text-slate-400">USDC</span>
            </p>
            <p className="text-sm text-slate-500">per member every {pool.cycleDays} days</p>
          </div>
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
          <p className="text-xs text-slate-600">
            Activates when {pool.minSlots} members join
          </p>
        </div>

        {/* Host */}
        <div className="rounded-lg bg-slate-800/50 p-3 text-sm">
          <span className="text-slate-500">Host: </span>
          <span className="font-mono text-slate-300">{pool.host.toBase58().slice(0, 8)}…{pool.host.toBase58().slice(-6)}</span>
          {isHost && (
            <span className="ml-2 rounded-full bg-indigo-800/60 px-2 py-0.5 text-xs text-indigo-300">
              you
            </span>
          )}
        </div>

        {/* Join / error */}
        {open && !isHost && (
          <div className="space-y-3">
            {error && (
              <p className="rounded-lg bg-red-900/20 border border-red-800/40 p-3 text-sm text-red-400">
                {error}
              </p>
            )}
            {txSig && (
              <p className="rounded-lg bg-green-900/20 border border-green-800/40 p-3 text-sm text-green-400">
                Joined! Tx: {txSig.slice(0, 16)}…
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
                : `Join for ${formatUsdc(pool.pricePerSlot)} USDC`}
            </button>
            <p className="text-center text-xs text-slate-600">
              Funds held in escrow · Released when host delivers
            </p>
          </div>
        )}

        {isHost && (
          <div className="rounded-lg border border-slate-700 p-4 text-sm text-slate-400 space-y-2">
            <p className="font-medium text-slate-300">Host dashboard coming soon</p>
            <p>Release funds and submit proof from here once active.</p>
          </div>
        )}
      </div>
    </div>
  );
}
