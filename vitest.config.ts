import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  test: {
    include: ["server/test/**/*.test.ts"],
    setupFiles: ["server/test/setup.ts"],
    globals: false,
    pool: "forks",
    fileParallelism: false,
  },
  resolve: {
    alias: {
      "@shared": path.resolve(__dirname, "./shared"),
      "@server": path.resolve(__dirname, "./server/src"),
    },
  },
});
