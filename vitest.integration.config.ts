import path from "node:path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(process.cwd(), "src"),
      "@payload-config": path.resolve(process.cwd(), "payload.config.ts"),
    },
  },
  test: {
    clearMocks: true,
    environment: "node",
    fileParallelism: false,
    hookTimeout: 30_000,
    include: ["tests/integration/**/*.test.ts"],
    maxWorkers: 1,
    restoreMocks: true,
    testTimeout: 30_000,
  },
});
