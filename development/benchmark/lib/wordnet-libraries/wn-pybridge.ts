// wn-pybridge (Python bridge) WordNet library implementation
import { MultilingualWordNetLibraryBase, WordNetLibraryTester, QueryOptions } from '../WordNetLibraryBase.ts';
import { WnBridge } from 'wn-pybridge';

export class WnPybridgeLibrary extends MultilingualWordNetLibraryBase {
  name = 'wn-pybridge';

  async init(options?: { lexicon?: string }) {
    try {
      this.lib = new WnBridge();
      
      // For multilingual testing, we need to download and add multiple language datasets
      const datasets = [
        'omw-en31:1.4',  // English
        'omw-fr31:1.4',  // French  
        'omw-es31:1.4',  // Spanish
      ];
      
      for (const dataset of datasets) {
        try {
          // Check if dataset is already available
          const isDownloaded = await this.lib.download.isDownloaded(dataset);
          if (!isDownloaded) {
            console.log(`📥 Downloading ${dataset} for wn-pybridge...`);
            await this.lib.download.download(dataset, { force: true });
            console.log(`✅ ${dataset} downloaded successfully`);
          } else {
            console.log(`✅ ${dataset} already available`);
          }
        } catch (downloadError) {
          console.warn(`Failed to setup ${dataset}:`, downloadError);
        }
      }
      
      // Initialize with the English dataset as default
      await this.lib.init('omw-en31:1.4');
      console.log('✅ wn-pybridge library initialized with multilingual support');
    } catch (error) {
      console.warn('WnBridge initialization failed:', error);
      this.lib = null;
    }
  }

  async synsetLookup(word: string, options?: QueryOptions) {
    if (!this.lib) return [];
    
    // Handle multilingual queries
    if (options?.lang) {
      try {
        // For wn-pybridge, we need to initialize with the specific language
        const langBridge = new WnBridge();
        await langBridge.init(`omw-${options.lang}31:1.4`);
        return await langBridge.synsets(word, options);
      } catch (error) {
        console.warn(`wn-pybridge multilingual synset lookup error for "${word}" in ${options.lang}:`, error);
        return [];
      }
    }
    
    try {
      return await this.lib.synsets(word, options);
    } catch (error) {
      console.warn('wn-pybridge synsetLookup failed:', error);
      return [];
    }
  }

  async wordLookup(word: string, options?: QueryOptions) {
    if (!this.lib) return [];
    
    // Handle multilingual queries
    if (options?.lang) {
      try {
        // For wn-pybridge, we need to initialize with the specific language
        const langBridge = new WnBridge();
        await langBridge.init(`omw-${options.lang}31:1.4`);
        return await langBridge.words(word, options);
      } catch (error) {
        console.warn(`wn-pybridge multilingual word lookup error for "${word}" in ${options.lang}:`, error);
        return [];
      }
    }
    
    try {
      return await this.lib.words(word, options);
    } catch (error) {
      console.warn('wn-pybridge wordLookup failed:', error);
      return [];
    }
  }

  async senseLookup(word: string, options?: QueryOptions) {
    if (!this.lib) return [];
    
    // Handle multilingual queries
    if (options?.lang) {
      try {
        // For wn-pybridge, we need to initialize with the specific language
        const langBridge = new WnBridge();
        await langBridge.init(`omw-${options.lang}31:1.4`);
        return await langBridge.senses(word, options);
      } catch (error) {
        console.warn(`wn-pybridge multilingual sense lookup error for "${word}" in ${options.lang}:`, error);
        return [];
      }
    }
    
    try {
      return await this.lib.senses(word, options);
    } catch (error) {
      console.warn('wn-pybridge senseLookup failed:', error);
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
  
  describe("WnPybridge Library", () => {
    WordNetLibraryTester.runTests(import.meta.vitest, WnPybridgeLibrary, {
      testName: "WnPybridge Library",
      expectedResults: true,
      skipDataStructure: false,
      customTests: async (library) => {
        // Add any wn-pybridge-specific tests here if needed
        console.log("✅ WnPybridge library custom tests completed");
      }
    });
  });
} 
