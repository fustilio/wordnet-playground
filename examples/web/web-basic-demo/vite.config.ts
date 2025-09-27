import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import comlink from 'vite-plugin-comlink'
import { getWordNetServerConfig, getWordNetOptimizeDeps, getWordNetWorkerConfig } from 'wn-ts-web/proxy-config'

// Custom middleware for /api/external proxy
function makeExternalProxyPlugin() {
  return {
    name: "external-proxy",
    configureServer(server) {
      server.middlewares.use("/api/external", async (req, res, next) => {
        const url = req.url || "";
        const targetUrl = url.replace(/^\/api\/external\//, "https://");
        
        console.log("🔁 [external] Proxying to:", targetUrl);
        
        try {
          const response = await fetch(targetUrl);
          const buffer = await response.arrayBuffer();
          
          res.statusCode = response.status;
          res.setHeader("Content-Type", response.headers.get("content-type") || "application/octet-stream");
          res.end(Buffer.from(buffer));
        } catch (error) {
          console.warn("❌ [external] Proxy error:", error.message);
          res.statusCode = 500;
          res.end("Proxy error: " + error.message);
        }
      });
    },
  };
}

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [comlink(), react(), makeExternalProxyPlugin()],
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
