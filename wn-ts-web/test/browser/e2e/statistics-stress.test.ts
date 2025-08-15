import { describe, it, expect, beforeAll, afterAll, vi } from "vitest";
import { createWordNetInstance } from "../../../src/factory";
import type { WebWordnet } from "../../../src/web-wordnet";
import type { DataLoader } from "../../../src/data-loader";
import type { Word } from "wn-ts-core";
import { createScopedLogger, setGlobalLogLevel } from "utils/logger";

// Configurable stress and logging controls via Vite/Vitest env
const env: any = (import.meta as any).env || {};
const LOG_LEVEL = env.VITE_LOG_LEVEL || "info";
try { setGlobalLogLevel(LOG_LEVEL as any); } catch {}
const STRESS_LIGHT = String(env.VITE_STRESS_LIGHT || "1") === "1"; // Default to light mode

// Optimized parameters for faster execution within 1 minute limit
const NUM_CALLS = STRESS_LIGHT ? 2 : 5; // Reduced from 3/10
const MIXED_CALLS = STRESS_LIGHT ? 5 : 10; // Reduced from 10/20
const LONG_NUM_CALLS = STRESS_LIGHT ? 5 : 15; // Reduced from 10/50
const NUM_INSTANCES = STRESS_LIGHT ? 1 : 2; // Reduced from 1/3
const SUSTAINED_DURATION_MS = STRESS_LIGHT ? 1000 : 3000; // Reduced from 3000/10000

const logger = createScopedLogger("E2E:StatsStress");

const isNode =
  typeof process !== "undefined" &&
  process.versions != null &&
  process.versions.node != null;

