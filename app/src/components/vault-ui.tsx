"use client";

import Link from "next/link";
import { useWallet } from "@solana/wallet-adapter-react";
import { useEffect, useRef, useState } from "react";

/* ─────────────────────────────────────────────────────────
   ServiceMark
───────────────────────────────────────────────────────── */
const SVC_GLYPHS: Record<string, string> = {
  netflix: "N",
  spotify: "♪",
  disney: "D+",
  icloud: "☁",
  notion: "N",
  ms365: "⊞",
  hbo: "MAX",
  adobe: "A",
  peloton: "P",
  nyt: "T",
  chatgpt: "✦",
  claude: "C",
};

type ServiceMarkProps = {
  id: string;
  size?: number;
  radius?: number;
};

export function ServiceMark({ id, size = 40, radius = 0 }: ServiceMarkProps) {
  const glyph = SVC_GLYPHS[id] ?? id.slice(0, 1).toUpperCase();
  return (
    <div
      className={`svc-${id}`}
      style={{
        width: size,
        height: size,
        borderRadius: radius,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: "var(--font-newsreader), Georgia, serif",
        fontWeight: 700,
        fontSize: size * 0.38,
        letterSpacing: "-0.02em",
        flexShrink: 0,
        userSelect: "none",
      }}
    >
      {glyph}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────
   Avatar
───────────────────────────────────────────────────────── */
const PALETTE = ["#C9A24F", "#8C6B22", "#5C8770", "#B5563E", "#A89A6E", "#6E5B3A"];

function seedColor(seed: string): string {
  let n = 0;
  for (let i = 0; i < seed.length; i++) n = (n * 31 + seed.charCodeAt(i)) % PALETTE.length;
  return PALETTE[Math.abs(n) % PALETTE.length];
}

type AvatarProps = {
  name: string;
  size?: number;
};

export function Avatar({ name, size = 32 }: AvatarProps) {
  const initials = name
    .split(/[\s._]+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");
  const bg = seedColor(name);
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: "50%",
        background: bg,
        color: "#0C0B09",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: size * 0.38,
        fontWeight: 700,
        flexShrink: 0,
        userSelect: "none",
        fontFamily: "var(--font-geist-mono), monospace",
        letterSpacing: "0.02em",
      }}
    >
      {initials || "?"}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────
   PoolSlots
───────────────────────────────────────────────────────── */
type PoolSlotsProps = {
  filled: number;
  total: number;
  size?: number;
  gap?: number;
};

export function PoolSlots({ filled, total, size = 18, gap = 6 }: PoolSlotsProps) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap, flexWrap: "wrap" }}>
      {Array.from({ length: total }).map((_, i) => (
        <div
          key={i}
          style={{
            width: size,
            height: size,
            borderRadius: "50%",
            background: i < filled ? "#C9A24F" : "transparent",
            border: i < filled ? "none" : "1.5px dashed rgba(237,230,214,0.18)",
            flexShrink: 0,
          }}
        />
      ))}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────
   Ticker (animated count-up)
───────────────────────────────────────────────────────── */
type TickerProps = {
  value: number;
  prefix?: string;
  suffix?: string;
  dur?: number;
  decimals?: number;
};

export function Ticker({ value, prefix = "", suffix = "", dur = 1200, decimals = 0 }: TickerProps) {
  const [display, setDisplay] = useState(0);
  const raf = useRef<number | null>(null);

  useEffect(() => {
    const start = performance.now();
    function tick(now: number) {
      const t = Math.min((now - start) / dur, 1);
      const ease = 1 - Math.pow(1 - t, 3);
      setDisplay(value * ease);
      if (t < 1) raf.current = requestAnimationFrame(tick);
    }
    raf.current = requestAnimationFrame(tick);
    return () => { if (raf.current) cancelAnimationFrame(raf.current); };
  }, [value, dur]);

  const formatted = display.toFixed(decimals).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  return <span>{prefix}{formatted}{suffix}</span>;
}

