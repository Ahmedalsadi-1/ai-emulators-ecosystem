import type { NextConfig } from "next";
import dotenv from "dotenv";

dotenv.config();

const nextConfig: NextConfig = {
  transpilePackages: ["@bytebot/shared"],
  // Note: 'output: export' removed - incompatible with dynamic routes and server mode
  // For static exports, set OUTPUT_EXPORT=true environment variable
  ...(process.env.OUTPUT_EXPORT === 'true' ? {
    output: 'export',
    trailingSlash: true,
  } : {}),
  images: {
    unoptimized: true,
  },
  serverExternalPackages: [],
  // Disable static optimization for pages with client-side features
  generateBuildId: async () => {
    return 'build-' + Date.now()
  },
};

export default nextConfig;
