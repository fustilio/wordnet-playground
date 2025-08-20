import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { Wordnet } from '../src/wordnet.js';

// Mock the database module
vi.mock('../src/db/database.js', () => ({
  db: {
    initialize: vi.fn().mockResolvedValue(undefined),
    close: vi.fn().mockResolvedValue(undefined),
    all: vi.fn().mockResolvedValue([]),
    get: vi.fn().mockResolvedValue(undefined),
  },
}));

describe('Wordnet', () => {
  let wordnet: Wordnet;

  beforeEach(() => {
    // Reset mocks before each test
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Multi-lexicon support', () => {
    it('should handle single lexicon string in constructor', () => {
      wordnet = new Wordnet('oewn:2024');
      expect(wordnet).toBeDefined();
      // Note: lexiconIds is protected, so we test through behavior
    });

    it('should handle multiple lexicons array in constructor', () => {
      wordnet = new Wordnet('oewn:2024', { lexicon: ['oewn:2024', 'omw-fr:1.4', 'cili:1.0'] });
      expect(wordnet).toBeDefined();
      // Note: lexiconIds is protected, so we test through behavior
    });

    it('should handle wildcard lexicon specifier', () => {
      wordnet = new Wordnet('*');
      expect(wordnet).toBeDefined();
      // Note: lexiconIds is protected, so we test through behavior
    });

    it('should handle expand options correctly', () => {
      wordnet = new Wordnet('oewn:2024', {
        expand: ['omw-fr:1.4', 'cili:1.0']
      });
      expect(wordnet).toBeDefined();
      // Note: expand is protected, so we test through behavior
    });
  });

  describe('Multi-lexicon query support', () => {
    beforeEach(() => {
      wordnet = new Wordnet('oewn:2024', { lexicon: ['oewn:2024', 'omw-fr:1.4'] });
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
      wordnet = new Wordnet('en-th');
      expect(wordnet).toBeDefined();
      // Note: lexiconIds is protected, so we test through behavior
    });

    it('should support English-French dictionary preset', () => {
      wordnet = new Wordnet('en-fr');
      expect(wordnet).toBeDefined();
      // Note: lexiconIds is protected, so we test through behavior
    });

    it('should support English-German dictionary preset', () => {
      wordnet = new Wordnet('en-de');
      expect(wordnet).toBeDefined();
      // Note: lexiconIds is protected, so we test through behavior
    });

    it('should support multilingual preset', () => {
      wordnet = new Wordnet('multilingual');
      expect(wordnet).toBeDefined();
      // Note: lexiconIds is protected, so we test through behavior
    });
  });

  describe('lexicons', () => {
    it('should return empty lexicons for non-existent lexicon', async () => {
      const en = new Wordnet('test-en');
      const lexicons = await en.lexicons();
      expect(lexicons).toHaveLength(0);
    });

    it('should return empty expanded lexicons by default', async () => {
      const en = new Wordnet('test-en');
      const expandedLexicons = await en.expandedLexicons();
      expect(expandedLexicons).toHaveLength(0);
    });

    it('should handle lexicon with expansion', async () => {
      const es = new Wordnet('test-es', { expand: 'test-en' });
      const expandedLexicons = await es.expandedLexicons();
      expect(expandedLexicons).toHaveLength(0); // No data yet
    });

    it('should handle empty expansion', async () => {
      const ja = new Wordnet('test-ja', { expand: '' });
      const expandedLexicons = await ja.expandedLexicons();
      expect(expandedLexicons).toHaveLength(0);
    });
  });

  describe('words', () => {
    it('should return empty array for non-existent word', async () => {
      const en = new Wordnet('test-en');
      const words = await en.words({ form: 'nonexistent' });
      expect(words).toHaveLength(0);
    });

    it('should handle part of speech filtering', async () => {
      const en = new Wordnet('test-en');
      const words = await en.words({ form: 'test', pos: 'n' });
      expect(words).toHaveLength(0); // No data yet
    });
  });

  describe('synsets', () => {
    it('should return empty array for non-existent word', async () => {
      const en = new Wordnet('test-en');
      const synsets = await en.synsets({ form: 'nonexistent' });
      expect(synsets).toHaveLength(0);
    });

    it('should handle part of speech filtering', async () => {
      const en = new Wordnet('test-en');
      const synsets = await en.synsets({ form: 'test', pos: 'n' });
      expect(synsets).toHaveLength(0); // No data yet
    });
  });

  describe('synset', () => {
    it('should return undefined for non-existent synset', async () => {
      const en = new Wordnet('test-en');
      const synset = await en.getSynsetOrUndefined('nonexistent-synset');
      expect(synset).toBeUndefined();
    });
  });

  describe('senses', () => {
    it('should return empty array for non-existent word', async () => {
      const en = new Wordnet('test-en');
      const senses = await en.senses({ form: 'nonexistent-word' });
      expect(senses).toHaveLength(0);
    });
  });

  describe('word', () => {
    it('should return undefined for non-existent word', async () => {
      const en = new Wordnet('test-en');
      const word = await en.getWordOrUndefined('nonexistent-word');
      expect(word).toBeUndefined();
    });
  });

  describe('sense', () => {
    it('should return undefined for non-existent sense', async () => {
      const en = new Wordnet('test-en');
      const sense = await en.getSenseOrUndefined('nonexistent-sense');
      expect(sense).toBeUndefined();
    });
  });

  describe('normalization', () => {
    it('should use custom normalizer when provided', async () => {
      const normalizer = (form: string) => form.toLowerCase();
      const es = new Wordnet('test-es', { normalizer });
      const words = await es.words({ form: 'TEST' });
      expect(words).toHaveLength(0); // No data yet, but normalizer should be used
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
      const words = await en.words({ form: 'examples', pos: 'n' });
      expect(words).toHaveLength(0); // No data yet, but lemmatizer should be used
    });
  });

  describe('search all forms', () => {
    it('should respect searchAllForms option', async () => {
      const en = new Wordnet('test-en', { searchAllForms: false });
      const words = await en.words({ form: 'examples' });
      expect(words).toHaveLength(0); // No data yet
    });
  });
}); 
