/**
 * Query caching interfaces and implementations
 *
 * Provides optional caching layer for query results to improve performance.
 * Uses battle-tested libraries: lru-cache and fast-json-stable-stringify
 */

import { LRUCache as LRU } from 'lru-cache';
import stringify from 'fast-json-stable-stringify';

/**
 * Cache statistics for monitoring performance
 */
export interface CacheStats {
  hits: number;
  misses: number;
  size: number;
  maxSize?: number;
  hitRate: number;
}

/**
 * Configuration for cache implementations
 */
export interface CacheConfig {
  /** Maximum number of entries (default: 1000) */
  maxSize?: number;
  /** Default TTL in milliseconds (default: none) */
  ttl?: number;
  /** Enable statistics tracking (default: true) */
  enableStats?: boolean;
}

/**
 * Generic cache interface for query results
 *
 * Implement this interface to create custom cache strategies
 * (e.g., Redis, Memcached, etc.)
 */
export interface QueryCache<K = string, V = any> {
  /**
   * Retrieve a value from the cache
   * @returns The cached value or undefined if not found/expired
   */
  get(key: K): V | undefined;

  /**
   * Store a value in the cache
   * @param key Cache key
   * @param value Value to cache
   * @param ttl Optional TTL in milliseconds (overrides default)
   */
  set(key: K, value: V, ttl?: number): void;

  /**
   * Check if a key exists in the cache
   */
  has(key: K): boolean;

  /**
   * Remove a specific entry from the cache
   * @returns true if the entry existed and was removed
   */
  delete(key: K): boolean;

  /**
   * Clear all entries from the cache
   */
  clear(): void;

  /**
   * Get cache statistics
   */
  stats(): CacheStats;

  /**
   * Optional: Invalidate entries matching a pattern
   * @param pattern String or RegExp pattern to match keys
   * @returns Number of entries invalidated
   */
  invalidate?(pattern: string | RegExp): number;
}

/**
 * LRU cache implementation using the industry-standard lru-cache library
 *
 * Features:
 * - Automatic eviction of least recently used entries
 * - TTL (time-to-live) support
 * - Statistics tracking
 * - Battle-tested and widely used
 *
 * @example
 * ```typescript
 * const cache = new LRUCache({
 *   maxSize: 1000,      // Max 1000 entries
 *   ttl: 60000,         // 60 second default TTL
 *   enableStats: true   // Track hits/misses
 * });
 *
 * cache.set('key', 'value');
 * const value = cache.get('key'); // 'value'
 *
 * const stats = cache.stats();
 * console.log(`Hit rate: ${stats.hitRate}`);
 * ```
 */
export class LRUCache<K = string, V = any> implements QueryCache<K, V> {
  private cache: LRU<K, V>;
  private hits = 0;
  private misses = 0;
  private readonly enableStats: boolean;
  private readonly maxSize: number;

  constructor(config: CacheConfig = {}) {
    this.maxSize = config.maxSize ?? 1000;
    this.enableStats = config.enableStats ?? true;

    this.cache = new LRU<K, V>({
      max: this.maxSize,
      ttl: config.ttl,
      // Update age on get to keep frequently accessed items fresh
      updateAgeOnGet: true,
      // Allow individual TTL per entry
      ttlAutopurge: true,
    });
  }

  get(key: K): V | undefined {
    const value = this.cache.get(key);

    if (this.enableStats) {
      if (value !== undefined) {
        this.hits++;
      } else {
        this.misses++;
      }
    }

    return value;
  }

  set(key: K, value: V, ttl?: number): void {
    if (ttl !== undefined) {
      this.cache.set(key, value, { ttl });
    } else {
      this.cache.set(key, value);
    }
  }

  has(key: K): boolean {
    return this.cache.has(key);
  }

  delete(key: K): boolean {
    return this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
  }

  stats(): CacheStats {
    const total = this.hits + this.misses;
    return {
      hits: this.hits,
      misses: this.misses,
      size: this.cache.size,
      maxSize: this.maxSize,
      hitRate: total > 0 ? this.hits / total : 0,
    };
  }

  /**
   * Invalidate cache entries matching a pattern
   *
   * @example
   * ```typescript
   * // Invalidate all synset queries
   * cache.invalidate(/^getSynset/);
   *
   * // Invalidate queries for specific lexicon
   * cache.invalidate(/lexicon.*oewn/);
   * ```
   */
  invalidate(pattern: string | RegExp): number {
    const regex = typeof pattern === 'string'
      ? new RegExp(pattern)
      : pattern;

    let count = 0;
    for (const key of this.cache.keys()) {
      if (regex.test(String(key))) {
        this.cache.delete(key);
        count++;
      }
    }

    return count;
  }
}

/**
 * No-op cache that doesn't actually cache anything
 *
 * Useful for:
 * - Explicitly disabling caching
 * - Testing
 * - Development
 *
 * @example
 * ```typescript
 * const cache = new NullCache();
 * const wordnet = new Wordnet('oewn:2024', { cache });
 * // All queries bypass cache
 * ```
 */
export class NullCache implements QueryCache {
  get(): undefined {
    return undefined;
  }

  set(): void {
    // No-op
  }

  has(): boolean {
    return false;
  }

  delete(): boolean {
    return false;
  }

  clear(): void {
    // No-op
  }

  stats(): CacheStats {
    return {
      hits: 0,
      misses: 0,
      size: 0,
      hitRate: 0,
    };
  }

  invalidate(): number {
    return 0;
  }
}

/**
 * Create a cache key from method name and parameters
 *
 * Uses fast-json-stable-stringify for deterministic serialization
 * (same object always produces same string, regardless of key order)
 *
 * @param method Method name (e.g., 'getWordById')
 * @param params Query parameters
 * @returns Stable cache key
 *
 * @example
 * ```typescript
 * const key1 = createCacheKey('getWordById', { id: '123' });
 * const key2 = createCacheKey('getWordById', { id: '123' });
 * // key1 === key2 (deterministic)
 * ```
 */
export function createCacheKey(method: string, params: any): string {
  return `${method}:${stringify(params)}`;
}

/**
 * Default key serializer using fast-json-stable-stringify
 *
 * Produces deterministic JSON strings where key order doesn't matter:
 * {a: 1, b: 2} and {b: 2, a: 1} produce the same result
 *
 * @param value Value to serialize
 * @returns Stable JSON string
 */
export function defaultKeySerializer(value: any): string {
  return stringify(value);
}
