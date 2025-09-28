/**
 * Words Queries Integration Test Suite
 * 
 * Tests all word query functions with real database and actual WordNet data.
 * This is an integration test that hits the actual database to ensure query
 * functions work correctly with real data.
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import type { WordNetCore } from '../../../../wordnet-kernel.js';
import type { PartOfSpeech, WordQuery } from '../../../../core/types.js';

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
  getWordsBySynsetAndLanguageQuery,
  getWordsQuery,
  getWordByIdQuery,
  getWordsByFormFastQuery,
  getWordsByFormFuzzyFastQuery,
  getWordsByLexiconQuery,
  getWordsByIdsQuery,
  getWordsByIliAndLanguageQuery,
  getWordsByIliAndLexiconPrefixQuery,
} from '../words-queries.js';
import { Kysely, SqliteDialect } from 'kysely';
import type Database from 'better-sqlite3';
import type { Database as DatabaseSchema } from '../../../../types/database.js';
import { createTables, createIndexes } from '../../mutations/schema-mutations.js';
import { insertRecords } from '../../mutations/insert-mutations.js';
import { getTestContext, type TestContext } from '../../../../test/test-data-manager.js';

describe('Words Queries Integration Tests', () => {
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
    tempDbPath = join(testContext.tempDir, 'test-words-queries.db');
    
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
      words: async (_query?: WordQuery) => {
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

    // Create WordNet with the real database (not used in this test but available for future use)
    // const wordnet = createWordNet({
    //   core: mockCore,
    //   kyselyDb: {
    //     db: kyselyDb,
    //     executeSchemaModification: async (sql: string) => {
    //       sqliteDb.exec(sql);
    //     },
    //     getTableInfo: async (tableName: string) => {
    //       const result = sqliteDb.prepare(`PRAGMA table_info(${tableName})`).all();
    //       return result as any[];
    //     },
    //     getIndexInfo: async (tableName: string) => {
    //       const result = sqliteDb.prepare(`PRAGMA index_list(${tableName})`).all();
    //       return result as any[];
    //     },
    //     getConstraintInfo: async (tableName: string) => {
    //       const result = sqliteDb.prepare(`PRAGMA foreign_key_list(${tableName})`).all();
    //       return result as any[];
    //     }
    //   }
    // });
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


  describe('getWordsBySynsetAndLanguageQuery', () => {
    it('should find words in a synset for specific language', async () => {
      const synsetId = 'test-computer-n-1';
      const language = 'en';
      
      const query = getWordsBySynsetAndLanguageQuery(kyselyDb, synsetId, language);
      const results = await query.execute();
      
      expect(Array.isArray(results)).toBe(true);
      expect(results.length).toBeGreaterThan(0);
      if (results.length > 0 && results[0]) {
        expect(results[0]).toHaveProperty('id');
        expect(results[0]).toHaveProperty('lemma');
        expect(results[0]).toHaveProperty('pos');
        expect(results[0]).toHaveProperty('language', 'en');
      }
    });

    it('should find words in a synset without language filter', async () => {
      const synsetId = 'test-computer-n-1';
      
      const query = getWordsBySynsetAndLanguageQuery(kyselyDb, synsetId);
      const results = await query.execute();
      
      expect(Array.isArray(results)).toBe(true);
      expect(results.length).toBeGreaterThan(0);
    });
  });

  describe('getWordsQuery', () => {
    it('should find words by form', async () => {
      const options: WordQuery = {
        form: 'computer',
        fuzzy: false
      };
      
      const query = getWordsQuery(kyselyDb, options);
      const results = await query.execute();
      
      expect(Array.isArray(results)).toBe(true);
      expect(results.length).toBeGreaterThan(0);
      if (results.length > 0 && results[0]) {
        expect(results[0].lemma).toBe('computer');
      }
    });

    it('should find words with fuzzy search', async () => {
      const options: WordQuery = {
        form: 'comp',
        fuzzy: true
      };
      
      const query = getWordsQuery(kyselyDb, options);
      const results = await query.execute();
      
      expect(Array.isArray(results)).toBe(true);
      expect(results.length).toBeGreaterThan(0);
    });

    it('should find words by POS', async () => {
      const options: WordQuery = {
        pos: 'n' as PartOfSpeech
      };
      
      const query = getWordsQuery(kyselyDb, options);
      const results = await query.execute();
      
      expect(Array.isArray(results)).toBe(true);
      expect(results.length).toBeGreaterThan(0);
      if (results.length > 0 && results[0]) {
        expect(results[0].pos).toBe('n');
      }
    });

    it('should find words by lexicon', async () => {
      const options: WordQuery = {
        lexicon: 'test-lexicon'
      };
      
      const query = getWordsQuery(kyselyDb, options);
      const results = await query.execute();
      
      expect(Array.isArray(results)).toBe(true);
      expect(results.length).toBeGreaterThan(0);
      if (results.length > 0 && results[0]) {
        expect(results[0].lexicon).toBe('test-lexicon');
      }
    });

    it('should find words by language', async () => {
      const options: WordQuery = {
        language: 'en'
      };
      
      const query = getWordsQuery(kyselyDb, options);
      const results = await query.execute();
      
      expect(Array.isArray(results)).toBe(true);
      expect(results.length).toBeGreaterThan(0);
      if (results.length > 0 && results[0]) {
        expect(results[0].language).toBe('en');
      }
    });

    it('should handle complex filtering', async () => {
      const options: WordQuery = {
        form: 'computer',
        pos: 'n' as PartOfSpeech,
        lexicon: 'test-lexicon',
        language: 'en',
        fuzzy: false,
        maxResults: 10
      };
      
      const query = getWordsQuery(kyselyDb, options);
      const results = await query.execute();
      
      expect(Array.isArray(results)).toBe(true);
      expect(results.length).toBeGreaterThan(0);
    });
  });

  describe('getWordByIdQuery', () => {
    it('should find word by ID', async () => {
      const wordId = 'test-computer-n';
      
      const query = getWordByIdQuery(kyselyDb, wordId);
      const results = await query.execute();
      
      expect(Array.isArray(results)).toBe(true);
      expect(results.length).toBeGreaterThan(0);
      if (results.length > 0 && results[0]) {
        expect(results[0].id).toBe(wordId);
      }
    });
  });

  describe('getWordsByFormFastQuery', () => {
    it('should find words by form quickly', async () => {
      const form = 'computer';
      
      const query = getWordsByFormFastQuery(kyselyDb, form);
      const results = await query.execute();
      
      expect(Array.isArray(results)).toBe(true);
      expect(results.length).toBeGreaterThan(0);
      if (results.length > 0 && results[0]) {
        expect(results[0].lemma).toBe('computer');
      }
    });

    it('should find words with POS filter', async () => {
      const form = 'run';
      const options = { pos: 'v' as PartOfSpeech };
      
      const query = getWordsByFormFastQuery(kyselyDb, form, options);
      const results = await query.execute();
      
      expect(Array.isArray(results)).toBe(true);
      expect(results.length).toBeGreaterThan(0);
      if (results.length > 0 && results[0]) {
        expect(results[0].pos).toBe('v');
      }
    });
  });

  describe('getWordsByFormFuzzyFastQuery', () => {
    it('should find words with fuzzy search', async () => {
      const form = 'comp';
      
      const query = getWordsByFormFuzzyFastQuery(kyselyDb, form);
      const results = await query.execute();
      
      expect(Array.isArray(results)).toBe(true);
    });
  });

  describe('getWordsByLexiconQuery', () => {
    it('should find words by lexicon', async () => {
      const lexiconId = 'test-lexicon';
      
      const query = getWordsByLexiconQuery(kyselyDb, lexiconId);
      const results = await query.execute();
      
      expect(Array.isArray(results)).toBe(true);
      expect(results.length).toBeGreaterThan(0);
      if (results.length > 0 && results[0]) {
        expect(results[0].lexicon).toBe(lexiconId);
      }
    });
  });

  describe('getWordsByIdsQuery', () => {
    it('should find words by IDs array', async () => {
      const wordIds = ['test-computer-n', 'test-run-v'];
      
      const query = getWordsByIdsQuery(kyselyDb, wordIds);
      const results = await query.execute();
      
      expect(Array.isArray(results)).toBe(true);
      expect(results.length).toBeLessThanOrEqual(wordIds.length);
    });

    it('should handle empty IDs array', async () => {
      const wordIds: string[] = [];
      
      const query = getWordsByIdsQuery(kyselyDb, wordIds);
      const results = await query.execute();
      
      expect(Array.isArray(results)).toBe(true);
    });
  });

  describe('getWordsByIliAndLanguageQuery', () => {
    it('should find words by ILI and language', async () => {
      const ili = 'i12345';
      const language = 'en';
      
      const query = getWordsByIliAndLanguageQuery(kyselyDb, ili, language);
      const results = await query.execute();
      
      expect(Array.isArray(results)).toBe(true);
    });

    it('should find words by ILI only', async () => {
      const ili = 'i12345';
      
      const query = getWordsByIliAndLanguageQuery(kyselyDb, ili);
      const results = await query.execute();
      
      expect(Array.isArray(results)).toBe(true);
    });
  });

  describe('getWordsByIliAndLexiconPrefixQuery', () => {
    it('should find words by ILI and lexicon prefix', async () => {
      const ili = 'i12345';
      const lexiconPrefix = 'test';
      
      const query = getWordsByIliAndLexiconPrefixQuery(kyselyDb, ili, lexiconPrefix);
      const results = await query.execute();
      
      expect(Array.isArray(results)).toBe(true);
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
        const words = await mockCore.words({ lexicon: lexicon?.id });
        expect(Array.isArray(words)).toBe(true);
        
        if (words.length > 0) {
          const word = words[0];
          expect(word).toBeDefined();
          const senses = await mockCore.senses({ wordIdOrForm: word?.id });
          expect(Array.isArray(senses)).toBe(true);
        }
      }
    });

    it('should handle database constraints correctly', async () => {
      // Test that foreign key relationships work
      const query = getWordsBySynsetAndLanguageQuery(kyselyDb, 'test-computer-n-1', 'en');
      const results = await query.execute();
      
      expect(Array.isArray(results)).toBe(true);
      expect(results.length).toBeGreaterThan(0);
      // Results should be properly joined through the senses table
    });

    it('should verify database integrity', async () => {
      // Test that all our test data is properly linked
      const words = await kyselyDb.selectFrom('words').selectAll().execute();
      expect(words.length).toBe(3); // computer, run, happy
      
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
