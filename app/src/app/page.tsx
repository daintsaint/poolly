import Link from "next/link";
import { BNav, BTicker, BFooter, ServiceMark, PoolSlots } from "@/components/vault-ui";
import { DemandIntel } from "@/components/demand-intel";
import { BundleOptimizer } from "@/components/bundle-optimizer";
import { fetchHomepageData, type HomepagePool, type ActivityEvent } from "@/lib/pool-server";

const MATH_TABLE = [
  { id: "netflix",  name: "Netflix Premium",   retail: "$22.99", share: "$4.99",  saved: "$216",  seats: 4 },
  { id: "spotify",  name: "Spotify Family",    retail: "$17.99", share: "$3.49",  saved: "$174",  seats: 5 },
  { id: "ms365",    name: "Microsoft 365",     retail: "$29.99", share: "$1.69",  saved: "$338",  seats: 6 },
  { id: "icloud",   name: "iCloud+ 2TB",       retail: "$9.99",  share: "$1.99",  saved: "$96",   seats: 5 },
  { id: "adobe",    name: "Adobe Creative CC", retail: "$59.99", share: "$14.99", saved: "$540",  seats: 4 },
  { id: "peloton",  name: "Peloton App",       retail: "$24.00", share: "$4.00",  saved: "$240",  seats: 6 },
];

/* ─── BCatalogCard — accepts live HomepagePool ─── */
function BCatalogCard({ item, accent }: { item: HomepagePool; accent?: boolean }) {
  const statusColor = item.status === "active" ? "var(--b-emerald)"
    : item.status === "pending" ? "var(--b-gold)"
    : "var(--b-paper-40)";

  return (
    <Link
      href={`/pools/${item.address}`}
      style={{ textDecoration: "none" }}
    >
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
          cursor: "pointer",
        }}
      >
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
          <ServiceMark id={item.svcId} size={40} radius={0} />
          <span
            style={{
              fontFamily: "var(--font-geist-mono), monospace",
              fontSize: 9.5,
              color: accent ? "var(--b-ink)" : statusColor,
              letterSpacing: "0.18em",
              textTransform: "uppercase",
              border: `1px solid ${accent ? "rgba(12,11,9,0.15)" : "rgba(201,162,79,0.3)"}`,
              padding: "2px 8px",
            }}
          >
            {item.status.toUpperCase()}
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
            {item.title}
          </p>
          <p
            style={{
              fontFamily: "var(--font-geist-mono), monospace",
              fontSize: 10.5,
              color: accent ? "rgba(12,11,9,0.5)" : "var(--b-paper-40)",
              letterSpacing: "0.08em",
            }}
          >
            {item.categoryLabel.toUpperCase()}
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
                color: accent ? "rgba(12,11,9,0.45)" : "var(--b-gold)",
                marginTop: 3,
              }}
            >
              {item.savingsYr}
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
    </Link>
  );
}

