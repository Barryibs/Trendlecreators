import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["puppeteer"],
  experimental: {
    proxyTimeout: 120000,
  },
};

export default nextConfig;
