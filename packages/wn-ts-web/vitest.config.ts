import { defineConfig } from "vitest/config";
import path from "node:path";

export default defineConfig({
  test: {
    environment: "jsdom",
    setupFiles: ["./test/setup.ts"],
    globals: true,
    include: [
      "test/**/*.{test,spec}.{js,ts,jsx,tsx}",
      "src/**/*.{test,spec}.{js,ts,jsx,tsx}",
    ],
    includeSource: ["src/**/*.{ts,tsx}"],
    exclude: ["test/browser/**/*", "test/e2e/**/*"],
    testTimeout: 10000, // 10 second timeout
    hookTimeout: 10000, // 10 second timeout for hooks
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html"],
      exclude: ["node_modules/", "dist/", "**/*.d.ts", "**/*.config.*"],
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  define: {
    "import.meta.vitest": "undefined",
  },
});
