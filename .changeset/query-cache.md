---
"wn-ts-core": minor
"wn-ts-node": minor
"wn-ts-web": minor
---

Add extensible query result caching for improved performance

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
  maxSize: 1000,      // Maximum 1000 cached entries
  ttl: 60000,         // 60 second default TTL
  enableStats: true   // Track cache hits/misses
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
