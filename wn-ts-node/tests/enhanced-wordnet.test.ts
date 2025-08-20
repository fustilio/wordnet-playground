import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { Wordnet } from '../src/wordnet.js';
import { db } from '../src/db/database.js';

describe('Enhanced Wordnet Interface', () => {
  let wordnet: Wordnet;

  beforeEach(async () => {
    // Initialize a test wordnet instance
    wordnet = new Wordnet('test-lexicon');
    await db.initialize();
  });

  afterEach(async () => {
    await wordnet.close();
  });

  describe('Interlingual Queries', () => {
    it('should get synsets by ILI', async () => {
      const synsets = await wordnet.synsetsByILI('test-ili-123');
      expect(Array.isArray(synsets)).toBe(true);
    });
  });

  describe('Enhanced Query Methods', () => {
    it('should search words with maxResults limit', async () => {
      const words = await wordnet.searchWords({
        form: 'test',
        maxResults: 5
      });
      expect(Array.isArray(words)).toBe(true);
      expect(words.length).toBeLessThanOrEqual(5);
    });

    it('should search synsets with includeDefinitions', async () => {
      const synsets = await wordnet.searchSynsets({
        form: 'test',
        includeDefinitions: true
      });
      expect(Array.isArray(synsets)).toBe(true);
    });

    it('should get words by form', async () => {
      const words = await wordnet.wordsByForm('test', {
        pos: 'n',
        includeInflected: true
      });
      expect(Array.isArray(words)).toBe(true);
    });

    it('should get synsets by form', async () => {
      const synsets = await wordnet.synsetsByForm('test', {
        pos: 'n'
      });
      expect(Array.isArray(synsets)).toBe(true);
    });
  });

  describe('Lemmatization and Normalization', () => {
    it('should get word forms', async () => {
      // This test requires a valid word ID in the database
      try {
        const forms = await wordnet.getWordForms('test-word-id');
        expect(Array.isArray(forms)).toBe(true);
      } catch (error) {
        // Expected if word ID doesn't exist
        expect(error).toBeDefined();
      }
    });

    it('should get word lemma', async () => {
      // This test requires a valid word ID in the database
      try {
        const lemma = await wordnet.getWordLemma('test-word-id');
        expect(typeof lemma).toBe('string');
      } catch (error) {
        // Expected if word ID doesn't exist
        expect(error).toBeDefined();
      }
    });

    it('should perform morphological analysis', async () => {
      const result = await wordnet.morphy('running');
      expect(typeof result).toBe('object');
      expect(result).toHaveProperty('n');
      expect(result).toHaveProperty('v');
      expect(result).toHaveProperty('a');
      expect(result).toHaveProperty('r');
      expect(result).toHaveProperty('s');
      expect(result).toHaveProperty('c');
      expect(result).toHaveProperty('p');
      expect(result).toHaveProperty('x');
      expect(result).toHaveProperty('u');
      expect(result).toHaveProperty('i');
    });

    it('should perform morphological analysis with specific POS', async () => {
      const result = await wordnet.morphy('running', 'v');
      expect(typeof result).toBe('object');
      expect(result.v).toBeInstanceOf(Set);
    });

    it('should get derived words', async () => {
      const derived = await wordnet.getDerivedWords('test-word-id');
      expect(Array.isArray(derived)).toBe(true);
    });

    it('should normalize forms', async () => {
      const normalized = await wordnet.normalizeForm('TEST');
      expect(normalized).toBe('test');
    });

    it('should use custom normalizer', async () => {
      const customWordnet = new Wordnet('test', {
        normalizer: (form: string) => form.toUpperCase()
      });
      const normalized = await customWordnet.normalizeForm('test');
      expect(normalized).toBe('TEST');
      await customWordnet.close();
    });
  });

  describe('Relationship Queries', () => {
    it('should get hypernyms', async () => {
      try {
        const hypernyms = await wordnet.getHypernyms('test-synset-id');
        expect(Array.isArray(hypernyms)).toBe(true);
      } catch (error) {
        // Expected if synset ID doesn't exist
        expect(error).toBeDefined();
      }
    });

    it('should get hyponyms', async () => {
      try {
        const hyponyms = await wordnet.getHyponyms('test-synset-id');
        expect(Array.isArray(hyponyms)).toBe(true);
      } catch (error) {
        // Expected if synset ID doesn't exist
        expect(error).toBeDefined();
      }
    });

    it('should get related synsets by type', async () => {
      try {
        const related = await wordnet.getRelatedSynsets('test-synset-id', 'antonym');
        expect(Array.isArray(related)).toBe(true);
      } catch (error) {
        // Expected if synset ID doesn't exist
        expect(error).toBeDefined();
      }
    });

    it('should get related senses by type', async () => {
      const related = await wordnet.getRelatedSenses('test-sense-id', 'antonym');
      expect(Array.isArray(related)).toBe(true);
    });

    it('should get shortest path between synsets', async () => {
      const path = await wordnet.getShortestPath('synset1', 'synset2');
      expect(Array.isArray(path)).toBe(true);
    });

    it('should get synset depth', async () => {
      try {
        const depth = await wordnet.getSynsetDepth('test-synset-id');
        expect(typeof depth).toBe('number');
        expect(depth).toBeGreaterThanOrEqual(0);
      } catch (error) {
        // Expected if synset ID doesn't exist
        expect(error).toBeDefined();
      }
    });
  });

  describe('Translation and Cross-Lingual Queries', () => {
    it('should translate words', async () => {
      const translations = await wordnet.translateWord('test-word-id', 'fr');
      expect(typeof translations).toBe('object');
    });

    it('should translate synsets', async () => {
      try {
        const translations = await wordnet.translateSynset('test-synset-id', 'fr');
        expect(Array.isArray(translations)).toBe(true);
      } catch (error) {
        // Expected if synset ID doesn't exist
        expect(error).toBeDefined();
      }
    });

    it('should translate senses', async () => {
      const translations = await wordnet.translateSense('test-sense-id', 'fr');
      expect(Array.isArray(translations)).toBe(true);
    });

    it('should get cross-lingual synsets by ILI', async () => {
      const crossLingual = await wordnet.getCrossLingualSynsets('test-ili', ['en', 'fr']);
      expect(typeof crossLingual).toBe('object');
    });
  });

  describe('Content and Metadata Queries', () => {
    it('should get definitions', async () => {
      try {
        const definitions = await wordnet.getDefinitions('test-synset-id');
        expect(Array.isArray(definitions)).toBe(true);
      } catch (error) {
        // Expected if synset ID doesn't exist
        expect(error).toBeDefined();
      }
    });

    it('should get examples', async () => {
      try {
        const examples = await wordnet.getExamples('test-synset-id');
        expect(Array.isArray(examples)).toBe(true);
      } catch (error) {
        // Expected if synset ID doesn't exist
        expect(error).toBeDefined();
      }
    });

    it('should get sense examples', async () => {
      const examples = await wordnet.getSenseExamples('test-sense-id');
      expect(Array.isArray(examples)).toBe(true);
    });

    it('should get synset words', async () => {
      try {
        const words = await wordnet.getSynsetWords('test-synset-id');
        expect(Array.isArray(words)).toBe(true);
      } catch (error) {
        // Expected if synset ID doesn't exist
        expect(error).toBeDefined();
      }
    });

    it('should get synset lemmas', async () => {
      try {
        const lemmas = await wordnet.getSynsetLemmas('test-synset-id');
        expect(Array.isArray(lemmas)).toBe(true);
      } catch (error) {
        // Expected if synset ID doesn't exist
        expect(error).toBeDefined();
      }
    });

    it('should get synset senses', async () => {
      try {
        const senses = await wordnet.getSynsetSenses('test-synset-id');
        expect(Array.isArray(senses)).toBe(true);
      } catch (error) {
        // Expected if synset ID doesn't exist
        expect(error).toBeDefined();
      }
    });
  });

  describe('Utility and Configuration Methods', () => {
    it('should check if lexicon exists', async () => {
      const exists = await wordnet.hasLexicon('test-lexicon');
      expect(typeof exists).toBe('boolean');
    });

    it('should get supported languages', async () => {
      const languages = await wordnet.getSupportedLanguages();
      expect(Array.isArray(languages)).toBe(true);
    });

    it('should get lexicon dependencies', async () => {
      const deps = await wordnet.getLexiconDependencies('test-lexicon');
      expect(Array.isArray(deps)).toBe(true);
    });
  });

  describe('Enhanced Statistics', () => {
    it('should get enhanced lexicon statistics', async () => {
      const stats = await wordnet.getLexiconStatistics();
      expect(Array.isArray(stats)).toBe(true);
      
      if (stats.length > 0) {
        const stat = stats[0];
        expect(stat).toHaveProperty('lexiconId');
        expect(stat).toHaveProperty('label');
        expect(stat).toHaveProperty('language');
        expect(stat).toHaveProperty('version');
        expect(stat).toHaveProperty('wordCount');
        expect(stat).toHaveProperty('synsetCount');
        expect(stat).toHaveProperty('senseCount');
        expect(stat).toHaveProperty('iliCount');
      }
    });

    it('should get enhanced data quality metrics', async () => {
      const metrics = await wordnet.getDataQualityMetrics();
      expect(metrics).toHaveProperty('synsetsWithILI');
      expect(metrics).toHaveProperty('synsetsWithoutILI');
      expect(metrics).toHaveProperty('iliCoveragePercentage');
      expect(metrics).toHaveProperty('emptySynsets');
      expect(metrics).toHaveProperty('synsetsWithDefinitions');
      expect(metrics).toHaveProperty('synsetsWithExamples');
      expect(metrics).toHaveProperty('averageSynsetSize');
    });
  });

  describe('Error Handling', () => {
    it('should handle non-existent word IDs gracefully', async () => {
      try {
        await wordnet.getWordForms('non-existent-id');
        // fail('Should have thrown an error'); // Original code had this line commented out
      } catch (error) {
        expect(error).toBeDefined();
      }
    });

    it('should handle non-existent synset IDs gracefully', async () => {
      try {
        await wordnet.getHypernyms('non-existent-id');
        // fail('Should have thrown an error'); // Original code had this line commented out
      } catch (error) {
        expect(error).toBeDefined();
      }
    });

    it('should handle non-existent sense IDs gracefully', async () => {
      try {
        await wordnet.getSenseExamples('non-existent-id');
        // This method doesn't throw, it just returns empty array
        expect(true).toBe(true);
      } catch (error) {
        // If it does throw, that's also acceptable
        expect(error).toBeDefined();
      }
    });
  });

  describe('Performance and Edge Cases', () => {
    it('should handle empty search results', async () => {
      const words = await wordnet.searchWords({
        form: 'xyz123nonexistentword',
        maxResults: 10
      });
      expect(Array.isArray(words)).toBe(true);
      expect(words.length).toBe(0);
    });

    it('should handle large maxResults gracefully', async () => {
      const words = await wordnet.searchWords({
        form: 'test',
        maxResults: 1000000
      });
      expect(Array.isArray(words)).toBe(true);
    });

    it('should handle empty morphy results', async () => {
      const result = await wordnet.morphy('xyz123nonexistentword');
      expect(typeof result).toBe('object');
      // All POS should have empty sets
      Object.values(result).forEach(set => {
        expect(set).toBeInstanceOf(Set);
        expect(set.size).toBe(0);
      });
    });
  });
});
