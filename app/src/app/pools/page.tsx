"use client";

import { useEffect, useState } from "react";
import { useConnection } from "@solana/wallet-adapter-react";
import { PoolCard } from "@/components/pool-card";
import { fetchAllPools, type PoolAccount } from "@/lib/poolly-client";
import { CATEGORIES } from "@/lib/constants";

export default function PoolsPage() {
  const { connection } = useConnection();
  const [pools, setPools] = useState<PoolAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState<number | null>(null);

  useEffect(() => {
    fetchAllPools(connection)
      .then(setPools)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [connection]);

  const filtered = category === null ? pools : pools.filter((p) => p.category === category);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">Browse Pools</h1>
        <span className="text-sm text-slate-500">{filtered.length} pools</span>
      </div>

      {/* Category filter */}
      <div className="flex gap-2 flex-wrap">
        <button
          onClick={() => setCategory(null)}
          className={`rounded-full px-3 py-1 text-sm font-medium transition-colors ${
            category === null
              ? "bg-indigo-600 text-white"
              : "bg-slate-800 text-slate-400 hover:text-white"
          }`}
        >
          All
        </button>
        {CATEGORIES.map((c) => (
          <button
            key={c.id}
            onClick={() => setCategory(c.id)}
            className={`rounded-full px-3 py-1 text-sm font-medium transition-colors ${
              category === c.id
                ? "bg-indigo-600 text-white"
                : "bg-slate-800 text-slate-400 hover:text-white"
            }`}
          >
            {c.icon} {c.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-40 animate-pulse rounded-xl bg-slate-800" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-700 p-16 text-center">
          <p className="text-slate-500">No pools found. Be the first to create one!</p>
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
