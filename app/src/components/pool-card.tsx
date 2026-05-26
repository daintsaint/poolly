"use client";

import Link from "next/link";
import { CATEGORIES } from "@/lib/constants";
import { formatUsdc, isPoolActive, isPoolPending, type PoolAccount } from "@/lib/poolly-client";
import { ServiceMark, PoolSlots } from "@/components/vault-ui";
import { titleToSvcId } from "@/lib/svc-utils";
import { useDisplayName, shortWallet } from "@/lib/use-display-name";

const CATEGORY_RETAIL: Record<number, number> = {
  0: 22,
  1: 28,
  2: 40,
  3: 50,
  4: 60,
  5: 20,
};

type Props = { pool: PoolAccount; accent?: boolean };

export function PoolCard({ pool, accent = false }: Props) {
  const category  = CATEGORIES.find((c) => c.id === pool.category) ?? CATEGORIES[5];
  const svcId     = titleToSvcId(pool.title, pool.category);
  const hostWallet = pool.host.toBase58();
  const hostName   = useDisplayName(hostWallet);
  const slotsLeft = pool.maxSlots - pool.filledSlots;
  const active    = isPoolActive(pool);
  const pending   = isPoolPending(pool);
  const priceUsd  = pool.pricePerSlot.toNumber() / 1_000_000;
  const retail    = CATEGORY_RETAIL[pool.category] ?? 20;
  const savings   = Math.max(0, Math.round(((retail - priceUsd) / retail) * 100));

  return (
    <Link
      href={`/pools/${pool.publicKey.toBase58()}`}
      className="lift"
      style={{
        textDecoration: "none",
        display: "flex",
        flexDirection: "column",
        gap: 16,
        padding: 24,
        background: accent ? "var(--b-paper)" : "var(--b-ink-3)",
        border: `1px solid ${accent ? "transparent" : "var(--b-rule)"}`,
        minHeight: 220,
      }}
    >
      {/* Top row */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
        <ServiceMark id={svcId} size={40} radius={0} />
        <span
          style={{
            fontFamily: "var(--font-geist-mono), monospace",
            fontSize: 9.5,
            color: accent ? "rgba(12,11,9,0.55)" : "var(--b-gold)",
            letterSpacing: "0.18em",
            textTransform: "uppercase",
            border: `1px solid ${accent ? "rgba(12,11,9,0.12)" : "rgba(201,162,79,0.28)"}`,
            padding: "2px 7px",
          }}
        >
          {category.label}
        </span>
      </div>

      {/* Name + host */}
      <div>
        <p
          className="b-serif"
          style={{
            fontSize: 28,
            lineHeight: 1.1,
            color: accent ? "var(--b-ink)" : "var(--b-paper)",
            marginBottom: 4,
            overflow: "hidden",
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical",
          }}
        >
          {pool.title}
        </p>
        <p
          style={{
            fontFamily: "var(--font-geist-mono), monospace",
            fontSize: 10.5,
            color: accent ? "rgba(12,11,9,0.45)" : "var(--b-paper-40)",
            letterSpacing: "0.08em",
            textTransform: "uppercase",
          }}
        >
          HOST · {hostName ?? shortWallet(hostWallet)}
        </p>
      </div>

      {/* Price + slots */}
      <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", marginTop: "auto" }}>
        <div>
          <p
            style={{
              fontFamily: "var(--font-geist-mono), monospace",
              fontSize: 9.5,
              color: accent ? "rgba(12,11,9,0.45)" : "var(--b-paper-40)",
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
            {formatUsdc(pool.pricePerSlot)}
          </p>
          {savings > 5 && (
            <p
              style={{
                fontFamily: "var(--font-geist-mono), monospace",
                fontSize: 10,
                color: accent ? "rgba(12,11,9,0.55)" : "var(--b-paper-40)",
                marginTop: 3,
              }}
            >
              VS RETAIL ${retail} · SAVE {savings}%
            </p>
          )}
        </div>
        <div style={{ textAlign: "right" }}>
          <PoolSlots filled={pool.filledSlots} total={pool.maxSlots} size={14} gap={4} />
          <p
            style={{
              fontFamily: "var(--font-geist-mono), monospace",
              fontSize: 9.5,
              color: accent ? "rgba(12,11,9,0.45)" : "var(--b-paper-40)",
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              marginTop: 4,
            }}
          >
            {slotsLeft > 0 && (active || pending)
              ? `${slotsLeft} OPEN`
              : active || pending ? "FULL" : "CLOSED"}
          </p>
        </div>
      </div>
    </Link>
  );
}
