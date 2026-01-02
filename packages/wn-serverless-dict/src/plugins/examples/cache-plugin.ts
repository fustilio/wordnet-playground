/**
 * Example plugin: Runtime caching
 * Automatically enables caching for dictionary runtime
 */

import type { Plugin, PluginHooks } from '../types.js';
import type { DictionaryData } from '../../types/index.js';

/**
 * Cache plugin configuration
 */
export interface CachePluginConfig {
  /** Enable L1 cache */
  enableL1?: boolean;
  /** Enable L2 cache (multi-level) */
  enableL2?: boolean;
  /** L1 cache size */
  l1MaxSize?: number;
  /** L1 cache TTL in ms */
  l1TTL?: number;
  /** Pre-warm cache with common words */
  warmWords?: Array<{ word: string; lang: string }>;
}

/**
 * Cache plugin for automatic runtime caching
 */
export class CachePlugin implements Plugin {
  private config: CachePluginConfig;

  meta = {
    name: 'cache',
    version: '1.0.0',
    description: 'Enables automatic caching for dictionary runtime',
    author: 'wn-serverless-dict'
  };

  constructor(config: CachePluginConfig = {}) {
    this.config = {
      enableL1: true,
      enableL2: false,
      l1MaxSize: 1000,
      l1TTL: 300000, // 5 minutes
      ...config
    };
  }

  hooks: PluginHooks = {
    afterBuild: async (data) => {
      console.log('[CachePlugin] Configuring caching for dictionary runtime');

      // Add cache metadata to dictionary
      if (!data.m.cache) {
        data.m.cache = {
          enabled: this.config.enableL1,
          multiLevel: this.config.enableL2,
          maxSize: this.config.l1MaxSize,
          ttl: this.config.l1TTL
        } as any;
      }

      return data;
    },

    onLoad: async (data) => {
      console.log('[CachePlugin] Dictionary loaded with caching enabled');

      // Warm cache if configured
      if (this.config.warmWords && this.config.warmWords.length > 0) {
        console.log(`[CachePlugin] Pre-warming cache with ${this.config.warmWords.length} words`);
        // Note: Actual warming happens at runtime when dictionary instance is created
      }

      return data;
    }
  };

  /**
   * Get cache configuration
   */
  getConfig(): CachePluginConfig {
    return { ...this.config };
  }
}
