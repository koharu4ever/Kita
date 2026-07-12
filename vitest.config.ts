import path from "node:path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(process.cwd(), "src"),
    },
  },
  test: {
    clearMocks: true,
    environment: "node",
    include: ["src/**/__tests__/**/*.test.ts"],
    restoreMocks: true,
  },
});
