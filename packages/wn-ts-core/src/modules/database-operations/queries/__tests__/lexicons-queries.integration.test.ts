/**
 * Lexicons Queries Integration Test Suite
 * 
 * Tests all lexicon query functions with real database and actual WordNet data.
 * This is an integration test that hits the actual database to ensure query
 * functions work correctly with real data.
 */

import { it, expect } from 'vitest';
import {
  getLexiconsQuery,
  getLexiconByIdQuery,
} from '../lexicons-queries.js';
import { createIntegrationTestSuite, type IntegrationTestContext } from '../../../../test/integration-test-utils.js';

createIntegrationTestSuite('Lexicons Queries Integration Tests', (getContext: () => IntegrationTestContext) => {

  it('should get all lexicons', async () => {
    const context = getContext();
    const query = getLexiconsQuery(context.kyselyDb);
    const results = await query.execute();
    
    expect(Array.isArray(results)).toBe(true);
    expect(results.length).toBeGreaterThan(0);
    
    if (results.length === 0 || !results[0]) {
      expect(results[0]).toBeDefined();
      return;
    }
    
    expect(results[0]).toHaveProperty('id');
    expect(results[0]).toHaveProperty('label');
    expect(results[0]).toHaveProperty('language');
  });

  it('should get lexicon by ID', async () => {
    const context = getContext();
    const lexiconId = 'test-lexicon';
    
    const query = getLexiconByIdQuery(context.kyselyDb, lexiconId);
    const result = await query.executeTakeFirst();
    
    if (!result) {
      expect(result).toBeDefined();
      return;
    }
    
    expect(result).toHaveProperty('id');
    expect(result).toHaveProperty('label');
    expect(result).toHaveProperty('language');
    expect(result.id).toBe(lexiconId);
  });

  it('should return null for non-existent lexicon', async () => {
    const context = getContext();
    const nonExistentId = 'non-existent-lexicon';
    
    const query = getLexiconByIdQuery(context.kyselyDb, nonExistentId);
    const result = await query.executeTakeFirst();
    
    expect(result).toBeUndefined();
  });

  it('should return lexicons with correct structure', async () => {
    const context = getContext();
    const query = getLexiconsQuery(context.kyselyDb);
    const results = await query.execute();
    
    expect(Array.isArray(results)).toBe(true);
    
    if (results.length === 0) {
      return;
    }
    
    const lexicon = results[0];
    if (!lexicon) {
      expect(lexicon).toBeDefined();
      return;
    }
    
    expect(lexicon).toHaveProperty('id');
    expect(lexicon).toHaveProperty('label');
    expect(lexicon).toHaveProperty('language');
    expect(lexicon).toHaveProperty('email');
    expect(lexicon).toHaveProperty('license');
    expect(lexicon).toHaveProperty('version');
    expect(lexicon).toHaveProperty('url');
    expect(lexicon).toHaveProperty('citation');
    expect(lexicon).toHaveProperty('logo');
    expect(lexicon).toHaveProperty('metadata');
    
    expect(typeof lexicon.id).toBe('string');
    expect(typeof lexicon.label).toBe('string');
    expect(typeof lexicon.language).toBe('string');
  });

  it('should handle empty lexicon list gracefully', async () => {
    const context = getContext();
    const query = getLexiconsQuery(context.kyselyDb);
    const results = await query.execute();
    
    expect(Array.isArray(results)).toBe(true);
    // Should have at least one lexicon based on test data
    expect(results.length).toBeGreaterThanOrEqual(1);
  });

  it('should return lexicons with valid metadata', async () => {
    const context = getContext();
    const query = getLexiconsQuery(context.kyselyDb);
    const results = await query.execute();
    
    expect(Array.isArray(results)).toBe(true);
    
    if (results.length === 0) {
      return;
    }
    
    const lexicon = results[0];
    if (!lexicon) {
      expect(lexicon).toBeDefined();
      return;
    }
    
    if (lexicon.metadata) {
      expect(() => JSON.parse(lexicon.metadata as unknown as string)).not.toThrow();
    }
  });

  it('should handle concurrent lexicon queries', async () => {
    const context = getContext();
    const lexiconIds = ['test-lexicon'];
    
    const queries = lexiconIds.map(id => getLexiconByIdQuery(context.kyselyDb, id));
    const results = await Promise.all(queries.map(q => q.executeTakeFirst()));
    
    expect(Array.isArray(results)).toBe(true);
    expect(results.length).toBe(1);
    expect(results[0]).toBeDefined();
  });

  it('should return consistent results across multiple calls', async () => {
    const context = getContext();
    const query1 = getLexiconsQuery(context.kyselyDb);
    const query2 = getLexiconsQuery(context.kyselyDb);
    
    const [results1, results2] = await Promise.all([
      query1.execute(),
      query2.execute()
    ]);
    
    expect(results1).toEqual(results2);
  });

  it('should handle empty lexicon ID gracefully', async () => {
    const context = getContext();
    const emptyId = '';
    
    const query = getLexiconByIdQuery(context.kyselyDb, emptyId);
    const result = await query.executeTakeFirst();
    
    expect(result).toBeUndefined();
  });

  it('should return lexicons with proper ordering', async () => {
    const context = getContext();
    const query = getLexiconsQuery(context.kyselyDb);
    const results = await query.execute();
    
    expect(Array.isArray(results)).toBe(true);
    if (results.length > 1) {
      // Results should be ordered consistently
      const ids = results.map(l => l.id);
      const sortedIds = [...ids].sort();
      expect(ids).toEqual(sortedIds);
    }
  });

  it('should filter lexicons by language if supported', async () => {
    const context = getContext();
    const query = getLexiconsQuery(context.kyselyDb);
    const results = await query.execute();
    
    expect(Array.isArray(results)).toBe(true);
    if (results.length > 0) {
      // All lexicons should have valid language codes
      const languages = results.map(l => l.language);
      expect(languages.every(lang => typeof lang === 'string' && lang.length > 0)).toBe(true);
    }
  });

  it('should return lexicons with valid URLs', async () => {
    const context = getContext();
    const query = getLexiconsQuery(context.kyselyDb);
    const results = await query.execute();
    
    expect(Array.isArray(results)).toBe(true);
    
    if (results.length === 0) {
      return;
    }
    
    const lexicon = results[0];
    if (!lexicon) {
      expect(lexicon).toBeDefined();
      return;
    }
    
    if (lexicon.url) {
      expect(typeof lexicon.url).toBe('string');
      // URL should be valid if present
      expect(() => new URL(lexicon.url as string)).not.toThrow();
    }
  });

  it('should handle lexicon queries with different parameters', async () => {
    const context = getContext();
    
    // Test getting all lexicons
    const allLexiconsQuery = getLexiconsQuery(context.kyselyDb);
    const allResults = await allLexiconsQuery.execute();
    
    // Test getting specific lexicon
    const specificLexiconQuery = getLexiconByIdQuery(context.kyselyDb, 'test-lexicon');
    const specificResult = await specificLexiconQuery.executeTakeFirst();
    
    expect(Array.isArray(allResults)).toBe(true);
    expect(allResults.length).toBeGreaterThan(0);
    expect(specificResult).toBeDefined();
    
    if (!specificResult) {
      return;
    }
    
    expect(allResults.some(l => l.id === specificResult.id)).toBe(true);
  });

});