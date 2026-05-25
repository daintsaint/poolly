"use client";

import Link from "next/link";
import { CATEGORIES } from "@/lib/constants";
import { formatUsdc, isPoolActive, isPoolPending, type PoolAccount } from "@/lib/poolly-client";

const CATEGORY_RETAIL: Record<number, number> = {
  0: 22,  // Streaming  (Netflix Premium ~$22)
  1: 28,  // Productivity (M365 ~$28)
  2: 40,  // Fitness
  3: 50,  // Local Services
  4: 60,  // Professional Tools
  5: 20,  // Other
};

type Props = { pool: PoolAccount };

export function PoolCard({ pool }: Props) {
  const category   = CATEGORIES.find((c) => c.id === pool.category) ?? CATEGORIES[5];
  const slotsLeft  = pool.maxSlots - pool.filledSlots;
  const fillPct    = Math.round((pool.filledSlots / pool.maxSlots) * 100);
  const active     = isPoolActive(pool);
  const pending    = isPoolPending(pool);
  const priceUsd   = pool.pricePerSlot.toNumber() / 1_000_000;
  const retail     = CATEGORY_RETAIL[pool.category] ?? 20;
  const savings    = Math.max(0, Math.round(((retail - priceUsd) / retail) * 100));

  return (
    <Link
      href={`/pools/${pool.publicKey.toBase58()}`}
      className="card group block p-5 space-y-4"
      style={{ textDecoration: "none" }}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-3">
          <div className="h-11 w-11 rounded-2xl flex items-center justify-center text-2xl shrink-0"
            style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}>
            {category.icon}
          </div>
          <div className="min-w-0">
            <p className="font-semibold text-white leading-tight truncate group-hover:text-violet-300 transition-colors text-[15px]">
              {pool.title}
            </p>
            <p className="text-xs mt-0.5" style={{ color: "var(--text-3)" }}>{category.label}</p>
          </div>
        </div>

        <span className={`pill shrink-0 ${active ? "pill-active" : pending ? "pill-pending" : "pill-closed"}`}>
          <span className={`w-1.5 h-1.5 rounded-full ${active ? "bg-emerald-400 pulse-ring" : pending ? "bg-amber-400" : "bg-slate-500"}`}/>
          {active ? "Active" : pending ? "Pending" : "Closed"}
        </span>
      </div>

      {/* Price + savings */}
      <div className="flex items-end justify-between">
        <div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl font-bold text-white">{formatUsdc(pool.pricePerSlot)}</span>
            <span className="text-sm" style={{ color: "var(--text-3)" }}>USDC</span>
          </div>
          <p className="text-xs mt-0.5" style={{ color: "var(--text-3)" }}>
            per person · every {pool.cycleDays}d
          </p>
        </div>

        {savings > 5 && (
          <div className="text-right">
            <span className="inline-block px-2.5 py-1 rounded-lg text-xs font-bold"
              style={{ background: "rgba(16,185,129,0.12)", border: "1px solid rgba(16,185,129,0.25)", color: "#34d399" }}>
              Save {savings}%
            </span>
            <p className="text-xs mt-0.5" style={{ color: "var(--text-3)" }}>vs ~${retail}/mo</p>
          </div>
        )}
      </div>

      {/* Fill bar */}
      <div className="space-y-2">
        <div className="flex justify-between text-xs" style={{ color: "var(--text-3)" }}>
          <span>{pool.filledSlots}/{pool.maxSlots} members</span>
          <span>{slotsLeft > 0 ? `${slotsLeft} spot${slotsLeft !== 1 ? "s" : ""} left` : "Full"}</span>
        </div>
        <div className="fill-track">
          <div className="fill-bar" style={{ width: `${fillPct}%` }}/>
        </div>
      </div>
    </Link>
  );
}
