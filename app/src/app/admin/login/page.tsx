"use client";

import { useState, FormEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export default function AdminLoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const from = searchParams.get("from") ?? "/admin";

  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/admin/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });

      if (res.ok) {
        router.push(from);
      } else {
        const data = await res.json() as { error?: string };
        setError(data.error ?? "Invalid password");
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "var(--b-ink)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: "var(--font-geist), sans-serif",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 380,
          padding: "0 24px",
        }}
      >
        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: 40 }}>
          <div
            style={{
              fontFamily: "var(--font-newsreader), serif",
              fontSize: 32,
              color: "var(--b-paper)",
              letterSpacing: "-0.5px",
              marginBottom: 6,
            }}
          >
            Poolly
          </div>
          <span
            className="b-eyebrow"
            style={{ color: "var(--b-gold)", letterSpacing: "0.12em" }}
          >
            Admin
          </span>
        </div>

        {/* Card */}
        <div
          style={{
            background: "var(--b-ink-2)",
            border: "1px solid var(--b-rule)",
            padding: "32px 28px",
          }}
        >
          <div
            style={{
              fontFamily: "var(--font-geist-mono), monospace",
              fontSize: 10,
              textTransform: "uppercase",
              letterSpacing: "0.12em",
              color: "var(--b-paper-40, rgba(237,230,214,0.4))",
              marginBottom: 20,
            }}
          >
            Sign in to continue
          </div>

          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: 16 }}>
              <label
                htmlFor="password"
                style={{
                  display: "block",
                  fontFamily: "var(--font-geist-mono), monospace",
                  fontSize: 9,
                  textTransform: "uppercase",
                  letterSpacing: "0.1em",
                  color: "var(--b-paper-40, rgba(237,230,214,0.4))",
                  marginBottom: 8,
                }}
              >
                Admin Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                required
                style={{
                  width: "100%",
                  background: "var(--b-ink)",
                  border: "1px solid var(--b-rule)",
                  color: "var(--b-paper)",
                  fontFamily: "var(--font-geist), sans-serif",
                  fontSize: 14,
                  padding: "10px 12px",
                  outline: "none",
                  boxSizing: "border-box",
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = "var(--b-gold)";
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = "var(--b-rule)";
                }}
              />
            </div>

            {error && (
              <div
                style={{
                  fontFamily: "var(--font-geist-mono), monospace",
                  fontSize: 11,
                  color: "var(--b-rust)",
                  marginBottom: 16,
                  padding: "8px 12px",
                  border: "1px solid var(--b-rust)",
                  background: "rgba(181,86,62,0.08)",
                }}
              >
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading || !password}
              style={{
                width: "100%",
                background: loading || !password ? "var(--b-ink-3)" : "var(--b-gold)",
                color: loading || !password ? "var(--b-paper-40, rgba(237,230,214,0.4))" : "var(--b-ink)",
                border: "none",
                padding: "11px 16px",
                fontFamily: "var(--font-geist-mono), monospace",
                fontSize: 11,
                textTransform: "uppercase",
                letterSpacing: "0.1em",
                cursor: loading || !password ? "not-allowed" : "pointer",
                transition: "background 0.15s",
              }}
            >
              {loading ? "Signing in…" : "Sign in"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
