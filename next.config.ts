import type { NextConfig } from "next";
import path from "node:path";

const nextConfig: NextConfig = {
  output: "standalone",
  reactStrictMode: true,
  serverExternalPackages: ["better-sqlite3"],
  // A stray ~/package-lock.json outside this project otherwise confuses
  // Next's workspace-root detection during output file tracing.
  outputFileTracingRoot: path.join(__dirname),
};

export default nextConfig;
