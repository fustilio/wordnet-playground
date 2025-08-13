import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import comlink from "vite-plugin-comlink";

// Log level for dev server proxy logs
const LOG_LEVEL = process.env.LOG_LEVEL || "info";
const LOG_WEIGHT = { silent: 0, error: 1, warn: 2, info: 3, debug: 4 };
const logWeight = LOG_WEIGHT[LOG_LEVEL] ?? LOG_WEIGHT.info;
const shouldLog = (min) => logWeight >= (LOG_WEIGHT[min] ?? LOG_WEIGHT.info);

const cacheDir = path.join(process.cwd(), ".cache", "proxy");
if (!fs.existsSync(cacheDir)) fs.mkdirSync(cacheDir, { recursive: true });

const toCachePath = (urlPath) => {
  const hash = crypto.createHash("sha1").update(urlPath).digest("hex");
  return path.join(cacheDir, `${hash}.bin`);
};

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    comlink(),
    react(),
    tailwindcss(),
    {
      name: "proxy-disk-cache",
      configureServer(server) {
        server.middlewares.use((req, res, next) => {
          const url = req.url || "";
          const cacheable =
            url.startsWith("/api/en-word-net/") ||
            url.startsWith("/api/globalwordnet/") ||
            url.startsWith("/api/raw-github/") ||
            url.startsWith("/api/wordnet/") ||
            url.startsWith("/api/github/") ||
            url.startsWith("/api/external/");
          if (!cacheable) return next();
          const filePath = toCachePath(url);
          if (fs.existsSync(filePath)) {
            if (shouldLog("info"))
              console.log("🔁 [cache] Serving from disk:", url);
            res.statusCode = 200;
            res.setHeader("Content-Type", "application/octet-stream");
            res.setHeader("X-Proxy-Cache", "HIT");
            fs.createReadStream(filePath).pipe(res);
            return;
          }
          return next();
        });
      },
    },
  ],
  worker: {
    format: "es",
    plugins: () => [comlink()],
  },
  server: {
    // Ensure consistent port and enable COOP/COEP for SharedArrayBuffer/OPFS worker support
    headers: {
      "Cross-Origin-Opener-Policy": "same-origin",
      "Cross-Origin-Embedder-Policy": "require-corp",
    },
    proxy: {
      // Proxy WordNet data sources to bypass CORS
      "/api/wordnet": {
        target: "https://en-word.net",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/wordnet/, ""),
        configure: (proxy) => {
          // timing
          proxy.on("proxyReq", (proxyReq, req) => {
            // @ts-ignore attach timing marker
            req.__startTs = Date.now();
          });
          proxy.on("error", (err) => {
            if (shouldLog("warn")) console.log("proxy error", err);
          });
          proxy.on("proxyRes", (proxyRes, req, res) => {
            const url = req.url || "";
            if (shouldLog("info")) console.log("🔁 [forward]", url);
          });
        },
      },
      "/api/globalwordnet": {
        target: "https://github.com/globalwordnet/english-wordnet/releases/download",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/globalwordnet\//, "/"),
        configure: (proxy) => {
          proxy.on("error", (err) => {
            if (shouldLog("warn")) console.log("proxy error", err);
          });
          proxy.on("proxyRes", (proxyRes, req, res) => {
            const url = req.url || "";
            if (shouldLog("info")) console.log("🔁 [forward]", url);
          });
        },
      },
      "/api/raw-github": {
        target: "https://raw.githubusercontent.com",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/raw-github\//, "/"),
        configure: (proxy) => {
          proxy.on("error", (err) => {
            if (shouldLog("warn")) console.log("proxy error", err);
          });
          proxy.on("proxyRes", (proxyRes, req, res) => {
            const url = req.url || "";
            if (shouldLog("info")) console.log("🔁 [forward]", url);
          });
        },
      },
      "/api/github": {
        target: "https://api.github.com",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/github\//, "/"),
        configure: (proxy) => {
          proxy.on("error", (err) => {
            if (shouldLog("warn")) console.log("proxy error", err);
          });
          proxy.on("proxyRes", (proxyRes, req, res) => {
            const url = req.url || "";
            if (shouldLog("info")) console.log("🔁 [forward]", url);
          });
        },
      },
      "/api/external": {
        target: "https://",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/external\//, "/"),
        configure: (proxy) => {
          proxy.on("error", (err) => {
            if (shouldLog("warn")) console.log("proxy error", err);
          });
          proxy.on("proxyRes", (proxyRes, req, res) => {
            const url = req.url || "";
            if (shouldLog("info")) console.log("🔁 [forward]", url);
            // Cache successful GETs to disk
            const filePath = toCachePath(url);
            if (req.method === "GET" && proxyRes.statusCode === 200) {
              if (shouldLog("info")) console.log("💾 [cache] Writing to disk:", url);
              const writeStream = fs.createWriteStream(filePath);
              proxyRes.pipe(writeStream);
            }
          });
        }
      },
    },
  },
  optimizeDeps: {
    exclude: ["@sqlite.org/sqlite-wasm"],
  },
});
