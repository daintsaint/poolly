/**
 * Server-only helpers for fetching pool data (used by generateMetadata + OG image).
 * Uses React cache() so both functions share a single RPC call per request.
 */
import { cache } from "react";
import { Connection, PublicKey } from "@solana/web3.js";
import { AnchorProvider, Program } from "@coral-xyz/anchor";
import { IDL, type Poolly } from "@/lib/idl";
import { CATEGORIES } from "@/lib/constants";

export type PoolMeta = {
  title: string;
  category: number;
  categoryLabel: string;
  priceUSDC: string; // e.g. "4.99"
  filledSlots: number;
  maxSlots: number;
};

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
