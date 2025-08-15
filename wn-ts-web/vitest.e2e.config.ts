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
    testTimeout: 60000, // 1 minute for E2E tests (reduced from 5 minutes)
    hookTimeout: 60000, // 1 minute for E2E hooks (reduced from 5 minutes)
    silent: false, // Enable logging for debugging
    environment: "jsdom", // Use jsdom for browser-like environment
    setupFiles: ["test/e2e/setup.ts"], // Setup file for e2e tests
  },
  server: {
    proxy: {
      "/api/en-word-net": {
        target: "https://en-word.net",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/en-word-net/, ""),
      },
      "/api/globalwordnet": {
        target: "https://github.com",
        changeOrigin: true,
        rewrite: (path) =>
          path.replace(/^\/api\/globalwordnet/, "/globalwordnet"),
      },
      "/api/wordnet-dk": {
        target: "https://wordnet.dk",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/wordnet-dk/, ""),
      },
    },
    headers: {
      "Cross-Origin-Opener-Policy": "same-origin",
      "Cross-Origin-Embedder-Policy": "require-corp",
    },
  },
  resolve: {
    extensions: [".ts", ".js", ".tsx", ".jsx"],
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  optimizeDeps: {
    exclude: ["@sqlite.org/sqlite-wasm"],
  },
});
