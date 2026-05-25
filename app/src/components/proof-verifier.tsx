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
    !result ? "#94a3b8"
    : result.confidence >= 75 ? "#34d399"
    : result.confidence >= 45 ? "#fbbf24"
    : "#f87171";

  return (
    <div className="space-y-3">
      {/* URL input */}
      <div className="flex gap-2">
        <input
          type="url"
          placeholder="https://drive.google.com/…  (screenshot URL)"
          value={uri}
          onChange={(e) => { setUri(e.target.value); setPhase("idle"); setResult(null); }}
          className="input-field flex-1"
          disabled={phase === "verifying"}
        />
        <button
          onClick={verify}
          disabled={!uri.trim() || phase === "verifying"}
          className="btn-ghost px-4 py-2 text-sm shrink-0 disabled:opacity-40 disabled:cursor-not-allowed"
          style={{ borderRadius: "12px" }}
        >
          {phase === "verifying" ? (
            <span className="flex items-center gap-1.5">
              <svg className="animate-spin" width="12" height="12" viewBox="0 0 12 12" fill="none">
                <circle cx="6" cy="6" r="4.5" stroke="currentColor" strokeWidth="1.5" strokeDasharray="7 7" strokeLinecap="round"/>
              </svg>
              Verifying…
            </span>
          ) : "AI Verify"}
        </button>
      </div>

      {verifyError && (
        <p className="text-xs px-1" style={{ color: "#f87171" }}>{verifyError}</p>
      )}

      {/* AI result card */}
      {result && (
        <div className="rounded-2xl p-4 space-y-3"
          style={{
            background: result.verified ? "rgba(16,185,129,0.06)" : "rgba(239,68,68,0.06)",
            border: `1px solid ${result.verified ? "rgba(16,185,129,0.2)" : "rgba(239,68,68,0.2)"}`,
          }}>

          {/* Header row */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span style={{ fontSize: "18px" }}>{result.verified ? "✅" : "⚠️"}</span>
              <span className="font-bold text-sm text-white">
                {result.verified ? "Proof Verified" : "Verification Failed"}
              </span>
            </div>
            {/* Confidence meter */}
            <div className="flex items-center gap-2">
              <div style={{ width: 60, height: 6, background: "rgba(255,255,255,0.06)", borderRadius: 999, overflow: "hidden" }}>
                <div style={{ height: "100%", width: `${result.confidence}%`, background: confidenceColor, borderRadius: 999, transition: "width 0.5s ease" }}/>
              </div>
              <span className="text-xs font-bold" style={{ color: confidenceColor }}>{result.confidence}%</span>
            </div>
          </div>

          <p className="text-sm leading-relaxed" style={{ color: "var(--text-2)" }}>{result.explanation}</p>

          {result.issues.length > 0 && (
            <div className="space-y-1">
              {result.issues.map((issue, i) => (
                <div key={i} className="flex items-start gap-2 text-xs" style={{ color: "#f87171" }}>
                  <span className="mt-0.5 shrink-0">•</span>
                  <span>{issue}</span>
                </div>
              ))}
            </div>
          )}

          {result.suggestions.length > 0 && (
            <div className="rounded-xl p-3 space-y-1"
              style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
              <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--text-3)" }}>Better proof would include</p>
              {result.suggestions.map((s, i) => (
                <p key={i} className="text-xs" style={{ color: "var(--text-2)" }}>→ {s}</p>
              ))}
            </div>
          )}

          {/* Submit anyway or proceed */}
          <div className="flex gap-2 pt-1">
            {result.verified ? (
              <button
                onClick={() => onConfirmed(uri.trim())}
                disabled={submitting}
                className="btn-primary flex-1 py-2.5 text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? "Submitting on-chain…" : "Submit Proof On-Chain ✓"}
              </button>
            ) : (
              <>
                <button
                  onClick={() => { setPhase("idle"); setResult(null); setUri(""); }}
                  className="btn-ghost flex-1 py-2 text-sm"
                  style={{ borderRadius: "12px" }}
                >
                  Try different proof
                </button>
                <button
                  onClick={() => onConfirmed(uri.trim())}
                  disabled={submitting}
                  className="px-4 py-2 text-xs text-slate-400 disabled:opacity-50"
                  style={{ borderRadius: "12px", border: "1px solid rgba(255,255,255,0.06)" }}
                  title="Submit anyway, overriding AI verdict"
                >
                  {submitting ? "Submitting…" : "Override & submit"}
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {/* Pre-verify hint */}
      {phase === "idle" && !result && (
        <p className="text-xs" style={{ color: "var(--text-3)" }}>
          Paste a screenshot URL — AI will verify it before on-chain submission.
        </p>
      )}
    </div>
  );
}
