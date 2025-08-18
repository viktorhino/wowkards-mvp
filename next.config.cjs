// next.config.mjs  (ESM)
/** @type {import('next').NextConfig} */

const nextConfig = {
  //reactStrictMode: true,

  // Si aún tienes warnings de ESLint/TS en build, mantenlo en true; si ya está limpio, pon false.
  eslint: { ignoreDuringBuilds: true },
  typescript: { ignoreBuildErrors: false },

  // Si en el futuro usas next/image con dominios remotos, añade aquí tus hosts:
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "**.supabase.co" },
      // { protocol: "https", hostname: "images.unsplash.com" },
    ],
  },
};

module.exports = nextConfig;

//export default nextConfig;
