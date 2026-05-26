"use client";

import { useEffect, useState, useCallback } from "react";

const cache = new Map<string, string | null>();

/** Returns a display name for a wallet pubkey string, or null while loading. */
export function useDisplayName(wallet: string | null | undefined): string | null {
  const [name, setName] = useState<string | null>(
    wallet ? (cache.get(wallet) ?? null) : null
  );

  useEffect(() => {
    if (!wallet) return;
    if (cache.has(wallet)) {
      setName(cache.get(wallet) ?? null);
      return;
    }
    fetch(`/api/profile?wallet=${encodeURIComponent(wallet)}`)
      .then((r) => r.json())
      .then((data: { displayName: string | null }) => {
        cache.set(wallet, data.displayName);
        setName(data.displayName);
      })
      .catch(() => {});
  }, [wallet]);

  return name;
}

/** Save a display name for the connected wallet. Clears the local cache entry. */
export async function saveDisplayName(wallet: string, displayName: string): Promise<void> {
  await fetch("/api/profile", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ wallet, displayName }),
  });
  cache.set(wallet, displayName);
}

/** Format a wallet address as a short truncated string. */
export function shortWallet(wallet: string): string {
  return `${wallet.slice(0, 4)}…${wallet.slice(-4)}`;
}
