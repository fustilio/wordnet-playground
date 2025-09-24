import { describe, it, expect, vi, beforeEach, afterEach, beforeAll } from 'vitest';
import { WebWordnet } from '../../src/client/submodules/web-wordnet.js';
import { WordNetEvents } from '../../src/event-emitter.js';
import type { Sqlite3Static } from '@sqlite.org/sqlite-wasm';
import type { KyselyQueryService } from '../../src/database/kysely-query-service.js';

const isNode = typeof process !== 'undefined';

describe('WebWordnet with Real Browser DB', () => {
  let wordnet: WebWordnet;
  let sqlModule: Sqlite3Static;
  let queryService: KyselyQueryService;

  beforeAll(async () => {
    try {
      const sqlite3 = (await import('@sqlite.org/sqlite-wasm')).default;
      sqlModule = await sqlite3();
    } catch (e) {
      console.warn('Could not load sqlite-wasm, skipping tests');
    }
  });

  beforeEach(async () => {
    if (!sqlModule) {
      throw new Error("SQLite WASM module not loaded");
    }

    wordnet = new WebWordnet('oewn');
    await wordnet.initialize(sqlModule);
    queryService = wordnet.getQueryService()!;

    // Insert test data
    await queryService.clearAllData();
    await queryService.insertLexicon({ id: 'oewn', label: 'Open English WordNet', language: 'en', version: '2024' });
    await queryService.insertWord({ id: 'w-happy', lemma: 'happy', pos: 'a', lexicon: 'oewn', language: 'en' });
    await queryService.insertWord({ id: 'w-joy', lemma: 'joy', pos: 'n', lexicon: 'oewn', language: 'en' });
    await queryService.insertWord({ id: 'w-run', lemma: 'run', pos: 'v', lexicon: 'oewn', language: 'en' });
    await queryService.insertSynset({ id: 's-happy', pos: 'a', lexicon: 'oewn', language: 'en' });
    await queryService.insertSynset({ id: 's-joy', pos: 'n', lexicon: 'oewn', language: 'en' });
    await queryService.insertSynset({ id: 's-run', pos: 'v', lexicon: 'oewn', language: 'en' });
    await queryService.insertSense({ id: 'se-happy', word_id: 'w-happy', synset_id: 's-happy' });
    await queryService.insertSense({ id: 'se-joy', word_id: 'w-joy', synset_id: 's-joy' });
    await queryService.insertSense({ id: 'se-run', word_id: 'w-run', synset_id: 's-run' });
    await queryService.insertDefinition({ id: 'd-happy', synset_id: 's-happy', text: 'feeling of happiness', language: 'en' });
    await queryService.insertDefinition({ id: 'd-joy', synset_id: 's-joy', text: 'a feeling of great pleasure', language: 'en' });
  });

  afterEach(async () => {
    if (wordnet && wordnet.isInitialized) {
      await wordnet.close();
    }
  });

  describe('Initialization', () => {
    it('should initialize and prepare the database', () => {
      expect(wordnet.isInitialized).toBe(true);
      expect(queryService).toBeDefined();
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
      const senses = await wordnet.senses({ wordIdOrForm: 'run', pos: 'v' });
      expect(senses).toHaveLength(1);
      expect(senses[0].wordId).toBe('w-run');
      expect(senses[0].synsetId).toBe('s-run');
    });

    it('should retrieve a word by its specific ID', async () => {
      const word = await wordnet.getWordById('w-happy');
      expect(word).toBeDefined();
      expect(word!.lemma).toBe('happy');
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
