import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import comlink from 'vite-plugin-comlink';
import { getWordNetServerConfig, getWordNetOptimizeDeps, getWordNetWorkerConfig } from 'wn-ts-web/proxy-config';

export default defineConfig({
  plugins: [comlink(), react()],
  server: getWordNetServerConfig(),
  optimizeDeps: getWordNetOptimizeDeps(),
  worker: {
    ...getWordNetWorkerConfig(),
    plugins: () => [comlink()]
  }
});

