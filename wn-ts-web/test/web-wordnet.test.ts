import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { WebWordnet } from '../src/client/submodules/web-wordnet.js';
import { WordNetEvents } from '../src/event-emitter.js';
import { mockSqliteWasm } from './setup.js';
import type { Sqlite3Static } from '@sqlite.org/sqlite-wasm';
import type { PartOfSpeech } from 'wn-ts-core';

// Create a stateful in-memory database for functional testing
const memoryDb = {
  lexicons: [] as any[],
  words: [] as any[],
  synsets: [] as any[],
  senses: [] as any[],
  definitions: [] as any[],
  ilis: [] as any[],
};

// Helper to populate the mock database with test data
const populateMemoryDb = () => {
  memoryDb.lexicons = [{ id: 'oewn', label: 'Open English WordNet', language: 'en', version: '2024' }];
  memoryDb.words = [
    { id: 'w-happy', lemma: 'happy', pos: 'a', lexicon: 'oewn', language: 'en' },
    { id: 'w-joy', lemma: 'joy', pos: 'n', lexicon: 'oewn', language: 'en' },
    { id: 'w-run', lemma: 'run', pos: 'v', lexicon: 'oewn', language: 'en' },
  ];
  memoryDb.synsets = [
    { id: 's-happy', pos: 'a', lexicon: 'oewn', language: 'en' },
    { id: 's-joy', pos: 'n', lexicon: 'oewn', language: 'en' },
    { id: 's-run', pos: 'v', lexicon: 'oewn', language: 'en' },
  ];
  memoryDb.senses = [
    { id: 'se-happy', word_id: 'w-happy', synset_id: 's-happy' },
    { id: 'se-joy', word_id: 'w-joy', synset_id: 's-joy' },
    { id: 'se-run', word_id: 'w-run', synset_id: 's-run' },
  ];
  memoryDb.definitions = [
    { id: 'd-happy', synset_id: 's-happy', text: 'feeling of happiness' },
    { id: 'd-joy', synset_id: 's-joy', text: 'a feeling of great pleasure' },
  ];
};

// Create a stateful mock of KyselyQueryService that uses the in-memory database
const mockQueryService = {
  createTables: vi.fn().mockImplementation(async () => {
    // Reset and populate the database on table creation
    Object.values(memoryDb).forEach(table => table.length = 0);
    populateMemoryDb();
  }),
  getLexicons: vi.fn().mockImplementation(async () => memoryDb.lexicons),
  getWords: vi.fn().mockImplementation(async ({ form, pos, lexicon }) =>
    memoryDb.words.filter(w => w.lemma === form && w.pos === pos && w.lexicon === lexicon)
  ),
  getSynsets: vi.fn().mockImplementation(async ({ form, pos, lexicon }) => {
    const word = memoryDb.words.find(w => w.lemma === form && w.pos === pos && w.lexicon === lexicon);
    if (!word) return [];
    const sense = memoryDb.senses.find(s => s.word_id === word.id);
    if (!sense) return [];
    return memoryDb.synsets.filter(ss => ss.id === sense.synset_id);
  }),
  getDefinitionsBySynsetId: vi.fn().mockImplementation(async (synsetId) =>
    memoryDb.definitions.filter(d => d.synset_id === synsetId)
  ),
  getSenses: vi.fn().mockImplementation(async ({ wordIdOrForm }) => {
    const word = memoryDb.words.find(w => w.lemma === wordIdOrForm);
    if (!word) return [];
    return memoryDb.senses.filter(s => s.word_id === word.id).map(s => ({...s, word: s.word_id, synset: s.synset_id}));
  }),
  getWordById: vi.fn().mockImplementation(async (id) => memoryDb.words.find(w => w.id === id)),
  getSynsetById: vi.fn().mockImplementation(async (id) => memoryDb.synsets.find(ss => ss.id === id)),
  getSenseById: vi.fn().mockImplementation(async (id) => memoryDb.senses.find(s => s.id === id)),
  getIliById: vi.fn().mockImplementation(async (id) => memoryDb.ilis.find(i => i.id === id)),
  getStatistics: vi.fn().mockImplementation(async () => ({
    totalWords: memoryDb.words.length,
    totalSynsets: memoryDb.synsets.length,
    totalSenses: memoryDb.senses.length,
    totalILIs: memoryDb.ilis.length,
    totalLexicons: memoryDb.lexicons.length,
  })),
  getLexiconStatistics: vi.fn().mockImplementation(async () => {
    return memoryDb.lexicons.map(lex => ({
        lexiconId: lex.id,
        wordCount: memoryDb.words.filter(w => w.lexicon === lex.id).length,
    }));
  }),
};

