"use client";

import Link from "next/link";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";

export function Navbar() {
  return (
    <nav className="border-b border-slate-800 bg-slate-950 px-4 py-3">
      <div className="mx-auto flex max-w-6xl items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <span className="text-xl font-bold text-white">Poolly</span>
          <span className="rounded-full bg-indigo-600 px-2 py-0.5 text-xs font-medium text-white">
            devnet
          </span>
        </Link>

        <div className="flex items-center gap-4">
          <Link
            href="/pools"
            className="text-sm text-slate-400 hover:text-white transition-colors"
          >
            Browse Pools
          </Link>
          <Link
            href="/pools/create"
            className="rounded-lg bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-indigo-500 transition-colors"
          >
            + Create Pool
          </Link>
          <WalletMultiButton
            style={{
              height: "36px",
              fontSize: "14px",
              padding: "0 16px",
              background: "#1e293b",
              border: "1px solid #334155",
              borderRadius: "8px",
            }}
          />
        </div>
      </div>
    </nav>
  );
}
