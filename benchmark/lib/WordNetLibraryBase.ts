// Abstract base class for WordNet library integration

export interface QueryOptions {
  pos?: string;
  lang?: string;
  lexicon?: string;
}

export abstract class WordNetLibraryBase {
  abstract name: string;
  protected lib: any = undefined;

  /**
   * Indicates if the library supports multilingual queries (e.g., lang parameter)
   */
  supportsMultilingual: boolean = false;

  /**
   * Initialize the library (e.g., load data, connect, etc.)
   */
  abstract init(options?: { lexicon?: string }): Promise<void>;

  /**
   * Lookup synsets for a word and part of speech
   */
  abstract synsetLookup(word: string, options?: QueryOptions): Promise<any>;

  /**
   * Lookup words (lemmas, forms, etc.)
   */
  abstract wordLookup(word: string, options?: QueryOptions): Promise<any>;

  /**
   * (Optional) Lookup senses for a word
   */
  senseLookup?(word: string, options?: QueryOptions): Promise<any>;

  /**
   * (Optional) Cleanup resources (close files, connections, etc.)
   */
  cleanup?(): Promise<void>;

  /**
   * (Optional) Normalize synset output for comparison across libraries
   * Should return an array of comparable objects (e.g., { id, pos, lemma, ... })
   */
  normalizeSynsets?(output: any): any[];

  /**
   * (Optional) Check if the library is properly initialized
   */
  isInitialized?(): boolean {
    return this.lib !== undefined;
  }

  /**
   * (Optional) Shared logging, timing, or error hooks can be added here
   */
}

/**
 * Extension for libraries that support multilingual queries (e.g., wn-ts, wn-pybridge)
 */
export abstract class MultilingualWordNetLibraryBase extends WordNetLibraryBase {
  supportsMultilingual = true;

  /**
   * Lookup synsets in a specific language
   */
  abstract synsetLookup(word: string, options: QueryOptions & { lang: string }): Promise<any>;

  /**
   * Lookup words in a specific language
   */
  abstract wordLookup(word: string, options: QueryOptions & { lang: string }): Promise<any>;

  // Optionally, add more multilingual-specific methods here
}

/**
 * Reusable test framework for WordNetLibraryBase implementations
 */
