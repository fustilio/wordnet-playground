// wn-ts WordNet library implementation
import { MultilingualWordNetLibraryBase, WordNetLibraryTester, QueryOptions } from '../WordNetLibraryBase.ts';
// Import from the main wn-ts package - no more deep imports needed
import { Wordnet as TSWordnet, download, add } from 'wn-ts';

export class WnTsLibrary extends MultilingualWordNetLibraryBase {
  name = 'wn-ts';

  async init(options?: { lexicon?: string }) {
    // Initialize by creating a Wordnet instance - this will handle database initialization
    const tempWn = new TSWordnet('*');
    
    // For multilingual testing, we need to download and add multiple language datasets
    const datasets = [
      'omw-en31:1.4',  // English
      'omw-fr31:1.4',  // French  
      'omw-es31:1.4',  // Spanish
    ];
    
    for (const dataset of datasets) {
      try {
        // Check if dataset is already available
        const tempWn = new TSWordnet('*');
        const lexicons = await tempWn.lexicons();
        let lex = lexicons.find(l => l.id === dataset.split(':')[0] && l.version === dataset.split(':')[1]);
        
        if (!lex) {
          console.log(`📥 Downloading ${dataset} for wn-ts...`);
          const downloadedPath = await download(dataset);
          console.log(`✅ Downloaded ${dataset} to: ${downloadedPath}`);
          try {
            await add(downloadedPath, { force: true });
            console.log(`✅ ${dataset} added to wn-ts database`);
          } catch (addError) {
            if (addError && (addError as Error).message && (addError as Error).message.includes('already exists')) {
              console.log(`ℹ️ ${dataset} already exists in database, continuing...`);
            } else {
              throw addError;
            }
          }
        } else {
          console.log(`✅ ${dataset} already available in wn-ts database`);
        }
      } catch (error) {
        console.warn(`Failed to setup ${dataset}:`, error);
      }
    }
    
    // Use the English dataset as default
    this.lib = new TSWordnet('omw-en31:1.4');
    console.log('✅ wn-ts library initialized with multilingual support');
  }

  async synsetLookup(word: string, options?: QueryOptions) {
    if (!this.lib) return [];
    
    // Handle multilingual queries
    if (options?.lang) {
      try {
        const langWordnet = new TSWordnet(`omw-${options.lang}31:1.4`);
        const result = await langWordnet.synsets(word, options?.pos as any);
        return result;
      } catch (error) {
        console.warn(`wn-ts multilingual synset lookup error for "${word}" in ${options.lang}:`, error);
        return [];
      }
    }
    
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
    
    // Handle multilingual queries
    if (options?.lang) {
      try {
        const langWordnet = new TSWordnet(`omw-${options.lang}31:1.4`);
        const result = await langWordnet.words(word, options?.pos as any);
        return result;
      } catch (error) {
        console.warn(`wn-ts multilingual word lookup error for "${word}" in ${options.lang}:`, error);
        return [];
      }
    }
    
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
    
    // Handle multilingual queries
    if (options?.lang) {
      try {
        const langWordnet = new TSWordnet(`omw-${options.lang}31:1.4`);
        const result = await langWordnet.senses(word, options?.pos as any);
        return result;
      } catch (error) {
        console.warn(`wn-ts multilingual sense lookup error for "${word}" in ${options.lang}:`, error);
        return [];
      }
    }
    
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
      pos: s.pos ?? s.partOfSpeech,
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
