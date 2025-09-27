/**
 * Query Strategy Accuracy E2E Tests for wn-ts-web
 * 
 * This file contains tests to verify that all query strategies return
 * identical results, mirroring the structure from wn-ts-node tests
 * but adapted for the browser environment.
 */

import { describe, it, expect, beforeAll, afterAll, vi } from "vitest";
import { createWordNetInstance } from "../../src/factory";
import type { WebWordnet } from "../../src/client/submodules/web-wordnet";
import type { DataLoader } from "../../src/data-management/index.js";

const isNode =
  typeof process !== "undefined" &&
  process.versions != null &&
  process.versions.node != null;

describe.skipIf(isNode)("Query Strategy Accuracy E2E Tests", () => {
  let wordnet: WebWordnet;
  let dataLoader: DataLoader;
  let queryService: any;

  beforeAll(async () => {
    const instance = await createWordNetInstance("oewn:2024");
    wordnet = instance.wordnet;
    dataLoader = instance.dataLoader;

    // Use the actual DataLoader to download and load the full OEWN database
    await dataLoader.downloadAndLoad("oewn:2024");
    
    // Get the query service for strategy-specific tests
    queryService = await wordnet.getQueryService();
  }, 300000); // 5 minute timeout for setup

  afterAll(async () => {
    if (wordnet) {
      await wordnet.close();
    }
  });

  describe('Synset Query Strategy Accuracy', () => {
    it('should return identical results for all synset strategies', async () => {
      console.log('🔍 Testing synset strategy accuracy...');
      
      const testQueries = [
        { form: 'computer' },
        { form: 'run', pos: 'v' },
        { form: 'test', maxResults: 10 }
      ];

      for (const query of testQueries) {
        console.log(`   Testing query: ${JSON.stringify(query)}`);
        
        // Get results from all available strategies
        const results = await Promise.all([
          queryService.getSynsetsV1(query),
          queryService.getSynsetsV2(query),
          queryService.getSynsetsV3(query),
          queryService.getSynsetsV4(query),
          queryService.getSynsetsV5(query),
          queryService.getSynsetsV6(query)
        ]);

        // Normalize results for comparison
        const normalizedResults = results.map(result => 
          result
            .map(synset => ({
              id: synset.id,
              pos: synset.pos,
              language: synset.language,
              lexicon: synset.lexicon,
              memberIds: synset.memberIds?.sort() || [],
              senseIds: synset.senseIds?.sort() || [],
              definitions: synset.definitions?.map(d => d.text).sort() || [],
              examples: synset.examples?.map(e => e.text).sort() || []
            }))
            .sort((a, b) => a.id.localeCompare(b.id))
        );

        // All strategies should return the same number of results
        const resultCounts = normalizedResults.map(r => r.length);
        expect(resultCounts.every(count => count === resultCounts[0])).toBe(true);

        // All strategies should return identical data
        for (let i = 1; i < normalizedResults.length; i++) {
          expect(normalizedResults[i]).toEqual(normalizedResults[0]);
        }
      }

      console.log('✅ All synset strategies return identical results');
    });

    it('should return identical results for synset strategies with includes', async () => {
      console.log('🔍 Testing synset strategy accuracy with includes...');
      
      const query = { 
        form: 'computer', 
        include: ['definitions', 'examples', 'relations'] 
      };

      // Get results from all available strategies
      const results = await Promise.all([
        queryService.getSynsetsV1(query),
        queryService.getSynsetsV2(query),
        queryService.getSynsetsV3(query),
        queryService.getSynsetsV4(query),
        queryService.getSynsetsV5(query),
        queryService.getSynsetsV6(query)
      ]);

      // Normalize results for comparison
      const normalizedResults = results.map(result => 
        result
          .map(synset => ({
            id: synset.id,
            pos: synset.pos,
            language: synset.language,
            lexicon: synset.lexicon,
            memberIds: synset.memberIds?.sort() || [],
            senseIds: synset.senseIds?.sort() || [],
            definitions: synset.definitions?.map(d => d.text).sort() || [],
            examples: synset.examples?.map(e => e.text).sort() || [],
            relations: synset.relations?.map(r => r.type).sort() || []
          }))
          .sort((a, b) => a.id.localeCompare(b.id))
      );

      // All strategies should return the same number of results
      const resultCounts = normalizedResults.map(r => r.length);
      expect(resultCounts.every(count => count === resultCounts[0])).toBe(true);

      // All strategies should return identical data
      for (let i = 1; i < normalizedResults.length; i++) {
        expect(normalizedResults[i]).toEqual(normalizedResults[0]);
      }

      console.log('✅ All synset strategies with includes return identical results');
    });
  });

  describe('Sense Query Strategy Accuracy', () => {
    it('should return identical results for all sense strategies', async () => {
      console.log('🔍 Testing sense strategy accuracy...');
      
      const testQueries = [
        { wordIdOrForm: 'computer' },
        { wordIdOrForm: 'run', pos: 'v' },
        { wordIdOrForm: 'test' }
      ];

      for (const query of testQueries) {
        console.log(`   Testing query: ${JSON.stringify(query)}`);
        
        // Get results from all available strategies
        const results = await Promise.all([
          queryService.getSensesV1(query),
          queryService.getSensesV5(query),
          queryService.getSensesV6(query)
        ]);

        // Normalize results for comparison
        const normalizedResults = results.map(result => 
          result
            .map(sense => ({
              id: sense.id,
              wordId: sense.wordId,
              synsetId: sense.synsetId,
              language: sense.language,
              lexicon: sense.lexicon,
              examples: sense.examples?.map(e => e.text).sort() || [],
              counts: sense.counts || [],
              tags: sense.tags || []
            }))
            .sort((a, b) => a.id.localeCompare(b.id))
        );

        // All strategies should return the same number of results
        const resultCounts = normalizedResults.map(r => r.length);
        expect(resultCounts.every(count => count === resultCounts[0])).toBe(true);

        // All strategies should return identical data
        for (let i = 1; i < normalizedResults.length; i++) {
          expect(normalizedResults[i]).toEqual(normalizedResults[0]);
        }
      }

      console.log('✅ All sense strategies return identical results');
    });
  });

  describe('Data Consistency Validation', () => {
    it('should maintain data consistency across all strategies', async () => {
      console.log('🔍 Testing data consistency across strategies...');
      
      const query = { form: 'computer', maxResults: 5 };
      
      // Get results from different strategies
      const v1Results = await queryService.getSynsetsV1(query);
      const v5Results = await queryService.getSynsetsV5(query);
      const v6Results = await queryService.getSynsetsV6(query);
      
      // All strategies should return the same number of results
      expect(v1Results.length).toBe(v5Results.length);
      expect(v5Results.length).toBe(v6Results.length);
      
      // All strategies should return results with consistent structure
      [v1Results, v5Results, v6Results].forEach(results => {
        results.forEach(synset => {
          expect(synset).toHaveProperty('id');
          expect(synset).toHaveProperty('pos');
          expect(synset).toHaveProperty('language');
          expect(synset).toHaveProperty('lexicon');
          expect(synset).toHaveProperty('memberIds');
          expect(synset).toHaveProperty('senseIds');
          expect(Array.isArray(synset.memberIds)).toBe(true);
          expect(Array.isArray(synset.senseIds)).toBe(true);
        });
      });

      console.log('✅ Data consistency maintained across all strategies');
    });

    it('should have consistent performance characteristics', async () => {
      console.log('🔍 Testing performance characteristics...');
      
      const query = { form: 'computer' };
      
      // Measure performance of different strategies
      const v5Start = performance.now();
      await queryService.getSynsetsV5(query);
      const v5End = performance.now();
      const v5Time = v5End - v5Start;
      
      const v6Start = performance.now();
      await queryService.getSynsetsV6(query);
      const v6End = performance.now();
      const v6Time = v6End - v6Start;
      
      console.log(`📊 Performance Characteristics:`);
      console.log(`   V5: ${v5Time.toFixed(2)}ms`);
      console.log(`   V6: ${v6Time.toFixed(2)}ms`);
      
      // Both strategies should be reasonably fast
      expect(v5Time).toBeLessThan(100);
      expect(v6Time).toBeLessThan(100);
      
      console.log('✅ Performance characteristics are consistent');
    });
  });

  describe('Error Handling Consistency', () => {
    it('should handle errors consistently across strategies', async () => {
      console.log('🔍 Testing error handling consistency...');
      
      const invalidQueries = [
        { form: 'nonexistentword12345' },
        { pos: 'x' as any }, // Invalid POS
        { lexicon: 'nonexistent' }
      ];

      for (const query of invalidQueries) {
        // All strategies should handle invalid queries gracefully
        const results = await Promise.all([
          queryService.getSynsetsV1(query).catch(() => []),
          queryService.getSynsetsV5(query).catch(() => []),
          queryService.getSynsetsV6(query).catch(() => [])
        ]);

        // All strategies should return empty arrays for invalid queries
        results.forEach(result => {
          expect(Array.isArray(result)).toBe(true);
          expect(result.length).toBe(0);
        });
      }

      console.log('✅ Error handling is consistent across strategies');
    });
  });
});
