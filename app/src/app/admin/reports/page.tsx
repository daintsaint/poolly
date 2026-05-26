"use client";

import { useMemo } from "react";
import { useAdminData } from "@/lib/use-admin-data";
import { CATEGORIES, PLATFORM_FEE_BPS } from "@/lib/constants";
import { isPoolActive, isPoolPending } from "@/lib/poolly-client";

const PLATFORM_FEE = PLATFORM_FEE_BPS / 10000;

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        fontFamily: "var(--font-geist-mono), monospace",
        fontSize: 10,
        textTransform: "uppercase",
        letterSpacing: "0.14em",
        color: "rgba(237,230,214,0.4)",
        marginBottom: 14,
        paddingBottom: 8,
        borderBottom: "1px solid var(--b-rule)",
      }}
    >
      {children}
    </div>
  );
}

function AlertRow({
  label,
  pools,
  color,
}: {
  label: string;
  pools: string[];
  color: string;
}) {
  if (pools.length === 0) return null;
  return (
    <div
      style={{
        padding: "12px 16px",
        border: `1px solid ${color}`,
        background: `${color}0f`,
        marginBottom: 10,
      }}
    >
      <div
        style={{
          fontFamily: "var(--font-geist-mono), monospace",
          fontSize: 10,
          textTransform: "uppercase",
          letterSpacing: "0.1em",
          color,
          marginBottom: 8,
        }}
      >
        {label} ({pools.length})
      </div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
        {pools.map((name) => (
          <span
            key={name}
            style={{
              fontFamily: "var(--font-geist-mono), monospace",
              fontSize: 10,
              color: "rgba(237,230,214,0.6)",
              background: "var(--b-ink-2)",
              border: "1px solid var(--b-rule)",
              padding: "2px 8px",
            }}
          >
            {name}
          </span>
        ))}
      </div>
    </div>
  );
}

