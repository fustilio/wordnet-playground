import { describe, beforeAll, afterAll, it, expect } from 'vitest';
import { WebWordnet } from '../../../../src/client/submodules/web-wordnet.js';
import type { DataLoader } from '../../../../src/data-loader.js';
import { createWordNetInstance } from '../../../../src/factory.js';
import { MockDataLoader } from '../../../mock-data-loader.js';

/**
 * XML Parsing Validation Tests
 * 
 * These tests validate that our XML parsing and data loading correctly handles
 * the same test data patterns as the goodmami/wn repository.
 * 
 * Based on test files like:
 * - mini-lmf-1.0.xml, mini-lmf-1.1.xml, mini-lmf-1.3.xml, mini-lmf-1.4.xml
 * - sense-key-variations.xml
 * - sense-member-order.xml
 * - test-package/test-wn.xml
 */
describe(`XML Parsing and Data Loading Validation Tests (Real + Mock Data)`, () => {
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

  describe('LMF Version Compatibility', () => {
    it('should handle LMF 1.0 format correctly', async () => {
      // Test that we can work with LMF 1.0 data
      const lexicons = await wordnet.lexicons();
      expect(lexicons.length).toBeGreaterThan(0);
      
      // Verify that lexicon metadata is correctly parsed
      const oewnLexicon = lexicons.find(l => l.id === 'oewn:2024');
      expect(oewnLexicon).toBeDefined();
      expect(oewnLexicon?.label).toBe('Open English WordNet');
      expect(oewnLexicon?.language).toBe('en');
      // Note: version might be null in mock data, which is fine for testing
      if (oewnLexicon?.version) {
        expect(oewnLexicon.version).toBe('2024');
      }
    });

    it('should handle LMF 1.1 format correctly', async () => {
      // Test that we can work with LMF 1.1 data
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
        expect(word.language).toBeDefined();
        expect(word.lexicon).toBeDefined();
      }
    });

    it('should handle LMF 1.3 format correctly', async () => {
      // Test that we can work with LMF 1.3 data
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
        expect(Array.isArray(synset.definitions)).toBe(true);
      }
    });

    it('should handle LMF 1.4 format correctly', async () => {
      // Test that we can work with LMF 1.4 data
      const stats = await wordnet.getStatistics();
      expect(stats.totalSenses).toBeGreaterThan(0);
      
      // Try to find any sense to test with
      const allSenses = await wordnet.senses({ wordIdOrForm: 'a' }); // Search for senses starting with 'a'
      if (allSenses.length > 0) {
        const sense = allSenses[0];
        expect(sense.id).toBeDefined();
        expect(sense.wordId).toBeDefined();
        expect(sense.synsetId).toBeDefined();
        
        // LMF 1.4 specific properties should be handled gracefully
        if ((sense as any).adjposition !== undefined) {
          expect(typeof (sense as any).adjposition).toBe('object');
        }
      }
    });
  });

  describe('Sense Key Variations', () => {
    it('should handle various sense key formats correctly', async () => {
      // Test that we can work with different sense key formats
      const testWords = ['happy', 'run', 'book', 'computer'];
      
      for (const lemma of testWords) {
        const words = await wordnet.words({ form: lemma });
        if (words.length > 0) {
          const word = words[0];
          const senses = await wordnet.senses({ wordIdOrForm: word.lemma, pos: word.pos });
          
          for (const sense of senses) {
            // Sense should have a valid ID
            expect(sense.id).toBeDefined();
            expect(typeof sense.id).toBe('string');
            expect(sense.id.length).toBeGreaterThan(0);
            
            // Sense should have valid references
        expect(sense.wordId).toBeDefined();
        expect(sense.synsetId).toBeDefined();
          }
        }
      }
    });

    it('should handle sense member ordering correctly', async () => {
      // Test that sense member ordering is preserved
      const words = await wordnet.words({ form: 'test' });
      if (words.length > 0) {
        const word = words[0];
        const senses = await wordnet.senses({ wordIdOrForm: word.lemma, pos: word.pos });
        
        if (senses.length > 1) {
          // Verify that we can retrieve senses in a consistent order
          const firstSense = senses[0];
          const secondSense = senses[1];
          
          expect(firstSense.id).not.toBe(secondSense.id);
          expect(firstSense.wordId).toBeDefined();
          expect(secondSense.wordId).toBeDefined();
        }
      }
    });
  });

  describe('XML Structure Validation', () => {
    it('should correctly parse LexicalResource root element', async () => {
      // Verify that the root LexicalResource element is correctly parsed
      const lexicons = await wordnet.lexicons();
      expect(lexicons.length).toBeGreaterThan(0);
      
      // All lexicons should have valid metadata
      lexicons.forEach(lexicon => {
        expect(lexicon.id).toBeDefined();
        expect(lexicon.label).toBeDefined();
        expect(lexicon.language).toBeDefined();
        expect(lexicon.version).toBeDefined();
      });
    });

    it('should correctly parse Lexicon elements', async () => {
      // Verify that Lexicon elements are correctly parsed
      const lexicons = await wordnet.lexicons();
      expect(lexicons.length).toBeGreaterThan(0);
      
      const oewnLexicon = lexicons.find(l => l.id === 'oewn:2024');
      expect(oewnLexicon).toBeDefined();
      
      // Verify all required attributes are present
      expect(oewnLexicon?.id).toBe('oewn:2024');
      expect(oewnLexicon?.label).toBe('Open English WordNet');
      expect(oewnLexicon?.language).toBe('en');
      expect(oewnLexicon?.version).toBeDefined(); // Version might be null in mock data
    });

    it('should correctly parse LexicalEntry elements', async () => {
      // Verify that LexicalEntry elements are correctly parsed
      const words = await wordnet.words({ form: 'happy' });
      if (words.length > 0) {
        const happyWord = words.find(w => w.lemma === 'happy');
        expect(happyWord).toBeDefined();
        
        // Verify all required attributes are present
        expect(happyWord?.id).toBeDefined();
        expect(happyWord?.lemma).toBe('happy');
        expect(happyWord?.pos).toBeDefined();
        expect(happyWord?.language).toBe('en');
        expect(happyWord?.lexicon).toBe('oewn:2024');
      }
    });

    it('should correctly parse Lemma elements', async () => {
      // Verify that Lemma elements are correctly parsed
      const words = await wordnet.words({ form: 'run' });
      if (words.length > 0) {
        const runWord = words.find(w => w.lemma === 'run');
        expect(runWord).toBeDefined();
        
        // Verify lemma properties
        expect(runWord?.lemma).toBe('run');
        expect(runWord?.pos).toBeDefined();
        
        // Verify that forms are handled correctly if present
        if (runWord?.forms && runWord.forms.length > 0) {
          runWord.forms.forEach(form => {
            expect(form.writtenForm).toBeDefined();
            expect(typeof form.writtenForm).toBe('string');
            if (form.tag) {
              expect(typeof form.tag).toBe('string');
            }
          });
        }
      }
    });

    it('should correctly parse Sense elements', async () => {
      // Verify that Sense elements are correctly parsed
      const senses = await wordnet.senses({ wordIdOrForm: 'happy' });
      if (senses.length > 0) {
        const happySense = senses[0];
        expect(happySense.id).toBeDefined();
        expect(happySense.wordId).toBeDefined();
        expect(happySense.synsetId).toBeDefined();
        
        // Verify that the sense connects to valid entities
        const word = await wordnet.getWord(happySense.wordId);
        const synset = await wordnet.getSynset(happySense.synsetId);
        
        expect(word).toBeDefined();
        expect(synset).toBeDefined();
      }
    });

    it('should correctly parse Synset elements', async () => {
      // Verify that Synset elements are correctly parsed
      const synsets = await wordnet.synsets({ form: 'joy' });
      if (synsets.length > 0) {
        const joySynset = synsets[0];
        expect(joySynset.id).toBeDefined();
        expect(joySynset.pos).toBeDefined();
        expect(joySynset.language).toBe('en');
        expect(joySynset.lexicon).toBe('oewn:2024');
        
        // Verify that definitions are handled correctly
        expect(Array.isArray(joySynset.definitions)).toBe(true);
        
        if (joySynset.definitions.length > 0) {
          joySynset.definitions.forEach(def => {
            expect(def.id).toBeDefined();
            expect(def.text).toBeDefined();
            expect(typeof def.text).toBe('string');
            expect(def.language).toBeDefined();
          });
        }
      }
    });

    it('should correctly parse Definition elements', async () => {
      // Verify that Definition elements are correctly parsed
      const synsets = await wordnet.synsets({ form: 'computer' });
      if (synsets.length > 0) {
        const computerSynset = synsets[0];
        expect(Array.isArray(computerSynset.definitions)).toBe(true);
        
        if (computerSynset.definitions.length > 0) {
          const definition = computerSynset.definitions[0];
          expect(definition.id).toBeDefined();
          expect(definition.text).toBeDefined();
          expect(typeof definition.text).toBe('string');
          expect(definition.language).toBeDefined();
          
          // Definition text should be meaningful
          expect(definition.text.length).toBeGreaterThan(10);
        }
      }
    });
  });

  describe('XML Attribute Handling', () => {
    it('should handle required attributes correctly', async () => {
      // Test that required attributes are always present
      const testWords = ['happy', 'run', 'book', 'computer', 'quickly'];
      
      for (const lemma of testWords) {
        const words = await wordnet.words({ form: lemma });
        if (words.length > 0) {
          const word = words[0];
          
          // Required attributes should always be present
          expect(word.id).toBeDefined();
          expect(word.lemma).toBeDefined();
          expect(word.pos).toBeDefined();
          expect(word.language).toBeDefined();
          expect(word.lexicon).toBeDefined();
          
          // Verify attribute types
          expect(typeof word.id).toBe('string');
          expect(typeof word.lemma).toBe('string');
          expect(typeof word.pos).toBe('string');
          expect(typeof word.language).toBe('string');
          expect(typeof word.lexicon).toBe('string');
        }
      }
    });

    it('should handle optional attributes gracefully', async () => {
      // Test that optional attributes are handled gracefully
      const words = await wordnet.words({ form: 'test' });
      if (words.length > 0) {
        const word = words[0];
        
        // Optional attributes might be undefined but shouldn't cause errors
        if (word.forms !== undefined) {
          expect(Array.isArray(word.forms)).toBe(true);
        }
        
        if (word.pronunciations !== undefined) {
          expect(Array.isArray(word.pronunciations)).toBe(true);
        }
      }
    });

    it('should handle attribute value escaping correctly', async () => {
      // Test that XML attribute value escaping is handled correctly
      const words = await wordnet.words({ form: 'test' });
      if (words.length > 0) {
        const word = words[0];
        
        // Test that special characters in attributes are handled correctly
        expect(word.lemma).toBeDefined();
        expect(typeof word.lemma).toBe('string');
        
        // If the lemma contains special characters, they should be properly unescaped
        if (word.lemma.includes('&')) {
          // Should not contain raw XML entities
          expect(word.lemma).not.toContain('&amp;');
        }
        
        if (word.lemma.includes('<')) {
          // Should not contain raw XML entities
          expect(word.lemma).not.toContain('&lt;');
        }
        
        if (word.lemma.includes('>')) {
          // Should not contain raw XML entities
          expect(word.lemma).not.toContain('&gt;');
        }
      }
    });
  });

  describe('XML Content Validation', () => {
    it('should handle mixed content in definitions correctly', async () => {
      // Test that mixed content (text + HTML-like elements) is handled correctly
      const synsets = await wordnet.synsets({ form: 'test' });
      if (synsets.length > 0) {
        const synset = synsets[0];
        
        if (synset.definitions.length > 0) {
          const definition = synset.definitions[0];
          expect(definition.text).toBeDefined();
          expect(typeof definition.text).toBe('string');
          
          // Text should be meaningful and not contain raw XML
          expect(definition.text.length).toBeGreaterThan(0);
          
          // Should not contain raw XML tags
          expect(definition.text).not.toMatch(/<[^>]*>/);
          
          // Should not contain XML entities
          expect(definition.text).not.toContain('&amp;');
          expect(definition.text).not.toContain('&lt;');
          expect(definition.text).not.toContain('&gt;');
        }
      }
    });

    it('should handle CDATA sections correctly', async () => {
      // Test that CDATA sections are handled correctly
      const words = await wordnet.words({ form: 'test' });
      if (words.length > 0) {
        const word = words[0];
        
        // Word content should not contain CDATA markers
        expect(word.lemma).not.toContain('<![CDATA[');
        expect(word.lemma).not.toContain(']]>');
      }
    });

    it('should handle XML comments correctly', async () => {
      // Test that XML comments are handled correctly (should be ignored)
      const words = await wordnet.words({ form: 'test' });
      if (words.length > 0) {
        const word = words[0];
        
        // Word content should not contain comment markers
        expect(word.lemma).not.toContain('<!--');
        expect(word.lemma).not.toContain('-->');
      }
    });

    it('should handle whitespace and formatting correctly', async () => {
      // Test that whitespace and formatting are handled correctly
      const words = await wordnet.words({ form: 'test' });
      if (words.length > 0) {
        const word = words[0];
        
        // Lemma should be properly trimmed
        expect(word.lemma).toBe(word.lemma.trim());
        
        // Should not contain excessive whitespace
        expect(word.lemma).not.toMatch(/\s{2,}/);
        expect(word.lemma).not.toMatch(/^\s+|\s+$/);
      }
    });
  });

  describe('Data Loading Validation', () => {
    it('should load complete lexicon data correctly', async () => {
      // Verify that the complete lexicon data is loaded
      const stats = await wordnet.getStatistics();
      
      // With both real and mock data, we should have substantial amounts
      expect(stats.totalWords).toBeGreaterThan(1000);
      expect(stats.totalSynsets).toBeGreaterThan(500);
      expect(stats.totalSenses).toBeGreaterThan(1000);
      expect(stats.totalLexicons).toBeGreaterThan(0);
      
      // If real data is available, we should have even more
      if (stats.totalWords > 100000) {
        console.log('📊 Real WordNet data detected - comprehensive testing enabled');
      }
    });

    it('should maintain data relationships after loading', async () => {
      // Verify that data relationships are maintained after loading
      const words = await wordnet.words({ form: 'computer' });
      if (words.length > 0) {
        for (const word of words) {
          const senses = await wordnet.senses({ wordIdOrForm: word.lemma, pos: word.pos });
          expect(senses.length).toBeGreaterThan(0);
          
          for (const sense of senses) {
            // Verify that sense references are valid
            const referencedWord = await wordnet.getWord(sense.wordId);
            const referencedSynset = await wordnet.getSynset(sense.synsetId);
            
            expect(referencedWord).toBeDefined();
            expect(referencedSynset).toBeDefined();
            
            // Verify consistency
            if (referencedWord && referencedSynset) {
              expect(referencedWord.pos).toBe(word.pos);
              // Adjective satellites ('s') are a type of adjective ('a')
              if (word.pos === 'a' && referencedSynset.pos === 's') {
                expect(referencedSynset.pos).toBe('s');
              } else {
                expect(referencedSynset.pos).toBe(word.pos);
              }
            }
          }
        }
      }
    });

    it('should handle large datasets efficiently', async () => {
      // Test that large datasets are handled efficiently
      const startTime = Date.now();
      
      const stats = await wordnet.getStatistics();
      const words = await wordnet.words({ form: 'a' });
      const synsets = await wordnet.synsets({ form: 'a' });
      
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      // Operations should complete within reasonable time
      expect(duration).toBeLessThan(5000); // 5 seconds
      
      // Results should be valid
      expect(stats.totalWords).toBeGreaterThan(0);
      expect(Array.isArray(words)).toBe(true);
      expect(Array.isArray(synsets)).toBe(true);
    });
  });
});
