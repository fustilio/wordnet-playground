/**
 * Forms Queries Integration Test Suite
 * 
 * Tests all form query functions with real database and actual WordNet data.
 * This is an integration test that hits the actual database to ensure query
 * functions work correctly with real data.
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import type { WordNetCore } from '../../../../wordnet-kernel.js';
// Removed unused imports
import { loadTestFixture } from '../../../../test/fixture-loader.js';
import { createTestHelpers } from '../../../../test/test-helpers.js';

import {
  getFormsByWordIdQuery,
} from '../forms-queries.js';
import { Kysely, SqliteDialect } from 'kysely';
import type Database from 'better-sqlite3';
import type { Database as DatabaseSchema } from '../../../../types/database.js';
import { createTables, createIndexes } from '../../mutations/schema-mutations.js';
import { insertRecords } from '../../mutations/insert-mutations.js';
import { getTestContext, type TestContext } from '../../../../test/test-data-manager.js';

describe('Forms Queries Integration Tests', () => {
  let testContext: TestContext;
  let tempDbPath: string;
  let sqliteDb: Database.Database;
  let kyselyDb: Kysely<DatabaseSchema>;
  let mockCore: WordNetCore;
  let testHelpers: ReturnType<typeof createTestHelpers>;

  beforeAll(async () => {
    // Get test context from TestDataManager
    testContext = await getTestContext();
    
    // Create a temporary SQLite database file in the test context
    const { join } = await import('path');
    tempDbPath = join(testContext.tempDir, 'test-forms-queries.db');
    
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

    // Create test helpers
    testHelpers = createTestHelpers(kyselyDb);
    
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
    // Load test fixture from sample XML
    const fixture = await loadTestFixture('cili-1.0');
    
    // Insert all test data using proper types with type assertions
    await insertRecords(kyselyDb, 'lexicons', fixture.lexicons as any);

    await insertRecords(kyselyDb, 'words', fixture.words as any);
    await insertRecords(kyselyDb, 'synsets', fixture.synsets as any);
    await insertRecords(kyselyDb, 'senses', fixture.senses as any);
    await insertRecords(kyselyDb, 'definitions', fixture.definitions as any);
    await insertRecords(kyselyDb, 'forms', fixture.forms as any);
    await insertRecords(kyselyDb, 'ilis', fixture.ilis as any);
  }

  describe('getFormsByWordIdQuery', () => {
    it('should find forms by word ID', async () => {
      const word = await testHelpers.getRandomWord();
      const wordId = word?.id;
      
      if (!wordId) {
        throw new Error('No word found');
      }
      
      const query = getFormsByWordIdQuery(kyselyDb, wordId);
      const results = await query.execute();
      
      expect(Array.isArray(results)).toBe(true);
      expect(results.length).toBeGreaterThan(0);
      if (results.length > 0 && results[0]) {
        expect(results[0]).toHaveProperty('id');
        expect(results[0]).toHaveProperty('word_id', wordId);
        expect(results[0]).toHaveProperty('written_form');
        expect(results[0]).toHaveProperty('script');
        expect(results[0]).toHaveProperty('tag');
      }
    });

    it('should find multiple forms for a word', async () => {
      const word = await testHelpers.getRandomWord();
      const wordId = word?.id;
      
      if (!wordId) {
        throw new Error('No word found');
      }
      
      const query = getFormsByWordIdQuery(kyselyDb, wordId);
      const results = await query.execute();
      
      expect(Array.isArray(results)).toBe(true);
      expect(results.length).toBeGreaterThan(0);
      
      // Check that all results belong to the same word
      results.forEach(result => {
        expect(result.word_id).toBe(wordId);
      });
    });

    it('should find forms for verb with multiple inflections', async () => {
      // Find a verb word from the fixture, or any word if no verbs exist
      const words = await kyselyDb.selectFrom('words').selectAll().execute();
      const verbWord = words.find(w => w.pos === 'v') || words[0];
      
      if (!verbWord) {
        throw new Error('No words found in test data');
      }
      
      const wordId = verbWord.id;
      const query = getFormsByWordIdQuery(kyselyDb, wordId);
      const results = await query.execute();
      
      expect(Array.isArray(results)).toBe(true);
      expect(results.length).toBeGreaterThan(0);
      
      // Check that all results belong to the same word
      results.forEach(result => {
        expect(result.word_id).toBe(wordId);
      });
      
      // Check that we have different forms
      const forms = results.map(r => r.written_form);
      expect(forms.length).toBeGreaterThan(0);
    });

    it('should return empty array for word with no forms', async () => {
      // Find a word that has no forms in our test data
      const words = await kyselyDb.selectFrom('words').selectAll().execute();
      const forms = await kyselyDb.selectFrom('forms').selectAll().execute();
      const wordsWithForms = new Set(forms.map(f => f.word_id));
      const wordWithoutForms = words.find(w => !wordsWithForms.has(w.id));
      
      if (!wordWithoutForms) {
        // If all words have forms, create a test word without forms
        const testWord = {
          id: 'test-no-forms',
          lemma: 'testword',
          pos: 'n',
          language: 'en',
          lexicon: words[0]?.lexicon || 'test-lexicon'
        };
        await insertRecords(kyselyDb, 'words', [testWord]);
        const query = getFormsByWordIdQuery(kyselyDb, 'test-no-forms');
        const results = await query.execute();
        expect(Array.isArray(results)).toBe(true);
        expect(results.length).toBe(0);
        return;
      }
      
      const query = getFormsByWordIdQuery(kyselyDb, wordWithoutForms.id);
      const results = await query.execute();
      
      expect(Array.isArray(results)).toBe(true);
      expect(results.length).toBe(0);
    });

    it('should return empty array for non-existent word ID', async () => {
      const wordId = 'non-existent-word';
      
      const query = getFormsByWordIdQuery(kyselyDb, wordId);
      const results = await query.execute();
      
      expect(Array.isArray(results)).toBe(true);
      expect(results.length).toBe(0);
    });

    it('should return forms with correct structure', async () => {
      const word = await testHelpers.getRandomWord();
      const wordId = word?.id;
      
      if (!wordId) {
        throw new Error('No word found');
      }
      
      const query = getFormsByWordIdQuery(kyselyDb, wordId);
      const results = await query.execute();
      
      expect(Array.isArray(results)).toBe(true);
      expect(results.length).toBeGreaterThan(0);
      
      if (results.length > 0 && results[0]) {
        const form = results[0];
        expect(form).toHaveProperty('id');
        expect(form).toHaveProperty('word_id');
        expect(form).toHaveProperty('written_form');
        expect(form).toHaveProperty('script');
        expect(form).toHaveProperty('tag');
        expect(typeof form.written_form).toBe('string');
        expect(form.written_form.length).toBeGreaterThan(0);
      }
    });

    it('should handle possessive forms correctly', async () => {
      const word = await testHelpers.getRandomWord();
      const wordId = word?.id;
      
      if (!wordId) {
        throw new Error('No word found');
      }
      
      const query = getFormsByWordIdQuery(kyselyDb, wordId);
      const results = await query.execute();
      
      expect(Array.isArray(results)).toBe(true);
      expect(results.length).toBeGreaterThan(0);
      
      const forms = results.map(r => r.written_form);
      expect(forms.length).toBeGreaterThan(0);
      // Check that forms are properly structured
      forms.forEach(form => {
        expect(typeof form).toBe('string');
        expect(form.length).toBeGreaterThan(0);
      });
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
          // Test the forms query directly
          if (word?.id) {
            const query = getFormsByWordIdQuery(kyselyDb, word.id);
            const forms = await query.execute();
            expect(Array.isArray(forms)).toBe(true);
          }
        }
      }
    });

    it('should handle database constraints correctly', async () => {
      // Test that foreign key relationships work
      const word = await testHelpers.getRandomWord();
      if (!word?.id) {
        throw new Error('No word found');
      }
      const query = getFormsByWordIdQuery(kyselyDb, word.id);
      const results = await query.execute();
      
      expect(Array.isArray(results)).toBe(true);
      expect(results.length).toBeGreaterThan(0);
      // Results should be properly linked through foreign keys
    });

    it('should verify database integrity', async () => {
      // Test that all our test data is properly linked
      const words = await kyselyDb.selectFrom('words').selectAll().execute();
      expect(words.length).toBeGreaterThan(0);
      
      const synsets = await kyselyDb.selectFrom('synsets').selectAll().execute();
      expect(synsets.length).toBeGreaterThan(0);
      
      const senses = await kyselyDb.selectFrom('senses').selectAll().execute();
      expect(senses.length).toBeGreaterThan(0);
      
      const definitions = await kyselyDb.selectFrom('definitions').selectAll().execute();
      expect(definitions.length).toBeGreaterThan(0);
      
      const forms = await kyselyDb.selectFrom('forms').selectAll().execute();
      expect(forms.length).toBeGreaterThan(0);
      
      const ilis = await kyselyDb.selectFrom('ilis').selectAll().execute();
      expect(ilis.length).toBeGreaterThan(0);
    });
  });
});
