/**
 * Statistics Queries Integration Test Suite
 * 
 * Tests all statistics query functions with real database and actual WordNet data.
 * This is an integration test that hits the actual database to ensure query
 * functions work correctly with real data.
 */

import { it, expect, describe } from 'vitest';
import {
  getStatisticsQueries,
} from '../statistics-queries.js';
import { createIntegrationTestSuite, type IntegrationTestContext } from '../../../../test/integration-test-utils.js';

createIntegrationTestSuite('Statistics Queries Integration Tests', (getContext: () => IntegrationTestContext) => {

  describe('getStatisticsQueries', () => {
    it('should provide statistics queries', async () => {
      const statsQueries = getStatisticsQueries(getContext().kyselyDb);
      
      expect(statsQueries).toBeDefined();
      expect(statsQueries.totalWords).toBeDefined();
      expect(statsQueries.totalSynsets).toBeDefined();
      expect(statsQueries.totalSenses).toBeDefined();
      expect(statsQueries.totalILIs).toBeDefined();
      expect(statsQueries.totalLexicons).toBeDefined();
    });

    it('should return correct word count', async () => {
      const statsQueries = getStatisticsQueries(getContext().kyselyDb);
      const result = await statsQueries.totalWords.execute();
      
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(1);
      if (result[0]) {
        expect(result[0]).toHaveProperty('count');
        expect(typeof result[0].count).toBe('number');
        expect(result[0].count).toBe(3); // We have 3 words
      }
    });

    it('should return correct synset count', async () => {
      const statsQueries = getStatisticsQueries(getContext().kyselyDb);
      const result = await statsQueries.totalSynsets.execute();
      
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(1);
      if (result[0]) {
        expect(result[0]).toHaveProperty('count');
        expect(typeof result[0].count).toBe('number');
        expect(result[0].count).toBe(2); // We have 2 synsets
      }
    });

    it('should return correct sense count', async () => {
      const statsQueries = getStatisticsQueries(getContext().kyselyDb);
      const result = await statsQueries.totalSenses.execute();
      
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(1);
      if (result[0]) {
        expect(result[0]).toHaveProperty('count');
        expect(typeof result[0].count).toBe('number');
        expect(result[0].count).toBe(2); // We have 2 senses
      }
    });

    it('should return correct ILI count', async () => {
      const statsQueries = getStatisticsQueries(getContext().kyselyDb);
      const result = await statsQueries.totalILIs.execute();
      
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(1);
      if (result[0]) {
        expect(result[0]).toHaveProperty('count');
        expect(typeof result[0].count).toBe('number');
        expect(result[0].count).toBe(2); // We have 2 ILIs (only synsets with ILI)
      }
    });

    it('should return correct lexicon count', async () => {
      const statsQueries = getStatisticsQueries(getContext().kyselyDb);
      const result = await statsQueries.totalLexicons.execute();
      
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(1);
      if (result[0]) {
        expect(result[0]).toHaveProperty('count');
        expect(typeof result[0].count).toBe('number');
        expect(result[0].count).toBe(2); // We have 2 lexicons
      }
    });

    it('should return consistent counts across multiple calls', async () => {
      const statsQueries = getStatisticsQueries(getContext().kyselyDb);
      
      // Call each query multiple times
      const wordCount1 = await statsQueries.totalWords.execute();
      const wordCount2 = await statsQueries.totalWords.execute();
      expect(wordCount1[0]?.count).toBe(wordCount2[0]?.count);
      
      const synsetCount1 = await statsQueries.totalSynsets.execute();
      const synsetCount2 = await statsQueries.totalSynsets.execute();
      expect(synsetCount1[0]?.count).toBe(synsetCount2[0]?.count);
      
      const senseCount1 = await statsQueries.totalSenses.execute();
      const senseCount2 = await statsQueries.totalSenses.execute();
      expect(senseCount1[0]?.count).toBe(senseCount2[0]?.count);
    });
  });

  describe('Real Data Integration', () => {
    it('should work with actual WordNet data structure', async () => {
      // Test that our queries work with the real database schema
      const lexicons = await getContext().mockCore.lexicons();
      expect(Array.isArray(lexicons)).toBe(true);
      expect(lexicons.length).toBe(2);
      
      if (lexicons.length > 0) {
        const lexicon = lexicons[0];
        expect(lexicon).toBeDefined();
        expect(lexicon).toHaveProperty('id');
        expect(lexicon).toHaveProperty('label');
        expect(lexicon).toHaveProperty('language');
      }
    });

    it('should handle database constraints correctly', async () => {
      // Test that foreign key relationships work
      const statsQueries = getStatisticsQueries(getContext().kyselyDb);
      const wordCount = await statsQueries.totalWords.execute();
      
      expect(Array.isArray(wordCount)).toBe(true);
      expect(wordCount.length).toBe(1);
      expect(wordCount[0]?.count).toBeGreaterThan(0);
      // Results should be properly counted
    });

    it('should verify database integrity', async () => {
      // Test that all our test data is properly counted
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
      
      // Test that statistics match actual counts
      const statsQueries = getStatisticsQueries(getContext().kyselyDb);
      
      const wordCount = await statsQueries.totalWords.execute();
      expect(wordCount[0]?.count).toBe(words.length);
      
      const synsetCount = await statsQueries.totalSynsets.execute();
      expect(synsetCount[0]?.count).toBe(synsets.length);
      
      const senseCount = await statsQueries.totalSenses.execute();
      expect(senseCount[0]?.count).toBe(senses.length);
      
      const iliCount = await statsQueries.totalILIs.execute();
      expect(iliCount[0]?.count).toBe(2); // Only synsets with ILI
      
      const lexiconCount = await statsQueries.totalLexicons.execute();
      expect(lexiconCount[0]?.count).toBe(2);
    });

    it('should handle ILI count correctly (only synsets with ILI)', async () => {
      const statsQueries = getStatisticsQueries(getContext().kyselyDb);
      const iliCount = await statsQueries.totalILIs.execute();
      
      expect(Array.isArray(iliCount)).toBe(true);
      expect(iliCount.length).toBe(1);
      expect(iliCount[0]?.count).toBe(2); // Only 2 synsets have ILI (computer and run)
      
      // Verify by checking synsets with ILI
      const synsetsWithIli = await getContext().kyselyDb.selectFrom('synsets')
        .selectAll()
        .where('ili', 'is not', null)
        .execute();
      expect(synsetsWithIli.length).toBe(2);
    });
  });
});
