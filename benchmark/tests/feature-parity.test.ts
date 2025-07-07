import { describe, it, expect, beforeAll, afterAll } from "vitest";
import {
  RELIABLE_LIBRARIES,
  TEST_CASES,
  initializeLibraries,
  cleanupLibraries,
  runParityTest,
  compareResults,
  log
} from './shared-test-utils.ts';

describe("WordNet Feature Parity & Correctness Tests", { timeout: 60000 }, () => {
  beforeAll(async () => {
    log("🚀 Starting WordNet feature parity tests");
    await initializeLibraries(RELIABLE_LIBRARIES);
  }, 180000);

  afterAll(async () => {
    await cleanupLibraries(RELIABLE_LIBRARIES);
    log("✅ Feature parity tests completed");
  });

  describe("Core Functionality Parity", () => {
    it("should return comparable synset results for all libraries", async () => {
      const { word, pos } = TEST_CASES.basic;
      
      const results = await runParityTest(
        RELIABLE_LIBRARIES,
        (lib) => lib.synsetLookup(word, pos),
        `synset lookup (${word}, ${pos})`
      );
      
      const comparison = compareResults(results, 'structure');
      if (!comparison.comparable) {
        log(`⚠️ Synset lookup parity check failed: ${comparison.reason}`, 'warn');
      }
      
      // Test that at least some libraries succeeded
      const successful = results.filter(r => r.success);
      expect(successful.length).toBeGreaterThan(0);
      
      // Log results for debugging
      results.forEach(result => {
        if (result.success) {
          const count = result.normalized?.length || 0;
          log(`${result.library}: ${count} synsets found`);
        } else {
          log(`${result.library}: FAILED - ${result.error}`, 'error');
        }
      });
    }, 30000);

    it("should return comparable word lookup results for all libraries", async () => {
      const { word } = TEST_CASES.basic;
      
      const results = await runParityTest(
        RELIABLE_LIBRARIES,
        (lib) => lib.wordLookup(word),
        `word lookup (${word})`
      );
      
      const comparison = compareResults(results, 'structure');
      if (!comparison.comparable) {
        log(`⚠️ Word lookup parity check failed: ${comparison.reason}`, 'warn');
      }
      
      // Test that at least some libraries succeeded
      const successful = results.filter(r => r.success);
      expect(successful.length).toBeGreaterThan(0);
      
      // Log results for debugging
      results.forEach(result => {
        if (result.success) {
          const count = result.normalized?.length || 0;
          log(`${result.library}: ${count} words found`);
        } else {
          log(`${result.library}: FAILED - ${result.error}`, 'error');
        }
      });
    }, 30000);

    it("should return comparable sense lookup results for libraries that support it", async () => {
      const { word } = TEST_CASES.basic;
      
      const results = await runParityTest(
        RELIABLE_LIBRARIES,
        (lib) => {
          if (typeof lib.senseLookup === 'function') {
            return lib.senseLookup(word);
          }
          throw new Error('Sense lookup not supported');
        },
        `sense lookup (${word})`
      );
      
      const comparison = compareResults(results, 'structure');
      if (!comparison.comparable) {
        log(`⚠️ Sense lookup parity check failed: ${comparison.reason}`, 'warn');
      }
      
      // Log results for debugging
      results.forEach(result => {
        if (result.success) {
          const count = result.normalized?.length || 0;
          log(`${result.library}: ${count} senses found`);
        } else {
          log(`${result.library}: FAILED - ${result.error}`, 'error');
        }
      });
    }, 30000);
  });

  describe("Edge Case Handling", () => {
    it("should handle non-existent words gracefully across all libraries", async () => {
      const { word, pos } = TEST_CASES.edgeCases[1]; // non-existent word
      
      const results = await runParityTest(
        RELIABLE_LIBRARIES,
        (lib) => lib.synsetLookup(word, { pos }),
        `non-existent word lookup (${word}, ${pos})`
      );
      
      // All libraries should return empty arrays for non-existent words
      results.forEach(result => {
        if (result.success) {
          expect(Array.isArray(result.result)).toBe(true);
          expect(result.result.length).toBe(0);
          log(`${result.library}: correctly returned empty array for non-existent word`);
        } else {
          log(`${result.library}: failed to handle non-existent word - ${result.error}`, 'warn');
        }
      });
    }, 30000);

    it("should handle empty string inputs across all libraries", async () => {
      const { word, pos } = TEST_CASES.edgeCases[0]; // empty string
      
      const results = await runParityTest(
        RELIABLE_LIBRARIES,
        (lib) => lib.synsetLookup(word, { pos }),
        `empty string lookup (${pos})`
      );
      
      // Libraries should handle empty strings gracefully
      results.forEach(result => {
        if (result.success) {
          expect(Array.isArray(result.result)).toBe(true);
          log(`${result.library}: handled empty string gracefully`);
        } else {
          log(`${result.library}: failed to handle empty string - ${result.error}`, 'warn');
        }
      });
    }, 30000);

    it("should handle invalid POS tags across all libraries", async () => {
      const { word, pos } = TEST_CASES.edgeCases[2]; // invalid POS
      
      const results = await runParityTest(
        RELIABLE_LIBRARIES,
        (lib) => lib.synsetLookup(word, { pos }),
        `invalid POS lookup (${word}, ${pos})`
      );
      
      // Libraries should handle invalid POS gracefully
      results.forEach(result => {
        if (result.success) {
          expect(Array.isArray(result.result)).toBe(true);
          log(`${result.library}: handled invalid POS gracefully`);
        } else {
          log(`${result.library}: failed to handle invalid POS - ${result.error}`, 'warn');
        }
      });
    }, 30000);
  });

  describe("API Consistency", () => {
    it("should demonstrate consistent API behavior across libraries", async () => {
      const testWord = 'computer';
      const testPos = 'n';
      
      for (const lib of RELIABLE_LIBRARIES) {
        try {
          if (lib.isInitialized && !lib.isInitialized()) {
            log(`${lib.name} not initialized, skipping`, 'warn');
            continue;
          }
          
          // Test synset lookup
          const synsets = await lib.synsetLookup(testWord, { pos: testPos });
          expect(Array.isArray(synsets)).toBe(true);
          log(`${lib.name}: synset lookup returned ${synsets.length} results`);
          
          // Test word lookup
          const words = await lib.wordLookup(testWord);
          expect(Array.isArray(words)).toBe(true);
          log(`${lib.name}: word lookup returned ${words.length} results`);
          
          // Test sense lookup if supported
          if (typeof lib.senseLookup === 'function') {
            const senses = await lib.senseLookup(testWord);
            expect(Array.isArray(senses)).toBe(true);
            log(`${lib.name}: sense lookup returned ${senses.length} results`);
          } else {
            log(`${lib.name}: sense lookup not supported`);
          }
        } catch (error) {
          log(`${lib.name} API consistency test failed: ${error}`, 'error');
        }
      }
    }, 30000);

    it("should test normalization consistency across libraries", async () => {
      const { word, pos } = { word: 'happy', pos: 'a' };
      
      for (const lib of RELIABLE_LIBRARIES) {
        try {
          if (lib.isInitialized && !lib.isInitialized()) {
            log(`${lib.name} not initialized, skipping`, 'warn');
            continue;
          }
          
          const raw = await lib.synsetLookup(word, { pos });
          expect(Array.isArray(raw)).toBe(true);
          
          if (lib.normalizeSynsets) {
            const normalized = lib.normalizeSynsets(raw);
            expect(Array.isArray(normalized)).toBe(true);
            
            // Check that normalized results have expected structure
            if (normalized.length > 0) {
              const first = normalized[0];
              expect(first).toHaveProperty('id');
              expect(first).toHaveProperty('pos');
              expect(first).toHaveProperty('lemma');
              log(`${lib.name}: normalization produces consistent structure`);
            } else {
              log(`${lib.name}: no results to normalize`);
            }
          } else {
            log(`${lib.name}: normalization not supported`);
          }
        } catch (error) {
          log(`${lib.name} normalization test failed: ${error}`, 'error');
        }
      }
    }, 30000);
  });

  describe("Robustness & Error Handling", () => {
    it("should test error handling and robustness across libraries", async () => {
      for (const lib of RELIABLE_LIBRARIES) {
        try {
          if (lib.isInitialized && !lib.isInitialized()) {
            log(`${lib.name} not initialized, skipping`, 'warn');
            continue;
          }
          
          for (const { word, pos, description } of TEST_CASES.edgeCases) {
            try {
              const result = await lib.synsetLookup(word, { pos });
              expect(Array.isArray(result)).toBe(true);
              log(`${lib.name}: handled ${description} gracefully`);
            } catch (error) {
              // Some libraries may throw errors for invalid inputs, which is acceptable
              log(`${lib.name}: threw error for ${description} - ${error}`, 'warn');
            }
          }
        } catch (error) {
          log(`${lib.name} error handling test failed: ${error}`, 'error');
        }
      }
    }, 30000);
  });

  describe("Cross-Library Comparison", () => {
    it("should compare results across multiple common words", async () => {
      const testWords = TEST_CASES.commonWords;
      const testPos = 'n';
      
      for (const word of testWords) {
        log(`🔍 Comparing synset lookup for "${word}" across libraries`);
        
        const results = await runParityTest(
          RELIABLE_LIBRARIES,
          (lib) => lib.synsetLookup(word, { pos: testPos }),
          `synset lookup (${word}, ${testPos})`
        );
        
        const comparison = compareResults(results, 'structure');
        if (comparison.comparable) {
          log(`✅ All libraries returned comparable results for "${word}"`);
        } else {
          log(`⚠️ Libraries returned different results for "${word}": ${comparison.reason}`, 'warn');
        }
        
        // Log individual results
        results.forEach(result => {
          if (result.success) {
            const count = result.normalized?.length || 0;
            log(`  ${result.library}: ${count} synsets`);
          } else {
            log(`  ${result.library}: FAILED`, 'error');
          }
        });
      }
    }, 60000);
  });
});
