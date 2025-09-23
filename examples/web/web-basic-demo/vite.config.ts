import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import comlink from 'vite-plugin-comlink'
import { getWordNetServerConfig, getWordNetOptimizeDeps, getWordNetWorkerConfig } from '../shared-proxy-config'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [comlink(), react()],
  server: {
    ...getWordNetServerConfig(),
    // Add development optimizations
    hmr: {
      overlay: false // Reduce overlay noise during development
    }
  },
  optimizeDeps: {
    ...getWordNetOptimizeDeps(),
    // Force pre-bundling of common dependencies
    force: true
  },
  worker: {
    ...getWordNetWorkerConfig(),
    plugins: () => [comlink()],
    // Optimize worker bundling
    format: 'es'
  },
  // Add build optimizations
  build: {
    target: 'esnext',
    minify: 'esbuild',
    rollupOptions: {
      output: {
        manualChunks: {
          'sqlite-wasm': ['@sqlite.org/sqlite-wasm'],
          'wordnet-core': ['wn-ts-core'],
          'comlink': ['comlink']
        }
      }
    }
  }
})