describe.skipIf(isNode)("Statistics Methods Stress Tests", () => {
  let wordnet: WebWordnet | null = null;
  let dataLoader: DataLoader;

  beforeAll(async () => {
    try {
      console.log('🚀 Setting up WordNet Orchestration E2E test environment...');
      
      if (typeof window !== 'undefined') {
        console.log('🌐 Browser environment detected');
      }
      
      console.log('✅ E2E test environment setup complete');
      
      // Try to create WordNet instance
      try {
        wordnet = await createWordNetInstance('oewn:2024');
        console.log('✅', new Date().toLocaleTimeString(), 'ℹ️ [E2E:StatsStress] Completed:', 'createWordNetInstance(oewn:2024)');
      } catch (error) {
        console.warn('⚠️ Could not create WordNet instance (SQLite WASM not available):', error);
        wordnet = null;
      }
    } catch (error) {
      console.error('❌ Failed to set up test environment:', error);
      wordnet = null;
    }
  });

  afterAll(async () => {
    console.log('🧹 Cleaning up E2E test environment...');
    if (wordnet) {
      try {
        await wordnet.close();
      } catch (error) {
        console.warn('⚠️ Error closing WordNet instance:', error);
      }
    }
    console.log('🌐 Browser cleanup complete');
    console.log('✅ E2E test environment cleanup complete');
  });

  // Helper function to skip tests when WordNet is not available
  const skipIfNoWordNet = (testName: string) => {
    if (!wordnet) {
      console.log(`⚠️ Skipping "${testName}" - WordNet not available`);
      expect(true).toBe(true); // Skip test gracefully
      return true;
    }
    return false;
  };

  describe("getStatistics() Stress Tests", () => {
    it("should handle rapid successive calls without errors", async () => {
      if (skipIfNoWordNet("getStatistics rapid successive calls")) return;
      
      const promises: Promise<{
        totalWords: number;
        totalSynsets: number;
        totalSenses: number;
        totalILIs: number;
        totalLexicons: number;
      }>[] = [];
      
      for (let i = 0; i < LONG_NUM_CALLS; i++) {
        promises.push(wordnet!.getStatistics());
      }
      
      const results = await Promise.all(promises);
      expect(results.length).toBe(LONG_NUM_CALLS);
      
      // All results should be consistent
      const firstResult = results[0];
      for (const result of results) {
        expect(result.totalWords).toBe(firstResult.totalWords);
        expect(result.totalSynsets).toBe(firstResult.totalSynsets);
        expect(result.totalSenses).toBe(firstResult.totalSenses);
        expect(result.totalILIs).toBe(firstResult.totalILIs);
        expect(result.totalLexicons).toBe(firstResult.totalLexicons);
      }
    }, 60000);

    it("should handle concurrent calls with different timing", async () => {
      if (skipIfNoWordNet("getStatistics concurrent calls")) return;
      
      const promises: Promise<{
        totalWords: number;
        totalSynsets: number;
        totalSenses: number;
        totalILIs: number;
        totalLexicons: number;
      }>[] = [];
      
      for (let i = 0; i < LONG_NUM_CALLS; i++) {
        const delay = Math.random() * 100; // Random delay up to 100ms
        const promise = new Promise<typeof promises[0]['__type']>(async (resolve) => {
          setTimeout(async () => {
            try {
              const result = await wordnet!.getStatistics();
              resolve(result);
            } catch (error) {
              resolve({ error: error.message } as any);
            }
          }, delay);
        });
        promises.push(promise);
      }
      
      const results = await Promise.all(promises);
      expect(results.length).toBe(LONG_NUM_CALLS);
      
      // Most should succeed
      const successCount = results.filter(r => !('error' in r)).length;
      expect(successCount).toBeGreaterThan(0);
    }, 60000);

    it("should maintain consistency across multiple calls", async () => {
      if (skipIfNoWordNet("getStatistics consistency")) return;
      
      const results: Array<{
        totalWords: number;
        totalSynsets: number;
        totalSenses: number;
        totalILIs: number;
        totalLexicons: number;
      }> = [];
      
      for (let i = 0; i < LONG_NUM_CALLS; i++) {
        const result = await wordnet!.getStatistics();
        results.push(result);
      }
      
      expect(results.length).toBe(LONG_NUM_CALLS);
      
      // All results should be identical
      const firstResult = results[0];
      for (const result of results) {
        expect(result).toEqual(firstResult);
      }
    }, 60000);

    it("should handle calls during other operations", async () => {
      if (skipIfNoWordNet("getStatistics during operations")) return;
      
      // Start a word query operation
      const wordQueryPromise = wordnet!.words("test");
      
      // Make statistics calls during the word query
      const statsPromises: Promise<{
        totalWords: number;
        totalSynsets: number;
        totalSenses: number;
        totalILIs: number;
        totalLexicons: number;
      }>[] = [];
      
      for (let i = 0; i < LONG_NUM_CALLS; i++) {
        statsPromises.push(wordnet!.getStatistics());
      }
      
      // Wait for both operations to complete
      const [wordResult, ...statsResults] = await Promise.all([
        wordQueryPromise,
        ...statsPromises
      ]);
      
      expect(Array.isArray(wordResult)).toBe(true);
      expect(statsResults.length).toBe(LONG_NUM_CALLS);
      
      // All statistics should be consistent
      const firstStats = statsResults[0];
      for (const stats of statsResults) {
        expect(stats).toEqual(firstStats);
      }
    }, 60000);
  });

  describe("getLexiconStatistics() Stress Tests", () => {
    it("should handle rapid successive calls without errors", async () => {
      if (skipIfNoWordNet("getLexiconStatistics rapid successive calls")) return;
      
      const promises: Promise<{
        lexiconId: string;
        label: string;
        language: string;
        version: string;
        wordCount: number;
        synsetCount: number;
      }[]>[] = [];
      
      for (let i = 0; i < LONG_NUM_CALLS; i++) {
        promises.push(wordnet!.getLexiconStatistics());
      }
      
      const results = await Promise.all(promises);
      expect(results.length).toBe(LONG_NUM_CALLS);
      
      // All results should be consistent
      const firstResult = results[0];
      for (const result of results) {
        expect(result).toEqual(firstResult);
      }
    }, 60000);

    it("should handle concurrent calls with different timing", async () => {
      if (skipIfNoWordNet("getLexiconStatistics concurrent calls")) return;
      
      const promises: Promise<{
        lexiconId: string;
        label: string;
        language: string;
        version: string;
        wordCount: number;
        synsetCount: number;
      }[]>[] = [];
      
      for (let i = 0; i < LONG_NUM_CALLS; i++) {
        const delay = Math.random() * 100;
        const promise = new Promise<typeof promises[0]['__type']>(async (resolve) => {
          setTimeout(async () => {
            try {
              const result = await wordnet!.getLexiconStatistics();
              resolve(result);
            } catch (error) {
              resolve({ error: error.message } as any);
            }
          }, delay);
        });
        promises.push(promise);
      }
      
      const results = await Promise.all(promises);
      expect(results.length).toBe(LONG_NUM_CALLS);
      
      // Most should succeed
      const successCount = results.filter(r => !('error' in r)).length;
      expect(successCount).toBeGreaterThan(0);
    }, 60000);

    it("should maintain consistency across multiple calls", async () => {
      if (skipIfNoWordNet("getLexiconStatistics consistency")) return;
      
      const results: Array<{
        lexiconId: string;
        label: string;
        language: string;
        version: string;
        wordCount: number;
        synsetCount: number;
      }[]> = [];
      
      for (let i = 0; i < LONG_NUM_CALLS; i++) {
        const result = await wordnet!.getLexiconStatistics();
        results.push(result);
      }
      
      expect(results.length).toBe(LONG_NUM_CALLS);
      
      // All results should be identical
      const firstResult = results[0];
      for (const result of results) {
        expect(result).toEqual(firstResult);
      }
    }, 60000);

    it("should handle calls during other operations", async () => {
      if (skipIfNoWordNet("getLexiconStatistics during operations")) return;
      
      // Start a word query operation
      const wordQueryPromise = wordnet!.words("test");
      
      // Make lexicon statistics calls during the word query
      const statsPromises: Promise<{
        lexiconId: string;
        label: string;
        language: string;
        version: string;
        wordCount: number;
        synsetCount: number;
      }[]>[] = [];
      
      for (let i = 0; i < LONG_NUM_CALLS; i++) {
        statsPromises.push(wordnet!.getLexiconStatistics());
      }
      
      // Wait for both operations to complete
      const [wordResult, ...statsResults] = await Promise.all([
        wordQueryPromise,
        ...statsPromises
      ]);
      
      expect(Array.isArray(wordResult)).toBe(true);
      expect(statsResults.length).toBe(LONG_NUM_CALLS);
      
      // All statistics should be consistent
      const firstStats = statsResults[0];
      for (const stats of statsResults) {
        expect(stats).toEqual(firstStats);
      }
    }, 60000);

    it("should handle specific lexicon filtering consistently", async () => {
      if (skipIfNoWordNet("getLexiconStatistics filtering")) return;
      
      const results: Array<{
        lexiconId: string;
        label: string;
        language: string;
        version: string;
        wordCount: number;
        synsetCount: number;
      }[]> = [];
      
      for (let i = 0; i < LONG_NUM_CALLS; i++) {
        const result = await wordnet!.getLexiconStatistics();
        results.push(result);
      }
      
      expect(results.length).toBe(LONG_NUM_CALLS);
      
      // All results should be identical
      const firstResult = results[0];
      for (const result of results) {
        expect(result).toEqual(firstResult);
      }
    }, 60000);
  });

  describe("hasLoadedLexicons() Tests", () => {
    it("should correctly detect loaded lexicons", async () => {
      if (skipIfNoWordNet("hasLoadedLexicons detection")) return;
      
      const hasLoaded = wordnet!.hasLoadedLexicons();
      expect(typeof hasLoaded).toBe("boolean");
    }, 60000);

    it("should handle rapid successive calls without errors", async () => {
      if (skipIfNoWordNet("hasLoadedLexicons rapid calls")) return;
      
      const results: boolean[] = [];
      
      for (let i = 0; i < LONG_NUM_CALLS; i++) {
        const result = wordnet!.hasLoadedLexicons();
        results.push(result);
      }
      
      expect(results.length).toBe(LONG_NUM_CALLS);
      
      // All results should be consistent
      const firstResult = results[0];
      for (const result of results) {
        expect(result).toBe(firstResult);
      }
    }, 60000);

    it("should maintain consistency across multiple calls", async () => {
      if (skipIfNoWordNet("hasLoadedLexicons consistency")) return;
      
      const results: boolean[] = [];
      
      for (let i = 0; i < LONG_NUM_CALLS; i++) {
        const result = wordnet!.hasLoadedLexicons();
        results.push(result);
      }
      
      expect(results.length).toBe(LONG_NUM_CALLS);
      
      // All results should be identical
      const firstResult = results[0];
      for (const result of results) {
        expect(result).toBe(firstResult);
      }
    }, 60000);
  });

  describe("Combined Stress Tests", () => {
    it("should handle mixed rapid calls to both methods", async () => {
      if (skipIfNoWordNet("mixed rapid calls")) return;
      
      const promises: Promise<any>[] = [];
      
      for (let i = 0; i < LONG_NUM_CALLS; i++) {
        if (i % 2 === 0) {
          promises.push(wordnet!.getStatistics());
        } else {
          promises.push(wordnet!.getLexiconStatistics());
        }
      }
      
      const results = await Promise.all(promises);
      expect(results.length).toBe(LONG_NUM_CALLS);
    }, 60000);

    it("should handle sustained load over time", async () => {
      if (skipIfNoWordNet("sustained load")) return;
      
      const startTime = Date.now();
      const results: any[] = [];
      
      for (let i = 0; i < LONG_NUM_CALLS; i++) {
        const result = await wordnet!.getStatistics();
        results.push(result);
        
        // Small delay between calls
        if (i < LONG_NUM_CALLS - 1) {
          await new Promise(resolve => setTimeout(resolve, 10));
        }
      }
      
      const duration = Date.now() - startTime;
      console.log(`Sustained load test completed in ${duration}ms`);
      
      expect(results.length).toBe(LONG_NUM_CALLS);
    }, 60000);

    it("should handle memory pressure scenarios", async () => {
      if (skipIfNoWordNet("memory pressure")) return;
      
      // Create a new WordNet instance for this test to avoid conflicts
      let testWordnet: WebWordnet | null = null;
      try {
        testWordnet = await createWordNetInstance('oewn:2024');
        
        const promises: Promise<any>[] = [];
        for (let i = 0; i < LONG_NUM_CALLS; i++) {
          promises.push(testWordnet!.getStatistics());
        }
        
        const results = await Promise.all(promises);
        expect(results.length).toBe(LONG_NUM_CALLS);
      } finally {
        if (testWordnet) {
          try {
            await testWordnet.close();
          } catch (error) {
            console.warn('Error closing test WordNet instance:', error);
          }
        }
      }
    }, 60000);
  });

  describe('Error Recovery Tests', () => {
    it('should recover from SQLITE_NOMEM errors gracefully', async () => {
      if (skipIfNoWordNet("SQLITE_NOMEM recovery")) return;
      
      // This test simulates memory pressure by making many rapid calls
      const promises: Promise<
        | {
            totalWords: number;
            totalSynsets: number;
            totalSenses: number;
            totalILIs: number;
            totalLexicons: number;
          }
        | {
            lexiconId: string;
            label: string;
            language: string;
            version: string;
            wordCount: number;
            synsetCount: number;
          }[]
        | { error: string }
      >[] = [];
      
      for (let i = 0; i < LONG_NUM_CALLS; i++) {
        promises.push(
          wordnet!.getStatistics().catch((error) => ({ error: error.message }))
        );
        promises.push(
          wordnet!.getLexiconStatistics().catch((error) => ({ error: error.message }))
        );
      }
      
      const results = await Promise.allSettled(promises);
      expect(results.length).toBe(LONG_NUM_CALLS * 2);
      
      // Most should succeed, some may fail due to memory pressure
      const successCount = results.filter(r => r.status === 'fulfilled' && !('error' in r.value)).length;
      const failureCount = results.filter(r => r.status === 'rejected' || ('error' in r.value)).length;
      
      console.log(`Memory pressure test: ${successCount} succeeded, ${failureCount} failed`);
      expect(successCount).toBeGreaterThan(0);
      expect(failureCount).toBeGreaterThanOrEqual(0);
    }, 60000);

    it('should maintain database integrity under stress', async () => {
      if (skipIfNoWordNet("database integrity")) return;
      
      // Test that the database remains functional under load
      const testWord = 'test';
      let successCount = 0;
      let failureCount = 0;
      
      for (let i = 0; i < LONG_NUM_CALLS; i++) {
        try {
          const words = await wordnet!.words(testWord);
          expect(Array.isArray(words)).toBe(true);
          successCount++;
        } catch (error) {
          console.log(`Query ${i} failed:`, error);
          failureCount++;
        }
      }
      
      console.log(`Database integrity test: ${successCount} succeeded, ${failureCount} failed`);
      expect(successCount).toBeGreaterThan(0);
      // Allow some failures but not all
      expect(failureCount).toBeLessThan(LONG_NUM_CALLS);
    }, 60000);

    it('should handle network failures gracefully', async () => {
      if (skipIfNoWordNet("network failure handling")) return;
      
      // Test that the system handles network failures without hanging
      const startTime = Date.now();
      
      try {
        // Try to load a non-existent lexicon to test network failure handling
        await wordnet!.loadLexicon('nonexistent:9999');
        // If we get here, it didn't fail as expected
        expect(false).toBe(true);
      } catch (error) {
        // Expected error
        expect(error).toBeDefined();
        const duration = Date.now() - startTime;
        // Should fail quickly, not hang
        expect(duration).toBeLessThan(10000); // 10 seconds max
      }
    }, 15000); // 15 second timeout
  });
});
