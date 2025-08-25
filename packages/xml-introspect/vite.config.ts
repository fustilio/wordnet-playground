import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    target: 'node18',
    lib: {
      entry: 'src/cli.ts',
      formats: ['es'],
      fileName: 'cli'
    },
    rollupOptions: {
      external: ['fs', 'path', 'process', 'stream', 'util', 'crypto', 'sax'],
      output: {
        entryFileNames: 'cli.js'
      }
    }
  },
  optimizeDeps: {
    exclude: ["sax", "xmllint-wasm"],
  },
});