import { defineConfig } from "vitest/config";
import path from "node:path";

export default defineConfig({
  test: {
    environment: "edge-runtime",
    include: [
      "lib/**/*.test.ts",
      "convex/**/*.test.ts",
      "app/api/**/*.test.ts",
    ],
    server: {
      deps: {
        inline: ["convex-test"],
      },
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname),
    },
  },
});
