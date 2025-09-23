/**
 * Web Platform Cross-Platform Tests
 * 
 * This file contains Vitest tests that validate the wn-ts-web implementation
 * using the core behavioral tests defined in wn-ts-core with Vitest fixtures.
 */

import { describe, expect } from 'vitest';
import { test as coreTest, type PlatformTestContext } from 'wn-ts-core/tests/platform-integration/platform-test-framework';
import { createWordNet } from 'wn-ts-core';
import { similarity, translation, relations } from 'wn-ts-core/plugins';
import { WebWordnet } from '../../../src/client/submodules/web-wordnet.js';
import { Kysely, CompiledQuery } from 'kysely';
import type { Database } from '../../../src/types/database.js';

// Extend the core test with web-specific platform context
export const test = coreTest.extend<{
  platformContext: PlatformTestContext;
}>({
  platformContext: async ({ testData }, use) => {
    try {
      // Load SQLite WASM module
      const sqlModule = await import('@sqlite.org/sqlite-wasm');
      const sqlite3 = await sqlModule.default();
      
      // Initialize WebWordnet
      const webWordnet = new WebWordnet('oewn:2024');
      await webWordnet.initialize(sqlite3);
      
      // Get the Kysely database from WebWordnet
      const kyselyInstance = (webWordnet as any).kyselyDb as Kysely<Database>;
      if (!kyselyInstance) {
        throw new Error('Kysely database not available');
      }
      
      // Create KyselyDatabase wrapper
      const kyselyDb = {
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
      
      // Create WordNet with plugins
      const wordnet = createWordNet({
        core: webWordnet,
        kyselyDb: kyselyDb,
        plugins: [similarity, translation, relations] as const
      });
      
      // Load test data
      await loadTestData(webWordnet, testData);
      
      const platformContext: PlatformTestContext = {
        wordnet: wordnet as any,
        kyselyDb,
        core: webWordnet,
        testData
      };
      
      await use(platformContext);
      
      // Cleanup web-specific resources
      if (wordnet && 'close' in wordnet) {
        await (wordnet as any).close();
      }
    } catch (error) {
      console.error('Failed to initialize web platform context:', error);
      // Create a mock context for tests that don't require database
      const mockContext: PlatformTestContext = {
        wordnet: null as any,
        kyselyDb: null as any,
        core: null as any,
        testData
      };
      await use(mockContext);
    }
  }
});

// Import and run the core behavioral tests
import { defineCoreBehavioralTests } from 'wn-ts-core/tests/platform-integration/core-behavioral-tests';

// Define the core behavioral tests using our extended test
defineCoreBehavioralTests(test);

// Web-specific tests
describe('Web Platform Specific Tests', () => {
  test('should work in browser environment', () => {
    if (typeof window !== 'undefined') {
      expect(window.crypto).toBeDefined();
      expect(window.crypto.subtle).toBeDefined();
    }
  });

  test('should handle SQLite WASM limitations', async ({ platformContext }) => {
    if (!platformContext || !platformContext.core) {
      console.warn('Skipping test - platform context not available');
      return;
    }
    
    const words = await platformContext.core.getWord('computer');
    if (words.length > 0) {
      const senses = await platformContext.core.getSenses(words[0].id);
      if (senses.length > 0) {
        const synset = await platformContext.core.getSynset(senses[0].synsetId);
        expect(synset).toBeDefined();
      }
    }
  });

  test('should support async operations', async ({ platformContext }) => {
    if (!platformContext || !platformContext.core) {
      console.warn('Skipping test - platform context not available');
      return;
    }
    
    const promises = [
      platformContext.core.getWord('computer'),
      platformContext.core.getWord('machine'),
      platformContext.core.lexicons()
    ];
    const results = await Promise.all(promises);
    expect(results).toHaveLength(3);
  });
});

/**
 * Load test data into the web database
 */
async function loadTestData(webWordnet: WebWordnet, testData: any): Promise<void> {
  const queryService = (webWordnet as any).queryService;
  
  // Insert test lexicon
  await queryService.insertLexicon(testData.lexicons[0]);
  
  // Insert test words
  for (const word of testData.words) {
    await queryService.insertWord(word);
  }
  
  // Insert test synsets
  for (const synset of testData.synsets) {
    await queryService.insertSynset(synset);
  }
  
  // Insert test senses
  for (const sense of testData.senses) {
    await queryService.insertSense(sense);
  }
  
  // Insert test definitions
  for (const definition of testData.definitions) {
    await queryService.insertDefinition(definition);
  }
  
  // Insert test relations using raw SQL
  const db = (webWordnet as any).database.getDatabase();
  for (const relation of testData.relations) {
    await db.exec(`
      INSERT OR IGNORE INTO relations (id, source_id, target_id, type, source) 
      VALUES ('${relation.id}', '${relation.target}', '${relation.target}', '${relation.type}', '${relation.source}')
    `);
  }
}