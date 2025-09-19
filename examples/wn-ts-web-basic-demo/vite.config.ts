import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import comlink from 'vite-plugin-comlink'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [comlink(), react()],
  server: {
    headers: {
      'Cross-Origin-Opener-Policy': 'same-origin',
      'Cross-Origin-Embedder-Policy': 'require-corp',
    }
  },
  optimizeDeps: {
    exclude: ['@sqlite.org/sqlite-wasm']
  },
  worker: {
    format: 'es',
    plugins: () => [comlink()]
  }
})
