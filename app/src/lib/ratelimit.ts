/**
 * Rate limiting via Upstash Ratelimit.
 * Falls back to a no-op limiter when Redis env vars are not set (local dev).
 *
 * Usage:
 *   const { success } = await ratelimit.limit(ip);
 *   if (!success) return Response.json({ error: "Too many requests" }, { status: 429 });
 */

import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

type LimitResult = { success: boolean; remaining: number };

/** No-op limiter used in local dev (always allows) */
const noopLimiter = {
  limit: async (_key: string): Promise<LimitResult> => ({ success: true, remaining: 999 }),
};

function makeRatelimiter(requests: number, windowSeconds: number) {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return noopLimiter;

  const redis = new Redis({ url, token });
  return new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(requests, `${windowSeconds} s`),
    analytics: false,
  });
}

/** AI endpoints: 20 requests per 60 s per IP */
export const aiLimiter = makeRatelimiter(20, 60);

/** Profile writes: 30 per 60 s per IP (generous — fast UX) */
export const profileLimiter = makeRatelimiter(30, 60);

/** Extract best-effort IP from Next.js request headers */
export function getIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  return "anonymous";
}
