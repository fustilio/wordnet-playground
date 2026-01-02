# wn-ts-core

## 0.6.0

### Minor Changes

- 1fc3eab: Foundation improvements and quality enhancements for 0.8.0 release

  ## Major Improvements

  ### Build System
  - Fixed benchmark package build errors
  - Resolved turbo cache warnings for type-checking-only packages
  - Added package-specific turbo configurations
  - Fixed vite worker URL warning

  ### Package Exports
  - Added `/parsers` export to wn-ts-core for better modularity
  - Improved TypeScript module resolution in monorepo

  ### Documentation
  - Comprehensive package analysis with gaps and roadmap
  - Added CONTRIBUTING.md with detailed guidelines
  - Added SECURITY.md with vulnerability reporting process
  - Enhanced package READMEs (wn-test-data)

  ### Developer Experience
  - Improved error messages and type safety
  - Better monorepo development workflow
  - Cleaner build output without warnings

  ## Technical Changes

  ### wn-ts-core
  - Added `/parsers` subpath export in package.json
  - Added turbo.json for type-check-only builds

  ### wn-ts-web
  - Added vite-ignore comment for worker URL resolution

  ### wn-data-loader
  - Added turbo.json for type-check-only builds

  ### Benchmark Package
  - Fixed WnBridge API calls to use query objects
  - Fixed parser registry imports
  - Relaxed TypeScript strict mode for development package

  ## Breaking Changes

  None - This is a minor release with backwards compatibility maintained.

  ## Migration Guide

  No migration required. All changes are backwards compatible.

- 1fc3eab: Add extensible query result caching for improved performance

  ## Query Caching System

  Introduces an optional, pluggable caching layer for WordNet queries.

  **Built on battle-tested libraries:**
  - `lru-cache` (11.2.4) - Industry-standard LRU cache implementation
  - `fast-json-stable-stringify` (2.1.0) - Deterministic JSON serialization

  **Features:**
  - **LRUCache** - Least Recently Used cache with automatic eviction
  - **NullCache** - No-op cache for explicitly disabling caching
  - **Extensible** - Implement custom cache strategies via `QueryCache` interface
  - **Optional** - Disabled by default, enable when needed
  - **Non-intrusive** - No changes to query logic when disabled

  ## Features

  ### LRU Cache with TTL Support

  ```typescript
  import { Wordnet } from 'wn-ts-node';
  import { LRUCache } from 'wn-ts-core/shared';

  const cache = new LRUCache({
    maxSize: 1000, // Maximum 1000 cached entries
    ttl: 60000, // 60 second default TTL
    enableStats: true, // Track cache hits/misses
  });

  const wordnet = new Wordnet('oewn:2024', { cache });

  // Queries are now automatically cached
  const word = await wordnet.word('computer'); // Cache miss
  const word2 = await wordnet.word('computer'); // Cache hit - instant!
  ```

  ### Cache Statistics

  ```typescript
  const stats = cache.stats();
  console.log(`Hit rate: ${stats.hitRate.toFixed(2)}`);
  console.log(`Size: ${stats.size}/${stats.maxSize}`);
  ```

  ### Pattern-based Invalidation

  ```typescript
  // Invalidate all synset queries
  cache.invalidate(/^getSynset/);

  // Invalidate queries for specific lexicon
  cache.invalidate(/lexicon.*oewn/);
  ```

  ### Custom Cache Implementations

  Implement the `QueryCache` interface for custom strategies (Redis, Memcached, etc.):

  ```typescript
  import { QueryCache, CacheStats } from 'wn-ts-core/shared';

  class RedisCache implements QueryCache {
    // ... implement cache methods
  }

  const cache = new RedisCache(redisClient);
  const wordnet = new Wordnet('oewn:2024', { cache });
  ```

  ## Performance Impact

  For applications with repeated queries:
  - **Instant lookups** for cached results (no database query)
  - **Reduced database load** for high-traffic applications
  - **Configurable memory usage** via `maxSize` parameter

  ## Backwards Compatibility

  ✅ Fully backwards compatible - caching is opt-in
  ✅ No breaking changes to existing APIs
  ✅ Default behavior unchanged (no cache)

  ## Documentation

  Comprehensive caching guide available at: `packages/wn-ts-core/docs/CACHE.md`

  ## API Exports

  ```typescript
  // Cache implementations
  import { LRUCache, NullCache } from 'wn-ts-core/shared';

  // Cache utilities
  import { createCacheKey, defaultKeySerializer } from 'wn-ts-core/shared';

  // Types
  import type { QueryCache, CacheStats, CacheConfig } from 'wn-ts-core/shared';
  ```

  ## Cached Methods
  - `getWordById(id)` - Single word lookup
  - `getSynsetById(id, options)` - Single synset lookup

  Additional methods can be wrapped with the `getCached()` helper in custom implementations.

- 1fc3eab: Enable V5 query strategy as default for 50x performance improvement

  ## Performance Improvement

  V5 query strategy is now the default, providing dramatic performance gains:
  - **50,000+ Hz** query throughput (vs ~1,000 Hz with previous default)
  - **50x faster** for typical WordNet queries
  - **Single query** fetches all related data using optimized LEFT JOINs

  ## What Changed

  ### Default Strategy
  - Changed default from `'default'` to `'v5'`
  - V5 uses optimized LEFT JOINs to fetch definitions, examples, relations, and senses in one query
  - Reduces database round trips and leverages proper indexes

  ### Backwards Compatibility
  - ✅ All 386 tests pass with V5 as default
  - ✅ Users can still explicitly set `strategy: 'default'` or other strategies if needed
  - ✅ No breaking changes to API

  ### Query Performance

  ```typescript
  // Before (default): ~1,000 Hz
  const wordnet = new Wordnet('oewn:2024');

  // Now (v5 default): ~50,000 Hz
  const wordnet = new Wordnet('oewn:2024');

  // Explicit override still supported
  const wordnet = new Wordnet('oewn:2024', { strategy: 'fast' });
  ```

  ## Technical Details

  V5 optimization techniques:
  1. **LEFT JOIN** instead of separate queries for related data
  2. **Indexed columns** used in WHERE clauses
  3. **Conditional query building** with `.$if` for dynamic filters
  4. **DISTINCT** to handle join duplicates efficiently
  5. **Single round-trip** to database per query

  ## Migration

  No migration needed. This is a performance enhancement with full backwards compatibility.

  Users experiencing issues can opt out:

  ```typescript
  const wordnet = new Wordnet('oewn:2024', { strategy: 'default' });
  ```

  ## Testing
  - ✅ All 386 existing tests pass
  - ✅ Query accuracy tests verify V5 returns identical results to other strategies
  - ✅ Slight overall test suite speedup (92.09s vs 95.80s)

## 0.5.2

### Patch Changes

- update exported files

## 0.5.1

### Patch Changes

- update dependencies
