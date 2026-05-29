/**
 * AI override/skip logging backed by Upstash Redis.
 *
 * GET  /api/log-override?pool=<address>                          → { overrides: OverrideEntry[] }
 * POST /api/log-override { pool, wallet, reason, proofUri? }     → { ok: true }
 *
 * Stored as a Redis list at key `overrides:<pool>`, capped at 50 entries (LPUSH + LTRIM).
 */

import { Redis } from "@upstash/redis";
import { type NextRequest } from "next/server";
import { profileLimiter, getIp } from "@/lib/ratelimit";

export interface OverrideEntry {
  wallet: string;
  reason: string;
  timestamp: string;
  proofUri?: string;
}

function getRedis(): Redis | null {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return null;
  return new Redis({ url, token });
}

/** In-process fallback for local dev */
const localStore = new Map<string, OverrideEntry[]>();

const KEY = (pool: string) => `overrides:${pool}`;
const MAX_ENTRIES = 50;

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const pool = searchParams.get("pool")?.trim();

  if (!pool) {
    return Response.json({ error: "pool param required" }, { status: 400 });
  }

  const redis = getRedis();
  if (redis) {
    const raw = await redis.lrange<string>(KEY(pool), 0, MAX_ENTRIES - 1);
    const overrides = raw.map((item) => {
      if (typeof item === "string") {
        try { return JSON.parse(item) as OverrideEntry; } catch { return item as unknown as OverrideEntry; }
      }
      return item as unknown as OverrideEntry;
    });
    return Response.json({ overrides });
  } else {
    return Response.json({ overrides: localStore.get(pool) ?? [] });
  }
}

export async function POST(request: NextRequest) {
  const { success } = await profileLimiter.limit(getIp(request));
  if (!success) {
    return Response.json({ error: "Too many requests" }, { status: 429 });
  }

  const body = (await request.json()) as {
    pool?: string;
    wallet?: string;
    reason?: string;
    proofUri?: string;
  };

  const pool = body.pool?.trim();
  const wallet = body.wallet?.trim();
  const reason = body.reason?.trim();

  if (!pool || !wallet || !reason) {
    return Response.json({ error: "pool, wallet, and reason required" }, { status: 400 });
  }

  const entry: OverrideEntry = {
    wallet,
    reason,
    timestamp: new Date().toISOString(),
    ...(body.proofUri ? { proofUri: body.proofUri } : {}),
  };

  const redis = getRedis();
  if (redis) {
    const key = KEY(pool);
    await redis.lpush(key, JSON.stringify(entry));
    await redis.ltrim(key, 0, MAX_ENTRIES - 1);
  } else {
    if (!localStore.has(pool)) localStore.set(pool, []);
    const list = localStore.get(pool)!;
    list.unshift(entry);
    if (list.length > MAX_ENTRIES) list.splice(MAX_ENTRIES);
  }

  return Response.json({ ok: true });
}
