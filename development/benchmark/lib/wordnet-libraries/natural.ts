// natural WordNet library implementation
import {
  WordNetLibraryBase,
  WordNetLibraryTester,
  QueryOptions,
} from "../WordNetLibraryBase.ts";
// @ts-ignore - natural doesn't have TypeScript definitions
import natural from "natural";

export class NaturalLibrary extends WordNetLibraryBase {
  name = "natural";

  async init(options?: { lexicon?: string }) {
    // @ts-ignore
    this.lib = new natural.WordNet();
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
  describe("Natural Library", () => {
    WordNetLibraryTester.runTests(import.meta.vitest, NaturalLibrary, {
      testName: "Natural Library",
      expectedResults: true,
      skipDataStructure: false,
      customTests: async (library) => {
        // Add any natural-specific tests here if needed
        console.log("✅ Natural library custom tests completed");
      },
    });
  });
}
