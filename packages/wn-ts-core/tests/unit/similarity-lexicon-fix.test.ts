/**
 * Tests for the similarity methods lexicon context fix
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { WordNetKernel } from '../../src/wordnet-kernel.js';
import { similarity } from '../../src/plugins/similarity/index.js';
import { translation } from '../../src/plugins/translation.js';

// Mock core implementation for testing
class MockWordNetCore {
  private synsets = new Map<string, any>();

  constructor() {
    // Add test synsets with different lexicons
    this.synsets.set('en-n-0001', {
      id: 'en-n-0001',
      pos: 'n',
      lexicon: 'omw-en',
      language: 'en',
      ili: 'i00001',
      definitions: [{ text: 'test definition 1' }],
      examples: [],
      relations: [],
      memberIds: [],
      senseIds: []
    });

    this.synsets.set('en-n-0002', {
      id: 'en-n-0002',
      pos: 'n',
      lexicon: 'omw-en',
      language: 'en',
      ili: 'i00002',
      definitions: [{ text: 'test definition 2' }],
      examples: [],
      relations: [],
      memberIds: [],
      senseIds: []
    });

    this.synsets.set('fr-n-0001', {
      id: 'fr-n-0001',
      pos: 'n',
      lexicon: 'omw-fr',
      language: 'fr',
      ili: 'i00001', // Same ILI as en-n-0001
      definitions: [{ text: 'définition de test 1' }],
      examples: [],
      relations: [],
      memberIds: [],
      senseIds: []
    });

    this.synsets.set('fr-n-0002', {
      id: 'fr-n-0002',
      pos: 'n',
      lexicon: 'omw-fr',
      language: 'fr',
      ili: 'i00002', // Same ILI as en-n-0002
      definitions: [{ text: 'définition de test 2' }],
      examples: [],
      relations: [],
      memberIds: [],
      senseIds: []
    });
  }

  async synset(id: string) {
    return this.synsets.get(id) || null;
  }

  async synsetsByILI(ili: string) {
    return Array.from(this.synsets.values()).filter(s => s.ili === ili);
  }

  async query() {
    return [];
  }

  async words() { return []; }
  async word() { return null; }
  async senses() { return []; }
  async sense() { return null; }
  async ili() { return null; }
  async ilis() { return []; }
  async lexicons() { return []; }
  async getWord() { return []; }
  async getSynset() { return null; }
  async getSenses() { return []; }
  async getDefinitions() { return []; }
  async getRelations() { return []; }
}

describe('Similarity Methods Lexicon Context Fix', () => {
  let kernel: WordNetKernel;

  beforeEach(() => {
    const mockCore = new MockWordNetCore();
    kernel = new WordNetKernel(mockCore);
    kernel.use(similarity);
    kernel.use(translation);
  });

  afterEach(() => {
    // Cleanup if needed
  });

  describe('Same Lexicon Similarity', () => {
    it('should work with synset objects from same lexicon', async () => {
      const synset1 = await kernel.synset('en-n-0001');
      const synset2 = await kernel.synset('en-n-0002');

      expect(synset1.lexicon).toBe('omw-en');
      expect(synset2.lexicon).toBe('omw-en');

      // These should not throw errors
      const pathSim = await (kernel as any).getPathSimilarity(synset1, synset2);
      const wupSim = await (kernel as any).getWuPalmerSimilarity(synset1, synset2);

      expect(typeof pathSim).toBe('number');
      expect(typeof wupSim).toBe('number');
    });

    it('should work with synset IDs from same lexicon', async () => {
      // These should not throw errors
      const pathSim = await (kernel as any).getPathSimilarity('en-n-0001', 'en-n-0002');
      const wupSim = await (kernel as any).getWuPalmerSimilarity('en-n-0001', 'en-n-0002');

      expect(typeof pathSim).toBe('number');
      expect(typeof wupSim).toBe('number');
    });

    it('should work with mixed synset objects and IDs from same lexicon', async () => {
      const synset1 = await kernel.synset('en-n-0001');

      // These should not throw errors
      const pathSim = await (kernel as any).getPathSimilarity(synset1, 'en-n-0002');
      const wupSim = await (kernel as any).getWuPalmerSimilarity('en-n-0001', synset1);

      expect(typeof pathSim).toBe('number');
      expect(typeof wupSim).toBe('number');
    });
  });

  describe('Cross-Lingual Similarity', () => {
    it('should work with synsets from different lexicons using ILI', async () => {
      const enSynset = await kernel.synset('en-n-0001');
      const frSynset = await kernel.synset('fr-n-0001');

      expect(enSynset.lexicon).toBe('omw-en');
      expect(frSynset.lexicon).toBe('omw-fr');
      expect(enSynset.ili).toBe('i00001');
      expect(frSynset.ili).toBe('i00001');

      // Cross-lingual similarity should work
      const crossSim = await (kernel as any).getCrossLingualSimilarity(enSynset, frSynset);
      expect(typeof crossSim).toBe('number');
    });

    it('should return 1.0 for synsets with identical ILI', async () => {
      const enSynset = await kernel.synset('en-n-0001');
      const frSynset = await kernel.synset('fr-n-0001');

      // Both have ILI 'i00001', so similarity should be 1.0
      const crossSim = await (kernel as any).getCrossLingualSimilarity(enSynset, frSynset);
      expect(crossSim).toBe(1.0);
    });

    it('should work with synset IDs for cross-lingual comparison', async () => {
      const crossSim = await (kernel as any).getCrossLingualSimilarity('en-n-0001', 'fr-n-0001');
      expect(typeof crossSim).toBe('number');
    });
  });

  describe('Error Handling', () => {
    it('should throw error for direct similarity between different lexicons', async () => {
      const enSynset = await kernel.synset('en-n-0001');
      const frSynset = await kernel.synset('fr-n-0001');

      await expect(
        (kernel as any).getPathSimilarity(enSynset, frSynset)
      ).rejects.toThrow('Synsets must be from the same lexicon');
    });

    it('should throw error for Wu-Palmer similarity between different lexicons', async () => {
      const enSynset = await kernel.synset('en-n-0001');
      const frSynset = await kernel.synset('fr-n-0001');

      await expect(
        (kernel as any).getWuPalmerSimilarity(enSynset, frSynset)
      ).rejects.toThrow('Synsets must be from the same lexicon');
    });

    it('should throw error for cross-lingual similarity without ILI', async () => {
      // Create synsets without ILI (CILI is optional)
      const synset1 = {
        id: 'test-1',
        pos: 'n',
        lexicon: 'omw-en',
        language: 'en',
        ili: undefined,
        definitions: [],
        examples: [],
        relations: [],
        memberIds: [],
        senseIds: []
      };

      const synset2 = {
        id: 'test-2',
        pos: 'n',
        lexicon: 'omw-fr',
        language: 'fr',
        ili: undefined,
        definitions: [],
        examples: [],
        relations: [],
        memberIds: [],
        senseIds: []
      };

      await expect(
        (kernel as any).getCrossLingualSimilarity(synset1, synset2)
      ).rejects.toThrow('Cross-lingual similarity requires CILI (Conceptual Interlingual Index) to be installed');
    });
  });

  describe('Plugin Method Integration', () => {
    it('should have all expected similarity methods', () => {
      const methods = [
        'getPathSimilarity',
        'getWuPalmerSimilarity',
        'getLeacockChodorowSimilarity',
        'getJaccardSimilarity',
        'getBestSimilarity',
        'findMostSimilar',
        'getCrossLingualSimilarity'
      ];

      methods.forEach(method => {
        expect(typeof (kernel as any)[method]).toBe('function');
      });
    });

    it('should handle missing methods gracefully', async () => {
      // Test that methods return default values when not available
      const result = await (kernel as any).getJaccardSimilarity('en-n-0001', 'en-n-0002');
      expect(result).toBe(0); // Placeholder implementation returns 0
    });
  });

  describe('Type Safety', () => {
    it('should accept both string and synset object parameters', async () => {
      const synset1 = await kernel.synset('en-n-0001');
      const synset2 = await kernel.synset('en-n-0002');

      // All these should work without TypeScript errors
      const sim1 = await (kernel as any).getPathSimilarity(synset1, synset2);
      const sim2 = await (kernel as any).getPathSimilarity('en-n-0001', synset2);
      const sim3 = await (kernel as any).getPathSimilarity(synset1, 'en-n-0002');
      const sim4 = await (kernel as any).getPathSimilarity('en-n-0001', 'en-n-0002');

      expect(typeof sim1).toBe('number');
      expect(typeof sim2).toBe('number');
      expect(typeof sim3).toBe('number');
      expect(typeof sim4).toBe('number');
    });
  });

  describe('Performance Considerations', () => {
    it('should handle multiple comparisons efficiently', async () => {
      const synsets = [
        await kernel.synset('en-n-0001'),
        await kernel.synset('en-n-0002')
      ];

      const start = Date.now();
      
      // Perform multiple comparisons
      const promises = [];
      for (let i = 0; i < 10; i++) {
        promises.push((kernel as any).getPathSimilarity(synsets[0], synsets[1]));
      }
      
      const results = await Promise.all(promises);
      const duration = Date.now() - start;

      expect(results).toHaveLength(10);
      expect(results.every(r => typeof r === 'number')).toBe(true);
      expect(duration).toBeLessThan(1000); // Should complete quickly
    });
  });
});
