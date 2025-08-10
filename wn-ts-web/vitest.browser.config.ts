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
    setupFiles: ["./test/browser/setup.ts"],
    globals: true,
    // Only include browser-specific tests
    include: ["test/browser/**/*.{test,spec}.{js,ts,jsx,tsx}"],
    // Exclude Node.js and E2E tests
    exclude: [
      "test/browser/e2e/**/*",
      "test/factory.test.ts",
      "test/kysely-integration.test.ts",
      "test/sqlite-wasm-api.test.ts",
      "test/sqlite-wasm-dialect.test.ts",
      "test/kysely-sqlite-wasm.test.ts",
      "test/web-database.test.ts",
      "test/web-wordnet.test.ts",
      "test/kysely-integration-comprehensive.test.ts",
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