/* ─── ActivityRow — live on-chain event ─── */
function ActivityRow({ row }: { row: ActivityEvent }) {
  const eventColor =
    row.event === "RELEASED" ? "var(--b-emerald)"
    : row.event === "JOINED" ? "var(--b-gold)"
    : "var(--b-paper-40)";
  const eventBg =
    row.event === "RELEASED" ? "rgba(92,135,112,0.08)"
    : row.event === "JOINED" ? "rgba(201,162,79,0.06)"
    : "rgba(237,230,214,0.04)";
  const eventBorder =
    row.event === "RELEASED" ? "rgba(92,135,112,0.4)"
    : row.event === "JOINED" ? "rgba(201,162,79,0.35)"
    : "var(--b-rule)";

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "0.6fr 1fr 0.9fr 1.2fr 0.7fr 0.8fr",
        gap: 0,
        borderBottom: "1px solid var(--b-rule)",
        padding: "16px 0",
        alignItems: "center",
        minWidth: 560,
      }}
    >
      <p style={{ fontFamily: "var(--font-geist-mono), monospace", fontSize: 11, color: "var(--b-paper-40)" }}>
        {row.time}
      </p>
      <p style={{ fontFamily: "var(--font-geist-mono), monospace", fontSize: 11, color: "var(--b-paper-60)" }}>
        {row.actor}
      </p>
      <span
        style={{
          display: "inline-flex",
          alignItems: "center",
          padding: "3px 8px",
          border: `1px solid ${eventBorder}`,
          background: eventBg,
          fontFamily: "var(--font-geist-mono), monospace",
          fontSize: 9.5,
          color: eventColor,
          letterSpacing: "0.14em",
          textTransform: "uppercase",
          width: "fit-content",
        }}
      >
        {row.event}
      </span>
      <p style={{ fontSize: 13, color: "var(--b-paper)" }}>{row.plan}</p>
      <p className="b-serif" style={{ fontSize: 18, color: "var(--b-paper)" }}>{row.amount}</p>
      <a
        href={row.solscanUrl}
        target="_blank"
        rel="noopener noreferrer"
        style={{
          fontFamily: "var(--font-geist-mono), monospace",
          fontSize: 10.5,
          color: "var(--b-gold)",
          textDecoration: "none",
          letterSpacing: "0.06em",
        }}
      >
        view ↗
      </a>
    </div>
  );
}

