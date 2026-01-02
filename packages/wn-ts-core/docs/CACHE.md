# Query Result Caching

The WordNet query service includes an optional, extensible caching layer for improved performance.

Built on battle-tested libraries:
- **`lru-cache`** - Industry-standard LRU cache (by Isaac Schlueter, npm founder)
- **`fast-json-stable-stringify`** - Deterministic JSON serialization for cache keys

## Overview

Query caching can significantly improve performance for repeated queries by storing results in memory. The cache system is:

- **Optional**: Disabled by default, enable when needed
- **Extensible**: Implement custom cache strategies via the `QueryCache` interface
- **Pluggable**: Pass any cache implementation to the query service
- **Non-intrusive**: No changes to query logic when disabled

## Quick Start

### Using LRU Cache

```typescript
import { Wordnet } from 'wn-ts-node';
import { LRUCache } from 'wn-ts-core/shared';

// Create a cache with custom configuration
const cache = new LRUCache({
  maxSize: 1000,      // Maximum 1000 cached entries
  ttl: 60000,         // 60 second default TTL
  enableStats: true   // Track cache hits/misses
});

// Pass cache to Wordnet
const wordnet = new Wordnet('oewn:2024', { cache });

// Queries are now automatically cached
const word1 = await wordnet.word('computer'); // Cache miss - fetches from DB
const word2 = await wordnet.word('computer'); // Cache hit - instant result
```

### Disabling Cache (Default)

```typescript
// No cache - every query hits the database
const wordnet = new Wordnet('oewn:2024');
```

## Cache Implementations

### LRUCache

Least Recently Used cache with automatic eviction:

```typescript
import { LRUCache } from 'wn-ts-core/shared';

const cache = new LRUCache({
  maxSize: 1000,        // Evict oldest when full (default: 1000)
  ttl: 60000,           // Time-to-live in ms (default: none)
  enableStats: true     // Track performance metrics (default: true)
});

// Get cache statistics
const stats = cache.stats();
console.log(`Hit rate: ${stats.hitRate.toFixed(2)}`);
console.log(`Size: ${stats.size}/${stats.maxSize}`);
```

### NullCache

No-op cache for explicitly disabling caching:

```typescript
import { NullCache } from 'wn-ts-core/shared';

const cache = new NullCache();
const wordnet = new Wordnet('oewn:2024', { cache });

// All queries bypass cache
```

## Cache Features

### Automatic Cache Keys

Cache keys are automatically generated from method names and parameters:

```typescript
// These generate different cache keys
await wordnet.word('computer');              // getWordById:{"id":"..."}
await wordnet.synset('oewn-02084071-n');     // getSynsetById:{"id":"..."}
```

### TTL (Time-to-Live)

Set expiration times per entry or globally:

```typescript
const cache = new LRUCache({
  ttl: 60000  // Default 60 second TTL for all entries
});

// Override TTL for specific entries
cache.set('key', value, 5000);  // Expires in 5 seconds
```

### Pattern-based Invalidation

Invalidate cache entries matching a pattern:

```typescript
// Invalidate all synset queries
cache.invalidate(/^getSynset/);

// Invalidate queries for specific lexicon
cache.invalidate(/lexicon.*oewn/);
```

### Cache Statistics

Track cache performance:

```typescript
const stats = cache.stats();

console.log(`Hits: ${stats.hits}`);
console.log(`Misses: ${stats.misses}`);
console.log(`Hit Rate: ${(stats.hitRate * 100).toFixed(1)}%`);
console.log(`Size: ${stats.size}/${stats.maxSize}`);
```

## Custom Cache Implementation

Implement the `QueryCache` interface for custom strategies:

```typescript
import { QueryCache, CacheStats } from 'wn-ts-core/shared';

class RedisCache implements QueryCache {
  constructor(private redis: RedisClient) {}

  get(key: string): any | undefined {
    // Fetch from Redis
  }

  set(key: string, value: any, ttl?: number): void {
    // Store in Redis with optional TTL
  }

  has(key: string): boolean {
    // Check Redis
  }

  delete(key: string): boolean {
    // Delete from Redis
  }

  clear(): void {
    // Clear all Redis entries
  }

  stats(): CacheStats {
    // Return cache statistics
    return {
      hits: this.hits,
      misses: this.misses,
      size: this.size,
      hitRate: this.hits / (this.hits + this.misses)
    };
  }

  invalidate(pattern: string | RegExp): number {
    // Optional: Invalidate entries matching pattern
  }
}

// Use custom cache
const cache = new RedisCache(redisClient);
const wordnet = new Wordnet('oewn:2024', { cache });
```

## Performance Considerations

### When to Use Caching

**Use caching when:**
- Repeatedly querying the same words/synsets
- Building interactive applications with user exploration
- Serving multiple users querying popular terms
- Database access is a bottleneck

**Skip caching when:**
- One-time batch processing
- Limited memory available
- Data changes frequently
- Query patterns are unpredictable

### Memory Usage

Estimate memory usage:

```typescript
// Each cached entry stores full query results
// Average word entry: ~500 bytes
// Average synset entry: ~1-2 KB

const cache = new LRUCache({
  maxSize: 1000  // ~1-2 MB for mixed word/synset queries
});
```

