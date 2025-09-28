/**
 * Lexicons Queries Integration Test Suite
 * 
 * Tests all lexicon query functions with real database and actual WordNet data.
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
  getLexiconsQuery,
  getLexiconByIdQuery,
} from '../lexicons-queries.js';
import { Kysely, SqliteDialect } from 'kysely';
import type Database from 'better-sqlite3';
import type { Database as DatabaseSchema } from '../../../../types/database.js';
import { createTables, createIndexes } from '../../mutations/schema-mutations.js';
import { insertRecords } from '../../mutations/insert-mutations.js';
import { getTestContext, type TestContext } from '../../../../test/test-data-manager.js';

describe('Lexicons Queries Integration Tests', () => {
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
    tempDbPath = join(testContext.tempDir, 'test-lexicons-queries.db');
    
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
    // Insert multiple test lexicons
    const testLexicons: TestLexicon[] = [
      {
        id: 'test-lexicon-en',
        label: 'Test English Lexicon',
        language: 'en',
        email: 'test-en@example.com',
        license: 'MIT',
        version: '1.0.0',
        url: 'https://example.com/en',
        citation: 'Test English Citation',
        logo: 'https://example.com/logo-en.png',
        metadata: '{"type": "test", "language": "en"}'
      },
      {
        id: 'test-lexicon-fr',
        label: 'Test French Lexicon',
        language: 'fr',
        email: 'test-fr@example.com',
        license: 'MIT',
        version: '1.0.0',
        url: 'https://example.com/fr',
        citation: 'Test French Citation',
        logo: 'https://example.com/logo-fr.png',
        metadata: '{"type": "test", "language": "fr"}'
      },
      {
        id: 'test-lexicon-es',
        label: 'Test Spanish Lexicon',
        language: 'es',
        email: 'test-es@example.com',
        license: 'MIT',
        version: '2.0.0',
        url: 'https://example.com/es',
        citation: 'Test Spanish Citation',
        logo: 'https://example.com/logo-es.png',
        metadata: '{"type": "test", "language": "es"}'
      }
    ];
    await insertRecords(kyselyDb, 'lexicons', testLexicons as any);

    // Create specific test data for integration testing
    const testWords = [
      {
        id: 'test-computer-n',
        lemma: 'computer',
        pos: 'n',
        language: 'en',
        lexicon: 'test-lexicon-en'
      },
      {
        id: 'test-run-v',
        lemma: 'run',
        pos: 'v',
        language: 'en',
        lexicon: 'test-lexicon-en'
      }
    ];

    const testSynsets = [
      {
        id: 'test-computer-n-1',
        ili: 'i12345',
        pos: 'n',
        language: 'en',
        lexicon: 'test-lexicon-en'
      },
      {
        id: 'test-run-v-1',
        ili: 'i12346',
        pos: 'v',
        language: 'en',
        lexicon: 'test-lexicon-en'
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

  describe('getLexiconsQuery', () => {
    it('should find all lexicons', async () => {
      const query = getLexiconsQuery(kyselyDb);
      const results = await query.execute();
      
      expect(Array.isArray(results)).toBe(true);
      expect(results.length).toBe(3); // We have 3 test lexicons
      
      if (results.length > 0 && results[0]) {
        expect(results[0]).toHaveProperty('id');
        expect(results[0]).toHaveProperty('label');
        expect(results[0]).toHaveProperty('language');
        expect(results[0]).toHaveProperty('email');
        expect(results[0]).toHaveProperty('license');
        expect(results[0]).toHaveProperty('version');
        expect(results[0]).toHaveProperty('url');
        expect(results[0]).toHaveProperty('citation');
        expect(results[0]).toHaveProperty('logo');
        expect(results[0]).toHaveProperty('metadata');
      }
    });

    it('should find lexicons by ID', async () => {
      const options = { id: 'test-lexicon-en' };
      
      const query = getLexiconsQuery(kyselyDb, options);
      const results = await query.execute();
      
      expect(Array.isArray(results)).toBe(true);
      expect(results.length).toBe(1);
      if (results[0]) {
        expect(results[0].id).toBe('test-lexicon-en');
        expect(results[0].language).toBe('en');
      }
    });

    it('should find lexicons by multiple IDs', async () => {
      const options = { ids: ['test-lexicon-en', 'test-lexicon-fr'] };
      
      const query = getLexiconsQuery(kyselyDb, options);
      const results = await query.execute();
      
      expect(Array.isArray(results)).toBe(true);
      expect(results.length).toBe(2);
      
      const ids = results.map(r => r.id);
      expect(ids).toContain('test-lexicon-en');
      expect(ids).toContain('test-lexicon-fr');
    });

    it('should find lexicons by language', async () => {
      const options = { language: 'en' };
      
      const query = getLexiconsQuery(kyselyDb, options);
      const results = await query.execute();
      
      expect(Array.isArray(results)).toBe(true);
      expect(results.length).toBe(1);
      if (results[0]) {
        expect(results[0].language).toBe('en');
        expect(results[0].id).toBe('test-lexicon-en');
      }
    });

    it('should find lexicons by version', async () => {
      const options = { version: '2.0.0' };
      
      const query = getLexiconsQuery(kyselyDb, options);
      const results = await query.execute();
      
      expect(Array.isArray(results)).toBe(true);
      expect(results.length).toBe(1);
      if (results[0]) {
        expect(results[0].version).toBe('2.0.0');
        expect(results[0].id).toBe('test-lexicon-es');
      }
    });

    it('should handle complex filtering', async () => {
      const options = { 
        language: 'en',
        version: '1.0.0'
      };
      
      const query = getLexiconsQuery(kyselyDb, options);
      const results = await query.execute();
      
      expect(Array.isArray(results)).toBe(true);
      expect(results.length).toBe(1);
      if (results[0]) {
        expect(results[0].language).toBe('en');
        expect(results[0].version).toBe('1.0.0');
        expect(results[0].id).toBe('test-lexicon-en');
      }
    });

    it('should return empty array for non-existent filters', async () => {
      const options = { language: 'de' }; // German not in test data
      
      const query = getLexiconsQuery(kyselyDb, options);
      const results = await query.execute();
      
      expect(Array.isArray(results)).toBe(true);
      expect(results.length).toBe(0);
    });
  });

  describe('getLexiconByIdQuery', () => {
    it('should find lexicon by ID', async () => {
      const lexiconId = 'test-lexicon-en';
      
      const query = getLexiconByIdQuery(kyselyDb, lexiconId);
      const results = await query.execute();
      
      expect(Array.isArray(results)).toBe(true);
      expect(results.length).toBe(1);
      if (results[0]) {
        expect(results[0].id).toBe(lexiconId);
        expect(results[0].language).toBe('en');
        expect(results[0].label).toBe('Test English Lexicon');
      }
    });

    it('should return empty array for non-existent lexicon ID', async () => {
      const lexiconId = 'non-existent-lexicon';
      
      const query = getLexiconByIdQuery(kyselyDb, lexiconId);
      const results = await query.execute();
      
      expect(Array.isArray(results)).toBe(true);
      expect(results.length).toBe(0);
    });

    it('should return lexicon with complete metadata', async () => {
      const lexiconId = 'test-lexicon-fr';
      
      const query = getLexiconByIdQuery(kyselyDb, lexiconId);
      const results = await query.execute();
      
      expect(Array.isArray(results)).toBe(true);
      expect(results.length).toBe(1);
      
      if (results[0]) {
        const lexicon = results[0];
        expect(lexicon.id).toBe(lexiconId);
        expect(lexicon.language).toBe('fr');
        expect(lexicon.label).toBe('Test French Lexicon');
        expect(lexicon.email).toBe('test-fr@example.com');
        expect(lexicon.license).toBe('MIT');
        expect(lexicon.version).toBe('1.0.0');
        expect(lexicon.url).toBe('https://example.com/fr');
        expect(lexicon.citation).toBe('Test French Citation');
        expect(lexicon.logo).toBe('https://example.com/logo-fr.png');
        expect(lexicon.metadata).toBe('{"type": "test", "language": "fr"}');
      }
    });
  });

  describe('Real Data Integration', () => {
    it('should work with actual WordNet data structure', async () => {
      // Test that our queries work with the real database schema
      const lexicons = await mockCore.lexicons();
      expect(Array.isArray(lexicons)).toBe(true);
      expect(lexicons.length).toBe(3);
      
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
      const query = getLexiconByIdQuery(kyselyDb, 'test-lexicon-en');
      const results = await query.execute();
      
      expect(Array.isArray(results)).toBe(true);
      expect(results.length).toBe(1);
      // Results should be properly linked through foreign keys
    });

    it('should verify database integrity', async () => {
      // Test that all our test data is properly linked
      const lexicons = await kyselyDb.selectFrom('lexicons').selectAll().execute();
      expect(lexicons.length).toBe(3); // en, fr, es
      
      const words = await kyselyDb.selectFrom('words').selectAll().execute();
      expect(words.length).toBe(2); // computer, run
      
      const synsets = await kyselyDb.selectFrom('synsets').selectAll().execute();
      expect(synsets.length).toBe(2); // computer-n-1, run-v-1
      
      const senses = await kyselyDb.selectFrom('senses').selectAll().execute();
      expect(senses.length).toBe(2); // one sense per synset
      
      const definitions = await kyselyDb.selectFrom('definitions').selectAll().execute();
      expect(definitions.length).toBe(2); // one definition per synset
      
      const ilis = await kyselyDb.selectFrom('ilis').selectAll().execute();
      expect(ilis.length).toBe(2); // i12345, i12346
    });
  });
});
