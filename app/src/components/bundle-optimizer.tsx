"use client";

import { useState } from "react";
import Link from "next/link";
import { ServiceMark } from "@/components/vault-ui";

/* ── Static service catalogue ─────────────────────────── */

const SERVICES = [
  { id: "netflix",  svcId: "netflix",  label: "Netflix" },
  { id: "spotify",  svcId: "spotify",  label: "Spotify" },
  { id: "ms365",    svcId: "ms365",    label: "Microsoft 365" },
  { id: "adobe",    svcId: "adobe",    label: "Adobe CC" },
  { id: "icloud",   svcId: "icloud",   label: "iCloud+" },
  { id: "nordvpn",  svcId: "chatgpt",  label: "NordVPN" },
  { id: "notion",   svcId: "notion",   label: "Notion" },
  { id: "peloton",  svcId: "peloton",  label: "Peloton" },
  { id: "chatgpt",  svcId: "chatgpt",  label: "ChatGPT Plus" },
];

/* ── API response types ───────────────────────────────── */

type BundleItem = {
  svcId: string;
  service: string;
  retailPrice: number;
  poollyPrice: number;
  annualSaving: number;
};

type BundleResult = {
  recommendation: string;
  bundles: BundleItem[];
  totalMonthly: number;
  totalAnnualSaving: number;
};

/* ── Component ────────────────────────────────────────── */

