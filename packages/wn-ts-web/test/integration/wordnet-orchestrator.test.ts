import { describe, it, expect, vi, beforeEach, afterEach, beforeAll } from 'vitest';
import { WordNetOrchestrator } from '../../src/workers/wordnet-orchestrator.js';
import { DataLoader } from '../../src/data-management/index.js';
import type { Sqlite3Static } from '@sqlite.org/sqlite-wasm';
import type { KyselyQueryService } from '../../src/database/kysely-query-service.js';

const isNode = typeof process !== 'undefined';

// Mock DataLoader to avoid network requests but use the real database
vi.mock('../../src/data-management/index.js', async (importOriginal) => {
  const original = await importOriginal<typeof import ('../../src/data-management/index.js')>();
  
  return {
    ...original,
    DataLoader: class MockDataLoader extends original.DataLoader {
      downloadCount = 0;
      
      getQueryService() {
        return (this as any).config.wordnet.getQueryService();
      }
      
      async downloadAndLoad(lexiconId: string) {
        this.downloadCount++;
        const queryService = this.getQueryService();
        if (queryService) {
          await this.insertTestData(queryService as any, lexiconId);
        }
      }

      async insertTestData(queryService: any, lexiconId: string) {
        // Check if lexicon already exists before inserting
        const existingLexicons = await queryService.getLexicons();
        const lexiconExists = existingLexicons.some((l: any) => l.id === lexiconId);
        
        if (!lexiconExists) {
          await queryService.insertLexicon({ 
            id: lexiconId, 
            label: 'Test Lexicon', 
            language: 'en', 
            version: '1.0',
            email: null,
            license: null,
            url: null,
            citation: null,
            logo: null,
            metadata: null
          });
        }
        
        // Check if word already exists before inserting
        const existingWords = await queryService.getWords({ lexicon: lexiconId });
        const wordExists = existingWords.some((w: any) => w.id === `w-${lexiconId}-test`);
        
        if (!wordExists) {
          await queryService.insertWord({ id: `w-${lexiconId}-test`, lemma: 'test', pos: 'n', lexicon: lexiconId, language: 'en' });
          await queryService.insertSynset({ id: `s-${lexiconId}-test`, pos: 'n', lexicon: lexiconId, language: 'en', ili: null });
          await queryService.insertSense({ 
            id: `se-${lexiconId}-test`, 
            word_id: `w-${lexiconId}-test`, 
            synset_id: `s-${lexiconId}-test`,
            source: null,
            sensekey: null,
            adjposition: null,
            subcategory: null,
            domain: null,
            register: null
          });
        }
      }
    }
  };
});


describe('WordNetOrchestrator with Real Browser DB', () => {
  let orchestrator: WordNetOrchestrator;
  let sqlModule: Sqlite3Static;

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
    orchestrator = new WordNetOrchestrator();
    await orchestrator.initialize(sqlModule);
    await orchestrator.clearAllData(); // Clear data before each test
  });

  afterEach(async () => {
    if (orchestrator) {
      await orchestrator.close();
    }
  });

  describe('Initialization', () => {
    it('should initialize and create a WordNet instance', () => {
      expect(orchestrator.getWordNetInstance()).toBeDefined();
    });
  });

  describe('Lexicon Loading', () => {
    it('should load a lexicon, update its state, and insert data', async () => {
      await orchestrator.loadLexicon('oewn:2024');
      const state = orchestrator.getLexiconState('oewn:2024');
      
      expect(state?.status).toBe('loaded');

      const stats = await orchestrator.getOverallStatistics();
      expect(stats.totalWords).toBe(1);
      expect(stats.totalLexicons).toBe(1);
    });
    
    it('should not re-load an already loaded lexicon unless forced', async () => {
      await orchestrator.loadLexicon('oewn:2024');
      let stats = await orchestrator.getLexiconStatistics('oewn:2024');
      expect(stats[0].wordCount).toBe(1);
      
      // Spy on the data loader's method
      const dataLoader = (orchestrator as any).dataLoader as DataLoader;
      const downloadSpy = vi.spyOn(dataLoader, 'downloadAndLoad');

      // Second load should be skipped
      await orchestrator.loadLexicon('oewn:2024');
      expect(downloadSpy).not.toHaveBeenCalled();

      // Forced reload
      await orchestrator.loadLexicon('oewn:2024', { forceRedownload: true });
      expect(downloadSpy).toHaveBeenCalled();
    });
  });

  describe('Querying', () => {
    it('should only return query results for lexicons that have been loaded', async () => {
      let words = await orchestrator.queryWords('test', 'n');
      expect(words).toEqual([]); // No lexicons loaded yet

      await orchestrator.loadLexicon('oewn:2024');

      words = await orchestrator.queryWords('test', 'n');
      expect(words).toHaveLength(1);
      expect(words[0].lemma).toBe('test');
    });
  });
  
  describe('Data Management', () => {
    it('should clear all loaded data and reset internal state', async () => {
      await orchestrator.loadLexicon('oewn:2024');
      expect(orchestrator.getLexiconStates().size).toBe(1);
      
      let stats = await orchestrator.getOverallStatistics();
      expect(stats.totalWords).toBe(1);

      await orchestrator.clearAllData();

      expect(orchestrator.getLexiconStates().size).toBe(0);
      stats = await orchestrator.getOverallStatistics();
      expect(stats.totalWords).toBe(0);
    });
  });
});
