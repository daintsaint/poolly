"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import { useAnchorWallet, useConnection, useWallet } from "@solana/wallet-adapter-react";
import { AnchorProvider, BN } from "@coral-xyz/anchor";
import { PublicKey, SystemProgram } from "@solana/web3.js";
import {
  getAssociatedTokenAddressSync,
  createAssociatedTokenAccountInstruction,
  TOKEN_PROGRAM_ID,
  ASSOCIATED_TOKEN_PROGRAM_ID,
} from "@solana/spl-token";
import {
  getProgram,
  formatUsdc,
  isPoolActive,
  isPoolPending,
  deriveMemberPda,
  fetchPoolMembers,
  type PoolAccount,
  type MemberRecord,
} from "@/lib/poolly-client";
import { CATEGORIES, PLATFORM_WALLET } from "@/lib/constants";
import { ProofVerifier } from "@/components/proof-verifier";
import { BNav, BTicker, BFooter, ServiceMark, Avatar, PoolSlots } from "@/components/vault-ui";
import { titleToSvcId } from "@/lib/svc-utils";
import { useDisplayName, saveDisplayName, shortWallet } from "@/lib/use-display-name";
import Link from "next/link";

type JoinStep = "idle" | "confirm" | "pending" | "success";

/* ── MemberRow: isolated so useDisplayName can be called per row ── */
type MemberRowData = {
  key: string;
  walletStr: string;
  role: string;
  joined: string;
  paid: string;
  walletPk: { toBase58(): string };
};

function MemberRow({ m }: { m: MemberRowData }) {
  const displayName = useDisplayName(m.walletStr);
  const handle = displayName ?? shortWallet(m.walletStr);
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "2fr 0.8fr 0.8fr 0.8fr 0.6fr",
        gap: 0,
        borderBottom: "1px solid var(--b-rule)",
        padding: "14px 16px",
        alignItems: "center",
        minWidth: 480,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <Avatar name={handle} size={28} />
        <div>
          <p style={{ fontFamily: "var(--font-geist-mono), monospace", fontSize: 11, color: "var(--b-paper)", letterSpacing: "0.04em" }}>
            {handle}
          </p>
          <p style={{ fontFamily: "var(--font-geist-mono), monospace", fontSize: 9, color: m.role === "HOST" ? "var(--b-gold)" : "var(--b-paper-40)", letterSpacing: "0.12em", textTransform: "uppercase" }}>
            {m.role}
          </p>
        </div>
      </div>
      <p style={{ fontFamily: "var(--font-geist-mono), monospace", fontSize: 11, color: "var(--b-paper-40)" }}>{m.joined}</p>
      <p style={{ fontFamily: "var(--font-geist-mono), monospace", fontSize: 11, color: "var(--b-paper)" }}>{m.paid}</p>
      <span
        style={{
          display: "inline-flex",
          alignItems: "center",
          padding: "2px 7px",
          border: "1px solid rgba(92,135,112,0.35)",
          fontFamily: "var(--font-geist-mono), monospace",
          fontSize: 9,
          color: "var(--b-emerald)",
          letterSpacing: "0.12em",
          textTransform: "uppercase",
          width: "fit-content",
        }}
      >
        ACTIVE
      </span>
      <a
        href={`https://solscan.io/address/${m.walletPk.toBase58()}?cluster=devnet`}
        target="_blank"
        rel="noopener noreferrer"
        style={{ fontFamily: "var(--font-geist-mono), monospace", fontSize: 10, color: "var(--b-gold)", textDecoration: "none" }}
      >
        ↗
      </a>
    </div>
  );
}

