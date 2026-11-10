import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // The built-in local database ships WASM + data files that must be loaded
  // straight from node_modules instead of being bundled.
  serverExternalPackages: ["@electric-sql/pglite"],
  // Include the published-content snapshots in serverless functions so
  // request-time fs reads of content/** and data/** work on Vercel.
  outputFileTracingIncludes: {
    "/**": ["./content/**", "./data/**"],
  },
  // Hide the Next.js dev-tools bubble in the bottom-left during development.
  devIndicators: false,
};

export default nextConfig;
