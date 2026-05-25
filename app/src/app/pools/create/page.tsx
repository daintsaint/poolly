"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAnchorWallet, useConnection } from "@solana/wallet-adapter-react";
import { AnchorProvider, BN } from "@coral-xyz/anchor";
import { SystemProgram } from "@solana/web3.js";
import { TOKEN_PROGRAM_ID, ASSOCIATED_TOKEN_PROGRAM_ID } from "@solana/spl-token";
import { CATEGORIES, USDC_MINT_DEVNET } from "@/lib/constants";
import { derivePoolPda, getProgram } from "@/lib/poolly-client";

export default function CreatePoolPage() {
  const router = useRouter();
  const wallet = useAnchorWallet();
  const { connection } = useConnection();

  const [form, setForm] = useState({
    title: "",
    category: 0,
    pricePerSlot: "",
    maxSlots: "5",
    minSlots: "2",
    cycleDays: "30",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  function update(field: string, value: string | number) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!wallet) { setError("Connect your wallet first"); return; }
    setError("");
    setLoading(true);

    try {
      const provider = new AnchorProvider(connection, wallet, { commitment: "confirmed" });
      const program = getProgram(provider);

      const priceInMicroUsdc = Math.round(parseFloat(form.pricePerSlot) * 1_000_000);

      await program.methods
        .createPool({
          title: form.title,
          category: form.category,
          pricePerSlot: new BN(priceInMicroUsdc),
          maxSlots: parseInt(form.maxSlots),
          minSlots: parseInt(form.minSlots),
          cycleDays: parseInt(form.cycleDays),
        })
        .accounts({
          host: wallet.publicKey,
          mint: USDC_MINT_DEVNET,
          tokenProgram: TOKEN_PROGRAM_ID,
          associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
          systemProgram: SystemProgram.programId,
        })
        .rpc();

      const poolPda = derivePoolPda(wallet.publicKey, form.title);
      router.push(`/pools/${poolPda.toBase58()}`);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Transaction failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Create a Pool</h1>
        <p className="text-sm text-slate-400 mt-1">
          Set up a group buy. Funds are held in on-chain escrow until you deliver.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <Field label="Pool Title">
          <input
            required
            maxLength={64}
            placeholder="e.g. Netflix Premium SG Group"
            value={form.title}
            onChange={(e) => update("title", e.target.value)}
            className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
          />
        </Field>

        <Field label="Category">
          <select
            value={form.category}
            onChange={(e) => update("category", parseInt(e.target.value))}
            className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-white focus:border-indigo-500 focus:outline-none"
          >
            {CATEGORIES.map((c) => (
              <option key={c.id} value={c.id}>
                {c.icon} {c.label}
              </option>
            ))}
          </select>
        </Field>

        <div className="grid grid-cols-2 gap-4">
          <Field label="Price per member (USDC/cycle)">
            <input
              required
              type="number"
              min="0.01"
              step="0.01"
              placeholder="4.99"
              value={form.pricePerSlot}
              onChange={(e) => update("pricePerSlot", e.target.value)}
              className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
            />
          </Field>

          <Field label="Cycle (days)">
            <input
              required
              type="number"
              min="7"
              max="365"
              value={form.cycleDays}
              onChange={(e) => update("cycleDays", e.target.value)}
              className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-white focus:border-indigo-500 focus:outline-none"
            />
          </Field>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Field label="Max members">
            <input
              required
              type="number"
              min="2"
              max="50"
              value={form.maxSlots}
              onChange={(e) => update("maxSlots", e.target.value)}
              className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-white focus:border-indigo-500 focus:outline-none"
            />
          </Field>
          <Field label="Min to activate">
            <input
              required
              type="number"
              min="2"
              max={form.maxSlots}
              value={form.minSlots}
              onChange={(e) => update("minSlots", e.target.value)}
              className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-white focus:border-indigo-500 focus:outline-none"
            />
          </Field>
        </div>

        {/* Summary */}
        {form.pricePerSlot && form.maxSlots && (
          <div className="rounded-lg bg-indigo-900/20 border border-indigo-800/40 p-4 text-sm space-y-1">
            <p className="text-slate-300">
              You collect{" "}
              <span className="text-indigo-300 font-medium">
                {(parseFloat(form.pricePerSlot || "0") * parseInt(form.maxSlots || "0")).toFixed(2)} USDC
              </span>{" "}
              when full (before 6% platform fee)
            </p>
          </div>
        )}

        {error && (
          <p className="rounded-lg bg-red-900/20 border border-red-800/40 p-3 text-sm text-red-400">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={loading || !wallet}
          className="w-full rounded-lg bg-indigo-600 py-3 font-semibold text-white hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? "Creating…" : !wallet ? "Connect wallet to continue" : "Create Pool"}
        </button>
      </form>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="text-sm font-medium text-slate-300">{label}</label>
      {children}
    </div>
  );
}
