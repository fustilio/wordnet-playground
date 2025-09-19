import { describe, it, expect, beforeAll, afterAll, vi } from "vitest";
import { createWordNetInstance } from "../../../src/factory";
import type { WebWordnet } from "../../../src/client/submodules/web-wordnet";
import type { DataLoader } from "../../../src/data-loader";
import type { Word } from "wn-ts-core";
import { createScopedLogger, setGlobalLogLevel } from "../../../../packages/utils/logger";

// Configurable stress and logging controls via Vite/Vitest env
const env: any = (import.meta as any).env || {};
const LOG_LEVEL = env.VITE_LOG_LEVEL || "info";
try { setGlobalLogLevel(LOG_LEVEL as any); } catch {}
const STRESS_LIGHT = String(env.VITE_STRESS_LIGHT || "0") === "1";

// Tunable parameters
const NUM_CALLS = STRESS_LIGHT ? 3 : 10;
const MIXED_CALLS = STRESS_LIGHT ? 10 : 20;
const LONG_NUM_CALLS = STRESS_LIGHT ? 10 : 50;
const NUM_INSTANCES = STRESS_LIGHT ? 1 : 3;
const SUSTAINED_DURATION_MS = STRESS_LIGHT ? 3000 : 10000;

const logger = createScopedLogger("E2E:StatsStress");

const isNode =
  typeof process !== "undefined" &&
  process.versions != null &&
  process.versions.node != null;

