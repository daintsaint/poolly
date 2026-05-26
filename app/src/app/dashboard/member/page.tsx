"use client";

import { useState } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { BNav, BTicker, BFooter, ServiceMark, Avatar, PoolSlots } from "@/components/vault-ui";
import { BundleOptimizer } from "@/components/bundle-optimizer";
import Link from "next/link";

/* ─── Static placeholder data ─── */
const MY_POOLS = [
  { id: "netflix",  name: "Netflix Premium", host: "maya.sol",   pay: "$4.99",  saving: "$18.00", nextBill: "Jun 1"  },
  { id: "ms365",    name: "Microsoft 365",   host: "eli.sol",    pay: "$1.69",  saving: "$28.30", nextBill: "Jun 3"  },
  { id: "icloud",   name: "iCloud+ 2TB",     host: "tomoki.sol", pay: "$1.99",  saving: "$8.00",  nextBill: "Jun 7"  },
  { id: "peloton",  name: "Peloton App",     host: "kai.sol",    pay: "$4.00",  saving: "$20.00", nextBill: "Jun 12" },
];

const ACTIVITY_FEED = [
  { dot: "gold",    time: "2m ago",  action: "LOCKED",    plan: "Peloton App",   amount: "$4.00" },
  { dot: "emerald", time: "3d ago",  action: "RELEASED",  plan: "Netflix Premium",amount: "$14.97" },
  { dot: "gold",    time: "7d ago",  action: "LOCKED",    plan: "iCloud+ 2TB",   amount: "$1.99" },
  { dot: "emerald", time: "14d ago", action: "RELEASED",  plan: "MS365",         amount: "$8.45" },
  { dot: "gold",    time: "30d ago", action: "JOINED",    plan: "Peloton App",   amount: "$4.00" },
];

const FILTER_TABS = [
  { label: "ALL",      count: 4 },
  { label: "ACTIVE",   count: 4 },
  { label: "ARCHIVED", count: 0 },
];

