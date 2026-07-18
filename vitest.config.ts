import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";

// Unit tests run in a Node environment against the pure library modules.
// The `@/*` path alias mirrors tsconfig.json so tests import the same way the
// app does.
export default defineConfig({
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./", import.meta.url)),
    },
  },
  test: {
    environment: "node",
    include: ["tests/**/*.test.ts"],
  },
});
