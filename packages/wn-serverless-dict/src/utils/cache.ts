/**
 * Dictionary caching utilities for performance optimization
 * Based on patterns from wn-ts-core similarity plugin
 */

export interface CacheOptions {
  maxSize?: number;
  ttl?: number; // Time to live in milliseconds
  enableLRU?: boolean;
}

export interface CacheEntry<T> {
  value: T;
  timestamp: number;
  hits: number;
}

/**
 * LRU Cache for dictionary lookups
 * Optimizes repeated lookups of the same words
 */
export class DictionaryCache<T = any> {
  private cache = new Map<string, CacheEntry<T>>();
  private readonly maxSize: number;
  private readonly ttl: number;
  private readonly enableLRU: boolean;

  constructor(options: CacheOptions = {}) {
    this.maxSize = options.maxSize ?? 1000;
    this.ttl = options.ttl ?? 5 * 60 * 1000; // 5 minutes default
    this.enableLRU = options.enableLRU ?? true;
  }

  /**
   * Get value from cache
   */
  get(key: string): T | undefined {
    const entry = this.cache.get(key);

    if (!entry) {
      return undefined;
    }

    // Check if expired
    if (this.ttl > 0 && Date.now() - entry.timestamp > this.ttl) {
      this.cache.delete(key);
      return undefined;
    }

    // Update hits for LRU
    entry.hits++;
    entry.timestamp = Date.now();

    return entry.value;
  }

  /**
   * Set value in cache
   */
  set(key: string, value: T): void {
    // Evict if cache is full
    if (this.cache.size >= this.maxSize) {
      this.evict();
    }

    this.cache.set(key, {
      value,
      timestamp: Date.now(),
      hits: 0
    });
  }

  /**
   * Check if key exists in cache
   */
  has(key: string): boolean {
    return this.cache.has(key) && this.get(key) !== undefined;
  }

  /**
   * Clear entire cache
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * Get cache statistics
   */
  getStats() {
    return {
      size: this.cache.size,
      maxSize: this.maxSize,
      ttl: this.ttl,
      enableLRU: this.enableLRU
    };
  }

  /**
   * Evict least recently used entry
   */
  private evict(): void {
    if (!this.enableLRU) {
      // Simple FIFO eviction
      const firstKey = this.cache.keys().next().value;
      if (firstKey) {
        this.cache.delete(firstKey);
      }
      return;
    }

    // LRU eviction - remove entry with lowest hits and oldest timestamp
    let lruKey: string | undefined;
    let lruScore = Infinity;

    for (const [key, entry] of this.cache.entries()) {
      // Score based on hits and age (lower is worse)
      const ageInSeconds = (Date.now() - entry.timestamp) / 1000;
      const score = entry.hits / (ageInSeconds + 1);

      if (score < lruScore) {
        lruScore = score;
        lruKey = key;
      }
    }

    if (lruKey) {
      this.cache.delete(lruKey);
    }
  }
}

/**
 * Multi-level cache for hierarchical caching
 */
export class MultiLevelCache {
  private l1Cache: DictionaryCache; // Small, fast cache
  private l2Cache: DictionaryCache; // Larger, slower cache

  constructor(
    l1Options: CacheOptions = { maxSize: 100, ttl: 60000 },
    l2Options: CacheOptions = { maxSize: 1000, ttl: 300000 }
  ) {
    this.l1Cache = new DictionaryCache(l1Options);
    this.l2Cache = new DictionaryCache(l2Options);
  }

  get(key: string): any | undefined {
    // Try L1 first
    let value = this.l1Cache.get(key);
    if (value !== undefined) {
      return value;
    }

    // Try L2
    value = this.l2Cache.get(key);
    if (value !== undefined) {
      // Promote to L1
      this.l1Cache.set(key, value);
      return value;
    }

    return undefined;
  }

  set(key: string, value: any): void {
    this.l1Cache.set(key, value);
    this.l2Cache.set(key, value);
  }

  clear(): void {
    this.l1Cache.clear();
    this.l2Cache.clear();
  }

  getStats() {
    return {
      l1: this.l1Cache.getStats(),
      l2: this.l2Cache.getStats()
    };
  }
}

/**
 * Cache key generators for consistent caching
 */
export const CacheKeys = {
  lookup: (word: string, lang: string) => `lookup:${word.toLowerCase()}:${lang}`,
  translate: (word: string, from: string, to: string) => `translate:${word.toLowerCase()}:${from}:${to}`,
  ili: (ili: string, lang: string) => `ili:${ili}:${lang}`,
  synset: (ili: string) => `synset:${ili}`
};
