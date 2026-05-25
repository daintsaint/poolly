"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";

export function Navbar() {
  const path = usePathname();

  return (
    <header className="glass-nav sticky top-0 z-50">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 h-16">

        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5">
          <div className="h-8 w-8 rounded-xl flex items-center justify-center shrink-0"
            style={{ background: "linear-gradient(135deg,#7c3aed,#6366f1)", boxShadow: "0 0 18px rgba(124,58,237,0.5)" }}>
            <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
              <circle cx="7.5" cy="7.5" r="3" fill="white"/>
              <circle cx="7.5" cy="2.5" r="1.5" fill="rgba(255,255,255,0.6)"/>
              <circle cx="12.5" cy="11" r="1.5" fill="rgba(255,255,255,0.6)"/>
              <circle cx="2.5" cy="11" r="1.5" fill="rgba(255,255,255,0.6)"/>
            </svg>
          </div>
          <span className="text-[17px] font-bold tracking-tight text-white">Poolly</span>
          <span className="pill pill-active" style={{ fontSize: "10px", padding: "2px 8px" }}>devnet</span>
        </Link>

        {/* Nav */}
        <nav className="hidden md:flex items-center gap-1">
          <Link href="/pools"
            className="px-4 py-2 rounded-xl text-sm font-medium transition-all"
            style={{ color: path.startsWith("/pools") ? "white" : "var(--text-2)", background: path.startsWith("/pools") ? "rgba(255,255,255,0.06)" : "transparent" }}>
            Browse Pools
          </Link>
        </nav>

        {/* Actions */}
        <div className="flex items-center gap-3">
          <Link href="/pools/create"
            className="btn-primary hidden sm:inline-flex items-center gap-1.5 px-4 h-9 text-sm">
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <path d="M6 1v10M1 6h10" stroke="white" strokeWidth="2" strokeLinecap="round"/>
            </svg>
            Create Pool
          </Link>
          <WalletMultiButton style={{
            height: "36px", fontSize: "13px", padding: "0 14px",
            background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)",
            borderRadius: "10px", fontWeight: 600,
          }}/>
        </div>
      </div>
    </header>
  );
}
