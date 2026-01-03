import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { setupTestEnvironment } from '../shared/test-setup.js';
import { logger } from 'wn-ts-core/utils';
import type { Wordnet } from '../../../src/wordnet.js';

describe('Definition Queries', () => {
  let wordnetClient: Wordnet;
  let cleanup: () => Promise<void>;

  beforeAll(async () => {
    const context = await setupTestEnvironment('definitions', ['oewn:2024']);
    wordnetClient = context.wordnetClient;
    cleanup = context.cleanup;
  }, 600000); // 10 minute timeout for setup

  afterAll(async () => {
    await cleanup();
  });

  describe('Basic Definition Retrieval', () => {
    it('should return definitions for a valid synset', async () => {
      logger.info('🔍 Testing getDefinitions with valid synset...');
      
      // Find a synset that we know has definitions
      const synsets = await wordnetClient.synsets({ form: 'information' });
      expect(synsets.length).toBeGreaterThan(0);
      
      const synset = synsets[0];
      expect(synset).toBeDefined();
      expect(synset?.id).toBeDefined();
      
      // Get definitions for this synset
      const definitions = await wordnetClient.getDefinitions(synset!.id);
      
      expect(Array.isArray(definitions)).toBe(true);
      expect(definitions.length).toBeGreaterThan(0);
      
      // Verify that definitions are strings
      definitions.forEach((definition: any) => {
        expect(typeof definition.text).toBe('string');
        expect(definition.text.length).toBeGreaterThan(0);
      });
      
      logger.success(`Found ${definitions.length} definitions for synset ${synset!.id}`);
    });

    it('should return empty array for synset with no definitions', async () => {
      logger.info('🔍 Testing getDefinitions with non-existent synset...');
      
      const definitions = await wordnetClient.getDefinitions('s-nonexistent-123');
      
      expect(Array.isArray(definitions)).toBe(true);
      expect(definitions.length).toBe(0);
      
      logger.success('Empty array returned for non-existent synset');
    });

    it('should return definitions for different parts of speech', async () => {
      logger.info('🔍 Testing getDefinitions across different parts of speech...');
      
      // Test with noun
      const nounSynsets = await wordnetClient.synsets({ form: 'computer', pos: 'n' });
      if (nounSynsets.length > 0) {
        const nounDefinitions = await wordnetClient.getDefinitions(nounSynsets[0]!.id);
        expect(Array.isArray(nounDefinitions)).toBe(true);
        logger.success(`Found ${nounDefinitions.length} definitions for noun synset`);
      }
      
      // Test with verb
      const verbSynsets = await wordnetClient.synsets({ form: 'run', pos: 'v' });
      if (verbSynsets.length > 0) {
        const verbDefinitions = await wordnetClient.getDefinitions(verbSynsets[0]!.id);
        expect(Array.isArray(verbDefinitions)).toBe(true);
        logger.success(`Found ${verbDefinitions.length} definitions for verb synset`);
      }
      
      // Test with adjective
      const adjSynsets = await wordnetClient.synsets({ form: 'happy', pos: 'a' });
      if (adjSynsets.length > 0) {
        const adjDefinitions = await wordnetClient.getDefinitions(adjSynsets[0]!.id);
        expect(Array.isArray(adjDefinitions)).toBe(true);
        logger.success(`Found ${adjDefinitions.length} definitions for adjective synset`);
      }
    });
  });

  describe('Definition Content Quality', () => {
    it('should return meaningful definitions', async () => {
      logger.info('🔍 Testing definition content quality...');
      
      const synsets = await wordnetClient.synsets({ form: 'dog' });
      expect(synsets.length).toBeGreaterThan(0);
      
      const definitions = await wordnetClient.getDefinitions(synsets[0]!.id);
      expect(definitions.length).toBeGreaterThan(0);
      
      // Check that definitions contain meaningful content
      const definitionText = definitions.join(' ').toLowerCase();
      expect(definitionText).toMatch(/animal|mammal|canine|pet/);
      
      logger.success('Definitions contain meaningful content');
    });

    it('should handle multiple definitions for a synset', async () => {
      logger.info('🔍 Testing multiple definitions per synset...');
      
      const synsets = await wordnetClient.synsets({ form: 'bank' });
      expect(synsets.length).toBeGreaterThan(0);
      
      // Find a synset with multiple definitions
      let synsetWithMultipleDefs = null;
      for (const synset of synsets) {
        const definitions = await wordnetClient.getDefinitions(synset.id);
        if (definitions.length > 1) {
          synsetWithMultipleDefs = { synset, definitions };
          break;
        }
      }
      
      if (synsetWithMultipleDefs) {
        expect(synsetWithMultipleDefs.definitions.length).toBeGreaterThan(1);
        logger.success(`Found synset with ${synsetWithMultipleDefs.definitions.length} definitions`);
      } else {
        logger.info('No synset found with multiple definitions in test data');
      }
    });
  });

  describe('Definition Access Methods', () => {
    it('should access definitions through synset object', async () => {
      logger.info('🔍 Testing definition access through synset object...');
      
      const synsets = await wordnetClient.synsets({ form: 'water' });
      expect(synsets.length).toBeGreaterThan(0);
      
      const synset = synsets[0];
      if (synset) {
        expect(synset.definitions).toBeDefined();
        expect(Array.isArray(synset.definitions)).toBe(true);
        
        if (synset.definitions && synset.definitions.length > 0) {
          expect(synset.definitions[0]).toHaveProperty('text');
          expect(synset.definitions[0]).toHaveProperty('language');
          
          logger.success(`Synset object contains ${synset.definitions.length} definitions`);
        }
      }
    });

    it('should access definitions through query service', async () => {
      logger.info('🔍 Testing definition access through query service...');
      
      const synsets = await wordnetClient.synsets({ form: 'house' });
      if (synsets.length > 0) {
        const synset = synsets[0];
        if (synset) {
          const queryService = await wordnetClient.getQueryService();
          const definitions = await queryService.getDefinitionsBySynsetId(synset.id);
          
          expect(Array.isArray(definitions)).toBe(true);
          
          if (definitions.length > 0) {
            expect(definitions[0]).toHaveProperty('id');
            expect(definitions[0]).toHaveProperty('text');
            expect(definitions[0]).toHaveProperty('synset_id');
            expect(definitions[0]).toHaveProperty('language');
            
            logger.success(`Query service returned ${definitions.length} definitions`);
          }
        }
      }
    });
  });

  describe('Error Handling', () => {
    it('should handle invalid synset ID gracefully', async () => {
      logger.info('❌ Testing invalid synset ID handling...');
      
      const definitions = await wordnetClient.getDefinitions('invalid-synset-id');
      expect(Array.isArray(definitions)).toBe(true);
      expect(definitions.length).toBe(0);
      
      logger.success('Invalid synset ID handled gracefully');
    });

    it('should handle empty string synset ID', async () => {
      logger.info('❌ Testing empty string synset ID handling...');
      
      const definitions = await wordnetClient.getDefinitions('');
      expect(Array.isArray(definitions)).toBe(true);
      expect(definitions.length).toBe(0);
      
      logger.success('Empty string synset ID handled gracefully');
    });

    it('should handle null/undefined synset ID', async () => {
      logger.info('❌ Testing null/undefined synset ID handling...');
      
      // @ts-ignore - intentionally testing with null
      const definitions = await wordnetClient.getDefinitions(null);
      expect(Array.isArray(definitions)).toBe(true);
      expect(definitions.length).toBe(0);
      
      // @ts-ignore - intentionally testing with undefined
      const definitions2 = await wordnetClient.getDefinitions(undefined);
      expect(Array.isArray(definitions2)).toBe(true);
      expect(definitions2.length).toBe(0);
      
      logger.success('Null/undefined synset ID handled gracefully');
    });
  });

  describe('Performance', () => {
    it('should handle concurrent definition queries', async () => {
      logger.info('⚡ Testing concurrent definition queries...');
      
      const synsets = await wordnetClient.synsets({ form: 'test' });
      expect(synsets.length).toBeGreaterThan(0);
      
      // Test concurrent queries for the same synset
      const queries = Array(5).fill(null).map(() => 
        wordnetClient.getDefinitions(synsets[0]!.id)
      );
      
      const results = await Promise.all(queries);
      expect(results).toHaveLength(5);
      
      // All results should be identical
      results.forEach((result: any) => {
        expect(Array.isArray(result)).toBe(true);
        expect(result).toEqual(results[0]);
      });
      
      logger.success('Concurrent definition queries completed successfully');
    });

    it('should handle queries for multiple different synsets', async () => {
      logger.info('⚡ Testing multiple different synset queries...');
      
      const synsets = await wordnetClient.synsets({ form: 'information' });
      expect(synsets.length).toBeGreaterThan(0);
      
      // Get definitions for multiple synsets
      const definitionPromises = synsets.slice(0, 3).map((synset: any) => 
        wordnetClient.getDefinitions(synset.id)
      );
      
      const allDefinitions = await Promise.all(definitionPromises);
      expect(allDefinitions).toHaveLength(3);
      
      allDefinitions.forEach((definitions: any) => {
        expect(Array.isArray(definitions)).toBe(true);
      });
      
      logger.success('Multiple synset definition queries completed successfully');
    });
  });
});
