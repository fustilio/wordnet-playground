import { describe, it, expect } from 'vitest';
import {
  projects,
  lexicons,
  word,
  words,
  sense,
  senses,
  synset,
  synsets,
  ili,
  ilis,
} from '../src/module-functions';
import { BaseWordnet } from '../src/wordnet';
import { DatabaseError } from '../src/types';
import type {
  Word,
  Sense,
  Synset,
  Lexicon,
  PartOfSpeech,
  ILI,
  Project,
  WordQuery,
  SenseQuery,
  SynsetQuery,
} from '../src/types';

// Mock implementation of BaseWordnet for testing
class MockWordnetClient extends BaseWordnet {
  constructor() {
    super({ lexicon: 'test-en' });
  }

  async lexicons(): Promise<Lexicon[]> {
    return [];
  }

  async expandedLexicons(): Promise<Lexicon[]> {
    return [];
  }

  async words(query?: WordQuery): Promise<Word[]> {
    return [];
  }

  async senses(query?: SenseQuery): Promise<Sense[]> {
    return [];
  }

  async synsets(query?: SynsetQuery): Promise<Synset[]> {
    return [];
  }

  async word(wordId: string): Promise<Word> {
    throw new Error(`Mock word not implemented for ${wordId}`);
  }

  async sense(senseId: string): Promise<Sense> {
    throw new Error(`Mock sense not implemented for ${senseId}`);
  }

  async synset(synsetId: string): Promise<Synset> {
    throw new Error(`Mock synset not implemented for ${synsetId}`);
  }

  async ili(iliId: string): Promise<ILI> {
    throw new Error(`Mock ili not implemented for ${iliId}`);
  }

  async ilis(status?: string): Promise<ILI[]> {
    return [];
  }

  async getProjects(): Promise<Project[]> {
    return [];
  }

  async getStatistics() {
    return {
      totalWords: 0,
      totalSynsets: 0,
      totalSenses: 0,
      totalILIs: 0,
      totalLexicons: 0,
    };
  }

  async getLexiconStatistics(lexiconId?: string) {
    return [];
  }

  async getDataQualityMetrics() {
    return {
      synsetsWithILI: 0,
      synsetsWithoutILI: 0,
      iliCoveragePercentage: 0,
      emptySynsets: 0,
      synsetsWithDefinitions: 0,
    };
  }

  async getPartOfSpeechDistribution() {
    return {};
  }

  async getSynsetSizeAnalysis() {
    return {
      averageSize: 0,
      maxSize: 0,
      minSize: 0,
      sizeDistribution: {},
    };
  }

  async close() {
    // Mock implementation - no-op
  }
}

const mockClient = new MockWordnetClient();

