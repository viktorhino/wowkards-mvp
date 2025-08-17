// .eslintrc.cjs
module.exports = {
  root: true,
  extends: ["next/core-web-vitals", "plugin:@typescript-eslint/recommended"],
  parserOptions: { ecmaVersion: "latest", sourceType: "module" },
  rules: {
    // Tipo
    "@typescript-eslint/no-explicit-any": "warn",
    "@typescript-eslint/ban-ts-comment": "warn",
    "@typescript-eslint/no-unused-vars": ["warn", { argsIgnorePattern: "^_" }],
    "prefer-const": "warn",

    // Reglas de Next (relaja sin apagar del todo)
    "next/no-img-element": "warn",
    "@next/next/no-img-element": "warn",
    "next/no-html-link-for-pages": "off",
    "@next/next/no-html-link-for-pages": "off",
  },
};