export default function PoolDetailPage() {
  const { address } = useParams<{ address: string }>();
  const { connection } = useConnection();
  const wallet = useAnchorWallet();
  const { publicKey } = useWallet();

  const [pool, setPool] = useState<PoolAccount | null>(null);
  const [members, setMembers] = useState<MemberRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [escrowBalance, setEscrowBalance] = useState<number | null>(null);

  // Join flow
  const [joinStep, setJoinStep] = useState<JoinStep>("idle");
  const [joinError, setJoinError] = useState("");
  const [joinTx, setJoinTx] = useState("");
  const [usdcBalance, setUsdcBalance] = useState<number | null>(null);
  const [waitlistJoined, setWaitlistJoined] = useState(false);

  // Host controls
  const [proofUri, setProofUri] = useState("");
  const [submittingProof, setSubmittingProof] = useState(false);
  const [releasingFunds, setReleasingFunds] = useState(false);
  const [closingPool, setClosingPool] = useState(false);
  const [hostError, setHostError] = useState("");
  const [hostSuccess, setHostSuccess] = useState("");
  const [confirmClose, setConfirmClose] = useState(false);
  const [activeTab, setActiveTab] = useState("Members");

  // Display name
  const [nameInput, setNameInput] = useState("");
  const [nameSaving, setNameSaving] = useState(false);
  const [nameSaved, setNameSaved] = useState(false);

  // Must be called unconditionally — before any early returns
  const hostWalletStr = pool?.host?.toBase58() ?? null;
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const hostDisplayName = useDisplayName(hostWalletStr);

  const loadPool = useCallback(async () => {
    try {
      const provider = new AnchorProvider(connection, {} as never, {});
      const program = getProgram(provider);
      const poolKey = new PublicKey(address);
      const data = await program.account.pool.fetch(poolKey);
      const poolAcc: PoolAccount = { publicKey: poolKey, ...data };
      setPool(poolAcc);

      // Fetch real member records
      const memberRecords = await fetchPoolMembers(connection, poolKey);
      setMembers(memberRecords);

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

  /* Fetch member USDC balance whenever wallet connects */
  useEffect(() => {
    if (!publicKey || !pool) return;
    const ata = getAssociatedTokenAddressSync(pool.mint, publicKey);
    connection.getTokenAccountBalance(ata)
      .then((b) => setUsdcBalance(b.value.uiAmount ?? 0))
      .catch(() => setUsdcBalance(0));
  }, [publicKey, pool, connection]);

  useEffect(() => { loadPool(); }, [loadPool]);

  async function joinPool() {
    if (!wallet || !pool) return;
    setJoinStep("pending");
    setJoinError("");
    try {
      const provider = new AnchorProvider(connection, wallet, { commitment: "confirmed" });
      const program = getProgram(provider);
      const memberToken = getAssociatedTokenAddressSync(pool.mint, wallet.publicKey);
      const escrowToken = getAssociatedTokenAddressSync(pool.mint, pool.publicKey, true);
      const memberRecord = deriveMemberPda(pool.publicKey, wallet.publicKey);

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const sig = await program.methods.joinPool().accounts({
        pool: pool.publicKey, member: wallet.publicKey,
        memberToken, escrowToken, memberRecord,
        tokenProgram: TOKEN_PROGRAM_ID,
        associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
        systemProgram: SystemProgram.programId,
      } as any).rpc();

      setJoinTx(sig);
      setJoinStep("success");
      await loadPool();
    } catch (e: unknown) {
      setJoinError(e instanceof Error ? e.message : "Transaction failed");
      setJoinStep("confirm");
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
      const escrowToken  = getAssociatedTokenAddressSync(pool.mint, pool.publicKey, true);
      const hostToken    = getAssociatedTokenAddressSync(pool.mint, wallet.publicKey);
      const platformToken = getAssociatedTokenAddressSync(pool.mint, PLATFORM_WALLET);

      // Create any missing ATAs as pre-instructions (payer = host)
      const preInstructions = [];
      const [hostInfo, platformInfo] = await Promise.all([
        connection.getAccountInfo(hostToken),
        connection.getAccountInfo(platformToken),
      ]);
      if (!hostInfo) {
        preInstructions.push(
          createAssociatedTokenAccountInstruction(
            wallet.publicKey, hostToken, wallet.publicKey, pool.mint,
          )
        );
      }
      if (!platformInfo) {
        preInstructions.push(
          createAssociatedTokenAccountInstruction(
            wallet.publicKey, platformToken, PLATFORM_WALLET, pool.mint,
          )
        );
      }

      await program.methods.releaseFunds().accounts({
        host: wallet.publicKey, pool: pool.publicKey,
        escrowToken, hostToken, platformToken,
        tokenProgram: TOKEN_PROGRAM_ID,
      }).preInstructions(preInstructions).rpc();

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
  const svcId      = titleToSvcId(pool.title, pool.category);
  const fillPct    = Math.round((pool.filledSlots / pool.maxSlots) * 100);
  const isHost     = publicKey?.toBase58() === pool.host.toBase58();
  const active     = isPoolActive(pool);
  const pending    = isPoolPending(pool);
  const open       = active || pending;
  const closed     = !active && !pending;
  const hostAmount = escrowBalance ? (escrowBalance * 0.94).toFixed(2) : "—";
  const addrShort  = `${address.slice(0, 4)}…${address.slice(-4)}`;
  const hostShort  = hostDisplayName ?? shortWallet(pool.host.toBase58());
  const isFull     = pool.filledSlots >= pool.maxSlots;
  const priceNum   = pool.pricePerSlot.toNumber() / 1_000_000; // lamports → USDC
  const hasEnoughUsdc = usdcBalance !== null ? usdcBalance >= priceNum : true;

  const tabs = ["Members", "Activity", "Reviews", "Terms"];

  /* ── Real member rows ── */
  function shortKey(pk: PublicKey) {
    const s = pk.toBase58();
    return `${s.slice(0, 4)}…${s.slice(-4)}`;
  }
  function fmtDate(ts: BN) {
    return new Date(ts.toNumber() * 1000).toLocaleDateString("en-US", { month: "short", day: "numeric" });
  }

  const realRows = members.map((m) => ({
    key: m.publicKey.toBase58(),
    walletStr: m.wallet.toBase58(),
    handle: shortKey(m.wallet), // will be overridden by display name in render
    role: m.wallet.toBase58() === pool.host.toBase58() ? "HOST" : "MEMBER",
    joined: fmtDate(m.joinedAt),
    paid: formatUsdc(pool.pricePerSlot),
    cyclesPaid: m.cyclesPaid,
    walletPk: m.wallet,
    status: "ACTIVE",
  }));

  // Sort: host first, then chronological
  realRows.sort((a, b) => {
    if (a.role === "HOST") return -1;
    if (b.role === "HOST") return 1;
    return 0;
  });

  const openSeats = Math.max(0, pool.maxSlots - pool.filledSlots);
  const openRows = Array.from({ length: openSeats }, (_, i) => ({ key: `open-${i}` }));

  /* ── Activity tab data (derived from on-chain cycles) ── */
  const activityItems = pool.totalCycles > 0
    ? Array.from({ length: pool.totalCycles }, (_, idx) => ({
        cycle: idx + 1,
        event: "PROOF SUBMITTED",
        amount: formatUsdc(pool.pricePerSlot),
        isLast: idx === pool.totalCycles - 1,
      }))
    : [];

  return (
    <div style={{ background: "var(--b-ink)", minHeight: "100vh" }}>
      <BNav />
      <BTicker />

      {/* ── Breadcrumb ── */}
      <div
        className="page-x"
        style={{
          borderBottom: "1px solid var(--b-rule)",
          background: "var(--b-ink-2)",
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
        className="page-x grid-2-sidebar"
        style={{
          maxWidth: 1200,
          margin: "0 auto",
          paddingTop: 40,
          paddingBottom: 80,
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
                style={{ fontSize: "clamp(36px, 8vw, 88px)", lineHeight: 0.9, color: "var(--b-paper)", letterSpacing: "-0.03em" }}
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

          {/* ── JOIN FLOW (non-host, open pool) ── */}
          {open && !isHost && (

            /* ─ Step: SUCCESS ─ */
            joinStep === "success" ? (
              <div
                style={{
                  background: "linear-gradient(135deg, rgba(92,135,112,0.12) 0%, rgba(60,90,75,0.06) 100%)",
                  border: "1px solid rgba(92,135,112,0.45)",
                  padding: "32px 28px",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
                  <span style={{ fontSize: 24 }}>✅</span>
                  <div>
                    <p className="b-eyebrow" style={{ color: "var(--b-emerald)", marginBottom: 4 }}>YOU&apos;RE IN · SEAT LOCKED</p>
                    <p className="b-serif" style={{ fontSize: 28, color: "var(--b-paper)", lineHeight: 1.1 }}>
                      Welcome to the pool.
                    </p>
                  </div>
                </div>
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: 10,
                    padding: "16px",
                    background: "rgba(92,135,112,0.06)",
                    border: "1px solid rgba(92,135,112,0.2)",
                    marginBottom: 20,
                  }}
                >
                  {[
                    { label: "PLAN", value: pool.title },
                    { label: "YOU LOCKED", value: formatUsdc(pool.pricePerSlot) + " USDC" },
                    { label: "CYCLE EVERY", value: `${pool.cycleDays} days` },
                    { label: "TX", value: `${joinTx.slice(0, 16)}…` },
                  ].map((row) => (
                    <div key={row.label} style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <p style={{ fontFamily: "var(--font-geist-mono), monospace", fontSize: 9.5, color: "var(--b-paper-40)", letterSpacing: "0.14em" }}>{row.label}</p>
                      <p style={{ fontFamily: "var(--font-geist-mono), monospace", fontSize: 11, color: "var(--b-paper)" }}>{row.value}</p>
                    </div>
                  ))}
                </div>
                <div style={{ display: "flex", gap: 10 }}>
                  <a
                    href={`https://solscan.io/tx/${joinTx}?cluster=devnet`}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      flex: 1,
                      display: "block",
                      padding: "11px 16px",
                      border: "1px solid rgba(92,135,112,0.4)",
                      color: "var(--b-emerald)",
                      textAlign: "center",
                      fontFamily: "var(--font-geist-mono), monospace",
                      fontSize: 10.5,
                      letterSpacing: "0.14em",
                      textTransform: "uppercase",
                      textDecoration: "none",
                    }}
                  >
                    VIEW TX ↗
                  </a>
                  <Link
                    href="/dashboard/member"
                    style={{
                      flex: 1,
                      display: "block",
                      padding: "11px 16px",
                      background: "var(--b-gold)",
                      color: "var(--b-ink)",
                      textAlign: "center",
                      fontFamily: "var(--font-geist-mono), monospace",
                      fontSize: 10.5,
                      fontWeight: 700,
                      letterSpacing: "0.14em",
                      textTransform: "uppercase",
                      textDecoration: "none",
                    }}
                  >
                    MY DASHBOARD →
                  </Link>
                </div>
              </div>

            /* ─ Step: CONFIRM ─ */
            ) : joinStep === "confirm" || joinStep === "pending" ? (
              <div
                style={{
                  background: "var(--b-ink-3)",
                  border: "1px solid rgba(201,162,79,0.45)",
                  padding: "28px 28px 24px",
                }}
              >
                <p className="b-eyebrow" style={{ marginBottom: 20, fontSize: 9.5 }}>CHECKOUT · REVIEW YOUR ORDER</p>

                {/* What you get */}
                <div style={{ marginBottom: 20 }}>
                  <p style={{ fontFamily: "var(--font-geist), sans-serif", fontSize: 13, fontWeight: 600, color: "var(--b-paper-60)", marginBottom: 10, letterSpacing: "0.04em" }}>
                    What you get
                  </p>
                  {[
                    `1 seat in ${pool.title}`,
                    `Access renewed every ${pool.cycleDays} days`,
                    `Funds held in escrow — released only on delivery`,
                    `Full refund if host fails`,
                  ].map((item) => (
                    <div key={item} style={{ display: "flex", alignItems: "flex-start", gap: 8, marginBottom: 6 }}>
                      <span style={{ color: "var(--b-emerald)", fontSize: 11, marginTop: 1 }}>✓</span>
                      <p style={{ fontFamily: "var(--font-geist), sans-serif", fontSize: 12, color: "var(--b-paper-60)", lineHeight: 1.5 }}>{item}</p>
                    </div>
                  ))}
                </div>

                {/* Price breakdown */}
                <div
                  style={{
                    border: "1px solid var(--b-rule)",
                    padding: "16px",
                    marginBottom: 16,
                    display: "flex",
                    flexDirection: "column",
                    gap: 10,
                  }}
                >
                  <p style={{ fontFamily: "var(--font-geist), sans-serif", fontSize: 13, fontWeight: 600, color: "var(--b-paper-60)", marginBottom: 4 }}>Price breakdown</p>
                  {[
                    { label: "YOUR SHARE", value: formatUsdc(pool.pricePerSlot) + " USDC" },
                    { label: "CYCLE LENGTH", value: `${pool.cycleDays} days` },
                    { label: "TOTAL SEATS", value: `${pool.maxSlots} members` },
                    { label: "ESCROW WALLET", value: `${address.slice(0, 8)}…` },
                  ].map((row) => (
                    <div key={row.label} style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <p style={{ fontFamily: "var(--font-geist-mono), monospace", fontSize: 9.5, color: "var(--b-paper-40)", letterSpacing: "0.14em" }}>{row.label}</p>
                      <p style={{ fontFamily: "var(--font-geist-mono), monospace", fontSize: 11, color: "var(--b-paper)" }}>{row.value}</p>
                    </div>
                  ))}
                  <div style={{ borderTop: "1px solid var(--b-rule)", paddingTop: 10, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <p style={{ fontFamily: "var(--font-geist-mono), monospace", fontSize: 10.5, color: "var(--b-paper)", letterSpacing: "0.14em", fontWeight: 700 }}>DUE NOW</p>
                    <p className="b-serif" style={{ fontSize: 22, color: "var(--b-gold)" }}>{formatUsdc(pool.pricePerSlot)}</p>
                  </div>
                </div>

                {/* USDC balance */}
                {usdcBalance !== null && (
                  <div
                    style={{
                      padding: "10px 14px",
                      marginBottom: 16,
                      border: `1px solid ${hasEnoughUsdc ? "rgba(92,135,112,0.3)" : "rgba(181,86,62,0.4)"}`,
                      background: hasEnoughUsdc ? "rgba(92,135,112,0.05)" : "rgba(181,86,62,0.06)",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                    }}
                  >
                    <p style={{ fontFamily: "var(--font-geist-mono), monospace", fontSize: 10, color: hasEnoughUsdc ? "var(--b-emerald)" : "var(--b-rust)", letterSpacing: "0.12em" }}>
                      {hasEnoughUsdc ? "✓ SUFFICIENT BALANCE" : "⚠ INSUFFICIENT BALANCE"}
                    </p>
                    <p style={{ fontFamily: "var(--font-geist-mono), monospace", fontSize: 11, color: "var(--b-paper)" }}>
                      {usdcBalance.toFixed(2)} USDC
                    </p>
                  </div>
                )}

                {!hasEnoughUsdc && usdcBalance !== null && (
                  <p style={{ fontFamily: "var(--font-geist-mono), monospace", fontSize: 10, color: "var(--b-rust)", letterSpacing: "0.08em", marginBottom: 14, lineHeight: 1.6 }}>
                    You need {formatUsdc(pool.pricePerSlot)} USDC to join. Get USDC at{" "}
                    <a href="https://solfaucet.com" target="_blank" rel="noopener noreferrer" style={{ color: "var(--b-gold)", textDecoration: "none" }}>solfaucet.com ↗</a>
                  </p>
                )}

                {joinError && (
                  <div style={{ padding: "10px 14px", border: "1px solid rgba(181,86,62,0.4)", background: "rgba(181,86,62,0.08)", marginBottom: 14, fontSize: 12, color: "var(--b-rust)" }}>
                    {joinError}
                  </div>
                )}

                <div style={{ display: "flex", gap: 10 }}>
                  <button
                    onClick={() => { setJoinStep("idle"); setJoinError(""); }}
                    disabled={joinStep === "pending"}
                    style={{
                      padding: "12px 20px",
                      background: "transparent",
                      border: "1px solid var(--b-rule)",
                      color: "var(--b-paper-60)",
                      fontFamily: "var(--font-geist-mono), monospace",
                      fontSize: 11,
                      letterSpacing: "0.12em",
                      textTransform: "uppercase",
                      cursor: "pointer",
                      opacity: joinStep === "pending" ? 0.4 : 1,
                    }}
                  >
                    ← BACK
                  </button>
                  <button
                    onClick={joinPool}
                    disabled={joinStep === "pending" || !wallet || !hasEnoughUsdc}
                    style={{
                      flex: 1,
                      background: "var(--b-gold)",
                      border: "none",
                      color: "var(--b-ink)",
                      padding: "12px 20px",
                      fontFamily: "var(--font-geist-mono), monospace",
                      fontSize: 12,
                      fontWeight: 700,
                      letterSpacing: "0.16em",
                      textTransform: "uppercase",
                      cursor: (joinStep === "pending" || !wallet || !hasEnoughUsdc) ? "not-allowed" : "pointer",
                      opacity: (joinStep === "pending" || !wallet || !hasEnoughUsdc) ? 0.5 : 1,
                      transition: "opacity 0.15s",
                    }}
                  >
                    {joinStep === "pending" ? "LOCKING IN ESCROW…" : `CONFIRM & LOCK ${formatUsdc(pool.pricePerSlot)} USDC`}
                  </button>
                </div>
                <p style={{ fontFamily: "var(--font-geist-mono), monospace", fontSize: 9.5, color: "var(--b-paper-40)", textAlign: "center", marginTop: 10, letterSpacing: "0.12em", textTransform: "uppercase" }}>
                  FUNDS HELD IN ESCROW · RELEASED ONLY ON DELIVERY
                </p>
              </div>

            /* ─ Step: IDLE (default) ─ */
            ) : (
              <div
                style={{
                  background: "linear-gradient(135deg, rgba(201,162,79,0.10) 0%, rgba(140,107,34,0.06) 100%)",
                  border: "1px solid rgba(201,162,79,0.35)",
                  padding: "28px 28px 24px",
                }}
              >
                <p className="b-eyebrow" style={{ marginBottom: 12, fontSize: 9.5 }}>
                  YOUR SHARE · {isFull ? "WAITLIST" : "OPEN SEAT"}
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

                {/* Waitlist joined confirmation */}
                {waitlistJoined && (
                  <div style={{ padding: "10px 14px", border: "1px solid rgba(201,162,79,0.4)", background: "rgba(201,162,79,0.08)", marginBottom: 14, fontSize: 12, color: "var(--b-gold)", fontFamily: "var(--font-geist-mono), monospace", letterSpacing: "0.08em" }}>
                    ✓ YOU&apos;RE ON THE WAITLIST — WE&apos;LL NOTIFY YOU IF A SEAT OPENS
                  </div>
                )}

                {!wallet ? (
                  <button
                    disabled
                    style={{
                      width: "100%",
                      background: "var(--b-paper-08)",
                      color: "var(--b-paper-40)",
                      border: "1px solid var(--b-rule)",
                      padding: "14px 24px",
                      fontFamily: "var(--font-geist-mono), monospace",
                      fontSize: 12,
                      fontWeight: 700,
                      letterSpacing: "0.16em",
                      textTransform: "uppercase",
                      cursor: "not-allowed",
                    }}
                  >
                    CONNECT WALLET TO JOIN
                  </button>
                ) : isFull ? (
                  <button
                    onClick={() => setWaitlistJoined(true)}
                    disabled={waitlistJoined}
                    style={{
                      width: "100%",
                      background: waitlistJoined ? "transparent" : "rgba(201,162,79,0.12)",
                      color: waitlistJoined ? "var(--b-paper-40)" : "var(--b-gold)",
                      border: `1px solid ${waitlistJoined ? "var(--b-rule)" : "rgba(201,162,79,0.45)"}`,
                      padding: "14px 24px",
                      fontFamily: "var(--font-geist-mono), monospace",
                      fontSize: 12,
                      fontWeight: 700,
                      letterSpacing: "0.16em",
                      textTransform: "uppercase",
                      cursor: waitlistJoined ? "default" : "pointer",
                      transition: "all 0.15s",
                    }}
                  >
                    {waitlistJoined ? "✓ ON WAITLIST" : "JOIN WAITLIST →"}
                  </button>
                ) : (
                  <button
                    onClick={() => setJoinStep("confirm")}
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
                      cursor: "pointer",
                      transition: "opacity 0.15s",
                    }}
                  >
                    REVIEW &amp; LOCK MY SEAT →
                  </button>
                )}
                <p style={{ fontFamily: "var(--font-geist-mono), monospace", fontSize: 9.5, color: "var(--b-paper-40)", textAlign: "center", marginTop: 10, letterSpacing: "0.12em", textTransform: "uppercase" }}>
                  {isFull ? "POOL FULL · NOTIFY ME WHEN A SEAT OPENS" : "FUNDS HELD IN ESCROW · RELEASED ONLY ON DELIVERY"}
                </p>
              </div>
            )
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

              {/* Release funds — show whenever escrow has a balance, let the program enforce status */}
              {!closed && (escrowBalance ?? 0) > 0 && (
                <div>
                  <p style={{ fontFamily: "var(--font-geist), sans-serif", fontSize: 13, fontWeight: 600, color: "var(--b-paper)", marginBottom: 8 }}>
                    Release Escrow Funds
                  </p>
                  <p style={{ fontSize: 12, color: "var(--b-paper-40)", marginBottom: 12, lineHeight: 1.5 }}>
                    Transfers all escrowed USDC to your wallet minus the 6% platform fee.
                  </p>
                  <button
                    onClick={releaseFunds}
                    disabled={releasingFunds || !wallet}
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
                      opacity: (releasingFunds || !wallet) ? 0.5 : 1,
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
              <div className="table-scroll" style={{ marginTop: 0 }}>
                {/* Header */}
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "2fr 0.8fr 0.8fr 0.8fr 0.6fr",
                    gap: 0,
                    borderBottom: "1px solid var(--b-rule)",
                    padding: "10px 16px",
                    minWidth: 480,
                  }}
                >
                  {["MEMBER", "JOINED", "PAID", "STATUS", "TX"].map((h) => (
                    <p key={h} className="b-eyebrow" style={{ fontSize: 9, color: "var(--b-paper-40)" }}>{h}</p>
                  ))}
                </div>

                {realRows.length === 0 && openSeats === 0 && (
                  <div style={{ padding: "32px 16px", textAlign: "center" }}>
                    <p className="b-eyebrow">NO MEMBERS YET</p>
                  </div>
                )}

                {/* Real member rows */}
                {realRows.map((m) => (
                  <MemberRow key={m.key} m={m} />
                ))}

                {/* Open seat rows */}
                {openRows.map((row, i) => (
                  <div
                    key={row.key}
                    style={{
                      display: "grid",
                      gridTemplateColumns: "2fr 0.8fr 0.8fr 0.8fr 0.6fr",
                      gap: 0,
                      borderBottom: "1px solid var(--b-rule)",
                      padding: "14px 16px",
                      alignItems: "center",
                      background: "rgba(201,162,79,0.03)",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <div style={{ width: 28, height: 28, borderRadius: "50%", border: "1.5px dashed rgba(201,162,79,0.35)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <span style={{ color: "var(--b-gold)", fontSize: 14, opacity: 0.5 }}>+</span>
                      </div>
                      <em className="b-italic" style={{ color: "var(--b-paper-40)", fontFamily: "var(--font-newsreader), serif", fontSize: 13 }}>
                        open seat {openSeats > 1 ? `${i + 1} of ${openSeats}` : "— could be yours"}
                      </em>
                    </div>
                    <p style={{ fontFamily: "var(--font-geist-mono), monospace", fontSize: 11, color: "var(--b-paper-40)" }}>—</p>
                    <p style={{ fontFamily: "var(--font-geist-mono), monospace", fontSize: 11, color: "var(--b-paper-40)" }}>—</p>
                    <span
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        padding: "2px 7px",
                        border: "1px solid rgba(201,162,79,0.3)",
                        fontFamily: "var(--font-geist-mono), monospace",
                        fontSize: 9,
                        color: "var(--b-gold)",
                        letterSpacing: "0.12em",
                        textTransform: "uppercase",
                        width: "fit-content",
                      }}
                    >
                      OPEN
                    </span>
                    {open && !isHost ? (
                      <button
                        onClick={() => setJoinStep("confirm")}
                        disabled={!wallet}
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
                          opacity: !wallet ? 0.5 : 1,
                        }}
                      >
                        CLAIM →
                      </button>
                    ) : <span />}
                  </div>
                ))}
              </div>
            )}

            {/* Activity tab */}
            {activeTab === "Activity" && (
              <div style={{ marginTop: 0 }}>
                {activityItems.length === 0 ? (
                  <div style={{ padding: "40px 16px", textAlign: "center" }}>
                    <p className="b-eyebrow" style={{ marginBottom: 8 }}>NO ACTIVITY YET</p>
                    <p style={{ fontFamily: "var(--font-geist), sans-serif", fontSize: 13, color: "var(--b-paper-40)" }}>
                      Activity will appear here once the host submits the first delivery proof.
                    </p>
                  </div>
                ) : (
                  <div>
                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: "0.5fr 1fr 1fr 0.8fr",
                        borderBottom: "1px solid var(--b-rule)",
                        padding: "10px 16px",
                      }}
                    >
                      {["CYCLE", "EVENT", "AMOUNT", "PROOF"].map((h) => (
                        <p key={h} className="b-eyebrow" style={{ fontSize: 9, color: "var(--b-paper-40)" }}>{h}</p>
                      ))}
                    </div>
                    {activityItems.map((item) => (
                      <div
                        key={item.cycle}
                        style={{
                          display: "grid",
                          gridTemplateColumns: "0.5fr 1fr 1fr 0.8fr",
                          borderBottom: "1px solid var(--b-rule)",
                          padding: "14px 16px",
                          alignItems: "center",
                          background: item.isLast ? "rgba(92,135,112,0.04)" : "transparent",
                        }}
                      >
                        <p style={{ fontFamily: "var(--font-geist-mono), monospace", fontSize: 11, color: "var(--b-paper-40)" }}>
                          #{item.cycle}
                        </p>
                        <span
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            padding: "2px 8px",
                            border: "1px solid rgba(92,135,112,0.35)",
                            background: "rgba(92,135,112,0.06)",
                            fontFamily: "var(--font-geist-mono), monospace",
                            fontSize: 9,
                            color: "var(--b-emerald)",
                            letterSpacing: "0.12em",
                            textTransform: "uppercase",
                            width: "fit-content",
                          }}
                        >
                          {item.event}
                        </span>
                        <p className="b-serif" style={{ fontSize: 16, color: "var(--b-paper)" }}>{item.amount}</p>
                        {item.isLast && pool.lastProofUri ? (
                          <a
                            href={pool.lastProofUri}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{ fontFamily: "var(--font-geist-mono), monospace", fontSize: 10, color: "var(--b-gold)", textDecoration: "none" }}
                          >
                            VIEW ↗
                          </a>
                        ) : (
                          <p style={{ fontFamily: "var(--font-geist-mono), monospace", fontSize: 10, color: "var(--b-paper-40)" }}>—</p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Reviews tab */}
            {activeTab === "Reviews" && (
              <div style={{ padding: "32px 16px", textAlign: "center" }}>
                <p className="b-eyebrow" style={{ marginBottom: 8 }}>REVIEWS · COMING SOON</p>
                <p style={{ fontFamily: "var(--font-geist), sans-serif", fontSize: 13, color: "var(--b-paper-40)" }}>
                  On-chain reputation system launching next cycle.
                </p>
              </div>
            )}

            {/* Terms tab */}
            {activeTab === "Terms" && (
              <div style={{ padding: "28px 16px" }}>
                <p className="b-eyebrow" style={{ marginBottom: 16 }}>POOL TERMS</p>
                {[
                  { title: "Escrow", body: `Your ${formatUsdc(pool.pricePerSlot)} USDC is locked in a non-custodial Solana program. Neither the host nor Poolly can access it until delivery is proven.` },
                  { title: "Delivery cycle", body: `The host must submit proof of delivery every ${pool.cycleDays} days. On verified proof, escrow releases to the host.` },
                  { title: "Dispute", body: "If the host fails to deliver, members may open a dispute. On upheld dispute, all locked USDC is returned to members." },
                  { title: "Fee", body: "A 6% protocol fee is deducted from the host's payout on each release. Members pay their share only." },
                  { title: "Exit", body: "Once locked, funds remain in escrow until the cycle completes. Early exit is not available in the current program version." },
                ].map((item) => (
                  <div key={item.title} style={{ marginBottom: 20, paddingBottom: 20, borderBottom: "1px dashed var(--b-rule)" }}>
                    <p style={{ fontFamily: "var(--font-geist-mono), monospace", fontSize: 11, color: "var(--b-paper)", letterSpacing: "0.10em", textTransform: "uppercase", marginBottom: 6 }}>
                      {item.title}
                    </p>
                    <p style={{ fontFamily: "var(--font-geist), sans-serif", fontSize: 13, color: "var(--b-paper-60)", lineHeight: 1.65 }}>
                      {item.body}
                    </p>
                  </div>
                ))}
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

          {/* Your display name — shown when wallet is connected */}
          {publicKey && (
            <div style={{ border: "1px solid var(--b-rule)", background: "var(--b-ink-3)", padding: "18px 20px" }}>
              <p className="b-eyebrow" style={{ marginBottom: 10 }}>YOUR NAME</p>
              <p style={{ fontFamily: "var(--font-geist-mono), monospace", fontSize: 9.5, color: "var(--b-paper-40)", marginBottom: 10, letterSpacing: "0.08em" }}>
                Set a display name so other members see you as more than a wallet address.
              </p>
              <div style={{ display: "flex", gap: 8 }}>
                <input
                  value={nameInput}
                  onChange={(e) => { setNameInput(e.target.value); setNameSaved(false); }}
                  placeholder={shortWallet(publicKey.toBase58())}
                  maxLength={32}
                  style={{
                    flex: 1,
                    background: "var(--b-ink)",
                    border: "1px solid var(--b-rule)",
                    color: "var(--b-paper)",
                    fontFamily: "var(--font-geist-mono), monospace",
                    fontSize: 11,
                    padding: "7px 10px",
                    outline: "none",
                    letterSpacing: "0.04em",
                  }}
                />
                <button
                  disabled={!nameInput.trim() || nameSaving}
                  onClick={async () => {
                    if (!nameInput.trim()) return;
                    setNameSaving(true);
                    await saveDisplayName(publicKey.toBase58(), nameInput.trim());
                    setNameSaving(false);
                    setNameSaved(true);
                    setTimeout(() => setNameSaved(false), 3000);
                  }}
                  style={{
                    background: nameSaved ? "var(--b-emerald)" : "var(--b-gold)",
                    color: "var(--b-ink)",
                    border: "none",
                    fontFamily: "var(--font-geist-mono), monospace",
                    fontSize: 10,
                    letterSpacing: "0.12em",
                    textTransform: "uppercase",
                    padding: "7px 14px",
                    cursor: "pointer",
                    opacity: !nameInput.trim() || nameSaving ? 0.5 : 1,
                  }}
                >
                  {nameSaved ? "SAVED ✓" : nameSaving ? "…" : "SAVE"}
                </button>
              </div>
            </div>
          )}

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