/* ─────────────────────────────────────────────────────────
   BTicker — animated marquee bar
───────────────────────────────────────────────────────── */
const TICKER_ITEMS = [
  { label: "CHAPTER", value: "IV · MAY MMXXVI" },
  { label: "LIVE POOLS", value: "1,284" },
  { label: "MEMBERS", value: "5,917" },
  { label: "IN ESCROW", value: "$184,920" },
  { label: "AVG. CYCLE", value: "$4.96/mo" },
  { label: "NETWORK", value: "SOL · 412 MS" },
];

export function BTicker() {
  const text = TICKER_ITEMS.map((i) => `${i.label} · `).join("") + "  ";
  return (
    <div
      style={{
        height: 38,
        background: "var(--b-ink-2)",
        borderBottom: "1px solid var(--b-rule)",
        overflow: "hidden",
        display: "flex",
        alignItems: "center",
      }}
    >
      <div className="b-marquee" style={{ display: "flex", alignItems: "center", whiteSpace: "nowrap", gap: 0 }}>
        {[0, 1].map((copy) => (
          <div key={copy} style={{ display: "flex", alignItems: "center", gap: 0 }}>
            {TICKER_ITEMS.map((item, i) => (
              <span
                key={i}
                style={{
                  fontFamily: "var(--font-geist-mono), monospace",
                  fontSize: 10,
                  letterSpacing: "0.18em",
                  textTransform: "uppercase",
                  padding: "0 28px",
                  color: "var(--b-paper-40)",
                }}
              >
                {item.label} &nbsp;
                <span style={{ color: "var(--b-gold)" }}>{item.value}</span>
                <span style={{ color: "var(--b-paper-20)", marginLeft: 28 }}>·</span>
              </span>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────
   WalletButton — custom, no WalletMultiButton dependency
───────────────────────────────────────────────────────── */
function WalletButton() {
  const { wallets, select, connect, disconnect, connecting, connected, publicKey } = useWallet();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const short = publicKey
    ? `${publicKey.toBase58().slice(0, 4)}…${publicKey.toBase58().slice(-4)}`
    : null;

  if (connected && short) {
    return (
      <div ref={ref} style={{ position: "relative" }}>
        <button
          onClick={() => setOpen((o) => !o)}
          style={{
            display: "flex", alignItems: "center", gap: 8,
            padding: "7px 14px", background: "var(--b-paper-08)",
            border: "1px solid var(--b-rule)", cursor: "pointer",
            fontFamily: "var(--font-geist-mono), monospace",
            fontSize: 11, color: "var(--b-paper-60)", letterSpacing: "0.06em",
          }}
        >
          <span style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--b-gold)", flexShrink: 0 }} />
          {short}
        </button>
        {open && (
          <div style={{
            position: "absolute", right: 0, top: "calc(100% + 6px)", zIndex: 100,
            background: "var(--b-ink-2)", border: "1px solid var(--b-rule)",
            minWidth: 160,
          }}>
            <button
              onClick={() => { disconnect(); setOpen(false); }}
              style={{
                width: "100%", padding: "12px 16px", background: "transparent",
                border: "none", cursor: "pointer", textAlign: "left",
                fontFamily: "var(--font-geist-mono), monospace",
                fontSize: 11, color: "var(--b-rust)", letterSpacing: "0.1em",
                textTransform: "uppercase",
              }}
            >
              Disconnect
            </button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div ref={ref} style={{ position: "relative" }}>
      <button
        onClick={() => setOpen((o) => !o)}
        disabled={connecting}
        style={{
          height: 34, padding: "0 18px", background: "var(--b-gold)",
          color: "var(--b-ink)", border: "none", cursor: "pointer",
          fontFamily: "var(--font-geist-mono), monospace",
          fontSize: 11, fontWeight: 700, letterSpacing: "0.12em",
          textTransform: "uppercase", opacity: connecting ? 0.6 : 1,
        }}
      >
        {connecting ? "Connecting…" : "Connect Wallet"}
      </button>
      {open && (
        <div style={{
          position: "absolute", right: 0, top: "calc(100% + 6px)", zIndex: 100,
          background: "var(--b-ink-2)", border: "1px solid var(--b-rule)",
          minWidth: 200,
        }}>
          {wallets.filter((w) => w.readyState === "Installed" || w.readyState === "Loadable").length === 0 && (
            <div style={{ padding: "14px 16px", fontFamily: "var(--font-geist-mono), monospace", fontSize: 11, color: "var(--b-paper-40)" }}>
              No wallet detected.<br/>Install Phantom or Solflare.
            </div>
          )}
          {wallets
            .filter((w) => w.readyState === "Installed" || w.readyState === "Loadable")
            .map((w) => (
              <button
                key={w.adapter.name}
                onClick={async () => {
                  setOpen(false);
                  select(w.adapter.name);
                  await connect().catch(() => {});
                }}
                style={{
                  width: "100%", padding: "12px 16px", background: "transparent",
                  border: "none", borderBottom: "1px solid var(--b-rule)",
                  cursor: "pointer", textAlign: "left", display: "flex",
                  alignItems: "center", gap: 10,
                  fontFamily: "var(--font-geist), sans-serif",
                  fontSize: 13, color: "var(--b-paper)",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = "var(--b-paper-08)")}
                onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
              >
                {w.adapter.icon && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={w.adapter.icon} alt="" width={20} height={20} style={{ borderRadius: 4 }} />
                )}
                {w.adapter.name}
              </button>
            ))}
        </div>
      )}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────
   BNav
───────────────────────────────────────────────────────── */
export function BNav() {
  return (
    <header
      style={{
        background: "var(--b-ink)",
        borderBottom: "1px solid var(--b-rule)",
        position: "sticky",
        top: 0,
        zIndex: 50,
      }}
    >
      <div
        style={{
          maxWidth: 1200,
          margin: "0 auto",
          padding: "0 40px",
          height: 64,
          display: "grid",
          gridTemplateColumns: "1fr auto 1fr",
          alignItems: "center",
          gap: 32,
        }}
      >
        {/* Left: wordmark */}
        <Link href="/" style={{ textDecoration: "none", display: "flex", alignItems: "center", gap: 10 }}>
          <div
            style={{
              width: 36,
              height: 36,
              background: "var(--b-paper)",
              color: "var(--b-ink)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontFamily: "var(--font-newsreader), Georgia, serif",
              fontStyle: "italic",
              fontWeight: 700,
              fontSize: 20,
              userSelect: "none",
            }}
          >
            P
          </div>
          <span
            style={{
              fontFamily: "var(--font-geist), sans-serif",
              fontSize: 14,
              color: "var(--b-paper-60)",
              letterSpacing: "0.02em",
            }}
          >
            Poolly ·{" "}
            <em
              style={{
                fontFamily: "var(--font-newsreader), Georgia, serif",
                fontStyle: "italic",
                color: "var(--b-gold)",
                fontWeight: 300,
              }}
            >
              The Vault
            </em>
          </span>
        </Link>

        {/* Center: nav links */}
        <nav style={{ display: "flex", alignItems: "center", gap: 32 }}>
          {[
            { label: "Browse", href: "/pools" },
            { label: "Share a Plan", href: "/pools/create" },
            { label: "My Dashboard", href: "/dashboard/member" },
            { label: "Host Dashboard", href: "/dashboard/host" },
          ].map((l) => (
            <Link
              key={l.href}
              href={l.href}
              style={{
                fontSize: 13,
                color: "var(--b-paper-60)",
                textDecoration: "none",
                letterSpacing: "0.01em",
                transition: "color 0.15s",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.color = "var(--b-paper)")}
              onMouseLeave={(e) => (e.currentTarget.style.color = "var(--b-paper-60)")}
            >
              {l.label}
            </Link>
          ))}
        </nav>

        {/* Right: wallet */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end" }}>
          <WalletButton />
        </div>
      </div>
    </header>
  );
}

/* ─────────────────────────────────────────────────────────
   BEscrowSpecimen
───────────────────────────────────────────────────────── */
export function BEscrowSpecimen() {
  return (
    <div
      style={{
        background: "linear-gradient(135deg, var(--b-ink-3) 0%, var(--b-ink-2) 100%)",
        border: "1px solid var(--b-rule)",
        padding: 36,
        display: "grid",
        gridTemplateColumns: "1fr 1fr 1fr",
        gap: 32,
      }}
    >
      {/* Col 1: Members lock */}
      <div>
        <p className="b-eyebrow" style={{ marginBottom: 16 }}>① Members · Lock</p>
        {[
          { handle: "maya.sol", amt: "$4.99", locked: true },
          { handle: "jin.sol", amt: "$4.99", locked: true },
          { handle: "eli.sol", amt: "$4.99", locked: true },
          { handle: "wes.sol", amt: "—", locked: false },
        ].map((m) => (
          <div
            key={m.handle}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "10px 14px",
              marginBottom: 6,
              border: m.locked ? "1px solid rgba(201,162,79,0.4)" : "1px solid var(--b-paper-08)",
              background: m.locked ? "rgba(201,162,79,0.06)" : "transparent",
            }}
          >
            <span
              style={{
                fontFamily: "var(--font-geist-mono), monospace",
                fontSize: 12,
                color: m.locked ? "var(--b-paper)" : "var(--b-paper-40)",
                letterSpacing: "0.04em",
              }}
            >
              {m.handle}
            </span>
            <span
              style={{
                fontFamily: "var(--font-geist-mono), monospace",
                fontSize: 12,
                color: m.locked ? "var(--b-gold)" : "var(--b-paper-20)",
              }}
            >
              {m.locked ? "🔒 " : ""}{m.amt}
            </span>
          </div>
        ))}
        <p
          style={{
            fontFamily: "var(--font-geist-mono), monospace",
            fontSize: 9.5,
            color: "var(--b-paper-40)",
            letterSpacing: "0.16em",
            textTransform: "uppercase",
            marginTop: 12,
          }}
        >
          1 AWAITING
        </p>
      </div>

      {/* Col 2: Program holds */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          border: "1px solid rgba(201,162,79,0.35)",
          padding: "28px 20px",
          textAlign: "center",
        }}
      >
        <p className="b-eyebrow" style={{ marginBottom: 12 }}>② Program Holds</p>
        <p
          className="b-serif"
          style={{
            fontSize: 56,
            color: "var(--b-gold)",
            lineHeight: 1,
            marginBottom: 10,
          }}
        >
          $14.97
        </p>
        <p
          style={{
            fontFamily: "var(--font-geist-mono), monospace",
            fontSize: 10.5,
            color: "var(--b-paper-40)",
            letterSpacing: "0.12em",
            marginBottom: 14,
          }}
        >
          ACCT 8Kn…2vMa
        </p>
        <p
          className="b-serif b-italic"
          style={{ fontSize: 13, color: "var(--b-paper-60)", lineHeight: 1.5 }}
        >
          Untouchable by anyone.
        </p>
      </div>

      {/* Col 3: On delivery releases */}
      <div>
        <p className="b-eyebrow" style={{ marginBottom: 16 }}>③ On Delivery · Releases</p>
        <div
          style={{
            border: "1px solid rgba(92,135,112,0.35)",
            background: "rgba(92,135,112,0.06)",
            padding: "14px 16px",
            marginBottom: 8,
          }}
        >
          <p
            style={{
              fontFamily: "var(--font-geist-mono), monospace",
              fontSize: 10,
              color: "var(--b-emerald)",
              letterSpacing: "0.16em",
              textTransform: "uppercase",
              marginBottom: 4,
            }}
          >
            HOST · 94%
          </p>
          <p className="b-serif" style={{ fontSize: 24, color: "var(--b-paper)" }}>
            $14.07
          </p>
        </div>
        <div
          style={{
            border: "1px solid var(--b-rule)",
            background: "var(--b-paper-08)",
            padding: "14px 16px",
            marginBottom: 14,
          }}
        >
          <p
            style={{
              fontFamily: "var(--font-geist-mono), monospace",
              fontSize: 10,
              color: "var(--b-paper-40)",
              letterSpacing: "0.16em",
              textTransform: "uppercase",
              marginBottom: 4,
            }}
          >
            FEE · 6%
          </p>
          <p className="b-serif" style={{ fontSize: 24, color: "var(--b-paper-60)" }}>
            $0.90
          </p>
        </div>
        <div
          style={{
            borderTop: "1px dashed var(--b-rule)",
            paddingTop: 12,
          }}
        >
          <p
            style={{
              fontFamily: "var(--font-geist-mono), monospace",
              fontSize: 10,
              color: "var(--b-rust)",
              letterSpacing: "0.16em",
              textTransform: "uppercase",
            }}
          >
            ↺ On Dispute · Reverses
          </p>
          <p style={{ fontSize: 12, color: "var(--b-paper-40)", marginTop: 4, lineHeight: 1.5 }}>
            Full refund to members if host fails to deliver.
          </p>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────
   BFooter
───────────────────────────────────────────────────────── */
export function BFooter() {
  const cols = [
    {
      label: "CATALOG",
      links: ["Browse Plans", "All Streaming", "Productivity", "Fitness", "Professional"],
    },
    {
      label: "MECHANISM",
      links: ["How It Works", "Smart Contract", "Escrow Design", "Fee Structure", "Dispute Flow"],
    },
    {
      label: "HOST",
      links: ["Start Hosting", "Host Dashboard", "List a Plan", "Payout History", "Host FAQ"],
    },
    {
      label: "VAULT",
      links: ["Member Club", "My Plans", "Savings Tracker", "Referrals", "Account"],
    },
  ];

  return (
    <footer style={{ background: "var(--b-ink-2)", borderTop: "1px solid var(--b-rule)" }}>
      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "56px 40px 32px" }}>
        {/* Top: wordmark + link columns */}
        <div style={{ display: "grid", gridTemplateColumns: "1.6fr 1fr 1fr 1fr 1fr", gap: 48, marginBottom: 48 }}>
          {/* Wordmark */}
          <div>
            <p
              className="b-serif"
              style={{ fontSize: 56, lineHeight: 1, color: "var(--b-paper)", marginBottom: 16 }}
            >
              Poolly,{" "}
              <em
                style={{
                  fontFamily: "var(--font-newsreader), Georgia, serif",
                  fontStyle: "italic",
                  color: "var(--b-gold)",
                  fontWeight: 300,
                }}
              >
                The Vault.
              </em>
            </p>
            <p
              style={{
                fontFamily: "var(--font-geist), sans-serif",
                fontSize: 13,
                color: "var(--b-paper-40)",
                lineHeight: 1.6,
                maxWidth: 240,
              }}
            >
              Non-custodial subscription sharing. Money held by mathematics, not men.
            </p>
          </div>

          {/* Link columns */}
          {cols.map((col) => (
            <div key={col.label}>
              <p className="b-eyebrow" style={{ marginBottom: 16 }}>{col.label}</p>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {col.links.map((l) => (
                  <a
                    key={l}
                    href="#"
                    style={{
                      fontSize: 13,
                      color: "var(--b-paper-40)",
                      textDecoration: "none",
                      transition: "color 0.15s",
                      fontFamily: "var(--font-geist), sans-serif",
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.color = "var(--b-paper)")}
                    onMouseLeave={(e) => (e.currentTarget.style.color = "var(--b-paper-40)")}
                  >
                    {l}
                  </a>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Bottom bar */}
        <div
          style={{
            borderTop: "1px solid var(--b-rule)",
            paddingTop: 20,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <p
            style={{
              fontFamily: "var(--font-geist-mono), monospace",
              fontSize: 9.5,
              color: "var(--b-paper-40)",
              letterSpacing: "0.18em",
              textTransform: "uppercase",
            }}
          >
            MMXXVI · POOLLY LABS · ALL RIGHTS RESERVED · NON-CUSTODIAL BY DESIGN
          </p>
          <p
            style={{
              fontFamily: "var(--font-geist-mono), monospace",
              fontSize: 9.5,
              color: "var(--b-paper-40)",
              letterSpacing: "0.18em",
              textTransform: "uppercase",
            }}
          >
            PROGRAM HEALTHY · BLOCK 247.2M
          </p>
        </div>
      </div>
    </footer>
  );
}
