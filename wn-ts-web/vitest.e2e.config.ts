import { defineConfig } from "vitest/config";
import path from "path";

// This config is for end-to-end browser tests that require a live network.
// It does NOT use the setup file with mocks.
export default defineConfig({
  test: {
    browser: {
      enabled: true,
      provider: "playwright",
      instances: [{ browser: "chromium" }],
    },
    fileParallelism: false,
    // NO setupFiles here to avoid mocking fetch
    globals: true,
    include: ["test/browser/e2e/**/*.{test,spec}.{js,ts,jsx,tsx}"],
    pool: "forks",
    poolOptions: {
      forks: {
        singleFork: true,
      },
    },
    testTimeout: 300000, // 60 seconds for E2E tests
    hookTimeout: 300000, // 60 seconds for E2E hooks
    silent: true
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
