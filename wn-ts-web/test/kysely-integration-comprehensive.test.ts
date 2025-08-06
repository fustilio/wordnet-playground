/**
 * Comprehensive Kysely Integration Tests
 * 
 * These tests verify that Kysely is properly integrated with SQLite WASM
 * and that all the core functionality is working correctly.
 */

import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import { WebWordnet } from '../src/web-wordnet.js';
import { WebDatabase } from '../src/web-database.js';
import { KyselyQueryService } from '../src/database/kysely-query-service.js';
import { createWordNetInstance } from '../src/factory.js';
import type { Database } from '../src/types/database.js';
import { MockDataLoader } from './mock-data-loader.js';

// Mock dynamic import
vi.mock('@sqlite.org/sqlite-wasm', async () => {
  const mock = createMockSqliteWasm();
  return {
    ...mock,
    default: vi.fn().mockResolvedValue(mock),
  };
});

// Mock SQLite WASM for testing
const createMockSqliteWasm = () => {
  const mockData = {
    words: [
      { id: 'word1', lemma: 'test', part_of_speech: 'n', language: 'en', lexicon: 'oewn' },
      { id: 'word2', lemma: 'example', part_of_speech: 'n', language: 'en', lexicon: 'oewn' }
    ],
    synsets: [
      { id: 'synset1', ili: 'i1', part_of_speech: 'n', language: 'en', lexicon: 'oewn' },
      { id: 'synset2', ili: 'i2', part_of_speech: 'n', language: 'en', lexicon: 'oewn' }
    ],
    lexicons: [
      { id: 'oewn', label: 'Open English WordNet', language: 'en', version: '2024' }
    ],
    senses: [
      { id: 's1', word_id: 'word1', synset_id: 'synset1' },
      { id: 's2', word_id: 'word2', synset_id: 'synset2' },
    ],
    definitions: [
      { id: 'd1', synset_id: 'synset1', text: 'a test definition' },
      { id: 'd2', synset_id: 'synset2', text: 'an example definition' },
    ]
  };

  return {
    oo1: {
      DB: class MockDB {
        public sqlite3: any;

        constructor(path: string, mode: string) {
          this.sqlite3 = {
            capi: {
              sqlite3_last_insert_rowid: (db: any) => 1,
            },
          };
        }
        
        exec(sqlOrOptions: string | { sql: string; bind?: any[]; returnValue?: string; rowMode?: string; columnNames?: any[] }): void | any[] {
          const sql = typeof sqlOrOptions === 'string' ? sqlOrOptions : sqlOrOptions.sql;
          
          if (sql.includes('CREATE TABLE')) return;

          if (sql.toLowerCase().includes('select')) {
            if (sql.toLowerCase().includes('count')) {
              if (sql.includes('words')) return [{ count: mockData.words.length }];
              if (sql.includes('synsets')) return [{ count: mockData.synsets.length }];
              if (sql.includes('senses')) return [{ count: (mockData as any).senses.length }];
              if (sql.includes('ilis')) return [{ count: 0 }];
              if (sql.includes('lexicons')) return [{ count: mockData.lexicons.length }];
              return [{ count: 2 }];
            }
            if (sql.includes('words')) return mockData.words;
            if (sql.includes('synsets')) return mockData.synsets;
            if (sql.includes('lexicons')) return mockData.lexicons;
            if (sql.includes('senses')) return (mockData as any).senses || [];
            if (sql.includes('definitions')) return (mockData as any).definitions || [];
          }
          
          return [];
        }
        
        close(): void {
          // Mock close method
        }
        
        prepare(sql: string): any {
          const getResults = () => {
            if (sql.includes('words')) return mockData.words;
            if (sql.includes('synsets')) return mockData.synsets;
            if (sql.includes('lexicons')) return mockData.lexicons;
            if (sql.includes('senses')) return (mockData as any).senses || [];
            if (sql.includes('definitions')) return (mockData as any).definitions || [];
            if (sql.includes('COUNT(*)')) {
              if (sql.includes('words')) return [{ count: mockData.words.length }];
              if (sql.includes('synsets')) return [{ count: mockData.synsets.length }];
              if (sql.includes('lexicons')) return [{ count: mockData.lexicons.length }];
              return [{ count: 2 }];
            }
            return [];
          };
          const results = getResults();
          let stepIndex = -1;
  
          return {
            bind(index: number, value: any): void {},
            step(): boolean {
              stepIndex++;
              return stepIndex < results.length;
            },
            get(): any {
              return results[stepIndex];
            },
            getAsObject(): any {
              return results[stepIndex];
            },
            free(): void {}
          };
        }
        
        changes(reset?: boolean): number {
          return 1;
        }
      }
    }
  };
};

