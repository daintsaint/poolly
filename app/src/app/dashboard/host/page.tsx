"use client";

import { useEffect, useState, useCallback } from "react";
import { useWallet, useConnection } from "@solana/wallet-adapter-react";
import { getAssociatedTokenAddressSync } from "@solana/spl-token";
import { BNav, BTicker, BFooter, ServiceMark, PoolSlots } from "@/components/vault-ui";
import { DemandIntel } from "@/components/demand-intel";
import {
  fetchHostPools,
  formatUsdc,
  isPoolActive,
  isPoolPending,
  type PoolAccount,
} from "@/lib/poolly-client";
import { CATEGORIES } from "@/lib/constants";
import Link from "next/link";

const CAT_TO_SVC: Record<number, string> = {
  0: "netflix", 1: "ms365", 2: "peloton", 3: "disney", 4: "adobe", 5: "chatgpt",
};

type PoolWithEscrow = { pool: PoolAccount; escrowUsdc: number | null };

function poolStatusLabel(pool: PoolAccount): string {
  if (isPoolActive(pool))  return "ACTIVE";
  if (isPoolPending(pool)) return "PENDING";
  return "CLOSED";
}
function statusStyle(pool: PoolAccount) {
  if (isPoolActive(pool))  return { border: "1px solid rgba(92,135,112,0.4)",  color: "var(--b-emerald)" };
  if (isPoolPending(pool)) return { border: "1px solid rgba(201,162,79,0.35)", color: "var(--b-gold)" };
  return { border: "1px solid var(--b-rule)", color: "var(--b-paper-40)" };
}

const NAV_ITEMS = [
  { label: "Overview",     badge: null as string | null },
  { label: "My pools",     badge: null as string | null },
  { label: "Payouts",      badge: null as string | null },
  { label: "Disputes",     badge: "0" },
  { label: "Demand Intel", badge: null as string | null },
  { label: "Settings",     badge: null as string | null },
];

function monthLabel() {
  return new Date().toLocaleString("en-US", { month: "short", year: "2-digit" }).toUpperCase().replace(" ", " '");
}

