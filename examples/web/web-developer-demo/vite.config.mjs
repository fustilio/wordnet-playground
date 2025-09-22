import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import comlink from "vite-plugin-comlink";
import { getWordNetServerConfig, getWordNetOptimizeDeps, getWordNetWorkerConfig } from "../shared-proxy-config.js";

// Worker + OPFS setup: COOP/COEP headers enable SharedArrayBuffer/OPFS in workers,
// and vite-plugin-comlink provides ComlinkWorker for ergonomic RPC.

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

// Get the base server config and enhance it with caching
const baseServerConfig = getWordNetServerConfig();
const serverConfig = {
  ...baseServerConfig,
  proxy: {
    ...baseServerConfig.proxy,
    // Override the external proxy to add caching functionality
    "/api/external": {
      ...baseServerConfig.proxy["/api/external"],
      configure: (proxy) => {
        proxy.on("error", (err) => {
          if (shouldLog("warn")) console.log("proxy error", err);
        });
        proxy.on("proxyRes", (proxyRes, req, res) => {
          const url = req.url || "";
          if (shouldLog("info")) console.log("🔁 [forward] External:", url);
          // Cache successful GETs to disk
          const filePath = toCachePath(url);
          if (req.method === "GET" && proxyRes.statusCode === 200) {
            if (shouldLog("info"))
              console.log("💾 [cache] Writing to disk:", url);
            const writeStream = fs.createWriteStream(filePath);
            proxyRes.pipe(writeStream);
          }
        });
      },
    },
  },
};

function makeServerPlugin() {
  return {
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
          url.startsWith("/api/github-api/") ||
          url.startsWith("/api/release-assets/") ||
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
  };
}

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [comlink(), react(), tailwindcss(), makeServerPlugin()],
  server: serverConfig,
  optimizeDeps: getWordNetOptimizeDeps(),
  worker: {
    server: serverConfig,
    ...getWordNetWorkerConfig(),
    plugins: () => [comlink(), makeServerPlugin()],
  },
});
