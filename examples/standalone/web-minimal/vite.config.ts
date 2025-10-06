import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import comlink from 'vite-plugin-comlink';

export default defineConfig({
  plugins: [comlink(), react()],
  server: {
    headers: {
      'Cross-Origin-Opener-Policy': 'same-origin',
      'Cross-Origin-Embedder-Policy': 'require-corp'
    }
  },
  worker: {
    format: 'es',
    plugins: () => [comlink()]
  }
});

