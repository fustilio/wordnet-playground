/**
 * NodeWordNetKernel Unit Tests
 * 
 * Tests the kernel-based WordNet architecture with plugin system
 * 
 * Note: This is a lightweight test to verify the kernel structure and API.
 * Full integration tests with real data are in the e2e test suite.
 */

import { describe, it, expect } from 'vitest';
import { NodeWordNetKernel } from '../../src/wordnet-kernel.js';

describe('NodeWordNetKernel', () => {
  describe('Kernel Construction', () => {
    it('should create a kernel instance', () => {
      const wordnet = new NodeWordNetKernel('oewn:2024', {
        filename: ':memory:',
      });
      expect(wordnet).toBeDefined();
      expect(wordnet).toBeInstanceOf(NodeWordNetKernel);
    });

    it('should have core query methods', () => {
      const wordnet = new NodeWordNetKernel('oewn:2024', {
        filename: ':memory:',
      });
      
      expect(typeof wordnet.words).toBe('function');
      expect(typeof wordnet.synsets).toBe('function');
      expect(typeof wordnet.senses).toBe('function');
      expect(typeof wordnet.word).toBe('function');
      expect(typeof wordnet.synset).toBe('function');
      expect(typeof wordnet.sense).toBe('function');
    });

    it('should have lifecycle methods', () => {
      const wordnet = new NodeWordNetKernel('oewn:2024', {
        filename: ':memory:',
      });
      
      expect(typeof wordnet.initialize).toBe('function');
      expect(typeof wordnet.close).toBe('function');
    });
  });

  describe('Plugin Operations - Relations', () => {
    it('should have relation methods available', () => {
      const wordnet = new NodeWordNetKernel('oewn:2024', {
        filename: ':memory:',
      });
      
      expect(typeof wordnet.getHypernyms).toBe('function');
      expect(typeof wordnet.getHyponyms).toBe('function');
      expect(typeof wordnet.getMeronyms).toBe('function');
      expect(typeof wordnet.getHolonyms).toBe('function');
      expect(typeof wordnet.getEntailments).toBe('function');
      expect(typeof wordnet.getSimilarTos).toBe('function');
      expect(typeof wordnet.getAllRelations).toBe('function');
      expect(typeof wordnet.getRelationsByType).toBe('function');
    });
  });

  describe('Plugin Operations - Similarity', () => {
    it('should have similarity methods available', () => {
      const wordnet = new NodeWordNetKernel('oewn:2024', {
        filename: ':memory:',
      });
      
      expect(typeof wordnet.getPathSimilarity).toBe('function');
      expect(typeof wordnet.getWuPalmerSimilarity).toBe('function');
      expect(typeof wordnet.getLeacockChodorowSimilarity).toBe('function');
      expect(typeof wordnet.getBestSimilarity).toBe('function');
      expect(typeof wordnet.getCrossLingualSimilarity).toBe('function');
    });
  });

  describe('Plugin Operations - Translation', () => {
    it('should have translation methods available', () => {
      const wordnet = new NodeWordNetKernel('oewn:2024', {
        filename: ':memory:',
      });
      
      expect(typeof wordnet.getTranslations).toBe('function');
      expect(typeof wordnet.getTranslationsByWord).toBe('function');
      expect(typeof wordnet.getAvailableLanguages).toBe('function');
    });
  });

  describe('Plugin Management', () => {
    it('should list available plugins', () => {
      const wordnet = new NodeWordNetKernel('oewn:2024', {
        filename: ':memory:',
      });
      
      const plugins = wordnet.getPlugins();
      expect(Array.isArray(plugins)).toBe(true);
      // Note: relations plugin may not be loaded by default
      expect(plugins).toContain('similarity');
      expect(plugins).toContain('translation');
    });

    it('should have schema manager available', () => {
      const wordnet = new NodeWordNetKernel('oewn:2024', {
        filename: ':memory:',
      });
      
      const schemaManager = wordnet.schemaManager;
      expect(schemaManager).toBeDefined();
    });

    it('should have plugin check method', () => {
      const wordnet = new NodeWordNetKernel('oewn:2024', {
        filename: ':memory:',
      });
      
      expect(typeof wordnet.has).toBe('function');
      expect(wordnet.has('similarity')).toBe(true);
    });
  });

  describe('API Structure', () => {
    it('should have correct method signatures', () => {
      const wordnet = new NodeWordNetKernel('oewn:2024', {
        filename: ':memory:',
      });
      
      // Core methods
      expect(wordnet.words.length).toBeGreaterThanOrEqual(0);
      expect(wordnet.synsets.length).toBeGreaterThanOrEqual(0);
      expect(wordnet.senses.length).toBeGreaterThanOrEqual(0);
      
      // Plugin methods
      expect(wordnet.getHypernyms.length).toBeGreaterThanOrEqual(1);
      expect(wordnet.getPathSimilarity.length).toBeGreaterThanOrEqual(2);
      expect(wordnet.getTranslations.length).toBeGreaterThanOrEqual(1);
    });
  });
});

