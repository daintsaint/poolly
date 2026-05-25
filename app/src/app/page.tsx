import Link from "next/link";
import { BNav, BTicker, BEscrowSpecimen, BFooter, ServiceMark, PoolSlots } from "@/components/vault-ui";

/* ─── Static catalog data ─── */
const CATALOG_ROW_1 = [
  { id: "netflix",  name: "Netflix Premium", host: "maya.sol",   price: "$4.99", retail: "$22.99", savings: "+$216/yr", seats: 4, filled: 3, accent: true  },
  { id: "spotify",  name: "Spotify Family",  host: "jin.sol",    price: "$3.49", retail: "$17.99", savings: "+$174/yr", seats: 5, filled: 4, accent: false },
  { id: "ms365",    name: "Microsoft 365",   host: "eli.sol",    price: "$1.69", retail: "$29.99", savings: "+$338/yr", seats: 6, filled: 5, accent: false },
  { id: "disney",   name: "Disney+",         host: "priya.sol",  price: "$3.49", retail: "$13.99", savings: "+$126/yr", seats: 4, filled: 2, accent: false },
];
const CATALOG_ROW_2 = [
  { id: "icloud",  name: "iCloud+ 2TB",  host: "tomoki.sol", price: "$1.99", retail: "$9.99",  savings: "+$96/yr",  seats: 5, filled: 3, accent: false },
  { id: "nyt",     name: "NYT All Access",host: "sara.sol",   price: "$6.25", retail: "$25.00", savings: "+$225/yr", seats: 4, filled: 4, accent: false },
  { id: "adobe",   name: "Adobe CC",     host: "dev.sol",    price: "$14.99",retail: "$59.99", savings: "+$540/yr", seats: 4, filled: 2, accent: false },
  { id: "peloton", name: "Peloton App",  host: "kai.sol",    price: "$4.00", retail: "$24.00", savings: "+$240/yr", seats: 6, filled: 5, accent: false },
];

const MATH_TABLE = [
  { id: "netflix",  name: "Netflix Premium",   retail: "$22.99", share: "$4.99",  saved: "$216",  seats: 4 },
  { id: "spotify",  name: "Spotify Family",    retail: "$17.99", share: "$3.49",  saved: "$174",  seats: 5 },
  { id: "ms365",    name: "Microsoft 365",     retail: "$29.99", share: "$1.69",  saved: "$338",  seats: 6 },
  { id: "icloud",   name: "iCloud+ 2TB",       retail: "$9.99",  share: "$1.99",  saved: "$96",   seats: 5 },
  { id: "adobe",    name: "Adobe Creative CC", retail: "$59.99", share: "$14.99", saved: "$540",  seats: 4 },
  { id: "peloton",  name: "Peloton App",       retail: "$24.00", share: "$4.00",  saved: "$240",  seats: 6 },
];

const LEDGER_ROWS = [
  { time: "2m ago",   actor: "maya.sol",   event: "RELEASED",  plan: "Netflix Premium",  amount: "$14.97", tx: "3xK9…vMa2" },
  { time: "14m ago",  actor: "jin.sol",    event: "LOCKED",    plan: "Spotify Family",   amount: "$3.49",  tx: "7pQr…nF8w" },
  { time: "1h ago",   actor: "priya.sol",  event: "JOINED",    plan: "Disney+",          amount: "$3.49",  tx: "9mTv…kL3x" },
  { time: "3h ago",   actor: "eli.sol",    event: "RELEASED",  plan: "MS365",            amount: "$8.45",  tx: "2vBn…rA6y" },
  { time: "6h ago",   actor: "tomoki.sol", event: "LOCKED",    plan: "iCloud+ 2TB",      amount: "$1.99",  tx: "5sWp…cD1m" },
  { time: "12h ago",  actor: "kai.sol",    event: "JOINED",    plan: "Peloton App",      amount: "$4.00",  tx: "8qLd…tE9n" },
];

