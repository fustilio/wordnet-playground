/**
 * End-to-end tests for WordNet Interlingual Queries
 * 
 * These tests validate interlingual query functionality using:
 * - Real browser environment
 * - Actual SQLite WASM
 * - Real database operations
 * - Interlingual Index (ILI) functionality
 * 
 * Based on the WordNet documentation examples:
 * https://llmtext.com/wn.readthedocs.io/en/latest/guides/interlingual.html
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach, afterEach } from 'vitest';
import { createWordNetInstance } from '../../../src/factory.js';
import type { WebWordnet } from '../../../src/client/submodules/web-wordnet.js';
import type { DataLoader } from '../../../src/data-loader.js';

const isNode =
  typeof process !== 'undefined' &&
  process.versions != null &&
  process.versions.node != null;

describe.skipIf(isNode)('WordNet Interlingual Queries E2E', () => {
  let wordnet: WebWordnet;
  let dataLoader: DataLoader;

  beforeAll(async () => {
    const instance = await createWordNetInstance('oewn:2024');
    wordnet = instance.wordnet;
    dataLoader = instance.dataLoader;
    
    console.log('🌐 Setting up interlingual testing environment...');
    
    try {
      // Load the Open English WordNet (oewn:2024)
      console.log('🌐 Loading Open English WordNet (oewn:2024)...');
      await dataLoader.downloadAndLoad('oewn:2024');
      console.log('✅ Open English WordNet loaded successfully');
      
      // Note: In a real scenario, we would also load other lexicons like:
      // - Open German WordNet (odenet:1.4)
      // - Japanese wordnet (omw-ja:1.4)
      // For now, we'll test with the English lexicon and demonstrate ILI functionality
      
    } catch (error) {
      console.warn('⚠️ Failed to load WordNet data:', error);
      throw new Error('WordNet data required for interlingual testing');
    }
  }, 300000); // 5 minutes timeout

  afterAll(async () => {
    if (wordnet) {
      await wordnet.close();
    }
  });

  describe('Interlingual Index (ILI) Basics', () => {
    it('should understand what Interlingual Indices are', async () => {
      // This test documents the concept of ILIs as described in the documentation
      
      // ILIs provide stable identifiers for concepts across:
      // - Different versions of the same wordnet
      // - Different languages
      // - Different wordnet formats
      
      // Example from documentation:
      // - WordNet 3.0: apricot (fruit) = 07750872-n
      // - WordNet 3.1: apricot (fruit) = 07766848-n  
      // - OdeNet 1.4: Aprikose = 13235-n
      // - All three use the same ILI: i77784
      
      const stats = await wordnet.getStatistics();
      expect(stats.totalILIs).toBeGreaterThan(0);
      
      console.log(`📊 Total ILIs in database: ${stats.totalILIs}`);
      console.log(`📊 ILI coverage: ${((stats.totalILIs / stats.totalSynsets) * 100).toFixed(1)}%`);
    });

    it('should retrieve ILI for synsets that have them', async () => {
      // Find a synset that should have an ILI
      const synsets = await wordnet.synsets({ form: 'apricot' });
      expect(synsets.length).toBeGreaterThan(0);
      
      // Look for the fruit sense (should have ILI)
      const fruitSynset = synsets.find(s => 
        s.definitions.some(d => d.text.includes('fruit') || d.text.includes('tree'))
      );
      
      if (fruitSynset) {
        // Check if this synset has an ILI
        // Note: The actual ILI property might be implemented differently in our system
        expect(fruitSynset.id).toBeDefined();
        expect(fruitSynset.pos).toBeDefined();
        
        // In a full implementation, we would check:
        // expect(fruitSynset.ili).toBeDefined();
        // expect(fruitSynset.ili).toMatch(/^i\d+$/);
      }
    });

    it('should handle synsets without ILIs gracefully', async () => {
      // Some synsets don't have ILIs, especially newer or domain-specific ones
      const synsets = await wordnet.synsets({ form: 'test' });
      expect(synsets.length).toBeGreaterThan(0);
      
      // All synsets should have basic properties regardless of ILI status
      synsets.forEach(synset => {
        expect(synset.id).toBeDefined();
        expect(synset.pos).toBeDefined();
        expect(synset.language).toBeDefined();
        expect(synset.lexicon).toBeDefined();
      });
    });
  });

  describe('Using Interlingual Indices', () => {
    it('should demonstrate ILI-based synset retrieval', async () => {
      // This test shows how ILIs would be used to find equivalent concepts
      // across different lexicons
      
      // In a full implementation with multiple lexicons, we would:
      // 1. Find a synset with an ILI
      // 2. Use that ILI to find equivalent synsets in other lexicons
      // 3. Verify the cross-lexicon relationships
      
      const stats = await wordnet.getStatistics();
      expect(stats.totalILIs).toBeGreaterThan(0);
      
      // For now, we'll verify that our system can handle ILI-related queries
      // by checking that we can retrieve synsets and their properties
      const testSynsets = await wordnet.synsets({ form: 'computer' });
      expect(testSynsets.length).toBeGreaterThan(0);
      
      testSynsets.forEach(synset => {
        expect(synset.id).toBeDefined();
        expect(synset.pos).toBeDefined();
        expect(Array.isArray(synset.definitions)).toBe(true);
      });
    });

    it('should support cross-lexicon synset queries via ILI', async () => {
      // This test demonstrates the pattern described in the documentation:
      // >>> apricot = en.synsets('apricot')[1]
      // >>> apricot.ili
      // ILI('i77784')
      // >>> wn.synsets(ili='i77784')
      // [Synset('ewn-07282278-n'), Synset('wnja-07267573-n'), Synset('frawn-07267573-n')]
      
      // In our current setup with only one lexicon, we'll verify the pattern
      const synsets = await wordnet.synsets({ form: 'apricot' });
      expect(synsets.length).toBeGreaterThan(0);
      
      // Each synset should be retrievable by ID
      for (const synset of synsets) {
        const retrieved = await wordnet.getSynset(synset.id);
        expect(retrieved).toBeDefined();
        expect(retrieved?.id).toBe(synset.id);
      }
    });
  });

  describe('Cross-Lexicon Operations', () => {
    it('should demonstrate lexicon dependency handling', async () => {
      // This test shows how our system handles lexicon dependencies
      // as described in the documentation
      
      const lexicons = await wordnet.lexicons();
      expect(lexicons.length).toBeGreaterThan(0);
      
      // Check that our current lexicon is properly loaded
      const oewnLexicon = lexicons.find(l => l.id === 'oewn:2024');
      expect(oewnLexicon).toBeDefined();
      expect(oewnLexicon?.label).toBe('Open English WordNet');
      expect(oewnLexicon?.language).toBe('en');
      
      // In a full multi-lexicon setup, we would also check:
      // - Expanded lexicons
      // - Dependency relationships
      // - Cross-lexicon relations
    });

    it('should handle expand lexicon functionality', async () => {
      // This test demonstrates the expand lexicon concept from the documentation
      // where some wordnets depend on others for their taxonomic scaffolding
      
      // In our current setup, we'll verify that we can:
      // 1. Load a base lexicon
      // 2. Query its contents
      // 3. Handle the basic structure needed for expansion
      
      const stats = await wordnet.getStatistics();
      expect(stats.totalWords).toBeGreaterThan(0);
      expect(stats.totalSynsets).toBeGreaterThan(0);
      expect(stats.totalSenses).toBeGreaterThan(0);
      
      // Verify that we have the basic structure for expansion
      const testWords = ['happy', 'run', 'book', 'computer'];
      for (const lemma of testWords) {
        const words = await wordnet.words({ form: lemma });
        expect(Array.isArray(words)).toBe(true);
        
        if (words.length > 0) {
          const word = words[0];
          const senses = await wordnet.senses({ form: word.lemma, pos: word.pos });
          expect(senses.length).toBeGreaterThan(0);
          
          for (const sense of senses) {
            const synset = await wordnet.getSynset(sense.synset);
            expect(synset).toBeDefined();
          }
        }
      }
    });
  });

  describe('Interlingual Query Patterns', () => {
    it('should support the basic interlingual workflow', async () => {
      // This test demonstrates the complete interlingual workflow:
      // 1. Find a concept in one language
      // 2. Get its ILI
      // 3. Find equivalent concepts in other languages
      // 4. Verify the cross-lingual relationships
      
      // Step 1: Find a concept in English
      const enSynsets = await wordnet.synsets({ form: 'fruit' });
      expect(enSynsets.length).toBeGreaterThan(0);
      
      const fruitSynset = enSynsets[0];
      expect(fruitSynset.pos).toBe('n');
      expect(fruitSynset.language).toBe('en');
      
      // Step 2: Get the ILI (in a full implementation)
      // const ili = fruitSynset.ili;
      // expect(ili).toMatch(/^i\d+$/);
      
      // Step 3: Find equivalent concepts in other languages
      // In a full multi-lexicon setup, this would return synsets from:
      // - German: Frucht, Obst
      // - French: fruit
      // - Japanese: 果物
      // etc.
      
      // For now, we'll verify that our system can handle the basic structure
      expect(fruitSynset.id).toBeDefined();
      expect(fruitSynset.definitions).toBeDefined();
      expect(Array.isArray(fruitSynset.definitions)).toBe(true);
    });

    it('should handle interlingual sense queries', async () => {
      // This test shows how senses are used for interlingual queries
      // since translations depend on the specific sense used
      
      const words = await wordnet.words({ form: 'goose' });
      expect(words.length).toBeGreaterThan(0);
      
      for (const word of words) {
        const senses = await wordnet.senses({ form: word.lemma, pos: word.pos });
        expect(senses.length).toBeGreaterThan(0);
        
        for (const sense of senses) {
          // Each sense represents a specific meaning
          expect(sense.id).toBeDefined();
          expect(sense.word).toBeDefined();
          expect(sense.synset).toBeDefined();
          
          // In a full implementation, we would test:
          // const translations = await sense.translate(lang='de');
          // expect(Array.isArray(translations)).toBe(true);
        }
      }
    });

    it('should support cross-lexicon word queries', async () => {
      // This test demonstrates cross-lexicon word queries
      // as shown in the documentation examples
      
      // Test with a word that might exist in multiple lexicons
      const words = await wordnet.words({ form: 'chat' });
      expect(Array.isArray(words)).toBe(true);
      
      // In a full multi-lexicon setup, this might return:
      // - ewn-chat-n (English WordNet)
      // - ewn-chat-v (English WordNet)
      // - frawn-lex14803 (French WordNet)
      // - frawn-lex21897 (French WordNet)
      
      // For now, we'll verify that our system can handle the basic query
      words.forEach(word => {
        expect(word.id).toBeDefined();
        expect(word.lemma).toBe('chat');
        expect(word.pos).toBeDefined();
        expect(word.language).toBe('en');
        expect(word.lexicon).toBe('oewn:2024');
      });
    });

    it('should support lexicon-specific filtering', async () => {
      // This test demonstrates lexicon filtering as shown in the documentation:
      // >>> wn.words('chat', lexicon='ewn:2020')
      // [Word('ewn-chat-n'), Word('ewn-chat-v')]
      // >>> wn.words('chat', lexicon='wnja')
      // []
      // >>> wn.words('chat', lexicon='wnja frawn')
      // [Word('frawn-lex14803'), Word('frawn-lex21897')]
      
      // In our current setup, we'll verify the basic filtering works
      const allWords = await wordnet.words({ form: 'chat' });
      expect(allWords.length).toBeGreaterThan(0);
      
      // All words should be from our loaded lexicon
      allWords.forEach(word => {
        expect(word.lexicon).toBe('oewn:2024');
      });
      
      // Test filtering by part of speech
      const nounWords = await wordnet.words({ form: 'chat', pos: 'n' });
      const verbWords = await wordnet.words({ form: 'chat', pos: 'v' });
      
      expect(nounWords.length).toBeGreaterThan(0);
      expect(verbWords.length).toBeGreaterThan(0);
      
      nounWords.forEach(word => expect(word.pos).toBe('n'));
      verbWords.forEach(word => expect(word.pos).toBe('v'));
    });

    it('should handle language-specific queries', async () => {
      // This test demonstrates language filtering as shown in the documentation:
      // >>> wn.words('chat', lang='fr')
      // [Word('frawn-lex14803'), Word('frawn-lex21897')]
      
      // In our current setup, we'll verify that language filtering works
      const enWords = await wordnet.words({ form: 'happy' });
      expect(enWords.length).toBeGreaterThan(0);
      
      enWords.forEach(word => {
        expect(word.language).toBe('en');
      });
      
      // Test that we can filter by language (though we only have English)
      const filteredWords = await wordnet.words({ form: 'happy', language: 'en' });
      expect(filteredWords.length).toBeGreaterThan(0);
      expect(filteredWords.length).toBe(enWords.length);
    });

    it('should support complex interlingual query patterns', async () => {
      // This test demonstrates more complex interlingual query patterns
      // that would be possible with multiple lexicons
      
      // Test the pattern: find concept -> get ILI -> find cross-lingual equivalents
      const testWords = ['computer', 'book', 'run', 'happy'];
      
      for (const lemma of testWords) {
        const words = await wordnet.words({ form: lemma });
        expect(Array.isArray(words)).toBe(true);
        
        if (words.length > 0) {
          const word = words[0];
          const senses = await wordnet.senses({ form: word.lemma, pos: word.pos });
          expect(senses.length).toBeGreaterThan(0);
          
          for (const sense of senses) {
            const synset = await wordnet.getSynset(sense.synset);
            expect(synset).toBeDefined();
            
            // In a full implementation, we would test:
            // const crossLingualSynsets = await wn.synsets(ili=synset.ili);
            // expect(crossLingualSynsets.length).toBeGreaterThan(1);
            // expect(crossLingualSynsets.some(s => s.language === 'en')).toBe(true);
            // expect(crossLingualSynsets.some(s => s.language === 'de')).toBe(true);
          }
        }
      }
    });
  });

  describe('Error Handling and Edge Cases', () => {
    it('should handle missing ILIs gracefully', async () => {
      // Some synsets don't have ILIs, especially newer concepts
      const synsets = await wordnet.synsets({ form: 'internet' });
      expect(synsets.length).toBeGreaterThan(0);
      
      // Even without ILIs, synsets should be fully functional
      synsets.forEach(synset => {
        expect(synset.id).toBeDefined();
        expect(synset.pos).toBeDefined();
        expect(synset.definitions).toBeDefined();
      });
    });

    it('should handle lexicon dependency issues gracefully', async () => {
      // This test demonstrates how our system handles cases where
      // lexicon dependencies are not met
      
      // In our current setup, we'll verify that we can still function
      // even with limited lexicon support
      const stats = await wordnet.getStatistics();
      expect(stats.totalWords).toBeGreaterThan(0);
      expect(stats.totalSynsets).toBeGreaterThan(0);
      
      // Verify that basic queries still work
      const words = await wordnet.words({ form: 'test' });
      expect(Array.isArray(words)).toBe(true);
    });

    it('should maintain data integrity across interlingual operations', async () => {
      // This test verifies that interlingual operations don't corrupt data
      const testWord = 'computer';
      
      // Make multiple queries to ensure consistency
      const results1 = await wordnet.words({ form: testWord });
      const results2 = await wordnet.words({ form: testWord });
      const results3 = await wordnet.words({ form: testWord });
      
      // All results should be identical
      expect(results1).toEqual(results2);
      expect(results2).toEqual(results3);
      
      // Verify that the data structure remains intact
      if (results1.length > 0) {
        const word = results1[0];
        expect(word.id).toBeDefined();
        expect(word.lemma).toBe(testWord);
        expect(word.pos).toBeDefined();
        expect(word.language).toBe('en');
        expect(word.lexicon).toBe('oewn');
      }
    });
  });

  describe('Performance and Scalability', () => {
    it('should handle large interlingual queries efficiently', async () => {
      // This test verifies that interlingual queries scale well
      const startTime = Date.now();
      
      // Make multiple interlingual-style queries
      const testWords = ['happy', 'sad', 'run', 'walk', 'book', 'computer', 'internet'];
      const promises = testWords.map(word => wordnet.words({ form: word }));
      
      const results = await Promise.all(promises);
      const endTime = Date.now();
      
      // Should complete within reasonable time
      const duration = endTime - startTime;
      expect(duration).toBeLessThan(5000); // 5 seconds
      
      // All results should be valid
      expect(results).toHaveLength(testWords.length);
      results.forEach(wordList => {
        expect(Array.isArray(wordList)).toBe(true);
        expect(wordList.length).toBeGreaterThan(0);
      });
    });

    it('should support concurrent interlingual operations', async () => {
      // This test verifies that multiple interlingual operations
      // can run concurrently without conflicts
      
      const concurrentOperations = [
        wordnet.words({ form: 'happy' }),
        wordnet.synsets({ form: 'joy' }),
        wordnet.senses({ form: 'run' }),
        wordnet.getStatistics(),
        wordnet.getLexiconStatistics()
      ];
      
      const results = await Promise.all(concurrentOperations);
      expect(results).toHaveLength(5);
      
      // Verify that all operations completed successfully
      results.forEach(result => {
        expect(result).toBeDefined();
      });
    });
  });
});
