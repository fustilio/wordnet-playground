/**
 * Batch Queries Integration Test Suite
 * 
 * Tests all batch query functions with real database and actual WordNet data.
 * This is an integration test that hits the actual database to ensure query
 * functions work correctly with real data.
 */

import { it, expect } from 'vitest';
import {
  getBatchDefinitionsQuery,
  getBatchExamplesQuery,
  getBatchRelationsQuery,
  getBatchSensesQuery,
  getSensesBySynsetIdForTransformationQuery,
  getSensesBySynsetIdAllQuery,
} from '../batch-queries.js';
import { createIntegrationTestSuite, type IntegrationTestContext } from '../../../../test/integration-test-utils.js';

createIntegrationTestSuite('Batch Queries Integration Tests', (getContext: () => IntegrationTestContext) => {

  it('should get batch definitions query', async () => {
    const context = getContext();
    const synsetIds = ['computer-n-1', 'run-v-1'];
    
    const query = getBatchDefinitionsQuery(context.kyselyDb, synsetIds);
    const results = await query.execute();
    
    expect(Array.isArray(results)).toBe(true);
    expect(results.length).toBeGreaterThan(0);
    if (results.length > 0 && results[0]) {
      expect(results[0]).toHaveProperty('id');
      expect(results[0]).toHaveProperty('synset_id');
      expect(results[0]).toHaveProperty('text');
    }
  });

  it('should get batch examples query', async () => {
    const context = getContext();
    const senseIds = ['sense-computer-1', 'sense-run-1'];
    
    const query = getBatchExamplesQuery(context.kyselyDb, senseIds);
    const results = await query.execute();
    
    
    expect(Array.isArray(results)).toBe(true);
    expect(results.length).toBeGreaterThan(0);
    if (results.length > 0 && results[0]) {
      expect(results[0]).toHaveProperty('id');
      expect(results[0]).toHaveProperty('sense_id');
      expect(results[0]).toHaveProperty('text');
    }
  });

  it('should get batch relations query', async () => {
    const context = getContext();
    const synsetIds = ['computer-n-1', 'run-v-1'];
    
    const query = getBatchRelationsQuery(context.kyselyDb, synsetIds);
    const results = await query.execute();
    
    expect(Array.isArray(results)).toBe(true);
    expect(results.length).toBeGreaterThan(0);
    if (results.length > 0 && results[0]) {
      expect(results[0]).toHaveProperty('id');
      expect(results[0]).toHaveProperty('source_id');
      expect(results[0]).toHaveProperty('target_id');
      expect(results[0]).toHaveProperty('type');
    }
  });

  it('should get batch senses query', async () => {
    const context = getContext();
    const synsetIds = ['computer-n-1', 'run-v-1'];
    
    const query = getBatchSensesQuery(context.kyselyDb, synsetIds);
    const results = await query.execute();
    
    expect(Array.isArray(results)).toBe(true);
    expect(results.length).toBeGreaterThan(0);
    if (results.length > 0 && results[0]) {
      expect(results[0]).toHaveProperty('id');
      expect(results[0]).toHaveProperty('word_id');
      expect(results[0]).toHaveProperty('synset_id');
    }
  });

  it('should get senses by synset ID for transformation query', async () => {
    const context = getContext();
    const synsetId = 'computer-n-1';
    
    const query = getSensesBySynsetIdForTransformationQuery(context.kyselyDb, synsetId);
    const results = await query.execute();
    
    expect(Array.isArray(results)).toBe(true);
    expect(results.length).toBeGreaterThan(0);
    if (results.length > 0 && results[0]) {
      expect(results[0]).toHaveProperty('id');
      expect(results[0]).toHaveProperty('word_id');
      expect(results[0]).toHaveProperty('synset_id');
    }
  });

  it('should get senses by synset ID all query', async () => {
    const context = getContext();
    const synsetId = 'computer-n-1';
    
    const query = getSensesBySynsetIdAllQuery(context.kyselyDb, synsetId);
    const results = await query.execute();
    
    expect(Array.isArray(results)).toBe(true);
    expect(results.length).toBeGreaterThan(0);
    if (results.length > 0 && results[0]) {
      expect(results[0]).toHaveProperty('id');
      expect(results[0]).toHaveProperty('word_id');
      expect(results[0]).toHaveProperty('synset_id');
    }
  });

  it('should handle empty input arrays', async () => {
    const context = getContext();
    
    const definitionsQuery = getBatchDefinitionsQuery(context.kyselyDb, []);
    const definitionsResults = await definitionsQuery.execute();
    expect(definitionsResults).toEqual([]);
    
    const examplesQuery = getBatchExamplesQuery(context.kyselyDb, []);
    const examplesResults = await examplesQuery.execute();
    expect(examplesResults).toEqual([]);
    
    const relationsQuery = getBatchRelationsQuery(context.kyselyDb, []);
    const relationsResults = await relationsQuery.execute();
    expect(relationsResults).toEqual([]);
    
    const sensesQuery = getBatchSensesQuery(context.kyselyDb, []);
    const sensesResults = await sensesQuery.execute();
    expect(sensesResults).toEqual([]);
  });

  it('should handle non-existent IDs gracefully', async () => {
    const context = getContext();
    const nonExistentIds = ['non-existent-1', 'non-existent-2'];
    
    const definitionsQuery = getBatchDefinitionsQuery(context.kyselyDb, nonExistentIds);
    const definitionsResults = await definitionsQuery.execute();
    expect(definitionsResults).toEqual([]);
    
    const examplesQuery = getBatchExamplesQuery(context.kyselyDb, nonExistentIds);
    const examplesResults = await examplesQuery.execute();
    expect(examplesResults).toEqual([]);
    
    const relationsQuery = getBatchRelationsQuery(context.kyselyDb, nonExistentIds);
    const relationsResults = await relationsQuery.execute();
    expect(relationsResults).toEqual([]);
    
    const sensesQuery = getBatchSensesQuery(context.kyselyDb, nonExistentIds);
    const sensesResults = await sensesQuery.execute();
    expect(sensesResults).toEqual([]);
  });

  it('should return correct data structure for batch definitions', async () => {
    const context = getContext();
    const synsetIds = ['synset-1'];
    
    const query = getBatchDefinitionsQuery(context.kyselyDb, synsetIds);
    const results = await query.execute();
    
    expect(Array.isArray(results)).toBe(true);
    if (results.length > 0) {
      const definition = results[0];
      expect(definition).toHaveProperty('id');
      expect(definition).toHaveProperty('synset_id');
      expect(definition).toHaveProperty('language');
      expect(definition).toHaveProperty('text');
      expect(definition).toHaveProperty('source');
    }
  });

  it('should return correct data structure for batch examples', async () => {
    const context = getContext();
    const senseIds = ['sense-1'];
    
    const query = getBatchExamplesQuery(context.kyselyDb, senseIds);
    const results = await query.execute();
    
    expect(Array.isArray(results)).toBe(true);
    if (results.length > 0) {
      const example = results[0];
      expect(example).toHaveProperty('id');
      expect(example).toHaveProperty('sense_id');
      expect(example).toHaveProperty('language');
      expect(example).toHaveProperty('text');
    }
  });

  it('should return correct data structure for batch relations', async () => {
    const context = getContext();
    const synsetIds = ['synset-1'];
    
    const query = getBatchRelationsQuery(context.kyselyDb, synsetIds);
    const results = await query.execute();
    
    expect(Array.isArray(results)).toBe(true);
    if (results.length > 0) {
      const relation = results[0];
      expect(relation).toHaveProperty('id');
      expect(relation).toHaveProperty('source_id');
      expect(relation).toHaveProperty('target_id');
      expect(relation).toHaveProperty('type');
      expect(relation).toHaveProperty('metadata');
    }
  });

  it('should return correct data structure for batch senses', async () => {
    const context = getContext();
    const wordIds = ['word-1'];
    
    const query = getBatchSensesQuery(context.kyselyDb, wordIds);
    const results = await query.execute();
    
    expect(Array.isArray(results)).toBe(true);
    if (results.length > 0) {
      const sense = results[0];
      expect(sense).toHaveProperty('id');
      expect(sense).toHaveProperty('word_id');
      expect(sense).toHaveProperty('synset_id');
      expect(sense).toHaveProperty('source');
      expect(sense).toHaveProperty('sensekey');
    }
  });

  it('should handle large batch sizes efficiently', async () => {
    const context = getContext();
    const largeBatch = Array.from({ length: 100 }, (_, i) => `word-${i}`);
    
    const startTime = Date.now();
    const query = getBatchSensesQuery(context.kyselyDb, largeBatch);
    const results = await query.execute();
    const endTime = Date.now();
    
    expect(Array.isArray(results)).toBe(true);
    expect(endTime - startTime).toBeLessThan(1000); // Should complete within 1 second
  });

  it('should maintain data integrity across batch operations', async () => {
    const context = getContext();
    const synsetIds = ['computer-n-1', 'run-v-1'];
    
    // Get definitions and relations for the same synsets
    const definitionsQuery = getBatchDefinitionsQuery(context.kyselyDb, synsetIds);
    const relationsQuery = getBatchRelationsQuery(context.kyselyDb, synsetIds);
    
    const [definitions, relations] = await Promise.all([
      definitionsQuery.execute(),
      relationsQuery.execute()
    ]);
    
    // Verify that we get consistent data
    expect(Array.isArray(definitions)).toBe(true);
    expect(Array.isArray(relations)).toBe(true);
    
    // Check that definitions belong to the requested synsets
    const definitionSynsetIds = definitions.map(d => d.synset_id);
    expect(definitionSynsetIds.every(id => synsetIds.includes(id))).toBe(true);
    
    // Check that relations belong to the requested synsets
    const relationSourceIds = relations.map(r => r.source_id);
    expect(relationSourceIds.every(id => synsetIds.includes(id))).toBe(true);
  });

});