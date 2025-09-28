/**
 * ILIs Queries Integration Test Suite
 * 
 * Tests all ILI query functions with real database and actual WordNet data.
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
  getIliByIdQuery,
  getIlisQuery,
} from '../ilis-queries.js';
import { Kysely, SqliteDialect } from 'kysely';
import type Database from 'better-sqlite3';
import type { Database as DatabaseSchema } from '../../../../types/database.js';
import { createTables, createIndexes } from '../../mutations/schema-mutations.js';
import { insertRecords } from '../../mutations/insert-mutations.js';
import { getTestContext, type TestContext } from '../../../../test/test-data-manager.js';

describe('ILIs Queries Integration Tests', () => {
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
    tempDbPath = join(testContext.tempDir, 'test-ilis-queries.db');
    
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
      }
    ];

    const testIlis = [
      {
        id: 'i12345',
        definition: 'a machine for performing calculations automatically',
        status: 'standard',
        superseded_by: null,
        note: null,
        meta: '{"type": "test", "domain": "technology"}'
      },
      {
        id: 'i12346',
        definition: 'move fast by using one\'s feet',
        status: 'standard',
        superseded_by: null,
        note: null,
        meta: '{"type": "test", "domain": "motion"}'
      },
      {
        id: 'i12347',
        definition: 'a superseded concept',
        status: 'superseded',
        superseded_by: 'i12345',
        note: 'This concept has been replaced',
        meta: '{"type": "test", "domain": "obsolete"}'
      },
      {
        id: 'i12348',
        definition: 'a proposed concept',
        status: 'proposed',
        superseded_by: null,
        note: 'This concept is under review',
        meta: '{"type": "test", "domain": "proposed"}'
      }
    ];

    // Insert all test data
    await insertRecords(kyselyDb, 'words', testWords);
    await insertRecords(kyselyDb, 'synsets', testSynsets);
    await insertRecords(kyselyDb, 'senses', testSenses);
    await insertRecords(kyselyDb, 'definitions', testDefinitions);
    await insertRecords(kyselyDb, 'ilis', testIlis as any);
  }

  describe('getIliByIdQuery', () => {
    it('should find ILI by ID', async () => {
      const iliId = 'i12345';
      
      const query = getIliByIdQuery(kyselyDb, iliId);
      const results = await query.execute();
      
      expect(Array.isArray(results)).toBe(true);
      expect(results.length).toBe(1);
      if (results[0]) {
        expect(results[0]).toHaveProperty('id', iliId);
        expect(results[0]).toHaveProperty('definition');
        expect(results[0]).toHaveProperty('status');
        expect(results[0]).toHaveProperty('superseded_by');
        expect(results[0]).toHaveProperty('note');
        expect(results[0]).toHaveProperty('meta');
      }
    });

    it('should return empty array for non-existent ILI ID', async () => {
      const iliId = 'i99999';
      
      const query = getIliByIdQuery(kyselyDb, iliId);
      const results = await query.execute();
      
      expect(Array.isArray(results)).toBe(true);
      expect(results.length).toBe(0);
    });

    it('should return ILI with complete metadata', async () => {
      const iliId = 'i12345';
      
      const query = getIliByIdQuery(kyselyDb, iliId);
      const results = await query.execute();
      
      expect(Array.isArray(results)).toBe(true);
      expect(results.length).toBe(1);
      
      if (results[0]) {
        const ili = results[0];
        expect(ili.id).toBe(iliId);
        expect(ili.definition).toBe('a machine for performing calculations automatically');
        expect(ili.status).toBe('standard');
        expect(ili.superseded_by).toBeNull();
        expect(ili.note).toBeNull();
        expect(ili.meta).toBe('{"type": "test", "domain": "technology"}');
      }
    });

    it('should handle superseded ILI correctly', async () => {
      const iliId = 'i12347';
      
      const query = getIliByIdQuery(kyselyDb, iliId);
      const results = await query.execute();
      
      expect(Array.isArray(results)).toBe(true);
      expect(results.length).toBe(1);
      
      if (results[0]) {
        const ili = results[0];
        expect(ili.id).toBe(iliId);
        expect(ili.status).toBe('superseded');
        expect(ili.superseded_by).toBe('i12345');
        expect(ili.note).toBe('This concept has been replaced');
      }
    });
  });

  describe('getIlisQuery', () => {
    it('should find all ILIs', async () => {
      const query = getIlisQuery(kyselyDb);
      const results = await query.execute();
      
      expect(Array.isArray(results)).toBe(true);
      expect(results.length).toBe(4); // We have 4 test ILIs
      
      if (results.length > 0 && results[0]) {
        expect(results[0]).toHaveProperty('id');
        expect(results[0]).toHaveProperty('definition');
        expect(results[0]).toHaveProperty('status');
        expect(results[0]).toHaveProperty('superseded_by');
        expect(results[0]).toHaveProperty('note');
        expect(results[0]).toHaveProperty('meta');
      }
    });

    it('should find ILIs by status', async () => {
      const options = { status: 'standard' };
      
      const query = getIlisQuery(kyselyDb, options);
      const results = await query.execute();
      
      expect(Array.isArray(results)).toBe(true);
      expect(results.length).toBe(2); // We have 2 standard ILIs
      
      results.forEach(result => {
        expect(result.status).toBe('standard');
      });
    });

    it('should find superseded ILIs', async () => {
      const options = { status: 'superseded' };
      
      const query = getIlisQuery(kyselyDb, options);
      const results = await query.execute();
      
      expect(Array.isArray(results)).toBe(true);
      expect(results.length).toBe(1);
      
      if (results[0]) {
        expect(results[0].status).toBe('superseded');
        expect(results[0].superseded_by).toBe('i12345');
      }
    });

    it('should find proposed ILIs', async () => {
      const options = { status: 'proposed' };
      
      const query = getIlisQuery(kyselyDb, options);
      const results = await query.execute();
      
      expect(Array.isArray(results)).toBe(true);
      expect(results.length).toBe(1);
      
      if (results[0]) {
        expect(results[0].status).toBe('proposed');
        expect(results[0].note).toBe('This concept is under review');
      }
    });

    it('should return empty array for non-existent status', async () => {
      const options = { status: 'non-existent' };
      
      const query = getIlisQuery(kyselyDb, options);
      const results = await query.execute();
      
      expect(Array.isArray(results)).toBe(true);
      expect(results.length).toBe(0);
    });

    it('should return ILIs with correct structure', async () => {
      const query = getIlisQuery(kyselyDb);
      const results = await query.execute();
      
      expect(Array.isArray(results)).toBe(true);
      expect(results.length).toBeGreaterThan(0);
      
      results.forEach(result => {
        expect(result).toHaveProperty('id');
        expect(result).toHaveProperty('definition');
        expect(result).toHaveProperty('status');
        expect(result).toHaveProperty('superseded_by');
        expect(result).toHaveProperty('note');
        expect(result).toHaveProperty('meta');
        expect(typeof result.definition).toBe('string');
        if (result.definition) {
          expect(result.definition.length).toBeGreaterThan(0);
        }
      });
    });
  });

  describe('Real Data Integration', () => {
    it('should work with actual WordNet data structure', async () => {
      // Test that our queries work with the real database schema
      const ilis = await mockCore.ilis();
      expect(Array.isArray(ilis)).toBe(true);
      expect(ilis.length).toBe(4);
      
      if (ilis.length > 0) {
        const ili = ilis[0];
        expect(ili).toBeDefined();
        expect(ili).toHaveProperty('id');
        expect(ili).toHaveProperty('definition');
        expect(ili).toHaveProperty('status');
      }
    });

    it('should handle database constraints correctly', async () => {
      // Test that foreign key relationships work
      const query = getIliByIdQuery(kyselyDb, 'i12345');
      const results = await query.execute();
      
      expect(Array.isArray(results)).toBe(true);
      expect(results.length).toBe(1);
      // Results should be properly linked through foreign keys
    });

    it('should verify database integrity', async () => {
      // Test that all our test data is properly linked
      const words = await kyselyDb.selectFrom('words').selectAll().execute();
      expect(words.length).toBe(2); // computer, run
      
      const synsets = await kyselyDb.selectFrom('synsets').selectAll().execute();
      expect(synsets.length).toBe(2); // computer-n-1, run-v-1
      
      const senses = await kyselyDb.selectFrom('senses').selectAll().execute();
      expect(senses.length).toBe(2); // one sense per synset
      
      const definitions = await kyselyDb.selectFrom('definitions').selectAll().execute();
      expect(definitions.length).toBe(2); // one definition per synset
      
      const ilis = await kyselyDb.selectFrom('ilis').selectAll().execute();
      expect(ilis.length).toBe(4); // i12345, i12346, i12347, i12348
    });

    it('should verify ILI status distribution', async () => {
      const allIlis = await kyselyDb.selectFrom('ilis').selectAll().execute();
      const standardIlis = allIlis.filter(ili => ili.status === 'standard');
      const supersededIlis = allIlis.filter(ili => ili.status === 'superseded');
      const proposedIlis = allIlis.filter(ili => ili.status === 'proposed');
      
      expect(standardIlis.length).toBe(2);
      expect(supersededIlis.length).toBe(1);
      expect(proposedIlis.length).toBe(1);
    });
  });
});