/* ─── BCatalogCard (server-safe) ─── */
function BCatalogCard({ item, accent }: { item: typeof CATALOG_ROW_1[0]; accent?: boolean }) {
  return (
    <div
      className="lift"
      style={{
        background: accent ? "var(--b-paper)" : "var(--b-ink-3)",
        border: `1px solid ${accent ? "transparent" : "var(--b-rule)"}`,
        padding: 24,
        display: "flex",
        flexDirection: "column",
        gap: 16,
        minHeight: 220,
      }}
    >
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
        <ServiceMark id={item.id} size={40} radius={0} />
        <span
          style={{
            fontFamily: "var(--font-geist-mono), monospace",
            fontSize: 9.5,
            color: accent ? "var(--b-ink)" : "var(--b-gold)",
            letterSpacing: "0.18em",
            textTransform: "uppercase",
            border: `1px solid ${accent ? "rgba(12,11,9,0.15)" : "rgba(201,162,79,0.3)"}`,
            padding: "2px 8px",
          }}
        >
          STREAMING
        </span>
      </div>

      <div>
        <p
          className="b-serif"
          style={{
            fontSize: 28,
            lineHeight: 1.1,
            color: accent ? "var(--b-ink)" : "var(--b-paper)",
            marginBottom: 4,
          }}
        >
          {item.name}
        </p>
        <p
          style={{
            fontFamily: "var(--font-geist-mono), monospace",
            fontSize: 10.5,
            color: accent ? "rgba(12,11,9,0.5)" : "var(--b-paper-40)",
            letterSpacing: "0.08em",
          }}
        >
          HOST · {item.host}
        </p>
      </div>

      <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", marginTop: "auto" }}>
        <div>
          <p
            style={{
              fontFamily: "var(--font-geist-mono), monospace",
              fontSize: 9.5,
              color: accent ? "rgba(12,11,9,0.5)" : "var(--b-paper-40)",
              letterSpacing: "0.16em",
              textTransform: "uppercase",
              marginBottom: 3,
            }}
          >
            YOUR SHARE
          </p>
          <p
            className="b-serif"
            style={{ fontSize: 36, lineHeight: 1, color: accent ? "var(--b-ink)" : "var(--b-paper)" }}
          >
            {item.price}
          </p>
          <p
            style={{
              fontFamily: "var(--font-geist-mono), monospace",
              fontSize: 10,
              color: accent ? "rgba(12,11,9,0.45)" : "var(--b-paper-40)",
              marginTop: 3,
            }}
          >
            VS RETAIL{" "}
            <span style={{ textDecoration: "line-through" }}>{item.retail}</span>
          </p>
        </div>
        <div style={{ textAlign: "right" }}>
          <PoolSlots filled={item.filled} total={item.seats} size={14} gap={4} />
          <p
            style={{
              fontFamily: "var(--font-geist-mono), monospace",
              fontSize: 9.5,
              color: accent ? "rgba(12,11,9,0.45)" : "var(--b-paper-40)",
              letterSpacing: "0.14em",
              textTransform: "uppercase",
              marginTop: 4,
            }}
          >
            {item.filled}/{item.seats} CLAIMED
          </p>
        </div>
      </div>
    </div>
  );
}