### Cache Strategy Selection

```typescript
// Small, frequently accessed dataset
const smallCache = new LRUCache({ maxSize: 100 });

// Large application with varied queries
const largeCache = new LRUCache({
  maxSize: 10000,
  ttl: 300000  // 5 minute TTL
});

// Development/testing - no cache
const noCache = new NullCache();
```

## Cached Methods

The following query service methods automatically use cache when enabled:

- `getWordById(id)` - Single word lookup
- `getSynsetById(id, options)` - Single synset lookup

Additional methods can be wrapped with the `getCached()` helper:

```typescript
// In custom query service extension
async customQuery(params: any) {
  return this.getCached('customQuery', params, async () => {
    // Your query logic
    return await this.db.selectFrom('...');
  });
}
```

## Best Practices

### 1. Monitor Cache Performance

```typescript
setInterval(() => {
  const stats = cache.stats();
  if (stats.hitRate < 0.3) {
    console.warn('Low cache hit rate - consider adjusting strategy');
  }
}, 60000);
```

### 2. Invalidate on Data Changes

```typescript
// After loading new data
await wordnet.loadLexicon('new-data.xml');
cache.clear();  // Clear stale cached results
```

### 3. Tune Cache Size

```typescript
// Start small and monitor
let cache = new LRUCache({ maxSize: 100 });

// Increase if hit rate is high but eviction is frequent
const stats = cache.stats();
if (stats.hitRate > 0.8 && stats.size === stats.maxSize) {
  cache = new LRUCache({ maxSize: 500 });
}
```

### 4. Use TTL for Changing Data

```typescript
// Cache translation queries with TTL
const cache = new LRUCache({
  maxSize: 1000,
  ttl: 3600000  // 1 hour TTL for external API results
});
```

## Examples

### Web Application with High Read Load

```typescript
import { Wordnet } from 'wn-ts-web';
import { LRUCache } from 'wn-ts-core/shared';

const cache = new LRUCache({
  maxSize: 5000,       // Cache 5000 most popular queries
  ttl: 600000,         // 10 minute TTL
  enableStats: true
});

const wordnet = new Wordnet('oewn:2024', { cache });

// Serve user queries - popular terms cached
app.get('/word/:form', async (req, res) => {
  const results = await wordnet.words({ form: req.params.form });
  res.json(results);
});

// Monitor cache health
app.get('/cache/stats', (req, res) => {
  res.json(cache.stats());
});
```

### CLI Tool with Sequential Processing

```typescript
import { Wordnet } from 'wn-ts-node';
import { NullCache } from 'wn-ts-core/shared';

// No caching for one-time batch processing
const wordnet = new Wordnet('oewn:2024', {
  cache: new NullCache()
});

// Process large file - each word queried once
for (const word of words) {
  const synsets = await wordnet.synsets({ form: word });
  process(synsets);
}
```

### Development with Cache Debugging

```typescript
import { LRUCache } from 'wn-ts-core/shared';

class DebugCache extends LRUCache {
  get(key: string) {
    const result = super.get(key);
    console.log(`[Cache] ${result ? 'HIT' : 'MISS'}: ${key}`);
    return result;
  }
}

const cache = new DebugCache({ maxSize: 100 });
const wordnet = new Wordnet('oewn:2024', { cache });
```

## API Reference

### QueryCache Interface

```typescript
interface QueryCache<K = string, V = any> {
  get(key: K): V | undefined;
  set(key: K, value: V, ttl?: number): void;
  has(key: K): boolean;
  delete(key: K): boolean;
  clear(): void;
  stats(): CacheStats;
  invalidate?(pattern: string | RegExp): number;
}
```

### CacheConfig

```typescript
interface CacheConfig {
  maxSize?: number;        // Maximum cache entries (default: 1000)
  ttl?: number;            // Default TTL in milliseconds (default: none)
  enableStats?: boolean;   // Enable statistics tracking (default: true)
}
```

### CacheStats

```typescript
interface CacheStats {
  hits: number;            // Number of cache hits
  misses: number;          // Number of cache misses
  size: number;            // Current cache size
  maxSize?: number;        // Maximum cache size
  hitRate: number;         // hits / (hits + misses)
}
```

## Troubleshooting

### Low Hit Rate

**Problem**: Cache hit rate is below 30%

**Solutions**:
- Increase `maxSize` - cache may be evicting too aggressively
- Remove `ttl` - entries may be expiring too quickly
- Profile query patterns - ensure queries are actually repeated

### High Memory Usage

**Problem**: Cache consuming too much memory

**Solutions**:
- Decrease `maxSize`
- Add or reduce `ttl`
- Use more selective caching (cache only specific methods)

### Stale Data

**Problem**: Cache returning outdated results

**Solutions**:
- Reduce `ttl`
- Call `cache.clear()` after data updates
- Use pattern invalidation: `cache.invalidate(/pattern/)`

## Version History

- **0.8.0**: Initial cache implementation
  - LRUCache with TTL support
  - NullCache for disabling
  - Automatic cache key generation
  - Pattern-based invalidation
  - Cache statistics tracking
