import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import comlink from "vite-plugin-comlink";

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

const serverConfig = {
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
    "/api/globalwordnet-ewn": {
      target:
        "https://github.com/globalwordnet/english-wordnet/releases/download",
      changeOrigin: true,
      rewrite: (path) => {
        return path.replace(/^\/api\/globalwordnet\//, "/")
      },
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
    "/api/globalwordnet-cili": {
      target: "https://github.com/globalwordnet/cili/releases/download",
      changeOrigin: true,
      followRedirects: true,
      rewrite: (path) => {
        const rewritten = path.replace(/^\/api\/globalwordnet-cili\//, "/")

        return rewritten;
      },
      configure: (proxy) => {
        proxy.on("error", (err) => {
          if (shouldLog("warn")) console.log("proxy error", err);
        });
        proxy.on("proxyRes", (proxyRes, req, res) => {
          const url = req.url || "";
          if (shouldLog("info")) console.log("🔁 [forward] CILI:", url);
        });
      },
    },
    "/api/omwn-releases": {
      target: "https://github.com/omwn/omw-data/releases/download",
      changeOrigin: true,
      followRedirects: true,
      rewrite: (path) => path.replace(/^\/api\/omwn-releases\//, "/"),
      configure: (proxy) => {
        proxy.on("error", (err) => {
          if (shouldLog("warn")) console.log("proxy error", err);
        });
        proxy.on("proxyRes", (proxyRes, req, res) => {
          const url = req.url || "";
          if (shouldLog("info")) console.log("🔁 [forward] OMW:", url);
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
      target: "https://github.com",
      changeOrigin: true,
      followRedirects: false,
      rewrite: (path) => path.replace(/^\/api\/github\//, "/"),
      configure: (proxy) => {
        proxy.on("error", (err) => {
          if (shouldLog("warn")) console.log("proxy error", err);
        });
        proxy.on("proxyRes", (proxyRes, req, res) => {
          const url = req.url || "";
          if (shouldLog("info")) console.log("🔁 [forward]", url);
          
          // Handle GitHub release redirects to CDN
          if (proxyRes.statusCode === 302 || proxyRes.statusCode === 301) {
            const location = proxyRes.headers.location;
            if (location && location.includes("release-assets.githubusercontent.com")) {
              // Rewrite the redirect to use our release-assets proxy
              const newLocation = location.replace(
                "https://release-assets.githubusercontent.com",
                "/api/release-assets"
              );
              proxyRes.headers.location = newLocation;
              if (shouldLog("info")) console.log("🔄 [redirect] Rewrote to:", newLocation);
            }
          }
        });
      },
    },
    "/api/github-api": {
      target: "https://api.github.com",
      changeOrigin: true,
      rewrite: (path) => path.replace(/^\/api\/github-api\//, "/"),
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
    "/api/release-assets": {
      target: "https://release-assets.githubusercontent.com",
      changeOrigin: true,
      rewrite: (path) => path.replace(/^\/api\/release-assets\//, "/"),
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
  optimizeDeps: {
    exclude: ["@sqlite.org/sqlite-wasm"],
  },
  worker: {
    server: serverConfig,
    format: "es",
    plugins: () => [comlink(), makeServerPlugin()],
  },
});
