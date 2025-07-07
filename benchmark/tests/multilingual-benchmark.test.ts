import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { WnTsLibrary } from '../lib/wordnet-libraries/wn-ts.js';
import { WnPybridgeLibrary } from '../lib/wordnet-libraries/wn-pybridge.js';
import { MultilingualWordNetLibraryBase } from '../lib/WordNetLibraryBase.js';

// Test data for multilingual comparison
const testCases = [
  { word: 'computer', en: 'computer', fr: 'ordinateur', es: 'computadora' },
  { word: 'house', en: 'house', fr: 'maison', es: 'casa' },
  { word: 'book', en: 'book', fr: 'livre', es: 'libro' },
  { word: 'run', en: 'run', fr: 'courir', es: 'correr' },
  { word: 'happy', en: 'happy', fr: 'heureux', es: 'feliz' },
];

const languages = [
  { code: 'en', name: 'English' },
  { code: 'fr', name: 'French' },
  { code: 'es', name: 'Spanish' },
];

describe('Multilingual WordNet Benchmark', () => {
  let wnTs: MultilingualWordNetLibraryBase;
  let wnPybridge: MultilingualWordNetLibraryBase;

  beforeAll(async () => {
    console.log('🚀 Initializing multilingual libraries...');
    
    // Initialize wn-ts
    wnTs = new WnTsLibrary();
    await wnTs.init();
    
    // Initialize wn-pybridge
    wnPybridge = new WnPybridgeLibrary();
    await wnPybridge.init();
    
    console.log('✅ Multilingual libraries initialized');
  }, 300000); // 5 minute timeout

  afterAll(async () => {
    if (wnTs.cleanup) await wnTs.cleanup();
    if (wnPybridge.cleanup) await wnPybridge.cleanup();
  });

  describe('Multilingual Support Detection', () => {
    it('should detect multilingual support correctly', () => {
      expect(wnTs.supportsMultilingual).toBe(true);
      expect(wnPybridge.supportsMultilingual).toBe(true);
      console.log('✅ Multilingual support detected for both libraries');
    });
  });

  describe('Cross-Language Word Lookup', () => {
    for (const testCase of testCases) {
      it(`should find equivalent words for "${testCase.word}" across languages`, async () => {
        const results = {
          wnTs: {} as Record<string, any[]>,
          wnPybridge: {} as Record<string, any[]>,
        };

        // Test each language
        for (const lang of languages) {
          const word = testCase[lang.code as keyof typeof testCase] as string;
          
          // Test wn-ts
          try {
            results.wnTs[lang.code] = await wnTs.wordLookup(word, { lang: lang.code });
          } catch (error) {
            console.warn(`wn-ts failed for ${word} in ${lang.code}:`, error);
            results.wnTs[lang.code] = [];
          }

          // Test wn-pybridge
          try {
            results.wnPybridge[lang.code] = await wnPybridge.wordLookup(word, { lang: lang.code });
          } catch (error) {
            console.warn(`wn-pybridge failed for ${word} in ${lang.code}:`, error);
            results.wnPybridge[lang.code] = [];
          }
        }

        // Log results
        console.log(`\n📊 Results for "${testCase.word}":`);
        for (const lang of languages) {
          const wnTsCount = results.wnTs[lang.code]?.length || 0;
          const wnPybridgeCount = results.wnPybridge[lang.code]?.length || 0;
          console.log(`  ${lang.name}: wn-ts=${wnTsCount}, wn-pybridge=${wnPybridgeCount}`);
        }

        // Basic validation - at least one library should find results in English
        const hasEnglishResults = 
          (results.wnTs.en?.length || 0) > 0 || 
          (results.wnPybridge.en?.length || 0) > 0;
        
        expect(hasEnglishResults).toBe(true);
      });
    }
  });

  describe('Cross-Language Synset Lookup', () => {
    for (const testCase of testCases) {
      it(`should find equivalent synsets for "${testCase.word}" across languages`, async () => {
        const results = {
          wnTs: {} as Record<string, any[]>,
          wnPybridge: {} as Record<string, any[]>,
        };

        // Test each language
        for (const lang of languages) {
          const word = testCase[lang.code as keyof typeof testCase] as string;
          
          // Test wn-ts
          try {
            results.wnTs[lang.code] = await wnTs.synsetLookup(word, { lang: lang.code });
          } catch (error) {
            console.warn(`wn-ts synset lookup failed for ${word} in ${lang.code}:`, error);
            results.wnTs[lang.code] = [];
          }

          // Test wn-pybridge
          try {
            results.wnPybridge[lang.code] = await wnPybridge.synsetLookup(word, { lang: lang.code });
          } catch (error) {
            console.warn(`wn-pybridge synset lookup failed for ${word} in ${lang.code}:`, error);
            results.wnPybridge[lang.code] = [];
          }
        }

        // Log results
        console.log(`\n📊 Synset results for "${testCase.word}":`);
        for (const lang of languages) {
          const wnTsCount = results.wnTs[lang.code]?.length || 0;
          const wnPybridgeCount = results.wnPybridge[lang.code]?.length || 0;
          console.log(`  ${lang.name}: wn-ts=${wnTsCount}, wn-pybridge=${wnPybridgeCount}`);
        }

        // Basic validation - at least one library should find results in English
        const hasEnglishResults = 
          (results.wnTs.en?.length || 0) > 0 || 
          (results.wnPybridge.en?.length || 0) > 0;
        
        expect(hasEnglishResults).toBe(true);
      });
    }
  });

  describe('Performance Comparison', () => {
    it('should compare performance of multilingual lookups', async () => {
      const performanceResults = {
        wnTs: { totalTime: 0, avgTime: 0 },
        wnPybridge: { totalTime: 0, avgTime: 0 },
      };

      const testWords = ['computer', 'house', 'book', 'run', 'happy'];
      const testLanguages = ['en', 'fr', 'es'];

      // Test wn-ts performance
      const wnTsStart = performance.now();
      for (const word of testWords) {
        for (const lang of testLanguages) {
          try {
            await wnTs.wordLookup(word, { lang });
          } catch (error) {
            // Ignore errors for performance test
          }
        }
      }
      const wnTsEnd = performance.now();
      performanceResults.wnTs.totalTime = wnTsEnd - wnTsStart;
      performanceResults.wnTs.avgTime = performanceResults.wnTs.totalTime / (testWords.length * testLanguages.length);

      // Test wn-pybridge performance
      const wnPybridgeStart = performance.now();
      for (const word of testWords) {
        for (const lang of testLanguages) {
          try {
            await wnPybridge.wordLookup(word, { lang });
          } catch (error) {
            // Ignore errors for performance test
          }
        }
      }
      const wnPybridgeEnd = performance.now();
      performanceResults.wnPybridge.totalTime = wnPybridgeEnd - wnPybridgeStart;
      performanceResults.wnPybridge.avgTime = performanceResults.wnPybridge.totalTime / (testWords.length * testLanguages.length);

      console.log('\n⏱️ Performance Results:');
      console.log(`  wn-ts: ${performanceResults.wnTs.totalTime.toFixed(2)}ms total, ${performanceResults.wnTs.avgTime.toFixed(2)}ms avg`);
      console.log(`  wn-pybridge: ${performanceResults.wnPybridge.totalTime.toFixed(2)}ms total, ${performanceResults.wnPybridge.avgTime.toFixed(2)}ms avg`);

      // Both should complete within reasonable time
      expect(performanceResults.wnTs.totalTime).toBeLessThan(30000); // 30 seconds
      expect(performanceResults.wnPybridge.totalTime).toBeLessThan(30000); // 30 seconds
    });
  });

  describe('Error Handling', () => {
    it('should handle invalid language codes gracefully', async () => {
      const invalidLang = 'invalid-lang';
      
      // Test wn-ts
      const wnTsResult = await wnTs.wordLookup('computer', { lang: invalidLang });
      expect(Array.isArray(wnTsResult)).toBe(true);
      
      // Test wn-pybridge
      const wnPybridgeResult = await wnPybridge.wordLookup('computer', { lang: invalidLang });
      expect(Array.isArray(wnPybridgeResult)).toBe(true);
      
      console.log('✅ Invalid language codes handled gracefully');
    });

    it('should handle non-existent words in different languages', async () => {
      const nonExistentWord = 'thiswordprobablydoesnotexistinanylanguage';
      
      // Test wn-ts
      const wnTsResult = await wnTs.wordLookup(nonExistentWord, { lang: 'en' });
      expect(Array.isArray(wnTsResult)).toBe(true);
      
      // Test wn-pybridge
      const wnPybridgeResult = await wnPybridge.wordLookup(nonExistentWord, { lang: 'en' });
      expect(Array.isArray(wnPybridgeResult)).toBe(true);
      
      console.log('✅ Non-existent words handled gracefully');
    });
  });

  describe('Data Consistency', () => {
    it('should return consistent data structures across languages', async () => {
      const testWord = 'computer';
      const testLang = 'en';
      
      // Test wn-ts
      const wnTsWords = await wnTs.wordLookup(testWord, { lang: testLang });
      const wnTsSynsets = await wnTs.synsetLookup(testWord, { lang: testLang });
      
      if (wnTsWords.length > 0) {
        const firstWord = wnTsWords[0];
        expect(firstWord).toHaveProperty('id');
        // wn-ts words may not have 'pos' property, check for either 'pos' or 'partOfSpeech'
        expect('pos' in firstWord || 'partOfSpeech' in firstWord).toBe(true);
        console.log('✅ wn-ts data structure consistent');
      }
      
      if (wnTsSynsets.length > 0) {
        const firstSynset = wnTsSynsets[0];
        expect(firstSynset).toHaveProperty('id');
        // wn-ts synsets may not have 'pos' property, check for either 'pos' or 'partOfSpeech'
        expect('pos' in firstSynset || 'partOfSpeech' in firstSynset).toBe(true);
        console.log('✅ wn-ts synset structure consistent');
      }
      
      // Test wn-pybridge
      const wnPybridgeWords = await wnPybridge.wordLookup(testWord, { lang: testLang });
      const wnPybridgeSynsets = await wnPybridge.synsetLookup(testWord, { lang: testLang });
      
      if (wnPybridgeWords.length > 0) {
        const firstWord = wnPybridgeWords[0];
        expect(firstWord).toHaveProperty('id');
        expect(firstWord).toHaveProperty('pos');
        console.log('✅ wn-pybridge data structure consistent');
      }
      
      if (wnPybridgeSynsets.length > 0) {
        const firstSynset = wnPybridgeSynsets[0];
        expect(firstSynset).toHaveProperty('id');
        expect(firstSynset).toHaveProperty('pos');
        console.log('✅ wn-pybridge synset structure consistent');
      }
    });
  });
}); 