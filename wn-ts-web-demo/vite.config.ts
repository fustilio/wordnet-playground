import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    headers: {
      "Cross-Origin-Opener-Policy": "same-origin",
      "Cross-Origin-Embedder-Policy": "require-corp",
    },
    proxy: {
      // Proxy WordNet data sources to bypass CORS
      '/api/wordnet': {
        target: 'https://en-word.net',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/wordnet/, ''),
        configure: (proxy) => {
          proxy.on('error', (err) => {
            console.log('proxy error', err);
          });
          proxy.on('proxyReq', (proxyReq, req) => {
            console.log('Sending Request to the Target:', req.method, req.url);
          });
          proxy.on('proxyRes', (proxyRes, req) => {
            console.log('Received Response from the Target:', proxyRes.statusCode, req.url);
          });
        },
      },
      '/api/github': {
        target: 'https://github.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/github/, ''),
        configure: (proxy) => {
          proxy.on('error', (err) => {
            console.log('proxy error', err);
          });
          proxy.on('proxyReq', (proxyReq, req) => {
            console.log('Sending Request to GitHub:', req.method, req.url);
          });
          proxy.on('proxyRes', (proxyRes, req) => {
            console.log('Received Response from GitHub:', proxyRes.statusCode, req.url);
          });
        },
      },
      // Proxy for en-word.net static files
      '/api/en-word-net': {
        target: 'https://en-word.net',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/en-word-net/, ''),
        configure: (proxy) => {
          proxy.on('error', (err) => {
            console.log('en-word.net proxy error', err);
          });
          proxy.on('proxyReq', (proxyReq, req) => {
            console.log('Sending Request to en-word.net:', req.method, req.url);
          });
          proxy.on('proxyRes', (proxyRes, req) => {
            console.log('Received Response from en-word.net:', proxyRes.statusCode, req.url);
          });
        },
      },
      // Proxy for globalwordnet releases with better redirect handling
      '/api/globalwordnet': {
        target: 'https://github.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/globalwordnet/, '/globalwordnet'),
        configure: (proxy) => {
          proxy.on('error', (err) => {
            console.log('globalwordnet proxy error', err);
          });
          proxy.on('proxyReq', (proxyReq, req) => {
            console.log('Sending Request to globalwordnet:', req.method, req.url);
            // Only set headers if they haven't been set already
            if (!proxyReq.getHeader('Accept')) {
              proxyReq.setHeader('Accept', 'application/octet-stream');
            }
            if (!proxyReq.getHeader('User-Agent')) {
              proxyReq.setHeader('User-Agent', 'WordNet-Demo/1.0');
            }
          });
          proxy.on('proxyRes', (proxyRes, req) => {
            console.log('Received Response from globalwordnet:', proxyRes.statusCode, req.url);
          });
        },
        followRedirects: true,
      },
      // Proxy for raw.githubusercontent.com (more reliable for direct file access)
      '/api/raw-github': {
        target: 'https://raw.githubusercontent.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/raw-github/, ''),
        configure: (proxy) => {
          proxy.on('error', (err) => {
            console.log('raw-github proxy error', err);
          });
          proxy.on('proxyReq', (proxyReq, req) => {
            console.log('Sending Request to raw.githubusercontent.com:', req.method, req.url);
            // Only set headers if they haven't been set already
            if (!proxyReq.getHeader('Accept')) {
              proxyReq.setHeader('Accept', 'application/octet-stream');
            }
            if (!proxyReq.getHeader('User-Agent')) {
              proxyReq.setHeader('User-Agent', 'WordNet-Demo/1.0');
            }
          });
          proxy.on('proxyRes', (proxyRes, req) => {
            console.log('Received Response from raw.githubusercontent.com:', proxyRes.statusCode, req.url);
          });
        },
      },
      // Generic proxy for any external data source
      '/api/external': {
        target: 'https://httpbin.org',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/external/, ''),
        configure: (proxy) => {
          proxy.on('error', (err) => {
            console.log('external proxy error', err);
          });
          proxy.on('proxyReq', (proxyReq, req) => {
            console.log('Sending Request to external:', req.method, req.url);
          });
          proxy.on('proxyRes', (proxyRes, req) => {
            console.log('Received Response from external:', proxyRes.statusCode, req.url);
          });
        },
      },
    },
  },
  optimizeDeps: {
    exclude: ["@sqlite.org/sqlite-wasm"],
  },
})
