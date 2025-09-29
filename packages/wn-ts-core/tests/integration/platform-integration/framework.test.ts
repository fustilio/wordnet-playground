/**
 * Framework Tests
 * 
 * Tests for the cross-platform test framework utilities and test data factory.
 */

import { describe, it, expect } from 'vitest';
import { TestDataFactory, PlatformTestUtils } from './platform-test-framework.js';

describe('Cross-Platform Test Framework', () => {
  describe('TestDataFactory', () => {
    it('should create basic test data', () => {
      const testData = TestDataFactory.createBasicTestData();
      
      expect(testData).toBeDefined();
      expect(testData.lexicons).toBeDefined();
      expect(testData.words).toBeDefined();
      expect(testData.synsets).toBeDefined();
      expect(testData.senses).toBeDefined();
      expect(testData.definitions).toBeDefined();
      expect(testData.relations).toBeDefined();
      
      expect(Array.isArray(testData.lexicons)).toBe(true);
      expect(Array.isArray(testData.words)).toBe(true);
      expect(Array.isArray(testData.synsets)).toBe(true);
      expect(Array.isArray(testData.senses)).toBe(true);
      expect(Array.isArray(testData.definitions)).toBe(true);
      expect(Array.isArray(testData.relations)).toBe(true);
    });

    it('should create valid lexicon data', () => {
      const testData = TestDataFactory.createBasicTestData();
      const lexicon = testData.lexicons[0];
      
      if (lexicon) {
        expect(lexicon.id).toBe('test-lexicon');
        expect(lexicon.label).toBe('Test Lexicon');
        expect(lexicon.language).toBe('en');
        expect(lexicon.version).toBe('1.0');
        expect(lexicon.license).toBe('MIT');
        expect(lexicon.url).toBe('https://example.com');
        expect(lexicon.citation).toBe('Test Citation');
      }
    });

    it('should create valid word data', () => {
      const testData = TestDataFactory.createBasicTestData();
      const word = testData.words[0];
      
      if (word) {
        expect(word.id).toBe('word-1');
        expect(word.lemma).toBe('computer');
        expect(word.pos).toBe('n');
        expect(word.language).toBe('en');
        expect(word.lexicon).toBe('test-lexicon');
        expect(Array.isArray(word.forms)).toBe(true);
        expect(Array.isArray(word.pronunciations)).toBe(true);
        expect(Array.isArray(word.tags)).toBe(true);
        expect(Array.isArray(word.counts)).toBe(true);
      }
    });

    it('should create valid synset data', () => {
      const testData = TestDataFactory.createBasicTestData();
      const synset = testData.synsets[0];
      
      if (synset) {
        expect(synset.id).toBe('synset-1');
        expect(synset.pos).toBe('n');
        expect(synset.language).toBe('en');
        expect(synset.lexicon).toBe('test-lexicon');
        expect(Array.isArray(synset.definitions)).toBe(true);
        expect(Array.isArray(synset.examples)).toBe(true);
        expect(Array.isArray(synset.relations)).toBe(true);
        expect(Array.isArray(synset.memberIds)).toBe(true);
        expect(Array.isArray(synset.senseIds)).toBe(true);
      }
    });
  });

  describe('PlatformTestUtils', () => {
    it('should assert equality correctly', () => {
      expect(() => PlatformTestUtils.assertEqual(1, 1)).not.toThrow();
      expect(() => PlatformTestUtils.assertEqual('test', 'test')).not.toThrow();
      expect(() => PlatformTestUtils.assertEqual(true, true)).not.toThrow();
      
      expect(() => PlatformTestUtils.assertEqual(1, 2)).toThrow();
      expect(() => PlatformTestUtils.assertEqual('test', 'other')).toThrow();
      expect(() => PlatformTestUtils.assertEqual(true, false)).toThrow();
    });

    it('should assert truthy values correctly', () => {
      expect(() => PlatformTestUtils.assertTrue(true)).not.toThrow();
      expect(() => PlatformTestUtils.assertTrue(1)).not.toThrow();
      expect(() => PlatformTestUtils.assertTrue('test')).not.toThrow();
      expect(() => PlatformTestUtils.assertTrue([])).not.toThrow();
      expect(() => PlatformTestUtils.assertTrue({})).not.toThrow();
      
      expect(() => PlatformTestUtils.assertTrue(false)).toThrow();
      expect(() => PlatformTestUtils.assertTrue(0)).toThrow();
      expect(() => PlatformTestUtils.assertTrue('')).toThrow();
      expect(() => PlatformTestUtils.assertTrue(null)).toThrow();
      expect(() => PlatformTestUtils.assertTrue(undefined)).toThrow();
    });

    it('should assert falsy values correctly', () => {
      expect(() => PlatformTestUtils.assertFalse(false)).not.toThrow();
      expect(() => PlatformTestUtils.assertFalse(0)).not.toThrow();
      expect(() => PlatformTestUtils.assertFalse('')).not.toThrow();
      expect(() => PlatformTestUtils.assertFalse(null)).not.toThrow();
      expect(() => PlatformTestUtils.assertFalse(undefined)).not.toThrow();
      
      expect(() => PlatformTestUtils.assertFalse(true)).toThrow();
      expect(() => PlatformTestUtils.assertFalse(1)).toThrow();
      expect(() => PlatformTestUtils.assertFalse('test')).toThrow();
      expect(() => PlatformTestUtils.assertFalse([])).toThrow();
      expect(() => PlatformTestUtils.assertFalse({})).toThrow();
    });

    it('should assert array length correctly', () => {
      expect(() => PlatformTestUtils.assertLength([], 0)).not.toThrow();
      expect(() => PlatformTestUtils.assertLength([1, 2, 3], 3)).not.toThrow();
      expect(() => PlatformTestUtils.assertLength(['a', 'b'], 2)).not.toThrow();
      
      expect(() => PlatformTestUtils.assertLength([], 1)).toThrow();
      expect(() => PlatformTestUtils.assertLength([1, 2, 3], 2)).toThrow();
      expect(() => PlatformTestUtils.assertLength(['a', 'b'], 3)).toThrow();
    });

    it('should assert promise rejection correctly', async () => {
      // Test that assertRejects doesn't throw when promise rejects
      await expect(PlatformTestUtils.assertRejects(Promise.reject(new Error('test')))).resolves.not.toThrow();
      await expect(PlatformTestUtils.assertRejects(Promise.reject(new Error('test')), 'test')).resolves.not.toThrow();
      await expect(PlatformTestUtils.assertRejects(Promise.reject(new Error('test')), /test/)).resolves.not.toThrow();
      
      // Test that assertRejects throws when promise resolves
      try {
        await PlatformTestUtils.assertRejects(Promise.resolve('success'));
        expect.fail('Expected assertRejects to throw when promise resolves');
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
      }
      
      try {
        await PlatformTestUtils.assertRejects(Promise.reject(new Error('test')), 'other');
        expect.fail('Expected assertRejects to throw when error message does not match');
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
      }
    });

    it('should measure execution time', async () => {
      const { result, duration } = await PlatformTestUtils.measureTime(async () => {
        await new Promise(resolve => setTimeout(resolve, 10));
        return 'test result';
      });
      
      expect(result).toBe('test result');
      expect(duration).toBeGreaterThan(0);
      expect(duration).toBeLessThan(100); // Should be less than 100ms
    });
  });
});