export default function AdminReportsPage() {
  const { pools, membersByPool, stats, loading, error } = useAdminData();

  const now = Math.floor(Date.now() / 1000);

  // Category performance
  const catPerformance = useMemo(
    () =>
      CATEGORIES.map((cat) => {
        const catPools = pools.filter((p) => p.category === cat.id);
        const catMembers = catPools.flatMap(
          (p) => membersByPool[p.publicKey.toString()] ?? []
        );
        const usdcLocked = catPools.reduce(
          (s, p) => s + (p.filledSlots * p.pricePerSlot.toNumber()) / 1_000_000,
          0
        );
        const usdcPaidOut = catPools.reduce(
          (s, p) =>
            s +
            (p.totalCycles * p.filledSlots * p.pricePerSlot.toNumber()) /
              1_000_000 *
              0.94,
          0
        );
        const avgFill =
          catPools.length > 0
            ? catPools.reduce(
                (s, p) => s + (p.maxSlots > 0 ? (p.filledSlots / p.maxSlots) * 100 : 0),
                0
              ) / catPools.length
            : 0;
        return {
          ...cat,
          poolCount: catPools.length,
          memberCount: catMembers.length,
          avgFill,
          usdcLocked,
          usdcPaidOut,
        };
      }),
    [pools, membersByPool]
  );

  // Top 5 pools by member count
  const top5ByMembers = useMemo(
    () =>
      [...pools]
        .sort((a, b) => b.filledSlots - a.filledSlots)
        .slice(0, 5),
    [pools]
  );

  // Top 5 hosts by pools hosted
  const top5Hosts = useMemo(() => {
    const hostCounts = new Map<string, number>();
    for (const pool of pools) {
      const h = pool.host.toString();
      hostCounts.set(h, (hostCounts.get(h) ?? 0) + 1);
    }
    return [...hostCounts.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);
  }, [pools]);

  // Alerts
  const atCapacity = useMemo(
    () =>
      pools
        .filter((p) => p.maxSlots > 0 && p.filledSlots >= p.maxSlots)
        .map((p) => p.title),
    [pools]
  );

  const missingProof = useMemo(
    () =>
      pools
        .filter((p) => isPoolActive(p) && !p.lastProofUri)
        .map((p) => p.title),
    [pools]
  );

  const sevenDaysAgo = now - 7 * 86400;
  const neverActivated = useMemo(
    () =>
      pools
        .filter(
          (p) =>
            isPoolPending(p) &&
            p.filledSlots === 0 &&
            p.createdAt.toNumber() < sevenDaysAgo
        )
        .map((p) => p.title),
    [pools, sevenDaysAgo]
  );

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

  const totalFeesEarned = stats.totalUsdcPaidOut > 0
    ? (stats.totalUsdcLocked * PLATFORM_FEE) + (stats.totalUsdcPaidOut / 0.94 * PLATFORM_FEE)
    : stats.totalUsdcLocked * PLATFORM_FEE;

  function truncate(addr: string) {
    return addr.slice(0, 4) + "…" + addr.slice(-4);
  }

  return (
    <div style={{ padding: "40px 48px" }}>
      <style>{`
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }
      `}</style>

      <h1 style={{ fontSize: 24, fontWeight: 500, color: "var(--b-paper)", margin: 0, marginBottom: 40 }}>
        Reports & Analytics
      </h1>

      {error && (
        <div
          style={{
            color: "var(--b-rust)",
            fontFamily: "var(--font-geist-mono), monospace",
            fontSize: 12,
            marginBottom: 24,
            padding: "10px 14px",
            border: "1px solid var(--b-rust)",
            background: "rgba(181,86,62,0.08)",
          }}
        >
          {error}
        </div>
      )}

      {/* 1. Category Performance */}
      <section style={{ marginBottom: 48 }}>
        <SectionTitle>Category Performance</SectionTitle>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
          <thead>
            <tr>
              {["Category", "Pools", "Members", "Avg Fill %", "USDC Locked", "USDC Paid Out"].map(
                (h) => (
                  <th key={h} style={thStyle}>{h}</th>
                )
              )}
            </tr>
          </thead>
          <tbody>
            {loading
              ? Array.from({ length: 4 }).map((_, i) => (
                  <tr key={i}>
                    {Array.from({ length: 6 }).map((__, j) => (
                      <td key={j} style={{ padding: "9px 10px", borderBottom: "1px solid var(--b-rule)" }}>
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
              : catPerformance.map((cat) => (
                  <tr key={cat.id}>
                    <td style={{ ...tdStyle, color: "var(--b-paper)" }}>
                      {cat.icon} {cat.label}
                    </td>
                    <td style={tdStyle}>{cat.poolCount}</td>
                    <td style={tdStyle}>{cat.memberCount}</td>
                    <td style={tdStyle}>{cat.avgFill.toFixed(1)}%</td>
                    <td style={tdStyle}>${cat.usdcLocked.toFixed(2)}</td>
                    <td style={tdStyle}>${cat.usdcPaidOut.toFixed(2)}</td>
                  </tr>
                ))}
          </tbody>
        </table>
      </section>

      {/* 2. Top 5 by member count */}
      <section style={{ marginBottom: 48 }}>
        <SectionTitle>Top 5 Pools by Member Count</SectionTitle>
        {loading ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {Array.from({ length: 3 }).map((_, i) => (
              <div
                key={i}
                style={{
                  height: 36,
                  background: "var(--b-ink-2)",
                  border: "1px solid var(--b-rule)",
                  animation: "pulse 1.5s ease-in-out infinite",
                }}
              />
            ))}
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {top5ByMembers.map((pool, i) => {
              const fillPct = pool.maxSlots > 0 ? (pool.filledSlots / pool.maxSlots) * 100 : 0;
              return (
                <div
                  key={pool.publicKey.toString()}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 16,
                    padding: "10px 14px",
                    background: "var(--b-ink-2)",
                    border: "1px solid var(--b-rule)",
                  }}
                >
                  <span
                    style={{
                      fontFamily: "var(--font-geist-mono), monospace",
                      fontSize: 11,
                      color: "var(--b-gold)",
                      width: 20,
                      flexShrink: 0,
                    }}
                  >
                    #{i + 1}
                  </span>
                  <span
                    style={{
                      color: "var(--b-paper)",
                      fontSize: 13,
                      flex: "0 0 200px",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {pool.title}
                  </span>
                  <div
                    style={{
                      flex: 1,
                      height: 6,
                      background: "rgba(237,230,214,0.08)",
                      position: "relative",
                    }}
                  >
                    <div
                      style={{
                        position: "absolute",
                        left: 0,
                        top: 0,
                        bottom: 0,
                        width: `${fillPct}%`,
                        background: "var(--b-emerald)",
                      }}
                    />
                  </div>
                  <span
                    style={{
                      fontFamily: "var(--font-geist-mono), monospace",
                      fontSize: 11,
                      color: "rgba(237,230,214,0.6)",
                      width: 80,
                      textAlign: "right",
                      flexShrink: 0,
                    }}
                  >
                    {pool.filledSlots}/{pool.maxSlots} ({fillPct.toFixed(0)}%)
                  </span>
                </div>
              );
            })}
            {top5ByMembers.length === 0 && (
              <div
                style={{
                  fontFamily: "var(--font-geist-mono), monospace",
                  fontSize: 11,
                  color: "rgba(237,230,214,0.3)",
                  padding: "12px 0",
                }}
              >
                No pools yet
              </div>
            )}
          </div>
        )}
      </section>

      {/* 3. Top 5 hosts */}
      <section style={{ marginBottom: 48 }}>
        <SectionTitle>Top 5 Hosts by Pools Hosted</SectionTitle>
        {loading ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {Array.from({ length: 3 }).map((_, i) => (
              <div
                key={i}
                style={{
                  height: 36,
                  background: "var(--b-ink-2)",
                  border: "1px solid var(--b-rule)",
                  animation: "pulse 1.5s ease-in-out infinite",
                }}
              />
            ))}
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {top5Hosts.map(([wallet, count], i) => (
              <div
                key={wallet}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 16,
                  padding: "10px 14px",
                  background: "var(--b-ink-2)",
                  border: "1px solid var(--b-rule)",
                }}
              >
                <span
                  style={{
                    fontFamily: "var(--font-geist-mono), monospace",
                    fontSize: 11,
                    color: "var(--b-gold)",
                    width: 20,
                    flexShrink: 0,
                  }}
                >
                  #{i + 1}
                </span>
                <span
                  style={{
                    fontFamily: "var(--font-geist-mono), monospace",
                    fontSize: 11,
                    color: "var(--b-paper)",
                    flex: 1,
                    cursor: "pointer",
                  }}
                  title={wallet}
                  onClick={() => navigator.clipboard.writeText(wallet)}
                >
                  {truncate(wallet)}
                </span>
                <span
                  style={{
                    fontFamily: "var(--font-geist-mono), monospace",
                    fontSize: 11,
                    color: "rgba(237,230,214,0.5)",
                  }}
                >
                  {count} pool{count !== 1 ? "s" : ""}
                </span>
              </div>
            ))}
            {top5Hosts.length === 0 && (
              <div
                style={{
                  fontFamily: "var(--font-geist-mono), monospace",
                  fontSize: 11,
                  color: "rgba(237,230,214,0.3)",
                  padding: "12px 0",
                }}
              >
                No hosts yet
              </div>
            )}
          </div>
        )}
      </section>

      {/* 4. Pool Health Alerts */}
      <section style={{ marginBottom: 48 }}>
        <SectionTitle>Pool Health Alerts</SectionTitle>
        {loading ? (
          <div
            style={{
              height: 60,
              background: "var(--b-ink-2)",
              border: "1px solid var(--b-rule)",
              animation: "pulse 1.5s ease-in-out infinite",
            }}
          />
        ) : (
          <>
            <AlertRow
              label="At Capacity"
              pools={atCapacity}
              color="var(--b-emerald)"
            />
            <AlertRow
              label="Active — Missing Proof"
              pools={missingProof}
              color="var(--b-rust)"
            />
            <AlertRow
              label="Never Activated (>7 days, 0 members)"
              pools={neverActivated}
              color="var(--b-gold)"
            />
            {atCapacity.length === 0 &&
              missingProof.length === 0 &&
              neverActivated.length === 0 && (
                <div
                  style={{
                    fontFamily: "var(--font-geist-mono), monospace",
                    fontSize: 11,
                    color: "rgba(237,230,214,0.3)",
                    padding: "12px 0",
                  }}
                >
                  No alerts
                </div>
              )}
          </>
        )}
      </section>

      {/* 5. Platform Totals */}
      <section>
        <SectionTitle>Platform Totals</SectionTitle>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gap: 14,
          }}
        >
          {loading
            ? Array.from({ length: 3 }).map((_, i) => (
                <div
                  key={i}
                  style={{
                    background: "var(--b-ink-2)",
                    border: "1px solid var(--b-rule)",
                    padding: "18px 20px",
                    display: "flex",
                    flexDirection: "column",
                    gap: 8,
                  }}
                >
                  <div
                    style={{
                      height: 9,
                      width: 80,
                      background: "var(--b-ink-3)",
                      animation: "pulse 1.5s ease-in-out infinite",
                    }}
                  />
                  <div
                    style={{
                      height: 22,
                      width: 100,
                      background: "var(--b-ink-3)",
                      animation: "pulse 1.5s ease-in-out infinite",
                    }}
                  />
                </div>
              ))
            : [
                {
                  label: "Platform Fees Earned",
                  value: `$${totalFeesEarned.toFixed(2)}`,
                },
                {
                  label: "Total Pools All-Time",
                  value: String(stats.totalPools),
                },
                {
                  label: "Platform Fill Rate",
                  value: `${stats.avgFillRate.toFixed(1)}%`,
                },
              ].map(({ label, value }) => (
                <div
                  key={label}
                  style={{
                    background: "var(--b-ink-2)",
                    border: "1px solid var(--b-rule)",
                    padding: "18px 20px",
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
                      fontSize: 26,
                      fontWeight: 500,
                      color: "var(--b-paper)",
                      lineHeight: 1,
                    }}
                  >
                    {value}
                  </div>
                </div>
              ))}
        </div>
      </section>
    </div>
  );
}