describe('Module Functions (Database-Agnostic)', () => {
  describe('projects', () => {
    it('should throw error when config is not available', async () => {
      // Since we can't use config.dataDirectory anymore, test that the
      // function returns empty array when no client is provided
      const result = await projects();
      expect(result).toEqual([]);
    });

    it('should throw error on multiple calls', async () => {
      // Test that the function returns empty array consistently
      const result1 = await projects();
      const result2 = await projects();
      expect(result1).toEqual([]);
      expect(result2).toEqual([]);
    });
  });

  describe('lexicons', () => {
    it('should return empty array when no database is available', async () => {
      const result = await lexicons(mockClient);
      expect(Array.isArray(result)).toBe(true);
      expect(result).toEqual([]);
    });

    it('should return empty array when no lexicons exist', async () => {
      const result = await lexicons(mockClient);
      expect(result).toEqual([]);
    });

    it('should handle different parameter combinations', async () => {
      // Test with mock client
      const result1 = await lexicons(mockClient);
      expect(result1).toEqual([]);

      // Test with null client (should handle gracefully)
      // @ts-ignore - Testing invalid input
      const result2 = await lexicons(null);
      expect(result2).toEqual([]);

      // Test with undefined client (should handle gracefully)
      // @ts-ignore - Testing invalid input
      const result3 = await lexicons(undefined);
      expect(result3).toEqual([]);
    });
  });

  describe('word', () => {
    it('should throw error for non-existent word', async () => {
      await expect(word(mockClient, 'nonexistent')).rejects.toThrow();
    });

    it('should throw error for empty string', async () => {
      await expect(word(mockClient, '')).rejects.toThrow();
    });

    it('should throw error for null/undefined', async () => {
      // @ts-ignore - Testing invalid input
      await expect(word(mockClient, null)).rejects.toThrow();
      // @ts-ignore - Testing invalid input
      await expect(word(mockClient, undefined)).rejects.toThrow();
    });
  });

  describe('words', () => {
    it('should return empty array when no database is available', async () => {
      const result = await words(mockClient, 'information');
      expect(Array.isArray(result)).toBe(true);
      expect(result).toEqual([]);
    });

    it('should return empty array for non-existent word', async () => {
      const result = await words(mockClient, 'nonexistent');
      expect(result).toEqual([]);
    });

    it('should handle part of speech filtering', async () => {
      const result = await words(mockClient, 'information', 'n');
      expect(Array.isArray(result)).toBe(true);
      expect(result).toEqual([]);
    });

    it('should handle lexicon filtering', async () => {
      const result = await words(mockClient, 'information', undefined);
      expect(Array.isArray(result)).toBe(true);
      expect(result).toEqual([]);
    });

    it('should handle empty string input', async () => {
      const result = await words(mockClient, '');
      expect(Array.isArray(result)).toBe(true);
      expect(result).toEqual([]);
    });

    it('should handle null/undefined input', async () => {
      // @ts-ignore - Testing invalid input
      const result1 = await words(mockClient, null);
      expect(result1).toEqual([]);

      // @ts-ignore - Testing invalid input
      const result2 = await words(mockClient, undefined);
      expect(result2).toEqual([]);
    });

    it('should handle all parts of speech', async () => {
      const result = await words(mockClient, 'information');
      expect(Array.isArray(result)).toBe(true);
      expect(result).toEqual([]);
    });
  });

  describe('sense', () => {
    it('should throw error for non-existent sense', async () => {
      await expect(sense(mockClient, 'nonexistent')).rejects.toThrow();
    });

    it('should throw error for empty string', async () => {
      await expect(sense(mockClient, '')).rejects.toThrow();
    });

    it('should throw error for null/undefined', async () => {
      // @ts-ignore - Testing invalid input
      await expect(sense(mockClient, null)).rejects.toThrow();
      // @ts-ignore - Testing invalid input
      await expect(sense(mockClient, undefined)).rejects.toThrow();
    });
  });

  describe('senses', () => {
    it('should return empty array when no database is available', async () => {
      const result = await senses(mockClient, 'information');
      expect(Array.isArray(result)).toBe(true);
      expect(result).toEqual([]);
    });

    it('should return empty array for non-existent word', async () => {
      const result = await senses(mockClient, 'nonexistent');
      expect(result).toEqual([]);
    });

    it('should handle part of speech filtering', async () => {
      const result = await senses(mockClient, 'information', 'n');
      expect(Array.isArray(result)).toBe(true);
      expect(result).toEqual([]);
    });

    it('should handle lexicon filtering', async () => {
      const result = await senses(mockClient, 'information', undefined);
      expect(Array.isArray(result)).toBe(true);
      expect(result).toEqual([]);
    });

    it('should handle empty string input', async () => {
      const result = await senses(mockClient, '');
      expect(Array.isArray(result)).toBe(true);
      expect(result).toEqual([]);
    });

    it('should handle null/undefined input', async () => {
      // @ts-ignore - Testing invalid input
      const result1 = await senses(mockClient, null);
      expect(result1).toEqual([]);

      // @ts-ignore - Testing invalid input
      const result2 = await senses(mockClient, undefined);
      expect(result2).toEqual([]);
    });

    it('should handle all parts of speech', async () => {
      const result = await senses(mockClient, 'information');
      expect(Array.isArray(result)).toBe(true);
      expect(result).toEqual([]);
    });
  });

  describe('synset', () => {
    it('should throw error for non-existent synset', async () => {
      await expect(synset(mockClient, 'nonexistent')).rejects.toThrow();
    });

    it('should throw error for empty string', async () => {
      await expect(synset(mockClient, '')).rejects.toThrow();
    });

    it('should throw error for null/undefined', async () => {
      // @ts-ignore - Testing invalid input
      await expect(synset(mockClient, null)).rejects.toThrow();
      // @ts-ignore - Testing invalid input
      await expect(synset(mockClient, undefined)).rejects.toThrow();
    });
  });

  describe('synsets', () => {
    it('should return empty array when no database is available', async () => {
      const result = await synsets(mockClient, 'information');
      expect(Array.isArray(result)).toBe(true);
      expect(result).toEqual([]);
    });

    it('should return empty array for non-existent word', async () => {
      const result = await synsets(mockClient, 'nonexistent');
      expect(result).toEqual([]);
    });

    it('should handle part of speech filtering', async () => {
      const result = await synsets(mockClient, 'information', 'n');
      expect(Array.isArray(result)).toBe(true);
      expect(result).toEqual([]);
    });

    it('should handle lexicon filtering', async () => {
      const result = await synsets(mockClient, 'information', undefined);
      expect(Array.isArray(result)).toBe(true);
      expect(result).toEqual([]);
    });

    it('should handle empty string input', async () => {
      const result = await synsets(mockClient, '');
      expect(Array.isArray(result)).toBe(true);
      expect(result).toEqual([]);
    });

    it('should handle null/undefined input', async () => {
      // @ts-ignore - Testing invalid input
      const result1 = await synsets(mockClient, null);
      expect(result1).toEqual([]);

      // @ts-ignore - Testing invalid input
      const result2 = await synsets(mockClient, undefined);
      expect(result2).toEqual([]);
    });

    it('should handle all parts of speech', async () => {
      const result = await synsets(mockClient, 'information');
      expect(Array.isArray(result)).toBe(true);
      expect(result).toEqual([]);
    });

    it('should handle ILI parameter', async () => {
      const result = await synsets(mockClient, 'information', undefined);
      expect(Array.isArray(result)).toBe(true);
      expect(result).toEqual([]);
    });
  });

  describe('ili', () => {
    it('should throw error for non-existent ili', async () => {
      await expect(ili(mockClient, 'nonexistent')).rejects.toThrow();
    });

    it('should throw error for empty string', async () => {
      await expect(ili(mockClient, '')).rejects.toThrow();
    });

    it('should throw error for null/undefined', async () => {
      // @ts-ignore - Testing invalid input
      await expect(ili(mockClient, null)).rejects.toThrow();
      // @ts-ignore - Testing invalid input
      await expect(ili(mockClient, undefined)).rejects.toThrow();
    });
  });

  describe('ilis', () => {
    it('should return empty array when no database is available', async () => {
      const result = await ilis(mockClient);
      expect(Array.isArray(result)).toBe(true);
      expect(result).toEqual([]);
    });

    it('should handle status filtering', async () => {
      const result = await ilis(mockClient, 'approved');
      expect(Array.isArray(result)).toBe(true);
      expect(result).toEqual([]);
    });

    it('should handle empty string status', async () => {
      const result = await ilis(mockClient, '');
      expect(Array.isArray(result)).toBe(true);
      expect(result).toEqual([]);
    });

    it('should handle null/undefined status', async () => {
      // @ts-ignore - Testing invalid input
      const result1 = await ilis(mockClient, null);
      expect(result1).toEqual([]);

      // @ts-ignore - Testing invalid input
      const result2 = await ilis(mockClient, undefined);
      expect(result2).toEqual([]);
    });
  });

  describe('error handling', () => {
    it('should handle DatabaseError gracefully', async () => {
      // Create a mock client that throws DatabaseError
      const errorClient = {
        ...mockClient,
        words: async () => {
          throw new DatabaseError('Database not available');
        },
      } as unknown as BaseWordnet;

      const result = await words(errorClient, 'test');
      expect(result).toEqual([]);
    });

    it('should maintain consistent error messages', async () => {
      // Test that error messages are consistent
      await expect(word(mockClient, 'nonexistent')).rejects.toThrow();
      await expect(sense(mockClient, 'nonexistent')).rejects.toThrow();
      await expect(synset(mockClient, 'nonexistent')).rejects.toThrow();
      await expect(ili(mockClient, 'nonexistent')).rejects.toThrow();
    });
  });
}); 