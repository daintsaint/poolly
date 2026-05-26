"use client";

import { useAdminData } from "@/lib/use-admin-data";
import { CATEGORIES } from "@/lib/constants";
import { isPoolActive, isPoolPending } from "@/lib/poolly-client";

function Skeleton({ width = "100%", height = 20 }: { width?: string | number; height?: number }) {
  return (
    <div
      style={{
        width,
        height,
        background: "var(--b-ink-3)",
        borderRadius: 0,
        animation: "pulse 1.5s ease-in-out infinite",
      }}
    />
  );
}

function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, { bg: string; color: string }> = {
    active: { bg: "rgba(92,135,112,0.15)", color: "var(--b-emerald)" },
    pending: { bg: "rgba(201,162,79,0.12)", color: "var(--b-gold)" },
    closed: { bg: "rgba(237,230,214,0.06)", color: "rgba(237,230,214,0.3)" },
  };
  const style = colors[status] ?? colors.closed;
  return (
    <span
      style={{
        display: "inline-block",
        padding: "2px 7px",
        background: style.bg,
        color: style.color,
        fontFamily: "var(--font-geist-mono), monospace",
        fontSize: 10,
        textTransform: "uppercase",
        letterSpacing: "0.08em",
        borderRadius: 0,
        border: `1px solid ${style.color}`,
      }}
    >
      {status}
    </span>
  );
}

function KpiCard({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div
      style={{
        background: "var(--b-ink-2)",
        border: "1px solid var(--b-rule)",
        padding: "20px 22px",
      }}
    >
      <div
        style={{
          fontFamily: "var(--font-geist-mono), monospace",
          fontSize: 9,
          textTransform: "uppercase",
          letterSpacing: "0.12em",
          color: "rgba(237,230,214,0.4)",
          marginBottom: 10,
        }}
      >
        {label}
      </div>
      <div
        style={{
          fontSize: 28,
          fontWeight: 500,
          color: "var(--b-paper)",
          lineHeight: 1,
          marginBottom: sub ? 4 : 0,
        }}
      >
        {value}
      </div>
      {sub && (
        <div
          style={{
            fontFamily: "var(--font-geist-mono), monospace",
            fontSize: 10,
            color: "rgba(237,230,214,0.3)",
          }}
        >
          {sub}
        </div>
      )}
    </div>
  );
}

function truncate(addr: string) {
  return addr.slice(0, 4) + "…" + addr.slice(-4);
}

