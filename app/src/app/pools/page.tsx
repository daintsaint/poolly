"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useConnection } from "@solana/wallet-adapter-react";
import { PoolCard } from "@/components/pool-card";
import { fetchAllPools, type PoolAccount } from "@/lib/poolly-client";
import { CATEGORIES } from "@/lib/constants";
import Link from "next/link";

export default function PoolsPage() {
  return (
    <Suspense>
      <PoolsInner />
    </Suspense>
  );
}

function PoolsInner() {
  const { connection } = useConnection();
  const searchParams   = useSearchParams();
  const initialCat     = searchParams.get("category") ? Number(searchParams.get("category")) : null;

  const [pools, setPools]       = useState<PoolAccount[]>([]);
  const [loading, setLoading]   = useState(true);
  const [category, setCategory] = useState<number | null>(initialCat);
  const [sortBy, setSortBy]     = useState<"newest" | "price_asc" | "price_desc" | "fill">("newest");

  useEffect(() => {
    fetchAllPools(connection)
      .then(setPools)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [connection]);

  const filtered = (category === null ? pools : pools.filter((p) => p.category === category))
    .filter((p) => !("closed" in p.status))
    .sort((a, b) => {
      if (sortBy === "price_asc") return a.pricePerSlot.toNumber() - b.pricePerSlot.toNumber();
      if (sortBy === "price_desc") return b.pricePerSlot.toNumber() - a.pricePerSlot.toNumber();
      if (sortBy === "fill") return (b.filledSlots / b.maxSlots) - (a.filledSlots / a.maxSlots);
      return b.createdAt.toNumber() - a.createdAt.toNumber();
    });

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 space-y-8">

      {/* Page header */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-white">Browse Plans</h1>
          <p className="text-sm mt-1" style={{ color: "var(--text-2)" }}>
            {loading ? "Loading…" : `${filtered.length} active plan${filtered.length !== 1 ? "s" : ""}`}
          </p>
        </div>
        <Link href="/pools/create" className="btn-primary flex items-center gap-2 px-5 py-2.5 text-sm self-start sm:self-auto">
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <path d="M6 1v10M1 6h10" stroke="white" strokeWidth="2" strokeLinecap="round"/>
          </svg>
          Share a Plan
        </Link>
      </div>

      {/* Filters row */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex gap-2 flex-wrap flex-1">
          <button
            onClick={() => setCategory(null)}
            className="pill transition-all"
            style={{
              background: category === null ? "rgba(124,58,237,0.2)" : "rgba(255,255,255,0.04)",
              borderColor: category === null ? "rgba(124,58,237,0.5)" : "rgba(255,255,255,0.08)",
              color: category === null ? "#c084fc" : "var(--text-2)",
              padding: "5px 14px", fontSize: "13px", fontWeight: 500,
            }}
          >
            All
          </button>
          {CATEGORIES.map((c) => (
            <button
              key={c.id}
              onClick={() => setCategory(c.id)}
              className="pill transition-all"
              style={{
                background: category === c.id ? "rgba(124,58,237,0.2)" : "rgba(255,255,255,0.04)",
                borderColor: category === c.id ? "rgba(124,58,237,0.5)" : "rgba(255,255,255,0.08)",
                color: category === c.id ? "#c084fc" : "var(--text-2)",
                padding: "5px 14px", fontSize: "13px", fontWeight: 500,
              }}
            >
              {c.icon} {c.label}
            </button>
          ))}
        </div>

        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
          className="text-sm rounded-xl px-3 py-2 outline-none"
          style={{
            background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)",
            color: "var(--text-2)", cursor: "pointer",
          }}
        >
          <option value="newest">Newest first</option>
          <option value="price_asc">Price: low → high</option>
          <option value="price_desc">Price: high → low</option>
          <option value="fill">Most filled</option>
        </select>
      </div>

      {/* Grid */}
      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-64 rounded-2xl animate-pulse"
              style={{ background: "rgba(255,255,255,0.04)" }}/>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-2xl py-20 text-center"
          style={{ border: "1px dashed rgba(255,255,255,0.08)" }}>
          <p className="text-4xl mb-3">🌊</p>
          <p className="font-semibold text-white">No plans found</p>
          <p className="text-sm mt-1 mb-6" style={{ color: "var(--text-2)" }}>
            Be the first to share one in this category.
          </p>
          <Link href="/pools/create" className="btn-primary inline-flex items-center gap-2 px-6 py-2.5 text-sm">
            Share a Plan
          </Link>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((pool) => (
            <PoolCard key={pool.publicKey.toBase58()} pool={pool} />
          ))}
        </div>
      )}
    </div>
  );
}
