"use client";

import { useState, useMemo } from "react";
import { useAdminData } from "@/lib/use-admin-data";
import { PLATFORM_FEE_BPS } from "@/lib/constants";

const PLATFORM_FEE = PLATFORM_FEE_BPS / 10000; // 0.06
const PAGE_SIZE = 25;

type PaymentEvent = {
  date: number; // unix timestamp
  poolTitle: string;
  poolKey: string;
  eventType: "CYCLE CHARGE" | "POOL CREATED";
  members: number;
  amount: number; // USDC
  platformFee: number;
  netToHost: number;
};

export default function AdminPaymentsPage() {
  const { pools, loading, error } = useAdminData();
  const [page, setPage] = useState(0);

  const events = useMemo<PaymentEvent[]>(() => {
    const result: PaymentEvent[] = [];

    for (const pool of pools) {
      // POOL CREATED event
      result.push({
        date: pool.createdAt.toNumber(),
        poolTitle: pool.title,
        poolKey: pool.publicKey.toString(),
        eventType: "POOL CREATED",
        members: pool.filledSlots,
        amount: 0,
        platformFee: 0,
        netToHost: 0,
      });

      // CYCLE CHARGE events
      if (pool.totalCycles > 0) {
        const priceUsdc = pool.pricePerSlot.toNumber() / 1_000_000;
        const chargeAmount = pool.filledSlots * priceUsdc;
        const fee = chargeAmount * PLATFORM_FEE;
        const net = chargeAmount - fee;
        const nextCharge = pool.nextChargeAt.toNumber();
        const cycleSecs = pool.cycleDays * 86400;

        for (let i = 0; i < pool.totalCycles; i++) {
          const ts = nextCharge - (pool.totalCycles - i) * cycleSecs;
          result.push({
            date: ts,
            poolTitle: pool.title,
            poolKey: pool.publicKey.toString(),
            eventType: "CYCLE CHARGE",
            members: pool.filledSlots,
            amount: chargeAmount,
            platformFee: fee,
            netToHost: net,
          });
        }
      }
    }

    return result.sort((a, b) => b.date - a.date);
  }, [pools]);

  const totalVolume = useMemo(
    () => events.reduce((s, e) => s + e.amount, 0),
    [events]
  );
  const totalTxs = events.filter((e) => e.eventType === "CYCLE CHARGE").length;
  const avgTx = totalTxs > 0 ? totalVolume / totalTxs : 0;
  const platformFees = totalVolume * PLATFORM_FEE;

  const totalPages = Math.ceil(events.length / PAGE_SIZE);
  const pageEvents = events.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  function truncate(addr: string) {
    return addr.slice(0, 4) + "…" + addr.slice(-4);
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
      <style>{`
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }
      `}</style>

      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 36 }}>
        <h1 style={{ fontSize: 24, fontWeight: 500, color: "var(--b-paper)", margin: 0 }}>
          Payments
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
          {events.length} events
        </span>
        <span
          style={{
            fontFamily: "var(--font-geist-mono), monospace",
            fontSize: 10,
            color: "rgba(237,230,214,0.3)",
            textTransform: "uppercase",
            letterSpacing: "0.08em",
          }}
        >
          ${totalVolume.toFixed(2)} total
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

      {/* KPI row */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(4, 1fr)",
          gap: 12,
          marginBottom: 36,
        }}
      >
        {loading
          ? Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                style={{
                  background: "var(--b-ink-2)",
                  border: "1px solid var(--b-rule)",
                  padding: "18px 20px",
                  display: "flex",
                  flexDirection: "column",
                  gap: 10,
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
              { label: "Total Volume", value: `$${totalVolume.toFixed(2)}` },
              { label: "Total Transactions", value: String(totalTxs) },
              { label: "Avg Tx Size", value: `$${avgTx.toFixed(2)}` },
              { label: "Platform Fees (6%)", value: `$${platformFees.toFixed(2)}` },
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
                    marginBottom: 8,
                  }}
                >
                  {label}
                </div>
                <div
                  style={{
                    fontSize: 22,
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

      {/* Table */}
      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
          <thead>
            <tr>
              <th style={thStyle}>Date</th>
              <th style={thStyle}>Pool</th>
              <th style={thStyle}>Event Type</th>
              <th style={thStyle}>Members</th>
              <th style={thStyle}>Amount USDC</th>
              <th style={thStyle}>Platform Fee</th>
              <th style={thStyle}>Net to Host</th>
            </tr>
          </thead>
          <tbody>
            {loading
              ? Array.from({ length: 8 }).map((_, i) => (
                  <tr key={i}>
                    {Array.from({ length: 7 }).map((__, j) => (
                      <td
                        key={j}
                        style={{ padding: "9px 10px", borderBottom: "1px solid var(--b-rule)" }}
                      >
                        <div
                          style={{
                            height: 11,
                            width: j === 1 ? 140 : 70,
                            background: "var(--b-ink-3)",
                            animation: "pulse 1.5s ease-in-out infinite",
                          }}
                        />
                      </td>
                    ))}
                  </tr>
                ))
              : pageEvents.map((evt, i) => {
                  const dateStr = new Date(evt.date * 1000).toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "short",
                    day: "numeric",
                  });
                  const isCharge = evt.eventType === "CYCLE CHARGE";

                  return (
                    <tr key={`${evt.poolKey}-${evt.eventType}-${i}`}>
                      <td style={tdStyle}>{dateStr}</td>
                      <td
                        style={{
                          ...tdStyle,
                          maxWidth: 160,
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          color: "var(--b-paper)",
                          fontFamily: "var(--font-geist), sans-serif",
                          fontSize: 12,
                        }}
                        title={evt.poolTitle}
                      >
                        {evt.poolTitle}
                      </td>
                      <td style={tdStyle}>
                        <span
                          style={{
                            color: isCharge ? "var(--b-emerald)" : "rgba(237,230,214,0.5)",
                            border: `1px solid ${isCharge ? "var(--b-emerald)" : "var(--b-rule)"}`,
                            padding: "1px 6px",
                            fontSize: 9,
                            textTransform: "uppercase",
                            letterSpacing: "0.08em",
                          }}
                        >
                          {evt.eventType}
                        </span>
                      </td>
                      <td style={tdStyle}>{evt.members}</td>
                      <td style={tdStyle}>
                        {isCharge ? `$${evt.amount.toFixed(2)}` : "—"}
                      </td>
                      <td style={tdStyle}>
                        {isCharge ? `$${evt.platformFee.toFixed(2)}` : "—"}
                      </td>
                      <td style={tdStyle}>
                        {isCharge ? `$${evt.netToHost.toFixed(2)}` : "—"}
                      </td>
                    </tr>
                  );
                })}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {!loading && totalPages > 1 && (
        <div
          style={{
            marginTop: 20,
            display: "flex",
            alignItems: "center",
            gap: 12,
          }}
        >
          <button
            onClick={() => setPage((p) => Math.max(0, p - 1))}
            disabled={page === 0}
            style={{
              background: "var(--b-ink-2)",
              border: "1px solid var(--b-rule)",
              color: page === 0 ? "rgba(237,230,214,0.2)" : "var(--b-paper)",
              fontFamily: "var(--font-geist-mono), monospace",
              fontSize: 10,
              textTransform: "uppercase",
              letterSpacing: "0.08em",
              padding: "6px 12px",
              cursor: page === 0 ? "not-allowed" : "pointer",
            }}
          >
            ← Prev
          </button>
          <span
            style={{
              fontFamily: "var(--font-geist-mono), monospace",
              fontSize: 10,
              color: "rgba(237,230,214,0.4)",
              textTransform: "uppercase",
              letterSpacing: "0.08em",
            }}
          >
            {page + 1} / {totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
            disabled={page >= totalPages - 1}
            style={{
              background: "var(--b-ink-2)",
              border: "1px solid var(--b-rule)",
              color: page >= totalPages - 1 ? "rgba(237,230,214,0.2)" : "var(--b-paper)",
              fontFamily: "var(--font-geist-mono), monospace",
              fontSize: 10,
              textTransform: "uppercase",
              letterSpacing: "0.08em",
              padding: "6px 12px",
              cursor: page >= totalPages - 1 ? "not-allowed" : "pointer",
            }}
          >
            Next →
          </button>
        </div>
      )}

      {!loading && (
        <div
          style={{
            marginTop: 12,
            fontFamily: "var(--font-geist-mono), monospace",
            fontSize: 10,
            color: "rgba(237,230,214,0.3)",
            textTransform: "uppercase",
            letterSpacing: "0.08em",
          }}
        >
          Showing {page * PAGE_SIZE + 1}–{Math.min((page + 1) * PAGE_SIZE, events.length)} of{" "}
          {events.length} events
        </div>
      )}
    </div>
  );
}
