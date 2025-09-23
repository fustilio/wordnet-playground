/**
 * @deprecated This file has been moved to packages/wn-ts-web/src/config/proxy-config.ts
 * Please import from the new location for better organization and shared access.
 */

// Re-export from the new location for backward compatibility
export {
  type ProxyConfig,
  type ServerConfig,
  getWordNetProxyConfig,
  getWordNetServerConfig,
  getWordNetOptimizeDeps,
  getWordNetWorkerConfig
} from '../../../packages/wn-ts-web/src/config/proxy-config';
