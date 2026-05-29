/**
 * Pool creation intent gate — rate-limits pool creation to 3 per wallet per 24 hours.
 *
 * POST /api/pool-create-intent { wallet } → { allowed: boolean, remaining: number }
 *
 * The frontend pool creation page should call this before allowing form submission.
 * The pool creation itself is a client-side Solana tx, but this endpoint rate-limits
 * the proof upload and AI verify calls that are part of the hosting flow.
 */

import { type NextRequest } from "next/server";
import { createPoolLimiter } from "@/lib/ratelimit";

export async function POST(request: NextRequest) {
  const body = (await request.json()) as { wallet?: string };
  const wallet = body.wallet?.trim();

  if (!wallet) {
    return Response.json({ error: "wallet required" }, { status: 400 });
  }

  // Use wallet address as the rate-limit identifier (not IP)
  const { success, remaining } = await createPoolLimiter.limit(wallet);

  return Response.json({ allowed: success, remaining });
}
