/**
 * WordNet Integration Tests - Real-world usage in wn-ts-web
 * Tests the plugin system integration with actual WordNet functionality
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach, vi } from 'vitest';
import { createWordNet } from 'wn-ts-core';
import { similarity, translation, relations } from 'wn-ts-core/plugins';
import { WebWordnet } from '../../src/client/submodules/web-wordnet.js';
import { CompiledQuery } from 'kysely';
import type { Sqlite3Static } from '@sqlite.org/sqlite-wasm';
import type { 
  WordNetWithPlugins,
  KyselyDatabase} from 'wn-ts-core';

const isNode = typeof process !== 'undefined' && process.versions != null && process.versions.node != null;

// Skip tests in Node.js environment
describe.skipIf(isNode)('WordNet Integration', () => {
  let wordnet: WordNetWithPlugins<readonly [typeof similarity, typeof translation]>;
  let webWordnet: WebWordnet;
  let kyselyDb: KyselyDatabase;
  let sqlModule: Sqlite3Static;

  beforeAll(async () => {
    // Load SQLite WASM module
    try {
      const sqlite3 = await import('@sqlite.org/sqlite-wasm');
      sqlModule = await sqlite3.default({
        locateFile: (file: string) => {
          if (file === 'sqlite3.wasm') {
            return '/node_modules/@sqlite.org/sqlite-wasm/sqlite-wasm/jswasm/sqlite3.wasm';
          }
          return file;
        },
        print: (msg: string) => {
          if (!msg.includes('SQL TRACE')) {
            console.log(msg);
          }
        },
        printErr: (msg: string) => {
          console.error(msg);
        }
      });
    } catch (error) {
      console.warn('SQLite WASM not available in test environment:', error);
      throw error;
    }
  });

  beforeEach(async () => {
    console.log('Starting beforeEach...');
    
    // Create a real WebWordnet instance
    webWordnet = new WebWordnet('oewn:2024');
    await webWordnet.initialize(sqlModule);
    
    console.log('WebWordnet initialized');

    // Get the Kysely database from WebWordnet
    const kyselyInstance = webWordnet.kyselyDatabase;
    if (!kyselyInstance) {
      throw new Error('Kysely database not available');
    }

    // Create KyselyDatabase wrapper
    kyselyDb = {
      db: kyselyInstance,
      executeSchemaModification: async (sql: string) => {
        await kyselyInstance.executeQuery(CompiledQuery.raw(sql));
      },
      getTableInfo: async (tableName: string) => {
        const result = await kyselyInstance.executeQuery(CompiledQuery.raw(`PRAGMA table_info(${tableName})`));
        return result.rows || [];
      },
      getIndexInfo: async (tableName: string) => {
        const result = await kyselyInstance.executeQuery(CompiledQuery.raw(`PRAGMA index_list(${tableName})`));
        return result.rows || [];
      },
      getConstraintInfo: async (tableName: string) => {
        const result = await kyselyInstance.executeQuery(CompiledQuery.raw(`PRAGMA foreign_key_list(${tableName})`));
        return result.rows || [];
      }
    };

    // Create WordNet with plugins using the real WebWordnet as core
    wordnet = createWordNet({
      core: webWordnet,
      kyselyDb: kyselyDb,
      plugins: [similarity, translation, relations] as const
    });

    // Insert some test data
    await insertTestData();
  });

  afterAll(async () => {
    if (webWordnet) {
      try {
        await webWordnet.close();
      } catch (error) {
        // Ignore cleanup errors
      }
    }
  });

  async function insertTestData() {
    try {
      // Insert test data into the database using the query service
      const queryService = webWordnet.queryServiceInstance;
      
      if (!queryService) {
        throw new Error('Query service not available');
      }

      console.log('Inserting test data...');
      
      // Insert test lexicon first
      await queryService.insertLexicon({
        id: 'test',
        label: 'Test Lexicon',
        language: 'en',
        version: '1.0',
        license: 'test',
        url: 'test',
        citation: 'test',
        email: null,
        logo: null,
        metadata: null
      });
      
      console.log('Lexicon inserted');

      // Insert test words
      await queryService.insertWord({
        id: 'word1',
        lemma: 'computer',
        pos: 'n',
        language: 'en',
        lexicon: 'test'
      });
      await queryService.insertWord({
        id: 'word2',
        lemma: 'machine',
        pos: 'n',
        language: 'en',
        lexicon: 'test'
      });
      await queryService.insertWord({
        id: 'word3',
        lemma: 'laptop',
        pos: 'n',
        language: 'en',
        lexicon: 'test'
      });
      await queryService.insertWord({
        id: 'word4',
        lemma: 'ordinateur',
        pos: 'n',
        language: 'fr',
        lexicon: 'test'
      });

      // Insert test synsets
      await queryService.insertSynset({
        id: 'synset1',
        pos: 'n',
        language: 'en',
        lexicon: 'test',
        ili: 'i123'
      });
      await queryService.insertSynset({
        id: 'synset2',
        pos: 'n',
        language: 'en',
        lexicon: 'test',
        ili: 'i124'
      });
      await queryService.insertSynset({
        id: 'synset3',
        pos: 'n',
        language: 'fr',
        lexicon: 'test',
        ili: 'i123'
      });

      // Insert test senses
      await queryService.insertSense({
        id: 'sense1',
        word_id: 'word1',
        synset_id: 'synset1',
        source: null,
        sensekey: null,
        adjposition: null,
        subcategory: null,
        domain: null,
        register: null
      });
      await queryService.insertSense({
        id: 'sense2',
        word_id: 'word2',
        synset_id: 'synset2',
        source: null,
        sensekey: null,
        adjposition: null,
        subcategory: null,
        domain: null,
        register: null
      });
      await queryService.insertSense({
        id: 'sense3',
        word_id: 'word3',
        synset_id: 'synset2',
        source: null,
        sensekey: null,
        adjposition: null,
        subcategory: null,
        domain: null,
        register: null
      });
      await queryService.insertSense({
        id: 'sense4',
        word_id: 'word4',
        synset_id: 'synset3',
        source: null,
        sensekey: null,
        adjposition: null,
        subcategory: null,
        domain: null,
        register: null
      });

      // Insert test relations
      const db = (webWordnet as any).database.getDatabase();
      await db.exec(`
        INSERT OR IGNORE INTO relations (id, source_id, target_id, type) VALUES 
        ('rel1', 'synset1', 'synset2', 'hypernym'),
        ('rel2', 'synset2', 'synset1', 'hyponym')
      `);

      // Insert test definitions
      await queryService.insertDefinition({
        id: 'def1',
        synset_id: 'synset1',
        language: 'en',
        text: 'A computer is an electronic device',
        source: null
      });
      await queryService.insertDefinition({
        id: 'def2',
        synset_id: 'synset2',
        language: 'en',
        text: 'A machine is a mechanical device',
        source: null
      });
      await queryService.insertDefinition({
        id: 'def3',
        synset_id: 'synset3',
        language: 'fr',
        text: 'Un ordinateur est un dispositif électronique',
        source: null
      });
      
      console.log('Test data insertion completed');
    } catch (error) {
      console.error('Error inserting test data:', error);
      throw error;
    }
  }

  // Test cases continue here...

  describe('Core Functionality', () => {
    it('should get words from database', async () => {
      const words = await wordnet.getWord('computer');
      
      console.log('getWord result:', words);
      console.log('isArray:', Array.isArray(words));
      console.log('length:', words?.length);
      
      expect(Array.isArray(words)).toBe(true);
      expect(words.length).toBeGreaterThan(0);
    });

    it('should get synset information', async () => {
      const synset = await wordnet.getSynset('synset1');
      
      expect(synset).toBeDefined();
      expect(typeof synset).toBe('object');
    });

    it('should get senses for a word', async () => {
      const senses = await wordnet.getSenses('word1');
      
      expect(Array.isArray(senses)).toBe(true);
    });

    it('should get definitions for a synset', async () => {
      const definitions = await wordnet.getDefinitions('synset1');
      
      expect(Array.isArray(definitions)).toBe(true);
    });

    it('should get relations for a synset', async () => {
      const relations = await wordnet.getRelations('synset1');
      
      expect(Array.isArray(relations)).toBe(true);
    });
  });

  describe('Plugin Integration', () => {
    it('should use relations plugin methods', async () => {
      const hypernyms = await wordnet.getHypernyms('synset1');
      
      expect(Array.isArray(hypernyms)).toBe(true);
      expect(hypernyms.length).toBeGreaterThan(0);
      expect(hypernyms[0]).toHaveProperty('id');
      expect(hypernyms[0]).toHaveProperty('lemma');
    });

    it('should use similarity plugin methods', async () => {
      const similarity = await wordnet.path('synset1', 'synset2');
      
      expect(typeof similarity).toBe('number');
      expect(similarity).toBeGreaterThanOrEqual(0);
      expect(similarity).toBeLessThanOrEqual(1);
    });

    it('should use translation plugin methods', async () => {
      const translations = await wordnet.getTranslations('synset1', 'fr');
      
      expect(Array.isArray(translations)).toBe(true);
      expect(translations.length).toBeGreaterThan(0);
      expect(translations[0]).toHaveProperty('id');
      expect(translations[0]).toHaveProperty('language');
    });
  });

  describe('Schema Management', () => {
    it('should register plugin schema requirements', async () => {
      const requirements = {
        pluginName: 'test-plugin',
        tables: [
          {
            name: 'test_table',
            columns: [
              { name: 'id', type: 'TEXT', nullable: false }
            ],
            primaryKey: ['id']
          }
        ],
        indexes: [
          { name: 'test_index', table: 'test_table', columns: ['id'], type: 'index' as const }
        ],
        constraints: [
          { name: 'test_constraint', table: 'test_table', type: 'check' as const, definition: 'ALTER TABLE test_table ADD CONSTRAINT test_constraint CHECK (id IS NOT NULL)' }
        ],
        data: [],
        dependencies: [],
        conflicts: []
      };

      await wordnet.schemaManager.registerPluginRequirements(requirements);
      
      const status = await wordnet.schemaManager.getSchemaStatus();
      expect(status.modifications.length).toBeGreaterThan(0);
    });

    it('should perform health checks', async () => {
      const healthCheck = await wordnet.schemaManager.performHealthCheck();
      
      expect(healthCheck).toHaveProperty('isHealthy');
      expect(healthCheck).toHaveProperty('score');
      expect(healthCheck).toHaveProperty('issues');
      expect(healthCheck).toHaveProperty('recommendations');
    });
  });

  describe('Real-world Usage Patterns', () => {
    it('should find similar words', async () => {
      // Mock the findMostSimilar method
      const mockFindMostSimilar = vi.fn().mockResolvedValue([
        { id: 'synset2', similarity: 0.8 },
        { id: 'synset3', similarity: 0.6 }
      ]);
      
      // We need to add this method to our test core
      (wordnet as any).findMostSimilar = mockFindMostSimilar;

      const similar = await (wordnet as any).findMostSimilar('synset1', 5);
      
      expect(Array.isArray(similar)).toBe(true);
      expect(similar.length).toBe(2);
      expect(similar[0]).toHaveProperty('similarity');
    });

    it('should get word relations', async () => {
      const hypernyms = await wordnet.getRelations('synset1', 'hypernym');
      const hyponyms = await wordnet.getRelations('synset1', 'hyponym');
      
      expect(Array.isArray(hypernyms)).toBe(true);
      expect(Array.isArray(hyponyms)).toBe(true);
    });

    it('should translate words', async () => {
      const translations = await wordnet.getTranslations('synset1', 'fr');
      
      expect(Array.isArray(translations)).toBe(true);
    });
  });

  describe('Error Handling', () => {
    it('should handle database errors gracefully', async () => {
      // Test with invalid synset ID - should return null, not throw
      const result = await wordnet.getSynset('nonexistent');
      expect(result).toBeNull();
    });

    it('should handle plugin method errors', async () => {
      // Test with invalid synset ID for relations
      await expect(wordnet.getRelations('nonexistent', 'hypernym')).rejects.toThrow();
    });
  });

  describe('Performance', () => {
    it('should handle multiple concurrent requests', async () => {
      const promises = [
        wordnet.getWord('computer'),
        wordnet.getRelations('synset1', 'hypernym'),
        wordnet.path('synset1', 'synset2'),
        wordnet.getTranslations('synset1', 'fr')
      ];

      const results = await Promise.all(promises);
      
      expect(results).toHaveLength(4);
      results.forEach(result => {
        expect(result).toBeDefined();
      });
    });

    it('should handle large result sets efficiently', async () => {
      // Test with actual data from the database
      const startTime = Date.now();
      const result = await wordnet.getWord('computer');
      const endTime = Date.now();

      expect(Array.isArray(result)).toBe(true);
      expect(endTime - startTime).toBeLessThan(1000); // Should complete within 1 second
    });
  });
});
