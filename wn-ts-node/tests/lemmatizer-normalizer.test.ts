import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { Wordnet } from '../src/wordnet.js';
import { db } from '../src/db/database.js';
import type { PartOfSpeech } from 'wn-ts-core';

describe('Lemmatizer and Normalizer System', () => {
  let wordnet: Wordnet;

  beforeEach(async () => {
    wordnet = new Wordnet('test-lexicon');
    await db.initialize();
  });

  afterEach(async () => {
    await wordnet.close();
  });

  describe('Default Behavior', () => {
    it('should use default normalizer when none provided', async () => {
      const normalized = await wordnet.normalizeForm('  TEST  ');
      expect(normalized).toBe('test');
    });

    it('should use default lemmatizer when none provided', async () => {
      const result = await wordnet.morphy('running', 'v');
      expect(result.v).toBeInstanceOf(Set);
      expect(result.v.has('running')).toBe(true);
    });

    it('should handle empty string normalization', async () => {
      const normalized = await wordnet.normalizeForm('');
      expect(normalized).toBe('');
    });

    it('should handle whitespace-only strings', async () => {
      const normalized = await wordnet.normalizeForm('   ');
      expect(normalized).toBe('');
    });
  });

  describe('Custom Normalizer', () => {
    it('should use custom normalizer when provided', async () => {
      const customWordnet = new Wordnet('test', {
        normalizer: (form: string) => form.toUpperCase()
      });

      const normalized = await customWordnet.normalizeForm('test');
      expect(normalized).toBe('TEST');

      await customWordnet.close();
    });

    it('should use custom normalizer for word queries', async () => {
      const customWordnet = new Wordnet('test', {
        normalizer: (form: string) => form.replace(/[aeiou]/g, '*')
      });

      // This should use the custom normalizer internally
      const normalized = await customWordnet.normalizeForm('hello');
      expect(normalized).toBe('h*ll*');

      await customWordnet.close();
    });

    it('should handle aggressive normalizer', async () => {
      const aggressiveWordnet = new Wordnet('test', {
        normalizer: (form: string) => form.toLowerCase().replace(/[^a-z0-9]/g, '')
      });

      const normalized = await aggressiveWordnet.normalizeForm('Hello, World! 123');
      expect(normalized).toBe('helloworld123');

      await aggressiveWordnet.close();
    });

    it('should handle identity normalizer', async () => {
      const identityWordnet = new Wordnet('test', {
        normalizer: (form: string) => form
      });

      const normalized = await identityWordnet.normalizeForm('  Original  ');
      expect(normalized).toBe('  Original  ');

      await identityWordnet.close();
    });
  });

  describe('Custom Lemmatizer', () => {
    it('should use custom lemmatizer when provided', async () => {
      const customWordnet = new Wordnet('test', {
        lemmatizer: (form: string, pos?: PartOfSpeech) => {
          const result: Record<PartOfSpeech, Set<string>> = {
            'n': new Set(),
            'v': new Set(),
            'a': new Set(),
            'r': new Set(),
            's': new Set(),
            'c': new Set(),
            'p': new Set(),
            'x': new Set(),
            'u': new Set(),
            'i': new Set()
          };

          if (pos) {
            result[pos] = new Set([`custom-${form}`]);
          } else {
            result['n'] = new Set([`custom-${form}`]);
          }

          return result;
        }
      });

      const result = await customWordnet.morphy('running', 'v');
      expect(result.v.has('custom-running')).toBe(true);

      await customWordnet.close();
    });

    it('should handle lemmatizer with specific POS', async () => {
      const posSpecificWordnet = new Wordnet('test', {
        lemmatizer: (form: string, pos?: PartOfSpeech) => {
          const result: Record<PartOfSpeech, Set<string>> = {
            'n': new Set(),
            'v': new Set(),
            'a': new Set(),
            'r': new Set(),
            's': new Set(),
            'c': new Set(),
            'p': new Set(),
            'x': new Set(),
            'u': new Set(),
            'i': new Set()
          };

          if (pos === 'v') {
            result.v = new Set(['run', 'runs', 'running', 'ran']);
          } else if (pos === 'n') {
            result.n = new Set(['run', 'runs']);
          }

          return result;
        }
      });

      const verbResult = await posSpecificWordnet.morphy('running', 'v');
      expect(verbResult.v.has('run')).toBe(true);
      expect(verbResult.v.has('running')).toBe(true);

      const nounResult = await posSpecificWordnet.morphy('runs', 'n');
      expect(nounResult.n.has('run')).toBe(true);
      expect(nounResult.n.has('runs')).toBe(true);

      await posSpecificWordnet.close();
    });

    it('should handle lemmatizer with no POS specified', async () => {
      const generalWordnet = new Wordnet('test', {
        lemmatizer: (form: string) => {
          const result: Record<PartOfSpeech, Set<string>> = {
            'n': new Set([`${form}-noun`]),
            'v': new Set([`${form}-verb`]),
            'a': new Set([`${form}-adj`]),
            'r': new Set([`${form}-adv`]),
            's': new Set([`${form}-satellite`]),
            'c': new Set(),
            'p': new Set(),
            'x': new Set(),
            'u': new Set(),
            'i': new Set()
          };

          return result;
        }
      });

      const result = await generalWordnet.morphy('happy');
      expect(result.n.has('happy-noun')).toBe(true);
      expect(result.a.has('happy-adj')).toBe(true);
      expect(result.v.has('happy-verb')).toBe(true);

      await generalWordnet.close();
    });
  });

  describe('Edge Cases and Error Handling', () => {
    it('should handle very long strings', async () => {
      const longString = 'a'.repeat(1000);
      const normalized = await wordnet.normalizeForm(longString);
      expect(normalized).toBe('a'.repeat(1000));
    });

    it('should handle unicode characters', async () => {
      const unicodeString = 'café résumé naïve';
      const normalized = await wordnet.normalizeForm(unicodeString);
      expect(normalized).toBe('café résumé naïve');
    });

    it('should handle numbers and special characters', async () => {
      const mixedString = 'Word123!@#$%^&*()';
      const normalized = await wordnet.normalizeForm(mixedString);
      expect(normalized).toBe('word123!@#$%^&*()');
    });

    it('should handle lemmatizer with empty string', async () => {
      const result = await wordnet.morphy('', 'n');
      expect(result.n.has('')).toBe(true);
    });

    it('should handle lemmatizer with whitespace-only string', async () => {
      const result = await wordnet.morphy('   ', 'v');
      expect(result.v.has('   ')).toBe(true);
    });
  });

  describe('Consistency and Predictability', () => {
    it('should produce consistent results for same input', async () => {
      const input = 'TestString';
      
      const result1 = await wordnet.normalizeForm(input);
      const result2 = await wordnet.normalizeForm(input);
      const result3 = await wordnet.normalizeForm(input);

      expect(result1).toBe(result2);
      expect(result2).toBe(result3);
    });

    it('should produce consistent lemmatization results', async () => {
      const input = 'running';
      const pos: PartOfSpeech = 'v';
      
      const result1 = await wordnet.morphy(input, pos);
      const result2 = await wordnet.morphy(input, pos);
      const result3 = await wordnet.morphy(input, pos);

      expect(result1).toEqual(result2);
      expect(result2).toEqual(result3);
    });

    it('should handle case sensitivity consistently', async () => {
      const lowerResult = await wordnet.normalizeForm('test');
      const upperResult = await wordnet.normalizeForm('TEST');
      const mixedResult = await wordnet.normalizeForm('TeSt');

      expect(lowerResult).toBe('test');
      expect(upperResult).toBe('test');
      expect(mixedResult).toBe('test');
    });
  });

  describe('Performance and Memory', () => {
    it('should handle multiple normalizations efficiently', async () => {
      const start = Date.now();
      
      for (let i = 0; i < 1000; i++) {
        await wordnet.normalizeForm(`test${i}`);
      }
      
      const end = Date.now();
      const duration = end - start;
      
      // Should complete in reasonable time (less than 1 second)
      expect(duration).toBeLessThan(1000);
    });

    it('should handle multiple lemmatizations efficiently', async () => {
      const start = Date.now();
      
      for (let i = 0; i < 100; i++) {
        await wordnet.morphy(`word${i}`, 'n');
      }
      
      const end = Date.now();
      const duration = end - start;
      
      // Should complete in reasonable time (less than 500ms)
      expect(duration).toBeLessThan(500);
    });
  });

  describe('Integration with Word Queries', () => {
    it('should use normalizer in word queries', async () => {
      const customWordnet = new Wordnet('test', {
        normalizer: (form: string) => form.toLowerCase()
      });

      // The internal word query should use the custom normalizer
      const normalized = await customWordnet.normalizeForm('HELLO');
      expect(normalized).toBe('hello');

      await customWordnet.close();
    });

    it('should use lemmatizer in word queries when searchAllForms is enabled', async () => {
      const customWordnet = new Wordnet('test', {
        lemmatizer: (form: string, pos?: PartOfSpeech) => {
          const result: Record<PartOfSpeech, Set<string>> = {
            'n': new Set(),
            'v': new Set(),
            'a': new Set(),
            'r': new Set(),
            's': new Set(),
            'c': new Set(),
            'p': new Set(),
            'x': new Set(),
            'u': new Set(),
            'i': new Set()
          };

          if (pos === 'v') {
            result.v = new Set(['run']);
          }

          return result;
        }
      });

      const result = await customWordnet.morphy('running', 'v');
      expect(result.v.has('run')).toBe(true);

      await customWordnet.close();
    });
  });

  describe('Default Implementation Quality', () => {
    it('should provide sensible default normalizer', async () => {
      const testCases = [
        { input: '  Hello World  ', expected: 'hello world' },
        { input: 'TEST', expected: 'test' },
        { input: 'MixedCase', expected: 'mixedcase' },
        { input: '', expected: '' },
        { input: '   ', expected: '' }
      ];

      for (const { input, expected } of testCases) {
        const result = await wordnet.normalizeForm(input);
        expect(result).toBe(expected);
      }
    });

    it('should provide sensible default lemmatizer', async () => {
      const result = await wordnet.morphy('test', 'n');
      
      // Should return a valid structure
      expect(result).toHaveProperty('n');
      expect(result.n).toBeInstanceOf(Set);
      expect(result.n.has('test')).toBe(true);
      
      // Should have all POS properties
      const expectedPos: PartOfSpeech[] = ['n', 'v', 'a', 'r', 's', 'c', 'p', 'x', 'u', 'i'];
      for (const pos of expectedPos) {
        expect(result).toHaveProperty(pos);
        expect(result[pos]).toBeInstanceOf(Set);
      }
    });
  });
});
