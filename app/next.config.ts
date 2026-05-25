import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // turbopack: {} silences the "webpack config with no turbopack config" error in
  // dev. Railway production builds still run `next build --webpack` explicitly.
  turbopack: {},
  webpack: (config) => {
    // Solana / wallet-adapter packages pull in Node.js built-ins.
    // Replace them with browser-safe stubs so the client bundle compiles.
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      path: false,
      os: false,
      crypto: false,
      stream: false,
      buffer: false,
      zlib: false,
      http: false,
      https: false,
      net: false,
      tls: false,
      url: false,
      assert: false,
      events: false,
    };
    return config;
  },
};

export default nextConfig;
