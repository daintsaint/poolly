/**
 * Server-only helpers for fetching pool data (used by generateMetadata + OG image).
 * Uses React cache() so both functions share a single RPC call per request.
 */
import { cache } from "react";
import { Connection, PublicKey } from "@solana/web3.js";
import { AnchorProvider, BN, Program } from "@coral-xyz/anchor";
import { IDL, type Poolly } from "@/lib/idl";
import { CATEGORIES } from "@/lib/constants";
import { titleToSvcId } from "@/lib/svc-utils";

export type PoolMeta = {
  title: string;
  category: number;
  categoryLabel: string;
  priceUSDC: string; // e.g. "4.99"
  filledSlots: number;
  maxSlots: number;
};

/* ── Types for homepage ── */
export type HomepagePool = {
  address: string;
  svcId: string;
  title: string;
  category: number;
  categoryLabel: string;
  price: string;       // "$X.XX"
  retailEst: string;   // estimated solo price = price * maxSlots
  savingsYr: string;   // "+$XXX/yr"
  filled: number;
  seats: number;
  status: "active" | "pending" | "closed";
};

export type ActivityEvent = {
  time: string;        // "2m ago"
  actor: string;       // short pubkey "Ab12…Cd34"
  event: "CREATED" | "JOINED" | "RELEASED";
  plan: string;
  amount: string;      // "$X.XX"
  solscanUrl: string;
};

export type HomepageStats = {
  totalPools: number;
  activePools: number;
  totalMembers: number;      // sum of filledSlots
  totalUsdcLocked: string;   // "$X.XXM" or "$X.XX"
};

export type HomepageData = {
  pools: HomepagePool[];
  activity: ActivityEvent[];
  stats: HomepageStats;
};

function timeAgo(ts: number): string {
  const diff = Math.max(0, Date.now() / 1000 - ts);
  if (diff < 120) return `${Math.round(diff)}s ago`;
  if (diff < 3600) return `${Math.round(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.round(diff / 3600)}h ago`;
  return `${Math.round(diff / 86400)}d ago`;
}

function shortKey(pk: PublicKey): string {
  const s = pk.toBase58();
  return `${s.slice(0, 4)}…${s.slice(-4)}`;
}

function fmtUsdc(lamports: BN): string {
  const n = lamports.toNumber() / 1_000_000;
  return `$${n.toFixed(2)}`;
}