describe.skipIf(isNode)("Statistics Methods Stress Tests", () => {
  let wordnet: WebWordnet;
  let dataLoader: DataLoader;

  beforeAll(async () => {
    logger.start("createWordNetInstance(oewn:2024)");
    const instance = await createWordNetInstance("oewn:2024");
    wordnet = instance.wordnet;
    dataLoader = instance.dataLoader;
    logger.end("createWordNetInstance(oewn:2024)");

    // Use the actual DataLoader to download and load the full OEWN database
    await logger.withHeartbeat(
      "downloadAndLoad(oewn:2024)",
      async () => {
        await dataLoader.downloadAndLoad("oewn:2024");
      },
      2000
    );
  }, 300000); // Increase timeout for setup to 5 minutes

  afterAll(async () => {
    if (wordnet) {
      await wordnet.close();
    }
  });

  describe("getStatistics() Stress Tests", () => {
    it("should handle rapid successive calls without errors", async () => {
      const promises: Promise<{
        totalWords: number;
        totalSynsets: number;
        totalSenses: number;
        totalILIs: number;
        totalLexicons: number;
      }>[] = [];
      for (let i = 0; i < NUM_CALLS; i++) {
        promises.push(wordnet.getStatistics());
      }

      const results = await Promise.all(promises);

      expect(results).toHaveLength(NUM_CALLS);
      results.forEach((stats, index) => {
        expect(stats).toHaveProperty("totalWords");
        expect(stats).toHaveProperty("totalSynsets");
        expect(stats).toHaveProperty("totalSenses");
        expect(stats).toHaveProperty("totalILIs");
        expect(stats).toHaveProperty("totalLexicons");
        expect(typeof stats.totalWords).toBe("number");
        expect(typeof stats.totalSynsets).toBe("number");
        expect(stats.totalWords).toBeGreaterThan(100000);
        expect(stats.totalSynsets).toBeGreaterThan(80000);
      });
    }, 60000);

    it("should handle concurrent calls with different timing", async () => {
      const results = await Promise.all([
        wordnet.getStatistics(),
        wordnet.getStatistics(),
        wordnet.getStatistics(),
      ]);

      expect(results).toHaveLength(3);
      results.forEach((stats: any) => {
        expect(stats).toHaveProperty("totalWords");
        expect(stats.totalWords).toBeGreaterThan(100000);
      });
    }, 60000);

    it("should maintain consistency across multiple calls", async () => {
      const firstCall = await wordnet.getStatistics();
      await new Promise((resolve) => setTimeout(resolve, 1000)); // Wait 1 second
      const secondCall = await wordnet.getStatistics();
      await new Promise((resolve) => setTimeout(resolve, 1000)); // Wait another second
      const thirdCall = await wordnet.getStatistics();

      // All calls should return the same data
      expect(firstCall.totalWords).toBe(secondCall.totalWords);
      expect(secondCall.totalWords).toBe(thirdCall.totalWords);
      expect(firstCall.totalSynsets).toBe(secondCall.totalSynsets);
      expect(secondCall.totalSynsets).toBe(thirdCall.totalSynsets);
    }, 60000);

    it("should handle calls during other operations", async () => {
      // Start a heavy operation
              const heavyOperation = wordnet.words({ form: "test" });

      // Make statistics calls during the heavy operation
      const statsPromises: Promise<{
        totalWords: number;
        totalSynsets: number;
        totalSenses: number;
        totalILIs: number;
        totalLexicons: number;
      }>[] = [];
      for (let i = 0; i < Math.min(5, NUM_CALLS); i++) {
        statsPromises.push(wordnet.getStatistics());
      }

      // Wait for both operations
      const [words, ...statsResults] = await Promise.all([
        heavyOperation,
        ...statsPromises,
      ]);

      expect(words).toBeDefined();
      expect(statsResults.length).toBeGreaterThan(0);
      statsResults.forEach((stats: any) => {
        expect(stats.totalWords).toBeGreaterThan(100000);
      });
    }, 60000);
  });

  describe("getLexiconStatistics() Stress Tests", () => {
    it("should handle rapid successive calls without errors", async () => {
      const promises: Promise<
        {
          lexiconId: string;
          label: string;
          language: string;
          version: string;
          wordCount: number;
          synsetCount: number;
        }[]
      >[] = [];
      for (let i = 0; i < NUM_CALLS; i++) {
        promises.push(wordnet.getLexiconStatistics());
      }

      const results = await Promise.all(promises);

      expect(results).toHaveLength(NUM_CALLS);
      results.forEach((lexiconStats, index) => {
        expect(Array.isArray(lexiconStats)).toBe(true);
        if (lexiconStats.length > 0) {
          const firstStat = lexiconStats[0];
          expect(firstStat).toHaveProperty("lexiconId");
          expect(firstStat).toHaveProperty("label");
          expect(firstStat).toHaveProperty("language");
          expect(firstStat).toHaveProperty("version");
          expect(firstStat).toHaveProperty("wordCount");
          expect(firstStat).toHaveProperty("synsetCount");
          expect(typeof firstStat.wordCount).toBe("number");
          expect(typeof firstStat.synsetCount).toBe("number");
          expect(firstStat.wordCount).toBeGreaterThan(0);
          expect(firstStat.synsetCount).toBeGreaterThan(0);
        }
      });
    }, 60000);

    it("should handle concurrent calls with different timing", async () => {
      const results = await Promise.all([
        wordnet.getLexiconStatistics(),
        new Promise<
          {
            lexiconId: string;
            label: string;
            language: string;
            version: string;
            wordCount: number;
            synsetCount: number;
          }[]
        >((resolve) =>
          setTimeout(() => resolve(wordnet.getLexiconStatistics()), 100)
        ),
        new Promise<
          {
            lexiconId: string;
            label: string;
            language: string;
            version: string;
            wordCount: number;
            synsetCount: number;
          }[]
        >((resolve) =>
          setTimeout(() => resolve(wordnet.getLexiconStatistics()), 200)
        ),
        new Promise<
          {
            lexiconId: string;
            label: string;
            language: string;
            version: string;
            wordCount: number;
            synsetCount: number;
          }[]
        >((resolve) =>
          setTimeout(() => resolve(wordnet.getLexiconStatistics()), 300)
        ),
        new Promise<
          {
            lexiconId: string;
            label: string;
            language: string;
            version: string;
            wordCount: number;
            synsetCount: number;
          }[]
        >((resolve) =>
          setTimeout(() => resolve(wordnet.getLexiconStatistics()), 500)
        ),
      ]);

      expect(results).toHaveLength(5);
      results.forEach((lexiconStats: any) => {
        expect(Array.isArray(lexiconStats)).toBe(true);
      });
    }, 60000);

    it("should maintain consistency across multiple calls", async () => {
      const firstCall = await wordnet.getLexiconStatistics();
      await new Promise((resolve) => setTimeout(resolve, 1000)); // Wait 1 second
      const secondCall = await wordnet.getLexiconStatistics();
      await new Promise((resolve) => setTimeout(resolve, 1000)); // Wait another second
      const thirdCall = await wordnet.getLexiconStatistics();

      // All calls should return the same data
      expect(firstCall.length).toBe(secondCall.length);
      expect(secondCall.length).toBe(thirdCall.length);

      if (firstCall.length > 0) {
        expect(firstCall[0].wordCount).toBe(secondCall[0].wordCount);
        expect(secondCall[0].wordCount).toBe(thirdCall[0].wordCount);
      }
    }, 60000);

    it("should handle calls during other operations", async () => {
      // Start a heavy operation
      const heavyOperation = wordnet.words({ form: "test" });

      // Make lexicon statistics calls during the heavy operation
      const statsPromises: Promise<
        {
          lexiconId: string;
          label: string;
          language: string;
          version: string;
          wordCount: number;
          synsetCount: number;
        }[]
      >[] = [];
      for (let i = 0; i < Math.min(5, NUM_CALLS); i++) {
        statsPromises.push(wordnet.getLexiconStatistics());
      }

      // Wait for both operations
      const [words, ...statsResults] = await Promise.all([
        heavyOperation,
        ...statsPromises,
      ]);

      expect(words).toBeDefined();
      expect(statsResults.length).toBeGreaterThan(0);
      statsResults.forEach((lexiconStats: any) => {
        expect(Array.isArray(lexiconStats)).toBe(true);
      });
    }, 60000);

    it("should handle specific lexicon filtering consistently", async () => {
      const promises: Promise<
        {
          lexiconId: string;
          label: string;
          language: string;
          version: string;
          wordCount: number;
          synsetCount: number;
        }[]
      >[] = [];
      for (let i = 0; i < Math.min(5, NUM_CALLS); i++) {
        promises.push(wordnet.getLexiconStatistics("oewn:2024"));
      }

      const results = await Promise.all(promises);

      expect(results.length).toBeGreaterThan(0);
      results.forEach((lexiconStats: any) => {
        expect(Array.isArray(lexiconStats)).toBe(true);
        if (lexiconStats.length > 0) {
          lexiconStats.forEach((stat: any) => {
            expect(stat.lexiconId).toBe("oewn:2024");
          });
        }
      });
    }, 60000);
  });

  describe("hasLoadedLexicons() Tests", () => {
    it("should correctly detect loaded lexicons", async () => {
      const hasLexicons = await wordnet.hasLoadedLexicons();
      expect(typeof hasLexicons).toBe("boolean");
      expect(hasLexicons).toBe(true); // We loaded data in beforeAll
    }, 30000);

    it("should handle rapid successive calls without errors", async () => {
      const promises: Promise<boolean>[] = [];
      for (let i = 0; i < (STRESS_LIGHT ? 10 : 20); i++) {
        promises.push(wordnet.hasLoadedLexicons());
      }

      const results = await Promise.all(promises);

      expect(results.length).toBeGreaterThan(0);
      results.forEach((hasLexicons) => {
        expect(typeof hasLexicons).toBe("boolean");
        expect(hasLexicons).toBe(true);
      });
    }, 30000);

    it("should maintain consistency across multiple calls", async () => {
      const firstCall = await wordnet.hasLoadedLexicons();
      await new Promise((resolve) => setTimeout(resolve, 1000)); // Wait 1 second
      const secondCall = await wordnet.hasLoadedLexicons();
      await new Promise((resolve) => setTimeout(resolve, 1000)); // Wait another second
      const thirdCall = await wordnet.hasLoadedLexicons();

      // All calls should return the same result
      expect(firstCall).toBe(secondCall);
      expect(secondCall).toBe(thirdCall);
      expect(firstCall).toBe(true); // We have data loaded
    }, 30000);
  });

  describe("Combined Stress Tests", () => {
    it("should handle mixed rapid calls to both methods", async () => {
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
      >[] = [];
      for (let i = 0; i < MIXED_CALLS; i++) {
        if (i % 2 === 0) {
          promises.push(wordnet.getStatistics());
        } else {
          promises.push(wordnet.getLexiconStatistics());
        }
      }

      const results = await Promise.all(promises);

      expect(results.length).toBeGreaterThan(0);

      // Check that we got the right mix of results
      const statsResults = results.filter((r) => "totalWords" in r);
      const lexiconResults = results.filter((r) => Array.isArray(r));

      expect(statsResults.length).toBeGreaterThan(0);
      expect(lexiconResults.length).toBeGreaterThan(0);

      statsResults.forEach((stats) => {
        expect(stats.totalWords).toBeGreaterThan(100000);
      });

      lexiconResults.forEach((lexiconStats) => {
        expect(Array.isArray(lexiconStats)).toBe(true);
      });
    }, 120000);

    it("should handle sustained load over time", async () => {
      const startTime = Date.now();
      const duration = SUSTAINED_DURATION_MS; // configurable duration
      const results: {
        stats: {
          totalWords: number;
          totalSynsets: number;
          totalSenses: number;
          totalILIs: number;
          totalLexicons: number;
        };
        lexiconStats: {
          lexiconId: string;
          label: string;
          language: string;
          version: string;
          wordCount: number;
          synsetCount: number;
        }[];
        timestamp: number;
      }[] = [];

      while (Date.now() - startTime < duration) {
        try {
          const stats = await wordnet.getStatistics();
          const lexiconStats = await wordnet.getLexiconStatistics();

          results.push({ stats, lexiconStats, timestamp: Date.now() });

          // Small delay to prevent overwhelming
          await new Promise((resolve) => setTimeout(resolve, 100));
        } catch (error) {
          results.push({
            stats: {
              totalWords: 0,
              totalSynsets: 0,
              totalSenses: 0,
              totalILIs: 0,
              totalLexicons: 0,
            },
            lexiconStats: [],
            timestamp: Date.now(),
          });
        }
      }

      expect(results.length).toBeGreaterThan(0);

      // Check that most calls succeeded
      const successfulCalls = results.filter((r) => r.stats.totalWords > 0);
      const successRate = successfulCalls.length / results.length;

      expect(successRate).toBeGreaterThan(0.8); // At least 80% success rate

      if (successfulCalls.length > 0) {
        successfulCalls.forEach((call) => {
          expect(call.stats.totalWords).toBeGreaterThan(100000);
          expect(Array.isArray(call.lexiconStats)).toBe(true);
        });
      }
    }, 120000);

    it("should handle memory pressure scenarios", async () => {
      // Create multiple WordNet instances to simulate memory pressure
      const instances: { wordnet: WebWordnet; dataLoader: DataLoader }[] = [];

      try {
        for (let i = 0; i < NUM_INSTANCES; i++) {
          const instance = await createWordNetInstance("oewn:2024");
          instances.push(instance);
        }

        // Now stress test the original instance
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
        >[] = [];
        for (let i = 0; i < (STRESS_LIGHT ? 5 : 10); i++) {
          promises.push(wordnet.getStatistics());
          promises.push(wordnet.getLexiconStatistics());
        }

        const results = await Promise.all(promises);
        expect(results.length).toBeGreaterThan(0);

        // Verify results are still valid
        const statsResults = results.filter((r) => "totalWords" in r);
        const lexiconResults = results.filter((r) => Array.isArray(r));

        expect(statsResults.length).toBeGreaterThan(0);
        expect(lexiconResults.length).toBeGreaterThan(0);
      } finally {
        // Clean up instances
        for (const instance of instances) {
          await instance.wordnet.close();
        }
      }
    }, 120000);
  });

  describe("Error Recovery Tests", () => {
    it("should recover from SQLITE_NOMEM errors gracefully", async () => {
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
          wordnet.getStatistics().catch((error: any) => ({ error: error.message }))
        );
        promises.push(
          wordnet
            .getLexiconStatistics()
            .catch((error: any) => ({ error: error.message }))
        );
      }

      const results = await Promise.all(promises);

      expect(results.length).toBeGreaterThan(0);

      // Check that we can still make successful calls after potential errors
      const finalStats = await wordnet.getStatistics();
      const finalLexiconStats = await wordnet.getLexiconStatistics();

      expect(finalStats.totalWords).toBeGreaterThan(100000);
      expect(Array.isArray(finalLexiconStats)).toBe(true);
    }, 120000);

    it("should maintain database integrity under stress", async () => {
      // Make many rapid calls
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
        | Word[]
      >[] = [];
      for (let i = 0; i < (STRESS_LIGHT ? 10 : 30); i++) {
        promises.push(wordnet.getStatistics());
        promises.push(wordnet.getLexiconStatistics());
        promises.push(wordnet.words({ form: "test" })); // Mix in other operations
      }

      const results = await Promise.all(promises);
      expect(results.length).toBeGreaterThan(0);

      // Verify database is still functional
      const words = await wordnet.words({ form: "test" });
      expect(Array.isArray(words)).toBe(true);

      const stats = await wordnet.getStatistics();
      expect(stats.totalWords).toBeGreaterThan(100000);
    }, 120000);
  });
});
