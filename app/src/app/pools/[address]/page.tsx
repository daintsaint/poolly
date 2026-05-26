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
import { ProofVerifier } from "@/components/proof-verifier";
import { BNav, BTicker, BFooter, ServiceMark, Avatar, PoolSlots } from "@/components/vault-ui";
import Link from "next/link";

/* ─── Derive service id from category ─── */
const CAT_TO_SVC: Record<number, string> = {
  0: "netflix",
  1: "ms365",
  2: "peloton",
  3: "disney",
  4: "adobe",
  5: "chatgpt",
};

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
  const [activeTab, setActiveTab] = useState("Members");

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

  async function submitProof(uri?: string) {
    const resolvedUri = uri ?? proofUri;
    if (!wallet || !pool || !resolvedUri.trim()) return;
    setSubmittingProof(true);
    setHostError(""); setHostSuccess("");
    try {
      const provider = new AnchorProvider(connection, wallet, { commitment: "confirmed" });
      const program = getProgram(provider);
      await program.methods.submitProof(resolvedUri.trim())
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
      setHostSuccess("Plan closed. Any remaining escrow funds returned to you.");
      await loadPool();
    } catch (e: unknown) {
      setHostError(e instanceof Error ? e.message : "Transaction failed");
    } finally {
      setClosingPool(false);
    }
  }

  /* ── Loading state ── */
  if (loading) {
    return (
      <div style={{ background: "var(--b-ink)", minHeight: "100vh" }}>
        <BNav /><BTicker />
        <div style={{ maxWidth: 1200, margin: "0 auto", padding: "40px", display: "grid", gridTemplateColumns: "1.5fr 1fr", gap: 32 }}>
          {[260, 200].map((h, i) => (
            <div key={i} style={{ height: h, background: "var(--b-ink-3)", border: "1px solid var(--b-rule)" }} />
          ))}
        </div>
      </div>
    );
  }

  if (!pool) {
    return (
      <div style={{ background: "var(--b-ink)", minHeight: "100vh" }}>
        <BNav /><BTicker />
        <div style={{ maxWidth: 1200, margin: "80px auto", padding: "0 40px", textAlign: "center" }}>
          <p className="b-serif" style={{ fontSize: 48, color: "var(--b-paper-60)", marginBottom: 16 }}>
            Plan not found.
          </p>
          <p className="b-eyebrow">THIS ADDRESS DOESN&apos;T EXIST ON-CHAIN</p>
        </div>
      </div>
    );
  }

  const category   = CATEGORIES.find((c) => c.id === pool.category) ?? CATEGORIES[5];
  const svcId      = CAT_TO_SVC[pool.category] ?? "chatgpt";
  const fillPct    = Math.round((pool.filledSlots / pool.maxSlots) * 100);
  const isHost     = publicKey?.toBase58() === pool.host.toBase58();
  const active     = isPoolActive(pool);
  const pending    = isPoolPending(pool);
  const open       = active || pending;
  const closed     = !active && !pending;
  const hostAmount = escrowBalance ? (escrowBalance * 0.94).toFixed(2) : "—";
  const addrShort  = `${address.slice(0, 4)}…${address.slice(-4)}`;
  const hostShort  = `${pool.host.toBase58().slice(0, 4)}…${pool.host.toBase58().slice(-4)}`;

  const tabs = ["Members", "Activity", "Reviews", "Terms"];

  /* ── Mock member rows ── */
  const mockMembers = [
    { handle: "maya.sol", role: "HOST", joined: "May 1", paid: formatUsdc(pool.pricePerSlot), status: "ACTIVE" },
    { handle: "jin.sol",  role: "MEMBER", joined: "May 2", paid: formatUsdc(pool.pricePerSlot), status: "ACTIVE" },
    { handle: "eli.sol",  role: "MEMBER", joined: "May 4", paid: formatUsdc(pool.pricePerSlot), status: "ACTIVE" },
    { handle: "—",        role: "OPEN",   joined: "—",     paid: "—",                          status: "OPEN" },
  ].slice(0, pool.maxSlots);

  return (
    <div style={{ background: "var(--b-ink)", minHeight: "100vh" }}>
      <BNav />
      <BTicker />

      {/* ── Breadcrumb ── */}
      <div
        style={{
          borderBottom: "1px solid var(--b-rule)",
          background: "var(--b-ink-2)",
          padding: "0 40px",
        }}
      >
        <div
          style={{
            maxWidth: 1200,
            margin: "0 auto",
            height: 40,
            display: "flex",
            alignItems: "center",
            gap: 12,
          }}
        >
          <Link
            href="/pools"
            style={{
              fontFamily: "var(--font-geist-mono), monospace",
              fontSize: 10.5,
              color: "var(--b-paper-40)",
              textDecoration: "none",
              letterSpacing: "0.12em",
              textTransform: "uppercase",
            }}
          >
            CATALOG
          </Link>
          <span style={{ color: "var(--b-paper-20)", fontSize: 10 }}>/</span>
          <span
            style={{
              fontFamily: "var(--font-geist-mono), monospace",
              fontSize: 10.5,
              color: "var(--b-paper-40)",
              letterSpacing: "0.12em",
              textTransform: "uppercase",
            }}
          >
            {category.label}
          </span>
          <span style={{ color: "var(--b-paper-20)", fontSize: 10 }}>/</span>
          <span
            style={{
              fontFamily: "var(--font-geist-mono), monospace",
              fontSize: 10.5,
              color: "var(--b-paper-60)",
              letterSpacing: "0.12em",
              textTransform: "uppercase",
            }}
          >
            {pool.title} · {addrShort}
          </span>
        </div>
      </div>

      {/* ── Main layout ── */}
      <div
        style={{
          maxWidth: 1200,
          margin: "0 auto",
          padding: "40px 40px 80px",
          display: "grid",
          gridTemplateColumns: "1.5fr 1fr",
          gap: 40,
          alignItems: "start",
        }}
      >
        {/* ── LEFT COLUMN ── */}
        <div style={{ display: "flex", flexDirection: "column", gap: 32 }}>

          {/* Header */}
          <div style={{ display: "flex", gap: 20, alignItems: "flex-start" }}>
            <ServiceMark id={svcId} size={68} radius={0} />
            <div>
              <p className="b-eyebrow" style={{ marginBottom: 8 }}>{category.label} · {addrShort}</p>
              <h1
                className="b-serif"
                style={{ fontSize: 88, lineHeight: 0.9, color: "var(--b-paper)", letterSpacing: "-0.03em" }}
              >
                {pool.title}
              </h1>
              {pool.lastProofUri && (
                <p style={{ fontSize: 13, color: "var(--b-paper-40)", marginTop: 10, lineHeight: 1.5 }}>
                  {pool.totalCycles} cycle{pool.totalCycles !== 1 ? "s" : ""} completed ·{" "}
                  <a href={pool.lastProofUri} target="_blank" rel="noopener noreferrer"
                    style={{ color: "var(--b-gold)", textDecoration: "none" }}>
                    view last proof ↗
                  </a>
                </p>
              )}
            </div>
          </div>

          {/* Gilded claim block */}
          {open && !isHost && (
            <div
              style={{
                background: "linear-gradient(135deg, rgba(201,162,79,0.10) 0%, rgba(140,107,34,0.06) 100%)",
                border: "1px solid rgba(201,162,79,0.35)",
                padding: "28px 28px 24px",
              }}
            >
              <p className="b-eyebrow" style={{ marginBottom: 12, fontSize: 9.5 }}>
                YOUR SHARE · {pool.filledSlots < pool.maxSlots ? "OPEN SEAT" : "WAITLIST"}
              </p>
              <p
                className="b-serif"
                style={{ fontSize: 84, lineHeight: 0.9, color: "var(--b-gold)", marginBottom: 12, letterSpacing: "-0.03em" }}
              >
                {formatUsdc(pool.pricePerSlot)}
              </p>
              <p style={{ fontFamily: "var(--font-geist-mono), monospace", fontSize: 11, color: "var(--b-paper-40)", marginBottom: 20 }}>
                PER MEMBER · EVERY {pool.cycleDays} DAYS · HELD IN ESCROW
              </p>

              {joinError && (
                <div style={{ padding: "10px 14px", border: "1px solid rgba(181,86,62,0.4)", background: "rgba(181,86,62,0.08)", marginBottom: 12, fontSize: 12, color: "var(--b-rust)" }}>
                  {joinError}
                </div>
              )}
              {joinTx && (
                <div style={{ padding: "10px 14px", border: "1px solid rgba(92,135,112,0.4)", background: "rgba(92,135,112,0.08)", marginBottom: 12, fontSize: 12, color: "var(--b-emerald)" }}>
                  Joined! Tx: {joinTx.slice(0, 20)}…
                </div>
              )}

              <button
                onClick={joinPool}
                disabled={joining || !wallet || pool.filledSlots >= pool.maxSlots}
                style={{
                  width: "100%",
                  background: "var(--b-paper)",
                  color: "var(--b-ink)",
                  border: "none",
                  padding: "14px 24px",
                  fontFamily: "var(--font-geist-mono), monospace",
                  fontSize: 12,
                  fontWeight: 700,
                  letterSpacing: "0.16em",
                  textTransform: "uppercase",
                  cursor: joining ? "wait" : "pointer",
                  opacity: (joining || !wallet || pool.filledSlots >= pool.maxSlots) ? 0.5 : 1,
                  transition: "opacity 0.15s",
                }}
              >
                {joining ? "LOCKING…"
                  : !wallet ? "CONNECT WALLET TO JOIN"
                  : pool.filledSlots >= pool.maxSlots ? "NO SEATS — JOIN WAITLIST"
                  : `LOCK MY SEAT · ${formatUsdc(pool.pricePerSlot)} USDC`}
              </button>
              <p style={{ fontFamily: "var(--font-geist-mono), monospace", fontSize: 9.5, color: "var(--b-paper-40)", textAlign: "center", marginTop: 10, letterSpacing: "0.12em", textTransform: "uppercase" }}>
                FUNDS HELD IN ESCROW · RELEASED ONLY ON DELIVERY
              </p>
            </div>
          )}

          {closed && !isHost && (
            <div style={{ border: "1px solid var(--b-rule)", padding: "20px 24px", textAlign: "center" }}>
              <p className="b-eyebrow">THIS PLAN IS CLOSED</p>
            </div>
          )}

          {/* Host controls */}
          {isHost && (
            <div
              style={{
                border: "1px solid rgba(201,162,79,0.3)",
                background: "rgba(201,162,79,0.04)",
                padding: "24px",
                display: "flex",
                flexDirection: "column",
                gap: 20,
              }}
            >
              <p className="b-eyebrow">HOST DASHBOARD</p>

              {/* Stats */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 1 }}>
                {[
                  { label: "IN ESCROW", value: escrowBalance !== null ? `${escrowBalance.toFixed(2)} USDC` : "—", gold: true },
                  { label: "YOU RECEIVE (94%)", value: `${hostAmount} USDC`, gold: false },
                  { label: "CYCLES DONE", value: String(pool.totalCycles), gold: false },
                ].map((s) => (
                  <div key={s.label} style={{ border: "1px solid var(--b-rule)", padding: "14px 16px", background: "var(--b-ink-3)" }}>
                    <p className="b-eyebrow" style={{ fontSize: 9, marginBottom: 6 }}>{s.label}</p>
                    <p className="b-serif" style={{ fontSize: 24, color: s.gold ? "var(--b-gold)" : "var(--b-paper)" }}>{s.value}</p>
                  </div>
                ))}
              </div>

              {hostError && (
                <div style={{ padding: "10px 14px", border: "1px solid rgba(181,86,62,0.4)", background: "rgba(181,86,62,0.08)", fontSize: 12, color: "var(--b-rust)" }}>
                  {hostError}
                </div>
              )}
              {hostSuccess && (
                <div style={{ padding: "10px 14px", border: "1px solid rgba(92,135,112,0.4)", background: "rgba(92,135,112,0.08)", fontSize: 12, color: "var(--b-emerald)" }}>
                  {hostSuccess}
                </div>
              )}

              {/* Proof verifier */}
              {!closed && (
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14 }}>
                    <p style={{ fontFamily: "var(--font-geist), sans-serif", fontSize: 14, fontWeight: 600, color: "var(--b-paper)" }}>
                      Submit Proof of Delivery
                    </p>
                    <span
                      style={{
                        fontFamily: "var(--font-geist-mono), monospace",
                        fontSize: 9.5,
                        color: "var(--b-gold)",
                        border: "1px solid rgba(201,162,79,0.35)",
                        padding: "2px 8px",
                        letterSpacing: "0.14em",
                        textTransform: "uppercase",
                      }}
                    >
                      AI VERIFIED
                    </span>
                  </div>
                  <ProofVerifier
                    poolTitle={pool.title}
                    category={pool.category}
                    onConfirmed={(uri) => submitProof(uri)}
                    submitting={submittingProof}
                  />
                </div>
              )}

              {/* Release funds */}
              {active && (
                <div>
                  <p style={{ fontFamily: "var(--font-geist), sans-serif", fontSize: 13, fontWeight: 600, color: "var(--b-paper)", marginBottom: 8 }}>
                    Release Escrow Funds
                  </p>
                  <p style={{ fontSize: 12, color: "var(--b-paper-40)", marginBottom: 12, lineHeight: 1.5 }}>
                    Transfers all escrowed USDC to your wallet minus the 6% platform fee.
                  </p>
                  <button
                    onClick={releaseFunds}
                    disabled={releasingFunds || !wallet || (escrowBalance ?? 0) === 0}
                    style={{
                      width: "100%",
                      background: "rgba(92,135,112,0.12)",
                      border: "1px solid rgba(92,135,112,0.35)",
                      color: "var(--b-emerald)",
                      padding: "12px 20px",
                      fontFamily: "var(--font-geist-mono), monospace",
                      fontSize: 11,
                      fontWeight: 700,
                      letterSpacing: "0.14em",
                      textTransform: "uppercase",
                      cursor: "pointer",
                      opacity: (releasingFunds || !wallet || (escrowBalance ?? 0) === 0) ? 0.5 : 1,
                    }}
                  >
                    {releasingFunds ? "RELEASING…" : `RELEASE ${hostAmount} USDC → WALLET`}
                  </button>
                </div>
              )}

              {/* Close pool */}
              {!closed && (
                <div style={{ borderTop: "1px solid var(--b-rule)", paddingTop: 16 }}>
                  <p style={{ fontFamily: "var(--font-geist-mono), monospace", fontSize: 10.5, color: "var(--b-rust)", letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 8 }}>
                    DANGER ZONE
                  </p>
                  <p style={{ fontSize: 12, color: "var(--b-paper-40)", marginBottom: 12, lineHeight: 1.5 }}>
                    Closing the pool marks it as closed and returns any remaining escrow funds to your wallet.
                  </p>
                  {!confirmClose ? (
                    <button
                      onClick={() => setConfirmClose(true)}
                      style={{
                        width: "100%",
                        background: "rgba(181,86,62,0.08)",
                        border: "1px solid rgba(181,86,62,0.3)",
                        color: "var(--b-rust)",
                        padding: "10px 20px",
                        fontFamily: "var(--font-geist-mono), monospace",
                        fontSize: 11,
                        letterSpacing: "0.14em",
                        textTransform: "uppercase",
                        cursor: "pointer",
                      }}
                    >
                      CLOSE POOL
                    </button>
                  ) : (
                    <div style={{ display: "flex", gap: 8 }}>
                      <button
                        onClick={closePool}
                        disabled={closingPool || !wallet}
                        style={{
                          flex: 1,
                          background: "rgba(181,86,62,0.15)",
                          border: "1px solid rgba(181,86,62,0.4)",
                          color: "var(--b-rust)",
                          padding: "10px 16px",
                          fontFamily: "var(--font-geist-mono), monospace",
                          fontSize: 11,
                          letterSpacing: "0.12em",
                          textTransform: "uppercase",
                          cursor: "pointer",
                          opacity: (closingPool || !wallet) ? 0.5 : 1,
                        }}
                      >
                        {closingPool ? "CLOSING…" : "CONFIRM CLOSE"}
                      </button>
                      <button
                        onClick={() => setConfirmClose(false)}
                        style={{
                          padding: "10px 20px",
                          background: "transparent",
                          border: "1px solid var(--b-rule)",
                          color: "var(--b-paper-60)",
                          fontFamily: "var(--font-geist-mono), monospace",
                          fontSize: 11,
                          letterSpacing: "0.12em",
                          textTransform: "uppercase",
                          cursor: "pointer",
                        }}
                      >
                        CANCEL
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* ── Tabs ── */}
          <div>
            <div
              style={{
                display: "flex",
                borderBottom: "1px solid var(--b-rule)",
                gap: 0,
                marginBottom: 0,
              }}
            >
              {tabs.map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  style={{
                    background: "transparent",
                    border: "none",
                    borderBottom: activeTab === tab ? "2px solid var(--b-gold)" : "2px solid transparent",
                    padding: "12px 20px",
                    fontFamily: "var(--font-geist-mono), monospace",
                    fontSize: 10.5,
                    fontWeight: 700,
                    letterSpacing: "0.16em",
                    textTransform: "uppercase",
                    color: activeTab === tab ? "var(--b-gold)" : "var(--b-paper-40)",
                    cursor: "pointer",
                    transition: "color 0.15s",
                    marginBottom: -1,
                  }}
                >
                  {tab}
                </button>
              ))}
            </div>

            {/* Members tab */}
            {activeTab === "Members" && (
              <div style={{ marginTop: 0 }}>
                {/* Header */}
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "2fr 0.8fr 0.8fr 0.8fr 0.6fr",
                    gap: 0,
                    borderBottom: "1px solid var(--b-rule)",
                    padding: "10px 16px",
                  }}
                >
                  {["MEMBER", "JOINED", "PAID", "STATUS", "TX"].map((h) => (
                    <p key={h} className="b-eyebrow" style={{ fontSize: 9, color: "var(--b-paper-40)" }}>{h}</p>
                  ))}
                </div>

                {mockMembers.map((m, i) => (
                  <div
                    key={i}
                    style={{
                      display: "grid",
                      gridTemplateColumns: "2fr 0.8fr 0.8fr 0.8fr 0.6fr",
                      gap: 0,
                      borderBottom: "1px solid var(--b-rule)",
                      padding: "14px 16px",
                      alignItems: "center",
                      background: m.status === "OPEN" ? "rgba(201,162,79,0.03)" : "transparent",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      {m.status === "OPEN" ? (
                        <div style={{ width: 28, height: 28, borderRadius: "50%", border: "1.5px dashed rgba(201,162,79,0.35)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                          <span style={{ color: "var(--b-gold)", fontSize: 14, opacity: 0.5 }}>+</span>
                        </div>
                      ) : (
                        <Avatar name={m.handle} size={28} />
                      )}
                      <div>
                        <p style={{ fontFamily: "var(--font-geist-mono), monospace", fontSize: 11, color: m.status === "OPEN" ? "var(--b-paper-40)" : "var(--b-paper)", letterSpacing: "0.04em" }}>
                          {m.status === "OPEN" ? <em className="b-italic" style={{ color: "var(--b-paper-40)", fontFamily: "var(--font-newsreader), serif", fontSize: 13 }}>1 open seat — could be yours</em> : m.handle}
                        </p>
                        {m.role !== "OPEN" && (
                          <p style={{ fontFamily: "var(--font-geist-mono), monospace", fontSize: 9, color: "var(--b-paper-40)", letterSpacing: "0.12em", textTransform: "uppercase" }}>{m.role}</p>
                        )}
                      </div>
                    </div>
                    <p style={{ fontFamily: "var(--font-geist-mono), monospace", fontSize: 11, color: "var(--b-paper-40)" }}>{m.joined}</p>
                    <p style={{ fontFamily: "var(--font-geist-mono), monospace", fontSize: 11, color: "var(--b-paper)" }}>{m.paid}</p>
                    <span
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        padding: "2px 7px",
                        border: `1px solid ${m.status === "ACTIVE" ? "rgba(92,135,112,0.35)" : "rgba(201,162,79,0.3)"}`,
                        fontFamily: "var(--font-geist-mono), monospace",
                        fontSize: 9,
                        color: m.status === "ACTIVE" ? "var(--b-emerald)" : "var(--b-gold)",
                        letterSpacing: "0.12em",
                        textTransform: "uppercase",
                        width: "fit-content",
                      }}
                    >
                      {m.status}
                    </span>
                    {m.status !== "OPEN" ? (
                      <a href="#" style={{ fontFamily: "var(--font-geist-mono), monospace", fontSize: 10, color: "var(--b-gold)", textDecoration: "none" }}>↗</a>
                    ) : (
                      open && !isHost ? (
                        <button
                          onClick={joinPool}
                          disabled={joining || !wallet}
                          style={{
                            background: "var(--b-gold)",
                            color: "var(--b-ink)",
                            border: "none",
                            padding: "5px 12px",
                            fontFamily: "var(--font-geist-mono), monospace",
                            fontSize: 9.5,
                            fontWeight: 700,
                            letterSpacing: "0.12em",
                            textTransform: "uppercase",
                            cursor: "pointer",
                            opacity: (joining || !wallet) ? 0.5 : 1,
                          }}
                        >
                          CLAIM →
                        </button>
                      ) : <span />
                    )}
                  </div>
                ))}
              </div>
            )}

            {activeTab !== "Members" && (
              <div style={{ padding: "32px 16px", textAlign: "center" }}>
                <p className="b-eyebrow">{activeTab.toUpperCase()} · COMING SOON</p>
              </div>
            )}
          </div>
        </div>

        {/* ── RIGHT STICKY RAIL ── */}
        <div style={{ position: "sticky", top: 80, display: "flex", flexDirection: "column", gap: 16 }}>

          {/* Pool fill card */}
          <div style={{ border: "1px solid var(--b-rule)", background: "var(--b-ink-3)", padding: "20px 20px 18px" }}>
            <p className="b-eyebrow" style={{ marginBottom: 12 }}>POOL FILL</p>
            <p className="b-serif" style={{ fontSize: 28, color: "var(--b-paper)", marginBottom: 12 }}>
              {pool.filledSlots} of {pool.maxSlots} seats
            </p>
            <PoolSlots filled={pool.filledSlots} total={pool.maxSlots} size={20} gap={6} />
            {pending && (
              <p style={{ fontFamily: "var(--font-geist-mono), monospace", fontSize: 10, color: "var(--b-paper-40)", marginTop: 10, letterSpacing: "0.1em" }}>
                ACTIVATES AT {pool.minSlots} MEMBERS · {Math.max(0, pool.minSlots - pool.filledSlots)} MORE NEEDED
              </p>
            )}
            {/* Fill bar */}
            <div style={{ height: 3, background: "var(--b-paper-08)", marginTop: 14 }}>
              <div style={{ height: "100%", width: `${fillPct}%`, background: "var(--b-gold)", transition: "width 0.5s ease" }} />
            </div>
            <p style={{ fontFamily: "var(--font-geist-mono), monospace", fontSize: 9.5, color: "var(--b-paper-40)", marginTop: 6, letterSpacing: "0.12em" }}>
              {fillPct}% FILLED
            </p>
          </div>

          {/* Trust receipt */}
          <div style={{ border: "1px solid var(--b-rule)", background: "var(--b-ink-3)", padding: "20px" }}>
            <p className="b-eyebrow" style={{ marginBottom: 14 }}>TRUST RECEIPT</p>
            {[
              { label: "CONTRACT",    value: `${address.slice(0, 8)}…` },
              { label: "ESCROW",      value: escrowBalance !== null ? `${escrowBalance.toFixed(2)} USDC` : "—" },
              { label: "HELD",        value: "NON-CUSTODIAL" },
              { label: "AUTO-RELEASE", value: `EVERY ${pool.cycleDays}D` },
              { label: "HOST CYCLES", value: String(pool.totalCycles) },
            ].map((row, i, arr) => (
              <div
                key={row.label}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  padding: "9px 0",
                  borderBottom: i < arr.length - 1 ? "1px dashed var(--b-rule)" : "none",
                }}
              >
                <p style={{ fontFamily: "var(--font-geist-mono), monospace", fontSize: 9.5, color: "var(--b-paper-40)", letterSpacing: "0.14em", textTransform: "uppercase" }}>{row.label}</p>
                <p style={{ fontFamily: "var(--font-geist-mono), monospace", fontSize: 11, color: "var(--b-paper)" }}>{row.value}</p>
              </div>
            ))}
            <a
              href={`https://solscan.io/account/${address}?cluster=devnet`}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: "block",
                marginTop: 14,
                padding: "9px 14px",
                border: "1px solid rgba(201,162,79,0.3)",
                textAlign: "center",
                fontFamily: "var(--font-geist-mono), monospace",
                fontSize: 10.5,
                color: "var(--b-gold)",
                textDecoration: "none",
                letterSpacing: "0.14em",
                textTransform: "uppercase",
              }}
            >
              VIEW ON SOLSCAN ↗
            </a>
          </div>

          {/* Host card */}
          <div style={{ border: "1px solid var(--b-rule)", background: "var(--b-ink-3)", padding: "18px 20px" }}>
            <p className="b-eyebrow" style={{ marginBottom: 12 }}>HOST</p>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14 }}>
              <Avatar name={hostShort} size={36} />
              <div>
                <p style={{ fontFamily: "var(--font-geist-mono), monospace", fontSize: 12, color: "var(--b-paper)", letterSpacing: "0.04em" }}>
                  {hostShort}
                </p>
                <p style={{ fontFamily: "var(--font-geist-mono), monospace", fontSize: 9.5, color: "var(--b-paper-40)", letterSpacing: "0.12em", textTransform: "uppercase" }}>
                  HOST · ★ 4.9 · {pool.totalCycles} PLANS
                </p>
              </div>
            </div>
            <p
              className="b-serif b-italic"
              style={{ fontSize: 14, color: "var(--b-paper-60)", lineHeight: 1.6 }}
            >
              &ldquo;I&apos;ve been running this plan for {pool.totalCycles > 0 ? pool.totalCycles : 1} cycle{pool.totalCycles !== 1 ? "s" : ""} — on-time delivery every time.&rdquo;
            </p>
          </div>

          {/* Status badge */}
          <div
            style={{
              border: `1px solid ${active ? "rgba(92,135,112,0.35)" : pending ? "rgba(201,162,79,0.35)" : "var(--b-rule)"}`,
              background: active ? "rgba(92,135,112,0.06)" : pending ? "rgba(201,162,79,0.06)" : "var(--b-paper-08)",
              padding: "12px 16px",
              display: "flex",
              alignItems: "center",
              gap: 10,
            }}
          >
            <span
              className={active ? "b-pulse" : ""}
              style={{
                width: 8,
                height: 8,
                borderRadius: "50%",
                background: active ? "var(--b-emerald)" : pending ? "var(--b-gold)" : "var(--b-paper-40)",
                display: "inline-block",
                flexShrink: 0,
              }}
            />
            <p style={{ fontFamily: "var(--font-geist-mono), monospace", fontSize: 10.5, color: active ? "var(--b-emerald)" : pending ? "var(--b-gold)" : "var(--b-paper-40)", letterSpacing: "0.14em", textTransform: "uppercase" }}>
              {active ? "ACTIVE · DELIVERING" : pending ? `PENDING · ${Math.max(0, pool.minSlots - pool.filledSlots)} MORE TO ACTIVATE` : "CLOSED"}
            </p>
          </div>
        </div>
      </div>

      <BFooter />
    </div>
  );
}
