import { describe, it, expect, beforeEach } from 'vitest';
import { Morphy, createMorphy } from '../src/morphy';
import { BaseWordnet } from '../src/wordnet';
import { TestWordnet } from './helpers';
import type { Word, WordQuery } from '../src/types';

describe('Morphy', () => {
  let wordnet: BaseWordnet;

  beforeEach(async () => {
    // Create a mock implementation of BaseWordnet for testing
    wordnet = new TestWordnet();
  });

  describe('uninitialized', () => {
    it('should handle basic morphological analysis', async () => {
      const morphy = new Morphy();
      
      // Test noun analysis
      const nounResult = await morphy.analyze('example', 'n');
      expect(nounResult['n']).toEqual(new Set(['example']));
      
      const pluralResult = await morphy.analyze('examples', 'n');
      expect(pluralResult['n']).toEqual(new Set(['examples', 'example']));
      
      // Test verb analysis - 'examples' as verb should include 'exampl' (without 'e')
      const verbResult = await morphy.analyze('examples', 'v');
      expect(verbResult['v']).toEqual(new Set(['examples', 'example', 'exampl']));
      
      const ingResult = await morphy.analyze('exemplifying', 'v');
      expect(ingResult['v']).toEqual(new Set(['exemplifying', 'exemplify', 'exemplifye']));
    });

    it('should handle irregular plurals', async () => {
      const morphy = new Morphy();
      
      const dataResult = await morphy.analyze('data', 'n');
      expect(dataResult['n']).toEqual(new Set(['data']));
      
      const datumsResult = await morphy.analyze('datums', 'n');
      expect(datumsResult['n']).toEqual(new Set(['datums', 'datum']));
    });

    it('should analyze without part of speech', async () => {
      const morphy = new Morphy();
      
      const result = await morphy.analyze('examples');
      expect(result['null']).toEqual(new Set(['examples']));
      // For noun analysis, should include both forms
      expect(result['n']).toEqual(new Set(['examples', 'example']));
      // For verb analysis, should include all forms including 'exampl'
      expect(result['v']).toEqual(new Set(['examples', 'example', 'exampl']));
    });

    it('should handle verb forms', async () => {
      const morphy = new Morphy();
      
      const result = await morphy.analyze('exemplifying');
      expect(result['null']).toEqual(new Set(['exemplifying']));
      // Should include the original form plus derived forms
      expect(result['v']).toEqual(new Set(['exemplifying', 'exemplify', 'exemplifye']));
    });
  });

  describe('initialized with wordnet', () => {
    it('should filter results to valid words', async () => {
      // Mock wordnet to return specific words
      const mockWords: Record<string, Word[]> = {
        'n': [
          { 
            id: 'test-example-n', 
            lemma: 'example', 
            pos: 'n', 
            language: 'en', 
            lexicon: 'test', 
            forms: [],
            pronunciations: [],
            tags: [],
            counts: []
          },
          { 
            id: 'test-datum-n', 
            lemma: 'datum', 
            pos: 'n', 
            language: 'en', 
            lexicon: 'test', 
            forms: [],
            pronunciations: [],
            tags: [],
            counts: []
          },
        ],
        'v': [
          { 
            id: 'test-exemplify-v', 
            lemma: 'exemplify', 
            pos: 'v', 
            language: 'en', 
            lexicon: 'test', 
            forms: [],
            pronunciations: [],
            tags: [],
            counts: []
          },
        ],
      };

      const wordsFn = async (query?: WordQuery): Promise<Word[]> => {
        if (!query || !query.form) {
          return query?.pos ? mockWords[query.pos] || [] : [];
        }
        const wordsForPos = query.pos ? mockWords[query.pos] || [] : [];
        return wordsForPos.filter(w => w.lemma === query.form);
      };

      const mockWordnet = new TestWordnet({ words: wordsFn });
      const morphy = new Morphy(mockWordnet);
      
      // Should only return valid words
      const nounResult = await morphy.analyze('examples', 'n');
      expect(nounResult['n']).toEqual(new Set(['example']));
      
      const verbResult = await morphy.analyze('exemplifying', 'v');
      expect(verbResult['v']).toEqual(new Set(['exemplify']));
      
      const dataResult = await morphy.analyze('datums', 'n');
      expect(dataResult['n']).toEqual(new Set(['datum']));
    });

    it('should return empty results for invalid words', async () => {
      const mockWordnet = new TestWordnet();
      const morphy = new Morphy(mockWordnet);
      
      const result = await morphy.analyze('nonexistent', 'n');
      expect(result['n']).toEqual(new Set([]));
    });
  });

  describe('createMorphy', () => {
    it('should create a Morphy instance', async () => {
      const morphy = await createMorphy();
      expect(morphy).toBeInstanceOf(Morphy);
    });

    it('should create a Morphy instance with wordnet', async () => {
      const morphy = await createMorphy(wordnet);
      expect(morphy).toBeInstanceOf(Morphy);
    });
  });

  describe('edge cases', () => {
    it('should handle empty string', async () => {
      const morphy = new Morphy();
      const result = await morphy.analyze('');
      expect(result['null']).toEqual(new Set(['']));
    });

    it('should handle single character words', async () => {
      const morphy = new Morphy();
      const result = await morphy.analyze('a', 'n');
      expect(result['n']).toEqual(new Set(['a']));
    });

    it('should handle words without morphological changes', async () => {
      const morphy = new Morphy();
      const result = await morphy.analyze('test', 'n');
      expect(result['n']).toEqual(new Set(['test']));
    });
  });
}); 
