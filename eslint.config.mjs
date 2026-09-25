// eslint-config-next 16.x exports a native ESLint flat-config array —
// no FlatCompat shim (wrapping it causes a circular-structure crash in the
// eslintrc config validator).
import nextConfig from "eslint-config-next";

const eslintConfig = [
  ...nextConfig,
  {
    ignores: [
      "node_modules/**",
      ".next/**",
      "out/**",
      "build/**",
      "next-env.d.ts",
      "scripts/**/*.js",  // Allow CommonJS in scripts
      "scripts/**/*.mjs", // Ops/test scripts (node:test style, not linted)
    ],
  },
];

export default eslintConfig;
