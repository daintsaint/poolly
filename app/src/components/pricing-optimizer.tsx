"use client";

import { useState } from "react";

type Props = {
  category: number;
  title: string;
  maxSlots: number;
  cycleDays: number;
  onApply: (price: number) => void;
};

type PriceResult = {
  suggestedPrice: number;
  priceRange: [number, number];
  fillEstimate: number;
  competitorAvg: number;
  reasoning: string;
};

export function PricingOptimizer({ category, title, maxSlots, cycleDays, onApply }: Props) {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<PriceResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const canRun = Boolean(title.trim());

  async function handleGetPrice() {
    if (!canRun) return;
    setLoading(true);
    setResult(null);
    setError(null);
    try {
      const res = await fetch("/api/price-optimizer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ category, title, maxSlots, cycleDays }),
      });
      if (!res.ok) throw new Error(`Error ${res.status}`);
      const data: PriceResult = await res.json();
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch price suggestion.");
    } finally {
      setLoading(false);
    }
  }

  function handleApply() {
    if (!result) return;
    onApply(result.suggestedPrice);
    setResult(null);
  }

  return (
    <div
      style={{
        border: "1px solid var(--b-rule)",
        background: "var(--b-ink-3)",
        padding: "14px 16px",
        display: "flex",
        flexDirection: "column",
        gap: 12,
      }}
    >
      {/* Trigger button row */}
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <button
          onClick={handleGetPrice}
          disabled={loading || !canRun}
          title={!canRun ? "Enter a title first" : undefined}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            padding: "7px 14px",
            background: canRun && !loading ? "var(--b-gold)" : "transparent",
            border: `1px solid ${canRun && !loading ? "var(--b-gold)" : "var(--b-rule)"}`,
            color: canRun && !loading ? "var(--b-ink)" : "var(--b-paper-40)",
            fontFamily: "var(--font-geist-mono), monospace",
            fontSize: 11,
            letterSpacing: "0.14em",
            textTransform: "uppercase",
            cursor: canRun && !loading ? "pointer" : "not-allowed",
            opacity: loading ? 0.7 : 1,
            transition: "opacity 0.15s",
          }}
        >
          {loading ? "Analysing market…" : "✦ Get AI Price"}
        </button>

        {!canRun && (
          <span
            style={{
              fontFamily: "var(--font-geist-mono), monospace",
              fontSize: 10,
              color: "var(--b-paper-40)",
              letterSpacing: "0.08em",
            }}
          >
            Enter a title first
          </span>
        )}
      </div>

      {/* Error state */}
      {error && (
        <div
          style={{
            border: "1px solid var(--b-rust)",
            padding: "10px 12px",
            color: "var(--b-rust)",
            fontFamily: "var(--font-geist-mono), monospace",
            fontSize: 11,
            letterSpacing: "0.06em",
          }}
        >
          {error}
        </div>
      )}

      {/* Result panel */}
      {result && (
        <div
          style={{
            border: "1px solid rgba(201,162,79,0.35)",
            background: "var(--b-ink-2)",
            padding: "14px 16px",
            display: "flex",
            flexDirection: "column",
            gap: 10,
          }}
        >
          {/* Suggested price headline */}
          <div>
            <p
              style={{
                fontFamily: "var(--font-geist-mono), monospace",
                fontSize: 9.5,
                color: "var(--b-gold)",
                letterSpacing: "0.18em",
                textTransform: "uppercase",
                marginBottom: 4,
              }}
            >
              Suggested
            </p>
            <p
              className="b-serif"
              style={{
                fontSize: 40,
                lineHeight: 1,
                color: "var(--b-gold)",
              }}
            >
              ${result.suggestedPrice.toFixed(2)}
            </p>
          </div>

          {/* Stats row */}
          <div
            style={{
              display: "flex",
              gap: 20,
              flexWrap: "wrap",
            }}
          >
            <Stat label="Range" value={`$${result.priceRange[0].toFixed(2)} – $${result.priceRange[1].toFixed(2)}`} />
            <Stat label="Est. Fill Rate" value={`${result.fillEstimate}%`} />
            <Stat label="Market Avg" value={`$${result.competitorAvg.toFixed(2)}`} />
          </div>

          {/* Reasoning */}
          <p
            style={{
              fontFamily: "var(--font-geist), sans-serif",
              fontSize: 12,
              fontStyle: "italic",
              color: "var(--b-paper-60)",
              lineHeight: 1.55,
              borderTop: "1px solid var(--b-rule)",
              paddingTop: 10,
            }}
          >
            {result.reasoning}
          </p>

          {/* Apply button */}
          <button
            onClick={handleApply}
            style={{
              alignSelf: "flex-start",
              padding: "8px 18px",
              background: "var(--b-gold)",
              border: "none",
              color: "var(--b-ink)",
              fontFamily: "var(--font-geist-mono), monospace",
              fontSize: 11,
              letterSpacing: "0.16em",
              textTransform: "uppercase",
              cursor: "pointer",
            }}
          >
            Apply →
          </button>
        </div>
      )}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p
        className="b-eyebrow"
        style={{ marginBottom: 2 }}
      >
        {label}
      </p>
      <p
        style={{
          fontFamily: "var(--font-geist-mono), monospace",
          fontSize: 12,
          color: "var(--b-paper-60)",
          letterSpacing: "0.06em",
        }}
      >
        {value}
      </p>
    </div>
  );
}
