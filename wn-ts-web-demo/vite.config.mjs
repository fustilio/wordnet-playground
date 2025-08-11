import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import fs from 'node:fs'
import path from 'node:path'
import crypto from 'node:crypto'

// Log level for dev server proxy logs
const LOG_LEVEL = process.env.LOG_LEVEL || 'info'
const LOG_WEIGHT = { silent: 0, error: 1, warn: 2, info: 3, debug: 4 }
const logWeight = LOG_WEIGHT[LOG_LEVEL] ?? LOG_WEIGHT.info
const shouldLog = (min) => logWeight >= (LOG_WEIGHT[min] ?? LOG_WEIGHT.info)

const cacheDir = path.join(process.cwd(), '.cache', 'proxy')
if (!fs.existsSync(cacheDir)) fs.mkdirSync(cacheDir, { recursive: true })

const toCachePath = (urlPath) => {
  const hash = crypto.createHash('sha1').update(urlPath).digest('hex')
  return path.join(cacheDir, `${hash}.bin`)
}

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    {
      name: 'proxy-disk-cache',
      configureServer(server) {
        server.middlewares.use((req, res, next) => {
          const url = req.url || ''
          const cacheable = (
            url.startsWith('/api/en-word-net/') ||
            url.startsWith('/api/globalwordnet/') ||
            url.startsWith('/api/raw-github/') ||
            url.startsWith('/api/wordnet/') ||
            url.startsWith('/api/github/') ||
            url.startsWith('/api/external/')
          )
          if (!cacheable) return next()
          const filePath = toCachePath(url)
          if (fs.existsSync(filePath)) {
            if (shouldLog('info')) console.log('🔁 [cache] Serving from disk:', url)
            res.statusCode = 200
            res.setHeader('Content-Type', 'application/octet-stream')
            res.setHeader('X-Proxy-Cache', 'HIT')
            fs.createReadStream(filePath).pipe(res)
            return
          }
          return next()
        })
      }
    }
  ],
  server: {
    proxy: {
      // Proxy WordNet data sources to bypass CORS
      '/api/wordnet': {
        target: 'https://en-word.net',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/wordnet/, ''),
        configure: (proxy) => {
          // timing
          proxy.on('proxyReq', (proxyReq, req) => {
            // @ts-ignore attach timing marker
            req.__startTs = Date.now()
          })
          proxy.on('error', (err) => {
            if (shouldLog('warn')) console.log('proxy error', err);
          });
          proxy.on('proxyReq', (proxyReq, req) => {
            if (shouldLog('debug')) console.log('Sending Request to the Target:', req.method, req.url);
          });
          proxy.on('proxyRes', (proxyRes, req) => {
            if (shouldLog('info')) console.log('⬅️ en-word.net (generic)', proxyRes.statusCode, req.method, req.url);
          });
          proxy.on('proxyRes', (proxyRes, req, res) => {
            const started = /** @type {any} */ (req).__startTs || Date.now()
            const dur = Date.now() - started
            try { res.setHeader('X-Proxy-Duration-Ms', String(dur)) } catch {}
            if (shouldLog('info')) console.log('⏱ en-word.net duration', dur + 'ms', req.method, req.url)
          })
          proxy.on('proxyRes', (proxyRes, req, res) => {
            const urlPath = req.url;
            if (proxyRes.statusCode === 200) {
              const filePath = toCachePath('/api/wordnet' + urlPath)
              const writeStream = fs.createWriteStream(filePath)
              proxyRes.pipe(writeStream)
            }
          })
        }
      },
      '/api/github': {
        target: 'https://api.github.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/github/, ''),
        configure: (proxy) => {
          proxy.on('proxyReq', (proxyReq, req) => { /** @type {any} */ (req).__startTs = Date.now() })
          proxy.on('error', (err) => {
            if (shouldLog('warn')) console.log('proxy error', err);
          });
          proxy.on('proxyReq', (proxyReq, req) => {
            if (shouldLog('debug')) console.log('Sending Request to GitHub:', req.method, req.url);
          });
          proxy.on('proxyRes', (proxyRes, req) => {
            if (shouldLog('info')) console.log('⬅️ github.com', proxyRes.statusCode, req.method, req.url);
          });
          proxy.on('proxyRes', (proxyRes, req, res) => {
            const started = /** @type {any} */ (req).__startTs || Date.now()
            const dur = Date.now() - started
            try { res.setHeader('X-Proxy-Duration-Ms', String(dur)) } catch {}
            if (shouldLog('info')) console.log('⏱ github.com duration', dur + 'ms', req.method, req.url)
          })
          proxy.on('proxyRes', (proxyRes, req, res) => {
            const urlPath = req.url;
            if (proxyRes.statusCode === 200) {
              const filePath = toCachePath('/api/github' + urlPath)
              const writeStream = fs.createWriteStream(filePath)
              proxyRes.pipe(writeStream)
            }
          })
        }
      },
      '/api/en-word-net': {
        target: 'https://en-word.net',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/en-word-net/, ''),
        configure: (proxy) => {
          proxy.on('proxyReq', (proxyReq, req) => { /** @type {any} */ (req).__startTs = Date.now() })
          proxy.on('error', (err) => {
            if (shouldLog('warn')) console.log('en-word.net proxy error', err);
          });
          proxy.on('proxyReq', (proxyReq, req) => {
            if (shouldLog('debug')) console.log('Sending Request to en-word.net:', req.method, req.url);
          });
          proxy.on('proxyRes', (proxyRes, req) => {
            if (shouldLog('info')) console.log('⬅️ en-word.net', proxyRes.statusCode, req.method, req.url, '| headers:', proxyRes.headers['content-type'], proxyRes.headers['content-length']);
          });
          proxy.on('proxyRes', (proxyRes, req, res) => {
            const started = /** @type {any} */ (req).__startTs || Date.now()
            const dur = Date.now() - started
            try { res.setHeader('X-Proxy-Duration-Ms', String(dur)) } catch {}
            if (shouldLog('info')) console.log('⏱ en-word.net duration', dur + 'ms', req.method, req.url)
          })
          // Save successful responses to cache
          proxy.on('proxyRes', (proxyRes, req, res) => {
            const urlPath = req.url;
            if (proxyRes.statusCode === 200) {
              const filePath = toCachePath('/api/en-word-net' + urlPath)
              const writeStream = fs.createWriteStream(filePath)
              proxyRes.pipe(writeStream)
            }
          })
        }
      },
      '/api/globalwordnet': {
        target: 'https://github.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/globalwordnet/, '/globalwordnet'),
        configure: (proxy) => {
          proxy.on('proxyReq', (proxyReq, req) => { /** @type {any} */ (req).__startTs = Date.now() })
          proxy.on('error', (err) => {
            if (shouldLog('warn')) console.log('globalwordnet proxy error', err);
          });
          proxy.on('proxyReq', (proxyReq, req) => {
            if (shouldLog('debug')) console.log('Sending Request to globalwordnet:', req.method, req.url);
            // Only set headers if they haven't been set already
            if (!proxyReq.getHeader('Accept')) {
              proxyReq.setHeader('Accept', 'application/octet-stream');
            }
            if (!proxyReq.getHeader('User-Agent')) {
              proxyReq.setHeader('User-Agent', 'WordNet-Demo/1.0');
            }
          });
          proxy.on('proxyRes', (proxyRes, req) => {
            if (shouldLog('info')) console.log('⬅️ globalwordnet', proxyRes.statusCode, req.method, req.url);
          });
          proxy.on('proxyRes', (proxyRes, req, res) => {
            const started = /** @type {any} */ (req).__startTs || Date.now()
            const dur = Date.now() - started
            try { res.setHeader('X-Proxy-Duration-Ms', String(dur)) } catch {}
            if (shouldLog('info')) console.log('⏱ globalwordnet duration', dur + 'ms', req.method, req.url)
          })
          proxy.on('proxyRes', (proxyRes, req, res) => {
            const urlPath = req.url;
            if (proxyRes.statusCode === 200) {
              const filePath = toCachePath('/api/globalwordnet' + urlPath)
              const writeStream = fs.createWriteStream(filePath)
              proxyRes.pipe(writeStream)
            }
          })
        }
      },
      '/api/raw-github': {
        target: 'https://raw.githubusercontent.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/raw-github/, ''),
        configure: (proxy) => {
          proxy.on('proxyReq', (proxyReq, req) => { /** @type {any} */ (req).__startTs = Date.now() })
          proxy.on('error', (err) => {
            if (shouldLog('warn')) console.log('raw-github proxy error', err);
          });
          proxy.on('proxyReq', (proxyReq, req) => {
            if (shouldLog('debug')) console.log('Sending Request to raw.githubusercontent.com:', req.method, req.url);
            // Only set headers if they haven't been set already
            if (!proxyReq.getHeader('Accept')) {
              proxyReq.setHeader('Accept', 'application/octet-stream');
            }
            if (!proxyReq.getHeader('User-Agent')) {
              proxyReq.setHeader('User-Agent', 'WordNet-Demo/1.0');
            }
          });
          proxy.on('proxyRes', (proxyRes, req) => {
            if (shouldLog('info')) console.log('⬅️ raw.githubusercontent.com', proxyRes.statusCode, req.method, req.url);
          });
          proxy.on('proxyRes', (proxyRes, req, res) => {
            const started = /** @type {any} */ (req).__startTs || Date.now()
            const dur = Date.now() - started
            try { res.setHeader('X-Proxy-Duration-Ms', String(dur)) } catch {}
            if (shouldLog('info')) console.log('⏱ raw.githubusercontent.com duration', dur + 'ms', req.method, req.url)
          })
          proxy.on('proxyRes', (proxyRes, req, res) => {
            const urlPath = req.url;
            if (proxyRes.statusCode === 200) {
              const filePath = toCachePath('/api/raw-github' + urlPath)
              const writeStream = fs.createWriteStream(filePath)
              proxyRes.pipe(writeStream)
            }
          })
        }
      },
      '/api/external': {
        target: 'https://en-word.net',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/external/, ''),
        configure: (proxy) => {
          proxy.on('proxyReq', (proxyReq, req) => { /** @type {any} */ (req).__startTs = Date.now() })
          proxy.on('error', (err) => {
            if (shouldLog('warn')) console.log('external proxy error', err);
          });
          proxy.on('proxyReq', (proxyReq, req) => {
            if (shouldLog('debug')) console.log('Sending Request to external:', req.method, req.url);
          });
          proxy.on('proxyRes', (proxyRes, req) => {
            if (shouldLog('info')) console.log('⬅️ external', proxyRes.statusCode, req.method, req.url);
          });
          proxy.on('proxyRes', (proxyRes, req, res) => {
            const started = /** @type {any} */ (req).__startTs || Date.now()
            const dur = Date.now() - started
            try { res.setHeader('X-Proxy-Duration-Ms', String(dur)) } catch {}
            if (shouldLog('info')) console.log('⏱ external duration', dur + 'ms', req.method, req.url)
          })
          proxy.on('proxyRes', (proxyRes, req, res) => {
            const urlPath = req.url;
            if (proxyRes.statusCode === 200) {
              const filePath = toCachePath('/api/external' + urlPath)
              const writeStream = fs.createWriteStream(filePath)
              proxyRes.pipe(writeStream)
            }
          })
        }
      },
    }
  },
  optimizeDeps: {
    exclude: ["@sqlite.org/sqlite-wasm"],
  },
})
