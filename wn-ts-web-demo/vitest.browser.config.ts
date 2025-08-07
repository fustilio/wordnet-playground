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
  server: {
    headers: {
      "Cross-Origin-Opener-Policy": "same-origin",
      "Cross-Origin-Embedder-Policy": "require-corp",
    },
    proxy: {
      // Proxy WordNet data sources to bypass CORS
      '/api/wordnet': {
        target: 'https://en-word.net',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/wordnet/, ''),
      },
      '/api/github': {
        target: 'https://github.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/github/, ''),
      },
      // Proxy for en-word.net static files
      '/api/en-word-net': {
        target: 'https://en-word.net',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/en-word-net/, ''),
      },
      // Proxy for globalwordnet releases with better redirect handling
      '/api/globalwordnet': {
        target: 'https://github.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/globalwordnet/, '/globalwordnet'),
        followRedirects: true,
      },
      // Proxy for raw.githubusercontent.com (more reliable for direct file access)
      '/api/raw-github': {
        target: 'https://raw.githubusercontent.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/raw-github/, ''),
      },
      // Generic proxy for any external data source
      '/api/external': {
        target: 'https://httpbin.org',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/external/, ''),
      },
    },
  },
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
    silent: true
  }
});
