// tailwind.config.ts
import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        rc: ["var(--font-rc)", "system-ui", "sans-serif"], // Roboto Condensed
        pop: ["var(--font-pop)", "system-ui", "sans-serif"], // Poppins
      },
    },
  },
  plugins: [],
};

export default config;
