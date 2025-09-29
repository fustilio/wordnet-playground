/**
 * Shared utilities for integration tests
 * 
 * This module provides common setup, teardown, and helper functions
 * to reduce duplication across integration test files.
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import type { WordNetCore } from '../wordnet-kernel.js';
import { Kysely, SqliteDialect } from 'kysely';
import type Database from 'better-sqlite3';
import type { Database as DatabaseSchema } from '../types/database.js';
import { createTables, createIndexes } from '../modules/database-operations/mutations/schema-mutations.js';
import { insertRecords } from '../modules/database-operations/mutations/insert-mutations.js';
import { getTestContext, type TestContext } from './test-data-manager.js';
import { COMMON_PARTS_OF_SPEECH } from '../core/shared-types.js';

// Define proper types for test data that match the actual database schema
export interface TestLexicon {
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

export interface IntegrationTestContext {
  testContext: TestContext;
  tempDbPath: string;
  sqliteDb: Database.Database;
  kyselyDb: Kysely<DatabaseSchema>;
  mockCore: WordNetCore;
}

/**
 * Common test data for integration tests
 */
export const COMMON_TEST_DATA = {
  lexicons: [
    {
      id: 'test-lexicon',
      label: 'Test Lexicon',
      language: 'en',
      email: 'test@example.com',
      license: 'MIT',
      version: '1.0',
      url: 'https://example.com',
      citation: 'Test Citation',
      logo: null,
      metadata: null
    },
    {
      id: 'test-lexicon-2',
      label: 'Test Lexicon 2',
      language: 'fr',
      email: 'test@example.com',
      license: 'MIT',
      version: '1.0',
      url: 'https://example.com',
      citation: 'Test Citation',
      logo: null,
      metadata: null
    }
  ],
  words: [
    {
      id: 'computer-n-1',
      lemma: 'computer',
      pos: 'n' as const,
      forms: [
        { id: 'form-computer-1', writtenForm: 'computer' },
        { id: 'form-computer-2', writtenForm: 'comp' }
      ],
      pronunciations: [],
      syntacticBehaviours: [],
      lexicon: 'test-lexicon'
    },
    {
      id: 'run-v-1',
      lemma: 'run',
      pos: 'v' as const,
      forms: [{ id: 'form-run-1', writtenForm: 'run' }],
      pronunciations: [],
      syntacticBehaviours: [],
      lexicon: 'test-lexicon'
    },
    {
      id: 'happy-a-1',
      lemma: 'happy',
      pos: 'a' as const,
      forms: [{ id: 'form-happy-1', writtenForm: 'happy' }],
      pronunciations: [],
      syntacticBehaviours: [],
      lexicon: 'test-lexicon'
    }
  ],
  synsets: [
    {
      id: 'computer-n-1',
      pos: 'n' as const,
      definitions: [{ id: 'def-computer-1', language: 'en', text: 'A machine for performing calculations automatically' }],
      examples: [],
      ili: 'i-computer-1',
      iliDefinitions: [],
      lexicon: 'test-lexicon'
    },
    {
      id: 'run-v-1',
      pos: 'v' as const,
      definitions: [{ id: 'def-run-1', language: 'en', text: 'Move fast by using one\'s feet' }],
      examples: [],
      ili: 'i-run-1',
      iliDefinitions: [],
      lexicon: 'test-lexicon'
    }
  ],
  senses: [
    {
      id: 'sense-computer-1',
      wordId: 'computer-n-1',
      synsetId: 'computer-n-1',
      examples: [],
      counts: [],
      register: 'standard' as const
    },
    {
      id: 'sense-run-1',
      wordId: 'run-v-1',
      synsetId: 'run-v-1',
      examples: [],
      counts: [],
      register: 'standard' as const
    }
  ],
  relations: [
    {
      id: 'rel-1',
      source_id: 'computer-n-1',
      target_id: 'run-v-1',
      type: 'hypernym',
      source: 'test-lexicon'
    },
    {
      id: 'rel-2',
      source_id: 'run-v-1',
      target_id: 'computer-n-1',
      type: 'hyponym',
      source: 'test-lexicon'
    }
  ],
  examples: [
    {
      id: 'ex-1',
      synset_id: 'computer-n-1',
      sense_id: 'sense-computer-1',
      text: 'The computer is running',
      language: 'en',
      source: 'test'
    },
    {
      id: 'ex-2',
      synset_id: 'computer-n-1',
      sense_id: 'sense-computer-1',
      text: 'My computer crashed',
      language: 'en',
      source: 'test'
    },
    {
      id: 'ex-3',
      synset_id: 'run-v-1',
      sense_id: 'sense-run-1',
      text: 'I run every morning',
      language: 'en',
      source: 'test'
    }
  ]
};