export default function HostDashboard() {
  const { publicKey } = useWallet();
  const { connection } = useConnection();

  const addr  = publicKey ? publicKey.toBase58() : "not connected";
  const short = publicKey ? `${addr.slice(0, 8)}…` : "—";

  const [activeNav, setActiveNav] = useState("Overview");
  const [pools, setPools] = useState<PoolWithEscrow[]>([]);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    if (!publicKey) return;
    setLoading(true);
    try {
      const raw = await fetchHostPools(connection, publicKey);

      // Fetch escrow balances in parallel
      const withEscrow: PoolWithEscrow[] = await Promise.all(
        raw.map(async (pool) => {
          try {
            const escrowAta = getAssociatedTokenAddressSync(pool.mint, pool.publicKey, true);
            const bal = await connection.getTokenAccountBalance(escrowAta);
            return { pool, escrowUsdc: bal.value.uiAmount ?? 0 };
          } catch {
            return { pool, escrowUsdc: 0 };
          }
        })
      );

      // Sort: active first, then pending, then closed; newest within each
      withEscrow.sort((a, b) => {
        const rank = (p: PoolAccount) => isPoolActive(p) ? 0 : isPoolPending(p) ? 1 : 2;
        if (rank(a.pool) !== rank(b.pool)) return rank(a.pool) - rank(b.pool);
        return b.pool.createdAt.toNumber() - a.pool.createdAt.toNumber();
      });

      setPools(withEscrow);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [publicKey, connection]);

  useEffect(() => { load(); }, [load]);

  /* ── Derived KPIs ── */
  const livePools    = pools.filter((p) => isPoolActive(p.pool) || isPoolPending(p.pool)).length;
  const totalMembers = pools.reduce((a, p) => a + p.pool.filledSlots, 0);
  const totalEscrow  = pools.reduce((a, p) => a + (p.escrowUsdc ?? 0), 0);
  // Estimated all-time earnings = sum of (totalCycles * filledSlots * pricePerSlot * 0.94)
  const earnedAllTime = pools.reduce((a, p) => {
    return a + p.pool.totalCycles * p.pool.filledSlots * (p.pool.pricePerSlot.toNumber() / 1_000_000) * 0.94;
  }, 0);

  const navWithBadges = NAV_ITEMS.map((item) =>
    item.label === "My pools" ? { ...item, badge: String(pools.length) } : item
  );

  const NOT_CONNECTED = !publicKey;

  /* ── Earnings bar chart: one bar per pool (up to 12), height = escrow balance ── */
  const barData = pools.slice(0, 12).map((p) => p.escrowUsdc ?? 0);
  const maxBar  = Math.max(...barData, 1);

  return (
    <div style={{ background: "var(--b-ink)", minHeight: "100vh" }}>
      <BNav />
      <BTicker />

      <div style={{ display: "flex", maxWidth: 1200, margin: "0 auto" }}>

        {/* ── Sidebar ── */}
        <aside style={{ width: 230, minHeight: "calc(100vh - 102px)", background: "var(--b-ink-2)", borderRight: "1px solid var(--b-rule)", padding: "32px 0 24px", flexShrink: 0, display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
          <div>
            <p className="b-eyebrow" style={{ padding: "0 24px", marginBottom: 20 }}>HOST · {short}</p>
            {navWithBadges.map((item) => {
              const active = activeNav === item.label;
              return (
                <div
                  key={item.label}
                  onClick={() => setActiveNav(item.label)}
                  style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "11px 24px", borderLeft: active ? "2px solid var(--b-gold)" : "2px solid transparent", background: active ? "rgba(201,162,79,0.06)" : "transparent", cursor: "pointer", transition: "background 0.15s" }}
                  onMouseEnter={(e) => { if (!active) e.currentTarget.style.background = "rgba(237,230,214,0.03)"; }}
                  onMouseLeave={(e) => { if (!active) e.currentTarget.style.background = "transparent"; }}
                >
                  <span style={{ fontSize: 13, color: active ? "var(--b-paper)" : "var(--b-paper-60)", fontFamily: "var(--font-geist), sans-serif", fontWeight: active ? 600 : 400 }}>
                    {item.label}
                  </span>
                  {item.badge !== null && (
                    <span style={{ fontFamily: "var(--font-geist-mono), monospace", fontSize: 10, color: active ? "var(--b-gold)" : "var(--b-paper-40)", letterSpacing: "0.08em" }}>
                      {item.badge}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
          <div style={{ padding: "0 16px" }}>
            <Link href="/pools/create" style={{ display: "block", background: "var(--b-gold)", color: "var(--b-ink)", textAlign: "center", padding: "11px 16px", fontFamily: "var(--font-geist-mono), monospace", fontSize: 10.5, fontWeight: 700, letterSpacing: "0.16em", textTransform: "uppercase", textDecoration: "none" }}>
              + NEW PLAN
            </Link>
          </div>
        </aside>

        {/* ── Main content ── */}
        <main style={{ flex: 1, padding: "40px 40px 80px", minWidth: 0 }}>

          {/* Header */}
          <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", marginBottom: 40 }}>
            <div>
              <p className="b-eyebrow" style={{ marginBottom: 12 }}>DASHBOARD · {monthLabel()}</p>
              <h1 className="b-serif" style={{ fontSize: 64, lineHeight: 0.95, color: "var(--b-paper)", letterSpacing: "-0.025em" }}>
                Good {new Date().getHours() < 12 ? "morning" : new Date().getHours() < 18 ? "afternoon" : "evening"},{" "}
                <em style={{ color: "var(--b-gold)", fontStyle: "italic" }}>Host.</em>
              </h1>
            </div>
            <p style={{ fontFamily: "var(--font-geist-mono), monospace", fontSize: 10.5, color: "var(--b-paper-40)", letterSpacing: "0.10em", textAlign: "right" }}>
              {addr !== "not connected" ? `${addr.slice(0, 12)}…${addr.slice(-6)}` : "WALLET NOT CONNECTED"}
            </p>
          </div>

          {/* Not connected state */}
          {NOT_CONNECTED && (
            <div style={{ border: "1px solid var(--b-rule)", padding: "60px 40px", textAlign: "center" }}>
              <p className="b-serif" style={{ fontSize: 32, color: "var(--b-paper-60)", marginBottom: 12 }}>Connect your wallet to view your hosted pools.</p>
              <p className="b-eyebrow">USE THE CONNECT WALLET BUTTON IN THE TOP RIGHT</p>
            </div>
          )}

          {/* Loading */}
          {publicKey && loading && (
            <div style={{ border: "1px solid var(--b-rule)", padding: "60px 40px", textAlign: "center" }}>
              <p className="b-eyebrow">LOADING YOUR POOLS FROM CHAIN…</p>
            </div>
          )}

          {/* Content when loaded */}
          {publicKey && !loading && (
            <>
              {/* KPI strip */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 1, marginBottom: 40 }}>
                {[
                  { label: "EARNED ALL-TIME",  value: `$${earnedAllTime.toFixed(2)}`,  sub: "94% of all releases",         gold: true  },
                  { label: "LIVE POOLS",        value: String(livePools),              sub: `${pools.length} total hosted`, gold: false },
                  { label: "MEMBERS ACTIVE",    value: String(totalMembers),           sub: "across all your plans",        gold: false },
                  { label: "IN ESCROW NOW",     value: `$${totalEscrow.toFixed(2)}`,   sub: "unreleased balance",           gold: false },
                ].map((kpi) => (
                  <div
                    key={kpi.label}
                    style={{ background: kpi.gold ? "linear-gradient(135deg, rgba(201,162,79,0.14) 0%, rgba(140,107,34,0.08) 100%)" : "var(--b-ink-3)", border: `1px solid ${kpi.gold ? "rgba(201,162,79,0.35)" : "var(--b-rule)"}`, padding: "20px 20px 16px" }}
                  >
                    <p className="b-eyebrow" style={{ marginBottom: 10, fontSize: 9 }}>{kpi.label}</p>
                    <p className="b-serif" style={{ fontSize: 46, lineHeight: 1, color: kpi.gold ? "var(--b-gold)" : "var(--b-paper)", marginBottom: 6 }}>{kpi.value}</p>
                    <p style={{ fontFamily: "var(--font-geist-mono), monospace", fontSize: 10, color: "var(--b-paper-40)", letterSpacing: "0.08em" }}>{kpi.sub}</p>
                  </div>
                ))}
              </div>

              {/* Demand Intel panel */}
              {activeNav === "Demand Intel" && (
                <div style={{ background: "var(--b-ink-3)", border: "1px solid rgba(201,162,79,0.2)", padding: "28px", marginBottom: 32 }}>
                  <p className="b-eyebrow" style={{ marginBottom: 20 }}>AI POOL IDEAS · LIVE DEMAND</p>
                  <DemandIntel />
                </div>
              )}

              {/* Payouts */}
              {activeNav === "Payouts" && (
                <div style={{ border: "1px solid var(--b-rule)", padding: "40px", textAlign: "center", marginBottom: 32 }}>
                  <p className="b-serif" style={{ fontSize: 28, color: "var(--b-paper-60)", marginBottom: 12 }}>Payout history coming soon.</p>
                  <p className="b-eyebrow">ALL RELEASES VISIBLE ON-CHAIN VIA SOLSCAN</p>
                </div>
              )}

              {/* Disputes */}
              {activeNav === "Disputes" && (
                <div style={{ border: "1px solid var(--b-rule)", padding: "40px", textAlign: "center", marginBottom: 32 }}>
                  <p className="b-serif" style={{ fontSize: 56, color: "var(--b-emerald)", marginBottom: 8 }}>0</p>
                  <p className="b-eyebrow">OPEN DISPUTES · CLEAN RECORD</p>
                </div>
              )}

              {/* Settings */}
              {activeNav === "Settings" && (
                <div style={{ border: "1px solid var(--b-rule)", padding: "40px", textAlign: "center", marginBottom: 32 }}>
                  <p className="b-serif" style={{ fontSize: 28, color: "var(--b-paper-60)", marginBottom: 12 }}>Account settings</p>
                  <p className="b-eyebrow">CONNECT WALLET TO MANAGE SETTINGS</p>
                </div>
              )}

              {/* Overview + My Pools: 2-col body */}
              {(activeNav === "Overview" || activeNav === "My pools") && (
                <>
                  {pools.length === 0 ? (
                    <div style={{ border: "1px solid var(--b-rule)", padding: "60px 40px", textAlign: "center" }}>
                      <p className="b-serif" style={{ fontSize: 32, color: "var(--b-paper-60)", marginBottom: 16 }}>You haven&apos;t hosted any pools yet.</p>
                      <Link href="/pools/create" style={{ display: "inline-flex", background: "var(--b-gold)", color: "var(--b-ink)", padding: "12px 28px", fontFamily: "var(--font-geist-mono), monospace", fontSize: 11, fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", textDecoration: "none" }}>
                        + CREATE YOUR FIRST PLAN
                      </Link>
                    </div>
                  ) : (
                    <div style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr", gap: 32 }}>

                      {/* Left: pool list */}
                      <div>
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
                          <p className="b-serif" style={{ fontSize: 30, color: "var(--b-paper)" }}>Your pools</p>
                          <p style={{ fontFamily: "var(--font-geist-mono), monospace", fontSize: 10, color: "var(--b-paper-40)", letterSpacing: "0.14em", textTransform: "uppercase" }}>
                            {pools.length} HOSTED
                          </p>
                        </div>

                        <div style={{ display: "flex", flexDirection: "column", gap: 1 }}>
                          {pools.map(({ pool, escrowUsdc }) => {
                            const ss = statusStyle(pool);
                            const svcId = CAT_TO_SVC[pool.category] ?? "chatgpt";
                            const cat = CATEGORIES.find((c) => c.id === pool.category);
                            const escrowFmt = escrowUsdc !== null && escrowUsdc > 0
                              ? `$${escrowUsdc.toFixed(2)}` : "—";
                            const escrowColor = escrowUsdc && escrowUsdc > 0 ? "var(--b-emerald)" : "var(--b-paper-40)";

                            return (
                              <Link
                                key={pool.publicKey.toBase58()}
                                href={`/pools/${pool.publicKey.toBase58()}`}
                                style={{ textDecoration: "none" }}
                              >
                                <div
                                  className="lift"
                                  style={{ display: "grid", gridTemplateColumns: "auto 1fr auto auto", gap: 14, alignItems: "center", background: "var(--b-ink-3)", border: "1px solid var(--b-rule)", padding: "14px 16px", cursor: "pointer" }}
                                >
                                  <ServiceMark id={svcId} size={32} radius={0} />
                                  <div>
                                    <p style={{ fontSize: 14, fontWeight: 600, color: "var(--b-paper)", marginBottom: 4 }}>{pool.title}</p>
                                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                                      <p style={{ fontFamily: "var(--font-geist-mono), monospace", fontSize: 10, color: "var(--b-paper-40)", letterSpacing: "0.06em" }}>
                                        {cat?.label ?? "OTHER"} · {pool.filledSlots}/{pool.maxSlots} SEATS
                                      </p>
                                      <PoolSlots filled={pool.filledSlots} total={pool.maxSlots} size={10} gap={3} />
                                    </div>
                                  </div>
                                  <span style={{ ...ss, background: "transparent", padding: "2px 8px", fontFamily: "var(--font-geist-mono), monospace", fontSize: 9, letterSpacing: "0.14em", textTransform: "uppercase", whiteSpace: "nowrap" }}>
                                    {poolStatusLabel(pool)}
                                  </span>
                                  <p className="b-serif" style={{ fontSize: 18, color: escrowColor, textAlign: "right" }}>{escrowFmt}</p>
                                </div>
                              </Link>
                            );
                          })}
                        </div>
                      </div>

                      {/* Right: escrow chart + AI */}
                      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

                        {/* Escrow chart */}
                        <div style={{ border: "1px solid var(--b-rule)", background: "var(--b-ink-3)", padding: "20px 20px 16px" }}>
                          <p className="b-eyebrow" style={{ marginBottom: 4 }}>ESCROW BY POOL</p>
                          <p style={{ fontFamily: "var(--font-geist-mono), monospace", fontSize: 10, color: "var(--b-paper-40)", marginBottom: 16 }}>current balances · USDC</p>
                          {barData.length === 0 ? (
                            <div style={{ height: 100, display: "flex", alignItems: "center", justifyContent: "center" }}>
                              <p className="b-eyebrow" style={{ fontSize: 9 }}>NO POOLS YET</p>
                            </div>
                          ) : (
                            <>
                              <div style={{ display: "flex", alignItems: "flex-end", gap: 6, height: 100 }}>
                                {barData.map((v, i) => (
                                  <div
                                    key={i}
                                    style={{ flex: 1, background: i === barData.length - 1 ? "var(--b-gold)" : "var(--b-paper-20)", height: `${(v / maxBar) * 100}%`, minHeight: v > 0 ? 4 : 2, transition: "background 0.2s" }}
                                    title={`$${v.toFixed(2)}`}
                                  />
                                ))}
                              </div>
                              <div style={{ display: "flex", justifyContent: "space-between", marginTop: 8 }}>
                                <p style={{ fontFamily: "var(--font-geist-mono), monospace", fontSize: 9.5, color: "var(--b-paper-40)" }}>
                                  {pools[0]?.pool.title.slice(0, 12) ?? ""}
                                </p>
                                <p style={{ fontFamily: "var(--font-geist-mono), monospace", fontSize: 9.5, color: "var(--b-gold)" }}>
                                  TOTAL ${totalEscrow.toFixed(2)}
                                </p>
                              </div>
                            </>
                          )}
                        </div>

                        {/* AI Demand Intel */}
                        <div style={{ background: "var(--b-ink-3)", border: "1px solid rgba(201,162,79,0.2)", padding: "20px", flex: 1 }}>
                          <DemandIntel />
                        </div>
                      </div>
                    </div>
                  )}
                </>
              )}
            </>
          )}
        </main>
      </div>

      <BFooter />
    </div>
  );
}
