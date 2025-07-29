import { defineConfig } from 'vite';
import path from 'node:path'; // Use node:path for ESM compatibility
// Note: For type safety, ensure @types/node and vite are installed

export default defineConfig({
  build: {
    lib: {
      entry: path.resolve(process.cwd(), 'src/index.ts'), // Use process.cwd() for cross-platform
      name: 'wn-ts-web',
      fileName: 'wn-ts-web.min',
      formats: ['es'],
    },
    outDir: 'dist',
    emptyOutDir: true,
    rollupOptions: {
      external: ['wn-ts'], // Externalize wn-ts for monorepo compatibility
     
    },
    minify: true,
  },
}); 