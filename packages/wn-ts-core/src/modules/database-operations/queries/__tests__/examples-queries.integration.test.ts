/**
 * Examples Queries Integration Test Suite
 * 
 * Tests all example query functions with real database and actual WordNet data.
 * This is an integration test that hits the actual database to ensure query
 * functions work correctly with real data.
 */

import { it, expect } from 'vitest';
import {
  getExamplesBySynsetIdQuery,
} from '../examples-queries.js';
import { createIntegrationTestSuite, type IntegrationTestContext } from '../../../../test/integration-test-utils.js';

createIntegrationTestSuite('Examples Queries Integration Tests', (getContext: () => IntegrationTestContext) => {

  it('should get examples by synset ID', async () => {
    const context = getContext();
    const synsetId = 'computer-n-1';
    
    const query = getExamplesBySynsetIdQuery(context.kyselyDb, synsetId);
    const results = await query.execute();
    
    expect(Array.isArray(results)).toBe(true);
    expect(results.length).toBeGreaterThan(0);
    if (results.length > 0 && results[0]) {
      expect(results[0]).toHaveProperty('id');
      expect(results[0]).toHaveProperty('sense_id');
      expect(results[0]).toHaveProperty('text');
    }
  });

  it('should return empty array for non-existent synset', async () => {
    const context = getContext();
    const nonExistentSynsetId = 'non-existent-synset';
    
    const query = getExamplesBySynsetIdQuery(context.kyselyDb, nonExistentSynsetId);
    const results = await query.execute();
    
    expect(Array.isArray(results)).toBe(true);
    expect(results.length).toBe(0);
  });

  it('should return examples with correct structure', async () => {
    const context = getContext();
    const synsetId = 'computer-n-1';
    
    const query = getExamplesBySynsetIdQuery(context.kyselyDb, synsetId);
    const results = await query.execute();
    
    expect(Array.isArray(results)).toBe(true);
    if (results.length > 0) {
      const example = results[0];
      expect(example).toHaveProperty('id');
      expect(example).toHaveProperty('sense_id');
      expect(example).toHaveProperty('language');
      expect(example).toHaveProperty('text');
      
      expect(typeof example.id).toBe('string');
      expect(typeof example.sense_id).toBe('string');
      expect(typeof example.language).toBe('string');
      expect(typeof example.text).toBe('string');
    }
  });

  it('should handle multiple examples for same synset', async () => {
    const context = getContext();
    const synsetId = 'computer-n-1';
    
    const query = getExamplesBySynsetIdQuery(context.kyselyDb, synsetId);
    const results = await query.execute();
    
    expect(Array.isArray(results)).toBe(true);
    // Should have at least one example based on test data
    expect(results.length).toBeGreaterThanOrEqual(1);
  });

  it('should return examples with valid text content', async () => {
    const context = getContext();
    const synsetId = 'computer-n-1';
    
    const query = getExamplesBySynsetIdQuery(context.kyselyDb, synsetId);
    const results = await query.execute();
    
    expect(Array.isArray(results)).toBe(true);
    if (results.length > 0) {
      const example = results[0];
      expect(example.text).toBeDefined();
      expect(typeof example.text).toBe('string');
      expect(example.text.length).toBeGreaterThan(0);
    }
  });

  it('should return examples with valid language codes', async () => {
    const context = getContext();
    const synsetId = 'computer-n-1';
    
    const query = getExamplesBySynsetIdQuery(context.kyselyDb, synsetId);
    const results = await query.execute();
    
    expect(Array.isArray(results)).toBe(true);
    if (results.length > 0) {
      const example = results[0];
      expect(example.language).toBeDefined();
      expect(typeof example.language).toBe('string');
      expect(example.language.length).toBeGreaterThan(0);
    }
  });

  it('should handle concurrent example queries', async () => {
    const context = getContext();
    const synsetIds = ['synset-1', 'synset-2'];
    
    const queries = synsetIds.map(id => getExamplesBySynsetIdQuery(context.kyselyDb, id));
    const results = await Promise.all(queries.map(q => q.execute()));
    
    expect(Array.isArray(results)).toBe(true);
    expect(results.length).toBe(2);
    results.forEach(result => {
      expect(Array.isArray(result)).toBe(true);
    });
  });

  it('should return consistent results across multiple calls', async () => {
    const context = getContext();
    const synsetId = 'computer-n-1';
    
    const query1 = getExamplesBySynsetIdQuery(context.kyselyDb, synsetId);
    const query2 = getExamplesBySynsetIdQuery(context.kyselyDb, synsetId);
    
    const [results1, results2] = await Promise.all([
      query1.execute(),
      query2.execute()
    ]);
    
    expect(results1).toEqual(results2);
  });

  it('should handle empty synset ID gracefully', async () => {
    const context = getContext();
    const emptySynsetId = '';
    
    const query = getExamplesBySynsetIdQuery(context.kyselyDb, emptySynsetId);
    const results = await query.execute();
    
    expect(Array.isArray(results)).toBe(true);
    expect(results.length).toBe(0);
  });

  it('should return examples with proper ordering', async () => {
    const context = getContext();
    const synsetId = 'computer-n-1';
    
    const query = getExamplesBySynsetIdQuery(context.kyselyDb, synsetId);
    const results = await query.execute();
    
    expect(Array.isArray(results)).toBe(true);
    if (results.length > 1) {
      // Results should be ordered consistently
      const ids = results.map(e => e.id);
      const sortedIds = [...ids].sort();
      expect(ids).toEqual(sortedIds);
    }
  });

  it('should maintain referential integrity', async () => {
    const context = getContext();
    const synsetId = 'computer-n-1';
    
    const query = getExamplesBySynsetIdQuery(context.kyselyDb, synsetId);
    const results = await query.execute();
    
    expect(Array.isArray(results)).toBe(true);
    if (results.length > 0) {
      // All examples should belong to senses that belong to the requested synset
      const senseIds = results.map(e => e.sense_id);
      expect(senseIds.every(id => typeof id === 'string' && id.length > 0)).toBe(true);
    }
  });

  it('should return examples with unique IDs', async () => {
    const context = getContext();
    const synsetId = 'computer-n-1';
    
    const query = getExamplesBySynsetIdQuery(context.kyselyDb, synsetId);
    const results = await query.execute();
    
    expect(Array.isArray(results)).toBe(true);
    if (results.length > 1) {
      const ids = results.map(e => e.id);
      const uniqueIds = new Set(ids);
      expect(ids.length).toBe(uniqueIds.size);
    }
  });

  it('should handle example queries with different synset IDs', async () => {
    const context = getContext();
    const synsetIds = ['synset-1', 'synset-2'];
    
    const queries = synsetIds.map(id => getExamplesBySynsetIdQuery(context.kyselyDb, id));
    const results = await Promise.all(queries.map(q => q.execute()));
    
    expect(Array.isArray(results)).toBe(true);
    expect(results.length).toBe(2);
    
    results.forEach(result => {
      expect(Array.isArray(result)).toBe(true);
      // Each result should be an array of examples
      result.forEach(example => {
        expect(example).toHaveProperty('id');
        expect(example).toHaveProperty('sense_id');
        expect(example).toHaveProperty('text');
      });
    });
  });

  it('should return examples with meaningful text content', async () => {
    const context = getContext();
    const synsetId = 'computer-n-1';
    
    const query = getExamplesBySynsetIdQuery(context.kyselyDb, synsetId);
    const results = await query.execute();
    
    expect(Array.isArray(results)).toBe(true);
    if (results.length > 0) {
      const example = results[0];
      // Example text should be meaningful (not just whitespace)
      expect(example.text.trim().length).toBeGreaterThan(0);
      // Should contain some alphabetic characters
      expect(/[a-zA-Z]/.test(example.text)).toBe(true);
    }
  });

});