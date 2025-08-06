import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

import tailwindcss from "@tailwindcss/vite";

/**
 * Optimized Test Scripts:
 * - pnpm test:quick - Fast sanity check test only
 * - pnpm test:real-data - Real data loading tests only  
 * - pnpm test:focus - Single test: "should load thousands of synsets from real WordNet data"
 * - pnpm test:parser - Single test: "should validate browser-compatible parser handles large XML files"
 * - pnpm test:debug - Extended timeout (5 minutes) for debugging
 */
export default defineConfig({
  plugins: [react(), tailwindcss()],
  test: {
    browser: {
      enabled: true,
      provider: "playwright",
      // https://vitest.dev/guide/browser/playwright
      instances: [{ browser: "chromium" }],
      headless: true,
    },
    fileParallelism: false,
    // Increase timeout for e2e tests that need to download large WordNet data
    testTimeout: 120000, // 2 minutes for large data downloads
    hookTimeout: 120000, // 2 minutes for setup/teardown

  }
});