describe('Comprehensive Kysely Integration', () => {
  let wordnet: WebWordnet;
  let database: WebDatabase;
  let queryService: KyselyQueryService;

  beforeAll(async () => {
    // Create mock SQLite WASM
    const mockSqliteWasm = createMockSqliteWasm();
    
    // Create WebWordnet instance
    wordnet = new WebWordnet('oewn:2024');
    await wordnet.initialize(mockSqliteWasm);
    
    // Get the database and query service
    database = (wordnet as any).database;
    queryService = (wordnet as any).queryService;
  });

  afterAll(async () => {
    if (wordnet) {
      await wordnet.close();
    }
  });

  describe('Core Integration', () => {
    it('should initialize WebWordnet with Kysely', () => {
      expect(wordnet).toBeDefined();
      expect(database).toBeDefined();
      expect(queryService).toBeDefined();
    });

    it('should have query service available', () => {
      expect(queryService).toBeInstanceOf(KyselyQueryService);
    });

    it('should be initialized', () => {
      expect((wordnet as any).initialized).toBe(true);
    });
  });

  describe('Query Service Integration', () => {
    it('should get words through query service', async () => {
      const words = await queryService.getWords({
        form: 'test',
        lexicon: 'oewn',
        language: 'en'
      });
      
      expect(Array.isArray(words)).toBe(true);
    });

    it('should get synsets through query service', async () => {
      const synsets = await queryService.getSynsets({
        form: 'test',
        lexicon: 'oewn',
        language: 'en'
      });
      
      expect(Array.isArray(synsets)).toBe(true);
    });

    it('should get statistics through query service', async () => {
      const stats = await queryService.getStatistics();
      
      expect(stats).toHaveProperty('totalWords');
      expect(stats).toHaveProperty('totalSynsets');
      expect(stats).toHaveProperty('totalSenses');
      expect(stats).toHaveProperty('totalILIs');
      expect(stats).toHaveProperty('totalLexicons');
    });
  });

  describe('WebWordnet Methods', () => {
    it('should get words through WebWordnet', async () => {
      const words = await wordnet.words('test');
      expect(Array.isArray(words)).toBe(true);
    });

    it('should get synsets through WebWordnet', async () => {
      const synsets = await wordnet.synsets('test');
      expect(Array.isArray(synsets)).toBe(true);
    });

    it('should get statistics through WebWordnet', async () => {
      const stats = await wordnet.getStatistics();
      expect(stats).toHaveProperty('totalWords');
      expect(stats).toHaveProperty('totalSynsets');
      expect(stats).toHaveProperty('totalSenses');
      expect(stats).toHaveProperty('totalILIs');
      expect(stats).toHaveProperty('totalLexicons');
    });

    it('should get lexicons through WebWordnet', async () => {
      const lexicons = await wordnet.lexicons();
      expect(Array.isArray(lexicons)).toBe(true);
    });
  });

  describe('Factory Integration', () => {
    it('should create WordNet instance through factory with mock data', async () => {
      const { wordnet: factoryWordnet } = await createWordNetInstance('oewn:2024');
      
      expect(factoryWordnet).toBeInstanceOf(WebWordnet);

      // For this test, we want to use the MockDataLoader
      const mockDataLoader = new MockDataLoader((factoryWordnet as any).database, factoryWordnet);
      await mockDataLoader.loadMockData('oewn:2024');
      
      const lexicons = await factoryWordnet.lexicons();
      expect(lexicons.length).toBeGreaterThan(0);
      
      await factoryWordnet.close();
    });
  });

  describe('Error Handling', () => {
    it('should handle missing query service gracefully', async () => {
      // Create a wordnet without query service
      const wordnetWithoutQuery = new WebWordnet('oewn:2024');
      const mockSqliteWasm = createMockSqliteWasm();
      await wordnetWithoutQuery.initialize(mockSqliteWasm);
      
      // Manually remove query service
      (wordnetWithoutQuery as any).queryService = undefined;
      
      // This should throw an error
      await expect(wordnetWithoutQuery.words('test')).rejects.toThrow('WebWordnet not initialized');
      
      await wordnetWithoutQuery.close();
    });
  });

  describe('Data Quality Metrics', () => {
    it('should get data quality metrics', async () => {
      const metrics = await wordnet.getDataQualityMetrics();
      
      expect(metrics).toHaveProperty('synsetsWithILI');
      expect(metrics).toHaveProperty('synsetsWithoutILI');
      expect(metrics).toHaveProperty('iliCoveragePercentage');
      expect(metrics).toHaveProperty('emptySynsets');
      expect(metrics).toHaveProperty('synsetsWithDefinitions');
    });

    it('should get part of speech distribution', async () => {
      const distribution = await wordnet.getPartOfSpeechDistribution();
      
      expect(typeof distribution).toBe('object');
    });

    it('should get synset size analysis', async () => {
      const analysis = await wordnet.getSynsetSizeAnalysis();
      
      expect(analysis).toHaveProperty('averageSize');
      expect(analysis).toHaveProperty('maxSize');
      expect(analysis).toHaveProperty('minSize');
      expect(analysis).toHaveProperty('sizeDistribution');
    });
  });
}); 
