import { defineConfig } from 'vite';
import path from 'node:path';

export default defineConfig({
  build: {
    lib: {
      entry: path.resolve(process.cwd(), 'src/index.ts'),
      name: 'WnTsWeb',
      fileName: (format) => `wn-ts-web.${format === 'es' ? 'mjs' : 'umd.cjs'}`,
      formats: ['es', 'umd'],
    },
    outDir: 'dist',
    emptyOutDir: true,
    rollupOptions: {
      external: ['wn-ts-core', '@sqlite.org/sqlite-wasm'],
      output: {
                  globals: {
            'wn-ts-core': 'WnTsCore',
            '@sqlite.org/sqlite-wasm': 'SqliteWasm'
          }
      }
    },
    minify: true,
  },
  resolve: {
    extensions: ['.ts', '.js', '.tsx', '.jsx']
  }
}); 