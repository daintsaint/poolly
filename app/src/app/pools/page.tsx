"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useConnection } from "@solana/wallet-adapter-react";
import { PoolCard } from "@/components/pool-card";
import { fetchAllPools, type PoolAccount } from "@/lib/poolly-client";
import { CATEGORIES } from "@/lib/constants";
import { BNav, BTicker, BFooter, ServiceMark, PoolSlots } from "@/components/vault-ui";
import Link from "next/link";

export default function PoolsPage() {
  return (
    <Suspense>
      <PoolsInner />
    </Suspense>
  );
}

/* ─── static placeholder pool shapes for featured section ─── */
const FEATURED_PLACEHOLDER = [
  {
    id: "netflix",
    name: "Netflix Premium",
    price: "$4.99",
    retail: "$22.99",
    host: "maya.sol",
    filled: 3,
    total: 4,
    savings: "78%",
    waitlist: 2,
  },
  {
    id: "ms365",
    name: "Microsoft 365",
    price: "$1.69",
    retail: "$29.99",
    host: "eli.sol",
    filled: 6,
    total: 6,
    savings: "94%",
    waitlist: 7,
  },
];

function PoolsInner() {
  const { connection } = useConnection();
  const searchParams   = useSearchParams();
  const initialCat     = searchParams.get("category") ? Number(searchParams.get("category")) : null;

  const [pools, setPools]       = useState<PoolAccount[]>([]);
  const [loading, setLoading]   = useState(true);
  const [category, setCategory] = useState<number | null>(initialCat);
  const [sortBy, setSortBy]     = useState<"newest" | "price_asc" | "price_desc" | "fill">("newest");
  const [search, setSearch]     = useState("");

  useEffect(() => {
    fetchAllPools(connection)
      .then(setPools)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [connection]);

  const filtered = (category === null ? pools : pools.filter((p) => p.category === category))
    .filter((p) => !("closed" in p.status))
    .filter((p) => search ? p.title.toLowerCase().includes(search.toLowerCase()) : true)
    .sort((a, b) => {
      if (sortBy === "price_asc")  return a.pricePerSlot.toNumber() - b.pricePerSlot.toNumber();
      if (sortBy === "price_desc") return b.pricePerSlot.toNumber() - a.pricePerSlot.toNumber();
      if (sortBy === "fill")       return (b.filledSlots / b.maxSlots) - (a.filledSlots / a.maxSlots);
      return b.createdAt.toNumber() - a.createdAt.toNumber();
    });

  return (
    <div style={{ background: "var(--b-ink)", minHeight: "100vh" }}>
      <BNav />
      <BTicker />

      {/* ── Hero header ── */}
      <section style={{ background: "var(--b-ink)", borderBottom: "1px solid var(--b-rule)", padding: "56px 40px 40px" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 32 }}>
          <div>
            <p className="b-eyebrow" style={{ marginBottom: 16 }}>
              THE CATALOG · {loading ? "…" : filtered.length} POOLS OPEN
            </p>
            <h1
              className="b-serif"
              style={{
                fontSize: "clamp(48px, 7vw, 104px)",
                lineHeight: 0.95,
                color: "var(--b-paper)",
                letterSpacing: "-0.03em",
              }}
            >
              What would you{" "}
              <em style={{ color: "var(--b-gold)", fontStyle: "italic" }}>like</em>{" "}
              to split?
            </h1>
          </div>

          {/* Search */}
          <div
            style={{
              position: "relative",
              width: 280,
              flexShrink: 0,
            }}
          >
            <input
              type="text"
              placeholder="Search plans…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{
                width: "100%",
                background: "var(--b-ink-2)",
                border: "1px solid var(--b-paper-20)",
                borderRadius: 0,
                padding: "11px 40px 11px 14px",
                fontFamily: "var(--font-geist), sans-serif",
                fontSize: 14,
                color: "var(--b-paper)",
                outline: "none",
                boxSizing: "border-box",
              }}
            />
            <span
              style={{
                position: "absolute",
                right: 12,
                top: "50%",
                transform: "translateY(-50%)",
                fontFamily: "var(--font-geist-mono), monospace",
                fontSize: 10,
                color: "var(--b-paper-40)",
                letterSpacing: "0.08em",
                pointerEvents: "none",
              }}
            >
              ⌘K
            </span>
          </div>
        </div>
      </section>

      {/* ── Filter bar ── */}
      <div
        style={{
          background: "var(--b-ink-2)",
          borderBottom: "1px solid var(--b-rule)",
          padding: "0 40px",
        }}
      >
        <div
          style={{
            maxWidth: 1200,
            margin: "0 auto",
            display: "flex",
            alignItems: "center",
            gap: 0,
            height: 52,
          }}
        >
          {/* Category chips */}
          <div style={{ display: "flex", alignItems: "center", gap: 2, flex: 1, overflowX: "auto" }}>
            <button
              onClick={() => setCategory(null)}
              style={{
                background: category === null ? "var(--b-gold)" : "transparent",
                color: category === null ? "var(--b-ink)" : "var(--b-paper-60)",
                border: "none",
                padding: "6px 16px",
                fontFamily: "var(--font-geist-mono), monospace",
                fontSize: 10.5,
                fontWeight: 700,
                letterSpacing: "0.14em",
                textTransform: "uppercase",
                cursor: "pointer",
                transition: "all 0.15s",
              }}
            >
              ALL
            </button>
            {CATEGORIES.map((c) => (
              <button
                key={c.id}
                onClick={() => setCategory(c.id)}
                style={{
                  background: category === c.id ? "var(--b-gold)" : "transparent",
                  color: category === c.id ? "var(--b-ink)" : "var(--b-paper-60)",
                  border: "none",
                  padding: "6px 16px",
                  fontFamily: "var(--font-geist-mono), monospace",
                  fontSize: 10.5,
                  fontWeight: 700,
                  letterSpacing: "0.14em",
                  textTransform: "uppercase",
                  cursor: "pointer",
                  transition: "all 0.15s",
                  whiteSpace: "nowrap",
                }}
              >
                {c.label}
              </button>
            ))}
          </div>

          {/* Sort */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
            style={{
              background: "transparent",
              border: "none",
              borderLeft: "1px solid var(--b-rule)",
              color: "var(--b-paper-60)",
              fontFamily: "var(--font-geist-mono), monospace",
              fontSize: 10.5,
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              padding: "0 20px",
              height: "100%",
              cursor: "pointer",
              outline: "none",
            }}
          >
            <option value="newest">NEWEST</option>
            <option value="price_asc">PRICE ↑</option>
            <option value="price_desc">PRICE ↓</option>
            <option value="fill">FILL %</option>
          </select>
        </div>
      </div>

      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "40px 40px 80px" }}>

        {/* ── Featured row ── */}
        {!loading && (
          <div style={{ marginBottom: 48 }}>
            <p className="b-eyebrow" style={{ marginBottom: 20 }}>FEATURED · OPEN NOW</p>
            <div style={{ display: "grid", gridTemplateColumns: "1.2fr 0.8fr", gap: 1 }}>
              {/* BFeatureCard — large */}
              <Link
                href="/pools"
                style={{ textDecoration: "none" }}
              >
                <div
                  className="lift"
                  style={{
                    background: "var(--b-ink-3)",
                    border: "1px solid rgba(201,162,79,0.3)",
                    padding: "36px 36px 32px",
                    display: "flex",
                    flexDirection: "column",
                    gap: 20,
                    minHeight: 260,
                  }}
                >
                  <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
                    <ServiceMark id={FEATURED_PLACEHOLDER[0].id} size={52} radius={0} />
                    <span className="b-eyebrow">STREAMING · FEATURED</span>
                  </div>
                  <div>
                    <p
                      className="b-serif"
                      style={{ fontSize: 76, lineHeight: 0.9, color: "var(--b-paper)", letterSpacing: "-0.025em" }}
                    >
                      {FEATURED_PLACEHOLDER[0].name}
                    </p>
                  </div>
                  <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", marginTop: "auto" }}>
                    <div>
                      <p className="b-eyebrow" style={{ marginBottom: 4 }}>YOUR SHARE</p>
                      <p className="b-serif" style={{ fontSize: 64, lineHeight: 1, color: "var(--b-gold)" }}>
                        {FEATURED_PLACEHOLDER[0].price}
                      </p>
                      <p style={{ fontFamily: "var(--font-geist-mono), monospace", fontSize: 10.5, color: "var(--b-paper-40)", marginTop: 4 }}>
                        VS RETAIL <span style={{ textDecoration: "line-through" }}>{FEATURED_PLACEHOLDER[0].retail}</span> · SAVE {FEATURED_PLACEHOLDER[0].savings}
                      </p>
                    </div>
                    <PoolSlots filled={FEATURED_PLACEHOLDER[0].filled} total={FEATURED_PLACEHOLDER[0].total} size={18} gap={6} />
                  </div>
                </div>
              </Link>

              {/* BFeatureSmall — full pool */}
              <div
                style={{
                  background: "var(--b-ink-3)",
                  border: "1px solid var(--b-rule)",
                  padding: "28px 28px 24px",
                  display: "flex",
                  flexDirection: "column",
                  gap: 16,
                }}
              >
                <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
                  <ServiceMark id={FEATURED_PLACEHOLDER[1].id} size={40} radius={0} />
                  <span
                    style={{
                      fontFamily: "var(--font-geist-mono), monospace",
                      fontSize: 9.5,
                      color: "var(--b-emerald)",
                      border: "1px solid rgba(92,135,112,0.35)",
                      padding: "2px 8px",
                      letterSpacing: "0.14em",
                      textTransform: "uppercase",
                    }}
                  >
                    FULL · WAITLIST
                  </span>
                </div>
                <div>
                  <p className="b-serif" style={{ fontSize: 32, lineHeight: 1.1, color: "var(--b-paper)", marginBottom: 4 }}>
                    {FEATURED_PLACEHOLDER[1].name}
                  </p>
                  <p style={{ fontFamily: "var(--font-geist-mono), monospace", fontSize: 10.5, color: "var(--b-paper-40)", letterSpacing: "0.08em" }}>
                    HOST · {FEATURED_PLACEHOLDER[1].host}
                  </p>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: "auto" }}>
                  <PoolSlots filled={FEATURED_PLACEHOLDER[1].filled} total={FEATURED_PLACEHOLDER[1].total} size={14} gap={4} />
                  <span style={{ fontFamily: "var(--font-geist-mono), monospace", fontSize: 10, color: "var(--b-paper-40)", letterSpacing: "0.1em" }}>
                    {FEATURED_PLACEHOLDER[1].waitlist} ON WAITLIST
                  </span>
                </div>
                <div style={{ borderTop: "1px solid var(--b-rule)", paddingTop: 16, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <div>
                    <p className="b-eyebrow" style={{ fontSize: 9, marginBottom: 2 }}>YOUR SHARE</p>
                    <p className="b-serif" style={{ fontSize: 28, color: "var(--b-paper)" }}>{FEATURED_PLACEHOLDER[1].price}</p>
                  </div>
                  <button
                    style={{
                      background: "transparent",
                      color: "var(--b-gold)",
                      border: "1px solid rgba(201,162,79,0.35)",
                      padding: "8px 18px",
                      fontFamily: "var(--font-geist-mono), monospace",
                      fontSize: 10.5,
                      fontWeight: 700,
                      letterSpacing: "0.14em",
                      textTransform: "uppercase",
                      cursor: "pointer",
                    }}
                  >
                    JOIN WAITLIST
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── All pools grid ── */}
        {loading ? (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 1 }}>
            {Array.from({ length: 8 }).map((_, i) => (
              <div
                key={i}
                style={{
                  height: 240,
                  background: "var(--b-ink-3)",
                  animation: "pulse 1.5s ease-in-out infinite",
                }}
              />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div
            style={{
              border: "1px dashed var(--b-rule)",
              padding: "80px 40px",
              textAlign: "center",
            }}
          >
            <p className="b-serif" style={{ fontSize: 32, color: "var(--b-paper-60)", marginBottom: 16 }}>
              No plans found.
            </p>
            <p className="b-eyebrow" style={{ marginBottom: 24 }}>
              {category !== null ? "TRY A DIFFERENT CATEGORY" : "BE THE FIRST TO HOST ONE"}
            </p>
            <Link
              href="/pools/create"
              style={{
                background: "var(--b-gold)",
                color: "var(--b-ink)",
                padding: "12px 28px",
                fontFamily: "var(--font-geist-mono), monospace",
                fontSize: 11,
                fontWeight: 700,
                letterSpacing: "0.14em",
                textTransform: "uppercase",
                textDecoration: "none",
                display: "inline-flex",
              }}
            >
              HOST A PLAN →
            </Link>
          </div>
        ) : (
          <>
            <p className="b-eyebrow" style={{ marginBottom: 20 }}>
              ALL PLANS · {filtered.length} AVAILABLE
            </p>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 1 }}>
              {filtered.map((pool, i) => (
                <PoolCard key={pool.publicKey.toBase58()} pool={pool} accent={i === 0} />
              ))}
              {/* Host your own CTA */}
              <Link
                href="/pools/create"
                style={{ textDecoration: "none" }}
              >
                <div
                  style={{
                    border: "1px dashed var(--b-rule)",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    minHeight: 220,
                    gap: 12,
                    padding: 24,
                    textAlign: "center",
                    transition: "border-color 0.2s",
                    cursor: "pointer",
                  }}
                  onMouseEnter={(e) => ((e.currentTarget as HTMLDivElement).style.borderColor = "rgba(201,162,79,0.4)")}
                  onMouseLeave={(e) => ((e.currentTarget as HTMLDivElement).style.borderColor = "var(--b-rule)")}
                >
                  <span style={{ fontSize: 28, color: "var(--b-gold)", opacity: 0.5 }}>+</span>
                  <p className="b-serif" style={{ fontSize: 20, color: "var(--b-paper-60)" }}>Host your own</p>
                  <p className="b-eyebrow" style={{ fontSize: 9.5 }}>START A PLAN →</p>
                </div>
              </Link>
            </div>
          </>
        )}
      </div>

      <BFooter />
    </div>
  );
}
