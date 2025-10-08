/**
 * Node Platform Cross-Platform Tests
 * 
 * This file contains Vitest tests that validate the wn-ts-node implementation
 * using the core behavioral tests defined in wn-ts-core with Vitest fixtures.
 */

import { describe, expect } from 'vitest';
import { test as coreTest, type PlatformTestContext } from 'wn-ts-core/tests/integration/platform-integration/platform-test-framework';
import { createWordNet } from 'wn-ts-core';
import { similarity, translation, relations } from 'wn-ts-core/plugins';
import { Wordnet } from '../../../src/wordnet.js';
import { Kysely, CompiledQuery } from 'kysely';
import type { Database } from '../../../src/database/types/database.js';
import * as BetterSqlite3Database from 'better-sqlite3';
import { SqliteDialect } from 'kysely';
import { join } from 'path';
import { tmpdir } from 'os';
import { unlinkSync, existsSync } from 'fs';

// Robust cleanup function for Windows file system issues
async function cleanupFile(filePath: string): Promise<void> {
  if (!existsSync(filePath)) return;
  
  let attempts = 0;
  const maxAttempts = 5;
  
  while (attempts < maxAttempts) {
    try {
      unlinkSync(filePath);
      break; // Success, exit the loop
    } catch (error) {
      attempts++;
      if (attempts < maxAttempts) {
        // Wait longer between attempts (exponential backoff)
        const delay = 1000 * Math.pow(2, attempts - 1);
        await new Promise(resolve => setTimeout(resolve, delay));
        console.warn(`Cleanup attempt ${attempts} failed, retrying in ${delay}ms:`, error);
      } else {
        console.warn(`Failed to clean up file after ${maxAttempts} attempts:`, error);
      }
    }
  }
}

// Extend the core test with node-specific platform context
export const test = coreTest.extend<{
  platformContext: PlatformTestContext;
}>({
  platformContext: async ({ testData }, use) => {
    // Create temporary database file
    const dbPath = join(tmpdir(), `wordnet-test-${Date.now()}.db`);
    
        // Initialize SQLite database
        const db = new BetterSqlite3Database.default(dbPath);
    
    // Create Kysely instance
    const kyselyDb = new Kysely<Database>({
      dialect: new SqliteDialect({
        database: db
      })
    });
    
    // Initialize Wordnet
    const nodeWordnet = new Wordnet('oewn:2024');
    
    // Trigger initialization by calling a method
    await nodeWordnet.lexicons();
    
    // Create KyselyDatabase wrapper
    const kyselyDbWrapper = {
      db: kyselyDb,
      executeSchemaModification: async (sql: string) => {
        await kyselyDb.executeQuery(CompiledQuery.raw(sql));
      },
      getTableInfo: async (tableName: string) => {
        const result = await kyselyDb.executeQuery(CompiledQuery.raw(`PRAGMA table_info(${tableName})`));
        return result.rows || [];
      },
      getIndexInfo: async (tableName: string) => {
        const result = await kyselyDb.executeQuery(CompiledQuery.raw(`PRAGMA index_list(${tableName})`));
        return result.rows || [];
      },
      getConstraintInfo: async (tableName: string) => {
        const result = await kyselyDb.executeQuery(CompiledQuery.raw(`PRAGMA foreign_key_list(${tableName})`));
        return result.rows || [];
      }
    };
    
    // Create WordNet with plugins
    const wordnet = createWordNet({
      core: nodeWordnet,
      kyselyDb: kyselyDbWrapper,
      plugins: [similarity, translation, relations] as const
    });
    
    // Note: We don't load test data as the tests are designed to work with empty databases
    
    const platformContext: PlatformTestContext = {
      wordnet: wordnet as any,
      kyselyDb: kyselyDbWrapper,
      core: nodeWordnet,
      testData
    };
    
    await use(platformContext);
    
    // Cleanup node-specific resources
    if (wordnet && 'close' in wordnet) {
      await (wordnet as any).close();
    }
    
    // Remove temporary database file with retry logic
    await cleanupFile(dbPath);
  }
});

// Import and run the core behavioral tests
import { defineCoreBehavioralTests } from 'wn-ts-core/tests/integration/platform-integration/core-behavioral-tests';

// Define the core behavioral tests using our extended test
defineCoreBehavioralTests(test);

// Node-specific tests
describe('Node Platform Specific Tests', () => {
  test('should work in Node.js environment', () => {
    expect(process).toBeDefined();
    expect(process.versions?.node).toBeDefined();
  });

  test('should support file system operations', () => {
    const fs = require('fs');
    const path = require('path');
    expect(fs.existsSync).toBeDefined();
    expect(path.resolve).toBeDefined();
  });

  test('should handle memory efficiently', async ({ platformContext }) => {
    if (!platformContext || !platformContext.core) {
      console.warn('Skipping test - platform context not available');
      return;
    }
    
    const initialMemory = process.memoryUsage?.();
    
    const promises = Array.from({ length: 100 }, (_, i) => 
      platformContext.core.getWord(`word${i}`)
    );
    
    await Promise.allSettled(promises);
    
    const finalMemory = process.memoryUsage?.();
    if (initialMemory && finalMemory) {
      const memoryIncrease = finalMemory.heapUsed - initialMemory.heapUsed;
      expect(memoryIncrease).toBeLessThan(100 * 1024 * 1024); // 100MB
    }
  });

  test('should support batch operations', async ({ platformContext }) => {
    if (!platformContext || !platformContext.core) {
      console.warn('Skipping test - platform context not available');
      return;
    }
    
    const queryService = (platformContext.core as any).queryService;
    
    if (queryService && 'batchInsert' in queryService) {
      const testWords = Array.from({ length: 10 }, (_, i) => ({
        id: `batch-word-${i}`,
        lemma: `batchword${i}`,
        pos: 'n',
        language: 'en',
        lexicon: 'test-lexicon',
        forms: [],
        pronunciations: [],
        tags: [],
        counts: []
      }));
      
      await (queryService as any).batchInsert('words', testWords);
      
      const words = await platformContext.core.getWord('batchword0');
      expect(words.length).toBeGreaterThan(0);
    }
  });
});
