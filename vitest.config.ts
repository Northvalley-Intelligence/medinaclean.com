import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: {
      "@": new URL("./src", import.meta.url).pathname
    }
  },
  test: {
    exclude: ["node_modules/**", ".next/**", "tests/e2e/**"],
    coverage: {
      include: [
        "src/lib/admin-auth.ts",
        "src/lib/client-records.ts",
        "src/lib/operations-records.ts",
        "src/lib/service-area.ts"
      ],
      provider: "v8",
      reporter: ["text", "json-summary"],
      thresholds: {
        branches: 70,
        functions: 70,
        lines: 70,
        statements: 70
      }
    }
  }
});