export class WordNetLibraryTester {
  /**
   * Run comprehensive tests for a WordNet library implementation
   */
  static runTests(
    vitest: any,
    LibraryClass: new () => WordNetLibraryBase,
    options: {
      testName?: string;
      expectedResults?: boolean;
      skipDataStructure?: boolean;
      customTests?: (library: WordNetLibraryBase) => Promise<void>;
      lexicon?: string; // Add lexicon option for multilingual testing
      debug?: boolean;
    } = {}
  ) {
    const {
      testName = "WordNet Library",
      expectedResults = true,
      skipDataStructure = false,
      customTests,
      lexicon,
      debug = false,
    } = options;

    const { beforeAll, afterAll, it, expect, describe } = vitest;

    // Assign library before test registration
    const library: WordNetLibraryBase = new LibraryClass();

    beforeAll(async () => {
      if (debug) {
        console.log(`🔧 Initializing ${testName} for standalone testing with lexicon: ${lexicon ?? 'default'}`);
      }
      await library.init({ lexicon });
      if (debug) {
        console.log(`✅ ${testName} initialized successfully`);
      }
    }, 300000); // 5 minute timeout for potentially long setup

    afterAll(async () => {
      if (library.cleanup) {
        if (debug) {
          console.log(`🧹 Cleaning up ${testName}`);
        }
        await library.cleanup();
      }
    });

    it("should initialize successfully", () => {
      expect(library.isInitialized?.()).toBe(true);
      expect(library.name).toBeDefined();
    });

    it("should perform synset lookup for common nouns", async () => {
      const results = await library.synsetLookup("computer", { pos: "n" });
      expect(Array.isArray(results)).toBe(true);
      if (results.length > 0) {
        const firstResult = results[0];
        expect(firstResult).toBeDefined();
        if (debug) {
          console.log(
            `📊 Found ${results.length} synsets for 'computer' (noun)`
          );
          console.log(
            `📝 First synset: ${JSON.stringify(firstResult, null, 2)}`
          );
        }
      } else {
        console.log(`⚠️  No synsets found - ${testName} may need data`);
      }
    });

    it("should perform synset lookup for verbs", async () => {
      const results = await library.synsetLookup("run", { pos: "v" });
      expect(Array.isArray(results)).toBe(true);
      if (results.length > 0) {
        if (debug) {
          console.log(`📊 Found ${results.length} synsets for 'run' (verb)`);
        }
      } else {
        console.log(`⚠️  No synsets found for 'run' (verb)`);
      }
    });

    it("should perform synset lookup for adjectives", async () => {
      const results = await library.synsetLookup("happy", { pos: "a" });
      expect(Array.isArray(results)).toBe(true);
      if (results.length > 0) {
        if (debug) {
          console.log(
            `📊 Found ${results.length} synsets for 'happy' (adjective)`
          );
        }
      } else {
        console.log(`⚠️  No synsets found for 'happy' (adjective)`);
      }
    });

    it("should perform synset lookup for adverbs", async () => {
      const results = await library.synsetLookup("quickly", { pos: "r" });
      expect(Array.isArray(results)).toBe(true);
      if (results.length > 0) {
        if (debug) {
          console.log(
            `📊 Found ${results.length} synsets for 'quickly' (adverb)`
          );
        }
      } else {
        console.log(`⚠️  No synsets found for 'quickly' (adverb)`);
      }
    });

    it("should perform word lookup", async () => {
      const results = await library.wordLookup("computer");
      expect(Array.isArray(results)).toBe(true);
      if (results.length > 0) {
        if (debug) {
          console.log(`📊 Found ${results.length} word entries for 'computer'`);
        }
      } else {
        console.log(`⚠️  No word entries found for 'computer'`);
      }
    });

    // Optional sense lookup test
    if (library.senseLookup) {
      it("should perform sense lookup", async () => {
        const results = await library.senseLookup!("computer");
        expect(Array.isArray(results)).toBe(true);
        if (debug) {
          if (results.length > 0) {
            console.log(
              `📊 Found ${results.length} sense entries for 'computer'`
            );
          } else {
            console.log(`⚠️  No sense entries found for 'computer'`);
          }
        }
      });
    }

    // Edge Cases
    it("should handle non-existent words gracefully", async () => {
      const results = await library.synsetLookup("nonexistentword123", { pos: "n" });
      expect(Array.isArray(results)).toBe(true);
      expect(results.length).toBe(0);
      if (debug) {
        console.log("✅ Correctly returned empty array for non-existent word");
      }
    });

    it("should handle empty string inputs", async () => {
      const results = await library.synsetLookup("", { pos: "n" });
      expect(Array.isArray(results)).toBe(true);
      if (debug) {
        console.log("✅ Handled empty string input gracefully");
      }
    });

    it("should handle invalid POS tags", async () => {
      const results = await library.synsetLookup("computer", { pos: "x" });
      expect(Array.isArray(results)).toBe(true);
      if (debug) {
        console.log("✅ Handled invalid POS tag gracefully");
      }
    });

    // Performance
    it("should perform multiple lookups efficiently", async () => {
      const testWords = ["computer", "run", "happy", "quickly", "information"];
      const startTime = performance.now();
      const promises = testWords.map((word) => library.synsetLookup(word, { pos: "n" }));
      const results = await Promise.all(promises);
      const endTime = performance.now();
      const totalTime = endTime - startTime;
      const avgTime = totalTime / testWords.length;
      expect(results).toHaveLength(testWords.length);
      results.forEach((result) => {
        expect(Array.isArray(result)).toBe(true);
      });
      if (debug) {
        console.log(
          `⏱️  Total time for ${testWords.length} lookups: ${totalTime.toFixed(2)}ms`
        );
        console.log(`📊 Average time per lookup: ${avgTime.toFixed(2)}ms`);
      }
    });

    it("should handle bulk word lookups", async () => {
      const testWords = ["dog", "cat", "book", "read", "write"];
      const startTime = performance.now();
      const promises = testWords.map((word) => library.wordLookup(word));
      const results = await Promise.all(promises);
      const endTime = performance.now();
      const totalTime = endTime - startTime;
      expect(results).toHaveLength(testWords.length);
      if (debug) {
        console.log(
          `⏱️  Total time for ${testWords.length} word lookups: ${totalTime.toFixed(2)}ms`
        );
      }
    });

    // Data Structure Analysis
    if (!skipDataStructure) {
      it("should return consistent data structure for synsets", async () => {
        const results = await library.synsetLookup("computer", { pos: "n" });
        if (results.length > 0) {
          const firstResult = results[0];
          if (debug) {
            console.log("📋 Synset data structure:");
            console.log(JSON.stringify(firstResult, null, 2));
          }

                      // Check for common fields
            const hasId = "id" in firstResult;
            const hasPos = "pos" in firstResult;
            const hasLemma = "lemma" in firstResult;
            const hasSynsetOffset = "synsetOffset" in firstResult;
            const hasSynonyms = "synonyms" in firstResult;
            const hasGloss = "gloss" in firstResult;
            const hasMeta = "meta" in firstResult;
            const hasGlossary = "glossary" in firstResult;
            
            if (debug) {
              console.log(
                `📊 Structure analysis: id=${hasId}, pos=${hasPos}, lemma=${hasLemma}, synsetOffset=${hasSynsetOffset}, synonyms=${hasSynonyms}, gloss=${hasGloss}, meta=${hasMeta}, glossary=${hasGlossary}`
              );
            }
            // Accept any reasonable identifier field
            expect(hasId || hasPos || hasLemma || hasSynsetOffset || hasMeta || hasGlossary).toBe(true);
        }
      });

      it("should normalize results correctly", async () => {
        if (!library.normalizeSynsets) {
          if (debug) {
            console.log(
              "⚠️  No normalizeSynsets method available, skipping test"
            );
          }
          return;
        }

        const rawResults = await library.synsetLookup("computer", { pos: "n" });
        const normalizedResults = library.normalizeSynsets(rawResults);
        expect(Array.isArray(normalizedResults)).toBe(true);

        if (normalizedResults.length > 0) {
          const firstNormalized = normalizedResults[0];
          if (debug) {
            console.log("📋 Normalized synset structure:");
            console.log(JSON.stringify(firstNormalized, null, 2));
          }

          // Check that normalization produces expected fields
          expect(firstNormalized).toHaveProperty("id");
          expect(firstNormalized).toHaveProperty("pos");
          expect(firstNormalized).toHaveProperty("lemma");
        } else {
          if (debug) {
            console.log(
              `⚠️  No results to normalize - ${testName} may need data`
            );
          }
        }
      });
    }

    // Run custom tests if provided
    if (customTests) {
      it("should pass custom tests", async () => {
        await customTests(library);
      });
    }
  }
}
