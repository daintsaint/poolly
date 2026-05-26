/**
 * Display-name registry backed by Upstash Redis.
 * Falls back to an in-memory Map when UPSTASH_REDIS_REST_URL is not set
 * (local dev without a Redis instance).
 *
 * GET  /api/profile?wallet=<pubkey>          → { displayName: string | null }
 * POST /api/profile  { wallet, displayName } → { ok: true }
 */

import { Redis } from "@upstash/redis";

/* ── Redis client (lazy — only instantiated when env vars are present) ── */
function getRedis(): Redis | null {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return null;
  return new Redis({ url, token });
}

/* ── In-process fallback for local dev ── */
const localStore = new Map<string, string>();

const KEY = (wallet: string) => `dn:${wallet}`;

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const wallet = searchParams.get("wallet")?.trim();
  if (!wallet) {
    return Response.json({ error: "wallet param required" }, { status: 400 });
  }

  const redis = getRedis();
  const displayName = redis
    ? await redis.get<string>(KEY(wallet))
    : (localStore.get(wallet) ?? null);

  return Response.json({ displayName: displayName ?? null });
}

export async function POST(request: Request) {
  const body = (await request.json()) as { wallet?: string; displayName?: string };
  const wallet = body.wallet?.trim();
  const displayName = body.displayName?.trim().slice(0, 32);

  if (!wallet || !displayName) {
    return Response.json({ error: "wallet and displayName required" }, { status: 400 });
  }

  const redis = getRedis();
  if (redis) {
    await redis.set(KEY(wallet), displayName);
  } else {
    localStore.set(wallet, displayName);
  }

  return Response.json({ ok: true });
}