export default function MemberDashboard() {
  const { publicKey } = useWallet();
  const addr = publicKey ? publicKey.toBase58() : "not connected";
  const short = publicKey ? `${addr.slice(0, 6)}…${addr.slice(-4)}` : "—";
  const [activeFilter, setActiveFilter] = useState<"ALL" | "ACTIVE" | "ARCHIVED">("ALL");

  return (
    <div style={{ background: "var(--b-ink)", minHeight: "100vh" }}>
      <BNav />
      <BTicker />

      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "40px 40px 80px" }}>

        {/* ── Header ── */}
        <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", marginBottom: 40 }}>
          <div>
            <p className="b-eyebrow" style={{ marginBottom: 12 }}>MEMBER · {short}</p>
            <h1
              className="b-serif"
              style={{ fontSize: 76, lineHeight: 0.92, color: "var(--b-paper)", letterSpacing: "-0.03em" }}
            >
              Your <em style={{ color: "var(--b-gold)", fontStyle: "italic" }}>pools.</em>
            </h1>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <Link
              href="/pools"
              style={{
                background: "transparent",
                border: "1px solid var(--b-rule)",
                color: "var(--b-paper-60)",
                padding: "10px 20px",
                fontFamily: "var(--font-geist-mono), monospace",
                fontSize: 10.5,
                fontWeight: 700,
                letterSpacing: "0.14em",
                textTransform: "uppercase",
                cursor: "pointer",
                textDecoration: "none",
                display: "inline-flex",
              }}
            >
              + BROWSE POOLS
            </Link>
            <a
              href="https://solfaucet.com"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                background: "var(--b-gold)",
                border: "none",
                color: "var(--b-ink)",
                padding: "10px 20px",
                fontFamily: "var(--font-geist-mono), monospace",
                fontSize: 10.5,
                fontWeight: 700,
                letterSpacing: "0.14em",
                textTransform: "uppercase",
                cursor: "pointer",
                textDecoration: "none",
                display: "inline-flex",
              }}
            >
              GET USDC →
            </a>
          </div>
        </div>

        {/* ── Savings hero 2-col ── */}
        <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr", gap: 1, marginBottom: 48 }}>

          {/* Left: savings gold card */}
          <div
            style={{
              background: "linear-gradient(135deg, rgba(201,162,79,0.12) 0%, rgba(140,107,34,0.07) 100%)",
              border: "1px solid rgba(201,162,79,0.35)",
              padding: "32px",
            }}
          >
            <p className="b-eyebrow" style={{ marginBottom: 16 }}>SAVINGS · YEAR TO DATE</p>
            <div style={{ marginBottom: 16 }}>
              <p
                className="b-serif"
                style={{ fontSize: 112, lineHeight: 0.88, color: "var(--b-gold)", letterSpacing: "-0.04em" }}
              >
                $282
              </p>
              <p
                className="b-serif b-italic"
                style={{ fontSize: 20, color: "var(--b-paper-60)", marginTop: 8 }}
              >
                vs. paying solo.
              </p>
            </div>

            <div
              style={{
                borderTop: "1px solid rgba(201,162,79,0.2)",
                paddingTop: 20,
                display: "grid",
                gridTemplateColumns: "repeat(4,1fr)",
                gap: 0,
              }}
            >
              {[
                { label: "MONTHS POOLED",    value: "11" },
                { label: "POOLS JOINED",     value: "4" },
                { label: "LOCKED RIGHT NOW", value: "$12.67" },
                { label: "NEXT PAYMENT",     value: "Jun 1" },
              ].map((s, i, arr) => (
                <div
                  key={s.label}
                  style={{
                    paddingRight: i < arr.length - 1 ? 16 : 0,
                    borderRight: i < arr.length - 1 ? "1px solid rgba(201,162,79,0.15)" : "none",
                    paddingLeft: i > 0 ? 16 : 0,
                  }}
                >
                  <p className="b-eyebrow" style={{ fontSize: 8, marginBottom: 4, color: "rgba(201,162,79,0.7)" }}>{s.label}</p>
                  <p className="b-serif" style={{ fontSize: 22, color: "var(--b-gold)" }}>{s.value}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Right: recent activity */}
          <div
            style={{
              background: "var(--b-ink-2)",
              border: "1px solid var(--b-rule)",
              padding: "24px",
            }}
          >
            <p className="b-eyebrow" style={{ marginBottom: 16 }}>RECENT · LIVE</p>
            <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
              {ACTIVITY_FEED.map((item, i) => (
                <div
                  key={i}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                    padding: "12px 0",
                    borderBottom: i < ACTIVITY_FEED.length - 1 ? "1px solid var(--b-rule)" : "none",
                  }}
                >
                  <span
                    className={item.dot === "gold" ? "b-pulse" : ""}
                    style={{
                      width: 7,
                      height: 7,
                      borderRadius: "50%",
                      background: item.dot === "gold" ? "var(--b-gold)" : "var(--b-emerald)",
                      flexShrink: 0,
                    }}
                  />
                  <span style={{ fontFamily: "var(--font-geist-mono), monospace", fontSize: 9.5, color: "var(--b-paper-40)", width: 44, flexShrink: 0 }}>{item.time}</span>
                  <span
                    style={{
                      fontFamily: "var(--font-geist-mono), monospace",
                      fontSize: 9.5,
                      color: item.dot === "gold" ? "var(--b-gold)" : "var(--b-emerald)",
                      letterSpacing: "0.12em",
                      textTransform: "uppercase",
                      width: 62,
                      flexShrink: 0,
                    }}
                  >
                    {item.action}
                  </span>
                  <span style={{ fontSize: 12, color: "var(--b-paper)", flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{item.plan}</span>
                  <span className="b-serif" style={{ fontSize: 14, color: "var(--b-paper)", flexShrink: 0 }}>{item.amount}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── My pools list ── */}
        <div>
          {/* Header + filter tabs */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 0 }}>
            <p className="b-serif" style={{ fontSize: 36, color: "var(--b-paper)" }}>My pools</p>
            <div style={{ display: "flex", alignItems: "center", gap: 0 }}>
              {FILTER_TABS.map((tab) => {
                const active = activeFilter === tab.label;
                return (
                  <button
                    key={tab.label}
                    onClick={() => setActiveFilter(tab.label as "ALL" | "ACTIVE" | "ARCHIVED")}
                    style={{
                      background: "transparent",
                      border: "none",
                      borderBottom: active ? "2px solid var(--b-gold)" : "2px solid transparent",
                      padding: "8px 16px",
                      fontFamily: "var(--font-geist-mono), monospace",
                      fontSize: 10,
                      fontWeight: 700,
                      letterSpacing: "0.14em",
                      textTransform: "uppercase",
                      color: active ? "var(--b-gold)" : "var(--b-paper-40)",
                      cursor: "pointer",
                      transition: "color 0.15s",
                    }}
                  >
                    {tab.label} · {tab.count}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Column headers */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "2fr 1fr 1fr 1fr 1fr 0.8fr",
              gap: 0,
              borderTop: "1px solid var(--b-rule)",
              borderBottom: "1px solid var(--b-rule)",
              padding: "10px 16px",
              marginTop: 12,
            }}
          >
            {["PLAN", "YOU PAY", "SAVING", "NEXT BILL", "STATUS", ""].map((h) => (
              <p key={h} className="b-eyebrow" style={{ fontSize: 9, color: "var(--b-paper-40)" }}>{h}</p>
            ))}
          </div>

          {/* Pool rows */}
          {(activeFilter === "ARCHIVED" ? [] : MY_POOLS).map((pool) => (
            <div
              key={pool.id}
              className="lift"
              style={{
                display: "grid",
                gridTemplateColumns: "2fr 1fr 1fr 1fr 1fr 0.8fr",
                gap: 0,
                borderBottom: "1px solid var(--b-rule)",
                padding: "16px 16px",
                alignItems: "center",
                cursor: "pointer",
              }}
            >
              {/* Plan */}
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <ServiceMark id={pool.id} size={36} radius={0} />
                <div>
                  <p style={{ fontSize: 14, fontWeight: 600, color: "var(--b-paper)", marginBottom: 2 }}>{pool.name}</p>
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <Avatar name={pool.host} size={16} />
                    <p style={{ fontFamily: "var(--font-geist-mono), monospace", fontSize: 9.5, color: "var(--b-paper-40)", letterSpacing: "0.06em" }}>{pool.host}</p>
                  </div>
                </div>
              </div>

              {/* You pay */}
              <p className="b-serif" style={{ fontSize: 20, color: "var(--b-paper)" }}>{pool.pay}</p>

              {/* Saving */}
              <p style={{ fontFamily: "var(--font-geist-mono), monospace", fontSize: 12, color: "var(--b-gold)", fontWeight: 700 }}>+{pool.saving}/yr</p>

              {/* Next bill */}
              <p style={{ fontFamily: "var(--font-geist-mono), monospace", fontSize: 11, color: "var(--b-paper-60)" }}>{pool.nextBill}</p>

              {/* Status */}
              <span
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 5,
                  padding: "3px 8px",
                  border: "1px solid rgba(92,135,112,0.35)",
                  fontFamily: "var(--font-geist-mono), monospace",
                  fontSize: 9,
                  color: "var(--b-emerald)",
                  letterSpacing: "0.12em",
                  textTransform: "uppercase",
                  width: "fit-content",
                }}
              >
                <span style={{ width: 5, height: 5, borderRadius: "50%", background: "var(--b-emerald)", display: "inline-block" }} />
                ACTIVE
              </span>

              {/* Manage */}
              <Link
                href="/pools"
                style={{
                  background: "transparent",
                  border: "1px solid var(--b-rule)",
                  color: "var(--b-paper-60)",
                  padding: "6px 12px",
                  fontFamily: "var(--font-geist-mono), monospace",
                  fontSize: 9.5,
                  fontWeight: 700,
                  letterSpacing: "0.14em",
                  textTransform: "uppercase",
                  cursor: "pointer",
                  transition: "all 0.15s",
                  textDecoration: "none",
                  display: "inline-flex",
                }}
              >
                MANAGE →
              </Link>
            </div>
          ))}
        </div>

        {/* ── AI Bundle Optimizer ── */}
        <div style={{ marginTop: 64 }}>
          <p className="b-eyebrow" style={{ marginBottom: 20 }}>SAVINGS INTELLIGENCE</p>
          <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr", gap: 1, alignItems: "start" }}>
            {/* Left: optimizer */}
            <BundleOptimizer />
            {/* Right: explainer */}
            <div
              style={{
                background: "var(--b-ink-3)",
                border: "1px solid var(--b-rule)",
                padding: "32px 28px",
                display: "flex",
                flexDirection: "column",
                gap: 24,
              }}
            >
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

      </div>

      <BFooter />
    </div>
  );
}
