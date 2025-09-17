import { describe, it, expect, vi, beforeEach, afterEach, beforeAll } from 'vitest';
import { WordNetWorkerClient } from '../../src/client/wordnet-worker-client.js';
import type { Sqlite3Static } from '@sqlite.org/sqlite-wasm';

const isNode = typeof process !== 'undefined';

describe.skipIf(isNode)('WordNetWorkerClient Advanced Methods', () => {
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
    it.skipIf(!sqlModule)('should get words by synset and language', async () => {
      // First, we need to load some data
      await workerClient.loadPackageData('oewn:2024');
      
      // Wait for initialization
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const words = await workerClient.getWordsBySynsetAndLanguage('oewn-03086983-n', 'en');
      
      expect(Array.isArray(words)).toBe(true);
      // The exact results depend on the loaded data
    });

    it.skipIf(!sqlModule)('should get definitions by synset ID', async () => {
      await workerClient.loadPackageData('oewn:2024');
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const definitions = await workerClient.getDefinitionsBySynsetId('oewn-03086983-n');
      
      expect(Array.isArray(definitions)).toBe(true);
      if (definitions.length > 0) {
        expect(definitions[0]).toHaveProperty('id');
        expect(definitions[0]).toHaveProperty('text');
        expect(definitions[0]).toHaveProperty('language');
        expect(definitions[0]).toHaveProperty('synsetId');
      }
    });

    it.skipIf(!sqlModule)('should get synset by ID', async () => {
      await workerClient.loadPackageData('oewn:2024');
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const synset = await workerClient.getSynsetById('oewn-03086983-n');
      
      if (synset) {
        expect(synset).toHaveProperty('id');
        expect(synset).toHaveProperty('pos');
        expect(synset).toHaveProperty('definitions');
        expect(synset).toHaveProperty('words');
        expect(synset).toHaveProperty('relations');
        expect(Array.isArray(synset.definitions)).toBe(true);
        expect(Array.isArray(synset.words)).toBe(true);
        expect(Array.isArray(synset.relations)).toBe(true);
      }
    });

    it.skipIf(!sqlModule)('should return undefined for non-existent synset', async () => {
      await workerClient.loadPackageData('oewn:2024');
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const synset = await workerClient.getSynsetById('non-existent-synset');
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

    it.skipIf(!sqlModule)('should handle worker errors gracefully', async () => {
      // Mock a worker error
      const mockRemote = {
        getWordsBySynsetAndLanguage: vi.fn().mockResolvedValue({ success: false, error: 'Test error' }),
        getDefinitionsBySynsetId: vi.fn().mockResolvedValue({ success: false, error: 'Test error' }),
        getSynsetById: vi.fn().mockResolvedValue({ success: false, error: 'Test error' })
      };
      
      // @ts-ignore - Access private property for testing
      workerClient.remote = mockRemote;
      
      await expect(workerClient.getWordsBySynsetAndLanguage('test', 'en')).rejects.toThrow('Test error');
      await expect(workerClient.getDefinitionsBySynsetId('test')).rejects.toThrow('Test error');
      await expect(workerClient.getSynsetById('test')).rejects.toThrow('Test error');
    });
  });

  describe('Type Safety', () => {
    it.skipIf(!sqlModule)('should return properly typed definitions', async () => {
      await workerClient.loadPackageData('oewn:2024');
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const definitions = await workerClient.getDefinitionsBySynsetId('oewn-03086983-n');
      
      if (definitions.length > 0) {
        const def = definitions[0];
        expect(typeof def.id).toBe('string');
        expect(typeof def.text).toBe('string');
        expect(typeof def.language).toBe('string');
        expect(typeof def.synsetId).toBe('string');
        expect(typeof def.source).toBe('string');
      }
    });

    it.skipIf(!sqlModule)('should return properly typed synset query result', async () => {
      await workerClient.loadPackageData('oewn:2024');
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const synset = await workerClient.getSynsetById('oewn-03086983-n');
      
      if (synset) {
        expect(typeof synset.id).toBe('string');
        expect(typeof synset.pos).toBe('string');
        expect(typeof synset.language).toBe('string');
        expect(typeof synset.lexicon).toBe('string');
        expect(Array.isArray(synset.definitions)).toBe(true);
        expect(Array.isArray(synset.words)).toBe(true);
        expect(Array.isArray(synset.relations)).toBe(true);
        
        // Check definition structure
        if (synset.definitions.length > 0) {
          const def = synset.definitions[0];
          expect(typeof def.id).toBe('string');
          expect(typeof def.text).toBe('string');
          expect(typeof def.language).toBe('string');
          expect(typeof def.synsetId).toBe('string');
        }
        
        // Check relation structure
        if (synset.relations.length > 0) {
          const rel = synset.relations[0];
          expect(typeof rel.id).toBe('string');
          expect(typeof rel.type).toBe('string');
          expect(typeof rel.sourceId).toBe('string');
          expect(typeof rel.targetId).toBe('string');
        }
      }
    });
  });

  describe('Performance', () => {
    it.skipIf(!sqlModule)('should complete requests within reasonable time', async () => {
      await workerClient.loadPackageData('oewn:2024');
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const startTime = Date.now();
      
      await workerClient.getWordsBySynsetAndLanguage('oewn-03086983-n', 'en');
      await workerClient.getDefinitionsBySynsetId('oewn-03086983-n');
      await workerClient.getSynsetById('oewn-03086983-n');
      
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      // Should complete within 5 seconds
      expect(duration).toBeLessThan(5000);
    });
  });
});
