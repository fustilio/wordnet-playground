// WordsWordNet (@words/wordnet) library implementation
import {
  WordNetLibraryBase,
  WordNetLibraryTester,
  QueryOptions,
} from "../WordNetLibraryBase.ts";
// @ts-ignore - wordnet doesn't have TypeScript definitions
import WordsWordNet from "wordnet";

export class WordsWordNetLibrary extends WordNetLibraryBase {
  name = "WordsWordNet";

  async init(options?: { lexicon?: string }) {
    try {
      await WordsWordNet.init();
      this.lib = WordsWordNet;
      console.log("✅ WordsWordNet library initialized successfully");
    } catch (error) {
      console.warn("WordsWordNet initialization failed:", error);
      this.lib = null;
    }
  }

  async synsetLookup(word: string, options?: QueryOptions) {
    if (!this.lib) return [];

    try {
      // Handle empty or invalid inputs
      if (!word || word.trim() === "") {
        return [];
      }

      const results = await this.lib.lookup(word);
      return Array.isArray(results) ? results : [];
    } catch (error) {
      // WordsWordNet throws errors for non-existent words, which is expected.
      // We catch and return an empty array, suppressing the console warning.
      return [];
    }
  }

  async wordLookup(word: string, options?: QueryOptions) {
    if (!this.lib) return [];

    try {
      // Handle empty or invalid inputs
      if (!word || word.trim() === "") {
        return [];
      }

      const results = await this.lib.lookup(word);
      return Array.isArray(results) ? results : [];
    } catch (error) {
      // WordsWordNet throws errors for non-existent words, which is expected.
      // We catch and return an empty array, suppressing the console warning.
      return [];
    }
  }

  normalizeSynsets(output: any): any[] {
    if (!Array.isArray(output)) return [];
    return output.map((s: any) => ({
      id: s.meta?.id,
      pos: s.meta?.pos,
      lemma: s.meta?.words?.[0],
      synonyms: s.meta?.words,
      glossary: s.glossary,
    }));
  }
}

// Run tests using the reusable framework
if (import.meta.vitest) {
  const { describe } = import.meta.vitest;

  describe("WordsWordNet Library", () => {
    WordNetLibraryTester.runTests(import.meta.vitest, WordsWordNetLibrary, {
      testName: "WordsWordNet Library",
      expectedResults: true,
      skipDataStructure: false,
      customTests: async (library) => {
        // Add any words-wordnet-specific tests here if needed
        console.log("✅ WordsWordNet library custom tests completed");
      },
    });
  });
}