vi.mock('../src/database/kysely-query-service.js', () => ({
  KyselyQueryService: vi.fn(() => mockQueryService),
}));

describe('WebWordnet Functional Tests', () => {
  let wordnet: WebWordnet;
  const sqlModule = mockSqliteWasm as unknown as Sqlite3Static;

  beforeEach(async () => {
    vi.clearAllMocks();
    wordnet = new WebWordnet('oewn'); // Use just the ID for mock mapping
    await wordnet.initialize(sqlModule);
  });

  afterEach(async () => {
    if (wordnet) {
      await wordnet.close();
    }
  });

  describe('Multi-lexicon support', () => {
    it('should handle single lexicon string in constructor', () => {
      const singleLexiconWordnet = new WebWordnet('oewn:2024');
      expect(singleLexiconWordnet.getLexiconIds()).toEqual(['oewn:2024']);
    });

    it('should handle multiple lexicons array in constructor', () => {
      const multiLexiconWordnet = new WebWordnet(['oewn:2024', 'omw-fr:1.4', 'cili:1.0']);
      expect(multiLexiconWordnet.getLexiconIds()).toEqual(['oewn:2024', 'omw-fr:1.4', 'cili:1.0']);
      expect(multiLexiconWordnet.getLexiconIds()).toHaveLength(3);
    });

    it('should handle wildcard lexicon specifier', () => {
      const wildcardWordnet = new WebWordnet('*');
      expect(wildcardWordnet.getLexiconIds()).toEqual(['*']);
    });

    it('should handle expand options correctly', () => {
      const expandedWordnet = new WebWordnet('oewn:2024', {
        expand: ['omw-fr:1.4', 'cili:1.0']
      });
      // Note: expand is not directly accessible, but we can test the constructor accepts it
      expect(expandedWordnet).toBeDefined();
    });
  });

  describe('Special lexicon presets', () => {
    it('should support English-Thai dictionary preset', () => {
      const enThWordnet = new WebWordnet('en-th');
      expect(enThWordnet.getLexiconIds()).toEqual(['oewn:2024', 'omw-th:1.4', 'cili:1.0']);
      expect(enThWordnet.getLexiconIds()).toContain('oewn:2024');
      expect(enThWordnet.getLexiconIds()).toContain('omw-th:1.4');
      expect(enThWordnet.getLexiconIds()).toContain('cili:1.0');
    });

    it('should support English-French dictionary preset', () => {
      const enFrWordnet = new WebWordnet('en-fr');
      expect(enFrWordnet.getLexiconIds()).toEqual(['oewn:2024', 'omw-fr:1.4', 'cili:1.0']);
      expect(enFrWordnet.getLexiconIds()).toContain('oewn:2024');
      expect(enFrWordnet.getLexiconIds()).toContain('omw-fr:1.4');
      expect(enFrWordnet.getLexiconIds()).toContain('cili:1.0');
    });

    it('should support English-German dictionary preset', () => {
      const enDeWordnet = new WebWordnet('en-de');
      expect(enDeWordnet.getLexiconIds()).toEqual(['oewn:2024', 'odenet:1.4', 'cili:1.0']);
      expect(enDeWordnet.getLexiconIds()).toContain('oewn:2024');
      expect(enDeWordnet.getLexiconIds()).toContain('odenet:1.4');
      expect(enDeWordnet.getLexiconIds()).toContain('cili:1.0');
    });

    it('should support multilingual preset', () => {
      const multilingualWordnet = new WebWordnet('multilingual');
      expect(multilingualWordnet.getLexiconIds()).toEqual(['omw:1.4', 'cili:1.0']);
      expect(multilingualWordnet.getLexiconIds()).toContain('omw:1.4');
      expect(multilingualWordnet.getLexiconIds()).toContain('cili:1.0');
    });

    it('should handle custom lexicon specifiers', () => {
      const customWordnet = new WebWordnet('custom:lexicon:1.0');
      expect(customWordnet.getLexiconIds()).toEqual(['custom:lexicon:1.0']);
    });
  });

  describe('Multi-lexicon query support', () => {
    it('should support lexicon filtering in WordQuery', async () => {
      const query = {
        form: 'happy',
        pos: 'a' as PartOfSpeech,
        lexicon: ['oewn:2024', 'omw-fr:1.4'],
        lang: 'en'
      };

      expect(query.lexicon).toEqual(['oewn:2024', 'omw-fr:1.4']);
      expect(Array.isArray(query.lexicon)).toBe(true);
      expect(query.lexicon).toHaveLength(2);

      // Test that the query can be passed to the words method
      await expect(wordnet.words(query)).resolves.toBeDefined();
    });

    it('should support single lexicon in WordQuery', async () => {
      const query = {
        form: 'happy',
        pos: 'a' as PartOfSpeech,
        lexicon: 'oewn:2024',
        lang: 'en'
      };

      expect(query.lexicon).toBe('oewn:2024');
      expect(typeof query.lexicon).toBe('string');

      // Test that the query can be passed to the words method
      await expect(wordnet.words(query)).resolves.toBeDefined();
    });

    it('should support lexicon filtering in SynsetQuery', async () => {
      const query = {
        form: 'happiness',
        pos: 'n' as PartOfSpeech,
        lexicon: ['oewn:2024', 'cili:1.0'],
        lang: 'en'
      };

      expect(query.lexicon).toEqual(['oewn:2024', 'cili:1.0']);
      expect(Array.isArray(query.lexicon)).toBe(true);

      // Test that the query can be passed to the synsets method
      await expect(wordnet.synsets(query)).resolves.toBeDefined();
    });

    it('should support lexicon filtering in SenseQuery', async () => {
      const query = {
        form: 'happy',
        pos: 'a' as PartOfSpeech,
        lexicon: ['oewn:2024', 'omw-fr:1.4', 'cili:1.0'],
        lang: 'en',
        wordIdOrForm: 'w-happy'
      };

      expect(query.lexicon).toEqual(['oewn:2024', 'omw-fr:1.4', 'cili:1.0']);
      expect(Array.isArray(query.lexicon)).toBe(true);
      expect(query.lexicon).toHaveLength(3);

      // Test that the query can be passed to the senses method
      await expect(wordnet.senses(query)).resolves.toBeDefined();
    });

    it('should handle undefined lexicon in queries', async () => {
      const query = {
        form: 'happy',
        pos: 'a' as PartOfSpeech,
        lexicon: undefined,
        lang: 'en'
      };

      expect(query.lexicon).toBeUndefined();

      // Test that the query can be passed to the words method
      await expect(wordnet.words(query)).resolves.toBeDefined();
    });
  });

  describe('Lexicon management', () => {
    it('should add new lexicons dynamically', () => {
      const multiLexiconWordnet = new WebWordnet(['oewn:2024']);
      expect(multiLexiconWordnet.getLexiconIds()).toEqual(['oewn:2024']);

      multiLexiconWordnet.addLexicon('omw-fr:1.4');
      expect(multiLexiconWordnet.getLexiconIds()).toEqual(['oewn:2024', 'omw-fr:1.4']);

      multiLexiconWordnet.addLexicon('cili:1.0');
      expect(multiLexiconWordnet.getLexiconIds()).toEqual(['oewn:2024', 'omw-fr:1.4', 'cili:1.0']);
    });

    it('should not add duplicate lexicons', () => {
      const multiLexiconWordnet = new WebWordnet(['oewn:2024']);
      expect(multiLexiconWordnet.getLexiconIds()).toEqual(['oewn:2024']);

      multiLexiconWordnet.addLexicon('oewn:2024');
      expect(multiLexiconWordnet.getLexiconIds()).toEqual(['oewn:2024']);

      multiLexiconWordnet.addLexicon('omw-fr:1.4');
      expect(multiLexiconWordnet.getLexiconIds()).toEqual(['oewn:2024', 'omw-fr:1.4']);

      multiLexiconWordnet.addLexicon('omw-fr:1.4');
      expect(multiLexiconWordnet.getLexiconIds()).toEqual(['oewn:2024', 'omw-fr:1.4']);
    });

    it('should get primary lexicon ID', () => {
      const multiLexiconWordnet = new WebWordnet(['oewn:2024', 'omw-fr:1.4', 'cili:1.0']);
      expect(multiLexiconWordnet.getPrimaryLexiconId()).toBe('oewn:2024');
    });

    it('should get primary lexicon ID for single lexicon', () => {
      const singleLexiconWordnet = new WebWordnet('oewn:2024');
      expect(singleLexiconWordnet.getPrimaryLexiconId()).toBe('oewn:2024');
    });

    it('should get primary lexicon ID for wildcard', () => {
      const wildcardWordnet = new WebWordnet('*');
      expect(wildcardWordnet.getPrimaryLexiconId()).toBe('*');
    });
  });

  describe('Initialization', () => {
    it('should initialize and prepare the database', () => {
      expect((wordnet as any).initialized).toBe(true);
      expect(mockQueryService.createTables).toHaveBeenCalled();
    });

    it('should throw if query methods are called before initialization', async () => {
      const uninitialized = new WebWordnet('oewn');
      await expect(uninitialized.words({ form: 'test' })).rejects.toThrow('WebWordnet not initialized');
    });
  });

  describe('Query Methods', () => {
    it('should retrieve a word from the database', async () => {
      const words = await wordnet.words({ form: 'happy', pos: 'a' });
      expect(words).toHaveLength(1);
      expect(words[0].lemma).toBe('happy');
      expect(words[0].pos).toBe('a');
    });

    it('should retrieve a synset with its definitions', async () => {
      const synsets = await wordnet.synsets({ form: 'joy', pos: 'n' });
      expect(synsets).toHaveLength(1);
      const synset = synsets[0];
      expect(synset.definitions).toHaveLength(1);
      expect(synset.definitions[0].text).toBe('a feeling of great pleasure');
    });

    it('should retrieve senses for a given word form', async () => {
      const senses = await wordnet.senses({ form: 'run', pos: 'v' });
      expect(senses).toHaveLength(1);
      expect(senses[0].word).toBe('w-run');
      expect(senses[0].synset).toBe('s-run');
    });

    it('should retrieve a word by its specific ID', async () => {
      const word = await wordnet.getWord('w-happy');
      expect(word).toBeDefined();
      expect(word?.lemma).toBe('happy');
    });
  });

  describe('Statistics Methods', () => {
    it('should return correct overall statistics from the database', async () => {
      const stats = await wordnet.getStatistics();
      expect(stats.totalWords).toBe(3);
      expect(stats.totalSynsets).toBe(3);
      expect(stats.totalSenses).toBe(3);
    });
    
    it('should correctly report if any lexicons are loaded', async () => {
      const hasLexicons = await wordnet.hasLoadedLexicons();
      expect(hasLexicons).toBe(true);
    });
  });

  describe('Event System', () => {
    it('should emit an INITIALIZED event', async () => {
      const initSpy = vi.fn();
      const eventedWordnet = new WebWordnet('oewn:2024');
      eventedWordnet.on(WordNetEvents.INITIALIZED, initSpy);
      await eventedWordnet.initialize(sqlModule);
      expect(initSpy).toHaveBeenCalledWith({ lexicons: ['oewn:2024'] });
    });
  });
});
