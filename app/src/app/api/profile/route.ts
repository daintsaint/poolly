/**
 * Simple display-name registry.
 * Stored in a module-level Map — persists for the lifetime of the server process.
 * GET  /api/profile?wallet=<pubkey>          → { displayName: string | null }
 * POST /api/profile  { wallet, displayName } → { ok: true }
 */

const store = new Map<string, string>();

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const wallet = searchParams.get("wallet")?.trim();
  if (!wallet) {
    return Response.json({ error: "wallet param required" }, { status: 400 });
  }
  return Response.json({ displayName: store.get(wallet) ?? null });
}

export async function POST(request: Request) {
  const body = await request.json() as { wallet?: string; displayName?: string };
  const wallet = body.wallet?.trim();
  const displayName = body.displayName?.trim().slice(0, 32); // max 32 chars

  if (!wallet || !displayName) {
    return Response.json({ error: "wallet and displayName required" }, { status: 400 });
  }

  store.set(wallet, displayName);
  return Response.json({ ok: true });
}