/**
 * Setup function for integration tests
 * Creates a temporary database and sets up the test environment
 */
export async function setupIntegrationTest(): Promise<IntegrationTestContext> {
  // Get test context from TestDataManager
  const testContext = await getTestContext();
  
  // Create temporary database file
  const tempDbPath = `${testContext.tempDir}/test.db`;
  
  // Initialize SQLite database
  const { default: Database } = await import('better-sqlite3');
  const sqliteDb = new Database(tempDbPath);
  
  // Initialize Kysely database
  const kyselyDb = new Kysely<DatabaseSchema>({
    dialect: new SqliteDialect({
      database: sqliteDb
    })
  });
  
  // Create tables and indexes
  await createTables(kyselyDb);
  await createIndexes(kyselyDb);
  
  // Insert test data
  await insertRecords(kyselyDb, 'lexicons', COMMON_TEST_DATA.lexicons);
  
  // Convert test data to database format
  const wordsForDb = COMMON_TEST_DATA.words.map(word => ({
    id: word.id,
    lemma: word.lemma,
    pos: word.pos,
    language: 'en',
    lexicon: 'test-lexicon'
  }));
  
  const formsForDb = COMMON_TEST_DATA.words.flatMap(word => 
    word.forms.map(form => ({
      id: form.id,
      word_id: word.id,
      written_form: form.writtenForm,
      script: null,
      tag: null
    }))
  );
  
  const synsetsForDb = COMMON_TEST_DATA.synsets.map(synset => ({
    id: synset.id,
    pos: synset.pos,
    language: 'en',
    lexicon: 'test-lexicon',
    ili: synset.ili
  }));
  
  const definitionsForDb = COMMON_TEST_DATA.synsets.flatMap(synset =>
    synset.definitions.map(def => ({
      id: def.id,
      synset_id: synset.id,
      language: def.language,
      text: def.text,
      source: 'test'
    }))
  );
  
  const sensesForDb = COMMON_TEST_DATA.senses.map(sense => ({
    id: sense.id,
    word_id: sense.wordId,
    synset_id: sense.synsetId,
    source: 'test',
    sensekey: `${sense.wordId}%1:00:00::`,
    adjposition: null,
    subcategory: null,
    domain: null,
    register: sense.register
  }));
  
  const ilisForDb = COMMON_TEST_DATA.synsets.map(synset => ({
    id: synset.ili,
    definition: `Test ILI definition for ${synset.ili}`,
    status: 'standard' as const,
    superseded_by: null,
    note: null,
    meta: '{}'
  }));
  
  await insertRecords(kyselyDb, 'words', wordsForDb);
  await insertRecords(kyselyDb, 'forms', formsForDb);
  await insertRecords(kyselyDb, 'synsets', synsetsForDb);
  await insertRecords(kyselyDb, 'definitions', definitionsForDb);
  await insertRecords(kyselyDb, 'senses', sensesForDb);
  await insertRecords(kyselyDb, 'ilis', ilisForDb);
  await insertRecords(kyselyDb, 'relations', COMMON_TEST_DATA.relations);
  await insertRecords(kyselyDb, 'examples', COMMON_TEST_DATA.examples);
  
  // Create mock WordNetCore
  const mockCore = {
    query: async () => {
      // Mock implementation - return empty results for now
      return [];
    },
    async word(wordId: string) {
      return COMMON_TEST_DATA.words.find(w => w.id === wordId) || null;
    },
    async synset(synsetId: string) {
      return COMMON_TEST_DATA.synsets.find(s => s.id === synsetId) || null;
    },
    async sense(senseId: string) {
      return COMMON_TEST_DATA.senses.find(s => s.id === senseId) || null;
    },
    async ili(iliId: string) {
      return COMMON_TEST_DATA.synsets.find(s => s.ili === iliId) ? {
        id: iliId,
        definition: `Test ILI definition for ${iliId}`,
        language: 'en',
        source: 'test'
      } : null;
    },
    async synsetsByILI(iliId: string) {
      return COMMON_TEST_DATA.synsets.filter(s => s.ili === iliId);
    },
    getWord: async (form: string) => {
      return COMMON_TEST_DATA.words.filter(w => 
        w.lemma === form || w.forms.some(f => f.writtenForm === form)
      );
    },
    getSynset: async (id: string) => {
      return COMMON_TEST_DATA.synsets.find(s => s.id === id) || null;
    },
    getSenses: async (wordId: string) => {
      return COMMON_TEST_DATA.senses.filter(s => s.wordId === wordId);
    },
    async lexicons() {
      return COMMON_TEST_DATA.lexicons;
    },
    async synsets(options: any) {
      return COMMON_TEST_DATA.synsets.filter(synset => 
        !options?.lexicon || synset.lexicon === options.lexicon
      );
    },
    async words(options: any) {
      return COMMON_TEST_DATA.words.filter(word => 
        !options?.lexicon || word.lexicon === options.lexicon
      );
    },
    async senses(options: any) {
      return COMMON_TEST_DATA.senses.filter(sense => 
        !options?.wordIdOrForm || sense.wordId === options.wordIdOrForm
      );
    },
    async ilis() {
      return COMMON_TEST_DATA.synsets.map(synset => ({
        id: synset.ili,
        definition: `Test ILI definition for ${synset.id}`,
        language: 'en',
        source: 'test'
      }));
    },
    async getDefinitions(synsetId: string) {
      const synset = COMMON_TEST_DATA.synsets.find(s => s.id === synsetId);
      return synset?.definitions || [];
    },
    async getRelations() {
      // Return empty relations for now
      return [];
    }
  } as unknown as WordNetCore;
  
  return {
    testContext,
    tempDbPath,
    sqliteDb,
    kyselyDb,
    mockCore
  };
}

