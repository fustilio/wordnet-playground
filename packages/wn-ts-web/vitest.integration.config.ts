import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  test: {
    browser: {
      enabled: true,
      provider: "playwright",
      // https://vitest.dev/guide/browser/playwright
      instances: [{ browser: "chromium" }],
    },
    fileParallelism: false,
    setupFiles: ["./test/integration/setup.ts"],
    globals: true,
    // Only include browser-specific tests
    include: [
      "test/integration/**/*.{test,spec}.{js,ts,jsx,tsx}"
    ],
    // Exclude E2E tests from this browser-functional test suite
    exclude: [
      // "test/integration/e2e/**/*",
    ],
    pool: "forks",
    poolOptions: {
      forks: {
        singleFork: true,
      },
    },
    // testTimeout: 30000, // 30 seconds for browser tests
    // hookTimeout: 30000, // 30 seconds for browser hooks
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html"],
      exclude: [
        "node_modules/",
        "dist/",
        "**/*.d.ts",
        "**/*.config.*",
        "test/browser/**/*", // Exclude browser tests from coverage
      ],
    },
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
    include: ["pako", "zod", "smol-toml", "fast-xml-parser"],
  },
});
