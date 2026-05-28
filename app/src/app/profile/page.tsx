"use client";

import { useState, useEffect } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { BNav, BTicker, BFooter } from "@/components/vault-ui";
import { useDisplayName, saveDisplayName, shortWallet } from "@/lib/use-display-name";
import Link from "next/link";

export default function ProfilePage() {
  const { publicKey } = useWallet();
  const wallet = publicKey?.toBase58() ?? null;
  const currentName = useDisplayName(wallet);

  const [input, setInput] = useState("");
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");

  /* Pre-fill input once the current name loads */
  useEffect(() => {
    if (currentName) setInput(currentName);
  }, [currentName]);

  async function handleSave() {
    if (!wallet || !input.trim()) return;
    setStatus("saving");
    try {
      await saveDisplayName(wallet, input.trim());
      setStatus("saved");
      setTimeout(() => setStatus("idle"), 2500);
    } catch {
      setStatus("error");
      setTimeout(() => setStatus("idle"), 2500);
    }
  }

  const remaining = 32 - input.length;

  return (
    <div style={{ background: "var(--b-ink)", minHeight: "100vh" }}>
      <BNav />
      <BTicker />

      <div className="page-x" style={{ maxWidth: 680, margin: "0 auto", padding: "72px 0 120px" }}>

        {/* Eyebrow + title */}
        <p className="b-eyebrow" style={{ marginBottom: 16 }}>ACCOUNT · PROFILE</p>
        <h1
          className="b-serif"
          style={{ fontSize: "clamp(40px, 5vw, 64px)", lineHeight: 1.0, color: "var(--b-paper)", marginBottom: 48 }}
        >
          Your{" "}
          <em style={{ color: "var(--b-gold)", fontStyle: "italic" }}>identity.</em>
        </h1>

        {/* Not connected */}
        {!publicKey && (
          <div
            style={{
              border: "1px solid var(--b-rule)",
              padding: "48px 40px",
              textAlign: "center",
            }}
          >
            <p className="b-serif" style={{ fontSize: 24, color: "var(--b-paper-60)", marginBottom: 16 }}>
              Connect your wallet to manage your profile.
            </p>
            <p className="b-eyebrow">USE THE CONNECT WALLET BUTTON IN THE TOP RIGHT</p>
          </div>
        )}

        {/* Connected */}
        {publicKey && (
          <div style={{ display: "flex", flexDirection: "column", gap: 1 }}>

            {/* Wallet address — read only */}
            <div
              style={{
                background: "var(--b-ink-3)",
                border: "1px solid var(--b-rule)",
                padding: "24px 28px",
              }}
            >
              <p
                style={{
                  fontFamily: "var(--font-geist-mono), monospace",
                  fontSize: 9.5,
                  color: "var(--b-paper-40)",
                  letterSpacing: "0.18em",
                  textTransform: "uppercase",
                  marginBottom: 10,
                }}
              >
                WALLET ADDRESS
              </p>
              <p
                style={{
                  fontFamily: "var(--font-geist-mono), monospace",
                  fontSize: 13,
                  color: "var(--b-paper-60)",
                  wordBreak: "break-all",
                  lineHeight: 1.5,
                }}
              >
                {publicKey.toBase58()}
              </p>
            </div>

            {/* Display name */}
            <div
              style={{
                background: "var(--b-ink-3)",
                border: "1px solid var(--b-rule)",
                padding: "24px 28px",
              }}
            >
              <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 10 }}>
                <p
                  style={{
                    fontFamily: "var(--font-geist-mono), monospace",
                    fontSize: 9.5,
                    color: "var(--b-paper-40)",
                    letterSpacing: "0.18em",
                    textTransform: "uppercase",
                  }}
                >
                  DISPLAY NAME
                </p>
                <p
                  style={{
                    fontFamily: "var(--font-geist-mono), monospace",
                    fontSize: 9.5,
                    color: remaining < 8 ? "var(--b-rust)" : "var(--b-paper-40)",
                    letterSpacing: "0.1em",
                  }}
                >
                  {remaining} LEFT
                </p>
              </div>

              <input
                type="text"
                value={input}
                maxLength={32}
                placeholder={shortWallet(publicKey.toBase58())}
                onChange={(e) => { setInput(e.target.value); setStatus("idle"); }}
                onKeyDown={(e) => { if (e.key === "Enter") handleSave(); }}
                style={{
                  width: "100%",
                  background: "var(--b-ink)",
                  border: "1px solid var(--b-rule)",
                  color: "var(--b-paper)",
                  fontFamily: "var(--font-geist), sans-serif",
                  fontSize: 16,
                  padding: "12px 14px",
                  outline: "none",
                  boxSizing: "border-box",
                  marginBottom: 16,
                  transition: "border-color 0.15s",
                }}
                onFocus={(e) => { e.target.style.borderColor = "rgba(201,162,79,0.5)"; }}
                onBlur={(e) => { e.target.style.borderColor = "var(--b-rule)"; }}
              />

              <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                <button
                  onClick={handleSave}
                  disabled={status === "saving" || !input.trim() || input.trim() === currentName}
                  style={{
                    background: status === "saved" ? "var(--b-emerald)" : "var(--b-gold)",
                    color: "var(--b-ink)",
                    border: "none",
                    padding: "11px 28px",
                    fontFamily: "var(--font-geist-mono), monospace",
                    fontSize: 11,
                    fontWeight: 700,
                    letterSpacing: "0.16em",
                    textTransform: "uppercase",
                    cursor: status === "saving" ? "wait" : "pointer",
                    opacity: (!input.trim() || input.trim() === currentName) && status === "idle" ? 0.45 : 1,
                    transition: "background 0.2s, opacity 0.2s",
                  }}
                >
                  {status === "saving" ? "SAVING…" : status === "saved" ? "SAVED ✓" : status === "error" ? "ERROR — TRY AGAIN" : "SAVE NAME"}
                </button>

                {currentName && (
                  <p
                    style={{
                      fontFamily: "var(--font-geist-mono), monospace",
                      fontSize: 10.5,
                      color: "var(--b-paper-40)",
                      letterSpacing: "0.08em",
                    }}
                  >
                    Currently: <span style={{ color: "var(--b-paper-60)" }}>{currentName}</span>
                  </p>
                )}
              </div>

              <p
                style={{
                  fontFamily: "var(--font-geist-mono), monospace",
                  fontSize: 9.5,
                  color: "var(--b-paper-40)",
                  letterSpacing: "0.1em",
                  marginTop: 16,
                  borderTop: "1px dashed var(--b-rule)",
                  paddingTop: 14,
                }}
              >
                SHOWN TO OTHER MEMBERS IN POOLS · MAX 32 CHARACTERS
              </p>
            </div>

            {/* Quick links */}
            <div
              style={{
                background: "var(--b-ink-3)",
                border: "1px solid var(--b-rule)",
                padding: "20px 28px",
                display: "flex",
                gap: 32,
              }}
            >
              {[
                { label: "HOST DASHBOARD", href: "/dashboard/host" },
                { label: "MEMBER DASHBOARD", href: "/dashboard/member" },
                { label: "BROWSE CATALOG", href: "/pools" },
              ].map((l) => (
                <Link
                  key={l.href}
                  href={l.href}
                  style={{
                    fontFamily: "var(--font-geist-mono), monospace",
                    fontSize: 10.5,
                    color: "var(--b-gold)",
                    letterSpacing: "0.12em",
                    textDecoration: "none",
                    textTransform: "uppercase",
                  }}
                >
                  {l.label} →
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>

      <BFooter />
    </div>
  );
}
