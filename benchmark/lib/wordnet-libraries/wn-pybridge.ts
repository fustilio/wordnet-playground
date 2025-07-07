// wn-pybridge (Python bridge) WordNet library implementation
import { WordNetLibraryBase, WordNetLibraryTester, QueryOptions } from '../WordNetLibraryBase.ts';
import { WnBridge } from 'wn-pybridge';

export class WnPybridgeLibrary extends WordNetLibraryBase {
  name = 'wn-pybridge';

  async init(options?: { lexicon?: string }) {
    try {
      this.lib = new WnBridge();
      
      // Download and add Princeton WordNet 3.1 dataset to match wn-ts and natural libraries
      try {
        // Check if omw-en31:1.4 is already available
        const isDownloaded = await this.lib.download.isDownloaded('omw-en31:1.4');
        if (!isDownloaded) {
          console.log('📥 Downloading omw-en31:1.4 (Princeton WordNet 3.1) for wn-pybridge...');
          await this.lib.download.download('omw-en31:1.4', { force: true });
          console.log('✅ omw-en31:1.4 downloaded successfully');
        } else {
          console.log('✅ omw-en31:1.4 already available');
        }
        
        // Initialize with the Princeton WordNet 3.1 dataset
        await this.lib.init('omw-en31:1.4');
        console.log('✅ wn-pybridge library initialized with omw-en31:1.4');
      } catch (downloadError) {
        console.warn('Failed to download omw-en31:1.4, falling back to default:', downloadError);
        // Fall back to default initialization
        await this.lib.init();
        console.log('✅ wn-pybridge library initialized with default dataset');
      }
    } catch (error) {
      console.warn('WnBridge initialization failed:', error);
      this.lib = null;
    }
  }

  async synsetLookup(word: string, options?: QueryOptions) {
    if (!this.lib) return [];
    try {
      return await this.lib.synsets(word, options);
    } catch (error) {
      console.warn('wn-pybridge synsetLookup failed:', error);
      return [];
    }
  }

  async wordLookup(word: string, options?: QueryOptions) {
    if (!this.lib) return [];
    try {
      return await this.lib.words(word, options);
    } catch (error) {
      console.warn('wn-pybridge wordLookup failed:', error);
      return [];
    }
  }

  async senseLookup(word: string, options?: QueryOptions) {
    if (!this.lib) return [];
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
      pos: s.pos,
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
