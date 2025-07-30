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
import { DatabaseError } from '../src/types';

describe('Module Functions (Database-Agnostic)', () => {
  describe('projects', () => {
    it('should return list of known projects', async () => {
      const result = await projects();
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeGreaterThan(0);
      
      // Should contain expected project IDs (checking for actual projects in the index)
      expect(result.length).toBeGreaterThan(0);
      // Check that we have some known projects (these are from the actual index.toml)
      const projectIds = result.map((p: any) => p.id);
      expect(projectIds).toContain('cili');
      expect(projectIds).toContain('oewn'); // This one is definitely in the index
    });

    it('should return consistent results on multiple calls', async () => {
      const result1 = await projects();
      const result2 = await projects();
      
      expect(result1).toEqual(result2);
      expect(result1).toBeInstanceOf(Array);
    });
  });

  describe('lexicons', () => {
    it('should return empty array when no database is available', async () => {
      const result = await lexicons();
      expect(Array.isArray(result)).toBe(true);
      expect(result).toEqual([]);
    });

    it('should return empty array when no lexicons exist', async () => {
      const result = await lexicons({ lexicon: 'nonexistent' });
      expect(result).toEqual([]);
    });

    it('should handle different parameter combinations', async () => {
      // Test with no parameters
      const result1 = await lexicons();
      expect(result1).toEqual([]);

      // Test with empty options object
      const result2 = await lexicons({});
      expect(result2).toEqual([]);

      // Test with lexicon option
      const result3 = await lexicons({ lexicon: 'test' });
      expect(result3).toEqual([]);

      // Test with lang option
      const result4 = await lexicons({ lang: 'en' });
      expect(result4).toEqual([]);

      // Test with both options
      const result5 = await lexicons({ lexicon: 'test', lang: 'en' });
      expect(result5).toEqual([]);
    });
  });

  describe('word', () => {
    it('should throw error for non-existent word', async () => {
      await expect(word('nonexistent')).rejects.toThrow();
    });

    it('should throw error for empty string', async () => {
      await expect(word('')).rejects.toThrow();
    });

    it('should throw error for null/undefined', async () => {
      // @ts-ignore - Testing invalid input
      await expect(word(null)).rejects.toThrow();
      // @ts-ignore - Testing invalid input
      await expect(word(undefined)).rejects.toThrow();
    });
  });

  describe('words', () => {
    it('should return empty array when no database is available', async () => {
      const result = await words('information');
      expect(Array.isArray(result)).toBe(true);
      expect(result).toEqual([]);
    });

    it('should return empty array for non-existent word', async () => {
      const result = await words('nonexistent');
      expect(result).toEqual([]);
    });

    it('should handle part of speech filtering', async () => {
      const result = await words('information', 'n');
      expect(Array.isArray(result)).toBe(true);
      expect(result).toEqual([]);
    });

    it('should handle lexicon filtering', async () => {
      const result = await words('information', undefined, { lexicon: 'test-en' });
      expect(Array.isArray(result)).toBe(true);
      expect(result).toEqual([]);
    });

    it('should handle empty string input', async () => {
      const result = await words('');
      expect(Array.isArray(result)).toBe(true);
      expect(result).toEqual([]);
    });

    it('should handle null/undefined input', async () => {
      // @ts-ignore - Testing invalid input
      const result1 = await words(null);
      expect(result1).toEqual([]);

      // @ts-ignore - Testing invalid input
      const result2 = await words(undefined);
      expect(result2).toEqual([]);
    });

    it('should handle all parts of speech', async () => {
      const posList = ['n', 'v', 'a', 'r', 's', 'c', 'p', 'i', 'x', 'u'];
      
      for (const pos of posList) {
        const result = await words('test', pos as any);
        expect(Array.isArray(result)).toBe(true);
        expect(result).toEqual([]);
      }
    });
  });

  describe('sense', () => {
    it('should throw error for non-existent sense', async () => {
      await expect(sense('nonexistent')).rejects.toThrow();
    });

    it('should throw error for empty string', async () => {
      await expect(sense('')).rejects.toThrow();
    });

    it('should throw error for null/undefined', async () => {
      // @ts-ignore - Testing invalid input
      await expect(sense(null)).rejects.toThrow();
      // @ts-ignore - Testing invalid input
      await expect(sense(undefined)).rejects.toThrow();
    });
  });

  describe('senses', () => {
    it('should return empty array when no database is available', async () => {
      const result = await senses('information');
      expect(Array.isArray(result)).toBe(true);
      expect(result).toEqual([]);
    });

    it('should return empty array for non-existent word', async () => {
      const result = await senses('nonexistent');
      expect(result).toEqual([]);
    });

    it('should handle part of speech filtering', async () => {
      const result = await senses('information', 'n');
      expect(Array.isArray(result)).toBe(true);
      expect(result).toEqual([]);
    });

    it('should handle lexicon filtering', async () => {
      const result = await senses('information', undefined, { lexicon: 'test-en' });
      expect(Array.isArray(result)).toBe(true);
      expect(result).toEqual([]);
    });

    it('should handle empty string input', async () => {
      const result = await senses('');
      expect(Array.isArray(result)).toBe(true);
      expect(result).toEqual([]);
    });

    it('should handle null/undefined input', async () => {
      // @ts-ignore - Testing invalid input
      const result1 = await senses(null);
      expect(result1).toEqual([]);

      // @ts-ignore - Testing invalid input
      const result2 = await senses(undefined);
      expect(result2).toEqual([]);
    });

    it('should handle all parts of speech', async () => {
      const posList = ['n', 'v', 'a', 'r', 's', 'c', 'p', 'i', 'x', 'u'];
      
      for (const pos of posList) {
        const result = await senses('test', pos as any);
        expect(Array.isArray(result)).toBe(true);
        expect(result).toEqual([]);
      }
    });
  });

  describe('synset', () => {
    it('should throw error for non-existent synset', async () => {
      await expect(synset('nonexistent')).rejects.toThrow();
    });

    it('should throw error for empty string', async () => {
      await expect(synset('')).rejects.toThrow();
    });

    it('should throw error for null/undefined', async () => {
      // @ts-ignore - Testing invalid input
      await expect(synset(null)).rejects.toThrow();
      // @ts-ignore - Testing invalid input
      await expect(synset(undefined)).rejects.toThrow();
    });
  });

  describe('synsets', () => {
    it('should return empty array when no database is available', async () => {
      const result = await synsets('information');
      expect(Array.isArray(result)).toBe(true);
      expect(result).toEqual([]);
    });

    it('should return empty array for non-existent word', async () => {
      const result = await synsets('nonexistent');
      expect(result).toEqual([]);
    });

    it('should handle part of speech filtering', async () => {
      const result = await synsets('information', 'n');
      expect(Array.isArray(result)).toBe(true);
      expect(result).toEqual([]);
    });

    it('should handle lexicon filtering', async () => {
      const result = await synsets('information', undefined, { lexicon: 'test-en' });
      expect(Array.isArray(result)).toBe(true);
      expect(result).toEqual([]);
    });

    it('should handle empty string input', async () => {
      const result = await synsets('');
      expect(Array.isArray(result)).toBe(true);
      expect(result).toEqual([]);
    });

    it('should handle null/undefined input', async () => {
      // @ts-ignore - Testing invalid input
      const result1 = await synsets(null);
      expect(result1).toEqual([]);

      // @ts-ignore - Testing invalid input
      const result2 = await synsets(undefined);
      expect(result2).toEqual([]);
    });

    it('should handle all parts of speech', async () => {
      const posList = ['n', 'v', 'a', 'r', 's', 'c', 'p', 'i', 'x', 'u'];
      
      for (const pos of posList) {
        const result = await synsets('test', pos as any);
        expect(Array.isArray(result)).toBe(true);
        expect(result).toEqual([]);
      }
    });

    it('should handle ILI parameter', async () => {
      const result = await synsets('test', undefined, { ili: 'test-ili' });
      expect(Array.isArray(result)).toBe(true);
      expect(result).toEqual([]);
    });
  });

  describe('ili', () => {
    it('should throw error for non-existent ili', async () => {
      await expect(ili('nonexistent')).rejects.toThrow();
    });

    it('should throw error for empty string', async () => {
      await expect(ili('')).rejects.toThrow();
    });

    it('should throw error for null/undefined', async () => {
      // @ts-ignore - Testing invalid input
      await expect(ili(null)).rejects.toThrow();
      // @ts-ignore - Testing invalid input
      await expect(ili(undefined)).rejects.toThrow();
    });
  });

  describe('ilis', () => {
    it('should return empty array when no database is available', async () => {
      const result = await ilis();
      expect(Array.isArray(result)).toBe(true);
      expect(result).toEqual([]);
    });

    it('should handle status filtering', async () => {
      const result = await ilis('standard');
      expect(Array.isArray(result)).toBe(true);
      expect(result).toEqual([]);
    });

    it('should handle empty string status', async () => {
      const result = await ilis('');
      expect(Array.isArray(result)).toBe(true);
      expect(result).toEqual([]);
    });

    it('should handle null/undefined status', async () => {
      // @ts-ignore - Testing invalid input
      const result1 = await ilis(null);
      expect(result1).toEqual([]);

      // @ts-ignore - Testing invalid input
      const result2 = await ilis(undefined);
      expect(result2).toEqual([]);
    });
  });

  describe('error handling', () => {
    it('should handle DatabaseError gracefully', async () => {
      // All functions should handle DatabaseError and return empty arrays or throw appropriately
      const functions = [lexicons, words, senses, synsets, ilis];
      
      for (const func of functions) {
        const result = await func('test');
        expect(Array.isArray(result)).toBe(true);
        expect(result).toEqual([]);
      }
    });

    it('should maintain consistent error messages', async () => {
      // Functions that throw should have consistent error messages
      const throwingFunctions = [word, sense, synset, ili];
      
      for (const func of throwingFunctions) {
        try {
          await func('test');
          expect.fail('Should have thrown an error');
        } catch (error) {
          expect(error).toBeInstanceOf(Error);
        }
      }
    });
  });
}); 