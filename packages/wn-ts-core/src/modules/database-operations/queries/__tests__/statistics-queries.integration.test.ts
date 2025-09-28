/**
 * Statistics Queries Integration Test Suite
 * 
 * Tests all statistics query functions with real database and actual WordNet data.
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
  getStatisticsQueries,
} from '../statistics-queries.js';
import { Kysely, SqliteDialect } from 'kysely';
import type Database from 'better-sqlite3';
import type { Database as DatabaseSchema } from '../../../../types/database.js';
import { createTables, createIndexes } from '../../mutations/schema-mutations.js';
import { insertRecords } from '../../mutations/insert-mutations.js';
import { getTestContext, type TestContext } from '../../../../test/test-data-manager.js';

describe('Statistics Queries Integration Tests', () => {
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
    tempDbPath = join(testContext.tempDir, 'test-statistics-queries.db');
    
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
        id: 'test-happy-a',
        lemma: 'happy',
        pos: 'a',
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
        id: 'test-happy-a-1',
        ili: null, // This synset has no ILI
        pos: 'a',
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
        id: 'test-happy-a-1-sense-1',
        word_id: 'test-happy-a',
        synset_id: 'test-happy-a-1',
        source: 'test',
        sensekey: 'happy%3:00:00::',
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
        id: 'test-happy-a-1-def-1',
        synset_id: 'test-happy-a-1',
        language: 'en',
        text: 'feeling or showing pleasure',
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
      }
    ];

    // Insert all test data
    await insertRecords(kyselyDb, 'words', testWords);
    await insertRecords(kyselyDb, 'synsets', testSynsets);
    await insertRecords(kyselyDb, 'senses', testSenses);
    await insertRecords(kyselyDb, 'definitions', testDefinitions);
    await insertRecords(kyselyDb, 'ilis', testIlis as any);
  }

  describe('getStatisticsQueries', () => {
    it('should provide statistics queries', async () => {
      const statsQueries = getStatisticsQueries(kyselyDb);
      
      expect(statsQueries).toBeDefined();
      expect(statsQueries.totalWords).toBeDefined();
      expect(statsQueries.totalSynsets).toBeDefined();
      expect(statsQueries.totalSenses).toBeDefined();
      expect(statsQueries.totalILIs).toBeDefined();
      expect(statsQueries.totalLexicons).toBeDefined();
    });

    it('should return correct word count', async () => {
      const statsQueries = getStatisticsQueries(kyselyDb);
      const result = await statsQueries.totalWords.execute();
      
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(1);
      if (result[0]) {
        expect(result[0]).toHaveProperty('count');
        expect(typeof result[0].count).toBe('number');
        expect(result[0].count).toBe(3); // We have 3 words
      }
    });

    it('should return correct synset count', async () => {
      const statsQueries = getStatisticsQueries(kyselyDb);
      const result = await statsQueries.totalSynsets.execute();
      
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(1);
      if (result[0]) {
        expect(result[0]).toHaveProperty('count');
        expect(typeof result[0].count).toBe('number');
        expect(result[0].count).toBe(3); // We have 3 synsets
      }
    });

    it('should return correct sense count', async () => {
      const statsQueries = getStatisticsQueries(kyselyDb);
      const result = await statsQueries.totalSenses.execute();
      
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(1);
      if (result[0]) {
        expect(result[0]).toHaveProperty('count');
        expect(typeof result[0].count).toBe('number');
        expect(result[0].count).toBe(3); // We have 3 senses
      }
    });

    it('should return correct ILI count', async () => {
      const statsQueries = getStatisticsQueries(kyselyDb);
      const result = await statsQueries.totalILIs.execute();
      
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(1);
      if (result[0]) {
        expect(result[0]).toHaveProperty('count');
        expect(typeof result[0].count).toBe('number');
        expect(result[0].count).toBe(2); // We have 2 ILIs (only synsets with ILI)
      }
    });

    it('should return correct lexicon count', async () => {
      const statsQueries = getStatisticsQueries(kyselyDb);
      const result = await statsQueries.totalLexicons.execute();
      
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(1);
      if (result[0]) {
        expect(result[0]).toHaveProperty('count');
        expect(typeof result[0].count).toBe('number');
        expect(result[0].count).toBe(1); // We have 1 lexicon
      }
    });

    it('should handle empty database', async () => {
      // Create a new empty database for this test
      const { join } = await import('path');
      const emptyDbPath = join(testContext.tempDir, 'test-empty-statistics.db');
      const Database = (await import('better-sqlite3')).default;
      const emptyDb = new Database(emptyDbPath);
      
      const dialect = new SqliteDialect({
        database: emptyDb,
      });
      
      const emptyKyselyDb = new Kysely<DatabaseSchema>({ dialect });
      
      // Create tables but don't insert data
      await createTables(emptyKyselyDb);
      await createIndexes(emptyKyselyDb);
      
      const statsQueries = getStatisticsQueries(emptyKyselyDb);
      
      // Test all counts should be 0
      const wordCount = await statsQueries.totalWords.execute();
      expect(wordCount[0].count).toBe(0);
      
      const synsetCount = await statsQueries.totalSynsets.execute();
      expect(synsetCount[0].count).toBe(0);
      
      const senseCount = await statsQueries.totalSenses.execute();
      expect(senseCount[0].count).toBe(0);
      
      const iliCount = await statsQueries.totalILIs.execute();
      expect(iliCount[0].count).toBe(0);
      
      const lexiconCount = await statsQueries.totalLexicons.execute();
      expect(lexiconCount[0].count).toBe(0);
      
      // Clean up
      emptyDb.close();
    });

    it('should return consistent counts across multiple calls', async () => {
      const statsQueries = getStatisticsQueries(kyselyDb);
      
      // Call each query multiple times
      const wordCount1 = await statsQueries.totalWords.execute();
      const wordCount2 = await statsQueries.totalWords.execute();
      expect(wordCount1[0].count).toBe(wordCount2[0].count);
      
      const synsetCount1 = await statsQueries.totalSynsets.execute();
      const synsetCount2 = await statsQueries.totalSynsets.execute();
      expect(synsetCount1[0].count).toBe(synsetCount2[0].count);
      
      const senseCount1 = await statsQueries.totalSenses.execute();
      const senseCount2 = await statsQueries.totalSenses.execute();
      expect(senseCount1[0].count).toBe(senseCount2[0].count);
    });
  });

  describe('Real Data Integration', () => {
    it('should work with actual WordNet data structure', async () => {
      // Test that our queries work with the real database schema
      const lexicons = await mockCore.lexicons();
      expect(Array.isArray(lexicons)).toBe(true);
      expect(lexicons.length).toBe(1);
      
      if (lexicons.length > 0) {
        const lexicon = lexicons[0];
        expect(lexicon).toBeDefined();
        expect(lexicon).toHaveProperty('id');
        expect(lexicon).toHaveProperty('label');
        expect(lexicon).toHaveProperty('language');
      }
    });

    it('should handle database constraints correctly', async () => {
      // Test that foreign key relationships work
      const statsQueries = getStatisticsQueries(kyselyDb);
      const wordCount = await statsQueries.totalWords.execute();
      
      expect(Array.isArray(wordCount)).toBe(true);
      expect(wordCount.length).toBe(1);
      expect(wordCount[0].count).toBeGreaterThan(0);
      // Results should be properly counted
    });

    it('should verify database integrity', async () => {
      // Test that all our test data is properly counted
      const words = await kyselyDb.selectFrom('words').selectAll().execute();
      expect(words.length).toBe(3); // computer, run, happy
      
      const synsets = await kyselyDb.selectFrom('synsets').selectAll().execute();
      expect(synsets.length).toBe(3); // computer-n-1, run-v-1, happy-a-1
      
      const senses = await kyselyDb.selectFrom('senses').selectAll().execute();
      expect(senses.length).toBe(3); // one sense per synset
      
      const definitions = await kyselyDb.selectFrom('definitions').selectAll().execute();
      expect(definitions.length).toBe(3); // one definition per synset
      
      const ilis = await kyselyDb.selectFrom('ilis').selectAll().execute();
      expect(ilis.length).toBe(2); // i12345, i12346
      
      // Test that statistics match actual counts
      const statsQueries = getStatisticsQueries(kyselyDb);
      
      const wordCount = await statsQueries.totalWords.execute();
      expect(wordCount[0].count).toBe(words.length);
      
      const synsetCount = await statsQueries.totalSynsets.execute();
      expect(synsetCount[0].count).toBe(synsets.length);
      
      const senseCount = await statsQueries.totalSenses.execute();
      expect(senseCount[0].count).toBe(senses.length);
      
      const iliCount = await statsQueries.totalILIs.execute();
      expect(iliCount[0].count).toBe(2); // Only synsets with ILI
      
      const lexiconCount = await statsQueries.totalLexicons.execute();
      expect(lexiconCount[0].count).toBe(1);
    });

    it('should handle ILI count correctly (only synsets with ILI)', async () => {
      const statsQueries = getStatisticsQueries(kyselyDb);
      const iliCount = await statsQueries.totalILIs.execute();
      
      expect(Array.isArray(iliCount)).toBe(true);
      expect(iliCount.length).toBe(1);
      expect(iliCount[0].count).toBe(2); // Only 2 synsets have ILI (computer and run)
      
      // Verify by checking synsets with ILI
      const synsetsWithIli = await kyselyDb.selectFrom('synsets')
        .selectAll()
        .where('ili', 'is not', null)
        .execute();
      expect(synsetsWithIli.length).toBe(2);
    });
  });
});
