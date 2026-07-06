import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  typescript: {
    ignoreBuildErrors: true,
  },
  reactStrictMode: false,
  // Allow dev-origin requests so the preview proxy works correctly.
  allowedDevOrigins: ["*"],
};

export default nextConfig;
