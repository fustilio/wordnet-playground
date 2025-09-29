/**
 * Words Queries Integration Test Suite
 * 
 * Tests all word query functions with real database and actual WordNet data.
 * This is an integration test that hits the actual database to ensure query
 * functions work correctly with real data.
 */

import { describe, it, expect } from 'vitest';
import type { PartOfSpeech, WordQuery } from '../../../../core/types.js';
import {
  getWordsBySynsetAndLanguageQuery,
  getWordsQuery,
  getWordByIdQuery,
  getWordsByFormFastQuery,
  getWordsByFormFuzzyFastQuery,
  getWordsByLexiconQuery,
  getWordsByIdsQuery,
  getWordsByIliAndLanguageQuery,
  getWordsByIliAndLexiconPrefixQuery,
} from '../words-queries.js';
import { 
  createIntegrationTestSuite,
  testAssertions,
  type IntegrationTestContext
} from '../../../../test/integration-test-utils.js';

createIntegrationTestSuite('Words Queries Integration Tests', (getContext: () => IntegrationTestContext) => {

  // Additional test data for specific word query tests (if needed)
  // const additionalTestWords = testDataGenerators.generateWords(3, 'test-word');
  // const additionalTestSynsets = testDataGenerators.generateSynsets(2, 'test-synset');
  // const additionalTestSenses = testDataGenerators.generateSenses(2, 'test-word', 'test-synset');


  describe('getWordsBySynsetAndLanguageQuery', () => {
    it('should find words in a synset for specific language', async () => {
      const synsetId = 'synset-1';
      const language = 'en';
      
      const query = getWordsBySynsetAndLanguageQuery(getContext().kyselyDb, synsetId, language);
      const results = await query.execute();
      
      testAssertions.expectQueryResult(results, ['id', 'lemma', 'pos']);
    });

    it('should find words in a synset without language filter', async () => {
      const synsetId = 'synset-1';
      
      const query = getWordsBySynsetAndLanguageQuery(getContext().kyselyDb, synsetId);
      const results = await query.execute();
      
      testAssertions.expectQueryResult(results, ['id', 'lemma', 'pos']);
    });
  });

  describe('getWordsQuery', () => {
    it('should find words by form', async () => {
      const options: WordQuery = {
        form: 'computer',
        fuzzy: false,
        language: undefined
      };
      
      const query = getWordsQuery(getContext().kyselyDb, options);
      const results = await query.execute();
      
      expect(Array.isArray(results)).toBe(true);
      expect(results.length).toBeGreaterThan(0);
      if (results.length > 0 && results[0]) {
        expect(results[0].lemma).toBe('computer');
      }
    });

    it('should find words with fuzzy search', async () => {
      const options: WordQuery = {
        form: 'comp',
        fuzzy: true,
        language: undefined
      };
      
      const query = getWordsQuery(getContext().kyselyDb, options);
      const results = await query.execute();
      
      expect(Array.isArray(results)).toBe(true);
      expect(results.length).toBeGreaterThan(0);
    });

    it('should find words by POS', async () => {
      const options: WordQuery = {
        pos: 'n' as PartOfSpeech,
        language: undefined
      };
      
      const query = getWordsQuery(getContext().kyselyDb, options);
      const results = await query.execute();
      
      expect(Array.isArray(results)).toBe(true);
      expect(results.length).toBeGreaterThan(0);
      if (results.length > 0 && results[0]) {
        expect(results[0].pos).toBe('n');
      }
    });

    it('should find words by lexicon', async () => {
      const options: WordQuery = {
        lexicon: 'test-lexicon',
        language: undefined
      };
      
      const query = getWordsQuery(getContext().kyselyDb, options);
      const results = await query.execute();
      
      expect(Array.isArray(results)).toBe(true);
      expect(results.length).toBeGreaterThan(0);
      if (results.length > 0 && results[0]) {
        expect(results[0].lexicon).toBe('test-lexicon');
      }
    });

    it('should find words by language', async () => {
      const options: WordQuery = {
        language: 'en'
      };
      
      const query = getWordsQuery(getContext().kyselyDb, options);
      const results = await query.execute();
      
      expect(Array.isArray(results)).toBe(true);
      expect(results.length).toBeGreaterThan(0);
      if (results.length > 0 && results[0]) {
        expect(results[0].language).toBe('en');
      }
    });

    it('should handle complex filtering', async () => {
      const options: WordQuery = {
        form: 'computer',
        pos: 'n' as PartOfSpeech,
        lexicon: 'test-lexicon',
        language: 'en',
        fuzzy: false,
        maxResults: 10
      };
      
      const query = getWordsQuery(getContext().kyselyDb, options);
      const results = await query.execute();
      
      expect(Array.isArray(results)).toBe(true);
      expect(results.length).toBeGreaterThan(0);
    });
  });

  describe('getWordByIdQuery', () => {
    it('should find word by ID', async () => {
      const wordId = 'computer-n-1';
      
      const query = getWordByIdQuery(getContext().kyselyDb, wordId);
      const results = await query.execute();
      
      expect(Array.isArray(results)).toBe(true);
      expect(results.length).toBeGreaterThan(0);
      if (results.length > 0 && results[0]) {
        expect(results[0].id).toBe(wordId);
      }
    });
  });

  describe('getWordsByFormFastQuery', () => {
    it('should find words by form quickly', async () => {
      const form = 'computer';
      
      const query = getWordsByFormFastQuery(getContext().kyselyDb, form);
      const results = await query.execute();
      
      expect(Array.isArray(results)).toBe(true);
      expect(results.length).toBeGreaterThan(0);
      if (results.length > 0 && results[0]) {
        expect(results[0].lemma).toBe('computer');
      }
    });

    it('should find words with POS filter', async () => {
      const form = 'run';
      const options = { pos: 'v' as PartOfSpeech };
      
      const query = getWordsByFormFastQuery(getContext().kyselyDb, form, options);
      const results = await query.execute();
      
      expect(Array.isArray(results)).toBe(true);
      expect(results.length).toBeGreaterThan(0);
      if (results.length > 0 && results[0]) {
        expect(results[0].pos).toBe('v');
      }
    });
  });

  describe('getWordsByFormFuzzyFastQuery', () => {
    it('should find words with fuzzy search', async () => {
      const form = 'comp';
      
      const query = getWordsByFormFuzzyFastQuery(getContext().kyselyDb, form);
      const results = await query.execute();
      
      expect(Array.isArray(results)).toBe(true);
    });
  });

  describe('getWordsByLexiconQuery', () => {
    it('should find words by lexicon', async () => {
      const lexiconId = 'test-lexicon';
      
      const query = getWordsByLexiconQuery(getContext().kyselyDb, lexiconId);
      const results = await query.execute();
      
      expect(Array.isArray(results)).toBe(true);
      expect(results.length).toBeGreaterThan(0);
      if (results.length > 0 && results[0]) {
        expect(results[0].lexicon).toBe(lexiconId);
      }
    });
  });

  describe('getWordsByIdsQuery', () => {
    it('should find words by IDs array', async () => {
      const wordIds = ['test-computer-n', 'test-run-v'];
      
      const query = getWordsByIdsQuery(getContext().kyselyDb, wordIds);
      const results = await query.execute();
      
      expect(Array.isArray(results)).toBe(true);
      expect(results.length).toBeLessThanOrEqual(wordIds.length);
    });

    it('should handle empty IDs array', async () => {
      const wordIds: string[] = [];
      
      const query = getWordsByIdsQuery(getContext().kyselyDb, wordIds);
      const results = await query.execute();
      
      expect(Array.isArray(results)).toBe(true);
    });
  });

  describe('getWordsByIliAndLanguageQuery', () => {
    it('should find words by ILI and language', async () => {
      const ili = 'i12345';
      const language = 'en';
      
      const query = getWordsByIliAndLanguageQuery(getContext().kyselyDb, ili, language);
      const results = await query.execute();
      
      expect(Array.isArray(results)).toBe(true);
    });

    it('should find words by ILI only', async () => {
      const ili = 'i12345';
      
      const query = getWordsByIliAndLanguageQuery(getContext().kyselyDb, ili);
      const results = await query.execute();
      
      expect(Array.isArray(results)).toBe(true);
    });
  });

  describe('getWordsByIliAndLexiconPrefixQuery', () => {
    it('should find words by ILI and lexicon prefix', async () => {
      const ili = 'i12345';
      const lexiconPrefix = 'test';
      
      const query = getWordsByIliAndLexiconPrefixQuery(getContext().kyselyDb, ili, lexiconPrefix);
      const results = await query.execute();
      
      expect(Array.isArray(results)).toBe(true);
    });
  });

  describe('Real Data Integration', () => {
    it('should work with actual WordNet data structure', async () => {
      // Test that our queries work with the real database schema
      const lexicons = await getContext().mockCore.lexicons();
      expect(Array.isArray(lexicons)).toBe(true);
      
      if (lexicons.length > 0) {
        const lexicon = lexicons[0];
        expect(lexicon).toBeDefined();
        const words = await getContext().mockCore.words({ lexicon: lexicon?.id, language: undefined });
        expect(Array.isArray(words)).toBe(true);
        
        if (words.length > 0) {
          const word = words[0];
          expect(word).toBeDefined();
          const senses = await getContext().mockCore.senses({ form: word?.id, language: 'en' });
          expect(Array.isArray(senses)).toBe(true);
        }
      }
    });

    it('should handle database constraints correctly', async () => {
      // Test that foreign key relationships work
      const query = getWordsBySynsetAndLanguageQuery(getContext().kyselyDb, 'computer-n-1', 'en');
      const results = await query.execute();
      
      expect(Array.isArray(results)).toBe(true);
      expect(results.length).toBeGreaterThan(0);
      // Results should be properly joined through the senses table
    });

    it('should verify database integrity', async () => {
      // Test that all our test data is properly linked
      const words = await getContext().kyselyDb.selectFrom('words').selectAll().execute();
      expect(words.length).toBe(3); // computer, run, happy
      
      const synsets = await getContext().kyselyDb.selectFrom('synsets').selectAll().execute();
      expect(synsets.length).toBe(2); // computer-n-1, run-v-1
      
      const senses = await getContext().kyselyDb.selectFrom('senses').selectAll().execute();
      expect(senses.length).toBe(2); // one sense per synset
      
      const definitions = await getContext().kyselyDb.selectFrom('definitions').selectAll().execute();
      expect(definitions.length).toBe(2); // one definition per synset
      
      const ilis = await getContext().kyselyDb.selectFrom('ilis').selectAll().execute();
      expect(ilis.length).toBe(2); // i12345, i12346
    });
  });
});