/* ─── Main Page ─── */
export default async function Home() {
  const { pools, activity, stats } = await fetchHomepageData();
  const row1 = pools.slice(0, 4);
  const row2 = pools.slice(4, 8);

  return (
    <div>
      <BNav />
      <BTicker />

      {/* ── HERO ─────────────────────────────────────── */}
      <section style={{ background: "var(--b-ink)", paddingTop: 96, paddingBottom: 80 }}>
        <div className="page-x" style={{ maxWidth: 1100, margin: "0 auto", textAlign: "center" }}>

          {/* Eyebrow */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 20, marginBottom: 32 }}>
            <div style={{ flex: 1, maxWidth: 120, height: 1, background: "var(--b-gold)", opacity: 0.5 }} />
            <p className="b-eyebrow">POOLLY · SMARTER POOLING</p>
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
            Full price is{" "}
            <em style={{ color: "var(--b-gold)", fontStyle: "italic" }}>overrated.</em>
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
            Split any subscription with a group. Each payment locks in escrow — released
            only when delivery is proven. Smarter pooling, built on Solana.
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
              href="https://solscan.io/account/Edv6BNFLKPKJ4KUWco2MEmGSTsdSU4xBWFsaFFmezpcq?cluster=devnet"
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

          {/* ── D: How it works — 3 step cards (matches mechanism style) ── */}
          <div className="grid-3" style={{ gap: 0 }}>
            {[
              {
                num: "I.",
                who: "MEMBER",
                title: "You lock funds.",
                body: "Pick a pool, pay your share. Funds go directly into a Solana program-owned escrow — not Poolly's wallet. No one can touch it without the right conditions.",
                note: "FUNDS LOCKED AT DEPOSIT · NO APPROVAL NEEDED",
              },
              {
                num: "II.",
                who: "PROGRAM",
                title: "Math holds it.",
                body: "The Solana program enforces every rule in its bytecode. There is no Poolly server between you and your money — only open-source code you can verify.",
                note: "PROGRAM VERIFIED · OPEN SOURCE · DEVNET LIVE",
              },
              {
                num: "III.",
                who: "HOST",
                title: "Deliver to release.",
                body: "The host submits proof of delivery. AI verifies it. 94% of escrow flows to the host, 6% to the protocol. On dispute, everything reverses.",
                note: "6% PROTOCOL FEE · ONLY ON RELEASE",
              },
            ].map((step, i) => (
              <div
                key={step.num}
                style={{
                  borderTop: "1px solid var(--b-rule)",
                  borderLeft: i > 0 ? "1px solid var(--b-rule)" : "none",
                  padding: 40,
                  textAlign: "left",
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

          {/* ── Trust signals bar (always-true facts, not usage metrics) ── */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(4, 1fr)",
              gap: 0,
              borderTop: "1px solid var(--b-rule)",
            }}
          >
            {[
              { num: "$0",    label: "FUNDS LOST EVER" },
              { num: "0",     label: "EXPLOITS" },
              { num: "100%",  label: "ON-CHAIN" },
              { num: "6%",    label: "ONLY FEE · ON RELEASE" },
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
      <section id="mechanism" style={{ background: "var(--b-ink)", padding: "clamp(3rem, 8vw, 96px) 0" }}>
        <div className="page-x" style={{ maxWidth: 1100, margin: "0 auto" }}>
          <p className="b-eyebrow" style={{ marginBottom: 20 }}>I. THE MECHANISM</p>
          <h2
            className="b-serif"
            style={{ fontSize: "clamp(40px, 5vw, 72px)", lineHeight: 1.05, color: "var(--b-paper)", marginBottom: 56 }}
          >
            Three actors,{" "}
            <em style={{ color: "var(--b-gold)", fontStyle: "italic" }}>one ledger.</em>
          </h2>

          <div className="grid-3" style={{ gap: 0 }}>
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
      <section style={{ background: "var(--b-ink-2)", padding: "clamp(3rem, 8vw, 96px) 0" }}>
        <div className="page-x" style={{ maxWidth: 1100, margin: "0 auto" }}>
          <p className="b-eyebrow" style={{ marginBottom: 20 }}>II. THE CATALOG</p>
          <h2
            className="b-serif"
            style={{ fontSize: "clamp(40px, 5vw, 64px)", lineHeight: 1.05, color: "var(--b-paper)", marginBottom: 48 }}
          >
            Open seats,{" "}
            <em style={{ color: "var(--b-gold)", fontStyle: "italic" }}>curated weekly.</em>
          </h2>

          {row1.length > 0 ? (
            <>
              <div className="pool-grid" style={{ marginBottom: 2 }}>
                {row1.map((item, i) => (
                  <BCatalogCard key={item.address} item={item} accent={i === 0} />
                ))}
              </div>
              {row2.length > 0 && (
                <div className="pool-grid">
                  {row2.map((item) => (
                    <BCatalogCard key={item.address} item={item} />
                  ))}
                </div>
              )}
            </>
          ) : (
            /* Empty state — no on-chain pools yet */
            <div
              style={{
                border: "1px solid var(--b-rule)",
                padding: "64px 32px",
                textAlign: "center",
              }}
            >
              <p className="b-serif" style={{ fontSize: 28, color: "var(--b-paper-40)", marginBottom: 12 }}>
                No pools yet.
              </p>
              <p style={{ fontFamily: "var(--font-geist-mono), monospace", fontSize: 11, color: "var(--b-paper-40)", letterSpacing: "0.12em" }}>
                BE THE FIRST HOST →
              </p>
            </div>
          )}

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
      <section style={{ background: "var(--b-ink)", padding: "clamp(3rem, 8vw, 96px) 0" }}>
        <div className="page-x" style={{ maxWidth: 1100, margin: "0 auto" }}>
          <p className="b-eyebrow" style={{ marginBottom: 20 }}>III. THE MATH</p>
          <h2
            className="b-serif"
            style={{ fontSize: "clamp(36px, 4.5vw, 60px)", lineHeight: 1.05, color: "var(--b-paper)", marginBottom: 48 }}
          >
            What it costs solo,{" "}
            <em style={{ color: "var(--b-gold)", fontStyle: "italic" }}>what it costs pooled.</em>
          </h2>

          {/* Table — horizontal scroll on mobile */}
          <div className="table-scroll">
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "2fr 1fr 1.2fr 1fr 1fr",
              gap: 0,
              borderBottom: "1px solid var(--b-rule)",
              paddingBottom: 10,
              marginBottom: 0,
              minWidth: 520,
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
                minWidth: 520,
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
          </div>{/* /table-scroll */}
        </div>
      </section>

      {/* ── LEDGER ─────────────────────────────────────── */}
      <section style={{ background: "var(--b-ink-2)", padding: "clamp(3rem, 8vw, 96px) 0" }}>
        <div className="page-x" style={{ maxWidth: 1100, margin: "0 auto" }}>
          <p className="b-eyebrow" style={{ marginBottom: 20 }}>IV. THE LEDGER · LIVE</p>
          <h2
            className="b-serif"
            style={{ fontSize: "clamp(36px, 4.5vw, 60px)", lineHeight: 1.05, color: "var(--b-paper)", marginBottom: 48 }}
          >
            Every cent{" "}
            <em style={{ color: "var(--b-gold)", fontStyle: "italic" }}>on a public chain.</em>
          </h2>

          {/* Ledger — horizontal scroll on mobile */}
          <div className="table-scroll">
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "0.6fr 1fr 0.9fr 1.2fr 0.7fr 0.8fr",
              gap: 0,
              borderBottom: "1px solid var(--b-rule)",
              paddingBottom: 10,
              minWidth: 560,
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

          {activity.length > 0 ? (
            activity.map((row, i) => <ActivityRow key={i} row={row} />)
          ) : (
            <div style={{ padding: "32px 0", textAlign: "center" }}>
              <p style={{ fontFamily: "var(--font-geist-mono), monospace", fontSize: 11, color: "var(--b-paper-40)", letterSpacing: "0.12em" }}>
                NO ACTIVITY YET
              </p>
            </div>
          )}
          </div>{/* /table-scroll */}
        </div>
      </section>

      {/* ── MANIFESTO ──────────────────────────────────── */}
      <section style={{ background: "var(--b-ink)", padding: "clamp(3rem, 10vw, 120px) 0", textAlign: "center" }}>
        <div className="page-x" style={{ maxWidth: 900, margin: "0 auto" }}>
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
            &ldquo;Full price is a solo problem.{" "}
            <em style={{ color: "var(--b-gold)", fontStyle: "italic" }}>Smarter pooling</em>{" "}
            is a group solution.&rdquo;
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

      {/* ── AI INTELLIGENCE ─────────────────────────────── */}
      <section style={{ background: "var(--b-ink-2)", padding: "clamp(3rem, 8vw, 96px) 0" }}>
        <div className="page-x" style={{ maxWidth: 1100, margin: "0 auto" }}>
          <p className="b-eyebrow" style={{ marginBottom: 20 }}>V. THE INTELLIGENCE</p>
          <h2
            className="b-serif"
            style={{ fontSize: "clamp(36px, 4.5vw, 60px)", lineHeight: 1.05, color: "var(--b-paper)", marginBottom: 12 }}
          >
            AI that finds your{" "}
            <em style={{ color: "var(--b-gold)", fontStyle: "italic" }}>optimal bundle.</em>
          </h2>
          <p
            style={{
              fontFamily: "var(--font-geist), sans-serif",
              fontSize: 15,
              color: "var(--b-paper-60)",
              lineHeight: 1.6,
              maxWidth: 560,
              marginBottom: 56,
            }}
          >
            Groq-powered AI scans live market data to build your cheapest subscription stack — and shows hosts where demand is highest.
          </p>

          <div className="grid-2" style={{ alignItems: "start" }}>
            {/* Bundle Optimizer */}
            <BundleOptimizer />

            {/* Demand Intel */}
            <div
              style={{
                background: "var(--b-ink-3)",
                border: "1px solid var(--b-rule)",
                padding: "32px 28px",
                display: "flex",
                flexDirection: "column",
                gap: 0,
              }}
            >
              <p className="b-eyebrow" style={{ marginBottom: 10 }}>AI Pool Ideas · Live Demand</p>
              <p
                className="b-serif"
                style={{
                  fontSize: 28,
                  lineHeight: 1.1,
                  color: "var(--b-paper)",
                  marginBottom: 28,
                }}
              >
                Where hosts{" "}
                <em style={{ color: "var(--b-gold)", fontStyle: "italic" }}>make money</em>{" "}
                right now.
              </p>
              <DemandIntel />
            </div>
          </div>
        </div>
      </section>

      <BFooter />
    </div>
  );
}