/**
 * Teardown function for integration tests
 * Cleans up the test environment and temporary files
 */
export async function teardownIntegrationTest(context: IntegrationTestContext): Promise<void> {
  try {
    // Close database connections
    context.sqliteDb.close();
    await context.kyselyDb.destroy();
    
    // Cleanup test context
    await context.testContext.cleanup();
  } catch (error) {
    console.warn('Error during test teardown:', error);
  }
}

/**
 * Helper function to create a test suite with common setup/teardown
 */
export function createIntegrationTestSuite(
  suiteName: string,
  testFn: (getContext: () => IntegrationTestContext) => void
) {
  describe(suiteName, () => {
    let context: IntegrationTestContext;
    
    beforeAll(async () => {
      context = await setupIntegrationTest();
    });
    
    afterAll(async () => {
      await teardownIntegrationTest(context);
    });
    
    // Execute the test function with a getter function
    testFn(() => context);
  });
}

/**
 * Helper function to create a test with database context
 */
export function createDatabaseTest(
  testName: string,
  testFn: (context: IntegrationTestContext) => void | Promise<void>
) {
  it(testName, async () => {
    // This will be called within a describe block that has context set up
    // The actual context will be passed from the parent describe block
    return testFn;
  });
}

/**
 * Common assertion helpers
 */