export default function AdminOverviewPage() {
  const { pools, membersByPool, stats, loading, error, refresh } = useAdminData();

  const now = new Date();
  const timeStr = now.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });

  const recentPools = [...pools]
    .sort((a, b) => b.createdAt.toNumber() - a.createdAt.toNumber())
    .slice(0, 8);

  // Category breakdown
  const catBreakdown = CATEGORIES.map((cat) => {
    const catPools = pools.filter((p) => p.category === cat.id);
    const catMembers = catPools.flatMap((p) =>
      membersByPool[p.publicKey.toString()] ?? []
    );
    const usdcLocked = catPools.reduce(
      (sum, p) => sum + (p.filledSlots * p.pricePerSlot.toNumber()) / 1_000_000,
      0
    );
    return { ...cat, poolCount: catPools.length, memberCount: catMembers.length, usdcLocked };
  });

  const statusTotal = stats.totalPools || 1;
  const pendingPct = (stats.pendingPools / statusTotal) * 100;
  const activePct = (stats.activePools / statusTotal) * 100;
  const closedPct = (stats.closedPools / statusTotal) * 100;

  const PAGE_STYLE: React.CSSProperties = {
    padding: "40px 48px",
    maxWidth: 1100,
  };

  return (
    <div style={PAGE_STYLE}>
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
      `}</style>

      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 40,
        }}
      >
        <div>
          <h1
            style={{
              fontSize: 24,
              fontWeight: 500,
              color: "var(--b-paper)",
              margin: 0,
              marginBottom: 4,
            }}
          >
            Overview
          </h1>
          <div
            style={{
              fontFamily: "var(--font-geist-mono), monospace",
              fontSize: 10,
              color: "rgba(237,230,214,0.35)",
              textTransform: "uppercase",
              letterSpacing: "0.1em",
            }}
          >
            Last updated: {timeStr}
          </div>
        </div>
        <button
          onClick={refresh}
          disabled={loading}
          style={{
            background: "var(--b-ink-2)",
            border: "1px solid var(--b-rule)",
            color: "var(--b-paper)",
            fontFamily: "var(--font-geist-mono), monospace",
            fontSize: 10,
            textTransform: "uppercase",
            letterSpacing: "0.1em",
            padding: "8px 16px",
            cursor: loading ? "not-allowed" : "pointer",
          }}
        >
          {loading ? "Loading…" : "Refresh"}
        </button>
      </div>

      {error && (
        <div
          style={{
            background: "rgba(181,86,62,0.08)",
            border: "1px solid var(--b-rust)",
            color: "var(--b-rust)",
            padding: "12px 16px",
            fontFamily: "var(--font-geist-mono), monospace",
            fontSize: 12,
            marginBottom: 32,
          }}
        >
          Error: {error}
        </div>
      )}

      {/* KPI Grid */}
      {loading ? (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gap: 16,
            marginBottom: 40,
          }}
        >
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              style={{
                background: "var(--b-ink-2)",
                border: "1px solid var(--b-rule)",
                padding: "20px 22px",
                display: "flex",
                flexDirection: "column",
                gap: 10,
              }}
            >
              <Skeleton width={80} height={10} />
              <Skeleton width={100} height={28} />
            </div>
          ))}
        </div>
      ) : (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gap: 16,
            marginBottom: 40,
          }}
        >
          <KpiCard label="Total Pools" value={String(stats.totalPools)} />
          <KpiCard
            label="Active Pools"
            value={String(stats.activePools)}
            sub={`${stats.pendingPools} pending · ${stats.closedPools} closed`}
          />
          <KpiCard label="Total Members" value={String(stats.totalMembers)} />
          <KpiCard
            label="USDC Locked"
            value={`$${stats.totalUsdcLocked.toFixed(2)}`}
            sub="across active slots"
          />
          <KpiCard
            label="USDC Paid Out"
            value={`$${stats.totalUsdcPaidOut.toFixed(2)}`}
            sub="net to hosts (94%)"
          />
          <KpiCard
            label="Avg Fill Rate"
            value={`${stats.avgFillRate.toFixed(1)}%`}
            sub={`${stats.totalFilledSlots}/${stats.totalCapacity} slots`}
          />
        </div>
      )}

      {/* Status Breakdown */}
      {!loading && stats.totalPools > 0 && (
        <div
          style={{
            background: "var(--b-ink-2)",
            border: "1px solid var(--b-rule)",
            padding: "20px 22px",
            marginBottom: 32,
          }}
        >
          <div
            style={{
              fontFamily: "var(--font-geist-mono), monospace",
              fontSize: 9,
              textTransform: "uppercase",
              letterSpacing: "0.12em",
              color: "rgba(237,230,214,0.4)",
              marginBottom: 14,
            }}
          >
            Status Breakdown
          </div>
          <div
            style={{
              height: 10,
              display: "flex",
              borderRadius: 0,
              overflow: "hidden",
              marginBottom: 12,
            }}
          >
            <div style={{ width: `${pendingPct}%`, background: "var(--b-gold)" }} />
            <div style={{ width: `${activePct}%`, background: "var(--b-emerald)" }} />
            <div
              style={{ width: `${closedPct}%`, background: "rgba(237,230,214,0.15)" }}
            />
          </div>
          <div style={{ display: "flex", gap: 24 }}>
            {[
              { label: "Pending", count: stats.pendingPools, color: "var(--b-gold)" },
              { label: "Active", count: stats.activePools, color: "var(--b-emerald)" },
              { label: "Closed", count: stats.closedPools, color: "rgba(237,230,214,0.3)" },
            ].map(({ label, count, color }) => (
              <div key={label} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <div
                  style={{
                    width: 10,
                    height: 10,
                    background: color,
                    flexShrink: 0,
                  }}
                />
                <span
                  style={{
                    fontFamily: "var(--font-geist-mono), monospace",
                    fontSize: 10,
                    color: "rgba(237,230,214,0.6)",
                    textTransform: "uppercase",
                    letterSpacing: "0.08em",
                  }}
                >
                  {count} {label}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Category Breakdown */}
      <div style={{ marginBottom: 40 }}>
        <div
          style={{
            fontFamily: "var(--font-geist-mono), monospace",
            fontSize: 10,
            textTransform: "uppercase",
            letterSpacing: "0.12em",
            color: "rgba(237,230,214,0.4)",
            marginBottom: 12,
          }}
        >
          Category Breakdown
        </div>
        <table
          style={{
            width: "100%",
            borderCollapse: "collapse",
            fontFamily: "var(--font-geist), sans-serif",
            fontSize: 13,
          }}
        >
          <thead>
            <tr>
              {["Category", "Pools", "Members", "USDC Locked"].map((h) => (
                <th
                  key={h}
                  style={{
                    padding: "8px 12px",
                    textAlign: "left",
                    fontFamily: "var(--font-geist-mono), monospace",
                    fontSize: 9,
                    textTransform: "uppercase",
                    letterSpacing: "0.1em",
                    color: "rgba(237,230,214,0.35)",
                    borderBottom: "1px solid var(--b-rule)",
                    fontWeight: 400,
                  }}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading
              ? Array.from({ length: 4 }).map((_, i) => (
                  <tr key={i}>
                    {Array.from({ length: 4 }).map((__, j) => (
                      <td key={j} style={{ padding: "10px 12px" }}>
                        <Skeleton width={j === 0 ? 120 : 60} height={12} />
                      </td>
                    ))}
                  </tr>
                ))
              : catBreakdown.map((cat) => (
                  <tr key={cat.id}>
                    <td
                      style={{
                        padding: "10px 12px",
                        borderBottom: "1px solid var(--b-rule)",
                        color: "var(--b-paper)",
                      }}
                    >
                      {cat.icon} {cat.label}
                    </td>
                    <td
                      style={{
                        padding: "10px 12px",
                        borderBottom: "1px solid var(--b-rule)",
                        color: "rgba(237,230,214,0.7)",
                        fontFamily: "var(--font-geist-mono), monospace",
                      }}
                    >
                      {cat.poolCount}
                    </td>
                    <td
                      style={{
                        padding: "10px 12px",
                        borderBottom: "1px solid var(--b-rule)",
                        color: "rgba(237,230,214,0.7)",
                        fontFamily: "var(--font-geist-mono), monospace",
                      }}
                    >
                      {cat.memberCount}
                    </td>
                    <td
                      style={{
                        padding: "10px 12px",
                        borderBottom: "1px solid var(--b-rule)",
                        color: "rgba(237,230,214,0.7)",
                        fontFamily: "var(--font-geist-mono), monospace",
                      }}
                    >
                      ${cat.usdcLocked.toFixed(2)}
                    </td>
                  </tr>
                ))}
          </tbody>
        </table>
      </div>

      {/* Recent Pools */}
      <div>
        <div
          style={{
            fontFamily: "var(--font-geist-mono), monospace",
            fontSize: 10,
            textTransform: "uppercase",
            letterSpacing: "0.12em",
            color: "rgba(237,230,214,0.4)",
            marginBottom: 12,
          }}
        >
          Recent Pools
        </div>
        <table
          style={{
            width: "100%",
            borderCollapse: "collapse",
            fontFamily: "var(--font-geist), sans-serif",
            fontSize: 13,
          }}
        >
          <thead>
            <tr>
              {["Pool Name", "Host", "Status", "Members", "Price/Slot", "Created"].map((h) => (
                <th
                  key={h}
                  style={{
                    padding: "8px 12px",
                    textAlign: "left",
                    fontFamily: "var(--font-geist-mono), monospace",
                    fontSize: 9,
                    textTransform: "uppercase",
                    letterSpacing: "0.1em",
                    color: "rgba(237,230,214,0.35)",
                    borderBottom: "1px solid var(--b-rule)",
                    fontWeight: 400,
                  }}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading
              ? Array.from({ length: 4 }).map((_, i) => (
                  <tr key={i}>
                    {Array.from({ length: 6 }).map((__, j) => (
                      <td key={j} style={{ padding: "10px 12px" }}>
                        <Skeleton width={j === 0 ? 140 : 80} height={12} />
                      </td>
                    ))}
                  </tr>
                ))
              : recentPools.map((pool) => {
                  const statusKey = isPoolActive(pool)
                    ? "active"
                    : isPoolPending(pool)
                    ? "pending"
                    : "closed";
                  const createdDate = new Date(
                    pool.createdAt.toNumber() * 1000
                  ).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  });
                  return (
                    <tr key={pool.publicKey.toString()}>
                      <td
                        style={{
                          padding: "10px 12px",
                          borderBottom: "1px solid var(--b-rule)",
                          color: "var(--b-paper)",
                          maxWidth: 180,
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {pool.title}
                      </td>
                      <td
                        style={{
                          padding: "10px 12px",
                          borderBottom: "1px solid var(--b-rule)",
                          color: "rgba(237,230,214,0.5)",
                          fontFamily: "var(--font-geist-mono), monospace",
                          fontSize: 11,
                        }}
                      >
                        {truncate(pool.host.toString())}
                      </td>
                      <td
                        style={{
                          padding: "10px 12px",
                          borderBottom: "1px solid var(--b-rule)",
                        }}
                      >
                        <StatusBadge status={statusKey} />
                      </td>
                      <td
                        style={{
                          padding: "10px 12px",
                          borderBottom: "1px solid var(--b-rule)",
                          color: "rgba(237,230,214,0.7)",
                          fontFamily: "var(--font-geist-mono), monospace",
                        }}
                      >
                        {pool.filledSlots}/{pool.maxSlots}
                      </td>
                      <td
                        style={{
                          padding: "10px 12px",
                          borderBottom: "1px solid var(--b-rule)",
                          color: "rgba(237,230,214,0.7)",
                          fontFamily: "var(--font-geist-mono), monospace",
                        }}
                      >
                        ${(pool.pricePerSlot.toNumber() / 1_000_000).toFixed(2)}
                      </td>
                      <td
                        style={{
                          padding: "10px 12px",
                          borderBottom: "1px solid var(--b-rule)",
                          color: "rgba(237,230,214,0.5)",
                          fontFamily: "var(--font-geist-mono), monospace",
                          fontSize: 11,
                        }}
                      >
                        {createdDate}
                      </td>
                    </tr>
                  );
                })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
