import { describe, it, expect, beforeEach } from 'vitest';
import { hypernyms, shortestPath, maxDepth, lowestCommonHypernyms } from '../src/modules/relations/synset-utils.js';
import { pathSimilarity, wuPalmerSimilarity, leacockChodorowSimilarity, resnikSimilarity, jiangConrathSimilarity, linSimilarity } from '../src/plugins/similarity/index.js';
import { roots, leaves, taxonomyDepth, hypernymPaths, taxonomyShortestPath, minDepth } from '../src/modules/relations/taxonomy.js';
import { information_content } from '../src/plugins/similarity/information-content.js';
import type { WordNetCore } from '../src/wordnet-kernel.js';
import type { Synset, PartOfSpeech } from '../src/core/types.js';

// Mock implementation of WordNetCore for testing
class MockWordNetCore implements WordNetCore {
  async query() { return []; }
  async words() { return []; }
  async synsets() { return []; }
  async senses() { return []; }
  async word() { 
    return {
      id: 'mock-word',
      lemma: 'mock',
      pos: 'n',
      forms: [],
      pronunciations: [],
      language: 'en',
      lexicon: 'mock-lexicon',
      syntacticBehaviours: []
    } as any; 
  }
  async synset() { 
    return {
      id: 'mock-synset',
      pos: 'n',
      definitions: [],
      examples: [],
      memberIds: [],
      senseIds: [],
      relations: [],
      language: 'en',
      lexicon: 'mock-lexicon',
      ili: 'mock-ili'
    } as any; 
  }
  async sense() { 
    return {
      id: 'mock-sense',
      wordId: 'mock-word',
      synsetId: 'mock-synset',
      examples: [],
      counts: [],
      language: 'en',
      lexicon: 'mock-lexicon'
    } as any; 
  }
  async ili() { 
    return {
      id: 'mock-ili',
      status: 'standard'
    } as any; 
  }
  async ilis() { return []; }
  async lexicons() { return []; }
  async synsetsByILI() { return []; }
  async getWord() { return []; }
  async getSynset() { return null; }
  async getSenses() { return []; }
  async getDefinitions() { return []; }
  async getRelations() { return []; }
}

describe('Synset Utils', () => {
  let wordnet: WordNetCore;
  let mockSynset: Synset;

  beforeEach(() => {
    wordnet = new MockWordNetCore();
    mockSynset = {
      id: 'test-synset-1',
      pos: 'n' as PartOfSpeech,
      definitions: [],
      examples: [],
      memberIds: [],
      senseIds: [],
      relations: [],
      language: 'en',
      lexicon: 'test-lexicon',
      ili: 'test-ili'
    };
  });

  describe('hypernyms', () => {
    it('should return empty array for synset with no hypernym relations', async () => {
      const result = await hypernyms(mockSynset, wordnet);
      expect(Array.isArray(result)).toBe(true);
      expect(result).toHaveLength(0);
    });

    it('should handle synset with hypernym relations', async () => {
      const synsetWithHypernyms = {
        ...mockSynset,
        relations: [
          { id: 'rel1', type: 'hypernym', target: 'parent-synset-1' },
          { id: 'rel2', type: 'hyponym', target: 'child-synset-1' }
        ]
      };

      const result = await hypernyms(synsetWithHypernyms, wordnet);
      expect(Array.isArray(result)).toBe(true);
    });
  });

  describe('shortestPath', () => {
    it('should return empty array for same synset', async () => {
      const result = await shortestPath(mockSynset, mockSynset, wordnet);
      expect(Array.isArray(result)).toBe(true);
      expect(result).toHaveLength(0);
    });

    it('should handle different synsets', async () => {
      const otherSynset = { ...mockSynset, id: 'test-synset-2' };
      const result = await shortestPath(mockSynset, otherSynset, wordnet);
      expect(Array.isArray(result)).toBe(true);
    });
  });

  describe('maxDepth', () => {
    it('should return 0 for synset with no hypernyms', async () => {
      const result = await maxDepth(mockSynset, wordnet);
      expect(typeof result).toBe('number');
      expect(result).toBe(0);
    });
  });

  describe('lowestCommonHypernyms', () => {
    it('should return synset itself for same synset', async () => {
      const result = await lowestCommonHypernyms(mockSynset, mockSynset, wordnet);
      expect(Array.isArray(result)).toBe(true);
      expect(result).toHaveLength(1);
      expect(result[0]?.id).toBe(mockSynset.id);
    });

    it('should handle different synsets', async () => {
      const otherSynset = { ...mockSynset, id: 'test-synset-2' };
      const result = await lowestCommonHypernyms(mockSynset, otherSynset, wordnet);
      expect(Array.isArray(result)).toBe(true);
    });
  });
});

