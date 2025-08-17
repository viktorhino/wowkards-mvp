// next.config.ts
import path from "path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Desactiva ESLint durante el build de producción en Vercel
  eslint: {
    ignoreDuringBuilds: true,
  },
  webpack: (config) => {
    // Alias @ -> /src
    config.resolve.alias["@"] = path.resolve(__dirname, "src");
    return config;
  },
};

export default nextConfig;
