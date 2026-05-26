"use client";

import { useState } from "react";
import type { VerifyResult } from "@/app/api/verify-proof/route";

type Props = {
  poolTitle: string;
  category: number;
  onConfirmed: (uri: string) => void;
  submitting: boolean;
};

type Phase = "idle" | "verifying" | "done";

export function ProofVerifier({ poolTitle, category, onConfirmed, submitting }: Props) {
  const [uri, setUri] = useState("");
  const [phase, setPhase] = useState<Phase>("idle");
  const [result, setResult] = useState<VerifyResult | null>(null);
  const [verifyError, setVerifyError] = useState("");

  async function verify() {
    if (!uri.trim()) return;
    setPhase("verifying");
    setResult(null);
    setVerifyError("");

    try {
      const res = await fetch("/api/verify-proof", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ proofUrl: uri.trim(), poolTitle, category }),
      });
      if (!res.ok) {
        const j = await res.json();
        setVerifyError(j.error ?? "Verification failed");
        setPhase("idle");
        return;
      }
      const data: VerifyResult = await res.json();
      setResult(data);
      setPhase("done");
    } catch {
      setVerifyError("Could not reach verification service.");
      setPhase("idle");
    }
  }

  const confidenceColor =
    !result ? "var(--b-paper-40)"
    : result.confidence >= 75 ? "var(--b-emerald)"
    : result.confidence >= 45 ? "var(--b-gold)"
    : "var(--b-rust)";

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      {/* URL input row */}
      <div style={{ display: "flex", gap: 8 }}>
        <input
          type="url"
          placeholder="https://drive.google.com/…  (screenshot URL)"
          value={uri}
          onChange={(e) => { setUri(e.target.value); setPhase("idle"); setResult(null); }}
          disabled={phase === "verifying"}
          style={{
            flex: 1,
            background: "var(--b-ink-2)",
            border: "1px solid var(--b-rule)",
            color: "var(--b-paper)",
            fontFamily: "var(--font-geist), sans-serif",
            fontSize: 13,
            padding: "9px 12px",
            outline: "none",
          }}
        />
        <button
          onClick={verify}
          disabled={!uri.trim() || phase === "verifying"}
          style={{
            padding: "9px 16px",
            background: uri.trim() && phase !== "verifying" ? "var(--b-gold)" : "transparent",
            border: `1px solid ${uri.trim() && phase !== "verifying" ? "var(--b-gold)" : "var(--b-rule)"}`,
            color: uri.trim() && phase !== "verifying" ? "var(--b-ink)" : "var(--b-paper-40)",
            fontFamily: "var(--font-geist-mono), monospace",
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: "0.14em",
            textTransform: "uppercase",
            cursor: uri.trim() && phase !== "verifying" ? "pointer" : "not-allowed",
            whiteSpace: "nowrap",
            flexShrink: 0,
            opacity: phase === "verifying" ? 0.6 : 1,
            transition: "all 0.15s",
          }}
        >
          {phase === "verifying" ? "Verifying…" : "AI Verify"}
        </button>
      </div>

      {verifyError && (
        <p
          style={{
            fontFamily: "var(--font-geist-mono), monospace",
            fontSize: 11,
            color: "var(--b-rust)",
            letterSpacing: "0.06em",
            padding: "8px 12px",
            border: "1px solid rgba(181,86,62,0.3)",
            background: "rgba(181,86,62,0.06)",
          }}
        >
          {verifyError}
        </p>
      )}

      {/* AI result card */}
      {result && (
        <div
          style={{
            border: `1px solid ${result.verified ? "rgba(92,135,112,0.4)" : "rgba(181,86,62,0.4)"}`,
            background: result.verified ? "rgba(92,135,112,0.06)" : "rgba(181,86,62,0.06)",
            padding: "16px",
            display: "flex",
            flexDirection: "column",
            gap: 12,
          }}
        >
          {/* Header */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{ fontSize: 16 }}>{result.verified ? "✅" : "⚠️"}</span>
              <p
                style={{
                  fontFamily: "var(--font-geist-mono), monospace",
                  fontSize: 11,
                  fontWeight: 700,
                  letterSpacing: "0.14em",
                  textTransform: "uppercase",
                  color: result.verified ? "var(--b-emerald)" : "var(--b-rust)",
                }}
              >
                {result.verified ? "PROOF VERIFIED" : "VERIFICATION FAILED"}
              </p>
            </div>
            {/* Confidence bar */}
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div
                style={{
                  width: 56,
                  height: 4,
                  background: "var(--b-paper-08)",
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    height: "100%",
                    width: `${result.confidence}%`,
                    background: confidenceColor,
                    transition: "width 0.5s ease",
                  }}
                />
              </div>
              <p
                style={{
                  fontFamily: "var(--font-geist-mono), monospace",
                  fontSize: 10,
                  fontWeight: 700,
                  color: confidenceColor,
                  letterSpacing: "0.08em",
                }}
              >
                {result.confidence}%
              </p>
            </div>
          </div>

          <p style={{ fontFamily: "var(--font-geist), sans-serif", fontSize: 12, color: "var(--b-paper-60)", lineHeight: 1.55 }}>
            {result.explanation}
          </p>

          {result.issues.length > 0 && (
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              {result.issues.map((issue, i) => (
                <p
                  key={i}
                  style={{
                    fontFamily: "var(--font-geist), sans-serif",
                    fontSize: 11,
                    color: "var(--b-rust)",
                    lineHeight: 1.4,
                  }}
                >
                  · {issue}
                </p>
              ))}
            </div>
          )}

          {result.suggestions.length > 0 && (
            <div
              style={{
                padding: "10px 12px",
                border: "1px solid var(--b-rule)",
                background: "var(--b-ink-3)",
                display: "flex",
                flexDirection: "column",
                gap: 4,
              }}
            >
              <p className="b-eyebrow" style={{ fontSize: 9, marginBottom: 4 }}>
                Better proof would include
              </p>
              {result.suggestions.map((s, i) => (
                <p key={i} style={{ fontFamily: "var(--font-geist), sans-serif", fontSize: 11, color: "var(--b-paper-40)" }}>
                  → {s}
                </p>
              ))}
            </div>
          )}

          {/* Action buttons */}
          <div style={{ display: "flex", gap: 8, paddingTop: 4 }}>
            {result.verified ? (
              <button
                onClick={() => onConfirmed(uri.trim())}
                disabled={submitting}
                style={{
                  flex: 1,
                  background: "var(--b-emerald)",
                  border: "none",
                  color: "white",
                  padding: "11px 16px",
                  fontFamily: "var(--font-geist-mono), monospace",
                  fontSize: 11,
                  fontWeight: 700,
                  letterSpacing: "0.14em",
                  textTransform: "uppercase",
                  cursor: submitting ? "wait" : "pointer",
                  opacity: submitting ? 0.5 : 1,
                  transition: "opacity 0.15s",
                }}
              >
                {submitting ? "SUBMITTING ON-CHAIN…" : "SUBMIT PROOF ON-CHAIN ✓"}
              </button>
            ) : (
              <>
                <button
                  onClick={() => { setPhase("idle"); setResult(null); setUri(""); }}
                  style={{
                    flex: 1,
                    background: "transparent",
                    border: "1px solid var(--b-rule)",
                    color: "var(--b-paper-60)",
                    padding: "9px 12px",
                    fontFamily: "var(--font-geist-mono), monospace",
                    fontSize: 11,
                    letterSpacing: "0.12em",
                    textTransform: "uppercase",
                    cursor: "pointer",
                  }}
                >
                  TRY AGAIN
                </button>
                <button
                  onClick={() => onConfirmed(uri.trim())}
                  disabled={submitting}
                  title="Submit anyway, overriding AI verdict"
                  style={{
                    padding: "9px 14px",
                    background: "transparent",
                    border: "1px solid var(--b-rule)",
                    color: "var(--b-paper-40)",
                    fontFamily: "var(--font-geist-mono), monospace",
                    fontSize: 10,
                    letterSpacing: "0.10em",
                    textTransform: "uppercase",
                    cursor: submitting ? "wait" : "pointer",
                    opacity: submitting ? 0.5 : 1,
                  }}
                >
                  {submitting ? "SUBMITTING…" : "OVERRIDE →"}
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {phase === "idle" && !result && (
        <p
          style={{
            fontFamily: "var(--font-geist-mono), monospace",
            fontSize: 10,
            color: "var(--b-paper-40)",
            letterSpacing: "0.08em",
          }}
        >
          Paste a screenshot URL — AI will verify before on-chain submission.
        </p>
      )}
    </div>
  );
}
