import { defineConfig } from "vitest/config";
import path from "path";

// This config is for end-to-end browser tests that use the actual browser environment
// and real dependencies like SQLite WASM
export default defineConfig({
  test: {
    browser: {
      enabled: true,
      provider: "playwright",
      instances: [{ browser: "chromium" }],
      headless: true, // Set to true for CI and faster execution
    },
    fileParallelism: false,
    globals: true,
    include: [
      "test/browser/e2e/**/*.{test,spec}.{js,ts,jsx,tsx}",
      "test/e2e/**/*.{test,spec}.{js,ts,jsx,tsx}"
    ],
    pool: "forks",
    poolOptions: {
      forks: {
        singleFork: true,
      },
    },
    testTimeout: 60000, // 1 minute for E2E tests
    hookTimeout: 30000, // 30 seconds for hooks
    teardownTimeout: 30000, // 30 seconds for teardown
    // Add retry logic for flaky tests
    retry: 1,
    // Add better error reporting
    reporters: ["verbose"],
    // Add environment variables for test configuration
    env: {
      VITE_LOG_LEVEL: "warn", // Reduce logging noise
      VITE_STRESS_LIGHT: "1", // Use light stress mode for faster tests
      VITE_TEST_TIMEOUT: "60000", // 1 minute timeout
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      "test": path.resolve(__dirname, "./test"),
    },
  },
});
