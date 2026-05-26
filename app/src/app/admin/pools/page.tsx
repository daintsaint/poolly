"use client";

import { useState, useMemo } from "react";
import { useAdminData } from "@/lib/use-admin-data";
import { CATEGORIES } from "@/lib/constants";
import { isPoolActive, isPoolPending, type PoolAccount } from "@/lib/poolly-client";
import { ServiceMark } from "@/components/vault-ui";
import { titleToSvcId } from "@/lib/svc-utils";
import { useDisplayName, shortWallet } from "@/lib/use-display-name";

/** Isolated so useDisplayName can be called per row */
function HostCell({ wallet }: { wallet: string }) {
  const name = useDisplayName(wallet);
  const display = name ?? shortWallet(wallet);
  return (
    <td
      style={{
        padding: "9px 10px",
        borderBottom: "1px solid var(--b-rule)",
        color: "rgba(237,230,214,0.7)",
        fontFamily: "var(--font-geist-mono), monospace",
        fontSize: 11,
        whiteSpace: "nowrap",
        cursor: "pointer",
      }}
      title={wallet}
      onClick={() => navigator.clipboard.writeText(wallet)}
    >
      {display}
    </td>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { bg: string; color: string }> = {
    active: { bg: "rgba(92,135,112,0.15)", color: "var(--b-emerald)" },
    pending: { bg: "rgba(201,162,79,0.12)", color: "var(--b-gold)" },
    closed: { bg: "rgba(237,230,214,0.06)", color: "rgba(237,230,214,0.3)" },
  };
  const s = map[status] ?? map.closed;
  return (
    <span
      style={{
        display: "inline-block",
        padding: "2px 7px",
        background: s.bg,
        color: s.color,
        fontFamily: "var(--font-geist-mono), monospace",
        fontSize: 10,
        textTransform: "uppercase",
        letterSpacing: "0.08em",
        border: `1px solid ${s.color}`,
        borderRadius: 0,
      }}
    >
      {status}
    </span>
  );
}

type SortKey = keyof PoolAccount | "fillPct" | "statusStr";
type SortDir = "asc" | "desc";

export default function AdminPoolsPage() {
  const { pools, membersByPool, loading, error } = useAdminData();

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "ACTIVE" | "PENDING" | "CLOSED">("ALL");
  const [categoryFilter, setCategoryFilter] = useState<number | -1>(-1);
  const [sortKey, setSortKey] = useState<SortKey>("createdAt");
  const [sortDir, setSortDir] = useState<SortDir>("desc");

  const counts = useMemo(() => ({
    ALL: pools.length,
    ACTIVE: pools.filter(isPoolActive).length,
    PENDING: pools.filter(isPoolPending).length,
    CLOSED: pools.filter((p) => "closed" in p.status).length,
  }), [pools]);

  function getStatus(pool: PoolAccount): string {
    if (isPoolActive(pool)) return "active";
    if (isPoolPending(pool)) return "pending";
    return "closed";
  }

  const filtered = useMemo(() => {
    let result = pools;

    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (p) =>
          p.title.toLowerCase().includes(q) ||
          p.host.toString().toLowerCase().includes(q)
      );
    }

    if (statusFilter !== "ALL") {
      result = result.filter((p) => getStatus(p).toUpperCase() === statusFilter);
    }

    if (categoryFilter !== -1) {
      result = result.filter((p) => p.category === categoryFilter);
    }

    result = [...result].sort((a, b) => {
      let av: number | string = 0;
      let bv: number | string = 0;

      switch (sortKey) {
        case "title":
          av = a.title.toLowerCase();
          bv = b.title.toLowerCase();
          break;
        case "filledSlots":
          av = a.filledSlots;
          bv = b.filledSlots;
          break;
        case "fillPct":
          av = a.maxSlots > 0 ? a.filledSlots / a.maxSlots : 0;
          bv = b.maxSlots > 0 ? b.filledSlots / b.maxSlots : 0;
          break;
        case "pricePerSlot":
          av = a.pricePerSlot.toNumber();
          bv = b.pricePerSlot.toNumber();
          break;
        case "cycleDays":
          av = a.cycleDays;
          bv = b.cycleDays;
          break;
        case "totalCycles":
          av = a.totalCycles;
          bv = b.totalCycles;
          break;
        case "createdAt":
          av = a.createdAt.toNumber();
          bv = b.createdAt.toNumber();
          break;
        case "statusStr":
          av = getStatus(a);
          bv = getStatus(b);
          break;
        default:
          av = 0;
          bv = 0;
      }

      if (av < bv) return sortDir === "asc" ? -1 : 1;
      if (av > bv) return sortDir === "asc" ? 1 : -1;
      return 0;
    });

    return result;
  }, [pools, search, statusFilter, categoryFilter, sortKey, sortDir]);

  function handleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("desc");
    }
  }

  function sortIndicator(key: SortKey) {
    if (sortKey !== key) return " ↕";
    return sortDir === "asc" ? " ↑" : " ↓";
  }

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
    cursor: "pointer",
    userSelect: "none",
    whiteSpace: "nowrap",
  };

  const tdStyle: React.CSSProperties = {
    padding: "9px 10px",
    borderBottom: "1px solid var(--b-rule)",
    color: "rgba(237,230,214,0.7)",
    fontFamily: "var(--font-geist-mono), monospace",
    fontSize: 11,
    whiteSpace: "nowrap",
  };

  return (
    <div style={{ padding: "40px 48px" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 32 }}>
        <h1 style={{ fontSize: 24, fontWeight: 500, color: "var(--b-paper)", margin: 0 }}>
          Pools
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
          {pools.length}
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
      <div
        style={{
          display: "flex",
          gap: 12,
          flexWrap: "wrap",
          alignItems: "center",
          marginBottom: 20,
        }}
      >
        {/* Search */}
        <input
          type="text"
          placeholder="Search pools…"
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
            width: 240,
          }}
        />

        {/* Category filter */}
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(Number(e.target.value))}
          style={{
            background: "var(--b-ink-2)",
            border: "1px solid var(--b-rule)",
            color: "var(--b-paper)",
            fontFamily: "var(--font-geist-mono), monospace",
            fontSize: 10,
            textTransform: "uppercase",
            letterSpacing: "0.08em",
            padding: "8px 12px",
            outline: "none",
            cursor: "pointer",
          }}
        >
          <option value={-1}>All Categories</option>
          {CATEGORIES.map((c) => (
            <option key={c.id} value={c.id}>
              {c.label}
            </option>
          ))}
        </select>
      </div>

      {/* Status tabs */}
      <div style={{ display: "flex", gap: 0, marginBottom: 20, borderBottom: "1px solid var(--b-rule)" }}>
        {(["ALL", "ACTIVE", "PENDING", "CLOSED"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setStatusFilter(tab)}
            style={{
              background: "none",
              border: "none",
              borderBottom: statusFilter === tab ? "2px solid var(--b-gold)" : "2px solid transparent",
              color:
                statusFilter === tab ? "var(--b-gold)" : "rgba(237,230,214,0.4)",
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
              <th style={thStyle}>#</th>
              <th style={thStyle} onClick={() => handleSort("title")}>
                Pool Title{sortIndicator("title")}
              </th>
              <th style={thStyle}>Host</th>
              <th style={thStyle}>Category</th>
              <th style={thStyle} onClick={() => handleSort("statusStr")}>
                Status{sortIndicator("statusStr")}
              </th>
              <th style={thStyle} onClick={() => handleSort("filledSlots")}>
                Members{sortIndicator("filledSlots")}
              </th>
              <th style={thStyle} onClick={() => handleSort("fillPct")}>
                Fill %{sortIndicator("fillPct")}
              </th>
              <th style={thStyle} onClick={() => handleSort("pricePerSlot")}>
                Price/Slot{sortIndicator("pricePerSlot")}
              </th>
              <th style={thStyle} onClick={() => handleSort("cycleDays")}>
                Cycle{sortIndicator("cycleDays")}
              </th>
              <th style={thStyle} onClick={() => handleSort("totalCycles")}>
                Cycles{sortIndicator("totalCycles")}
              </th>
              <th style={thStyle}>Proof</th>
            </tr>
          </thead>
          <tbody>
            {loading
              ? Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}>
                    {Array.from({ length: 11 }).map((__, j) => (
                      <td key={j} style={{ padding: "9px 10px", borderBottom: "1px solid var(--b-rule)" }}>
                        <div
                          style={{
                            height: 11,
                            width: j === 1 ? 120 : 60,
                            background: "var(--b-ink-3)",
                            animation: "pulse 1.5s ease-in-out infinite",
                          }}
                        />
                      </td>
                    ))}
                  </tr>
                ))
              : filtered.map((pool, idx) => {
                  const statusKey = getStatus(pool);
                  const fillPct =
                    pool.maxSlots > 0
                      ? ((pool.filledSlots / pool.maxSlots) * 100).toFixed(0)
                      : "0";
                  const catLabel =
                    CATEGORIES.find((c) => c.id === pool.category)?.label ?? "—";
                  const hostStr = pool.host.toString();
                  const svcId = titleToSvcId(pool.title, pool.category);

                  return (
                    <tr key={pool.publicKey.toString()}>
                      <td style={{ ...tdStyle, color: "rgba(237,230,214,0.3)" }}>
                        {idx + 1}
                      </td>
                      <td
                        style={{
                          ...tdStyle,
                          color: "var(--b-paper)",
                          fontFamily: "var(--font-geist), sans-serif",
                          fontSize: 13,
                          maxWidth: 200,
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                        }}
                      >
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <ServiceMark id={svcId} size={20} radius={0} />
                          <span style={{ overflow: "hidden", textOverflow: "ellipsis" }}>{pool.title}</span>
                        </div>
                      </td>
                      <HostCell wallet={hostStr} />
                      <td style={tdStyle}>{catLabel}</td>
                      <td style={tdStyle}>
                        <StatusBadge status={statusKey} />
                      </td>
                      <td style={tdStyle}>
                        {pool.filledSlots}/{pool.maxSlots}
                      </td>
                      <td style={tdStyle}>{fillPct}%</td>
                      <td style={tdStyle}>
                        ${(pool.pricePerSlot.toNumber() / 1_000_000).toFixed(2)}
                      </td>
                      <td style={tdStyle}>{pool.cycleDays}d</td>
                      <td style={tdStyle}>{pool.totalCycles}</td>
                      <td style={tdStyle}>
                        {pool.lastProofUri ? (
                          <a
                            href={pool.lastProofUri}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{ color: "var(--b-emerald)", textDecoration: "none" }}
                          >
                            ✓ View
                          </a>
                        ) : (
                          <span style={{ color: "rgba(237,230,214,0.2)" }}>—</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
          </tbody>
        </table>
      </div>

      {/* Footer */}
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
          {filtered.length} pool{filtered.length !== 1 ? "s" : ""} shown
        </div>
      )}

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
      `}</style>
    </div>
  );
}
