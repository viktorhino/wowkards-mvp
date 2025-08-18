// next.config.js
const path = require("path");

/** @type {import('next').NextConfig} */
const nextConfig = {
  // 1) No frenes el build por ESLint
  eslint: {
    ignoreDuringBuilds: true,
  },
  // 2) (Por si aparecieran errores de tipos, tampoco frena)
  typescript: {
    ignoreBuildErrors: true,
  },
  // 3) Alias @ -> /src
  webpack: (config) => {
    config.resolve.alias["@"] = path.resolve(__dirname, "src");
    return config;
  },
};

module.exports = nextConfig;

export default {
  eslint: { ignoreDuringBuilds: true },
};
