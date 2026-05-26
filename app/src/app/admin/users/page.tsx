"use client";

import { useState, useMemo } from "react";
import { useAdminData } from "@/lib/use-admin-data";
import { isPoolActive } from "@/lib/poolly-client";

function truncate(addr: string) {
  return addr.slice(0, 4) + "…" + addr.slice(-4);
}

type RoleFilter = "ALL" | "HOSTS" | "MEMBERS";

export default function AdminUsersPage() {
  const { pools, membersByPool, loading, error } = useAdminData();
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<RoleFilter>("ALL");

  // Build users list
  const users = useMemo(() => {
    const walletMap = new Map<
      string,
      {
        wallet: string;
        poolsHosted: number;
        poolsJoined: number;
        totalSpent: number;
        totalEarned: number;
        firstSeen: number;
        isHost: boolean;
        isMember: boolean;
      }
    >();

    function ensureWallet(addr: string) {
      if (!walletMap.has(addr)) {
        walletMap.set(addr, {
          wallet: addr,
          poolsHosted: 0,
          poolsJoined: 0,
          totalSpent: 0,
          totalEarned: 0,
          firstSeen: Infinity,
          isHost: false,
          isMember: false,
        });
      }
      return walletMap.get(addr)!;
    }

    for (const pool of pools) {
      const hostAddr = pool.host.toString();
      const u = ensureWallet(hostAddr);
      u.isHost = true;
      u.poolsHosted += 1;
      const priceUsdc = pool.pricePerSlot.toNumber() / 1_000_000;
      u.totalEarned +=
        pool.totalCycles * pool.filledSlots * priceUsdc * 0.94;
      const createdTs = pool.createdAt.toNumber();
      if (createdTs < u.firstSeen) u.firstSeen = createdTs;
    }

    for (const [poolKey, members] of Object.entries(membersByPool)) {
      const pool = pools.find((p) => p.publicKey.toString() === poolKey);
      if (!pool) continue;
      const priceUsdc = pool.pricePerSlot.toNumber() / 1_000_000;

      for (const member of members) {
        const walletAddr = member.wallet.toString();
        const u = ensureWallet(walletAddr);
        u.isMember = true;
        u.poolsJoined += 1;
        u.totalSpent += member.cyclesPaid * priceUsdc;
        const joinedTs = member.joinedAt.toNumber();
        if (joinedTs < u.firstSeen) u.firstSeen = joinedTs;
      }
    }

    return Array.from(walletMap.values());
  }, [pools, membersByPool]);

  const counts = useMemo(
    () => ({
      ALL: users.length,
      HOSTS: users.filter((u) => u.isHost).length,
      MEMBERS: users.filter((u) => u.isMember).length,
    }),
    [users]
  );

  const filtered = useMemo(() => {
    let result = users;

    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter((u) => u.wallet.toLowerCase().includes(q));
    }

    if (roleFilter === "HOSTS") result = result.filter((u) => u.isHost);
    if (roleFilter === "MEMBERS") result = result.filter((u) => u.isMember);

    return [...result].sort((a, b) => b.firstSeen - a.firstSeen);
  }, [users, search, roleFilter]);

  const thStyle: React.CSSProperties = {
    padding: "8px 10px",
    textAlign: "left",
    fontFamily: "var(--font-geist-mono), monospace",
    fontSize: 9,
    textTransform: "uppercase",
    letterSpacing: "0.1em",
    color: "rgba(237,230,214,0.35)",
    borderBottom: "1px solid var(--b-rule)",
    fontWeight: 400,
    whiteSpace: "nowrap",
  };

  const tdStyle: React.CSSProperties = {
    padding: "9px 10px",
    borderBottom: "1px solid var(--b-rule)",
    color: "rgba(237,230,214,0.7)",
    fontFamily: "var(--font-geist-mono), monospace",
    fontSize: 11,
  };

  return (
    <div style={{ padding: "40px 48px" }}>
      <style>{`
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }
      `}</style>

      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 32 }}>
        <h1 style={{ fontSize: 24, fontWeight: 500, color: "var(--b-paper)", margin: 0 }}>
          Users
        </h1>
        <span
          style={{
            background: "var(--b-ink-2)",
            border: "1px solid var(--b-rule)",
            color: "rgba(237,230,214,0.5)",
            fontFamily: "var(--font-geist-mono), monospace",
            fontSize: 10,
            padding: "3px 8px",
          }}
        >
          {users.length} wallets
        </span>
      </div>

      {error && (
        <div
          style={{
            color: "var(--b-rust)",
            fontFamily: "var(--font-geist-mono), monospace",
            fontSize: 12,
            marginBottom: 20,
            padding: "10px 14px",
            border: "1px solid var(--b-rust)",
            background: "rgba(181,86,62,0.08)",
          }}
        >
          {error}
        </div>
      )}

      {/* Controls */}
      <div style={{ display: "flex", gap: 12, marginBottom: 20, alignItems: "center" }}>
        <input
          type="text"
          placeholder="Search by wallet address…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{
            background: "var(--b-ink-2)",
            border: "1px solid var(--b-rule)",
            color: "var(--b-paper)",
            fontFamily: "var(--font-geist), sans-serif",
            fontSize: 13,
            padding: "8px 12px",
            outline: "none",
            width: 280,
          }}
        />
      </div>

      {/* Role tabs */}
      <div style={{ display: "flex", marginBottom: 20, borderBottom: "1px solid var(--b-rule)" }}>
        {(["ALL", "HOSTS", "MEMBERS"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setRoleFilter(tab)}
            style={{
              background: "none",
              border: "none",
              borderBottom:
                roleFilter === tab ? "2px solid var(--b-gold)" : "2px solid transparent",
              color: roleFilter === tab ? "var(--b-gold)" : "rgba(237,230,214,0.4)",
              fontFamily: "var(--font-geist-mono), monospace",
              fontSize: 10,
              textTransform: "uppercase",
              letterSpacing: "0.1em",
              padding: "8px 16px",
              cursor: "pointer",
              marginBottom: -1,
            }}
          >
            {tab} ({counts[tab]})
          </button>
        ))}
      </div>

      {/* Table */}
      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
          <thead>
            <tr>
              <th style={thStyle}>Wallet</th>
              <th style={thStyle}>Roles</th>
              <th style={thStyle}>Pools Hosted</th>
              <th style={thStyle}>Pools Joined</th>
              <th style={thStyle}>Total Spent</th>
              <th style={thStyle}>Total Earned</th>
              <th style={thStyle}>First Seen</th>
            </tr>
          </thead>
          <tbody>
            {loading
              ? Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}>
                    {Array.from({ length: 7 }).map((__, j) => (
                      <td
                        key={j}
                        style={{ padding: "9px 10px", borderBottom: "1px solid var(--b-rule)" }}
                      >
                        <div
                          style={{
                            height: 11,
                            width: j === 0 ? 120 : 60,
                            background: "var(--b-ink-3)",
                            animation: "pulse 1.5s ease-in-out infinite",
                          }}
                        />
                      </td>
                    ))}
                  </tr>
                ))
              : filtered.map((u) => {
                  const roles: string[] = [];
                  if (u.isHost) roles.push("HOST");
                  if (u.isMember) roles.push("MEMBER");

                  const firstSeenDate =
                    u.firstSeen === Infinity
                      ? "—"
                      : new Date(u.firstSeen * 1000).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        });

                  return (
                    <tr key={u.wallet}>
                      <td
                        style={{ ...tdStyle, cursor: "pointer" }}
                        title={u.wallet}
                        onClick={() => navigator.clipboard.writeText(u.wallet)}
                      >
                        {truncate(u.wallet)}
                      </td>
                      <td style={tdStyle}>
                        <div style={{ display: "flex", gap: 4 }}>
                          {roles.map((r) => (
                            <span
                              key={r}
                              style={{
                                display: "inline-block",
                                padding: "1px 6px",
                                border: `1px solid ${r === "HOST" ? "var(--b-gold)" : "var(--b-emerald)"}`,
                                color: r === "HOST" ? "var(--b-gold)" : "var(--b-emerald)",
                                fontFamily: "var(--font-geist-mono), monospace",
                                fontSize: 9,
                                textTransform: "uppercase",
                                letterSpacing: "0.08em",
                                background:
                                  r === "HOST"
                                    ? "rgba(201,162,79,0.08)"
                                    : "rgba(92,135,112,0.08)",
                              }}
                            >
                              {r}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td style={tdStyle}>{u.poolsHosted}</td>
                      <td style={tdStyle}>{u.poolsJoined}</td>
                      <td style={tdStyle}>${u.totalSpent.toFixed(2)}</td>
                      <td style={tdStyle}>${u.totalEarned.toFixed(2)}</td>
                      <td style={tdStyle}>{firstSeenDate}</td>
                    </tr>
                  );
                })}
          </tbody>
        </table>
      </div>

      {!loading && (
        <div
          style={{
            marginTop: 16,
            fontFamily: "var(--font-geist-mono), monospace",
            fontSize: 10,
            color: "rgba(237,230,214,0.3)",
            textTransform: "uppercase",
            letterSpacing: "0.08em",
          }}
        >
          {filtered.length} wallet{filtered.length !== 1 ? "s" : ""} shown
        </div>
      )}
    </div>
  );
}
