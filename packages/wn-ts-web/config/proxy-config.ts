/**
 * Shared proxy configuration for WordNet web applications
 * This configuration handles CORS proxy setup for downloading WordNet data
 */

export interface ProxyConfig {
  target: string;
  changeOrigin: boolean;
  followRedirects?: boolean;
  rewrite: (path: string) => string;
  configure: (proxy: any) => void;
}

export interface ServerConfig {
  headers: {
    'Cross-Origin-Opener-Policy': string;
    'Cross-Origin-Embedder-Policy': string;
  };
  proxy: Record<string, ProxyConfig>;
}

/**
 * Create a proxy configuration with logging
 */
function createProxyConfig(
  target: string,
  rewrite: (path: string) => string,
  options: {
    followRedirects?: boolean;
    logPrefix?: string;
    handleRedirects?: boolean;
  } = {}
): ProxyConfig {
  const { followRedirects = false, logPrefix = "", handleRedirects = false } = options;

  return {
    target,
    changeOrigin: true,
    followRedirects,
    rewrite,
    configure: (proxy) => {
      proxy.on("error", (err: any) => {
        console.warn("proxy error", err);
      });
      proxy.on("proxyRes", (proxyRes: any, req: any, res: any) => {
        const url = req.url || "";
        console.log(`🔁 [forward]${logPrefix ? ` ${logPrefix}:` : ""}`, url);
        
        // Handle GitHub release redirects to CDN
        if (handleRedirects && (proxyRes.statusCode === 302 || proxyRes.statusCode === 301)) {
          const location = proxyRes.headers.location;
          if (location && location.includes("release-assets.githubusercontent.com")) {
            // Rewrite the redirect to use our release-assets proxy
            const newLocation = location.replace(
              "https://release-assets.githubusercontent.com",
              "/api/release-assets"
            );
            proxyRes.headers.location = newLocation;
            console.log("🔄 [redirect] Rewrote to:", newLocation);
          }
        }
      });
    },
  };
}

/**
 * Get the shared proxy configuration for WordNet data sources
 */
export function getWordNetProxyConfig(): Record<string, ProxyConfig> {
  return {
    // Proxy WordNet data sources to bypass CORS
    "/api/wordnet": createProxyConfig(
      "https://en-word.net",
      (path) => path.replace(/^\/api\/wordnet/, ""),
      { logPrefix: "WordNet" }
    ),

    "/api/globalwordnet-ewn": createProxyConfig(
      "https://github.com/globalwordnet/english-wordnet/releases/download",
      (path) => path.replace(/^\/api\/globalwordnet-ewn\//, "/"),
      { logPrefix: "EWN" }
    ),

    "/api/globalwordnet-cili": createProxyConfig(
      "https://github.com/globalwordnet/cili/releases/download",
      (path) => path.replace(/^\/api\/globalwordnet-cili\//, "/"),
      { followRedirects: true, logPrefix: "CILI" }
    ),

    "/api/omwn-releases": createProxyConfig(
      "https://github.com/omwn/omw-data/releases/download",
      (path) => path.replace(/^\/api\/omwn-releases\//, "/"),
      { followRedirects: true, logPrefix: "OMW" }
    ),

    "/api/raw-github": createProxyConfig(
      "https://raw.githubusercontent.com",
      (path) => path.replace(/^\/api\/raw-github\//, "/"),
      { logPrefix: "Raw GitHub" }
    ),

    "/api/github": createProxyConfig(
      "https://github.com",
      (path) => path.replace(/^\/api\/github\//, "/"),
      { handleRedirects: true, logPrefix: "GitHub" }
    ),

    "/api/github-api": createProxyConfig(
      "https://api.github.com",
      (path) => path.replace(/^\/api\/github-api\//, "/"),
      { logPrefix: "GitHub API" }
    ),

    "/api/release-assets": createProxyConfig(
      "https://release-assets.githubusercontent.com",
      (path) => path.replace(/^\/api\/release-assets\//, "/"),
      { logPrefix: "Release Assets" }
    ),

    // Note: /api/external proxy is handled by a custom middleware in the Vite configs
    // This is because Vite's proxy doesn't support dynamic targets
  };
}

/**
 * Get the complete server configuration with headers and proxy
 */
export function getWordNetServerConfig(): ServerConfig {
  return {
    headers: {
      'Cross-Origin-Opener-Policy': 'same-origin',
      'Cross-Origin-Embedder-Policy': 'require-corp',
    },
    proxy: getWordNetProxyConfig(),
  };
}

/**
 * Get optimized dependencies configuration
 */
export function getWordNetOptimizeDeps() {
  return {
    exclude: ['@sqlite.org/sqlite-wasm'],
    include: [
      'comlink',
      'utils/logger',
      'wn-ts-core'
    ]
  };
}

/**
 * Get worker configuration
 */
export function getWordNetWorkerConfig() {
  return {
    format: 'es' as const
  };
}
