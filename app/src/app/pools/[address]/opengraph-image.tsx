import { ImageResponse } from "next/og";
import { fetchPoolMeta } from "@/lib/pool-server";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image({
  params,
}: {
  params: Promise<{ address: string }>;
}) {
  const { address } = await params;
  const pool = await fetchPoolMeta(address);

  const title = pool?.title ?? "Subscription Pool";
  const price = pool?.priceUSDC ?? "—";
  const filled = pool?.filledSlots ?? 0;
  const max = pool?.maxSlots ?? 0;
  const category = pool?.categoryLabel ?? "Pool";
  const slotsLabel = pool ? `${filled} / ${max} slots filled` : "";

  return new ImageResponse(
    (
      <div
        style={{
          width: 1200,
          height: 630,
          background: "#0C0B09",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "72px 80px",
          fontFamily: "Georgia, serif",
        }}
      >
        {/* Top: brand + category */}
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          {/* Poolly wordmark */}
          <div
            style={{
              fontSize: 18,
              fontWeight: 700,
              color: "#C9A24F",
              letterSpacing: "0.18em",
              textTransform: "uppercase",
              fontFamily: "monospace",
            }}
          >
            POOLLY
          </div>
          <div
            style={{
              width: 1,
              height: 18,
              background: "rgba(237,230,214,0.25)",
              margin: "0 4px",
            }}
          />
          <div
            style={{
              fontSize: 13,
              color: "rgba(237,230,214,0.50)",
              letterSpacing: "0.18em",
              textTransform: "uppercase",
              fontFamily: "monospace",
            }}
          >
            {category}
          </div>
        </div>

        {/* Middle: pool title */}
        <div
          style={{
            fontSize: title.length > 28 ? 64 : 80,
            fontWeight: 300,
            color: "#EDE6D6",
            lineHeight: 1.1,
            letterSpacing: "-0.02em",
            fontStyle: "italic",
            maxWidth: 900,
          }}
        >
          {title}
        </div>

        {/* Bottom: stats row */}
        <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between" }}>
          <div style={{ display: "flex", gap: 48 }}>
            {/* Price */}
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <div
                style={{
                  fontSize: 11,
                  color: "rgba(237,230,214,0.40)",
                  letterSpacing: "0.18em",
                  textTransform: "uppercase",
                  fontFamily: "monospace",
                }}
              >
                PER SLOT / CYCLE
              </div>
              <div
                style={{
                  fontSize: 36,
                  fontWeight: 700,
                  color: "#C9A24F",
                  fontFamily: "monospace",
                  letterSpacing: "-0.01em",
                }}
              >
                ${price} <span style={{ fontSize: 16, color: "rgba(237,230,214,0.5)", fontWeight: 400 }}>USDC</span>
              </div>
            </div>

            {/* Slots */}
            {pool && (
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <div
                  style={{
                    fontSize: 11,
                    color: "rgba(237,230,214,0.40)",
                    letterSpacing: "0.18em",
                    textTransform: "uppercase",
                    fontFamily: "monospace",
                  }}
                >
                  AVAILABILITY
                </div>
                <div
                  style={{
                    fontSize: 36,
                    fontWeight: 700,
                    color: "#EDE6D6",
                    fontFamily: "monospace",
                    letterSpacing: "-0.01em",
                  }}
                >
                  {slotsLabel}
                </div>
              </div>
            )}
          </div>

          {/* Right: tagline */}
          <div
            style={{
              fontSize: 14,
              color: "rgba(237,230,214,0.35)",
              letterSpacing: "0.06em",
              textAlign: "right",
              fontFamily: "monospace",
            }}
          >
            Split subscriptions on Solana
          </div>
        </div>

        {/* Gold bottom rule */}
        <div
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            height: 3,
            background: "linear-gradient(90deg, #C9A24F 0%, transparent 80%)",
          }}
        />
      </div>
    ),
    { ...size }
  );
}