export const testAssertions = {
  /**
   * Assert that a query result has the expected structure
   */
  expectQueryResult: (result: any, expectedFields: string[]) => {
    expect(result).toBeDefined();
    expect(Array.isArray(result)).toBe(true);
    
    if (result.length > 0) {
      const firstItem = result[0];
      expectedFields.forEach(field => {
        expect(firstItem).toHaveProperty(field);
      });
    }
  },
  
  /**
   * Assert that a query result contains expected items
   */
  expectContainsItems: (result: any[], expectedItems: any[]) => {
    expect(result.length).toBeGreaterThanOrEqual(expectedItems.length);
    
    expectedItems.forEach(expectedItem => {
      const found = result.some(item => 
        Object.keys(expectedItem).every(key => 
          item[key] === expectedItem[key]
        )
      );
      expect(found).toBe(true);
    });
  },
  
  /**
   * Assert that a query result is sorted correctly
   */
  expectSortedBy: (result: any[], field: string, direction: 'asc' | 'desc' = 'asc') => {
    for (let i = 1; i < result.length; i++) {
      const prev = result[i - 1][field];
      const curr = result[i][field];
      
      if (direction === 'asc') {
        expect(prev <= curr).toBe(true);
      } else {
        expect(prev >= curr).toBe(true);
      }
    }
  }
};

/**
 * Common test data generators
 */
export const testDataGenerators = {
  /**
   * Generate test words with specific patterns
   */
  generateWords: (count: number, prefix: string = 'word') => {
    return Array.from({ length: count }, (_, i) => ({
      id: `${prefix}-${i}`,
      lemma: `${prefix}${i}`,
      pos: COMMON_PARTS_OF_SPEECH[i % COMMON_PARTS_OF_SPEECH.length],
      language: 'en',
      lexicon: 'test-lexicon'
    }));
  },
  
  /**
   * Generate test forms for words
   */
  generateForms: (wordIds: string[], prefix: string = 'form') => {
    return wordIds.flatMap((wordId, wordIndex) => [
      {
        id: `${prefix}-${wordIndex}`,
        word_id: wordId,
        written_form: wordId.replace('word-', ''),
        script: null,
        tag: null
      }
    ]);
  },
  
  /**
   * Generate test synsets with specific patterns
   */
  generateSynsets: (count: number, prefix: string = 'synset') => {
    return Array.from({ length: count }, (_, i) => ({
      id: `${prefix}-${i}`,
      pos: COMMON_PARTS_OF_SPEECH[i % COMMON_PARTS_OF_SPEECH.length],
      language: 'en',
      lexicon: 'test-lexicon',
      ili: `i-${i}`
    }));
  },
  
  /**
   * Generate test definitions for synsets
   */
  generateDefinitions: (synsetIds: string[], prefix: string = 'def') => {
    return synsetIds.flatMap((synsetId, synsetIndex) => [
      {
        id: `${prefix}-${synsetIndex}`,
        synset_id: synsetId,
        language: 'en',
        text: `Definition for ${synsetId}`,
        source: 'test'
      }
    ]);
  },
  
  /**
   * Generate test senses with specific patterns
   */
  generateSenses: (count: number, wordPrefix: string = 'word', synsetPrefix: string = 'synset') => {
    return Array.from({ length: count }, (_, i) => ({
      id: `sense-${i}`,
      word_id: `${wordPrefix}-${i}`,
      synset_id: `${synsetPrefix}-${i}`,
      source: 'test',
      sensekey: `${wordPrefix}-${i}%1:00:00::`,
      adjposition: null,
      subcategory: null,
      domain: null,
      register: 'standard' as const
    }));
  }
};
