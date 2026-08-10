import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";
import convexPlugin from "@convex-dev/eslint-plugin";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  ...convexPlugin.configs.recommended,
  {
    files: ["**/convex/**/*.ts"],
    rules: {
      // Project still uses Id-typed single-arg db.get/patch/delete (Convex 1.32).
      // Re-enable when migrating to the table-name-first API.
      "@convex-dev/explicit-table-ids": "off",
    },
  },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // Vitest / convex-test helpers live next to sources but are not Convex modules.
    "convex/**/*.test.ts",
  ]),
]);

export default eslintConfig;
