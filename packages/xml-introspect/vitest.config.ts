import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    setupFiles: [],
    include: ['test/**/*.test.ts'],
    exclude: ['node_modules', 'dist'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'dist/',
        'test/',
        '**/*.d.ts',
        '**/*.config.*'
      ]
    },
    testTimeout: 60000, // 60 seconds for large XML processing
    hookTimeout: 20000, // 20 seconds for setup/teardown
    teardownTimeout: 20000, // 20 seconds for cleanup
    pool: 'forks', // Use fork mode to isolate tests
    poolOptions: {
      forks: {
        singleFork: true, // Use single fork to avoid memory issues
        maxForks: 1
      }
    }
  },
  resolve: {
    alias: {
      '@': './src'
    }
  }
});
