import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  webpack: (config) => {
    // Required for @solana/web3.js in Next.js
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      path: false,
      os: false,
    };
    return config;
  },
};

export default nextConfig;
