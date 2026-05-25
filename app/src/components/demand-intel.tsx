"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ServiceMark } from "@/components/vault-ui";

type Opportunity = {
  svcId: string;
  service: string;
  insight: string;
  demand: "HIGH" | "MEDIUM" | "LOW";
  weeklySearches: number;
  suggestedPrice: number;
  maxSlots: number;
  category: number;
};

export function DemandIntel() {
  const [items, setItems] = useState<Opportunity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/demand-intel")
      .then((r) => {
        if (!r.ok) throw new Error(`Error ${r.status}`);
        return r.json();
      })
      .then((data: { opportunities: Opportunity[] }) => {
        setItems(data.opportunities ?? []);
        setLoading(false);
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : "Failed to load demand data.");
        setLoading(false);
      });
  }, []);

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 0,
      }}
    >
      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 16,
        }}
      >
        <p className="b-eyebrow">AI Pool Ideas · Live Demand</p>
      </div>

      {/* Loading skeletons */}
      {loading && (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {[0, 1, 2].map((i) => (
            <SkeletonRow key={i} />
          ))}
        </div>
      )}

      {/* Error */}
      {!loading && error && (
        <p
          style={{
            fontFamily: "var(--font-geist-mono), monospace",
            fontSize: 12,
            color: "var(--b-rust)",
            letterSpacing: "0.06em",
            padding: "12px 0",
          }}
        >
          {error}
        </p>
      )}

      {/* List */}
      {!loading && !error && (
        <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
          {items.map((opp, i) => (
            <OpportunityRow key={`${opp.svcId}-${i}`} opp={opp} />
          ))}
        </div>
      )}

      {/* Footer note */}
      {!loading && !error && items.length > 0 && (
        <p
          style={{
            fontFamily: "var(--font-geist-mono), monospace",
            fontSize: 10,
            color: "var(--b-paper-40)",
            letterSpacing: "0.08em",
            marginTop: 14,
            textAlign: "right",
          }}
        >
          ✦ Updated every 5 min · Powered by AI
        </p>
      )}
    </div>
  );
}

/* ── Opportunity row ─────────────────────────────────── */

function OpportunityRow({ opp }: { opp: Opportunity }) {
  const [hovered, setHovered] = useState(false);

  return (
    <Link
      href="/pools/create"
      style={{
        display: "flex",
        alignItems: "center",
        gap: 14,
        padding: "14px 16px",
        textDecoration: "none",
        borderBottom: "1px solid var(--b-rule)",
        background: hovered ? "var(--b-paper-08)" : "transparent",
        cursor: "pointer",
        transition: "background 0.12s",
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Service mark */}
      <ServiceMark id={opp.svcId} size={32} radius={0} />

      {/* Name + insight */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <p
          style={{
            fontFamily: "var(--font-geist), sans-serif",
            fontSize: 14,
            fontWeight: 600,
            color: "var(--b-paper)",
            marginBottom: 2,
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
        >
          {opp.service}
        </p>
        <p
          style={{
            fontFamily: "var(--font-geist), sans-serif",
            fontSize: 11,
            color: "var(--b-paper-40)",
            lineHeight: 1.4,
            overflow: "hidden",
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical",
          }}
        >
          {opp.insight}
        </p>
      </div>

      {/* Demand badge */}
      <DemandBadge level={opp.demand} />

      {/* Weekly searches */}
      <div style={{ textAlign: "right", minWidth: 64 }}>
        <p
          className="b-eyebrow"
          style={{ marginBottom: 2 }}
        >
          Weekly
        </p>
        <p
          style={{
            fontFamily: "var(--font-geist-mono), monospace",
            fontSize: 12,
            color: "var(--b-paper-60)",
          }}
        >
          {opp.weeklySearches.toLocaleString()}
        </p>
      </div>

      {/* Suggested price */}
      <p
        className="b-serif"
        style={{
          fontSize: 20,
          color: "var(--b-paper)",
          minWidth: 64,
          textAlign: "right",
        }}
      >
        ${opp.suggestedPrice.toFixed(2)}
      </p>

      {/* CTA */}
      <p
        style={{
          fontFamily: "var(--font-geist-mono), monospace",
          fontSize: 11,
          color: "var(--b-gold)",
          letterSpacing: "0.14em",
          textTransform: "uppercase",
          whiteSpace: "nowrap",
          minWidth: 72,
          textAlign: "right",
        }}
      >
        Create →
      </p>
    </Link>
  );
}

/* ── Demand badge ─────────────────────────────────────── */

function DemandBadge({ level }: { level: "HIGH" | "MEDIUM" | "LOW" }) {
  const isHigh = level === "HIGH";
  return (
    <span
      style={{
        fontFamily: "var(--font-geist-mono), monospace",
        fontSize: 9.5,
        letterSpacing: "0.16em",
        textTransform: "uppercase",
        padding: "3px 8px",
        border: `1px solid ${isHigh ? "rgba(201,162,79,0.4)" : "var(--b-rule)"}`,
        color: isHigh ? "var(--b-gold)" : "var(--b-paper-40)",
        background: isHigh ? "rgba(201,162,79,0.08)" : "transparent",
        whiteSpace: "nowrap",
      }}
    >
      {level}
    </span>
  );
}

/* ── Skeleton row ─────────────────────────────────────── */

function SkeletonRow() {
  return (
    <div
      style={{
        height: 80,
        background: "var(--b-ink-3)",
        borderBottom: "1px solid var(--b-rule)",
        animation: "pulse 1.6s ease-in-out infinite",
      }}
    />
  );
}

// Inject pulse keyframes once into head (SSR-safe, idempotent)
if (typeof document !== "undefined") {
  const id = "__poolly-pulse";
  if (!document.getElementById(id)) {
    const style = document.createElement("style");
    style.id = id;
    style.textContent = `
      @keyframes pulse {
        0%, 100% { opacity: 1; }
        50% { opacity: 0.4; }
      }
    `;
    document.head.appendChild(style);
  }
}
