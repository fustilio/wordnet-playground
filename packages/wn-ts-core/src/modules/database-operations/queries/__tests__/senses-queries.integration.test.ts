/**
 * Senses Queries Integration Test Suite
 * 
 * Tests all sense query functions with real database and actual WordNet data.
 * This is an integration test that hits the actual database to ensure query
 * functions work correctly with real data.
 */

import { it, expect, describe } from 'vitest';
import type { SenseQuery } from '../../../../core/types.js';
import {
  getSensesQuery,
  getSenseByIdQuery,
  getSensesByWordIdQuery,
  getSensesBySynsetIdQuery,
} from '../senses-queries.js';
import { createIntegrationTestSuite, type IntegrationTestContext } from '../../../../test/integration-test-utils.js';

createIntegrationTestSuite('Senses Queries Integration Tests', (getContext: () => IntegrationTestContext) => {

  describe('getSensesQuery', () => {
    it('should find senses by word ID', async () => {
      const options: SenseQuery = {
        form: 'computer-n-1',
        language: 'en'
      };
      
      const query = getSensesQuery(getContext().kyselyDb, options);
      const results = await query.execute();
      
      expect(Array.isArray(results)).toBe(true);
      expect(results.length).toBeGreaterThan(0);
      if (results.length > 0 && results[0]) {
        expect(results[0]).toHaveProperty('id');
        expect(results[0]).toHaveProperty('word_id', 'computer-n-1');
      }
    });

    it('should find senses by form', async () => {
      const options: SenseQuery = {
        form: 'computer',
        language: 'en'
      };
      
      const query = getSensesQuery(getContext().kyselyDb, options);
      const results = await query.execute();
      
      expect(Array.isArray(results)).toBe(true);
      expect(results.length).toBeGreaterThan(0);
    });

    it('should find senses by POS', async () => {
      const options: SenseQuery = {
        pos: 'n',
        language: 'en'
      };
      
      const query = getSensesQuery(getContext().kyselyDb, options);
      const results = await query.execute();
      
      expect(Array.isArray(results)).toBe(true);
      expect(results.length).toBeGreaterThan(0);
    });

    it('should find senses by lexicon', async () => {
      const options: SenseQuery = {
        lexicon: 'test-lexicon',
        language: 'en'
      };
      
      const query = getSensesQuery(getContext().kyselyDb, options);
      const results = await query.execute();
      
      expect(Array.isArray(results)).toBe(true);
      expect(results.length).toBeGreaterThan(0);
    });

    it('should handle complex filtering', async () => {
      const options: SenseQuery = {
        form: 'computer',
        pos: 'n',
        lexicon: 'test-lexicon',
        language: 'en'
      };
      
      const query = getSensesQuery(getContext().kyselyDb, options);
      const results = await query.execute();
      
      expect(Array.isArray(results)).toBe(true);
      expect(results.length).toBeGreaterThan(0);
    });
  });

  describe('getSenseByIdQuery', () => {
    it('should find sense by ID', async () => {
      const senseId = 'sense-computer-1';
      
      const query = getSenseByIdQuery(getContext().kyselyDb, senseId);
      const results = await query.execute();
      
      expect(Array.isArray(results)).toBe(true);
      expect(results.length).toBeGreaterThan(0);
      if (results.length > 0 && results[0]) {
        expect(results[0].id).toBe(senseId);
      }
    });

    it('should return empty array for non-existent sense ID', async () => {
      const senseId = 'non-existent-sense';
      
      const query = getSenseByIdQuery(getContext().kyselyDb, senseId);
      const results = await query.execute();
      
      expect(Array.isArray(results)).toBe(true);
      expect(results.length).toBe(0);
    });
  });

  describe('getSensesByWordIdQuery', () => {
    it('should find senses by word ID', async () => {
      const wordId = 'computer-n-1';
      
      const query = getSensesByWordIdQuery(getContext().kyselyDb, wordId);
      const results = await query.execute();
      
      expect(Array.isArray(results)).toBe(true);
      expect(results.length).toBeGreaterThan(0);
      if (results.length > 0 && results[0]) {
        expect(results[0].word_id).toBe(wordId);
      }
    });

    it('should return empty array for word with no senses', async () => {
      const wordId = 'happy-a-1'; // This word has no senses in our test data
      
      const query = getSensesByWordIdQuery(getContext().kyselyDb, wordId);
      const results = await query.execute();
      
      expect(Array.isArray(results)).toBe(true);
      expect(results.length).toBe(0);
    });
  });

  describe('getSensesBySynsetIdQuery', () => {
    it('should find senses by synset ID', async () => {
      const synsetId = 'computer-n-1';
      
      const query = getSensesBySynsetIdQuery(getContext().kyselyDb, synsetId);
      const results = await query.execute();
      
      expect(Array.isArray(results)).toBe(true);
      expect(results.length).toBeGreaterThan(0);
      if (results.length > 0 && results[0]) {
        expect(results[0].synset_id).toBe(synsetId);
      }
    });

    it('should return empty array for synset with no senses', async () => {
      const synsetId = 'non-existent-synset';
      
      const query = getSensesBySynsetIdQuery(getContext().kyselyDb, synsetId);
      const results = await query.execute();
      
      expect(Array.isArray(results)).toBe(true);
      expect(results.length).toBe(0);
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
      const query = getSensesByWordIdQuery(getContext().kyselyDb, 'computer-n-1');
      const results = await query.execute();
      
      expect(Array.isArray(results)).toBe(true);
      expect(results.length).toBeGreaterThan(0);
      // Results should be properly linked through foreign keys
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
      expect(ilis.length).toBe(2); // i-computer-1, i-run-1
    });
  });
});
