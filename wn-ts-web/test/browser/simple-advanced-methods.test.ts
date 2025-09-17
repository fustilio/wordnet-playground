import { describe, it, expect, vi, beforeEach, afterEach, beforeAll } from 'vitest';
import { WordNetWorkerClient } from '../../src/client/wordnet-worker-client.js';
import type { Sqlite3Static } from '@sqlite.org/sqlite-wasm';

const isNode = typeof process !== 'undefined';

describe.skipIf(isNode)('Simple Advanced Methods Tests', () => {
  let workerClient: WordNetWorkerClient;
  let sqlModule: Sqlite3Static;

  beforeAll(async () => {
    try {
      const sqlite3 = (await import('@sqlite.org/sqlite-wasm')).default;
      sqlModule = await sqlite3();
    } catch (e) {
      console.warn('Could not load sqlite-wasm, skipping tests');
    }
  });

  beforeEach(async () => {
    if (!sqlModule) return;

    workerClient = new WordNetWorkerClient();
    await workerClient.initialize();
  });

  afterEach(async () => {
    if (workerClient) {
      await workerClient.dispose();
    }
  });

  describe('Core Translation Methods', () => {
    it.skipIf(!sqlModule)('should handle getWordsBySynsetAndLanguage gracefully', async () => {
      // Test with a non-existent synset to ensure graceful handling
      const words = await workerClient.getWordsBySynsetAndLanguage('non-existent', 'en');
      
      expect(Array.isArray(words)).toBe(true);
      expect(words).toHaveLength(0);
    });

    it.skipIf(!sqlModule)('should handle getDefinitionsBySynsetId gracefully', async () => {
      // Test with a non-existent synset to ensure graceful handling
      const definitions = await workerClient.getDefinitionsBySynsetId('non-existent');
      
      expect(Array.isArray(definitions)).toBe(true);
      expect(definitions).toHaveLength(0);
    });

    it.skipIf(!sqlModule)('should handle getSynsetById gracefully', async () => {
      // Test with a non-existent synset to ensure graceful handling
      const synset = await workerClient.getSynsetById('non-existent');
      
      expect(synset).toBeUndefined();
    });
  });

  describe('Error Handling', () => {
    it.skipIf(!sqlModule)('should handle worker not available', async () => {
      const uninitializedClient = new WordNetWorkerClient();
      
      await expect(uninitializedClient.getWordsBySynsetAndLanguage('test', 'en')).rejects.toThrow();
      await expect(uninitializedClient.getDefinitionsBySynsetId('test')).rejects.toThrow();
      await expect(uninitializedClient.getSynsetById('test')).rejects.toThrow();
    });
  });

  describe('Type Safety', () => {
    it.skipIf(!sqlModule)('should return properly typed arrays', async () => {
      const words = await workerClient.getWordsBySynsetAndLanguage('test', 'en');
      const definitions = await workerClient.getDefinitionsBySynsetId('test');
      
      expect(Array.isArray(words)).toBe(true);
      expect(Array.isArray(definitions)).toBe(true);
    });
  });
});
