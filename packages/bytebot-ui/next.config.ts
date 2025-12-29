import type { NextConfig } from "next";
import dotenv from "dotenv";

dotenv.config();

const nextConfig: NextConfig = {
  transpilePackages: ["@bytebot/shared"],
  // Only use static export for production builds, not for development/Electron
  ...(process.env.NODE_ENV === 'production' ? {
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
