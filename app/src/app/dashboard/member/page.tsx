"use client";

import { useEffect, useState, useCallback } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { useConnection } from "@solana/wallet-adapter-react";
import { AnchorProvider } from "@coral-xyz/anchor";
import { BNav, BTicker, BFooter, ServiceMark, Avatar, PoolSlots } from "@/components/vault-ui";
import { BundleOptimizer } from "@/components/bundle-optimizer";
import { fetchMembershipPools, formatUsdc, isPoolActive, isPoolPending, type PoolAccount, type MemberRecord } from "@/lib/poolly-client";
import { CATEGORIES } from "@/lib/constants";
import Link from "next/link";

const CAT_TO_SVC: Record<number, string> = {
  0: "netflix", 1: "ms365", 2: "peloton", 3: "disney", 4: "adobe", 5: "chatgpt",
};

type Membership = { record: MemberRecord; pool: PoolAccount };

function poolStatus(pool: PoolAccount) {
  if (isPoolActive(pool)) return "active";
  if (isPoolPending(pool)) return "pending";
  return "closed";
}

function fmtDate(ts: { toNumber(): number }) {
  const d = new Date(ts.toNumber() * 1000);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function timeAgo(ts: { toNumber(): number }) {
  const secs = Math.floor(Date.now() / 1000) - ts.toNumber();
  if (secs < 86400) return `${Math.max(1, Math.floor(secs / 3600))}h ago`;
  const days = Math.floor(secs / 86400);
  return days === 1 ? "1d ago" : `${days}d ago`;
}

export default function MemberDashboard() {
  const { publicKey } = useWallet();
  const { connection } = useConnection();

  const [memberships, setMemberships] = useState<Membership[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeFilter, setActiveFilter] = useState<"ALL" | "ACTIVE" | "PENDING" | "CLOSED">("ALL");

  const addr = publicKey ? publicKey.toBase58() : "not connected";
  const short = publicKey ? `${addr.slice(0, 6)}…${addr.slice(-4)}` : "—";

  const load = useCallback(async () => {
    if (!publicKey) return;
    setLoading(true);
    try {
      const data = await fetchMembershipPools(connection, publicKey);
      // Sort newest first
      data.sort((a, b) => b.record.joinedAt.toNumber() - a.record.joinedAt.toNumber());
      setMemberships(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [publicKey, connection]);

  useEffect(() => { load(); }, [load]);

  /* ── Derived KPIs ── */
  const totalPaidUsdc = memberships.reduce(
    (acc, m) => acc + m.record.cyclesPaid * m.pool.pricePerSlot.toNumber(),
    0
  ) / 1_000_000;

  // Estimated savings: if solo you'd pay full pool price; you pay 1/maxSlots share
  const estimatedSavings = memberships.reduce((acc, m) => {
    const sharePrice = m.pool.pricePerSlot.toNumber() / 1_000_000;
    const soloPrice  = sharePrice * m.pool.maxSlots;
    return acc + (soloPrice - sharePrice) * m.record.cyclesPaid;
  }, 0);

  const lockedNow = memberships
    .filter((m) => isPoolActive(m.pool) || isPoolPending(m.pool))
    .reduce((acc, m) => acc + m.pool.pricePerSlot.toNumber(), 0) / 1_000_000;

  const nextPayment = memberships
    .filter((m) => isPoolActive(m.pool) && m.pool.nextChargeAt.toNumber() > 0)
    .map((m) => m.pool.nextChargeAt.toNumber())
    .sort((a, b) => a - b)[0];

  const filtered = memberships.filter((m) => {
    if (activeFilter === "ALL") return true;
    if (activeFilter === "ACTIVE") return isPoolActive(m.pool);
    if (activeFilter === "PENDING") return isPoolPending(m.pool);
    if (activeFilter === "CLOSED") return !isPoolActive(m.pool) && !isPoolPending(m.pool);
    return true;
  });

  const filterTabs: { label: "ALL" | "ACTIVE" | "PENDING" | "CLOSED"; count: number }[] = [
    { label: "ALL",     count: memberships.length },
    { label: "ACTIVE",  count: memberships.filter((m) => isPoolActive(m.pool)).length },
    { label: "PENDING", count: memberships.filter((m) => isPoolPending(m.pool)).length },
    { label: "CLOSED",  count: memberships.filter((m) => !isPoolActive(m.pool) && !isPoolPending(m.pool)).length },
  ];

  const NOT_CONNECTED = !publicKey;

  return (
    <div style={{ background: "var(--b-ink)", minHeight: "100vh" }}>
      <BNav />
      <BTicker />

      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "40px 40px 80px" }}>

        {/* ── Header ── */}
        <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", marginBottom: 40 }}>
          <div>
            <p className="b-eyebrow" style={{ marginBottom: 12 }}>MEMBER · {short}</p>
            <h1 className="b-serif" style={{ fontSize: 76, lineHeight: 0.92, color: "var(--b-paper)", letterSpacing: "-0.03em" }}>
              Your <em style={{ color: "var(--b-gold)", fontStyle: "italic" }}>pools.</em>
            </h1>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <Link href="/pools" style={{ background: "transparent", border: "1px solid var(--b-rule)", color: "var(--b-paper-60)", padding: "10px 20px", fontFamily: "var(--font-geist-mono), monospace", fontSize: 10.5, fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", textDecoration: "none", display: "inline-flex" }}>
              + BROWSE POOLS
            </Link>
            <a href="https://solfaucet.com" target="_blank" rel="noopener noreferrer" style={{ background: "var(--b-gold)", border: "none", color: "var(--b-ink)", padding: "10px 20px", fontFamily: "var(--font-geist-mono), monospace", fontSize: 10.5, fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", textDecoration: "none", display: "inline-flex" }}>
              GET USDC →
            </a>
          </div>
        </div>

        {/* ── Not connected ── */}
        {NOT_CONNECTED && (
          <div style={{ border: "1px solid var(--b-rule)", padding: "60px 40px", textAlign: "center", marginBottom: 48 }}>
            <p className="b-serif" style={{ fontSize: 32, color: "var(--b-paper-60)", marginBottom: 12 }}>Connect your wallet to view your pools.</p>
            <p className="b-eyebrow">USE THE CONNECT WALLET BUTTON IN THE TOP RIGHT</p>
          </div>
        )}

        {/* ── Loading ── */}
        {publicKey && loading && (
          <div style={{ border: "1px solid var(--b-rule)", padding: "60px 40px", textAlign: "center", marginBottom: 48 }}>
            <p className="b-eyebrow">LOADING YOUR POOLS FROM CHAIN…</p>
          </div>
        )}

        {/* ── Main content (wallet connected + loaded) ── */}
        {publicKey && !loading && (
          <>
            {/* ── KPI hero 2-col ── */}
            <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr", gap: 1, marginBottom: 48 }}>

              {/* Left: savings gold card */}
              <div style={{ background: "linear-gradient(135deg, rgba(201,162,79,0.12) 0%, rgba(140,107,34,0.07) 100%)", border: "1px solid rgba(201,162,79,0.35)", padding: "32px" }}>
                <p className="b-eyebrow" style={{ marginBottom: 16 }}>
                  {memberships.length === 0 ? "NO POOLS YET · JOIN ONE BELOW" : "ESTIMATED SAVINGS · ALL TIME"}
                </p>
                {memberships.length === 0 ? (
                  <div>
                    <p className="b-serif" style={{ fontSize: 48, lineHeight: 1, color: "var(--b-paper-40)", marginBottom: 16 }}>$0.00</p>
                    <Link href="/pools" style={{ display: "inline-flex", background: "var(--b-gold)", color: "var(--b-ink)", padding: "12px 24px", fontFamily: "var(--font-geist-mono), monospace", fontSize: 11, fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", textDecoration: "none" }}>
                      BROWSE OPEN POOLS →
                    </Link>
                  </div>
                ) : (
                  <>
                    <div style={{ marginBottom: 16 }}>
                      <p className="b-serif" style={{ fontSize: 112, lineHeight: 0.88, color: "var(--b-gold)", letterSpacing: "-0.04em" }}>
                        ${estimatedSavings.toFixed(0)}
                      </p>
                      <p className="b-serif b-italic" style={{ fontSize: 20, color: "var(--b-paper-60)", marginTop: 8 }}>
                        vs. paying solo.
                      </p>
                    </div>

                    <div style={{ borderTop: "1px solid rgba(201,162,79,0.2)", paddingTop: 20, display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 0 }}>
                      {[
                        { label: "CYCLES PAID",     value: String(memberships.reduce((a, m) => a + m.record.cyclesPaid, 0)) },
                        { label: "POOLS JOINED",    value: String(memberships.length) },
                        { label: "LOCKED NOW",      value: `$${lockedNow.toFixed(2)}` },
                        { label: "NEXT PAYMENT",    value: nextPayment ? fmtDate({ toNumber: () => nextPayment }) : "—" },
                      ].map((s, i, arr) => (
                        <div key={s.label} style={{ paddingRight: i < arr.length - 1 ? 16 : 0, borderRight: i < arr.length - 1 ? "1px solid rgba(201,162,79,0.15)" : "none", paddingLeft: i > 0 ? 16 : 0 }}>
                          <p className="b-eyebrow" style={{ fontSize: 8, marginBottom: 4, color: "rgba(201,162,79,0.7)" }}>{s.label}</p>
                          <p className="b-serif" style={{ fontSize: 22, color: "var(--b-gold)" }}>{s.value}</p>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>

              {/* Right: join activity feed */}
              <div style={{ background: "var(--b-ink-2)", border: "1px solid var(--b-rule)", padding: "24px" }}>
                <p className="b-eyebrow" style={{ marginBottom: 16 }}>RECENT · ON-CHAIN</p>
                {memberships.length === 0 ? (
                  <p style={{ fontFamily: "var(--font-geist), sans-serif", fontSize: 13, color: "var(--b-paper-40)", paddingTop: 16 }}>
                    No activity yet. Join a pool to see your history here.
                  </p>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
                    {memberships.slice(0, 6).map((m, i, arr) => (
                      <div key={m.record.publicKey.toBase58()} style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 0", borderBottom: i < arr.length - 1 ? "1px solid var(--b-rule)" : "none" }}>
                        <span
                          className="b-pulse"
                          style={{ width: 7, height: 7, borderRadius: "50%", background: isPoolActive(m.pool) ? "var(--b-emerald)" : isPoolPending(m.pool) ? "var(--b-gold)" : "var(--b-paper-40)", flexShrink: 0 }}
                        />
                        <span style={{ fontFamily: "var(--font-geist-mono), monospace", fontSize: 9.5, color: "var(--b-paper-40)", width: 44, flexShrink: 0 }}>
                          {timeAgo(m.record.joinedAt)}
                        </span>
                        <span style={{ fontFamily: "var(--font-geist-mono), monospace", fontSize: 9.5, color: "var(--b-gold)", letterSpacing: "0.12em", textTransform: "uppercase", width: 54, flexShrink: 0 }}>
                          JOINED
                        </span>
                        <span style={{ fontSize: 12, color: "var(--b-paper)", flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {m.pool.title}
                        </span>
                        <span className="b-serif" style={{ fontSize: 14, color: "var(--b-paper)", flexShrink: 0 }}>
                          {formatUsdc(m.pool.pricePerSlot)}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* ── My pools list ── */}
            <div>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 0 }}>
                <p className="b-serif" style={{ fontSize: 36, color: "var(--b-paper)" }}>My pools</p>
                <div style={{ display: "flex", alignItems: "center", gap: 0 }}>
                  {filterTabs.map((tab) => {
                    const active = activeFilter === tab.label;
                    return (
                      <button
                        key={tab.label}
                        onClick={() => setActiveFilter(tab.label)}
                        style={{ background: "transparent", border: "none", borderBottom: active ? "2px solid var(--b-gold)" : "2px solid transparent", padding: "8px 16px", fontFamily: "var(--font-geist-mono), monospace", fontSize: 10, fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", color: active ? "var(--b-gold)" : "var(--b-paper-40)", cursor: "pointer", transition: "color 0.15s" }}
                      >
                        {tab.label} · {tab.count}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Column headers */}
              <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr 1fr 0.8fr", gap: 0, borderTop: "1px solid var(--b-rule)", borderBottom: "1px solid var(--b-rule)", padding: "10px 16px", marginTop: 12 }}>
                {["PLAN", "YOU PAY", "CYCLES", "NEXT BILL", "STATUS", ""].map((h) => (
                  <p key={h} className="b-eyebrow" style={{ fontSize: 9, color: "var(--b-paper-40)" }}>{h}</p>
                ))}
              </div>

              {filtered.length === 0 && (
                <div style={{ padding: "40px 16px", textAlign: "center", borderBottom: "1px solid var(--b-rule)" }}>
                  <p className="b-eyebrow" style={{ marginBottom: 8 }}>
                    {memberships.length === 0 ? "YOU HAVEN'T JOINED ANY POOLS YET" : `NO ${activeFilter} POOLS`}
                  </p>
                  {memberships.length === 0 && (
                    <Link href="/pools" style={{ fontFamily: "var(--font-geist-mono), monospace", fontSize: 11, color: "var(--b-gold)", textDecoration: "none", letterSpacing: "0.12em" }}>
                      BROWSE THE CATALOG →
                    </Link>
                  )}
                </div>
              )}

              {/* Pool rows */}
              {filtered.map((m) => {
                const status = poolStatus(m.pool);
                const svcId  = CAT_TO_SVC[m.pool.category] ?? "chatgpt";
                const hostShort = `${m.pool.host.toBase58().slice(0, 4)}…${m.pool.host.toBase58().slice(-4)}`;
                const nextBill  = isPoolActive(m.pool) && m.pool.nextChargeAt.toNumber() > 0
                  ? fmtDate(m.pool.nextChargeAt) : "—";
                const statusColor = status === "active" ? "var(--b-emerald)" : status === "pending" ? "var(--b-gold)" : "var(--b-paper-40)";
                const statusBorder = status === "active" ? "rgba(92,135,112,0.35)" : status === "pending" ? "rgba(201,162,79,0.3)" : "var(--b-rule)";

                return (
                  <div
                    key={m.record.publicKey.toBase58()}
                    className="lift"
                    style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr 1fr 0.8fr", gap: 0, borderBottom: "1px solid var(--b-rule)", padding: "16px 16px", alignItems: "center", cursor: "pointer" }}
                  >
                    {/* Plan */}
                    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                      <ServiceMark id={svcId} size={36} radius={0} />
                      <div>
                        <p style={{ fontSize: 14, fontWeight: 600, color: "var(--b-paper)", marginBottom: 2 }}>{m.pool.title}</p>
                        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                          <Avatar name={hostShort} size={16} />
                          <p style={{ fontFamily: "var(--font-geist-mono), monospace", fontSize: 9.5, color: "var(--b-paper-40)", letterSpacing: "0.06em" }}>{hostShort}</p>
                          <PoolSlots filled={m.pool.filledSlots} total={m.pool.maxSlots} size={8} gap={2} />
                        </div>
                      </div>
                    </div>

                    {/* You pay */}
                    <p className="b-serif" style={{ fontSize: 20, color: "var(--b-paper)" }}>{formatUsdc(m.pool.pricePerSlot)}</p>

                    {/* Cycles paid */}
                    <p style={{ fontFamily: "var(--font-geist-mono), monospace", fontSize: 11, color: "var(--b-paper-60)" }}>
                      {m.record.cyclesPaid} cycle{m.record.cyclesPaid !== 1 ? "s" : ""}
                    </p>

                    {/* Next bill */}
                    <p style={{ fontFamily: "var(--font-geist-mono), monospace", fontSize: 11, color: "var(--b-paper-60)" }}>{nextBill}</p>

                    {/* Status */}
                    <span style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "3px 8px", border: `1px solid ${statusBorder}`, fontFamily: "var(--font-geist-mono), monospace", fontSize: 9, color: statusColor, letterSpacing: "0.12em", textTransform: "uppercase", width: "fit-content" }}>
                      <span style={{ width: 5, height: 5, borderRadius: "50%", background: statusColor, display: "inline-block" }} />
                      {status.toUpperCase()}
                    </span>

                    {/* Link to pool */}
                    <Link
                      href={`/pools/${m.pool.publicKey.toBase58()}`}
                      style={{ background: "transparent", border: "1px solid var(--b-rule)", color: "var(--b-paper-60)", padding: "6px 12px", fontFamily: "var(--font-geist-mono), monospace", fontSize: 9.5, fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", cursor: "pointer", textDecoration: "none", display: "inline-flex" }}
                    >
                      VIEW →
                    </Link>
                  </div>
                );
              })}
            </div>

            {/* ── AI Bundle Optimizer ── */}
            <div style={{ marginTop: 64 }}>
              <p className="b-eyebrow" style={{ marginBottom: 20 }}>SAVINGS INTELLIGENCE</p>
              <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr", gap: 1, alignItems: "start" }}>
                <BundleOptimizer />
                <div style={{ background: "var(--b-ink-3)", border: "1px solid var(--b-rule)", padding: "32px 28px", display: "flex", flexDirection: "column", gap: 24 }}>
                  <div>
                    <p className="b-eyebrow" style={{ marginBottom: 12 }}>HOW IT WORKS</p>
                    <p className="b-serif" style={{ fontSize: 28, lineHeight: 1.2, color: "var(--b-paper)" }}>
                      AI scans market rates &amp; pool fill data to build your cheapest bundle.
                    </p>
                  </div>
                  {[
                    { n: "01", t: "Set your budget", d: "Tell us how much you want to spend per month on subscriptions." },
                    { n: "02", t: "Tag your services", d: "Mark which services you already pay for — AI prioritises those first." },
                    { n: "03", t: "Get your plan", d: "We return the optimal mix of Poolly pools that maximises your savings within budget." },
                  ].map((s) => (
                    <div key={s.n} style={{ display: "flex", gap: 14 }}>
                      <p style={{ fontFamily: "var(--font-geist-mono), monospace", fontSize: 11, color: "var(--b-gold)", letterSpacing: "0.14em", flexShrink: 0, marginTop: 2 }}>{s.n}</p>
                      <div>
                        <p style={{ fontSize: 13, fontWeight: 600, color: "var(--b-paper)", marginBottom: 4 }}>{s.t}</p>
                        <p style={{ fontFamily: "var(--font-geist), sans-serif", fontSize: 12, color: "var(--b-paper-40)", lineHeight: 1.6 }}>{s.d}</p>
                      </div>
                    </div>
                  ))}
                  <div style={{ borderTop: "1px solid var(--b-rule)", paddingTop: 16 }}>
                    <p style={{ fontFamily: "var(--font-geist-mono), monospace", fontSize: 10, color: "var(--b-paper-40)", letterSpacing: "0.10em" }}>
                      ✦ POWERED BY GROQ · LLAMA 3.3 70B · LIVE MARKET DATA
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      <BFooter />
    </div>
  );
}