describe('Similarity Functions', () => {
  let wordnet: WordNetCore;
  let mockSynset1: Synset;
  let mockSynset2: Synset;

  beforeEach(() => {
    wordnet = new MockWordNetCore();
    mockSynset1 = {
      id: 'test-synset-1',
      pos: 'n' as PartOfSpeech,
      definitions: [],
      examples: [],
      memberIds: [],
      senseIds: [],
      relations: [],
      language: 'en',
      lexicon: 'test-lexicon',
      ili: 'test-ili-1'
    };
    mockSynset2 = {
      id: 'test-synset-2',
      pos: 'n' as PartOfSpeech,
      definitions: [],
      examples: [],
      memberIds: [],
      senseIds: [],
      relations: [],
      language: 'en',
      lexicon: 'test-lexicon',
      ili: 'test-ili-2'
    };
  });

  describe('pathSimilarity', () => {
    it('should return 1 for same synset', async () => {
      const result = await pathSimilarity(mockSynset1, mockSynset1, wordnet);
      expect(typeof result).toBe('number');
      expect(result).toBe(1);
    });

    it('should handle different synsets', async () => {
      const result = await pathSimilarity(mockSynset1, mockSynset2, wordnet);
      expect(typeof result).toBe('number');
    });
  });

  describe('wuPalmerSimilarity', () => {
    it('should return 1 for same synset', async () => {
      const result = await wuPalmerSimilarity(mockSynset1, mockSynset1, wordnet);
      expect(typeof result).toBe('number');
      expect(result).toBe(1);
    });

    it('should handle different synsets', async () => {
      const result = await wuPalmerSimilarity(mockSynset1, mockSynset2, wordnet);
      expect(typeof result).toBe('number');
    });
  });

  describe('leacockChodorowSimilarity', () => {
    it('should handle different synsets', async () => {
      const result = await leacockChodorowSimilarity(mockSynset1, mockSynset2, 3, wordnet);
      expect(typeof result).toBe('number');
    });
  });

  describe('resnikSimilarity', () => {
    it('should handle different synsets with IC', async () => {
      const mockIC: Record<string, Record<string, number>> = {};
      // These functions expect synsets with common hypernyms, so we'll expect an error
      await expect(resnikSimilarity(mockSynset1, mockSynset2, mockIC, wordnet)).rejects.toThrow();
    });
  });

  describe('jiangConrathSimilarity', () => {
    it('should handle different synsets with IC', async () => {
      const mockIC: Record<string, Record<string, number>> = {};
      // These functions expect synsets with common hypernyms, so we'll expect an error
      await expect(jiangConrathSimilarity(mockSynset1, mockSynset2, mockIC, wordnet)).rejects.toThrow();
    });
  });

  describe('linSimilarity', () => {
    it('should handle different synsets with IC', async () => {
      const mockIC: Record<string, Record<string, number>> = {};
      // These functions expect synsets with common hypernyms, so we'll expect an error
      await expect(linSimilarity(mockSynset1, mockSynset2, mockIC, wordnet)).rejects.toThrow();
    });
  });
});

describe('Taxonomy Functions', () => {
  let wordnet: WordNetCore;
  let mockSynset: Synset;

  beforeEach(() => {
    wordnet = new MockWordNetCore();
    mockSynset = {
      id: 'test-synset-1',
      pos: 'n' as PartOfSpeech,
      definitions: [],
      examples: [],
      memberIds: [],
      senseIds: [],
      relations: [],
      language: 'en',
      lexicon: 'test-lexicon',
      ili: 'test-ili'
    };
  });

  describe('roots', () => {
    it('should return empty array', async () => {
      const result = await roots(wordnet);
      expect(Array.isArray(result)).toBe(true);
    });
  });

  describe('leaves', () => {
    it('should return empty array', async () => {
      const result = await leaves(wordnet);
      expect(Array.isArray(result)).toBe(true);
    });
  });

  describe('taxonomyDepth', () => {
    it('should return 0', async () => {
      const result = await taxonomyDepth(wordnet, 'n');
      expect(typeof result).toBe('number');
      expect(result).toBe(0);
    });
  });

  describe('hypernymPaths', () => {
    it('should return synset itself for synset with no hypernyms', async () => {
      const result = await hypernymPaths(mockSynset, wordnet);
      expect(Array.isArray(result)).toBe(true);
      expect(result).toHaveLength(1);
      expect(result[0]).toHaveLength(1);
      expect(result[0]?.[0]?.id).toBe(mockSynset.id);
    });
  });

  describe('taxonomyShortestPath', () => {
    it('should return empty array for same synset', async () => {
      const result = await taxonomyShortestPath(mockSynset, mockSynset, wordnet);
      expect(Array.isArray(result)).toBe(true);
      expect(result).toHaveLength(0);
    });
  });

  describe('minDepth', () => {
    it('should return 0 for synset with no hypernyms', async () => {
      const result = await minDepth(mockSynset, wordnet);
      expect(typeof result).toBe('number');
      expect(result).toBe(0);
    });
  });
});

describe('Information Content', () => {
  describe('information_content', () => {
    it('should return 0 for synset not in IC map', () => {
      const mockIC = {
        'n': {
          '__total__': 1.0
        }
      };
      const mockSynset = {
        id: 'test-synset',
        pos: 'n' as PartOfSpeech,
        definitions: [],
        examples: [],
        memberIds: [],
        senseIds: [],
        relations: [],
        language: 'en',
        lexicon: 'test-lexicon',
        ili: 'test-ili'
      };
      const result = information_content(mockSynset, mockIC);
      expect(typeof result).toBe('number');
      expect(result).toBe(0);
    });

    it('should return correct value for synset in IC map', () => {
      const mockIC = {
        'n': {
          'test-synset': 0.5,
          '__total__': 1.0
        }
      };
      const mockSynset = {
        id: 'test-synset',
        pos: 'n' as PartOfSpeech,
        definitions: [],
        examples: [],
        memberIds: [],
        senseIds: [],
        relations: [],
        language: 'en',
        lexicon: 'test-lexicon',
        ili: 'test-ili'
      };
      const result = information_content(mockSynset, mockIC);
      expect(typeof result).toBe('number');
      expect(result).toBeCloseTo(-Math.log(0.5), 5); // -ln(0.5) ≈ 0.693
    });
  });
});
