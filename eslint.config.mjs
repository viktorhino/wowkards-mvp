// eslint.config.mjs
import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({ baseDirectory: __dirname });

export default [
  // Carpetas a ignorar (sustituye .eslintignore)
  { ignores: ["node_modules/**", ".next/**", "dist/**"] },

  // Config de Next + TypeScript (vía compat)
  ...compat.extends("next/core-web-vitals", "next/typescript"),
];
