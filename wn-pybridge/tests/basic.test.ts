import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { WnBridge } from '../src/index.js';

describe('WnBridge Basic Functionality Tests', { timeout: 60000 }, () => {
  let wn: WnBridge | null = null;
  let bridgeInitialized = false;

  beforeAll(async () => {
    try {
      wn = new WnBridge();
      await wn.init();
      bridgeInitialized = true;
    } catch (error) {
      console.warn('Bridge initialization failed:', error);
      bridgeInitialized = false;
    }
  });

  afterAll(async () => {
    if (wn) {
      await wn.close();
    }
  });

  describe('Bridge Initialization', () => {
    it('should initialize bridge successfully', () => {
      expect(bridgeInitialized).toBe(true);
    });
  });

  describe('Lexicon Management', () => {
    it('should list available lexicons', async () => {
      if (!bridgeInitialized) {
        console.log('Skipping test: bridge not initialized');
        return;
      }

      const lexicons = await wn!.lexicons();
      expect(Array.isArray(lexicons)).toBe(true);
      
      if (lexicons.length > 0) {
        for (const lexicon of lexicons) {
          expect(lexicon).toHaveProperty('id');
          expect(lexicon).toHaveProperty('label');
          expect(lexicon).toHaveProperty('language');
        }
      }
    });

    it('should get projects', async () => {
      if (!bridgeInitialized) {
        console.log('Skipping test: bridge not initialized');
        return;
      }

      const projects = await wn!.projects();
      expect(Array.isArray(projects)).toBe(true);
      
      if (projects.length > 0) {
        for (const project of projects) {
          expect(project).toHaveProperty('id');
          expect(project).toHaveProperty('label');
          expect(project).toHaveProperty('version');
        }
      }
    });
  });

  describe('Word Queries', () => {
    it('should search for words by form', async () => {
      if (!bridgeInitialized) {
        console.log('Skipping test: bridge not initialized');
        return;
      }

      const words = await wn!.words('information');
      expect(Array.isArray(words)).toBe(true);
      
      if (words.length > 0) {
        const word = words[0];
        expect(word).toHaveProperty('id');
        expect(word).toHaveProperty('pos');
        expect(word).toHaveProperty('lemma');
      }
    });

    it('should handle non-existent words gracefully', async () => {
      if (!bridgeInitialized) {
        console.log('Skipping test: bridge not initialized');
        return;
      }

      const words = await wn!.words('nonexistentword');
      expect(Array.isArray(words)).toBe(true);
      expect(words.length).toBe(0);
    });

    it('should handle empty string inputs', async () => {
      if (!bridgeInitialized) {
        console.log('Skipping test: bridge not initialized');
        return;
      }

      const words = await wn!.words('');
      expect(Array.isArray(words)).toBe(true);
      expect(words.length).toBe(0);
    });

    it('should handle rare part of speech (adj) gracefully', async () => {
      if (!bridgeInitialized) {
        console.log('Skipping test: bridge not initialized');
        return;
      }
      const words = await wn!.words('information', { pos: 'adj' });
      expect(Array.isArray(words)).toBe(true);
      // It may be empty or not, but should not throw
    });
  });

  describe('Sense Queries', () => {
    it('should search for senses by word form', async () => {
      if (!bridgeInitialized) {
        console.log('Skipping test: bridge not initialized');
        return;
      }

      const senses = await wn!.senses('information');
      expect(Array.isArray(senses)).toBe(true);
      
      if (senses.length > 0) {
        const sense = senses[0];
        expect(sense).toHaveProperty('id');
        expect(sense).toHaveProperty('pos');
      }
    });

    it('should handle non-existent senses gracefully', async () => {
      if (!bridgeInitialized) {
        console.log('Skipping test: bridge not initialized');
        return;
      }

      const senses = await wn!.senses('nonexistentword');
      expect(Array.isArray(senses)).toBe(true);
      expect(senses.length).toBe(0);
    });
  });

  describe('Synset Queries', () => {
    it('should search for synsets by word form', async () => {
      if (!bridgeInitialized) {
        console.log('Skipping test: bridge not initialized');
        return;
      }

      const synsets = await wn!.synsets('information');
      expect(Array.isArray(synsets)).toBe(true);
      
      if (synsets.length > 0) {
        const synset = synsets[0];
        expect(synset).toHaveProperty('id');
        expect(synset).toHaveProperty('pos');
      }
    });

    it('should handle non-existent synsets gracefully', async () => {
      if (!bridgeInitialized) {
        console.log('Skipping test: bridge not initialized');
        return;
      }

      const synsets = await wn!.synsets('nonexistentword');
      expect(Array.isArray(synsets)).toBe(true);
      expect(synsets.length).toBe(0);
    });
  });

  describe('Error Handling', () => {
    it('should handle non-existent words gracefully', async () => {
      if (!bridgeInitialized) {
        console.log('Skipping test: bridge not initialized');
        return;
      }

      const words = await wn!.words('nonexistentword');
      expect(Array.isArray(words)).toBe(true);
      expect(words.length).toBe(0);
    });

    it('should handle non-existent synsets gracefully', async () => {
      if (!bridgeInitialized) {
        console.log('Skipping test: bridge not initialized');
        return;
      }

      const synsets = await wn!.synsets('nonexistentword');
      expect(Array.isArray(synsets)).toBe(true);
      expect(synsets.length).toBe(0);
    });

    it('should handle empty string inputs', async () => {
      if (!bridgeInitialized) {
        console.log('Skipping test: bridge not initialized');
        return;
      }

      const words = await wn!.words('');
      expect(Array.isArray(words)).toBe(true);
      expect(words.length).toBe(0);
    });
  });

  describe('Synset Relations', () => {
    it('should get hypernyms of a synset', async () => {
      if (!bridgeInitialized) {
        console.log('Skipping test: bridge not initialized');
        return;
      }

      const synsets = await wn!.synsets('dog');
      if (synsets.length > 0) {
        const synsetId = synsets[0].id;
        const hypernyms = await wn!.hypernyms(synsetId);
        expect(Array.isArray(hypernyms)).toBe(true);
        
        if (hypernyms.length > 0) {
          expect(hypernyms[0]).toHaveProperty('id');
          expect(hypernyms[0]).toHaveProperty('pos');
        }
      }
    });
  });
}); 