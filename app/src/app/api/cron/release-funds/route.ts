/**
 * POST /api/cron/release-funds
 *
 * Scans all active pools on-chain and flags any where nextChargeAt < now.
 * These "overdue" flags are written to Redis so the host dashboard can surface
 * an action-required banner.
 *
 * Cannot auto-sign releaseFunds — the on-chain instruction requires the host
 * as a signer. This cron is a notification/monitoring layer only; the host
 * must visit the dashboard and sign the transaction themselves.
 *
 * Authentication: Bearer token via CRON_SECRET env var.
 * Vercel cron: configured in vercel.json to run every hour.
 */

import { type NextRequest } from "next/server";
import { Redis } from "@upstash/redis";
import { Connection } from "@solana/web3.js";
import { AnchorProvider, Program } from "@coral-xyz/anchor";
import { IDL, type Poolly } from "@/lib/idl";

/* ── Redis ── */
function getRedis(): Redis | null {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return null;
  return new Redis({ url, token });
}

/** Redis key for overdue flags: set of pool addresses awaiting fund release */
const OVERDUE_KEY = "overdue_pools";

/** Fetch all active pools, return those where nextChargeAt is in the past */
async function findOverduePools() {
  const rpcUrl = (
    process.env.NEXT_PUBLIC_RPC_URL ?? "https://api.devnet.solana.com"
  ).trim();

  const connection = new Connection(rpcUrl);
  const provider = new AnchorProvider(connection, {} as never, {});
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const program = new Program<Poolly>(IDL, provider);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const allPools: any[] = await (program.account as any).pool.all();

  const nowSec = Math.floor(Date.now() / 1000);

  return allPools
    .filter((p) => {
      const isActive = "active" in (p.account.status ?? {});
      const nextCharge = p.account.nextChargeAt?.toNumber?.() ?? 0;
      return isActive && nextCharge > 0 && nextCharge < nowSec;
    })
    .map((p) => ({
      address: p.publicKey.toBase58() as string,
      host: p.account.host.toBase58() as string,
      title: p.account.title as string,
      nextChargeAt: p.account.nextChargeAt.toNumber() as number,
      overdueByHours: Math.floor((nowSec - p.account.nextChargeAt.toNumber()) / 3600),
    }));
}

export async function POST(request: NextRequest) {
  /* ── Auth ── */
  const secret = process.env.CRON_SECRET?.trim();
  const authHeader = request.headers.get("authorization") ?? "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;

  // In production the secret must be set and must match.
  // In dev (no secret configured) allow the call through for easy testing.
  if (secret && token !== secret) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  let overdue: Awaited<ReturnType<typeof findOverduePools>> = [];
  let scanError: string | null = null;

  try {
    overdue = await findOverduePools();
  } catch (err) {
    scanError = err instanceof Error ? err.message : String(err);
  }

  /* ── Persist overdue set to Redis ── */
  const redis = getRedis();
  if (redis && overdue.length > 0) {
    // Store as a JSON blob; overwrite previous scan result
    await redis.set(
      OVERDUE_KEY,
      JSON.stringify(
        overdue.map((p) => ({
          address: p.address,
          host: p.host,
          title: p.title,
          nextChargeAt: p.nextChargeAt,
        }))
      ),
      { ex: 60 * 60 * 6 } // expire in 6 h; next cron run will refresh
    );
  } else if (redis && overdue.length === 0 && !scanError) {
    // All clear — clear any stale overdue flags
    await redis.del(OVERDUE_KEY);
  }

  const result = {
    scannedAt: new Date().toISOString(),
    overduePools: overdue.length,
    scanError,
    pools: overdue,
  };

  console.log("[cron/release-funds]", result);
  return Response.json(result);
}

/* ── Also expose GET for Vercel cron (it uses GET by default) ── */
export async function GET(request: NextRequest) {
  return POST(request);
}
