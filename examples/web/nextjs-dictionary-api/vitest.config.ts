import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['**/*.test.{ts,js,mjs}'],
    exclude: ['node_modules', '.next', 'dist'],
    testTimeout: 30000,
    // Performance tests can take longer - they set their own timeouts
    hookTimeout: 600000, // 10 minutes for hooks
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './'),
    },
  },
  // Allow dynamic imports with variables for dictionary files
  optimizeDeps: {
    exclude: ['dict-en-th.js', 'dict-en-fr.js', 'dict-th-fr.js'],
  },
});