/* ─── Main Page ─── */
export default function Home() {
  return (
    <div>
      <BNav />
      <BTicker />

      {/* ── HERO ─────────────────────────────────────── */}
      <section style={{ background: "var(--b-ink)", paddingTop: 96, paddingBottom: 80 }}>
        <div style={{ maxWidth: 1100, margin: "0 auto", padding: "0 40px", textAlign: "center" }}>

          {/* Eyebrow */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 20, marginBottom: 32 }}>
            <div style={{ flex: 1, maxWidth: 120, height: 1, background: "var(--b-gold)", opacity: 0.5 }} />
            <p className="b-eyebrow">CHAPTER IV · NON-CUSTODIAL ESCROW</p>
            <div style={{ flex: 1, maxWidth: 120, height: 1, background: "var(--b-gold)", opacity: 0.5 }} />
          </div>

          {/* H1 */}
          <h1
            className="b-serif"
            style={{
              fontSize: "clamp(72px, 9vw, 156px)",
              lineHeight: 0.92,
              letterSpacing: "-0.035em",
              color: "var(--b-paper)",
              marginBottom: 32,
            }}
          >
            Money held by{" "}
            <em style={{ color: "var(--b-gold)", fontStyle: "italic" }}>mathematics</em>
            ,<br />not men.
          </h1>

          {/* Lede */}
          <p
            style={{
              fontSize: 18,
              lineHeight: 1.6,
              color: "var(--b-paper-60)",
              maxWidth: 560,
              margin: "0 auto 40px",
            }}
          >
            Split subscriptions with anyone. Each payment locks into a Solana smart
            contract — released only when delivery is proven. No middleman. No trust required.
          </p>

          {/* CTAs */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 16, marginBottom: 64 }}>
            <Link
              href="/pools"
              style={{
                background: "var(--b-gold)",
                color: "var(--b-ink)",
                padding: "14px 32px",
                fontFamily: "var(--font-geist-mono), monospace",
                fontSize: 12,
                fontWeight: 700,
                letterSpacing: "0.14em",
                textTransform: "uppercase",
                textDecoration: "none",
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                transition: "background 0.2s",
              }}
            >
              Enter the Catalog →
            </Link>
            <a
              href="https://github.com"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                background: "transparent",
                color: "var(--b-paper-60)",
                padding: "13px 32px",
                fontFamily: "var(--font-geist-mono), monospace",
                fontSize: 12,
                fontWeight: 600,
                letterSpacing: "0.14em",
                textTransform: "uppercase",
                textDecoration: "none",
                border: "1px solid var(--b-rule)",
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
              }}
            >
              Read the contract ↗
            </a>
          </div>

          {/* Escrow specimen */}
          <BEscrowSpecimen />

          {/* Proof stats bar */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(4,1fr)",
              gap: 0,
              borderTop: "1px solid var(--b-rule)",
              marginTop: 56,
            }}
          >
            {[
              { num: "$1.84M", label: "TOTAL IN ESCROW" },
              { num: "5,917",  label: "MEMBERS ACTIVE" },
              { num: "$0",     label: "FUNDS LOST EVER" },
              { num: "0",      label: "DISPUTES OPEN" },
            ].map((s, i) => (
              <div
                key={s.label}
                style={{
                  padding: "32px 0",
                  borderRight: i < 3 ? "1px solid var(--b-rule)" : "none",
                  textAlign: "center",
                }}
              >
                <p
                  className="b-serif"
                  style={{ fontSize: 56, lineHeight: 1, color: "var(--b-paper)", marginBottom: 8 }}
                >
                  {s.num}
                </p>
                <p className="b-eyebrow">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── MECHANISM ──────────────────────────────────── */}
      <section id="mechanism" style={{ background: "var(--b-ink)", padding: "96px 40px" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <p className="b-eyebrow" style={{ marginBottom: 20 }}>I. THE MECHANISM</p>
          <h2
            className="b-serif"
            style={{ fontSize: "clamp(40px, 5vw, 72px)", lineHeight: 1.05, color: "var(--b-paper)", marginBottom: 56 }}
          >
            Three actors,{" "}
            <em style={{ color: "var(--b-gold)", fontStyle: "italic" }}>one ledger.</em>
          </h2>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 0 }}>
            {[
              {
                num: "I.",
                who: "MEMBER",
                title: "You lock funds.",
                body: "Each member deposits their share into a Solana-program-owned escrow account. No one — not the host, not Poolly — can withdraw without the correct conditions.",
                note: "FUNDS LOCKED AT DEPOSIT · NO APPROVAL NEEDED",
              },
              {
                num: "II.",
                who: "PROGRAM",
                title: "Math holds it.",
                body: "The Solana program enforces every rule in its bytecode. There is no Poolly server between you and your money — only open-source code you can read.",
                note: "PROGRAM VERIFIED · OPEN SOURCE · DEVNET & MAINNET",
              },
              {
                num: "III.",
                who: "HOST",
                title: "Deliver to release.",
                body: "The host submits cryptographic proof of delivery. When verified, 94% of escrow flows to the host. 6% to the protocol. On dispute, everything reverses.",
                note: "6% PROTOCOL FEE · ONLY ON RELEASE",
              },
            ].map((step, i) => (
              <div
                key={step.num}
                style={{
                  borderTop: "1px solid var(--b-rule)",
                  borderLeft: i > 0 ? "1px solid var(--b-rule)" : "none",
                  padding: 40,
                }}
              >
                <p
                  style={{
                    fontFamily: "var(--font-geist-mono), monospace",
                    fontSize: 10.5,
                    color: "var(--b-gold)",
                    letterSpacing: "0.22em",
                    textTransform: "uppercase",
                    marginBottom: 8,
                  }}
                >
                  {step.num} {step.who}
                </p>
                <p
                  className="b-serif"
                  style={{ fontSize: 32, lineHeight: 1.1, color: "var(--b-paper)", marginBottom: 16 }}
                >
                  {step.title}
                </p>
                <p style={{ fontSize: 14, lineHeight: 1.65, color: "var(--b-paper-60)", marginBottom: 24 }}>
                  {step.body}
                </p>
                <p
                  style={{
                    fontFamily: "var(--font-geist-mono), monospace",
                    fontSize: 9.5,
                    color: "var(--b-paper-40)",
                    letterSpacing: "0.16em",
                    textTransform: "uppercase",
                    borderTop: "1px dashed var(--b-rule)",
                    paddingTop: 14,
                  }}
                >
                  {step.note}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CATALOG PREVIEW ─────────────────────────────── */}
      <section style={{ background: "var(--b-ink-2)", padding: "96px 40px" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <p className="b-eyebrow" style={{ marginBottom: 20 }}>II. THE CATALOG</p>
          <h2
            className="b-serif"
            style={{ fontSize: "clamp(40px, 5vw, 64px)", lineHeight: 1.05, color: "var(--b-paper)", marginBottom: 48 }}
          >
            Open seats,{" "}
            <em style={{ color: "var(--b-gold)", fontStyle: "italic" }}>curated weekly.</em>
          </h2>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 1, marginBottom: 2 }}>
            {CATALOG_ROW_1.map((item) => (
              <BCatalogCard key={item.id} item={item} accent={item.accent} />
            ))}
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 1 }}>
            {CATALOG_ROW_2.map((item) => (
              <BCatalogCard key={item.id} item={item} />
            ))}
          </div>

          <div style={{ textAlign: "center", marginTop: 40 }}>
            <Link
              href="/pools"
              style={{
                background: "transparent",
                color: "var(--b-gold)",
                padding: "12px 32px",
                fontFamily: "var(--font-geist-mono), monospace",
                fontSize: 11,
                fontWeight: 700,
                letterSpacing: "0.18em",
                textTransform: "uppercase",
                textDecoration: "none",
                border: "1px solid rgba(201,162,79,0.35)",
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
              }}
            >
              VIEW FULL CATALOG →
            </Link>
          </div>
        </div>
      </section>

      {/* ── MATH TABLE ─────────────────────────────────── */}
      <section style={{ background: "var(--b-ink)", padding: "96px 40px" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <p className="b-eyebrow" style={{ marginBottom: 20 }}>III. THE MATH</p>
          <h2
            className="b-serif"
            style={{ fontSize: "clamp(36px, 4.5vw, 60px)", lineHeight: 1.05, color: "var(--b-paper)", marginBottom: 48 }}
          >
            What it costs solo,{" "}
            <em style={{ color: "var(--b-gold)", fontStyle: "italic" }}>what it costs pooled.</em>
          </h2>

          {/* Table header */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "2fr 1fr 1.2fr 1fr 1fr",
              gap: 0,
              borderBottom: "1px solid var(--b-rule)",
              paddingBottom: 10,
              marginBottom: 0,
            }}
          >
            {["PLAN", "RETAIL/MO", "POOLLY/MO", "SAVED/YR", "SEATS"].map((h) => (
              <p
                key={h}
                style={{
                  fontFamily: "var(--font-geist-mono), monospace",
                  fontSize: 9.5,
                  color: "var(--b-paper-40)",
                  letterSpacing: "0.18em",
                  textTransform: "uppercase",
                  padding: "0 0 0 0",
                }}
              >
                {h}
              </p>
            ))}
          </div>

          {MATH_TABLE.map((row) => (
            <div
              key={row.id}
              className="lift"
              style={{
                display: "grid",
                gridTemplateColumns: "2fr 1fr 1.2fr 1fr 1fr",
                gap: 0,
                borderBottom: "1px solid var(--b-rule)",
                padding: "20px 0",
                alignItems: "center",
                cursor: "pointer",
              }}
            >
              {/* Plan */}
              <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                <ServiceMark id={row.id} size={36} radius={0} />
                <span
                  className="b-serif"
                  style={{ fontSize: 18, color: "var(--b-paper)" }}
                >
                  {row.name}
                </span>
              </div>

              {/* Retail */}
              <p
                style={{
                  fontFamily: "var(--font-geist-mono), monospace",
                  fontSize: 14,
                  color: "var(--b-paper-40)",
                  textDecoration: "line-through",
                }}
              >
                {row.retail}
              </p>

              {/* Poolly price */}
              <p
                className="b-serif"
                style={{ fontSize: 36, lineHeight: 1, color: "var(--b-paper)" }}
              >
                {row.share}
              </p>

              {/* Saved */}
              <p
                style={{
                  fontFamily: "var(--font-geist-mono), monospace",
                  fontSize: 13,
                  color: "var(--b-gold)",
                  fontWeight: 700,
                }}
              >
                +{row.saved}
              </p>

              {/* Slots */}
              <PoolSlots filled={row.seats} total={row.seats} size={12} gap={4} />
            </div>
          ))}
        </div>
      </section>

      {/* ── LEDGER ─────────────────────────────────────── */}
      <section style={{ background: "var(--b-ink-2)", padding: "96px 40px" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <p className="b-eyebrow" style={{ marginBottom: 20 }}>IV. THE LEDGER · LIVE</p>
          <h2
            className="b-serif"
            style={{ fontSize: "clamp(36px, 4.5vw, 60px)", lineHeight: 1.05, color: "var(--b-paper)", marginBottom: 48 }}
          >
            Every cent{" "}
            <em style={{ color: "var(--b-gold)", fontStyle: "italic" }}>on a public chain.</em>
          </h2>

          {/* Ledger header */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "0.6fr 1fr 0.9fr 1.2fr 0.7fr 0.8fr",
              gap: 0,
              borderBottom: "1px solid var(--b-rule)",
              paddingBottom: 10,
            }}
          >
            {["TIME", "ACTOR", "EVENT", "PLAN", "AMOUNT", "TX"].map((h) => (
              <p
                key={h}
                style={{
                  fontFamily: "var(--font-geist-mono), monospace",
                  fontSize: 9.5,
                  color: "var(--b-paper-40)",
                  letterSpacing: "0.18em",
                  textTransform: "uppercase",
                }}
              >
                {h}
              </p>
            ))}
          </div>

          {LEDGER_ROWS.map((row, i) => (
            <div
              key={i}
              style={{
                display: "grid",
                gridTemplateColumns: "0.6fr 1fr 0.9fr 1.2fr 0.7fr 0.8fr",
                gap: 0,
                borderBottom: "1px solid var(--b-rule)",
                padding: "16px 0",
                alignItems: "center",
              }}
            >
              <p
                style={{
                  fontFamily: "var(--font-geist-mono), monospace",
                  fontSize: 11,
                  color: "var(--b-paper-40)",
                }}
              >
                {row.time}
              </p>
              <p
                style={{
                  fontFamily: "var(--font-geist-mono), monospace",
                  fontSize: 11,
                  color: "var(--b-paper-60)",
                }}
              >
                {row.actor}
              </p>
              <span
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  padding: "3px 8px",
                  border: `1px solid ${row.event === "RELEASED" ? "rgba(92,135,112,0.4)" : "rgba(201,162,79,0.35)"}`,
                  background: row.event === "RELEASED" ? "rgba(92,135,112,0.08)" : "rgba(201,162,79,0.06)",
                  fontFamily: "var(--font-geist-mono), monospace",
                  fontSize: 9.5,
                  color: row.event === "RELEASED" ? "var(--b-emerald)" : "var(--b-gold)",
                  letterSpacing: "0.14em",
                  textTransform: "uppercase",
                  width: "fit-content",
                }}
              >
                {row.event}
              </span>
              <p style={{ fontSize: 13, color: "var(--b-paper)" }}>{row.plan}</p>
              <p
                className="b-serif"
                style={{ fontSize: 18, color: "var(--b-paper)" }}
              >
                {row.amount}
              </p>
              <a
                href="#"
                style={{
                  fontFamily: "var(--font-geist-mono), monospace",
                  fontSize: 10.5,
                  color: "var(--b-gold)",
                  textDecoration: "none",
                  letterSpacing: "0.06em",
                }}
              >
                {row.tx} ↗
              </a>
            </div>
          ))}
        </div>
      </section>

      {/* ── MANIFESTO ──────────────────────────────────── */}
      <section style={{ background: "var(--b-ink)", padding: "120px 40px", textAlign: "center" }}>
        <div style={{ maxWidth: 900, margin: "0 auto" }}>
          <p
            className="b-serif"
            style={{
              fontSize: "clamp(28px, 4vw, 52px)",
              lineHeight: 1.35,
              color: "var(--b-paper)",
              letterSpacing: "-0.02em",
              marginBottom: 32,
            }}
          >
            &ldquo;Trust is what we ask for when we haven&apos;t{" "}
            <em style={{ color: "var(--b-gold)", fontStyle: "italic" }}>built</em>{" "}
            something better. Poolly is the something better.&rdquo;
          </p>
          <p
            style={{
              fontFamily: "var(--font-geist-mono), monospace",
              fontSize: 10.5,
              color: "var(--b-paper-40)",
              letterSpacing: "0.22em",
              textTransform: "uppercase",
            }}
          >
            — POOLLY LABS · MMXXVI
          </p>
        </div>
      </section>

      <BFooter />
    </div>
  );
}
