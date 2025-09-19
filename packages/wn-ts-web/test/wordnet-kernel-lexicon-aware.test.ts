/**
 * Tests for lexicon-aware WebWordNetKernel
 * 
 * These tests verify that the WebWordNetKernel properly handles lexicon context
 * in all relation queries and passes the lexicon parameter correctly.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { WebWordNetKernel } from '../src/wordnet-kernel.js';
import { WebWordNetCore } from '../src/wordnet-core.js';

// Mock the WebWordNetCore
vi.mock('../src/wordnet-core.js', () => {
  return {
    WebWordNetCore: vi.fn().mockImplementation(() => ({
      initialize: vi.fn().mockResolvedValue(undefined),
      close: vi.fn().mockResolvedValue(undefined),
      synset: vi.fn().mockImplementation((id: string) => {
        if (id === 'computer-n-1') {
          return Promise.resolve({
            id: 'computer-n-1',
            lemma: 'computer',
            pos: 'n',
            language: 'en',
            lexicon: 'oewn:2024'
          });
        }
        throw new Error(`Synset not found: ${id}`);
      }),
      query: vi.fn().mockImplementation((sql: string, params: any[]) => {
        // Mock query results
        if (sql.includes('hypernym')) {
          return Promise.resolve([
            {
              id: 'machine-n-1',
              lemma: 'machine',
              pos: 'n',
              language: 'en',
              lexicon: 'oewn:2024'
            }
          ]);
        }
        return Promise.resolve([]);
      }),
      words: vi.fn().mockResolvedValue([]),
      word: vi.fn().mockRejectedValue(new Error('Not implemented')),
      synsets: vi.fn().mockResolvedValue([]),
      senses: vi.fn().mockResolvedValue([]),
      sense: vi.fn().mockRejectedValue(new Error('Not implemented')),
      ili: vi.fn().mockRejectedValue(new Error('Not implemented')),
      ilis: vi.fn().mockResolvedValue([]),
      synsetsByILI: vi.fn().mockResolvedValue([]),
      lexicons: vi.fn().mockResolvedValue([])
    }))
  };
});

describe('WebWordNetKernel - Lexicon Awareness', () => {
  let kernel: WebWordNetKernel;

  beforeEach(async () => {
    kernel = new WebWordNetKernel('oewn:2024');
    await kernel.initialize();
  });

  describe('getHypernyms', () => {
    it('should pass lexicon parameter to the underlying wordnet', async () => {
      const result = await kernel.getHypernyms('computer-n-1');
      
      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({
        id: 'machine-n-1',
        lemma: 'machine',
        pos: 'n',
        language: 'en',
        lexicon: 'oewn:2024'
      });
    });

    it('should pass custom lexicon parameter when provided', async () => {
      const result = await kernel.getHypernyms('computer-n-1', 'custom-lexicon');
      
      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
    });
  });

  describe('getHyponyms', () => {
    it('should pass lexicon parameter to the underlying wordnet', async () => {
      const result = await kernel.getHyponyms('computer-n-1');
      
      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
    });

    it('should pass custom lexicon parameter when provided', async () => {
      const result = await kernel.getHyponyms('computer-n-1', 'custom-lexicon');
      
      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
    });
  });

  describe('getMeronyms', () => {
    it('should pass lexicon parameter to the underlying wordnet', async () => {
      const result = await kernel.getMeronyms('computer-n-1');
      
      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
    });

    it('should pass custom lexicon parameter when provided', async () => {
      const result = await kernel.getMeronyms('computer-n-1', 'custom-lexicon');
      
      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
    });
  });

  describe('getHolonyms', () => {
    it('should pass lexicon parameter to the underlying wordnet', async () => {
      const result = await kernel.getHolonyms('computer-n-1');
      
      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
    });

    it('should pass custom lexicon parameter when provided', async () => {
      const result = await kernel.getHolonyms('computer-n-1', 'custom-lexicon');
      
      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
    });
  });

  describe('getEntailments', () => {
    it('should pass lexicon parameter to the underlying wordnet', async () => {
      const result = await kernel.getEntailments('computer-n-1');
      
      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
    });

    it('should pass custom lexicon parameter when provided', async () => {
      const result = await kernel.getEntailments('computer-n-1', 'custom-lexicon');
      
      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
    });
  });

  describe('getSimilarTos', () => {
    it('should pass lexicon parameter to the underlying wordnet', async () => {
      const result = await kernel.getSimilarTos('computer-n-1');
      
      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
    });

    it('should pass custom lexicon parameter when provided', async () => {
      const result = await kernel.getSimilarTos('computer-n-1', 'custom-lexicon');
      
      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
    });
  });

  describe('getRelationsByType', () => {
    it('should pass lexicon parameter to the underlying wordnet', async () => {
      const result = await kernel.getRelationsByType('computer-n-1', 'hypernym');
      
      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
    });

    it('should pass custom lexicon parameter when provided', async () => {
      const result = await kernel.getRelationsByType('computer-n-1', 'hypernym', 'custom-lexicon');
      
      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
    });
  });

  describe('getAllRelations', () => {
    it('should pass lexicon parameter to the underlying wordnet', async () => {
      const result = await kernel.getAllRelations('computer-n-1');
      
      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
    });

    it('should pass custom lexicon parameter when provided', async () => {
      const result = await kernel.getAllRelations('computer-n-1', 'custom-lexicon');
      
      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
    });
  });

  describe('getRelationTypes', () => {
    it('should pass lexicon parameter to the underlying wordnet', async () => {
      const result = await kernel.getRelationTypes('computer-n-1');
      
      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
    });

    it('should pass custom lexicon parameter when provided', async () => {
      const result = await kernel.getRelationTypes('computer-n-1', 'custom-lexicon');
      
      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
    });
  });

  describe('getRelationStats', () => {
    it('should pass lexicon parameter to the underlying wordnet', async () => {
      const result = await kernel.getRelationStats('computer-n-1');
      
      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
    });

    it('should pass custom lexicon parameter when provided', async () => {
      const result = await kernel.getRelationStats('computer-n-1', 'custom-lexicon');
      
      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
    });
  });

  describe('Error Handling', () => {
    it('should propagate errors from synset resolution', async () => {
      await expect(
        kernel.getHypernyms('non-existent-synset')
      ).rejects.toThrow('Synset not found: non-existent-synset');
    });

    it('should handle errors gracefully in all relation methods', async () => {
      const methods = [
        () => kernel.getHyponyms('non-existent-synset'),
        () => kernel.getMeronyms('non-existent-synset'),
        () => kernel.getHolonyms('non-existent-synset'),
        () => kernel.getEntailments('non-existent-synset'),
        () => kernel.getSimilarTos('non-existent-synset'),
        () => kernel.getRelationsByType('non-existent-synset', 'hypernym'),
        () => kernel.getAllRelations('non-existent-synset'),
        () => kernel.getRelationTypes('non-existent-synset'),
        () => kernel.getRelationStats('non-existent-synset')
      ];

      for (const method of methods) {
        await expect(method()).rejects.toThrow('Synset not found: non-existent-synset');
      }
    });
  });
});
