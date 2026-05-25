"use client";

import { useWallet } from "@solana/wallet-adapter-react";
import { BNav, BTicker, BFooter, ServiceMark, PoolSlots } from "@/components/vault-ui";
import Link from "next/link";

/* ─── Static placeholder data ─── */
const HOST_POOLS = [
  { id: "netflix",  name: "Netflix Premium",    caption: "4-seat family plan",     filled: 4, total: 4, status: "READY · RELEASE", earnings: "$14.97", earnColor: "var(--b-emerald)" },
  { id: "ms365",    name: "Microsoft 365",       caption: "6-seat shared plan",     filled: 5, total: 6, status: "ACTIVE",          earnings: "$8.45",  earnColor: "var(--b-paper-60)" },
  { id: "spotify",  name: "Spotify Family",      caption: "5-seat music plan",      filled: 3, total: 5, status: "AWAITING PROOF",   earnings: "—",      earnColor: "var(--b-rust)" },
  { id: "disney",   name: "Disney+",             caption: "4-seat streaming",       filled: 4, total: 4, status: "READY · RELEASE", earnings: "$13.97", earnColor: "var(--b-emerald)" },
  { id: "icloud",   name: "iCloud+ 2TB",         caption: "5-seat cloud storage",   filled: 2, total: 5, status: "ACTIVE",          earnings: "—",      earnColor: "var(--b-paper-60)" },
  { id: "adobe",    name: "Adobe Creative CC",   caption: "4-seat pro plan",        filled: 4, total: 4, status: "ACTIVE",          earnings: "$59.96", earnColor: "var(--b-paper-60)" },
];

const BAR_DATA = [12.4, 8.9, 15.2, 11.8, 19.4, 14.6, 22.1, 17.3, 25.8, 20.4, 28.9, 34.5];
const MAX_BAR = Math.max(...BAR_DATA);

function statusStyle(s: string) {
  if (s === "READY · RELEASE") return { border: "1px solid rgba(92,135,112,0.4)", color: "var(--b-emerald)" };
  if (s === "AWAITING PROOF")  return { border: "1px solid rgba(181,86,62,0.4)",  color: "var(--b-rust)" };
  return { border: "1px solid var(--b-rule)", color: "var(--b-paper-40)" };
}

const NAV_ITEMS = [
  { label: "Overview",         badge: null,  active: true  },
  { label: "My pools",         badge: "6",   active: false },
  { label: "Payouts",          badge: null,  active: false },
  { label: "Disputes",         badge: "0",   active: false },
  { label: "Catalog listing",  badge: null,  active: false },
  { label: "Settings",         badge: null,  active: false },
];

