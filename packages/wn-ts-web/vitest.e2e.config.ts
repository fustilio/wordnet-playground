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
      headless: false, // Set to true in CI
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
    testTimeout: 300000, // 5 minutes for E2E tests
    hookTimeout: 300000, // 5 minutes for E2E hooks
    silent: false, // Enable logging for debugging
    environment: "jsdom", // Use jsdom for browser-like environment
    setupFiles: ["test/browser/e2e/setup.ts"], // Setup file for e2e tests
  },
  server: {
    proxy: {
      // Proxy WordNet data sources to bypass CORS - matching vite.config.mjs
      "/api/wordnet": {
        target: "https://en-word.net",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/wordnet/, ""),
      },
      "/api/globalwordnet-ewn": {
        target: "https://github.com/globalwordnet/english-wordnet/releases/download",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/globalwordnet\//, "/"),
      },
      "/api/globalwordnet-cili": {
        target: "https://github.com/globalwordnet/cili/releases/download",
        changeOrigin: true,
        followRedirects: true,
        rewrite: (path) => path.replace(/^\/api\/globalwordnet-cili\//, "/"),
      },
      "/api/omwn-releases": {
        target: "https://github.com/omwn/omw-data/releases/download",
        changeOrigin: true,
        followRedirects: true,
        rewrite: (path) => path.replace(/^\/api\/omwn-releases\//, "/"),
      },
      "/api/raw-github": {
        target: "https://raw.githubusercontent.com",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/raw-github\//, "/"),
      },
      "/api/github": {
        target: "https://github.com",
        changeOrigin: true,
        followRedirects: false,
        rewrite: (path) => path.replace(/^\/api\/github\//, "/"),
      },
      "/api/github-api": {
        target: "https://api.github.com",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/github-api\//, "/"),
      },
      "/api/release-assets": {
        target: "https://release-assets.githubusercontent.com",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/release-assets\//, "/"),
      },
      "/api/external": {
        target: "https://",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/external\//, "/"),
      }
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
    exclude: ["@sqlite.org/sqlite-wasm", "xml-introspect"],
  },
});
