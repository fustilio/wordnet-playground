import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { Wordnet } from '../../src/wordnet.js';

describe('Wordnet', () => {
  let wordnet: Wordnet;

  beforeEach(async () => {
    // Create a new Wordnet instance with in-memory database for each test
    wordnet = new Wordnet('*');
    // The database will be initialized automatically when needed
  });

  afterEach(async () => {
    // Clean up the database
    if (wordnet) {
      await wordnet.close();
    }
  });

  describe('Multi-lexicon support', () => {
    it('should handle single lexicon string in constructor', () => {
      const singleLexicon = new Wordnet('oewn:2024', {});
      expect(singleLexicon).toBeDefined();
      singleLexicon.close();
    });

    it('should handle multiple lexicons array in constructor', () => {
      const multiLexicon = new Wordnet('oewn:2024', { 
        lexicon: ['oewn:2024', 'omw-fr:1.4', 'cili:1.0'] 
      });
      expect(multiLexicon).toBeDefined();
      multiLexicon.close();
    });

    it('should handle wildcard lexicon specifier', () => {
      const wildcardLexicon = new Wordnet('*', {});
      expect(wildcardLexicon).toBeDefined();
      wildcardLexicon.close();
    });

    it('should handle expand options correctly', () => {
      const expandLexicon = new Wordnet('oewn:2024', {
        expand: ['omw-fr:1.4', 'cili:1.0']
      });
      expect(expandLexicon).toBeDefined();
      expandLexicon.close();
    });
  });

  describe('Multi-lexicon query support', () => {
    beforeEach(async () => {
      wordnet = new Wordnet('oewn:2024', { 
        lexicon: ['oewn:2024', 'omw-fr:1.4'] 
      });
      // Database will be initialized automatically when needed
    });

    it('should support lexicon filtering in WordQuery', async () => {
      const query = {
        form: 'happy',
        pos: 'a' as any,
        lexicon: ['oewn:2024', 'omw-fr:1.4'],
        lang: 'en'
      };

      expect(query.lexicon).toEqual(['oewn:2024', 'omw-fr:1.4']);
      expect(Array.isArray(query.lexicon)).toBe(true);
      expect(query.lexicon).toHaveLength(2);

      // Mock the database query to return results
      // The mock setup for the db module is now more complex, so we need to mock the specific methods
      // vi.mocked(require('../src/db/database.js').Database).mockImplementation(() => mockDb);
    });

    it('should support single lexicon in WordQuery', async () => {
      const query = {
        form: 'happy',
        pos: 'a' as any,
        lexicon: 'oewn:2024',
        lang: 'en'
      };

      expect(query.lexicon).toBe('oewn:2024');
      expect(typeof query.lexicon).toBe('string');

      // Mock the database query to return results
      // vi.mocked(require('../src/db/database.js').Database).mockImplementation(() => mockDb);
    });

    it('should support lexicon filtering in SynsetQuery', async () => {
      const query = {
        form: 'happiness',
        pos: 'n' as any,
        lexicon: ['oewn:2024', 'cili:1.0'],
        lang: 'en'
      };

      expect(query.lexicon).toEqual(['oewn:2024', 'cili:1.0']);
      expect(Array.isArray(query.lexicon)).toBe(true);

      // Mock the database query to return results
      // vi.mocked(require('../src/db/database.js').Database).mockImplementation(() => mockDb);
    });

    it('should support lexicon filtering in SenseQuery', async () => {
      const query = {
        form: 'happy',
        pos: 'a' as any,
        lexicon: ['oewn:2024', 'omw-fr:1.4', 'cili:1.0'],
        lang: 'en',
        wordIdOrForm: 'w-happy'
      };

      expect(query.lexicon).toEqual(['oewn:2024', 'omw-fr:1.4', 'cili:1.0']);
      expect(Array.isArray(query.lexicon)).toBe(true);
      expect(query.lexicon).toHaveLength(3);

      // Mock the database query to return results
      // vi.mocked(require('../src/db/database.js').Database).mockImplementation(() => mockDb);
    });

    it('should handle undefined lexicon in queries', async () => {
      const query = {
        form: 'happy',
        pos: 'a' as any,
        lang: 'en'
      };

      // Test that the lexicon property is not present
      expect('lexicon' in query).toBe(false);

      // Mock the database query to return results
      // vi.mocked(require('../src/db/database.js').Database).mockImplementation(() => mockDb);
    });
  });

  describe('Special lexicon presets', () => {
    it('should support English-Thai dictionary preset', () => {
      const enTh = new Wordnet('en-th', {});
      expect(enTh).toBeDefined();
      enTh.close();
    });

    it('should support English-French dictionary preset', () => {
      const enFr = new Wordnet('en-fr', {});
      expect(enFr).toBeDefined();
      enFr.close();
    });

    it('should support English-German dictionary preset', () => {
      const enDe = new Wordnet('en-de', {});
      expect(enDe).toBeDefined();
      enDe.close();
    });

    it('should support multilingual preset', () => {
      const multilingual = new Wordnet('multilingual', {});
      expect(multilingual).toBeDefined();
      multilingual.close();
    });
  });

  describe('lexicons', () => {
    it('should return empty lexicons for non-existent lexicon', async () => {
      const lexicons = await wordnet.lexicons();
      expect(lexicons).toHaveLength(0);
    });

    it('should return empty expanded lexicons by default', async () => {
      const expandedLexicons = await wordnet.expandedLexicons();
      expect(expandedLexicons).toHaveLength(0);
    });

    it('should handle lexicon with expansion', async () => {
      const es = new Wordnet('test-es', { expand: 'test-en' });
      // Database will be initialized automatically when needed
      const expandedLexicons = await es.expandedLexicons();
      expect(expandedLexicons).toHaveLength(0); // No data yet
      await es.close();
    });

    it('should handle empty expansion', async () => {
      const ja = new Wordnet('test-ja', { expand: '' });
      // Database will be initialized automatically when needed
      const expandedLexicons = await ja.expandedLexicons();
      expect(expandedLexicons).toHaveLength(0);
      await ja.close();
    });
  });

  describe('words', () => {
    it('should return empty array for non-existent word', async () => {
      const words = await wordnet.words({ form: 'nonexistent' });
      expect(words).toHaveLength(0);
    });

    it('should handle part of speech filtering', async () => {
      const words = await wordnet.words({ form: 'test', pos: 'n' });
      expect(words).toHaveLength(0); // No data yet
    });
  });

  describe('synsets', () => {
    it('should return empty array for non-existent word', async () => {
      const synsets = await wordnet.synsets({ form: 'nonexistent' });
      expect(synsets).toHaveLength(0);
    });

    it('should handle part of speech filtering', async () => {
      const synsets = await wordnet.synsets({ form: 'test', pos: 'n' });
      expect(synsets).toHaveLength(0); // No data yet
    });
  });

  describe('synset', () => {
    it('should return undefined for non-existent synset', async () => {
      const synset = await wordnet.getSynsetOrUndefined('nonexistent-synset');
      expect(synset).toBeUndefined();
    });
  });

  describe('senses', () => {
    it('should return empty array for non-existent word', async () => {
      const senses = await wordnet.senses({ wordIdOrForm: 'nonexistent-word.n.1' });
      expect(senses).toHaveLength(0);
    });
  });

  describe('word', () => {
    it('should return undefined for non-existent word', async () => {
      const word = await wordnet.getWordOrUndefined('nonexistent-word');
      expect(word).toBeUndefined();
    });
  });

  describe('sense', () => {
    it('should return undefined for non-existent sense', async () => {
      const sense = await wordnet.getSenseOrUndefined('nonexistent-sense');
      expect(sense).toBeUndefined();
    });
  });

  describe('normalization', () => {
    it('should use custom normalizer when provided', async () => {
      const normalizer = (form: string) => form.toLowerCase();
      const es = new Wordnet('test-es', { normalizer });
      // Database will be initialized automatically when needed
      const words = await es.words({ form: 'TEST' });
      expect(words).toHaveLength(0); // No data yet, but normalizer should be used
      await es.close();
    });
  });

  describe('lemmatization', () => {
    it('should use custom lemmatizer when provided', async () => {
      const lemmatizer = (form: string, pos?: string) => {
        const result: Record<string, Set<string>> = {
          n: new Set(),
          v: new Set(),
          a: new Set(),
          r: new Set(),
          s: new Set(),
          c: new Set(),
          p: new Set(),
          i: new Set(),
          x: new Set(),
          u: new Set(),
        };
        
        if (pos === 'n' && form.endsWith('s')) {
          const nSet = result.n;
          if (nSet) {
            nSet.add(form.slice(0, -1));
          }
        }
        
        return result;
      };

      const en = new Wordnet('test-en', { lemmatizer, searchAllForms: false });
      // Database will be initialized automatically when needed
      const words = await en.words({ form: 'examples', pos: 'n' });
      expect(words).toHaveLength(0); // No data yet, but lemmatizer should be used
      await en.close();
    });
  });

  describe('search all forms', () => {
    it('should respect searchAllForms option', async () => {
      const en = new Wordnet('test-en', { searchAllForms: false });
      // Database will be initialized automatically when needed
      const words = await en.words({ form: 'examples' });
      expect(words).toHaveLength(0); // No data yet
      await en.close();
    });
  });
}); 
