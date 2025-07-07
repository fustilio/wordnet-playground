// wn-ts WordNet library implementation
import { WordNetLibraryBase, WordNetLibraryTester, QueryOptions } from '../WordNetLibraryBase.ts';
// Import from the main wn-ts package - no more deep imports needed
import { Wordnet as TSWordnet, db, download, add } from 'wn-ts';

export class WnTsLibrary extends WordNetLibraryBase {
  name = 'wn-ts';

  async init() {
    await db.initialize();
    // Get all available lexicons
    const tempWn = new TSWordnet('*');
    const lexicons = await tempWn.lexicons();
    let omwLex = lexicons.find(l => l.id === 'omw-en31' && l.version === '1.4');
    if (!omwLex) {
      console.log('📥 Downloading omw-en31:1.4 (Princeton WordNet 3.1) for wn-ts...');
      const downloadedPath = await download('omw-en31:1.4');
      console.log(`✅ Downloaded omw-en31:1.4 to: ${downloadedPath}`);
      try {
        await add(downloadedPath, { force: true });
        console.log('✅ omw-en31:1.4 added to wn-ts database');
      } catch (addError) {
        if (addError && (addError as Error).message && (addError as Error).message.includes('already exists')) {
          console.log('ℹ️ omw-en31:1.4 already exists in database, continuing...');
        } else {
          throw addError;
        }
      }
      // Refresh lexicons after adding
      const refreshedWn = new TSWordnet('*');
      const refreshedLexicons = await refreshedWn.lexicons();
      omwLex = refreshedLexicons.find(l => l.id === 'omw-en31' && l.version === '1.4');
      if (!omwLex) {
        throw new Error('Failed to add omw-en31:1.4 to wn-ts database.');
      }
    } else {
      console.log('✅ omw-en31:1.4 already available in wn-ts database');
    }
    // Use the correct lexicon
    this.lib = new TSWordnet('omw-en31:1.4');
    console.log('✅ wn-ts library initialized with omw-en31:1.4');
  }

  async synsetLookup(word: string, options?: QueryOptions) {
    if (!this.lib) return [];
    
    // Handle POS parameter mapping
    let pos = options?.pos;
    if (pos === 'noun') pos = 'n';
    if (pos === 'verb') pos = 'v';
    if (pos === 'adjective') pos = 'a';
    if (pos === 'adverb') pos = 'r';
    
    try {
      const result = await this.lib.synsets(word, pos);
      return result;
    } catch (error) {
      console.error(`wn-ts synset lookup error for "${word}":`, error);
      return [];
    }
  }

  async wordLookup(word: string, options?: QueryOptions) {
    if (!this.lib) return [];
    
    // Handle POS parameter mapping
    let pos = options?.pos;
    if (pos === 'noun') pos = 'n';
    if (pos === 'verb') pos = 'v';
    if (pos === 'adjective') pos = 'a';
    if (pos === 'adverb') pos = 'r';
    
    try {
      const result = await this.lib.words(word, pos);
      return result;
    } catch (error) {
      console.error(`wn-ts word lookup error for "${word}":`, error);
      return [];
    }
  }

  async senseLookup(word: string, options?: QueryOptions) {
    if (!this.lib) return [];
    
    // Handle POS parameter mapping
    let pos = options?.pos;
    if (pos === 'noun') pos = 'n';
    if (pos === 'verb') pos = 'v';
    if (pos === 'adjective') pos = 'a';
    if (pos === 'adverb') pos = 'r';
    
    try {
      const result = await this.lib.senses(word, pos);
      return result;
    } catch (error) {
      console.error(`wn-ts sense lookup error for "${word}":`, error);
      return [];
    }
  }

  normalizeSynsets(output: any): any[] {
    if (!Array.isArray(output)) return [];
    return output.map((s: any) => ({
      id: s.id,
      pos: s.pos,
      lemma: s.lemma ?? (s.members ? s.members[0]?.lemma : undefined),
      // Add more fields as needed for comparison
    }));
  }
}

// Run tests using the reusable framework
if (import.meta.vitest) {
  const { describe } = import.meta.vitest;
  
  describe("WnTs Library", () => {
    WordNetLibraryTester.runTests(import.meta.vitest, WnTsLibrary, {
      testName: "WnTs Library",
      expectedResults: true,
      skipDataStructure: false,
      customTests: async (library) => {
        // Add any wn-ts-specific tests here if needed
        console.log("✅ WnTs library custom tests completed");
      }
    });
  });
} 
