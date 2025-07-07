import { describe, it, expect, beforeEach } from 'vitest';
import { Morphy, createMorphy } from '../src/morphy';
import { Wordnet } from '../src/wordnet';

describe('Morphy', () => {
  let wordnet: Wordnet;

  beforeEach(async () => {
    wordnet = new Wordnet('test-en');
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
      const mockWordnet = {
        words: async (word: string, pos?: string) => {
          // When called with empty string (initialization), return all words for that POS
          if (word === '') {
            if (pos === 'n') return [{ id: 'test-example-n' }, { id: 'test-datum-n' }];
            if (pos === 'v') return [{ id: 'test-exemplify-v' }];
            return [];
          }
          // When called with specific word, return matching words
          if (word === 'example' && pos === 'n') return [{ id: 'test-example-n' }];
          if (word === 'exemplify' && pos === 'v') return [{ id: 'test-exemplify-v' }];
          if (word === 'datum' && pos === 'n') return [{ id: 'test-datum-n' }];
          return [];
        }
      } as unknown as Wordnet;

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
      const mockWordnet = {
        words: async () => []
      } as unknown as Wordnet;

      const morphy = new Morphy(mockWordnet);
      
      const result = await morphy.analyze('nonexistent', 'n');
      expect(result['n']).toEqual(new Set());
    });
  });

  describe('createMorphy', () => {
    it('should create a Morphy instance', () => {
      const morphy = createMorphy();
      expect(morphy).toBeInstanceOf(Morphy);
    });

    it('should create a Morphy instance with wordnet', () => {
      const morphy = createMorphy(wordnet);
      expect(morphy).toBeInstanceOf(Morphy);
    });
  });

  describe('edge cases', () => {
    it('should handle empty string', async () => {
      const morphy = new Morphy();
      const result = await morphy.analyze('', 'n');
      expect(result['n']).toEqual(new Set(['']));
    });

    it('should handle single character words', async () => {
      const morphy = new Morphy();
      const result = await morphy.analyze('a', 'n');
      expect(result['n']).toEqual(new Set(['a']));
    });

    it('should handle words without morphological changes', async () => {
      const morphy = new Morphy();
      const result = await morphy.analyze('information', 'n');
      expect(result['n']).toEqual(new Set(['information']));
    });
  });
}); 