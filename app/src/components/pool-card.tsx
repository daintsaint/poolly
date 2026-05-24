"use client";

import Link from "next/link";
import { CATEGORIES } from "@/lib/constants";
import { formatUsdc, isPoolActive, isPoolPending, type PoolAccount } from "@/lib/poolly-client";

type Props = { pool: PoolAccount };

export function PoolCard({ pool }: Props) {
  const category = CATEGORIES.find((c) => c.id === pool.category) ?? CATEGORIES[5];
  const slotsLeft = pool.maxSlots - pool.filledSlots;
  const fillPct = Math.round((pool.filledSlots / pool.maxSlots) * 100);
  const active = isPoolActive(pool);
  const pending = isPoolPending(pool);

  return (
    <Link
      href={`/pools/${pool.publicKey.toBase58()}`}
      className="group flex flex-col gap-3 rounded-xl border border-slate-800 bg-slate-900 p-4 hover:border-indigo-600 transition-colors"
    >
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2">
          <span className="text-2xl">{category.icon}</span>
          <div>
            <p className="font-semibold text-white group-hover:text-indigo-300 transition-colors line-clamp-1">
              {pool.title}
            </p>
            <p className="text-xs text-slate-500">{category.label}</p>
          </div>
        </div>
        <span
          className={`rounded-full px-2 py-0.5 text-xs font-medium ${
            active
              ? "bg-green-900/50 text-green-400"
              : pending
              ? "bg-yellow-900/50 text-yellow-400"
              : "bg-slate-800 text-slate-500"
          }`}
        >
          {active ? "Active" : pending ? "Pending" : "Closed"}
        </span>
      </div>

      <div className="flex items-center justify-between text-sm">
        <span className="text-slate-400">
          <span className="text-white font-medium">
            {formatUsdc(pool.pricePerSlot)} USDC
          </span>{" "}
          / month
        </span>
        <span className="text-slate-500">
          {slotsLeft} slot{slotsLeft !== 1 ? "s" : ""} left
        </span>
      </div>

      <div className="space-y-1">
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-800">
          <div
            className="h-full rounded-full bg-indigo-600 transition-all"
            style={{ width: `${fillPct}%` }}
          />
        </div>
        <p className="text-xs text-slate-600">
          {pool.filledSlots}/{pool.maxSlots} members · every {pool.cycleDays} days
        </p>
      </div>
    </Link>
  );
}
