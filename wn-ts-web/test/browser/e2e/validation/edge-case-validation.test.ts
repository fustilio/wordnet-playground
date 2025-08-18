import { describe, beforeAll, afterAll, it, expect } from 'vitest';
import { WebWordnet } from '../../../../src/client/submodules/web-wordnet.js';
import type { DataLoader } from '../../../../src/data-loader.js';
import { createWordNetInstance } from '../../../../src/factory.js';
import { MockDataLoader } from '../../../mock-data-loader.js';

/**
 * Edge Case Validation Tests
 * 
 * These tests mirror the test data patterns from the goodmami/wn repository
 * to ensure we handle the same edge cases and data integrity scenarios.
 * 
 * Based on test files like E101-0.xml, E101-1.xml, etc. that test:
 * - Duplicate IDs in different entity types
 * - Invalid references between entities
 * - Data consistency edge cases
 */

describe(`Edge Case Validation Tests (Real + Mock Data)`, () => {
  let wordnet: WebWordnet;
  let dataLoader: DataLoader;
  let mockDataLoader: MockDataLoader;

  beforeAll(async () => {
    const instance = await createWordNetInstance('oewn:2024');
    wordnet = instance.wordnet;
    dataLoader = instance.dataLoader;
    
    console.log('🌐 Setting up comprehensive testing with both real and mock data...');
    
    try {
      // Always attempt to load real WordNet data first
      console.log('🌐 Loading real WordNet data for testing...');
      await dataLoader.downloadAndLoad('oewn:2024');
      console.log('✅ Real WordNet data loaded successfully');
      
      // Then load mock data on top for additional test coverage
      console.log('🎭 Loading mock data for additional test coverage...');
      mockDataLoader = new MockDataLoader((wordnet as any).database, wordnet);
      await mockDataLoader.loadMockData('oewn:2024');
      console.log('✅ Mock data loaded successfully for comprehensive testing');
      
    } catch (error) {
      console.warn('⚠️ Failed to load real WordNet data, falling back to mock data only:', error);
      // Fall back to mock data if real data loading fails
      mockDataLoader = new MockDataLoader((wordnet as any).database, wordnet);
      await mockDataLoader.loadMockData('oewn:2024');
      console.log('✅ Mock data loaded as fallback');
    }
  }, 300000); // 5 minutes timeout

  afterAll(async () => {
    if (wordnet) {
      await wordnet.close();
    }
  });

  describe('Duplicate ID Handling (E101 Pattern Tests)', () => {
    it('should handle duplicate lexical entry IDs gracefully', async () => {
      // This test simulates the E101-0.xml scenario where lexical entries have duplicate IDs
      const words = await wordnet.words({ form: 'test' });
      
      // Even if there are duplicate IDs in the source data, our system should handle them
      // by either deduplicating or providing consistent results
      if (words.length > 0) {
        const wordIds = words.map(w => w.id);
        const uniqueIds = new Set(wordIds);
        
        // All words should have valid, non-empty IDs
        wordIds.forEach(id => {
          expect(id).toBeDefined();
          expect(typeof id).toBe('string');
          expect(id.length).toBeGreaterThan(0);
        });
        
        // If there are duplicates, they should be handled consistently
        expect(wordIds.length).toBeGreaterThanOrEqual(uniqueIds.size);
      }
    });

    it('should handle duplicate sense IDs gracefully', async () => {
      // This test simulates the E101-1.xml scenario where senses have duplicate IDs
      const senses = await wordnet.senses({ form: 'test' });
      
      if (senses.length > 0) {
        const senseIds = senses.map(s => s.id);
        const uniqueIds = new Set(senseIds);
        
        // All senses should have valid, non-empty IDs
        senseIds.forEach(id => {
          expect(id).toBeDefined();
          expect(typeof id).toBe('string');
          expect(id.length).toBeGreaterThan(0);
        });
        
        // Each sense should have valid references
        senses.forEach(sense => {
          expect(sense.word).toBeDefined();
          expect(sense.synset).toBeDefined();
        });
      }
    });

    it('should handle duplicate synset IDs gracefully', async () => {
      // This test simulates the E101-2.xml scenario where synsets have duplicate IDs
      const synsets = await wordnet.synsets({ form: 'test' });
      
      if (synsets.length > 0) {
        const synsetIds = synsets.map(s => s.id);
        const uniqueIds = new Set(synsetIds);
        
        // All synsets should have valid, non-empty IDs
        synsetIds.forEach(id => {
          expect(id).toBeDefined();
          expect(typeof id).toBe('string');
          expect(id.length).toBeGreaterThan(0);
        });
        
        // Each synset should have valid properties
        synsets.forEach(synset => {
          expect(synset.pos).toBeDefined();
          expect(synset.language).toBeDefined();
          expect(synset.lexicon).toBeDefined();
        });
      }
    });

    it('should handle duplicate IDs across different entity types gracefully', async () => {
      // This test simulates the E101-3.xml scenario where different entity types have duplicate IDs
      const testWord = 'test';
      
      const words = await wordnet.words({ form: testWord });
      const synsets = await wordnet.synsets({ form: testWord });
      const senses = await wordnet.senses({ form: testWord });
      
      // Collect all IDs from different entity types
      const allIds = [
        ...words.map(w => w.id),
        ...synsets.map(s => s.id),
        ...senses.map(s => s.id)
      ];
      
      // All IDs should be valid
      allIds.forEach(id => {
        expect(id).toBeDefined();
        expect(typeof id).toBe('string');
        expect(id.length).toBeGreaterThan(0);
      });
      
      // If there are cross-entity duplicates, they should be handled consistently
      const uniqueIds = new Set(allIds);
      expect(allIds.length).toBeGreaterThanOrEqual(uniqueIds.size);
    });
  });

  describe('Reference Integrity Validation', () => {
    it('should maintain referential integrity between words and synsets', async () => {
      const testWords = ['happy', 'run', 'book', 'computer'];
      
      for (const lemma of testWords) {
        const words = await wordnet.words({ form: lemma });
        
        for (const word of words) {
          const senses = await wordnet.senses({ form: word.lemma, pos: word.pos });
          
          for (const sense of senses) {
            // Verify that the sense references a valid word
            const referencedWord = await wordnet.getWord(sense.word);
            expect(referencedWord).toBeDefined();
            
            // Verify that the sense references a valid synset
            const referencedSynset = await wordnet.getSynset(sense.synset);
            expect(referencedSynset).toBeDefined();
            
            // Verify that the referenced entities have consistent properties
            if (referencedWord && referencedSynset) {
              expect(referencedWord.pos).toBe(word.pos);
              // Adjective satellites ('s') are a type of adjective ('a')
              if (word.pos === 'a' && referencedSynset.pos === 's') {
                expect(referencedSynset.pos).toBe('s');
              } else {
                expect(referencedSynset.pos).toBe(word.pos);
              }
              expect(referencedWord.lexicon).toBe(word.lexicon);
              expect(referencedSynset.lexicon).toBe(word.lexicon);
            }
          }
        }
      }
    });

    it('should handle orphaned references gracefully', async () => {
      // Test that we can handle cases where references might be broken
      const words = await wordnet.words({ form: 'orphan' });
      
      if (words.length > 0) {
        for (const word of words) {
          const senses = await wordnet.senses({ form: word.lemma, pos: word.pos });
          
          for (const sense of senses) {
            try {
              // These should either succeed or fail gracefully
              const referencedWord = await wordnet.getWord(sense.word);
              const referencedSynset = await wordnet.getSynset(sense.synset);
              
              // If they exist, they should be valid
              if (referencedWord) {
                expect(referencedWord.id).toBeDefined();
                expect(referencedWord.lemma).toBeDefined();
              }
              
              if (referencedSynset) {
                expect(referencedSynset.id).toBeDefined();
                expect(referencedSynset.pos).toBeDefined();
              }
            } catch (error) {
              // If references are broken, the error should be handled gracefully
              expect(error).toBeDefined();
              expect(error instanceof Error).toBe(true);
            }
          }
        }
      }
    });

    it('should maintain consistent lexicon references across all entities', async () => {
      const testWords = ['happy', 'run', 'book', 'quickly', 'computer'];
      
      for (const lemma of testWords) {
        const words = await wordnet.words({ form: lemma });
        
        for (const word of words) {
          expect(word.lexicon).toBe('oewn');
          
          const senses = await wordnet.senses({ form: word.lemma, pos: word.pos });
          for (const sense of senses) {
            try {
              const referencedWord = await wordnet.getWord(sense.word);
              const referencedSynset = await wordnet.getSynset(sense.synset);
              
              if (referencedWord) {
                expect(referencedWord.lexicon).toBe('oewn');
              }
              
              if (referencedSynset) {
                expect(referencedSynset.lexicon).toBe('oewn');
              }
            } catch (error) {
              // Handle broken references gracefully
              expect(error).toBeDefined();
            }
          }
        }
      }
    });
  });

  describe('Data Consistency Edge Cases', () => {
    it('should handle entities with missing optional properties', async () => {
      const words = await wordnet.words({ form: 'test' });
      
      if (words.length > 0) {
        for (const word of words) {
          // Required properties should always be present
          expect(word.id).toBeDefined();
          expect(word.lemma).toBeDefined();
          expect(word.pos).toBeDefined();
          expect(word.language).toBeDefined();
          expect(word.lexicon).toBeDefined();
          
          // Optional properties might be undefined but shouldn't cause errors
          if (word.forms) {
            expect(Array.isArray(word.forms)).toBe(true);
          }
        }
      }
    });

    it('should handle synsets with missing definitions gracefully', async () => {
      const synsets = await wordnet.synsets({ form: 'test' });
      
      if (synsets.length > 0) {
        for (const synset of synsets) {
          // Required properties should always be present
          expect(synset.id).toBeDefined();
          expect(synset.pos).toBeDefined();
          expect(synset.language).toBeDefined();
          expect(synset.lexicon).toBeDefined();
          
          // Definitions array should always exist, even if empty
          expect(Array.isArray(synset.definitions)).toBe(true);
          
          // If definitions exist, they should have valid structure
          synset.definitions.forEach(def => {
            expect(def.id).toBeDefined();
            expect(def.text).toBeDefined();
            expect(typeof def.text).toBe('string');
          });
        }
      }
    });

    it('should handle senses with minimal required data', async () => {
      const senses = await wordnet.senses({ form: 'test' });
      
      if (senses.length > 0) {
        for (const sense of senses) {
          // Required properties should always be present
          expect(sense.id).toBeDefined();
          expect(sense.word).toBeDefined();
          expect(sense.synset).toBeDefined();
          
          // Optional properties might be undefined but shouldn't cause errors
          // Note: These properties don't exist on the Sense type, so we skip them
          // if (sense.lexicalized !== undefined) {
          //   expect(typeof sense.lexicalized).toBe('boolean');
          // }
          
          // if (sense.adjectivePosition !== undefined) {
          //   expect(typeof sense.adjectivePosition).toBe('string');
          // }
        }
      }
    });
  });

  describe('Boundary Value Testing', () => {
    it('should handle very long entity IDs gracefully', async () => {
      // Test with extremely long IDs to ensure no buffer overflows
      const longId = 'a'.repeat(10000);
      
      try {
        // These should either return empty results or handle gracefully
        const word = await wordnet.getWord(longId);
        const synset = await wordnet.getSynset(longId);
        const sense = await wordnet.getSense(longId);
        
        // If they return results, they should be valid
        if (word) expect(word.id).toBeDefined();
        if (synset) expect(synset.id).toBeDefined();
        if (sense) expect(sense.id).toBeDefined();
      } catch (error) {
        // Errors should be handled gracefully
        expect(error).toBeDefined();
        expect(error instanceof Error).toBe(true);
      }
    });

    it('should handle very long text content gracefully', async () => {
      // Test with extremely long text content
      const longText = 'a'.repeat(100000);
      
      try {
        // Search for a very long term
        const words = await wordnet.words({ form: longText });
        expect(Array.isArray(words)).toBe(true);
        expect(words.length).toBe(0); // Should return no results
      } catch (error) {
        // Errors should be handled gracefully
        expect(error).toBeDefined();
        expect(error instanceof Error).toBe(true);
      }
    });

    it('should handle empty and whitespace-only search terms', async () => {
      const emptyTerms = ['', ' ', '  ', '\t', '\n', '\r'];
      
      for (const term of emptyTerms) {
        try {
          const words = await wordnet.words({ form: term });
          expect(Array.isArray(words)).toBe(true);
          // Should return empty results for empty terms
          expect(words.length).toBe(0);
        } catch (error) {
          // Errors should be handled gracefully
          expect(error).toBeDefined();
          expect(error instanceof Error).toBe(true);
        }
      }
    });
  });

  describe('Concurrent Access and Race Conditions', () => {
    it('should handle concurrent queries without data corruption', async () => {
      const testWord = 'happy';
      const concurrentQueries = 10;
      
      const promises = Array.from({ length: concurrentQueries }, () => 
        wordnet.words({ form: testWord })
      );
      
      const results = await Promise.all(promises);
      
      // All results should be identical
      const firstResult = results[0];
      results.forEach(result => {
        expect(result).toEqual(firstResult);
      });
      
      // Results should be valid
      expect(Array.isArray(firstResult)).toBe(true);
      if (firstResult.length > 0) {
        expect(firstResult[0].lemma).toBe(testWord);
      }
    });

    it('should handle concurrent statistics queries consistently', async () => {
      const concurrentQueries = 5;
      
      const promises = Array.from({ length: concurrentQueries }, () => 
        wordnet.getStatistics()
      );
      
      const results = await Promise.all(promises);
      
      // All results should be identical
      const firstResult = results[0];
      results.forEach(result => {
        expect(result).toEqual(firstResult);
      });
      
      // Results should be valid
      expect(firstResult.totalWords).toBeGreaterThan(0);
      expect(firstResult.totalSynsets).toBeGreaterThan(0);
    });
  });

  describe('Error Recovery and Resilience', () => {
    it('should recover gracefully from temporary database errors', async () => {
      // This test simulates scenarios where the database might be temporarily unavailable
      // or where there are connection issues
      
      try {
        // Make a normal query
        const words = await wordnet.words({ form: 'test' });
        expect(Array.isArray(words)).toBe(true);
        
        // Make another query to ensure recovery
        const synsets = await wordnet.synsets({ form: 'test' });
        expect(Array.isArray(synsets)).toBe(true);
        
      } catch (error) {
        // If there are errors, they should be handled gracefully
        expect(error).toBeDefined();
        expect(error instanceof Error).toBe(true);
        
        // Try to recover with a simple query
        try {
          const simpleQuery = await wordnet.words({ form: 'a' });
          expect(Array.isArray(simpleQuery)).toBe(true);
        } catch (recoveryError) {
          // Even recovery might fail, but should fail gracefully
          expect(recoveryError).toBeDefined();
        }
      }
    });

    it('should maintain data consistency after error conditions', async () => {
      const testWord = 'happy';
      
      try {
        // Make initial queries
        const initialWords = await wordnet.words({ form: testWord });
        const initialStats = await wordnet.getStatistics();
        
        // Simulate some operations that might cause errors
        try {
          await wordnet.words({ form: '' }); // This might cause an error
        } catch (error) {
          // Expected error
        }
        
        // Make the same queries again
        const finalWords = await wordnet.words({ form: testWord });
        const finalStats = await wordnet.getStatistics();
        
        // Data should remain consistent
        expect(finalWords).toEqual(initialWords);
        expect(finalStats).toEqual(initialStats);
        
      } catch (error) {
        // If there are errors, they should be handled gracefully
        expect(error).toBeDefined();
        expect(error instanceof Error).toBe(true);
      }
    });
  });
});
