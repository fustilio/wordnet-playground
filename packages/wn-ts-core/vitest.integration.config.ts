import { defineConfig } from 'vitest/config'
import { resolve } from 'path'

export default defineConfig({
  test: {
    include: [
      'tests/integration/**/*.{test,spec}.{js,ts,jsx,tsx}',
      'src/**/*.integration.{test,spec}.{js,ts,jsx,tsx}'
    ],
    exclude: [
      'tests/unit/**/*',
      'tests/e2e/**/*',
      "**/*.unit.test.ts",
      "**/*.e2e.test.ts"
    ],
    globals: true,
    environment: 'node',
    setupFiles: [],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'tests/',
        'dist/',
        '**/*.d.ts',
        '**/*.config.*',
        '**/setup.ts'
      ]
    },
    testTimeout: 10000,
    hookTimeout: 10000
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, './src')
    }
  }
}) 