import { defineConfig } from 'vite';
import { resolve } from 'path';
import dts from 'vite-plugin-dts';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [
    react({
      jsxRuntime: 'automatic'
    }),
    dts({
      insertTypesEntry: true,
      include: ['src/**/*'],
      exclude: ['src/**/*.test.*', 'src/**/*.spec.*']
    })
  ],
  build: {
    lib: {
      entry: resolve(__dirname, 'src/index.ts'),
      name: 'WnReact',
      fileName: (format) => `index.${format === 'es' ? 'mjs' : format}.js`,
      formats: ['es']
    },
    rollupOptions: {
      external: ['react', 'react-dom', 'wn-ts-web', 'wn-ts-core'],
      output: {
        globals: {
          react: 'React',
          'react-dom': 'ReactDOM',
          'wn-ts-web': 'WnTsWeb',
          'wn-ts-core': 'WnTsCore'
        }
      }
    },
    sourcemap: true,
    minify: false
  },
          resolve: {
            alias: {
              '@': resolve(__dirname, 'src'),
              'wn-ts-core': resolve(__dirname, '../wn-ts-core/src'),
              'wn-ts-web': resolve(__dirname, '../wn-ts-web/src')
            }
          }
});
