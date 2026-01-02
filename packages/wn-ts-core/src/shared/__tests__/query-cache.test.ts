/**
 * Query Cache Integration Tests
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { LRUCache, NullCache, createCacheKey, defaultKeySerializer } from '../query-cache';

describe('Query Cache', () => {
  describe('LRUCache', () => {
    let cache: LRUCache<string, any>;

    beforeEach(() => {
      cache = new LRUCache({ maxSize: 3 });
    });

    it('should store and retrieve values', () => {
      cache.set('key1', { data: 'value1' });
      expect(cache.get('key1')).toEqual({ data: 'value1' });
    });

    it('should return undefined for non-existent keys', () => {
      expect(cache.get('nonexistent')).toBeUndefined();
    });

    it('should track cache statistics', () => {
      cache.set('key1', 'value1');

      cache.get('key1'); // hit
      cache.get('key2'); // miss
      cache.get('key1'); // hit

      const stats = cache.stats();
      expect(stats.hits).toBe(2);
      expect(stats.misses).toBe(1);
      expect(stats.hitRate).toBeCloseTo(0.667, 2);
      expect(stats.size).toBe(1);
    });

    it('should evict LRU entries when at capacity', () => {
      cache.set('key1', 'value1');
      cache.set('key2', 'value2');
      cache.set('key3', 'value3');

      // Cache is full (maxSize: 3)
      expect(cache.has('key1')).toBe(true);
      expect(cache.has('key2')).toBe(true);
      expect(cache.has('key3')).toBe(true);

      // Add 4th item - should evict key1 (least recently used)
      cache.set('key4', 'value4');

      expect(cache.has('key1')).toBe(false);
      expect(cache.has('key2')).toBe(true);
      expect(cache.has('key3')).toBe(true);
      expect(cache.has('key4')).toBe(true);
    });

    it('should update LRU order on access', () => {
      cache.set('key1', 'value1');
      cache.set('key2', 'value2');
      cache.set('key3', 'value3');

      // Access key1 to make it recently used
      cache.get('key1');

      // Add 4th item - should evict key2 (now LRU)
      cache.set('key4', 'value4');

      expect(cache.has('key1')).toBe(true); // Recently accessed
      expect(cache.has('key2')).toBe(false); // Evicted
      expect(cache.has('key3')).toBe(true);
      expect(cache.has('key4')).toBe(true);
    });

    it('should respect TTL expiration', async () => {
      cache.set('key1', 'value1', 100); // 100ms TTL

      expect(cache.get('key1')).toBe('value1');

      // Wait for expiration
      await new Promise(resolve => setTimeout(resolve, 150));

      expect(cache.get('key1')).toBeUndefined();
      expect(cache.has('key1')).toBe(false);
    });

    it('should clear all entries', () => {
      cache.set('key1', 'value1');
      cache.set('key2', 'value2');

      expect(cache.stats().size).toBe(2);

      cache.clear();

      expect(cache.stats().size).toBe(0);
      expect(cache.has('key1')).toBe(false);
      expect(cache.has('key2')).toBe(false);
    });

    it('should delete specific entries', () => {
      cache.set('key1', 'value1');
      cache.set('key2', 'value2');

      expect(cache.delete('key1')).toBe(true);
      expect(cache.delete('key1')).toBe(false); // Already deleted

      expect(cache.has('key1')).toBe(false);
      expect(cache.has('key2')).toBe(true);
    });

    it('should invalidate entries by pattern', () => {
      cache.set('synsets:computer', 'data1');
      cache.set('synsets:run', 'data2');
      cache.set('words:computer', 'data3');

      const invalidated = cache.invalidate(/^synsets:/);

      expect(invalidated).toBe(2);
      expect(cache.has('synsets:computer')).toBe(false);
      expect(cache.has('synsets:run')).toBe(false);
      expect(cache.has('words:computer')).toBe(true);
    });
  });

  describe('NullCache', () => {
    it('should be a no-op cache', () => {
      const cache = new NullCache();

      cache.set('key', 'value');
      expect(cache.get('key')).toBeUndefined();
      expect(cache.has('key')).toBe(false);
      expect(cache.delete('key')).toBe(false);

      cache.clear(); // Should not throw

      const stats = cache.stats();
      expect(stats.hits).toBe(0);
      expect(stats.misses).toBe(0);
    });
  });

  describe('Cache Key Generation', () => {
    it('should generate consistent keys for same parameters', () => {
      const params1 = { form: 'computer', pos: 'n' };
      const params2 = { pos: 'n', form: 'computer' }; // Different order

      const key1 = defaultKeySerializer(params1);
      const key2 = defaultKeySerializer(params2);

      expect(key1).toBe(key2);
    });

    it('should generate different keys for different parameters', () => {
      const params1 = { form: 'computer', pos: 'n' };
      const params2 = { form: 'run', pos: 'v' };

      const key1 = defaultKeySerializer(params1);
      const key2 = defaultKeySerializer(params2);

      expect(key1).not.toBe(key2);
    });

    it('should handle arrays in parameters', () => {
      // Array order matters - different order = different cache key
      const params1 = { ids: ['a', 'b', 'c'] };
      const params2 = { ids: ['c', 'b', 'a'] }; // Different order
      const params3 = { ids: ['a', 'b', 'c'] }; // Same order as params1

      const key1 = defaultKeySerializer(params1);
      const key2 = defaultKeySerializer(params2);
      const key3 = defaultKeySerializer(params3);

      // Same array order produces same key
      expect(key1).toBe(key3);
      // Different array order produces different key
      expect(key1).not.toBe(key2);
    });

    it('should create method-specific cache keys', () => {
      const params = { form: 'computer' };

      const key1 = createCacheKey('getSynsets', params);
      const key2 = createCacheKey('getWords', params);

      expect(key1).toContain('getSynsets');
      expect(key2).toContain('getWords');
      expect(key1).not.toBe(key2);
    });
  });
});
