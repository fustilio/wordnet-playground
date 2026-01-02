// wordpos WordNet library implementation
import {
  WordNetLibraryBase,
  WordNetLibraryTester,
  QueryOptions,
} from "../WordNetLibraryBase.ts";
// @ts-ignore - wordpos doesn't have TypeScript definitions
import WordPOS from "wordpos";

export class WordposLibrary extends WordNetLibraryBase {
  name = "wordpos";

  async init(options?: { lexicon?: string }) {
    // Try to use wndb-with-exceptions, but fall back to default if it fails
    try {
      const wndb = require('wndb-with-exceptions');
      this.lib = new WordPOS({ dictPath: wndb.path });
    } catch (error) {
      // Fall back to default wordpos initialization
      console.warn('Failed to use wndb-with-exceptions, using default wordpos:', error);
      this.lib = new WordPOS();
    }
  }

  async synsetLookup(word: string, options?: QueryOptions) {
    return new Promise<any[]>((resolve) => {
      this.lib.lookup(word, (results: any) => resolve(results));
    });
  }

  async wordLookup(word: string, options?: QueryOptions) {
    return new Promise<any[]>((resolve) => {
      this.lib.lookup(word, (results: any) => resolve(results));
    });
  }

  normalizeSynsets(output: any): any[] {
    if (!Array.isArray(output)) return [];
    return output.map((s: any) => ({
      id: s.synsetOffset,
      pos: s.pos,
      lemma: s.lemma,
      synonyms: s.synonyms,
      gloss: s.gloss,
    }));
  }
}

// Run tests using the reusable framework
if (import.meta.vitest) {
  const { describe } = import.meta.vitest;
  describe("Wordpos Library", () => {
    WordNetLibraryTester.runTests(import.meta.vitest, WordposLibrary, {
      testName: "Wordpos Library",
      expectedResults: true,
      skipDataStructure: false,
      customTests: async (library) => {
        // Add any wordpos-specific tests here if needed
        console.log("✅ Wordpos library custom tests completed");
      },
    });
  });
}
