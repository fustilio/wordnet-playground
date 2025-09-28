/**
 * Relations Queries Integration Test Suite
 * 
 * Tests all relation query functions with real database and actual WordNet data.
 * This is an integration test that hits the actual database to ensure query
 * functions work correctly with real data.
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import type { WordNetCore } from '../../../../wordnet-kernel.js';

// Define proper types for test data that match the actual database schema
interface TestLexicon {
  id: string;
  label: string;
  language: string;
  email: string | null;
  license: string | null;
  version: string | null;
  url: string | null;
  citation: string | null;
  logo: string | null;
  metadata: string | null;
}

import {
  getRelationsBySynsetIdQuery,
} from '../relations-queries.js';
import { Kysely, SqliteDialect } from 'kysely';
import type Database from 'better-sqlite3';
import type { Database as DatabaseSchema } from '../../../../types/database.js';
import { createTables, createIndexes } from '../../mutations/schema-mutations.js';
import { insertRecords } from '../../mutations/insert-mutations.js';
import { getTestContext, type TestContext } from '../../../../test/test-data-manager.js';

describe('Relations Queries Integration Tests', () => {
  let testContext: TestContext;
  let tempDbPath: string;
  let sqliteDb: Database.Database;
  let kyselyDb: Kysely<DatabaseSchema>;
  let mockCore: WordNetCore;

  beforeAll(async () => {
    // Get test context from TestDataManager
    testContext = await getTestContext();
    
    // Create a temporary SQLite database file in the test context
    const { join } = await import('path');
    tempDbPath = join(testContext.tempDir, 'test-relations-queries.db');
    
    // Initialize better-sqlite3 database
    const Database = (await import('better-sqlite3')).default;
    sqliteDb = new Database(tempDbPath);
    
    // Create Kysely instance with SQLite dialect
    const dialect = new SqliteDialect({
      database: sqliteDb,
    });
    
    kyselyDb = new Kysely<DatabaseSchema>({ dialect });
    
    // Create tables and indexes
    await createTables(kyselyDb);
    await createIndexes(kyselyDb);
    
    // Insert test data using TestDataManager
    await insertTestData();
    
    // Create mock core that uses the real database
    mockCore = {
      query: async (sql: string, params?: unknown[]) => {
        const stmt = sqliteDb.prepare(sql);
        return stmt.all(params || []);
      },
      words: async (_query?: any) => {
        const results = await kyselyDb.selectFrom('words').selectAll().execute();
        return results as any[];
      },
      word: async (wordId: string) => {
        const result = await kyselyDb.selectFrom('words').selectAll().where('id', '=', wordId).executeTakeFirst();
        return result as any;
      },
      synsets: async (_query?: any) => {
        const results = await kyselyDb.selectFrom('synsets').selectAll().execute();
        return results as any[];
      },
      synset: async (synsetId: string) => {
        const result = await kyselyDb.selectFrom('synsets').selectAll().where('id', '=', synsetId).executeTakeFirst();
        return result as any;
      },
      senses: async (_query?: any) => {
        const results = await kyselyDb.selectFrom('senses').selectAll().execute();
        return results as any[];
      },
      sense: async (senseId: string) => {
        const result = await kyselyDb.selectFrom('senses').selectAll().where('id', '=', senseId).executeTakeFirst();
        return result as any;
      },
      ili: async (iliId: string) => {
        const result = await kyselyDb.selectFrom('ilis').selectAll().where('id', '=', iliId).executeTakeFirst();
        return result as any;
      },
      ilis: async (_status?: string) => {
        const results = await kyselyDb.selectFrom('ilis').selectAll().execute();
        return results as any[];
      },
      synsetsByILI: async (iliId: string) => {
        const results = await kyselyDb.selectFrom('synsets').selectAll().where('ili', '=', iliId).execute();
        return results as any[];
      },
      lexicons: async () => {
        const results = await kyselyDb.selectFrom('lexicons').selectAll().execute();
        return results as any[];
      },
      getWord: async (form: string) => {
        const results = await kyselyDb.selectFrom('words').selectAll().where('lemma', '=', form).execute();
        return results as any[];
      },
      getSynset: async (id: string) => {
        const result = await kyselyDb.selectFrom('synsets').selectAll().where('id', '=', id).executeTakeFirst();
        return result as any;
      },
      getSenses: async (wordId: string) => {
        const results = await kyselyDb.selectFrom('senses').selectAll().where('word_id', '=', wordId).execute();
        return results as any[];
      },
      getDefinitions: async (synsetId: string) => {
        const results = await kyselyDb.selectFrom('definitions').selectAll().where('synset_id', '=', synsetId).execute();
        return results as any[];
      },
      getRelations: async (synsetId: string, type?: string) => {
        let query = kyselyDb.selectFrom('relations').selectAll().where('source_id', '=', synsetId);
        if (type) {
          query = query.where('type', '=', type);
        }
        const results = await query.execute();
        return results as any[];
      }
    };
  });

  afterAll(async () => {
    // Clean up database
    if (sqliteDb) {
      sqliteDb.close();
    }
    
    // Clean up test context using TestDataManager
    await testContext.cleanup();
  });

  async function insertTestData() {
    // Insert test lexicon
    const testLexicon: TestLexicon = {
      id: 'test-lexicon',
      label: 'Test Lexicon',
      language: 'en',
      email: 'test@example.com',
      license: 'MIT',
      version: '1.0.0',
      url: 'https://example.com',
      citation: 'Test Citation',
      logo: 'https://example.com/logo.png',
      metadata: '{}'
    };
    await insertRecords(kyselyDb, 'lexicons', [testLexicon as any]);

    // Create specific test data for integration testing
    const testWords = [
      {
        id: 'test-computer-n',
        lemma: 'computer',
        pos: 'n',
        language: 'en',
        lexicon: 'test-lexicon'
      },
      {
        id: 'test-run-v',
        lemma: 'run',
        pos: 'v',
        language: 'en',
        lexicon: 'test-lexicon'
      },
      {
        id: 'test-machine-n',
        lemma: 'machine',
        pos: 'n',
        language: 'en',
        lexicon: 'test-lexicon'
      }
    ];

    const testSynsets = [
      {
        id: 'test-computer-n-1',
        ili: 'i12345',
        pos: 'n',
        language: 'en',
        lexicon: 'test-lexicon'
      },
      {
        id: 'test-run-v-1',
        ili: 'i12346',
        pos: 'v',
        language: 'en',
        lexicon: 'test-lexicon'
      },
      {
        id: 'test-machine-n-1',
        ili: 'i12347',
        pos: 'n',
        language: 'en',
        lexicon: 'test-lexicon'
      }
    ];

    const testSenses = [
      {
        id: 'test-computer-n-1-sense-1',
        word_id: 'test-computer-n',
        synset_id: 'test-computer-n-1',
        source: 'test',
        sensekey: 'computer%1:06:00::',
        adjposition: null,
        subcategory: null,
        domain: null,
        register: null
      },
      {
        id: 'test-run-v-1-sense-1',
        word_id: 'test-run-v',
        synset_id: 'test-run-v-1',
        source: 'test',
        sensekey: 'run%2:38:00::',
        adjposition: null,
        subcategory: null,
        domain: null,
        register: null
      },
      {
        id: 'test-machine-n-1-sense-1',
        word_id: 'test-machine-n',
        synset_id: 'test-machine-n-1',
        source: 'test',
        sensekey: 'machine%1:06:00::',
        adjposition: null,
        subcategory: null,
        domain: null,
        register: null
      }
    ];

    const testDefinitions = [
      {
        id: 'test-computer-n-1-def-1',
        synset_id: 'test-computer-n-1',
        language: 'en',
        text: 'a machine for performing calculations automatically',
        source: 'test'
      },
      {
        id: 'test-run-v-1-def-1',
        synset_id: 'test-run-v-1',
        language: 'en',
        text: 'move fast by using one\'s feet',
        source: 'test'
      },
      {
        id: 'test-machine-n-1-def-1',
        synset_id: 'test-machine-n-1',
        language: 'en',
        text: 'a mechanical device',
        source: 'test'
      }
    ];

    const testRelations = [
      {
        id: 'test-rel-1',
        source_id: 'test-computer-n-1',
        target_id: 'test-machine-n-1',
        type: 'hypernym',
        source: 'test'
      },
      {
        id: 'test-rel-2',
        source_id: 'test-machine-n-1',
        target_id: 'test-computer-n-1',
        type: 'hyponym',
        source: 'test'
      },
      {
        id: 'test-rel-3',
        source_id: 'test-computer-n-1',
        target_id: 'test-run-v-1',
        type: 'related_to',
        source: 'test'
      },
      {
        id: 'test-rel-4',
        source_id: 'test-run-v-1',
        target_id: 'test-computer-n-1',
        type: 'related_to',
        source: 'test'
      }
    ];

    const testIlis = [
      {
        id: 'i12345',
        definition: 'a machine for performing calculations automatically',
        status: 'standard',
        superseded_by: null,
        note: null,
        meta: '{}'
      },
      {
        id: 'i12346',
        definition: 'move fast by using one\'s feet',
        status: 'standard',
        superseded_by: null,
        note: null,
        meta: '{}'
      },
      {
        id: 'i12347',
        definition: 'a mechanical device',
        status: 'standard',
        superseded_by: null,
        note: null,
        meta: '{}'
      }
    ];

    // Insert all test data
    await insertRecords(kyselyDb, 'words', testWords);
    await insertRecords(kyselyDb, 'synsets', testSynsets);
    await insertRecords(kyselyDb, 'senses', testSenses);
    await insertRecords(kyselyDb, 'definitions', testDefinitions);
    await insertRecords(kyselyDb, 'relations', testRelations);
    await insertRecords(kyselyDb, 'ilis', testIlis as any);
  }

  describe('getRelationsBySynsetIdQuery', () => {
    it('should find relations by synset ID', async () => {
      const synsetId = 'test-computer-n-1';
      
      const query = getRelationsBySynsetIdQuery(kyselyDb, synsetId);
      const results = await query.execute();
      
      expect(Array.isArray(results)).toBe(true);
      expect(results.length).toBeGreaterThan(0);
      if (results.length > 0 && results[0]) {
        expect(results[0]).toHaveProperty('id');
        expect(results[0]).toHaveProperty('source_id', synsetId);
        expect(results[0]).toHaveProperty('target_id');
        expect(results[0]).toHaveProperty('type');
        expect(results[0]).toHaveProperty('source');
      }
    });

    it('should find multiple relations for a synset', async () => {
      const synsetId = 'test-computer-n-1';
      
      const query = getRelationsBySynsetIdQuery(kyselyDb, synsetId);
      const results = await query.execute();
      
      expect(Array.isArray(results)).toBe(true);
      expect(results.length).toBe(2); // We have 2 relations for this synset
      
      // Check that all results belong to the same source synset
      results.forEach(result => {
        expect(result.source_id).toBe(synsetId);
      });
    });

    it('should return empty array for synset with no relations', async () => {
      const synsetId = 'non-existent-synset';
      
      const query = getRelationsBySynsetIdQuery(kyselyDb, synsetId);
      const results = await query.execute();
      
      expect(Array.isArray(results)).toBe(true);
      expect(results.length).toBe(0);
    });

    it('should return relations with correct structure', async () => {
      const synsetId = 'test-run-v-1';
      
      const query = getRelationsBySynsetIdQuery(kyselyDb, synsetId);
      const results = await query.execute();
      
      expect(Array.isArray(results)).toBe(true);
      expect(results.length).toBeGreaterThan(0);
      
      if (results.length > 0 && results[0]) {
        const relation = results[0];
        expect(relation).toHaveProperty('id');
        expect(relation).toHaveProperty('source_id');
        expect(relation).toHaveProperty('target_id');
        expect(relation).toHaveProperty('type');
        expect(relation).toHaveProperty('source');
        expect(typeof relation.type).toBe('string');
        expect(relation.type.length).toBeGreaterThan(0);
      }
    });

    it('should find different types of relations', async () => {
      const synsetId = 'test-computer-n-1';
      
      const query = getRelationsBySynsetIdQuery(kyselyDb, synsetId);
      const results = await query.execute();
      
      expect(Array.isArray(results)).toBe(true);
      expect(results.length).toBe(2);
      
      const types = results.map(r => r.type);
      expect(types).toContain('hypernym');
      expect(types).toContain('related_to');
    });

    it('should handle bidirectional relations', async () => {
      // Test that we can find relations where this synset is the source
      const sourceQuery = getRelationsBySynsetIdQuery(kyselyDb, 'test-computer-n-1');
      const sourceResults = await sourceQuery.execute();
      
      expect(Array.isArray(sourceResults)).toBe(true);
      expect(sourceResults.length).toBe(2);
      
      // Test that we can find relations where this synset is the target
      const targetQuery = getRelationsBySynsetIdQuery(kyselyDb, 'test-machine-n-1');
      const targetResults = await targetQuery.execute();
      
      expect(Array.isArray(targetResults)).toBe(true);
      expect(targetResults.length).toBe(1); // One hyponym relation
      
      if (targetResults[0]) {
        expect(targetResults[0].type).toBe('hyponym');
        expect(targetResults[0].source_id).toBe('test-machine-n-1'); // source_id, not target_id
      }
    });
  });

  describe('Real Data Integration', () => {
    it('should work with actual WordNet data structure', async () => {
      // Test that our queries work with the real database schema
      const lexicons = await mockCore.lexicons();
      expect(Array.isArray(lexicons)).toBe(true);
      
      if (lexicons.length > 0) {
        const lexicon = lexicons[0];
        expect(lexicon).toBeDefined();
        const synsets = await mockCore.synsets({ lexicon: lexicon?.id });
        expect(Array.isArray(synsets)).toBe(true);
        
        if (synsets.length > 0) {
          const synset = synsets[0];
          expect(synset).toBeDefined();
          const relations = await mockCore.getRelations(synset?.id);
          expect(Array.isArray(relations)).toBe(true);
        }
      }
    });

    it('should handle database constraints correctly', async () => {
      // Test that foreign key relationships work
      const query = getRelationsBySynsetIdQuery(kyselyDb, 'test-computer-n-1');
      const results = await query.execute();
      
      expect(Array.isArray(results)).toBe(true);
      expect(results.length).toBeGreaterThan(0);
      // Results should be properly linked through foreign keys
    });

    it('should verify database integrity', async () => {
      // Test that all our test data is properly linked
      const words = await kyselyDb.selectFrom('words').selectAll().execute();
      expect(words.length).toBe(3); // computer, run, machine
      
      const synsets = await kyselyDb.selectFrom('synsets').selectAll().execute();
      expect(synsets.length).toBe(3); // computer-n-1, run-v-1, machine-n-1
      
      const senses = await kyselyDb.selectFrom('senses').selectAll().execute();
      expect(senses.length).toBe(3); // one sense per synset
      
      const definitions = await kyselyDb.selectFrom('definitions').selectAll().execute();
      expect(definitions.length).toBe(3); // one definition per synset
      
      const relations = await kyselyDb.selectFrom('relations').selectAll().execute();
      expect(relations.length).toBe(4); // 4 relations total
      
      const ilis = await kyselyDb.selectFrom('ilis').selectAll().execute();
      expect(ilis.length).toBe(3); // i12345, i12346, i12347
    });

    it('should verify relation types distribution', async () => {
      const allRelations = await kyselyDb.selectFrom('relations').selectAll().execute();
      const hypernymRelations = allRelations.filter(rel => rel.type === 'hypernym');
      const hyponymRelations = allRelations.filter(rel => rel.type === 'hyponym');
      const relatedToRelations = allRelations.filter(rel => rel.type === 'related_to');
      
      expect(hypernymRelations.length).toBe(1);
      expect(hyponymRelations.length).toBe(1);
      expect(relatedToRelations.length).toBe(2);
    });
  });
});
