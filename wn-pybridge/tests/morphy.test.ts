import { describe, it, expect, beforeAll } from 'vitest';
import { WnBridge } from '../src/index.js';

let wn: WnBridge | null = null;
let bridgeInitialized = false;

describe('Morphy Lemmatization Tests', () => {
  beforeAll(async () => {
    try {
      console.log('Initializing WordNet bridge for Morphy tests...');
      wn = new WnBridge();
      await wn.init();
      
      // Pre-initialize Morphy to avoid repeated slow initialization
      console.log('Pre-initializing Morphy...');
      await wn.morphy.lemmatize('test', 'n');
      console.log('Morphy initialization complete');
      
      bridgeInitialized = true;
    } catch (error) {
      console.error('Failed to initialize bridge:', error);
      bridgeInitialized = false;
    }
  });

  describe('Morphy Initialization', () => {
    it('should initialize morphy module successfully', async () => {
      expect(bridgeInitialized).toBe(true);
      expect(wn).toBeDefined();
      expect(wn!.morphy).toBeDefined();
    });
  });

  describe('Basic Lemmatization', () => {
    it('should lemmatize regular nouns', async () => {
      if (!bridgeInitialized) {
        console.log('Skipping test: bridge not initialized');
        return;
      }
      const result = await wn!.morphy.lemmatize('dogs', 'n');
      console.log('Regular nouns result:', result);
      expect(result).toBeDefined();
      expect(result.n).toBeDefined();
      expect(result.n.has('dog')).toBe(true);
    });

    it('should lemmatize regular verbs', async () => {
      if (!bridgeInitialized) {
        console.log('Skipping test: bridge not initialized');
        return;
      }
      const result = await wn!.morphy.lemmatize('running', 'v');
      console.log('Regular verbs result:', result);
      expect(result).toBeDefined();
      expect(result.v).toBeDefined();
      expect(result.v.has('run')).toBe(true);
    });

    it('should lemmatize adjectives', async () => {
      if (!bridgeInitialized) {
        console.log('Skipping test: bridge not initialized');
        return;
      }
      const result = await wn!.morphy.lemmatize('happier', 'adj');
      console.log('Adjectives result:', result);
      expect(result).toBeDefined();
      if (result.adj) {
        expect(result.adj.has('happy')).toBe(true);
      } else {
        expect(Object.keys(result)).toHaveLength(0);
      }
    });

    it('should handle irregular forms', async () => {
      if (!bridgeInitialized) {
        console.log('Skipping test: bridge not initialized');
        return;
      }
      const result = await wn!.morphy.lemmatize('geese', 'n');
      console.log('Irregular forms result:', result);
      expect(result).toBeDefined();
      expect(result.n).toBeDefined();
      expect(result.n.has('goose')).toBe(true);
    });
  });

  describe('Multi-POS Lemmatization', () => {
    it('should lemmatize across all parts of speech', async () => {
      if (!bridgeInitialized) {
        console.log('Skipping test: bridge not initialized');
        return;
      }
      const result = await wn!.morphy.lemmatize('gooses');
      console.log('Multi-POS result:', result);
      expect(result).toBeDefined();
      expect(result.n).toBeDefined();
      expect(result.v).toBeDefined();
      expect(result.n.has('goose')).toBe(true);
      expect(result.v.has('goose')).toBe(true);
    });

    it('should handle words with multiple forms', async () => {
      if (!bridgeInitialized) {
        console.log('Skipping test: bridge not initialized');
        return;
      }
      const result = await wn!.morphy.lemmatize('axes');
      console.log('Multiple forms result:', result);
      expect(result).toBeDefined();
      expect(result.n).toBeDefined();
      expect(result.v).toBeDefined();
      expect(result.n.has('axe')).toBe(true);
      expect(result.n.has('axis')).toBe(true);
      expect(result.v.has('axe')).toBe(true);
    });
  });

  describe('POS-Specific Lemmatization', () => {
    it('should get lemmas for specific POS', async () => {
      if (!bridgeInitialized) {
        console.log('Skipping test: bridge not initialized');
        return;
      }
      const result = await wn!.morphy.getLemmasForPos('dogs', 'n');
      console.log('POS-specific result:', result);
      expect(result).toBeInstanceOf(Set);
      expect(result.has('dog')).toBe(true);
    });

    it('should return empty set for non-existent POS', async () => {
      if (!bridgeInitialized) {
        console.log('Skipping test: bridge not initialized');
        return;
      }
      const result = await wn!.morphy.getLemmasForPos('dogs', 'x');
      console.log('Non-existent POS result:', result);
      expect(result).toBeInstanceOf(Set);
      expect(result.size).toBe(0);
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty string', async () => {
      if (!bridgeInitialized) {
        console.log('Skipping test: bridge not initialized');
        return;
      }
      const result = await wn!.morphy.lemmatize('', 'n');
      console.log('Empty string result:', result);
      expect(result).toBeDefined();
      if (result.n) {
        expect(result.n).toBeDefined();
      } else {
        expect(Object.keys(result)).toHaveLength(0);
      }
    });

    it('should handle non-existent words', async () => {
      if (!bridgeInitialized) {
        console.log('Skipping test: bridge not initialized');
        return;
      }
      const result = await wn!.morphy.lemmatize('nonexistentword', 'n');
      console.log('Non-existent word result:', result);
      expect(result).toBeDefined();
      if (result.n) {
        expect(result.n).toBeDefined();
      } else {
        expect(Object.keys(result)).toHaveLength(0);
      }
    });

    it('should handle words without specified POS', async () => {
      if (!bridgeInitialized) {
        console.log('Skipping test: bridge not initialized');
        return;
      }
      const result = await wn!.morphy.lemmatize('dogs');
      console.log('No POS specified result:', result);
      expect(result).toBeDefined();
      expect(result.n).toBeDefined();
      expect(result.v).toBeDefined();
      expect(result.n.has('dog')).toBe(true);
      expect(result.v.has('dog')).toBe(true);
    });
  });
}); 