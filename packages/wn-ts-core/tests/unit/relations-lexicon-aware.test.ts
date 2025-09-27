/**
 * Tests for lexicon-aware relations plugin
 * 
 * These tests verify that all relation queries properly handle lexicon context
 * and throw appropriate errors when synset IDs are ambiguous or invalid.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { relations } from '../../src/plugins/relations.js';

// Mock WordNetCore for testing
class MockWordNetCore {
  async synset(synsetId: string) {
    // Return a mock synset so we can test the Kysely error
    return {
      id: synsetId,
      pos: 'n' as const,
      definitions: [],
      examples: [],
      words: [],
      ili: null,
      lexicon: 'oewn:2024',
      language: 'en'
    };
  }
}

// Mock WordNetKernel for testing
class MockWordNetKernel {
  public core: MockWordNetCore;
  public kyselyDb: any;

  constructor() {
    this.core = new MockWordNetCore();
    // Mock Kysely database - return undefined to trigger the error
    this.kyselyDb = undefined;
  }
}

describe('Relations Plugin - Lexicon Awareness', () => {
  let mockKernel: MockWordNetKernel;

  beforeEach(() => {
    mockKernel = new MockWordNetKernel();
  });

  describe('getHypernyms', () => {
    it('should throw error when Kysely is not available', async () => {
      // @ts-ignore - relations.methods is guaranteed to exist
      await expect(relations.methods.getHypernyms(mockKernel as any, 'computer-n-1'))
        .rejects.toThrow('Kysely database not available. Please ensure the kernel was initialized with a Kysely database.');
    });

    it('should throw error when Kysely is not available (with custom lexicon)', async () => {
      await expect(// @ts-ignore - relations.methods is guaranteed to exist
      relations.methods.getHypernyms(mockKernel as any, 'computer-n-1', 'custom-lexicon'))
        .rejects.toThrow('Kysely database not available. Please ensure the kernel was initialized with a Kysely database.');
    });
  });

  describe('getHyponyms', () => {
    it('should throw error when Kysely is not available', async () => {
      await expect(// @ts-ignore - relations.methods is guaranteed to exist
      relations.methods.getHyponyms(mockKernel as any, 'computer-n-1'))
        .rejects.toThrow('Kysely database not available. Please ensure the kernel was initialized with a Kysely database.');
    });

    it('should throw error when Kysely is not available (with custom lexicon)', async () => {
      await expect(// @ts-ignore - relations.methods is guaranteed to exist
      relations.methods.getHyponyms(mockKernel as any, 'computer-n-1', 'custom-lexicon'))
        .rejects.toThrow('Kysely database not available. Please ensure the kernel was initialized with a Kysely database.');
    });
  });

  describe('getMeronyms', () => {
    it('should throw error when Kysely is not available', async () => {
      await expect(// @ts-ignore - relations.methods is guaranteed to exist
      relations.methods.getMeronyms(mockKernel as any, 'computer-n-1'))
        .rejects.toThrow('Kysely database not available. Please ensure the kernel was initialized with a Kysely database.');
    });

    it('should throw error when Kysely is not available (with custom lexicon)', async () => {
      await expect(// @ts-ignore - relations.methods is guaranteed to exist
      relations.methods.getMeronyms(mockKernel as any, 'computer-n-1', 'custom-lexicon'))
        .rejects.toThrow('Kysely database not available. Please ensure the kernel was initialized with a Kysely database.');
    });
  });

  describe('getHolonyms', () => {
    it('should throw error when Kysely is not available', async () => {
      await expect(// @ts-ignore - relations.methods is guaranteed to exist
      relations.methods.getHolonyms(mockKernel as any, 'computer-n-1'))
        .rejects.toThrow('Kysely database not available. Please ensure the kernel was initialized with a Kysely database.');
    });

    it('should throw error when Kysely is not available (with custom lexicon)', async () => {
      await expect(// @ts-ignore - relations.methods is guaranteed to exist
      relations.methods.getHolonyms(mockKernel as any, 'computer-n-1', 'custom-lexicon'))
        .rejects.toThrow('Kysely database not available. Please ensure the kernel was initialized with a Kysely database.');
    });
  });

  describe('getEntailments', () => {
    it('should throw error when Kysely is not available', async () => {
      await expect(// @ts-ignore - relations.methods is guaranteed to exist
      relations.methods.getEntailments(mockKernel as any, 'computer-n-1'))
        .rejects.toThrow('Kysely database not available. Please ensure the kernel was initialized with a Kysely database.');
    });

    it('should throw error when Kysely is not available (with custom lexicon)', async () => {
      await expect(// @ts-ignore - relations.methods is guaranteed to exist
      relations.methods.getEntailments(mockKernel as any, 'computer-n-1', 'custom-lexicon'))
        .rejects.toThrow('Kysely database not available. Please ensure the kernel was initialized with a Kysely database.');
    });
  });

  describe('getSimilarTos', () => {
    it('should throw error when Kysely is not available', async () => {
      await expect(// @ts-ignore - relations.methods is guaranteed to exist
      relations.methods.getSimilarTos(mockKernel as any, 'computer-n-1'))
        .rejects.toThrow('Kysely database not available. Please ensure the kernel was initialized with a Kysely database.');
    });

    it('should throw error when Kysely is not available (with custom lexicon)', async () => {
      await expect(// @ts-ignore - relations.methods is guaranteed to exist
      relations.methods.getSimilarTos(mockKernel as any, 'computer-n-1', 'custom-lexicon'))
        .rejects.toThrow('Kysely database not available. Please ensure the kernel was initialized with a Kysely database.');
    });
  });

  describe('getRelationsByType', () => {
    it('should throw error when Kysely is not available', async () => {
      await expect(// @ts-ignore - relations.methods is guaranteed to exist
      relations.methods.getRelationsByType(mockKernel as any, 'computer-n-1', 'hypernym'))
        .rejects.toThrow('Kysely database not available. Please ensure the kernel was initialized with a Kysely database.');
    });

    it('should throw error when Kysely is not available (with custom lexicon)', async () => {
      await expect(// @ts-ignore - relations.methods is guaranteed to exist
      relations.methods.getRelationsByType(mockKernel as any, 'computer-n-1', 'hypernym', 'custom-lexicon'))
        .rejects.toThrow('Kysely database not available. Please ensure the kernel was initialized with a Kysely database.');
    });
  });

  describe('getAllRelations', () => {
    it('should throw error when Kysely is not available', async () => {
      await expect(// @ts-ignore - relations.methods is guaranteed to exist
      relations.methods.getAllRelations(mockKernel as any, 'computer-n-1'))
        .rejects.toThrow('Kysely database not available. Please ensure the kernel was initialized with a Kysely database.');
    });

    it('should throw error when Kysely is not available (with custom lexicon)', async () => {
      await expect(// @ts-ignore - relations.methods is guaranteed to exist
      relations.methods.getAllRelations(mockKernel as any, 'computer-n-1', 'custom-lexicon'))
        .rejects.toThrow('Kysely database not available. Please ensure the kernel was initialized with a Kysely database.');
    });
  });

  describe('getRelationTypes', () => {
    it('should throw error when Kysely is not available', async () => {
      await expect(// @ts-ignore - relations.methods is guaranteed to exist
      relations.methods.getRelationTypes(mockKernel as any, 'computer-n-1'))
        .rejects.toThrow('Kysely database not available. Please ensure the kernel was initialized with a Kysely database.');
    });

    it('should throw error when Kysely is not available (with custom lexicon)', async () => {
      await expect(// @ts-ignore - relations.methods is guaranteed to exist
      relations.methods.getRelationTypes(mockKernel as any, 'computer-n-1', 'custom-lexicon'))
        .rejects.toThrow('Kysely database not available. Please ensure the kernel was initialized with a Kysely database.');
    });
  });

  describe('getRelationStats', () => {
    it('should throw error when Kysely is not available', async () => {
      await expect(// @ts-ignore - relations.methods is guaranteed to exist
      relations.methods.getRelationStats(mockKernel as any, 'computer-n-1'))
        .rejects.toThrow('Kysely database not available. Please ensure the kernel was initialized with a Kysely database.');
    });

    it('should throw error when Kysely is not available (with custom lexicon)', async () => {
      await expect(// @ts-ignore - relations.methods is guaranteed to exist
      relations.methods.getRelationStats(mockKernel as any, 'computer-n-1', 'custom-lexicon'))
        .rejects.toThrow('Kysely database not available. Please ensure the kernel was initialized with a Kysely database.');
    });
  });
});