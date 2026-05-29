/**
 * Waitlist persistence backed by Upstash Redis.
 *
 * GET  /api/waitlist?pool=<address>&wallet=<address>  → { count: number, joined: boolean }
 * POST /api/waitlist  { pool, wallet }                → { ok: true, count: number }
 * DELETE /api/waitlist { pool, wallet }               → { ok: true }
 */

import { Redis } from "@upstash/redis";
import { type NextRequest } from "next/server";
import { profileLimiter, getIp } from "@/lib/ratelimit";

function getRedis(): Redis | null {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return null;
  return new Redis({ url, token });
}

/** In-process fallback for local dev */
const localStore = new Map<string, Set<string>>();

const KEY = (pool: string) => `waitlist:${pool}`;

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const pool = searchParams.get("pool")?.trim();
  const wallet = searchParams.get("wallet")?.trim() ?? "";

  if (!pool) {
    return Response.json({ error: "pool param required" }, { status: 400 });
  }

  const redis = getRedis();
  if (redis) {
    const [count, joined] = await Promise.all([
      redis.scard(KEY(pool)),
      wallet ? redis.sismember(KEY(pool), wallet) : Promise.resolve(0),
    ]);
    return Response.json({ count, joined: joined === 1 });
  } else {
    const set = localStore.get(pool) ?? new Set<string>();
    return Response.json({ count: set.size, joined: wallet ? set.has(wallet) : false });
  }
}

export async function POST(request: NextRequest) {
  const { success } = await profileLimiter.limit(getIp(request));
  if (!success) {
    return Response.json({ error: "Too many requests" }, { status: 429 });
  }

  const body = (await request.json()) as { pool?: string; wallet?: string };
  const pool = body.pool?.trim();
  const wallet = body.wallet?.trim();

  if (!pool || !wallet) {
    return Response.json({ error: "pool and wallet required" }, { status: 400 });
  }

  const redis = getRedis();
  if (redis) {
    await redis.sadd(KEY(pool), wallet);
    const count = await redis.scard(KEY(pool));
    return Response.json({ ok: true, count });
  } else {
    if (!localStore.has(pool)) localStore.set(pool, new Set());
    localStore.get(pool)!.add(wallet);
    return Response.json({ ok: true, count: localStore.get(pool)!.size });
  }
}

export async function DELETE(request: NextRequest) {
  const { success } = await profileLimiter.limit(getIp(request));
  if (!success) {
    return Response.json({ error: "Too many requests" }, { status: 429 });
  }

  const body = (await request.json()) as { pool?: string; wallet?: string };
  const pool = body.pool?.trim();
  const wallet = body.wallet?.trim();

  if (!pool || !wallet) {
    return Response.json({ error: "pool and wallet required" }, { status: 400 });
  }

  const redis = getRedis();
  if (redis) {
    await redis.srem(KEY(pool), wallet);
  } else {
    localStore.get(pool)?.delete(wallet);
  }

  return Response.json({ ok: true });
}
