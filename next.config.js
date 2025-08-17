// next.config.js
const path = require("path");

/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    // Permite desplegar aunque haya errores de ESLint
    ignoreDuringBuilds: true,
  },
  webpack: (config) => {
    // Alias @ -> /src
    config.resolve.alias["@"] = path.resolve(__dirname, "src");
    return config;
  },
};

module.exports = nextConfig;
