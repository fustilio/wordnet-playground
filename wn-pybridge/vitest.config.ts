import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['tests/**/*.test.ts'],
    exclude: ['node_modules', 'dist'],
    setupFiles: [],
    testTimeout: 120000,
    hookTimeout: 120000,
  },
  resolve: {
    alias: {
      '@': './src',
    },
  },
}); 