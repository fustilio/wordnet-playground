// node-wordnet (morungos) WordNet library implementation
import { WordNetLibraryBase, WordNetLibraryTester, QueryOptions } from '../WordNetLibraryBase.ts';
// @ts-ignore - node-wordnet doesn't have TypeScript definitions
import NodeWordNet from 'node-wordnet';


export class NodeWordNetLibrary extends WordNetLibraryBase {
  name = 'node-wordnet';

  async init(options?: { lexicon?: string }) {
    try {
      this.lib = new NodeWordNet();
      await this.lib.open();
      console.log("✅ NodeWordNet library initialized successfully");
    } catch (error) {
      console.warn('NodeWordNet initialization failed:', error);
      this.lib = null;
    }
  }

  async synsetLookup(word: string, options?: QueryOptions) {
    if (!this.lib) return [];
    
    // node-wordnet only supports these POS tags. It will crash on invalid ones.
    const validPos = ['n', 'v', 'a', 'r'];
    if (options?.pos && !validPos.includes(options.pos)) {
      return []; // Return empty for invalid POS to prevent crash.
    }

    try {
      // node-wordnet uses format "word#pos" for lookup
      const lookupKey = `${word}#${options?.pos}`;
      const results = await this.lib.lookup(lookupKey);
      return Array.isArray(results) ? results : [];
    } catch (error) {
      console.warn(`NodeWordNet synsetLookup failed for "${word}#${options?.pos}":`, error);
      return [];
    }
  }

  async wordLookup(word: string, options?: QueryOptions) {
    if (!this.lib) return [];
    
    try {
      // For word lookup, we'll try all POS tags
      const allPos = ['n', 'v', 'a', 'r'];
      const allResults = [];
      
      for (const pos of allPos) {
        try {
          const lookupKey = `${word}#${pos}`;
          const results = await this.lib.lookup(lookupKey);
          if (Array.isArray(results)) {
            allResults.push(...results);
          }
        } catch (error) {
          // Ignore individual POS failures
        }
      }
      
      return allResults;
    } catch (error) {
      console.warn(`NodeWordNet wordLookup failed for "${word}":`, error);
      return [];
    }
  }

  async cleanup() {
    if (this.lib) {
      try {
        await this.lib.close();
      } catch (error) {
        console.warn('NodeWordNet cleanup failed:', error);
      }
    }
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
  
  describe("NodeWordNet Library", () => {
    WordNetLibraryTester.runTests(import.meta.vitest, NodeWordNetLibrary, {
      testName: "NodeWordNet Library",
      expectedResults: true,
      skipDataStructure: false,
      customTests: async (library) => {
        // Add any node-wordnet-specific tests here if needed
        console.log("✅ NodeWordNet library custom tests completed");
      }
    });
  });
} 
