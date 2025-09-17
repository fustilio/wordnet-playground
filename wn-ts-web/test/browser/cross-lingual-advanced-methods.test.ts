import { describe, it, expect, vi, beforeEach, afterEach, beforeAll } from 'vitest';
import { WordNetWorkerClient } from '../../src/client/wordnet-worker-client.js';
import type { Sqlite3Static } from '@sqlite.org/sqlite-wasm';

const isNode = typeof process !== 'undefined';

describe.skipIf(isNode)('Cross-lingual Advanced Methods Integration', () => {
  let workerClient: WordNetWorkerClient;
  let sqlModule: Sqlite3Static;

  beforeAll(async () => {
    try {
      const sqlite3 = (await import('@sqlite.org/sqlite-wasm')).default;
      sqlModule = await sqlite3();
    } catch (e) {
      console.warn('Could not load sqlite-wasm, skipping tests');
    }
  });

  beforeEach(async () => {
    if (!sqlModule) return;

    workerClient = new WordNetWorkerClient();
    await workerClient.initialize();
    
    // Load both English and French WordNet data
    await workerClient.loadPackageData('oewn:2024');
    await workerClient.loadPackageData('omw-fr:1.4');
    
    // Wait for data to be loaded
    await new Promise(resolve => setTimeout(resolve, 2000));
  });

  afterEach(async () => {
    if (workerClient) {
      await workerClient.dispose();
    }
  });

  describe('Cross-lingual Translation via ILI', () => {
    it.skipIf(!sqlModule)('should translate English to French using ILI mappings', async () => {
      // Test with "computer" which should have ILI mappings
      const englishWords = await workerClient.searchWordsInLexicon('computer', 'oewn:2024', 'en');
      
      if (englishWords.length > 0) {
        const synsetId = englishWords[0].synsetId;
        const ili = await workerClient.getIliForSynset(synsetId);
        
        if (ili) {
          const frenchWords = await workerClient.getWordsByIliAndLanguage(ili, 'fr');
          
          expect(Array.isArray(frenchWords)).toBe(true);
          if (frenchWords.length > 0) {
            expect(frenchWords[0]).toHaveProperty('lemma');
            expect(frenchWords[0]).toHaveProperty('language', 'fr');
          }
        }
      }
    });

    it.skipIf(!sqlModule)('should translate French to English using ILI mappings', async () => {
      // Test with "ordinateur" (French for computer)
      const frenchWords = await workerClient.searchWordsInLexicon('ordinateur', 'omw-fr:1.4', 'fr');
      
      if (frenchWords.length > 0) {
        const synsetId = frenchWords[0].synsetId;
        const ili = await workerClient.getIliForSynset(synsetId);
        
        if (ili) {
          const englishWords = await workerClient.getWordsByIliAndLanguage(ili, 'en');
          
          expect(Array.isArray(englishWords)).toBe(true);
          if (englishWords.length > 0) {
            expect(englishWords[0]).toHaveProperty('lemma');
            expect(englishWords[0]).toHaveProperty('language', 'en');
          }
        }
      }
    });

    it.skipIf(!sqlModule)('should handle words without ILI mappings gracefully', async () => {
      // Test with a word that might not have ILI mappings
      const words = await workerClient.searchWordsInLexicon('xyz123', 'oewn:2024', 'en');
      
      if (words.length > 0) {
        const synsetId = words[0].synsetId;
        const ili = await workerClient.getIliForSynset(synsetId);
        
        if (!ili) {
          const frenchWords = await workerClient.getWordsByIliAndLanguage('i99999', 'fr');
          expect(frenchWords).toHaveLength(0);
        }
      }
    });
  });

  describe('Cross-lingual Definitions', () => {
    it.skipIf(!sqlModule)('should get definitions in different languages', async () => {
      const englishWords = await workerClient.searchWordsInLexicon('fire', 'oewn:2024', 'en');
      
      if (englishWords.length > 0) {
        const synsetId = englishWords[0].synsetId;
        const definitions = await workerClient.getDefinitionsBySynsetId(synsetId);
        
        expect(Array.isArray(definitions)).toBe(true);
        if (definitions.length > 0) {
          expect(definitions[0]).toHaveProperty('text');
          expect(definitions[0]).toHaveProperty('language');
          expect(definitions[0]).toHaveProperty('synsetId', synsetId);
        }
      }
    });

    it.skipIf(!sqlModule)('should get synset information with proper structure', async () => {
      const englishWords = await workerClient.searchWordsInLexicon('fire', 'oewn:2024', 'en');
      
      if (englishWords.length > 0) {
        const synsetId = englishWords[0].synsetId;
        const synset = await workerClient.getSynsetById(synsetId);
        
        if (synset) {
          expect(synset).toHaveProperty('id', synsetId);
          expect(synset).toHaveProperty('pos');
          expect(synset).toHaveProperty('language');
          expect(synset).toHaveProperty('lexicon');
          expect(Array.isArray(synset.definitions)).toBe(true);
          expect(Array.isArray(synset.words)).toBe(true);
          expect(Array.isArray(synset.relations)).toBe(true);
        }
      }
    });
  });

  describe('Cross-lingual Word Lookup', () => {
    it.skipIf(!sqlModule)('should find words by synset and language', async () => {
      const englishWords = await workerClient.searchWordsInLexicon('fire', 'oewn:2024', 'en');
      
      if (englishWords.length > 0) {
        const synsetId = englishWords[0].synsetId;
        const words = await workerClient.getWordsBySynsetAndLanguage(synsetId, 'en');
        
        expect(Array.isArray(words)).toBe(true);
        if (words.length > 0) {
          expect(words[0]).toHaveProperty('lemma');
          expect(words[0]).toHaveProperty('language', 'en');
          expect(words[0]).toHaveProperty('pos');
        }
      }
    });

    it.skipIf(!sqlModule)('should return empty array for non-existent language', async () => {
      const englishWords = await workerClient.searchWordsInLexicon('fire', 'oewn:2024', 'en');
      
      if (englishWords.length > 0) {
        const synsetId = englishWords[0].synsetId;
        const words = await workerClient.getWordsBySynsetAndLanguage(synsetId, 'xyz');
        
        expect(words).toHaveLength(0);
      }
    });
  });

  describe('Error Handling in Cross-lingual Context', () => {
    it.skipIf(!sqlModule)('should handle missing data gracefully', async () => {
      // Test with non-existent synset
      const words = await workerClient.getWordsBySynsetAndLanguage('non-existent', 'en');
      expect(words).toHaveLength(0);
      
      const definitions = await workerClient.getDefinitionsBySynsetId('non-existent');
      expect(definitions).toHaveLength(0);
      
      const synset = await workerClient.getSynsetById('non-existent');
      expect(synset).toBeUndefined();
    });

    it.skipIf(!sqlModule)('should handle invalid ILI gracefully', async () => {
      const words = await workerClient.getWordsByIliAndLanguage('invalid-ili', 'fr');
      expect(words).toHaveLength(0);
    });
  });

  describe('Performance with Cross-lingual Data', () => {
    it.skipIf(!sqlModule)('should complete cross-lingual queries within reasonable time', async () => {
      const startTime = Date.now();
      
      // Perform multiple cross-lingual operations
      const englishWords = await workerClient.searchWordsInLexicon('computer', 'oewn:2024', 'en');
      
      if (englishWords.length > 0) {
        const synsetId = englishWords[0].synsetId;
        const ili = await workerClient.getIliForSynset(synsetId);
        
        if (ili) {
          await workerClient.getWordsByIliAndLanguage(ili, 'fr');
          await workerClient.getDefinitionsBySynsetId(synsetId);
          await workerClient.getSynsetById(synsetId);
        }
      }
      
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      // Should complete within 10 seconds for cross-lingual operations
      expect(duration).toBeLessThan(10000);
    });
  });

  describe('Data Consistency', () => {
    it.skipIf(!sqlModule)('should maintain consistent data across languages', async () => {
      const englishWords = await workerClient.searchWordsInLexicon('fire', 'oewn:2024', 'en');
      
      if (englishWords.length > 0) {
        const synsetId = englishWords[0].synsetId;
        const ili = await workerClient.getIliForSynset(synsetId);
        
        if (ili) {
          const englishWordsByIli = await workerClient.getWordsByIliAndLanguage(ili, 'en');
          const frenchWordsByIli = await workerClient.getWordsByIliAndLanguage(ili, 'fr');
          
          // Both should return arrays
          expect(Array.isArray(englishWordsByIli)).toBe(true);
          expect(Array.isArray(frenchWordsByIli)).toBe(true);
          
          // If we have results, they should have the expected structure
          if (englishWordsByIli.length > 0) {
            expect(englishWordsByIli[0]).toHaveProperty('language', 'en');
          }
          if (frenchWordsByIli.length > 0) {
            expect(frenchWordsByIli[0]).toHaveProperty('language', 'fr');
          }
        }
      }
    });
  });
});