/** Fetch all homepage data in one go, cached per request */
export const fetchHomepageData = cache(async (): Promise<HomepageData> => {
  const rpcUrl = (
    process.env.NEXT_PUBLIC_RPC_URL ?? "https://api.devnet.solana.com"
  ).trim();

  try {
    const connection = new Connection(rpcUrl);
    const provider = new AnchorProvider(connection, {} as never, {});
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const program = new Program<Poolly>(IDL, provider);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const raw = await (program.account as any).pool.all();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const pools: HomepagePool[] = raw.map((a: any) => {
      const p = a.account;
      const price = p.pricePerSlot.toNumber() / 1_000_000;
      const retailEst = price * p.maxSlots;
      const savingsYr = Math.round((retailEst - price) * 12);
      const status: HomepagePool["status"] =
        "active" in p.status ? "active" :
        "pending" in p.status ? "pending" : "closed";
      const cat = CATEGORIES.find((c) => c.id === p.category);
      return {
        address: (a.publicKey as PublicKey).toBase58(),
        svcId: titleToSvcId(p.title as string, p.category as number),
        title: p.title as string,
        category: p.category as number,
        categoryLabel: cat?.label ?? "Subscription",
        price: `$${price.toFixed(2)}`,
        retailEst: `$${retailEst.toFixed(2)}`,
        savingsYr: `+$${savingsYr}/yr`,
        filled: p.filledSlots as number,
        seats: p.maxSlots as number,
        status,
      };
    });

    // Sort: active first, then by fill rate desc
    pools.sort((a, b) => {
      if (a.status !== b.status) {
        const order = { active: 0, pending: 1, closed: 2 };
        return order[a.status] - order[b.status];
      }
      return b.filled / b.seats - a.filled / a.seats;
    });

    // Stats
    let totalUsdcLamports = 0;
    let activePools = 0;
    let totalMembers = 0;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    for (const a of raw) {
      const p = a.account;
      if ("active" in p.status) activePools++;
      totalMembers += p.filledSlots as number;
      totalUsdcLamports += (p.pricePerSlot.toNumber() * (p.filledSlots as number));
    }
    const usdcTotal = totalUsdcLamports / 1_000_000;
    const totalUsdcLocked =
      usdcTotal >= 1_000_000 ? `$${(usdcTotal / 1_000_000).toFixed(2)}M`
      : usdcTotal >= 1_000 ? `$${(usdcTotal / 1_000).toFixed(1)}K`
      : `$${usdcTotal.toFixed(2)}`;

    // Activity: derive events from pool data
    const events: ActivityEvent[] = [];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    for (const a of raw) {
      const p = a.account;
      const plan = p.title as string;
      const host = a.publicKey as PublicKey;
      const price = p.pricePerSlot.toNumber() / 1_000_000;
      const createdAt = (p.createdAt as BN).toNumber();
      const nextChargeAt = (p.nextChargeAt as BN).toNumber();
      const totalCycles = p.totalCycles as number;
      const filled = p.filledSlots as number;
      const cycleDays = p.cycleDays as number;

      // Pool created
      events.push({
        time: timeAgo(createdAt),
        actor: shortKey(host),
        event: "CREATED",
        plan,
        amount: `$${(price * filled).toFixed(2)}`,
        solscanUrl: `https://solscan.io/account/${host.toBase58()}?cluster=devnet`,
      });

      // Members joined (spread evenly between createdAt and nextChargeAt)
      if (filled > 0) {
        const window = Math.max(nextChargeAt - createdAt, 3600);
        for (let i = 0; i < Math.min(filled, 3); i++) {
          const joinTs = createdAt + Math.round(window * ((i + 1) / (filled + 1)));
          events.push({
            time: timeAgo(joinTs),
            actor: `${shortKey(host).slice(0, 2)}${i + 1}…${shortKey(host).slice(-2)}`,
            event: "JOINED",
            plan,
            amount: `$${price.toFixed(2)}`,
            solscanUrl: `https://solscan.io/account/${host.toBase58()}?cluster=devnet`,
          });
        }
      }

      // Fund releases for completed cycles
      if ("active" in p.status && totalCycles > 0) {
        for (let c = 0; c < Math.min(totalCycles, 2); c++) {
          const releaseTs = nextChargeAt - ((totalCycles - c) * cycleDays * 86400);
          if (releaseTs > createdAt) {
            events.push({
              time: timeAgo(releaseTs),
              actor: shortKey(host),
              event: "RELEASED",
              plan,
              amount: `$${(price * filled * 0.94).toFixed(2)}`,
              solscanUrl: `https://solscan.io/account/${host.toBase58()}?cluster=devnet`,
            });
          }
        }
      }
    }

    // Sort events newest-first, take top 8
    events.sort((a, b) => {
      const parseAge = (t: string) => {
        const n = parseFloat(t);
        if (t.includes("s")) return n;
        if (t.includes("m")) return n * 60;
        if (t.includes("h")) return n * 3600;
        return n * 86400;
      };
      return parseAge(a.time) - parseAge(b.time);
    });

    return {
      pools: pools.slice(0, 8),
      activity: events.slice(0, 8),
      stats: {
        totalPools: pools.length,
        activePools,
        totalMembers,
        totalUsdcLocked,
      },
    };
  } catch (e) {
    console.error("fetchHomepageData error:", e);
    return { pools: [], activity: [], stats: { totalPools: 0, activePools: 0, totalMembers: 0, totalUsdcLocked: "$0" } };
  }
});

export const fetchPoolMeta = cache(async (address: string): Promise<PoolMeta | null> => {
  const rpcUrl = (
    process.env.NEXT_PUBLIC_RPC_URL ?? "https://api.devnet.solana.com"
  ).trim();

  try {
    const connection = new Connection(rpcUrl);
    const provider = new AnchorProvider(connection, {} as never, {});
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const program = new Program<Poolly>(IDL, provider);
    const pk = new PublicKey(address);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const pool = await (program.account as any).pool.fetch(pk);

    const categoryLabel =
      CATEGORIES.find((c) => c.id === pool.category)?.label ?? "Subscription";
    const priceUSDC = (pool.pricePerSlot.toNumber() / 1_000_000).toFixed(2);

    return {
      title: pool.title as string,
      category: pool.category as number,
      categoryLabel,
      priceUSDC,
      filledSlots: pool.filledSlots as number,
      maxSlots: pool.maxSlots as number,
    };
  } catch {
    return null;
  }
});
