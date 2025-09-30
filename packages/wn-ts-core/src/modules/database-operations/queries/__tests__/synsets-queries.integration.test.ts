/**
 * Synsets Queries Integration Test Suite
 * 
 * Tests all synset query functions with real database and actual WordNet data.
 * This is an integration test that hits the actual database to ensure query
 * functions work correctly with real data.
 */

import { describe, it, expect } from 'vitest';
import type { SynsetQuery } from '../../../../core/types.js';
import {
  getSynsetsV2Query,
  getSynsetsV3Query,
  getSynsetsV4Query,
  getSynsetsV5Query,
  getSynsetsV6Query,
  getSynsetsFastQuery,
  getSynsetByIdQuery,
  getSynsetsByFormFastQuery,
  getSynsetsByLexiconQuery,
  getSynsetsByIliQuery,
} from '../synsets-queries.js';
import { 
  createIntegrationTestSuite,
  // testAssertions,
  type IntegrationTestContext
} from '../../../../test/integration-test-utils.js';

createIntegrationTestSuite('Synsets Queries Integration Tests', (getContext: () => IntegrationTestContext) => {

  // Test setup is handled by createIntegrationTestSuite

  describe('getSynsetsV2Query', () => {
    it('should find synsets by form', async () => {
      const options: SynsetQuery = {
        form: 'computer',
        language: 'en'
      };
      
      const query = getSynsetsV2Query(getContext().kyselyDb, options);
      const results = await query.execute();
      
      expect(Array.isArray(results)).toBe(true);
      expect(results.length).toBeGreaterThan(0);
    });

    it('should find synsets by POS', async () => {
      const options: SynsetQuery = {
        pos: 'n',
        language: 'en'
      };
      
      const query = getSynsetsV2Query(getContext().kyselyDb, options);
      const results = await query.execute();
      
      expect(Array.isArray(results)).toBe(true);
      expect(results.length).toBeGreaterThan(0);
    });

    it('should find synsets by lexicon', async () => {
      const options: SynsetQuery = {
        lexicon: 'test-lexicon',
        language: 'en'
      };
      
      const query = getSynsetsV2Query(getContext().kyselyDb, options);
      const results = await query.execute();
      
      expect(Array.isArray(results)).toBe(true);
      expect(results.length).toBeGreaterThan(0);
    });

    it('should find synsets by language', async () => {
      const options: SynsetQuery = {
        language: 'en'
      };
      
      const query = getSynsetsV2Query(getContext().kyselyDb, options);
      const results = await query.execute();
      
      expect(Array.isArray(results)).toBe(true);
      expect(results.length).toBeGreaterThan(0);
    });

    it('should find synsets by ILI', async () => {
      const options: SynsetQuery = {
        language: 'en'
      } as any;
      (options as any).ili = 'i-computer-1';
      
      const query = getSynsetsV2Query(getContext().kyselyDb, options);
      const results = await query.execute();
      
      expect(Array.isArray(results)).toBe(true);
      expect(results.length).toBeGreaterThan(0);
    });

    it('should handle complex filtering', async () => {
      const options: SynsetQuery = {
        form: 'computer',
        language: 'en',
        pos: 'n',
        lexicon: 'test-lexicon'
      };
      
      const query = getSynsetsV2Query(getContext().kyselyDb, options);
      const results = await query.execute();
      
      expect(Array.isArray(results)).toBe(true);
      expect(results.length).toBeGreaterThan(0);
    });
  });

  describe('getSynsetsV3Query', () => {
    it('should find synsets with V3 optimization', async () => {
      const options: SynsetQuery = {
        form: 'computer',
        language: 'en',
        pos: 'n'
      };
      
      const query = getSynsetsV3Query(getContext().kyselyDb, options);
      const results = await query.execute();
      
      expect(Array.isArray(results)).toBe(true);
      expect(results.length).toBeGreaterThan(0);
    });

    it('should find synsets by form only', async () => {
      const options: SynsetQuery = {
        form: 'run',
        language: 'en'
      };
      
      const query = getSynsetsV3Query(getContext().kyselyDb, options);
      const results = await query.execute();
      
      expect(Array.isArray(results)).toBe(true);
      expect(results.length).toBeGreaterThan(0);
    });
  });

  describe('getSynsetsV4Query', () => {
    it('should find synsets with V4 massive join', async () => {
      const options: SynsetQuery = {
        form: 'computer',
        language: 'en'
      };
      
      const query = getSynsetsV4Query(getContext().kyselyDb, options);
      const results = await query.execute();
      
      expect(Array.isArray(results)).toBe(true);
      expect(results.length).toBeGreaterThan(0);
    });

    it('should return detailed synset data', async () => {
      const options: SynsetQuery = {
        form: 'computer',
        language: 'en'
      };
      
      const query = getSynsetsV4Query(getContext().kyselyDb, options);
      const results = await query.execute();
      
      expect(Array.isArray(results)).toBe(true);
      expect(results.length).toBeGreaterThan(0);
      
      if (results.length === 0 || !results[0]) {
        expect(results[0]).toBeDefined();
        return;
      }
      
      expect(results[0]).toHaveProperty('synset_id');
      expect(results[0]).toHaveProperty('synset_pos');
      expect(results[0]).toHaveProperty('synset_language');
    });
  });

  describe('getSynsetsV5Query', () => {
    it('should find synsets with V5 index optimization', async () => {
      const options: SynsetQuery = {
        form: 'computer',
        language: 'en'
      };
      
      const query = getSynsetsV5Query(getContext().kyselyDb, options);
      const results = await query.execute();
      
      expect(Array.isArray(results)).toBe(true);
      expect(results.length).toBeGreaterThan(0);
    });

    it('should handle fuzzy search', async () => {
      const options: SynsetQuery = {
        form: 'comp',
        language: 'en',
        fuzzy: true
      };
      
      const query = getSynsetsV5Query(getContext().kyselyDb, options);
      const results = await query.execute();
      
      expect(Array.isArray(results)).toBe(true);
    });
  });

  describe('getSynsetsV6Query', () => {
    it('should find synsets with V6 most efficient query', async () => {
      const options: SynsetQuery = {
        form: 'computer',
        language: 'en'
      };
      
      const query = getSynsetsV6Query(getContext().kyselyDb, options);
      const results = await query.execute();
      
      expect(Array.isArray(results)).toBe(true);
      expect(results.length).toBeGreaterThan(0);
    });

    it('should handle maxResults limit', async () => {
      const options: SynsetQuery = {
        form: 'computer',
        language: 'en',
        maxResults: 1
      };
      
      const query = getSynsetsV6Query(getContext().kyselyDb, options);
      const results = await query.execute();
      
      expect(Array.isArray(results)).toBe(true);
      expect(results.length).toBeLessThanOrEqual(1);
    });
  });

  describe('getSynsetsFastQuery', () => {
    it('should find synsets quickly', async () => {
      const options: SynsetQuery = {
        form: 'computer',
        language: 'en'
      };
      
      const query = getSynsetsFastQuery(getContext().kyselyDb, options);
      const results = await query.execute();
      
      expect(Array.isArray(results)).toBe(true);
      expect(results.length).toBeGreaterThan(0);
    });

    it('should find synsets by POS only', async () => {
      const options: SynsetQuery = {
        pos: 'v',
        language: 'en'
      };
      
      const query = getSynsetsFastQuery(getContext().kyselyDb, options);
      const results = await query.execute();
      
      expect(Array.isArray(results)).toBe(true);
      expect(results.length).toBeGreaterThan(0);
    });
  });

  describe('getSynsetByIdQuery', () => {
    it('should find synset by ID', async () => {
      const synsetId = 'computer-n-1';
      
      const query = getSynsetByIdQuery(getContext().kyselyDb, synsetId);
      const results = await query.execute();
      
      expect(Array.isArray(results)).toBe(true);
      expect(results.length).toBeGreaterThan(0);
      
      if (results.length === 0 || !results[0]) {
        expect(results[0]).toBeDefined();
        return;
      }
      
      expect(results[0].id).toBe(synsetId);
    });

    it('should return empty array for non-existent synset ID', async () => {
      const synsetId = 'non-existent-synset';
      
      const query = getSynsetByIdQuery(getContext().kyselyDb, synsetId);
      const results = await query.execute();
      
      expect(Array.isArray(results)).toBe(true);
      expect(results.length).toBe(0);
    });
  });

  describe('getSynsetsByFormFastQuery', () => {
    it('should find synsets by form quickly', async () => {
      const form = 'computer';
      
      const query = getSynsetsByFormFastQuery(getContext().kyselyDb, form);
      const results = await query.execute();
      
      expect(Array.isArray(results)).toBe(true);
      expect(results.length).toBeGreaterThan(0);
    });

    it('should find synsets by form with POS filter', async () => {
      const form = 'run';
      const options = { pos: 'v' };
      
      const query = getSynsetsByFormFastQuery(getContext().kyselyDb, form, options);
      const results = await query.execute();
      
      expect(Array.isArray(results)).toBe(true);
      expect(results.length).toBeGreaterThan(0);
    });

    it('should find synsets by form with lexicon filter', async () => {
      const form = 'computer';
      const options = { lexicon: 'test-lexicon' };
      
      const query = getSynsetsByFormFastQuery(getContext().kyselyDb, form, options);
      const results = await query.execute();
      
      expect(Array.isArray(results)).toBe(true);
      expect(results.length).toBeGreaterThan(0);
    });

    it('should handle maxResults limit', async () => {
      const form = 'computer';
      const options = { maxResults: 1 };
      
      const query = getSynsetsByFormFastQuery(getContext().kyselyDb, form, options);
      const results = await query.execute();
      
      expect(Array.isArray(results)).toBe(true);
      expect(results.length).toBeLessThanOrEqual(1);
    });
  });

  describe('getSynsetsByLexiconQuery', () => {
    it('should find synsets by lexicon', async () => {
      const lexiconId = 'test-lexicon';
      
      const query = getSynsetsByLexiconQuery(getContext().kyselyDb, lexiconId);
      const results = await query.execute();
      
      expect(Array.isArray(results)).toBe(true);
      expect(results.length).toBeGreaterThan(0);
      
      if (results.length === 0 || !results[0]) {
        expect(results[0]).toBeDefined();
        return;
      }
      
      expect(results[0].lexicon).toBe(lexiconId);
    });

    it('should return empty array for non-existent lexicon', async () => {
      const lexiconId = 'non-existent-lexicon';
      
      const query = getSynsetsByLexiconQuery(getContext().kyselyDb, lexiconId);
      const results = await query.execute();
      
      expect(Array.isArray(results)).toBe(true);
      expect(results.length).toBe(0);
    });
  });

  describe('getSynsetsByIliQuery', () => {
    it('should find synsets by ILI', async () => {
      const ili = 'i-computer-1';
      
      const query = getSynsetsByIliQuery(getContext().kyselyDb, ili);
      const results = await query.execute();
      
      expect(Array.isArray(results)).toBe(true);
      expect(results.length).toBeGreaterThan(0);
      
      if (results.length === 0 || !results[0]) {
        expect(results[0]).toBeDefined();
        return;
      }
      
      expect(results[0].ili).toBe(ili);
    });

    it('should find synsets by ILI with language exclusion', async () => {
      const ili = 'i-computer-1';
      const options = { excludeLanguage: 'fr' };
      
      const query = getSynsetsByIliQuery(getContext().kyselyDb, ili, options);
      const results = await query.execute();
      
      expect(Array.isArray(results)).toBe(true);
      expect(results.length).toBeGreaterThan(0);
    });

    it('should return empty array for non-existent ILI', async () => {
      const ili = 'i99999';
      
      const query = getSynsetsByIliQuery(getContext().kyselyDb, ili);
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
      
      if (lexicons.length === 0) {
        return;
      }
      
      const lexicon = lexicons[0];
      if (!lexicon) {
        expect(lexicon).toBeDefined();
        return;
      }
      
      const synsets = await getContext().mockCore.synsets({ lexicon: lexicon.id, language: 'en' });
      expect(Array.isArray(synsets)).toBe(true);
    });

    it('should handle database constraints correctly', async () => {
      // Test that foreign key relationships work
      const query = getSynsetsByFormFastQuery(getContext().kyselyDb, 'computer');
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
