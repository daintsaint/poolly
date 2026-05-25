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

  const totalCollected = form.pricePerSlot && form.maxSlots
    ? (parseFloat(form.pricePerSlot || "0") * parseInt(form.maxSlots || "0"))
    : null;
  const hostReceives = totalCollected ? (totalCollected * 0.94).toFixed(2) : null;

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <div className="max-w-xl mx-auto space-y-8">

        {/* Page header */}
        <div>
          <h1 className="text-3xl font-black text-white">Share a Subscription</h1>
          <p className="text-sm mt-1.5" style={{ color: "var(--text-2)" }}>
            Set your price and capacity. Funds are held in on-chain escrow until you deliver.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">

          {/* Title */}
          <Field label="Subscription Title">
            <input
              required
              maxLength={64}
              placeholder="e.g. Netflix Premium SG Group"
              value={form.title}
              onChange={(e) => update("title", e.target.value)}
              className="input-field"
            />
          </Field>

          {/* Category */}
          <Field label="Category">
            <select
              value={form.category}
              onChange={(e) => update("category", parseInt(e.target.value))}
              className="input-field"
            >
              {CATEGORIES.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.icon} {c.label}
                </option>
              ))}
            </select>
          </Field>

          {/* Price + Cycle */}
          <div className="grid grid-cols-2 gap-4">
            <Field label="Price per member (USDC)">
              <div className="relative">
                <input
                  required
                  type="number"
                  min="0.01"
                  step="0.01"
                  placeholder="4.99"
                  value={form.pricePerSlot}
                  onChange={(e) => update("pricePerSlot", e.target.value)}
                  className="input-field pr-16"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold"
                  style={{ color: "var(--text-3)" }}>USDC</span>
              </div>
            </Field>
            <Field label="Billing cycle (days)">
              <input
                required
                type="number"
                min="7"
                max="365"
                value={form.cycleDays}
                onChange={(e) => update("cycleDays", e.target.value)}
                className="input-field"
              />
            </Field>
          </div>

          {/* Slots */}
          <div className="grid grid-cols-2 gap-4">
            <Field label="Max members">
              <input
                required
                type="number"
                min="2"
                max="50"
                value={form.maxSlots}
                onChange={(e) => update("maxSlots", e.target.value)}
                className="input-field"
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
                className="input-field"
              />
            </Field>
          </div>

          {/* Earnings preview */}
          {totalCollected && (
            <div className="rounded-2xl p-4 space-y-3"
              style={{ background: "rgba(124,58,237,0.06)", border: "1px solid rgba(124,58,237,0.15)" }}>
              <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: "#7c3aed" }}>
                Earnings preview
              </p>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xl font-bold text-white">{totalCollected.toFixed(2)} USDC</p>
                  <p className="text-xs mt-0.5" style={{ color: "var(--text-3)" }}>gross when full</p>
                </div>
                <div>
                  <p className="text-xl font-bold" style={{ color: "#34d399" }}>{hostReceives} USDC</p>
                  <p className="text-xs mt-0.5" style={{ color: "var(--text-3)" }}>you receive (94%)</p>
                </div>
              </div>
              <p className="text-xs" style={{ color: "var(--text-3)" }}>
                6% platform fee charged only when funds are released from escrow.
              </p>
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="rounded-xl p-3.5 text-sm"
              style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", color: "#f87171" }}>
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading || !wallet}
            className="btn-primary w-full py-3.5 font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Publishing…" : !wallet ? "Connect wallet to continue" : "Publish Plan"}
          </button>

          {!wallet && (
            <p className="text-center text-xs" style={{ color: "var(--text-3)" }}>
              Use the wallet button in the top right to connect.
            </p>
          )}
        </form>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="text-sm font-medium" style={{ color: "var(--text-2)" }}>{label}</label>
      {children}
    </div>
  );
}
