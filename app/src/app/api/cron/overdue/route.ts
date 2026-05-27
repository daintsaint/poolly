/**
 * GET /api/cron/overdue?host=<pubkey>
 *
 * Returns overdue pools for a specific host (filtered from the Redis set
 * written by the release-funds cron).  Used by the host dashboard to show
 * an action-required banner without an extra RPC call.
 */

import { type NextRequest } from "next/server";
import { Redis } from "@upstash/redis";

function getRedis(): Redis | null {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return null;
  return new Redis({ url, token });
}

const OVERDUE_KEY = "overdue_pools";

type OverdueEntry = {
  address: string;
  host: string;
  title: string;
  nextChargeAt: number;
};

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const host = searchParams.get("host")?.trim();

  const redis = getRedis();
  if (!redis) {
    return Response.json({ overdue: [] });
  }

  const raw = await redis.get<string>(OVERDUE_KEY);
  if (!raw) {
    return Response.json({ overdue: [] });
  }

  let all: OverdueEntry[] = [];
  try {
    all = JSON.parse(raw) as OverdueEntry[];
  } catch {
    return Response.json({ overdue: [] });
  }

  const filtered = host ? all.filter((p) => p.host === host) : all;
  return Response.json({ overdue: filtered });
}
