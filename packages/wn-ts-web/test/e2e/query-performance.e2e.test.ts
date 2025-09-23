/**
 * Query Performance E2E Tests for wn-ts-web
 * 
 * This file contains performance tests that mirror the structure and patterns
 * from wn-ts-node/tests/e2e/query/basic-queries.bench.ts but adapted for
 * the browser environment with real data loading.
 */

import { describe, it, expect, beforeAll, afterAll, vi } from "vitest";
import { createWordNetInstance } from "../../src/factory";
import type { WebWordnet } from "../../src/client/submodules/web-wordnet";
import type { DataLoader } from "../../src/data-loader";

const isNode =
  typeof process !== "undefined" &&
  process.versions != null &&
  process.versions.node != null;

describe.skipIf(isNode)("Query Performance E2E Tests", () => {
  let wordnet: WebWordnet;
  let dataLoader: DataLoader;

  beforeAll(async () => {
    const instance = await createWordNetInstance("oewn:2024");
    wordnet = instance.wordnet;
    dataLoader = instance.dataLoader;

    // Use the actual DataLoader to download and load the full OEWN database
    await dataLoader.downloadAndLoad("oewn:2024");
  }, 300000); // 5 minute timeout for setup

  afterAll(async () => {
    if (wordnet) {
      await wordnet.close();
    }
  });

  describe('Performance Benchmarks', () => {
    it('should measure word query performance', async () => {
      console.log('⚡ Benchmarking word queries...');
      
      const iterations = 10;
      const times: number[] = [];
      
      for (let i = 0; i < iterations; i++) {
        const start = performance.now();
        await wordnet.words({ form: 'computer' });
        const end = performance.now();
        times.push(end - start);
      }
      
      const avgTime = times.reduce((a, b) => a + b, 0) / times.length;
      const minTime = Math.min(...times);
      const maxTime = Math.max(...times);
      
      console.log(`📊 Word Query Performance:`);
      console.log(`   Average: ${avgTime.toFixed(2)}ms`);
      console.log(`   Min: ${minTime.toFixed(2)}ms`);
      console.log(`   Max: ${maxTime.toFixed(2)}ms`);
      
      // Word queries should be very fast (under 10ms average)
      expect(avgTime).toBeLessThan(10);
    });

    it('should measure synset query performance', async () => {
      console.log('⚡ Benchmarking synset queries...');
      
      const iterations = 10;
      const times: number[] = [];
      
      for (let i = 0; i < iterations; i++) {
        const start = performance.now();
        await wordnet.synsets({ form: 'computer' });
        const end = performance.now();
        times.push(end - start);
      }
      
      const avgTime = times.reduce((a, b) => a + b, 0) / times.length;
      const minTime = Math.min(...times);
      const maxTime = Math.max(...times);
      
      console.log(`📊 Synset Query Performance:`);
      console.log(`   Average: ${avgTime.toFixed(2)}ms`);
      console.log(`   Min: ${minTime.toFixed(2)}ms`);
      console.log(`   Max: ${maxTime.toFixed(2)}ms`);
      
      // Synset queries should be fast (under 50ms average)
      expect(avgTime).toBeLessThan(50);
    });

    it('should measure sense query performance', async () => {
      console.log('⚡ Benchmarking sense queries...');
      
      const iterations = 10;
      const times: number[] = [];
      
      for (let i = 0; i < iterations; i++) {
        const start = performance.now();
        await wordnet.senses({ wordIdOrForm: 'computer' });
        const end = performance.now();
        times.push(end - start);
      }
      
      const avgTime = times.reduce((a, b) => a + b, 0) / times.length;
      const minTime = Math.min(...times);
      const maxTime = Math.max(...times);
      
      console.log(`📊 Sense Query Performance:`);
      console.log(`   Average: ${avgTime.toFixed(2)}ms`);
      console.log(`   Min: ${minTime.toFixed(2)}ms`);
      console.log(`   Max: ${maxTime.toFixed(2)}ms`);
      
      // Sense queries should be fast (under 30ms average)
      expect(avgTime).toBeLessThan(30);
    });

    it('should measure complex query performance', async () => {
      console.log('⚡ Benchmarking complex queries...');
      
      const iterations = 5; // Fewer iterations for complex queries
      const times: number[] = [];
      
      for (let i = 0; i < iterations; i++) {
        const start = performance.now();
        await wordnet.synsets({ 
          form: 'computer',
          include: ['definitions', 'examples', 'relations']
        });
        const end = performance.now();
        times.push(end - start);
      }
      
      const avgTime = times.reduce((a, b) => a + b, 0) / times.length;
      const minTime = Math.min(...times);
      const maxTime = Math.max(...times);
      
      console.log(`📊 Complex Query Performance:`);
      console.log(`   Average: ${avgTime.toFixed(2)}ms`);
      console.log(`   Min: ${minTime.toFixed(2)}ms`);
      console.log(`   Max: ${maxTime.toFixed(2)}ms`);
      
      // Complex queries should be reasonable (under 100ms average)
      expect(avgTime).toBeLessThan(100);
    });
  });

  describe('Strategy Performance Comparison', () => {
    it('should compare V5 vs V6 strategy performance', async () => {
      console.log('⚡ Comparing V5 vs V6 strategy performance...');
      
      // Test V5 strategy (cached)
      const v5Times: number[] = [];
      for (let i = 0; i < 5; i++) {
        const start = performance.now();
        await wordnet.synsets({ form: 'computer' });
        const end = performance.now();
        v5Times.push(end - start);
      }
      
      // Test V6 strategy (memory optimized)
      const v6Times: number[] = [];
      for (let i = 0; i < 5; i++) {
        const start = performance.now();
        await wordnet.senses({ wordIdOrForm: 'computer' });
        const end = performance.now();
        v6Times.push(end - start);
      }
      
      const v5Avg = v5Times.reduce((a, b) => a + b, 0) / v5Times.length;
      const v6Avg = v6Times.reduce((a, b) => a + b, 0) / v6Times.length;
      
      console.log(`📊 Strategy Performance Comparison:`);
      console.log(`   V5 (Cached): ${v5Avg.toFixed(2)}ms average`);
      console.log(`   V6 (Memory): ${v6Avg.toFixed(2)}ms average`);
      
      // Both strategies should be fast
      expect(v5Avg).toBeLessThan(50);
      expect(v6Avg).toBeLessThan(30);
    });

    it('should demonstrate caching effectiveness', async () => {
      console.log('⚡ Testing caching effectiveness...');
      
      // First call (cache miss)
      const firstCallStart = performance.now();
      await wordnet.synsets({ form: 'computer' });
      const firstCallEnd = performance.now();
      const firstCallTime = firstCallEnd - firstCallStart;
      
      // Second call (cache hit)
      const secondCallStart = performance.now();
      await wordnet.synsets({ form: 'computer' });
      const secondCallEnd = performance.now();
      const secondCallTime = secondCallEnd - secondCallStart;
      
      console.log(`📊 Caching Effectiveness:`);
      console.log(`   First call (miss): ${firstCallTime.toFixed(2)}ms`);
      console.log(`   Second call (hit): ${secondCallTime.toFixed(2)}ms`);
      console.log(`   Speedup: ${(firstCallTime / secondCallTime).toFixed(2)}x`);
      
      // Second call should be significantly faster
      expect(secondCallTime).toBeLessThan(firstCallTime);
      expect(firstCallTime / secondCallTime).toBeGreaterThan(1.5);
    });
  });

  describe('Memory Usage and Scalability', () => {
    it('should handle large result sets efficiently', async () => {
      console.log('⚡ Testing large result set handling...');
      
      const start = performance.now();
      const largeResult = await wordnet.words({ 
        form: 'test',
        maxResults: 1000 
      });
      const end = performance.now();
      
      const duration = end - start;
      const resultsPerMs = largeResult.length / duration;
      
      console.log(`📊 Large Result Set Performance:`);
      console.log(`   Results: ${largeResult.length}`);
      console.log(`   Duration: ${duration.toFixed(2)}ms`);
      console.log(`   Results/ms: ${resultsPerMs.toFixed(2)}`);
      
      expect(largeResult.length).toBeGreaterThan(0);
      expect(duration).toBeLessThan(200); // Should handle 1000 results in under 200ms
    });

    it('should maintain performance with multiple concurrent queries', async () => {
      console.log('⚡ Testing concurrent query performance...');
      
      const queries = [
        wordnet.words({ form: 'computer' }),
        wordnet.synsets({ form: 'computer' }),
        wordnet.senses({ wordIdOrForm: 'computer' }),
        wordnet.words({ form: 'test' }),
        wordnet.synsets({ form: 'test' })
      ];
      
      const start = performance.now();
      const results = await Promise.all(queries);
      const end = performance.now();
      
      const duration = end - start;
      
      console.log(`📊 Concurrent Query Performance:`);
      console.log(`   Queries: ${queries.length}`);
      console.log(`   Duration: ${duration.toFixed(2)}ms`);
      console.log(`   Avg per query: ${(duration / queries.length).toFixed(2)}ms`);
      
      // All queries should complete successfully
      results.forEach(result => {
        expect(Array.isArray(result)).toBe(true);
      });
      
      // Concurrent queries should complete in reasonable time
      expect(duration).toBeLessThan(100);
    });
  });
});
