import { defineConfig } from 'vitest/config'
import { resolve } from 'path'

export default defineConfig({
  test: {
    include: [
      'tests/unit/**/*.{test,spec}.{js,ts,jsx,tsx}',
      'src/**/*.unit.{test,spec}.{js,ts,jsx,tsx}'
    ],
    exclude: [
      'tests/integration/**/*',
      'tests/e2e/**/*'
    ],
    globals: true,
    environment: 'node',
    setupFiles: ['./tests/unit/setup.ts'],
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