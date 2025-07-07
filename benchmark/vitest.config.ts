import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['**/*.{test,spec,bench}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
    includeSource: ['lib/wordnet-libraries/**/*.{ts,tsx}'],
    exclude: ['**/node_modules/**', '**/dist/**', '**/cypress/**', '**/.{idea,git,cache,output,temp}/**'],
  },
}); 