export default function HostDashboard() {
  const { publicKey } = useWallet();
  const addr = publicKey ? publicKey.toBase58() : "not connected";
  const short = publicKey ? `${addr.slice(0, 8)}…` : "—";

  return (
    <div style={{ background: "var(--b-ink)", minHeight: "100vh" }}>
      <BNav />
      <BTicker />

      <div style={{ display: "flex", maxWidth: 1200, margin: "0 auto" }}>

        {/* ── Sidebar ── */}
        <aside
          style={{
            width: 230,
            minHeight: "calc(100vh - 102px)",
            background: "var(--b-ink-2)",
            borderRight: "1px solid var(--b-rule)",
            padding: "32px 0 24px",
            flexShrink: 0,
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
          }}
        >
          <div>
            <p className="b-eyebrow" style={{ padding: "0 24px", marginBottom: 20 }}>
              HOST · {short}
            </p>

            {NAV_ITEMS.map((item) => (
              <div
                key={item.label}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "11px 24px",
                  borderLeft: item.active ? "2px solid var(--b-gold)" : "2px solid transparent",
                  background: item.active ? "rgba(201,162,79,0.06)" : "transparent",
                  cursor: "pointer",
                  transition: "background 0.15s",
                }}
              >
                <span
                  style={{
                    fontSize: 13,
                    color: item.active ? "var(--b-paper)" : "var(--b-paper-60)",
                    fontFamily: "var(--font-geist), sans-serif",
                    fontWeight: item.active ? 600 : 400,
                  }}
                >
                  {item.label}
                </span>
                {item.badge !== null && (
                  <span
                    style={{
                      fontFamily: "var(--font-geist-mono), monospace",
                      fontSize: 10,
                      color: item.active ? "var(--b-gold)" : "var(--b-paper-40)",
                      letterSpacing: "0.08em",
                    }}
                  >
                    {item.badge}
                  </span>
                )}
              </div>
            ))}
          </div>

          {/* New plan CTA */}
          <div style={{ padding: "0 16px" }}>
            <Link
              href="/pools/create"
              style={{
                display: "block",
                background: "var(--b-gold)",
                color: "var(--b-ink)",
                textAlign: "center",
                padding: "11px 16px",
                fontFamily: "var(--font-geist-mono), monospace",
                fontSize: 10.5,
                fontWeight: 700,
                letterSpacing: "0.16em",
                textTransform: "uppercase",
                textDecoration: "none",
              }}
            >
              + NEW PLAN
            </Link>
          </div>
        </aside>

        {/* ── Main content ── */}
        <main style={{ flex: 1, padding: "40px 40px 80px", minWidth: 0 }}>

          {/* Header */}
          <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", marginBottom: 40 }}>
            <div>
              <p className="b-eyebrow" style={{ marginBottom: 12 }}>DASHBOARD · MAY &apos;26</p>
              <h1
                className="b-serif"
                style={{ fontSize: 64, lineHeight: 0.95, color: "var(--b-paper)", letterSpacing: "-0.025em" }}
              >
                Good morning,{" "}
                <em style={{ color: "var(--b-gold)", fontStyle: "italic" }}>Host.</em>
              </h1>
            </div>
            <p
              style={{
                fontFamily: "var(--font-geist-mono), monospace",
                fontSize: 10.5,
                color: "var(--b-paper-40)",
                letterSpacing: "0.10em",
                textAlign: "right",
              }}
            >
              {addr !== "not connected" ? `${addr.slice(0, 12)}…${addr.slice(-6)}` : "WALLET NOT CONNECTED"}
            </p>
          </div>

          {/* KPI strip */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 1, marginBottom: 40 }}>
            {[
              { label: "EARNED ALL-TIME",  value: "$1,284.40", sub: "+$34.97 this cycle", gold: true  },
              { label: "LIVE POOLS",        value: "6",         sub: "2 ready to release",  gold: false },
              { label: "MEMBERS ACTIVE",    value: "22",        sub: "across all plans",    gold: false },
              { label: "NET RATING",        value: "★ 4.9",     sub: "from 18 reviews",     gold: false },
            ].map((kpi, i) => (
              <div
                key={kpi.label}
                style={{
                  background: kpi.gold ? "linear-gradient(135deg, rgba(201,162,79,0.14) 0%, rgba(140,107,34,0.08) 100%)" : "var(--b-ink-3)",
                  border: `1px solid ${kpi.gold ? "rgba(201,162,79,0.35)" : "var(--b-rule)"}`,
                  padding: "20px 20px 16px",
                }}
              >
                <p className="b-eyebrow" style={{ marginBottom: 10, fontSize: 9 }}>{kpi.label}</p>
                <p className="b-serif" style={{ fontSize: 46, lineHeight: 1, color: kpi.gold ? "var(--b-gold)" : "var(--b-paper)", marginBottom: 6 }}>
                  {kpi.value}
                </p>
                <p style={{ fontFamily: "var(--font-geist-mono), monospace", fontSize: 10, color: "var(--b-paper-40)", letterSpacing: "0.08em" }}>
                  {kpi.sub}
                </p>
              </div>
            ))}
          </div>

          {/* 2-col body */}
          <div style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr", gap: 32 }}>

            {/* Left: pool list */}
            <div>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
                <p className="b-serif" style={{ fontSize: 30, color: "var(--b-paper)" }}>Your pools</p>
                <p style={{ fontFamily: "var(--font-geist-mono), monospace", fontSize: 10, color: "var(--b-paper-40)", letterSpacing: "0.14em", textTransform: "uppercase" }}>SORT · NEWEST</p>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 1 }}>
                {HOST_POOLS.map((pool) => {
                  const ss = statusStyle(pool.status);
                  return (
                    <div
                      key={pool.id}
                      className="lift"
                      style={{
                        display: "grid",
                        gridTemplateColumns: "auto 1fr auto auto",
                        gap: 14,
                        alignItems: "center",
                        background: "var(--b-ink-3)",
                        border: "1px solid var(--b-rule)",
                        padding: "14px 16px",
                        cursor: "pointer",
                      }}
                    >
                      <ServiceMark id={pool.id} size={32} radius={0} />
                      <div>
                        <p style={{ fontSize: 14, fontWeight: 600, color: "var(--b-paper)", marginBottom: 4 }}>{pool.name}</p>
                        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                          <p style={{ fontFamily: "var(--font-geist-mono), monospace", fontSize: 10, color: "var(--b-paper-40)", letterSpacing: "0.06em" }}>{pool.caption}</p>
                          <PoolSlots filled={pool.filled} total={pool.total} size={10} gap={3} />
                        </div>
                      </div>
                      <span
                        style={{
                          ...ss,
                          background: "transparent",
                          padding: "2px 8px",
                          fontFamily: "var(--font-geist-mono), monospace",
                          fontSize: 9,
                          letterSpacing: "0.14em",
                          textTransform: "uppercase",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {pool.status}
                      </span>
                      <p className="b-serif" style={{ fontSize: 18, color: pool.earnColor, textAlign: "right" }}>{pool.earnings}</p>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Right: chart + next release */}
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

              {/* Bar chart */}
              <div style={{ border: "1px solid var(--b-rule)", background: "var(--b-ink-3)", padding: "20px 20px 16px" }}>
                <p className="b-eyebrow" style={{ marginBottom: 16 }}>EARNINGS · 12 WK</p>
                <div style={{ display: "flex", alignItems: "flex-end", gap: 6, height: 100 }}>
                  {BAR_DATA.map((v, i) => (
                    <div
                      key={i}
                      style={{
                        flex: 1,
                        background: i === BAR_DATA.length - 1 ? "var(--b-gold)" : "var(--b-paper-20)",
                        height: `${(v / MAX_BAR) * 100}%`,
                        minHeight: 4,
                        transition: "background 0.2s",
                        position: "relative",
                      }}
                      title={`$${v.toFixed(2)}`}
                    />
                  ))}
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", marginTop: 8 }}>
                  <p style={{ fontFamily: "var(--font-geist-mono), monospace", fontSize: 9.5, color: "var(--b-paper-40)" }}>12 WKS AGO</p>
                  <p style={{ fontFamily: "var(--font-geist-mono), monospace", fontSize: 9.5, color: "var(--b-gold)" }}>THIS WK</p>
                </div>
              </div>

              {/* Next release countdown */}
              <div
                style={{
                  background: "linear-gradient(135deg, rgba(201,162,79,0.10) 0%, rgba(140,107,34,0.05) 100%)",
                  border: "1px solid rgba(201,162,79,0.3)",
                  padding: "20px",
                }}
              >
                <p className="b-eyebrow" style={{ marginBottom: 12 }}>NEXT RELEASE</p>
                <p className="b-serif" style={{ fontSize: 36, color: "var(--b-gold)", marginBottom: 6 }}>2d 14h 32m</p>
                <p style={{ fontFamily: "var(--font-geist-mono), monospace", fontSize: 10, color: "var(--b-paper-40)", letterSpacing: "0.10em", textTransform: "uppercase" }}>
                  NETFLIX PREMIUM · $14.97 READY
                </p>
                <div style={{ borderTop: "1px solid rgba(201,162,79,0.2)", marginTop: 14, paddingTop: 14 }}>
                  <p style={{ fontFamily: "var(--font-geist-mono), monospace", fontSize: 10, color: "var(--b-paper-40)", letterSpacing: "0.08em" }}>
                    SUBMIT PROOF TO UNLOCK FUNDS
                  </p>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>

      <BFooter />
    </div>
  );
}
