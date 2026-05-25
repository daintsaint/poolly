import { PublicKey } from "@solana/web3.js";

export const POOLLY_PROGRAM_ID = new PublicKey(
  "Edv6BNFLKPKJ4KUWco2MEmGSTsdSU4xBWFsaFFmezpcq"
);

export const USDC_MINT_DEVNET = new PublicKey(
  "4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU"
);

export const POOL_SEED = Buffer.from("pool");
export const MEMBER_SEED = Buffer.from("member");

export const CATEGORIES = [
  { id: 0, label: "Streaming", icon: "📺" },
  { id: 1, label: "Productivity", icon: "💼" },
  { id: 2, label: "Fitness", icon: "🏋️" },
  { id: 3, label: "Local Services", icon: "🏠" },
  { id: 4, label: "Professional Tools", icon: "🛠️" },
  { id: 5, label: "Other", icon: "✨" },
] as const;

export const PLATFORM_FEE_BPS = 600;

// Deployer/platform wallet — receives the 6% fee on fund releases
export const PLATFORM_WALLET = new PublicKey(
  "DXt2nNnGAg9Budk7WZ1ns5n7PLi4351hFrdPte2eMVHn"
);
