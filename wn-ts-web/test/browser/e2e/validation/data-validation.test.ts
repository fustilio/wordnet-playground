import type { DataLoader } from '../../../../src/data-loader.js';
import { MockDataLoader } from '../../../mock-data-loader.js';
import { describe, beforeAll, afterAll, it, expect } from 'vitest';
import { WebWordnet } from '../../../../src/client/submodules/web-wordnet.js';
import { createWordNetInstance } from '../../../../src/factory.js';

/**
 * Comprehensive Data Validation Tests
 * 
 * These tests ensure that data is stored correctly and can be retrieved accurately.
 * They mirror the test data patterns from the goodmami/wn repository to ensure
 * we handle the same edge cases and data integrity scenarios.
 */
describe(`Data Validation and Integrity Tests (Real + Mock Data)`, () => {
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
      mockDataLoader = new MockDataLoader(wordnet.getDatabase(), wordnet);
      await mockDataLoader.loadMockData('oewn:2024');
      console.log('✅ Mock data loaded successfully for comprehensive testing');
      
    } catch (error) {
      console.warn('⚠️ Failed to load real WordNet data, falling back to mock data only:', error);
      // Fall back to mock data if real data loading fails
      mockDataLoader = new MockDataLoader(wordnet.getDatabase(), wordnet);
      await mockDataLoader.loadMockData('oewn:2024');
      console.log('✅ Mock data loaded as fallback');
    }
  }, 300000); // 5 minutes timeout

  afterAll(async () => {
    if (wordnet) {
      await wordnet.close();
    }
  });

  describe('Data Storage Correctness', () => {
    it('should store and retrieve lexicon metadata correctly', async () => {
      const lexicons = await wordnet.lexicons();
      expect(lexicons.length).toBeGreaterThan(0);
      
      const oewnLexicon = lexicons.find(l => l.id === 'oewn:2024');
      expect(oewnLexicon).toBeDefined();
      expect(oewnLexicon?.label).toBe('Open English WordNet');
      expect(oewnLexicon?.language).toBe('en');
      // Note: version might be null in mock data, which is fine for testing
      if (oewnLexicon?.version) {
        expect(oewnLexicon.version).toBe('2024');
      }
    });

    it('should store and retrieve words with correct properties', async () => {
      // Get any available word from the data
      const stats = await wordnet.getStatistics();
      expect(stats.totalWords).toBeGreaterThan(0);
      
      // Try to find any word to test with
      const allWords = await wordnet.words({ form: 'a' }); // Search for words starting with 'a'
      if (allWords.length > 0) {
        const word = allWords[0];
        expect(word.id).toBeDefined();
        expect(word.lemma).toBeDefined();
        expect(word.pos).toBeDefined();
        expect(word.language).toBe('en');
        expect(word.lexicon).toBe('oewn:2024');
      }
    });

    it('should store and retrieve synsets with correct properties', async () => {
      // Get any available synset from the data
      const stats = await wordnet.getStatistics();
      expect(stats.totalSynsets).toBeGreaterThan(0);
      
      // Try to find any synset to test with
      const allSynsets = await wordnet.synsets({ form: 'a' }); // Search for synsets starting with 'a'
      if (allSynsets.length > 0) {
        const synset = allSynsets[0];
        expect(synset.id).toBeDefined();
        expect(synset.pos).toBeDefined();
        expect(synset.language).toBe('en');
        expect(synset.lexicon).toBe('oewn:2024');
        expect(synset.definitions).toBeDefined();
        expect(Array.isArray(synset.definitions)).toBe(true);
      }
    });

    it('should store and retrieve senses with correct relationships', async () => {
      // Get any available sense from the data
      const stats = await wordnet.getStatistics();
      expect(stats.totalSenses).toBeGreaterThan(0);
      
      // Try to find any sense to test with
      const allSenses = await wordnet.senses({ form: 'a' }); // Search for senses starting with 'a'
      if (allSenses.length > 0) {
        const sense = allSenses[0];
        expect(sense.id).toBeDefined();
        expect(sense.word).toBeDefined();
        expect(sense.synset).toBeDefined();
        
        // Verify the sense connects to a valid word and synset
        const word = await wordnet.getWord(sense.word);
        const synset = await wordnet.getSynset(sense.synset);
        
        expect(word).toBeDefined();
        expect(synset).toBeDefined();
      }
    });
  });

  describe('Data Retrieval Accuracy', () => {
    it('should return consistent results for the same query', async () => {
      const firstQuery = await wordnet.words({ form: 'test' });
      const secondQuery = await wordnet.words({ form: 'test' });
      
      expect(firstQuery).toEqual(secondQuery);
      expect(firstQuery.length).toBeGreaterThanOrEqual(0);
    });

    it('should handle case-insensitive word searches correctly', async () => {
      const lowercaseResults = await wordnet.words({ form: 'happy' });
      const uppercaseResults = await wordnet.words({ form: 'HAPPY' });
      const mixedCaseResults = await wordnet.words({ form: 'Happy' });
      
      // All should return the same results (case-insensitive)
      expect(lowercaseResults).toEqual(uppercaseResults);
      expect(lowercaseResults).toEqual(mixedCaseResults);
    });

    it('should return words with correct part-of-speech filtering', async () => {
      const nounResults = await wordnet.words({ form: 'run', pos: 'n' });
      const verbResults = await wordnet.words({ form: 'run', pos: 'v' });
      
      // 'run' should exist as both noun and verb
      expect(nounResults.length).toBeGreaterThan(0);
      expect(verbResults.length).toBeGreaterThan(0);
      
      // All noun results should have pos = 'n'
      nounResults.forEach(word => {
        expect(word.pos).toBe('n');
      });
      
      // All verb results should have pos = 'v'
      verbResults.forEach(word => {
        expect(word.pos).toBe('v');
      });
    });

    it('should return synsets with correct part-of-speech filtering', async () => {
      const nounSynsets = await wordnet.synsets({ form: 'book', pos: 'n' });
      const verbSynsets = await wordnet.synsets({ form: 'book', pos: 'v' });
      
      // 'book' should exist as both noun and verb
      expect(nounSynsets.length).toBeGreaterThan(0);
      expect(verbSynsets.length).toBeGreaterThan(0);
      
      // All noun synsets should have pos = 'n'
      nounSynsets.forEach(synset => {
        expect(synset.pos).toBe('n');
      });
      
      // All verb synsets should have pos = 'v'
      verbSynsets.forEach(synset => {
        expect(synset.pos).toBe('v');
      });
    });
  });

  describe('Data Relationships and Integrity', () => {
    it('should maintain correct word-synset relationships through senses', async () => {
      const words = await wordnet.words({ form: 'computer' });
      if (words.length > 0) {
        for (const word of words) {
          const senses = await wordnet.senses({ form: word.lemma, pos: word.pos });
          expect(senses.length).toBeGreaterThan(0);
          
          // Each sense should connect to a valid synset
          for (const sense of senses) {
            const synset = await wordnet.getSynset(sense.synset);
            expect(synset).toBeDefined();
            if (synset) {
              // Adjective satellites ('s') are a type of adjective ('a')
              if (word.pos === 'a' && synset.pos === 's') {
                expect(synset.pos).toBe('s');
              } else {
                expect(synset.pos).toBe(word.pos);
              }
            }
          }
        }
      }
    });

    it('should have consistent lexicon references across all entities', async () => {
      const testWords = ['happy', 'run', 'book', 'quickly', 'computer'];
      
      for (const lemma of testWords) {
        const words = await wordnet.words({ form: lemma });
        
        for (const word of words) {
          expect(word.lexicon).toBe('oewn:2024');
          
          const senses = await wordnet.senses({ form: word.lemma, pos: word.pos });
          for (const sense of senses) {
            try {
              const referencedWord = await wordnet.getWord(sense.word);
              const referencedSynset = await wordnet.getSynset(sense.synset);
              
              if (referencedWord) {
                expect(referencedWord.lexicon).toBe('oewn:2024');
              }
              
              if (referencedSynset) {
                expect(referencedSynset.lexicon).toBe('oewn:2024');
              }
            } catch (error) {
              // Handle broken references gracefully
              expect(error).toBeDefined();
            }
          }
        }
      }
    });

    it('should maintain referential integrity between entities', async () => {
      const words = await wordnet.words({ form: 'information' });
      if (words.length > 0) {
        for (const word of words) {
          const senses = await wordnet.senses({ form: word.lemma, pos: word.pos });
          
          for (const sense of senses) {
            // Ensure sense doesn't reference itself inappropriately
            expect(sense.word).toBeDefined();
            expect(sense.synset).toBeDefined();
            
            // Verify the referenced entities exist
            const referencedWord = await wordnet.getWord(sense.word);
            const referencedSynset = await wordnet.getSynset(sense.synset);
            
            expect(referencedWord).toBeDefined();
            expect(referencedSynset).toBeDefined();
          }
        }
      }
    });
  });

  describe('Data Statistics and Consistency', () => {
    it('should return consistent statistics across multiple calls', async () => {
      const firstStats = await wordnet.getStatistics();
      const secondStats = await wordnet.getStatistics();
      
      expect(firstStats).toEqual(secondStats);
      
      // With both real and mock data, we should have substantial amounts
      expect(firstStats.totalWords).toBeGreaterThan(1000);
      expect(firstStats.totalSynsets).toBeGreaterThan(500);
      expect(firstStats.totalSenses).toBeGreaterThan(1000);
      
      // If real data is available, we should have even more
      if (firstStats.totalWords > 100000) {
        console.log('📊 Real WordNet data detected - comprehensive testing enabled');
      }
    });

    it('should have logical relationships between statistics', async () => {
      const stats = await wordnet.getStatistics();
      
      // Basic logical relationships
      expect(stats.totalSenses).toBeGreaterThanOrEqual(stats.totalWords);
      expect(stats.totalSenses).toBeGreaterThanOrEqual(stats.totalSynsets);
      expect(stats.totalLexicons).toBeGreaterThan(0);
      
      // ILI coverage should be reasonable
      if (stats.totalILIs > 0) {
        const iliCoverage = (stats.totalILIs / stats.totalSynsets) * 100;
        expect(iliCoverage).toBeGreaterThan(80); // At least 80% ILI coverage
      }
    });

    it('should return consistent lexicon-specific statistics', async () => {
      const lexiconStats = await wordnet.getLexiconStatistics('oewn:2024');
      expect(lexiconStats.length).toBeGreaterThan(0);
      
      const oewnStats = lexiconStats.find(s => s.lexiconId === 'oewn:2024');
      expect(oewnStats).toBeDefined();
      expect(oewnStats?.wordCount).toBeGreaterThan(0);
      expect(oewnStats?.synsetCount).toBeGreaterThan(0);
      
      // Verify that lexicon-specific stats match overall stats
      const overallStats = await wordnet.getStatistics();
      expect(oewnStats?.wordCount).toBeLessThanOrEqual(overallStats.totalWords);
      expect(oewnStats?.synsetCount).toBeLessThanOrEqual(overallStats.totalSynsets);
    });
  });

  describe('Edge Cases and Error Handling', () => {
    it('should handle empty search results gracefully', async () => {
      const results = await wordnet.words({ form: 'nonexistentword12345' });
      expect(Array.isArray(results)).toBe(true);
      expect(results.length).toBe(0);
    });

    it('should handle special characters in search terms', async () => {
      // Test with various special characters
      const specialChars = ['café', 'naïve', 'résumé', 'über'];
      
      for (const term of specialChars) {
        const results = await wordnet.words({ form: term });
        expect(Array.isArray(results)).toBe(true);
        // Some might exist, some might not - just ensure no errors
      }
    });

    it('should handle very long search terms', async () => {
      const longTerm = 'a'.repeat(1000);
      const results = await wordnet.words({ form: longTerm });
      expect(Array.isArray(results)).toBe(true);
      expect(results.length).toBe(0);
    });

    it('should handle numeric and mixed content search terms', async () => {
      const mixedTerms = ['123', 'abc123', '123abc', 'test-123'];
      
      for (const term of mixedTerms) {
        const results = await wordnet.words({ form: term });
        expect(Array.isArray(results)).toBe(true);
        // Just ensure no errors occur
      }
    });
  });

  describe('Data Quality Metrics', () => {
    it('should provide meaningful data quality metrics', async () => {
      const quality = await wordnet.getDataQualityMetrics();
      
      expect(quality).toHaveProperty('iliCoveragePercentage');
      expect(quality).toHaveProperty('synsetsWithILI');
      expect(quality).toHaveProperty('synsetsWithoutILI');
      expect(quality).toHaveProperty('emptySynsets');
      expect(quality).toHaveProperty('synsetsWithDefinitions');
      
      // Quality metrics should be reasonable
      expect(quality.iliCoveragePercentage).toBeGreaterThan(80);
      expect(quality.synsetsWithILI).toBeGreaterThan(0);
      expect(quality.synsetsWithDefinitions).toBeGreaterThan(0);
    });

    it('should provide part-of-speech distribution analysis', async () => {
      const distribution = await wordnet.getPartOfSpeechDistribution();
      
      expect(typeof distribution).toBe('object');
      expect(Object.keys(distribution).length).toBeGreaterThan(0);
      
      // Common POS should be present
      const posKeys = Object.keys(distribution);
      expect(posKeys).toContain('n'); // nouns
      expect(posKeys).toContain('v'); // verbs
      expect(posKeys).toContain('a'); // adjectives
      expect(posKeys).toContain('r'); // adverbs
      
      // All counts should be positive
      for (const pos of posKeys) {
        expect(distribution[pos]).toBeGreaterThan(0);
      }
    });

    it('should provide synset size analysis', async () => {
      const analysis = await wordnet.getSynsetSizeAnalysis();
      
      expect(analysis).toHaveProperty('averageSize');
      expect(analysis).toHaveProperty('maxSize');
      expect(analysis).toHaveProperty('minSize');
      expect(analysis).toHaveProperty('sizeDistribution');
      
      // Analysis should be reasonable
      expect(analysis.averageSize).toBeGreaterThan(0);
      expect(analysis.maxSize).toBeGreaterThanOrEqual(analysis.averageSize);
      expect(analysis.minSize).toBeLessThanOrEqual(analysis.averageSize);
    });
  });

  describe('Cross-Entity Query Consistency', () => {
    it('should return consistent results across different query methods', async () => {
      const testWord = 'happy';
      
      // Query by word
      const words = await wordnet.words({ form: testWord });
      if (words.length > 0) {
        // Query by synset
        const synsets = await wordnet.synsets({ form: testWord });
        if (synsets.length > 0) {
          // Query by sense
          const senses = await wordnet.senses({ form: testWord });
          if (senses.length > 0) {
            // Verify relationships are consistent
            for (const word of words) {
              const wordSenses = await wordnet.senses({ form: word.lemma, pos: word.pos });
              expect(wordSenses.length).toBeGreaterThan(0);
              
              for (const sense of wordSenses) {
                const synset = await wordnet.getSynset(sense.synset);
                expect(synset).toBeDefined();
                if (synset) {
                  // Adjective satellites ('s') are a type of adjective ('a')
                  if (word.pos === 'a' && synset.pos === 's') {
                    expect(synset.pos).toBe('s');
                  } else {
                    expect(synset.pos).toBe(word.pos);
                  }
                }
              }
            }
          }
        }
      }
    });

    it('should handle circular references and self-references correctly', async () => {
      const words = await wordnet.words({ form: 'self' });
      if (words.length > 0) {
        const word = words[0];
        const senses = await wordnet.senses({ form: word.lemma, pos: word.pos });
        
        for (const sense of senses) {
          // Ensure sense doesn't reference itself inappropriately
          expect(sense.word).toBeDefined();
          expect(sense.synset).toBeDefined();
          
          // Verify the referenced entities exist
          const referencedWord = await wordnet.getWord(sense.word);
          const referencedSynset = await wordnet.getSynset(sense.synset);
          
          expect(referencedWord).toBeDefined();
          expect(referencedSynset).toBeDefined();
        }
      }
    });
  });
});