export function BundleOptimizer() {
  const [budget, setBudget] = useState(30);
  const [services, setServices] = useState<string[]>([]);
  const [result, setResult] = useState<BundleResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dotCount, setDotCount] = useState(1);

  function toggleService(id: string) {
    setServices((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]
    );
  }

  async function handleOptimize() {
    setLoading(true);
    setResult(null);
    setError(null);

    // Animate dots
    const dotInterval = setInterval(() => {
      setDotCount((c) => (c % 3) + 1);
    }, 400);

    try {
      const res = await fetch("/api/bundle-optimize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ budget, services }),
      });
      if (!res.ok) throw new Error(`Error ${res.status}`);
      const data: BundleResult = await res.json();
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to build bundle plan.");
    } finally {
      clearInterval(dotInterval);
      setLoading(false);
    }
  }

  return (
    <div
      style={{
        width: "100%",
        background: "var(--b-ink-2)",
        border: "1px solid rgba(201,162,79,0.28)",
        padding: "32px 28px",
        display: "flex",
        flexDirection: "column",
        gap: 28,
      }}
    >
      {/* Header */}
      <div>
        <p className="b-eyebrow" style={{ marginBottom: 10 }}>
          AI Bundle Optimizer
        </p>
        <p
          className="b-serif"
          style={{
            fontSize: 32,
            lineHeight: 1.1,
            color: "var(--b-paper)",
          }}
        >
          What's your monthly budget?
        </p>
      </div>

      {/* Budget input */}
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
          <p
            className="b-serif"
            style={{
              fontSize: 52,
              lineHeight: 1,
              color: "var(--b-gold)",
            }}
          >
            ${budget}
          </p>
          <span
            style={{
              fontFamily: "var(--font-geist-mono), monospace",
              fontSize: 11,
              color: "var(--b-paper-40)",
              letterSpacing: "0.14em",
              textTransform: "uppercase",
              marginBottom: 6,
            }}
          >
            / mo · USDC
          </span>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <input
            type="range"
            min={5}
            max={300}
            step={5}
            value={budget}
            onChange={(e) => setBudget(Number(e.target.value))}
            style={{
              flex: 1,
              accentColor: "var(--b-gold)",
              cursor: "pointer",
              height: 2,
            }}
          />
          <input
            type="number"
            min={5}
            max={300}
            step={5}
            value={budget}
            onChange={(e) => setBudget(Math.max(5, Math.min(300, Number(e.target.value))))}
            style={{
              width: 72,
              background: "var(--b-ink-3)",
              border: "1px solid var(--b-rule)",
              color: "var(--b-paper)",
              fontFamily: "var(--font-geist-mono), monospace",
              fontSize: 13,
              padding: "5px 8px",
              textAlign: "right",
              outline: "none",
            }}
          />
        </div>
      </div>

      {/* Services chips */}
      <div>
        <p
          style={{
            fontFamily: "var(--font-geist), sans-serif",
            fontSize: 12,
            color: "var(--b-paper-60)",
            marginBottom: 12,
          }}
        >
          Currently paying for{" "}
          <span style={{ color: "var(--b-paper-40)" }}>(optional):</span>
        </p>
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: 8,
          }}
        >
          {SERVICES.map((svc) => {
            const active = services.includes(svc.id);
            return (
              <button
                key={svc.id}
                onClick={() => toggleService(svc.id)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  padding: "5px 12px 5px 8px",
                  background: active ? "var(--b-gold)" : "transparent",
                  border: `1px solid ${active ? "var(--b-gold)" : "var(--b-rule)"}`,
                  color: active ? "var(--b-ink)" : "var(--b-paper-60)",
                  fontFamily: "var(--font-geist), sans-serif",
                  fontSize: 12,
                  cursor: "pointer",
                  transition: "all 0.12s",
                }}
              >
                <ServiceMark id={svc.svcId} size={18} />
                {svc.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Optimize button */}
      <button
        onClick={handleOptimize}
        disabled={loading}
        style={{
          alignSelf: "flex-start",
          padding: "11px 26px",
          background: loading ? "transparent" : "var(--b-gold)",
          border: `1px solid ${loading ? "var(--b-rule)" : "var(--b-gold)"}`,
          color: loading ? "var(--b-paper-40)" : "var(--b-ink)",
          fontFamily: "var(--font-geist-mono), monospace",
          fontSize: 12,
          letterSpacing: "0.18em",
          textTransform: "uppercase",
          cursor: loading ? "not-allowed" : "pointer",
          transition: "all 0.15s",
        }}
      >
        {loading ? `AI is building your optimal plan${".".repeat(dotCount)}` : "Optimize →"}
      </button>

      {/* Error */}
      {error && (
        <div
          style={{
            border: "1px solid var(--b-rust)",
            padding: "12px 16px",
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
      {result && <ResultPanel result={result} />}
    </div>
  );
}

/* ── Result panel ─────────────────────────────────────── */

function ResultPanel({ result }: { result: BundleResult }) {
  return (
    <div
      style={{
        borderTop: "1px solid var(--b-rule)",
        paddingTop: 24,
        display: "flex",
        flexDirection: "column",
        gap: 20,
      }}
    >
      {/* Recommendation */}
      <p
        className="b-serif"
        style={{
          fontSize: 18,
          fontStyle: "italic",
          color: "var(--b-paper-60)",
          lineHeight: 1.6,
        }}
      >
        {result.recommendation}
      </p>

      {/* Bundle table */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 0,
          border: "1px solid var(--b-rule)",
        }}
      >
        {result.bundles.map((item, i) => (
          <BundleRow key={i} item={item} />
        ))}
      </div>

      {/* Total summary */}
      <div
        style={{
          display: "flex",
          alignItems: "baseline",
          justifyContent: "space-between",
          padding: "16px 20px",
          background: "var(--b-ink-3)",
          border: "1px solid rgba(201,162,79,0.28)",
          flexWrap: "wrap",
          gap: 12,
        }}
      >
        <div>
          <p className="b-eyebrow" style={{ marginBottom: 4 }}>
            Total
          </p>
          <p
            className="b-serif"
            style={{
              fontSize: 36,
              color: "var(--b-gold)",
              lineHeight: 1,
            }}
          >
            ${result.totalMonthly.toFixed(2)}
            <span
              style={{
                fontFamily: "var(--font-geist-mono), monospace",
                fontSize: 12,
                color: "var(--b-paper-40)",
                letterSpacing: "0.1em",
                marginLeft: 6,
              }}
            >
              / mo
            </span>
          </p>
        </div>
        <div style={{ textAlign: "right" }}>
          <p className="b-eyebrow" style={{ marginBottom: 4 }}>
            Annual Saving
          </p>
          <p
            className="b-serif"
            style={{
              fontSize: 28,
              color: "var(--b-emerald)",
              lineHeight: 1,
            }}
          >
            ${result.totalAnnualSaving.toFixed(0)} saved
          </p>
        </div>
      </div>

      {/* Browse pools CTA */}
      <Link
        href="/pools"
        style={{
          alignSelf: "flex-start",
          display: "inline-flex",
          alignItems: "center",
          gap: 6,
          padding: "10px 22px",
          background: "var(--b-gold)",
          color: "var(--b-ink)",
          fontFamily: "var(--font-geist-mono), monospace",
          fontSize: 11,
          letterSpacing: "0.18em",
          textTransform: "uppercase",
          textDecoration: "none",
        }}
      >
        Browse Pools →
      </Link>
    </div>
  );
}

/* ── Bundle row ───────────────────────────────────────── */

function BundleRow({ item }: { item: BundleItem }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 14,
        padding: "12px 16px",
        borderBottom: "1px solid var(--b-rule)",
      }}
    >
      {/* Service mark */}
      <ServiceMark id={item.svcId} size={32} radius={0} />

      {/* Service name */}
      <p
        style={{
          flex: 1,
          fontFamily: "var(--font-geist), sans-serif",
          fontSize: 13,
          fontWeight: 500,
          color: "var(--b-paper)",
        }}
      >
        {item.service}
      </p>

      {/* Retail price (strikethrough) */}
      <p
        style={{
          fontFamily: "var(--font-geist-mono), monospace",
          fontSize: 12,
          color: "var(--b-paper-40)",
          textDecoration: "line-through",
          letterSpacing: "0.04em",
        }}
      >
        ${item.retailPrice.toFixed(2)}
      </p>

      {/* Poolly price */}
      <p
        className="b-serif"
        style={{
          fontSize: 20,
          color: "var(--b-gold)",
          minWidth: 56,
          textAlign: "right",
        }}
      >
        ${item.poollyPrice.toFixed(2)}
      </p>

      {/* Annual saving */}
      <p
        style={{
          fontFamily: "var(--font-geist-mono), monospace",
          fontSize: 10,
          color: "var(--b-emerald)",
          letterSpacing: "0.1em",
          minWidth: 72,
          textAlign: "right",
        }}
      >
        SAVE ${item.annualSaving.toFixed(0)}/yr
      </p>
    </div>
  );
}
