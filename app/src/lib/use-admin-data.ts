"use client";

import { useEffect, useState, useCallback } from "react";
import { Connection } from "@solana/web3.js";
import {
  fetchAllPools,
  fetchPoolMembers,
  isPoolActive,
  isPoolPending,
  type PoolAccount,
  type MemberRecord,
} from "@/lib/poolly-client";

export type AdminStats = {
  totalPools: number;
  activePools: number;
  pendingPools: number;
  closedPools: number;
  totalMembers: number;
  totalFilledSlots: number;
  totalCapacity: number;
  totalUsdcLocked: number;
  totalUsdcPaidOut: number;
  avgFillRate: number;
};

export type AdminData = {
  pools: PoolAccount[];
  membersByPool: Record<string, MemberRecord[]>;
  allMembers: MemberRecord[];
  stats: AdminStats;
  loading: boolean;
  error: string;
  refresh: () => void;
};

const DEVNET_RPC = "https://api.devnet.solana.com";

function computeStats(
  pools: PoolAccount[],
  membersByPool: Record<string, MemberRecord[]>
): AdminStats {
  const totalPools = pools.length;
  const activePools = pools.filter(isPoolActive).length;
  const pendingPools = pools.filter(isPoolPending).length;
  const closedPools = pools.filter((p) => "closed" in p.status).length;

  let totalFilledSlots = 0;
  let totalCapacity = 0;
  let totalUsdcLocked = 0;
  let totalUsdcPaidOut = 0;
  let fillRateSum = 0;

  for (const pool of pools) {
    totalFilledSlots += pool.filledSlots;
    totalCapacity += pool.maxSlots;
    const priceInUsdc = pool.pricePerSlot.toNumber() / 1_000_000;
    totalUsdcLocked += pool.filledSlots * priceInUsdc;
    totalUsdcPaidOut +=
      pool.totalCycles * pool.filledSlots * priceInUsdc * 0.94;
    fillRateSum +=
      pool.maxSlots > 0 ? (pool.filledSlots / pool.maxSlots) * 100 : 0;
  }

  const avgFillRate = totalPools > 0 ? fillRateSum / totalPools : 0;
  const allMembers = Object.values(membersByPool).flat();
  const totalMembers = allMembers.length;

  return {
    totalPools,
    activePools,
    pendingPools,
    closedPools,
    totalMembers,
    totalFilledSlots,
    totalCapacity,
    totalUsdcLocked,
    totalUsdcPaidOut,
    avgFillRate,
  };
}

export function useAdminData(): AdminData {
  const [pools, setPools] = useState<PoolAccount[]>([]);
  const [membersByPool, setMembersByPool] = useState<Record<string, MemberRecord[]>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [tick, setTick] = useState(0);

  const refresh = useCallback(() => setTick((t) => t + 1), []);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError("");

    async function load() {
      try {
        const connection = new Connection(DEVNET_RPC);
        const fetchedPools = await fetchAllPools(connection);

        if (cancelled) return;

        const memberResults = await Promise.all(
          fetchedPools.map((pool) =>
            fetchPoolMembers(connection, pool.publicKey).catch(() => [] as MemberRecord[])
          )
        );

        if (cancelled) return;

        const byPool: Record<string, MemberRecord[]> = {};
        for (let i = 0; i < fetchedPools.length; i++) {
          byPool[fetchedPools[i].publicKey.toString()] = memberResults[i];
        }

        setPools(fetchedPools);
        setMembersByPool(byPool);
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Failed to load data");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => { cancelled = true; };
  }, [tick]);

  const allMembers = Object.values(membersByPool).flat();
  const stats = computeStats(pools, membersByPool);

  return { pools, membersByPool, allMembers, stats, loading, error, refresh };
}
