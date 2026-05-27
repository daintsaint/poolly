import type { Metadata } from "next";
import { fetchPoolMeta } from "@/lib/pool-server";

type Props = {
  params: Promise<{ address: string }>;
  children: React.ReactNode;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { address } = await params;
  const pool = await fetchPoolMeta(address);

  if (!pool) {
    return {
      title: "Pool — Poolly",
      description:
        "Join a subscription pool on Poolly. Split subscriptions on Solana.",
      openGraph: {
        images: [
          { url: "/brand/poolly_logo/svg/og-image.svg", width: 1200, height: 630 },
        ],
      },
    };
  }

  const slots = `${pool.filledSlots}/${pool.maxSlots} slots`;
  const title = `${pool.title} — Poolly`;
  const description = `${pool.categoryLabel} pool · $${pool.priceUSDC} USDC/cycle · ${slots} filled. Split subscriptions on Solana.`;

  // The opengraph-image.tsx in this folder auto-generates the OG image;
  // Next.js resolves the URL automatically — no explicit `images` needed.
  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
  };
}

export default function PoolLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
