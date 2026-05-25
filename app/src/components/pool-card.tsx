"use client";

import Link from "next/link";
import { CATEGORIES } from "@/lib/constants";
import { formatUsdc, isPoolActive, isPoolPending, type PoolAccount } from "@/lib/poolly-client";

const CATEGORY_RETAIL: Record<number, number> = {
  0: 22,
  1: 28,
  2: 40,
  3: 50,
  4: 60,
  5: 20,
};

type Props = { pool: PoolAccount };

export function PoolCard({ pool }: Props) {
  const category  = CATEGORIES.find((c) => c.id === pool.category) ?? CATEGORIES[5];
  const slotsLeft = pool.maxSlots - pool.filledSlots;
  const active    = isPoolActive(pool);
  const pending   = isPoolPending(pool);
  const priceUsd  = pool.pricePerSlot.toNumber() / 1_000_000;
  const retail    = CATEGORY_RETAIL[pool.category] ?? 20;
  const savings   = Math.max(0, Math.round(((retail - priceUsd) / retail) * 100));
  const hostAddr  = pool.host.toBase58();
  const hostShort = `${hostAddr.slice(0, 4)}…${hostAddr.slice(-4)}`;

  return (
    <Link
      href={`/pools/${pool.publicKey.toBase58()}`}
      className="card group block"
      style={{ textDecoration: "none", padding: "20px", display: "flex", flexDirection: "column", gap: "16px" }}
    >
      {/* Row 1: icon + title + category badge + availability pill */}
      <div style={{ display: "flex", alignItems: "flex-start", gap: "12px" }}>
        <div style={{
          height: "48px", width: "48px", borderRadius: "14px",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: "24px", flexShrink: 0,
          background: "rgba(255,255,255,0.05)",
          border: "1px solid rgba(255,255,255,0.09)",
        }}>
          {category.icon}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p className="group-hover:text-violet-300 transition-colors"
            style={{ fontWeight: 700, fontSize: "15px", color: "var(--text-1)", lineHeight: 1.3, marginBottom: "5px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {pool.title}
          </p>
          <div style={{ display: "flex", alignItems: "center", gap: "6px", flexWrap: "wrap" }}>
            <span style={{
              fontSize: "11px", fontWeight: 600, padding: "2px 8px", borderRadius: "999px",
              background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.09)",
              color: "var(--text-3)", letterSpacing: "0.02em",
            }}>
              {category.label}
            </span>
            {slotsLeft > 0 && (active || pending) ? (
              <span style={{
                fontSize: "11px", fontWeight: 600, padding: "2px 8px", borderRadius: "999px",
                background: "rgba(16,185,129,0.1)", border: "1px solid rgba(16,185,129,0.25)",
                color: "#34d399",
              }}>
                {slotsLeft} open
              </span>
            ) : (
              <span style={{
                fontSize: "11px", fontWeight: 600, padding: "2px 8px", borderRadius: "999px",
                background: "rgba(71,85,105,0.15)", border: "1px solid rgba(71,85,105,0.3)",
                color: "#64748b",
              }}>
                {active || pending ? "Full" : "Closed"}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Row 2: host address + on-chain badge */}
      <div style={{
        display: "flex", alignItems: "center", gap: "8px",
        padding: "7px 10px", borderRadius: "10px",
        background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.05)",
      }}>
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none" style={{ flexShrink: 0 }}>
          <circle cx="6" cy="4" r="2.5" stroke="#64748b" strokeWidth="1.2"/>
          <path d="M1 11c0-2.8 2.2-4.5 5-4.5s5 1.7 5 4.5" stroke="#64748b" strokeWidth="1.2" strokeLinecap="round"/>
        </svg>
        <span style={{ fontFamily: "monospace", fontSize: "11px", color: "var(--text-3)", flex: 1 }}>{hostShort}</span>
        <span style={{
          fontSize: "10px", fontWeight: 700, padding: "2px 7px", borderRadius: "999px",
          background: "rgba(52,211,153,0.1)", border: "1px solid rgba(52,211,153,0.2)",
          color: "#34d399", letterSpacing: "0.03em",
        }}>
          ✓ On-chain
        </span>
      </div>

      {/* Row 3: Members panel + Billing panel */}
      <div style={{ display: "flex", gap: "8px" }}>
        <div className="info-panel">
          <p className="info-panel-label">Members</p>
          <p className="info-panel-value">{pool.filledSlots} / {pool.maxSlots}</p>
        </div>
        <div className="info-panel">
          <p className="info-panel-label">Billing</p>
          <p className="info-panel-value">every {pool.cycleDays}d</p>
        </div>
        <div className="info-panel">
          <p className="info-panel-label">Status</p>
          <p className="info-panel-value" style={{ color: active ? "#34d399" : pending ? "#fbbf24" : "#64748b" }}>
            {active ? "Active" : pending ? "Pending" : "Closed"}
          </p>
        </div>
      </div>

      {/* Row 4: price + savings + View button */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "8px", marginTop: "2px" }}>
        <div>
          <div style={{ display: "flex", alignItems: "baseline", gap: "5px" }}>
            <span style={{ fontSize: "26px", fontWeight: 900, color: "white", lineHeight: 1 }}>
              {formatUsdc(pool.pricePerSlot)}
            </span>
            <span style={{ fontSize: "12px", color: "var(--text-3)", fontWeight: 600 }}>USDC/mo</span>
          </div>
          {savings > 5 && (
            <span style={{
              fontSize: "11px", fontWeight: 700, marginTop: "3px", display: "inline-block",
              padding: "2px 7px", borderRadius: "6px",
              background: "rgba(16,185,129,0.1)", border: "1px solid rgba(16,185,129,0.2)",
              color: "#34d399",
            }}>
              Save {savings}% vs ${retail}/mo retail
            </span>
          )}
        </div>
        <span className="btn-primary" style={{ padding: "9px 18px", fontSize: "13px", fontWeight: 700, borderRadius: "10px", flexShrink: 0 }}>
          View →
        </span>
      </div>
    </Link>
  );
}
