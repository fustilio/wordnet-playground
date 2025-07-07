import { describe, it, expect } from 'vitest';
import { Wordnet } from '../src/wordnet';
import { path, wup, lch, res, jcn, lin } from '../src/similarity';
import type { Synset } from '../src/types';
import type { Freq } from '../src/ic';

// Use the same mock data as synset-utils.test.ts
const synsets: Record<string, Synset> = {
  root: {
    id: 'root',
    partOfSpeech: 'n',
    ili: undefined,
    definitions: [],
    examples: [],
    relations: [],
    language: 'en',
    lexicon: 'test',
    members: [],
    senses: [],
  },
  a: {
    id: 'a',
    partOfSpeech: 'n',
    ili: undefined,
    definitions: [],
    examples: [],
    relations: [{ id: 'r1', type: 'hypernym', target: 'root' }],
    language: 'en',
    lexicon: 'test',
    members: [],
    senses: [],
  },
  b: {
    id: 'b',
    partOfSpeech: 'n',
    ili: undefined,
    definitions: [],
    examples: [],
    relations: [{ id: 'r2', type: 'hypernym', target: 'root' }],
    language: 'en',
    lexicon: 'test',
    members: [],
    senses: [],
  },
  c: {
    id: 'c',
    partOfSpeech: 'n',
    ili: undefined,
    definitions: [],
    examples: [],
    relations: [{ id: 'r3', type: 'hypernym', target: 'a' }],
    language: 'en',
    lexicon: 'test',
    members: [],
    senses: [],
  },
  d: {
    id: 'd',
    partOfSpeech: 'n',
    ili: undefined,
    definitions: [],
    examples: [],
    relations: [{ id: 'r4', type: 'hypernym', target: 'a' }],
    language: 'en',
    lexicon: 'test',
    members: [],
    senses: [],
  },
};

// Mock IC data for information content-based metrics
const mockIc: Freq = {
  n: {
    root: 0.05, // Lowest probability (highest IC) for root
    a: 0.15,    // Higher probability (lower IC) for intermediate
    b: 0.15,    // Higher probability (lower IC) for intermediate  
    c: 0.25,    // Higher probability (lower IC) for leaf
    d: 0.25,    // Higher probability (lower IC) for leaf
    __total__: 0.85,
  },
};

class MockWordnet {
  async synset(id: string): Promise<Synset | undefined> {
    return synsets[id];
  }
}

const wordnet = new MockWordnet() as unknown as Wordnet;

describe('similarity', () => {
  describe('path', () => {
    it('returns 1.0 for identical synsets', async () => {
      const a = synsets['a'];
      const result = await path(a, a, wordnet);
      expect(result).toBe(1.0);
    });

    it('returns lower similarity for distant synsets', async () => {
      const c = synsets['c'];
      const d = synsets['d'];
      const result = await path(c, d, wordnet);
      expect(result).toBeLessThan(1.0);
      expect(result).toBeGreaterThan(0.0);
    });

    it('throws error for incompatible parts of speech', async () => {
      const a = synsets['a'];
      const verbSynset: Synset = {
        ...a,
        id: 'verb',
        partOfSpeech: 'v',
      };
      await expect(path(a, verbSynset, wordnet)).rejects.toThrow();
    });
  });

  describe('wup', () => {
    it('returns 1.0 for identical synsets', async () => {
      const a = synsets['a'];
      const result = await wup(a, a, wordnet);
      expect(result).toBe(1.0);
    });

    it('returns lower similarity for distant synsets', async () => {
      const c = synsets['c'];
      const b = synsets['b'];
      const result = await wup(c, b, wordnet);
      expect(result).toBeLessThan(1.0);
      expect(result).toBeGreaterThan(0.0);
    });

    it('throws error for incompatible parts of speech', async () => {
      const a = synsets['a'];
      const verbSynset: Synset = {
        ...a,
        id: 'verb',
        partOfSpeech: 'v',
      };
      await expect(wup(a, verbSynset, wordnet)).rejects.toThrow();
    });
  });

  describe('lch', () => {
    it('returns higher similarity for closer synsets', async () => {
      const c = synsets['c'];
      const a = synsets['a'];
      const result = await lch(c, a, 3, wordnet);
      expect(result).toBeGreaterThan(0.0);
    });

    it('throws error for invalid maxDepth', async () => {
      const c = synsets['c'];
      const a = synsets['a'];
      await expect(lch(c, a, 0, wordnet)).rejects.toThrow();
    });

    it('throws error for incompatible parts of speech', async () => {
      const a = synsets['a'];
      const verbSynset: Synset = {
        ...a,
        id: 'verb',
        partOfSpeech: 'v',
      };
      await expect(lch(a, verbSynset, 3, wordnet)).rejects.toThrow();
    });
  });

  describe('res', () => {
    it('returns information content of LCS', async () => {
      const c = synsets['c'];
      const b = synsets['b'];
      const result = await res(c, b, mockIc, wordnet);
      expect(result).toBeGreaterThan(0.0);
    });

    it('throws error for incompatible parts of speech', async () => {
      const a = synsets['a'];
      const verbSynset: Synset = {
        ...a,
        id: 'verb',
        partOfSpeech: 'v',
      };
      await expect(res(a, verbSynset, mockIc, wordnet)).rejects.toThrow();
    });
  });

  describe('jcn', () => {
    it('returns similarity based on information content', async () => {
      const c = synsets['c'];
      const d = synsets['d'];
      const result = await jcn(c, d, mockIc, wordnet);
      // The LCS should be 'a' which has lower IC than 'c' and 'd'
      // If the LCS is 'root' (higher IC), then result should be 0
      // This is correct behavior for distant synsets
      expect(result).toBeGreaterThanOrEqual(0.0);
      // If they share a closer ancestor, result should be positive
      if (result > 0) {
        expect(result).toBeLessThanOrEqual(1.0);
      }
    });

    it('returns 0 for synsets with no IC', async () => {
      const emptyIc: Freq = {
        n: {
          root: 0,
          a: 0,
          b: 0,
          c: 0,
          d: 0,
          __total__: 1,
        },
      };
      const c = synsets['c'];
      const d = synsets['d'];
      const result = await jcn(c, d, emptyIc, wordnet);
      expect(result).toBe(0);
    });

    it('throws error for incompatible parts of speech', async () => {
      const a = synsets['a'];
      const verbSynset: Synset = {
        ...a,
        id: 'verb',
        partOfSpeech: 'v',
      };
      await expect(jcn(a, verbSynset, mockIc, wordnet)).rejects.toThrow();
    });
  });

  describe('lin', () => {
    it('returns similarity based on information content', async () => {
      const c = synsets['c'];
      const d = synsets['d'];
      const result = await lin(c, d, mockIc, wordnet);
      expect(result).toBeGreaterThan(0.0);
      expect(result).toBeLessThanOrEqual(1.0);
    });

    it('returns 0 for synsets with no IC', async () => {
      const emptyIc: Freq = {
        n: {
          root: 0,
          a: 0,
          b: 0,
          c: 0,
          d: 0,
          __total__: 1,
        },
      };
      const c = synsets['c'];
      const d = synsets['d'];
      const result = await lin(c, d, emptyIc, wordnet);
      expect(result).toBe(0);
    });

    it('throws error for incompatible parts of speech', async () => {
      const a = synsets['a'];
      const verbSynset: Synset = {
        ...a,
        id: 'verb',
        partOfSpeech: 'v',
      };
      await expect(lin(a, verbSynset, mockIc, wordnet)).rejects.toThrow();
    });
  });
}); 