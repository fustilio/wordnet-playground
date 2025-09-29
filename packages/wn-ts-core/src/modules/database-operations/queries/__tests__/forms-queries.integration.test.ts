/**
 * Forms Queries Integration Test Suite
 * 
 * Tests all form query functions with real database and actual WordNet data.
 * This is an integration test that hits the actual database to ensure query
 * functions work correctly with real data.
 */

import { it, expect } from 'vitest';
import {
  getFormsByWordIdQuery,
} from '../forms-queries.js';
import { createIntegrationTestSuite, type IntegrationTestContext } from '../../../../test/integration-test-utils.js';

createIntegrationTestSuite('Forms Queries Integration Tests', (getContext: () => IntegrationTestContext) => {

  it('should get forms by word ID', async () => {
    const context = getContext();
    const wordId = 'computer-n-1';
    
    const query = getFormsByWordIdQuery(context.kyselyDb, wordId);
    const results = await query.execute();
    
    expect(Array.isArray(results)).toBe(true);
    expect(results.length).toBeGreaterThan(0);
    if (results.length > 0 && results[0]) {
      expect(results[0]).toHaveProperty('id');
      expect(results[0]).toHaveProperty('word_id');
      expect(results[0]).toHaveProperty('written_form');
    }
  });

  it('should return empty array for non-existent word', async () => {
    const context = getContext();
    const nonExistentWordId = 'non-existent-word';
    
    const query = getFormsByWordIdQuery(context.kyselyDb, nonExistentWordId);
    const results = await query.execute();
    
    expect(Array.isArray(results)).toBe(true);
    expect(results.length).toBe(0);
  });

  it('should return forms with correct structure', async () => {
    const context = getContext();
    const wordId = 'computer-n-1';
    
    const query = getFormsByWordIdQuery(context.kyselyDb, wordId);
    const results = await query.execute();
    
    expect(Array.isArray(results)).toBe(true);
    if (results.length > 0) {
      const form = results[0];
      expect(form).toHaveProperty('id');
      expect(form).toHaveProperty('word_id');
      expect(form).toHaveProperty('written_form');
      expect(form).toHaveProperty('script');
      expect(form).toHaveProperty('tag');
      
      if (form) {
        expect(typeof form.id).toBe('string');
        expect(typeof form.word_id).toBe('string');
        expect(typeof form.written_form).toBe('string');
        expect(form.word_id).toBe(wordId);
      }
    }
  });

  it('should handle multiple forms for same word', async () => {
    const context = getContext();
    const wordId = 'computer-n-1';
    
    const query = getFormsByWordIdQuery(context.kyselyDb, wordId);
    const results = await query.execute();
    
    expect(Array.isArray(results)).toBe(true);
    // Should have at least one form based on test data
    expect(results.length).toBeGreaterThanOrEqual(1);
  });

  it('should return forms with valid written forms', async () => {
    const context = getContext();
    const wordId = 'computer-n-1';
    
    const query = getFormsByWordIdQuery(context.kyselyDb, wordId);
    const results = await query.execute();
    
    expect(Array.isArray(results)).toBe(true);
    if (results.length > 0) {
      const form = results[0];
      if (form) {
        expect(form.written_form).toBeDefined();
        expect(typeof form.written_form).toBe('string');
        expect(form.written_form.length).toBeGreaterThan(0);
      }
    }
  });

  it('should handle forms with null script and tag', async () => {
    const context = getContext();
    const wordId = 'computer-n-1';
    
    const query = getFormsByWordIdQuery(context.kyselyDb, wordId);
    const results = await query.execute();
    
    expect(Array.isArray(results)).toBe(true);
    if (results.length > 0) {
      const form = results[0];
      if (form) {
        // Script and tag can be null
        expect(form.script === null || typeof form.script === 'string').toBe(true);
        expect(form.tag === null || typeof form.tag === 'string').toBe(true);
      }
    }
  });

  it('should handle concurrent form queries', async () => {
    const context = getContext();
    const wordIds = ['word-1', 'word-2'];
    
    const queries = wordIds.map(id => getFormsByWordIdQuery(context.kyselyDb, id));
    const results = await Promise.all(queries.map(q => q.execute()));
    
    expect(Array.isArray(results)).toBe(true);
    expect(results.length).toBe(2);
    results.forEach(result => {
      expect(Array.isArray(result)).toBe(true);
    });
  });

  it('should return consistent results across multiple calls', async () => {
    const context = getContext();
    const wordId = 'computer-n-1';
    
    const query1 = getFormsByWordIdQuery(context.kyselyDb, wordId);
    const query2 = getFormsByWordIdQuery(context.kyselyDb, wordId);
    
    const [results1, results2] = await Promise.all([
      query1.execute(),
      query2.execute()
    ]);
    
    expect(results1).toEqual(results2);
  });

  it('should handle empty word ID gracefully', async () => {
    const context = getContext();
    const emptyWordId = '';
    
    const query = getFormsByWordIdQuery(context.kyselyDb, emptyWordId);
    const results = await query.execute();
    
    expect(Array.isArray(results)).toBe(true);
    expect(results.length).toBe(0);
  });

  it('should return forms with proper ordering', async () => {
    const context = getContext();
    const wordId = 'computer-n-1';
    
    const query = getFormsByWordIdQuery(context.kyselyDb, wordId);
    const results = await query.execute();
    
    expect(Array.isArray(results)).toBe(true);
    if (results.length > 1) {
      // Results should be ordered consistently
      const ids = results.map(f => f.id);
      const sortedIds = [...ids].sort();
      expect(ids).toEqual(sortedIds);
    }
  });

  it('should maintain referential integrity', async () => {
    const context = getContext();
    const wordId = 'computer-n-1';
    
    const query = getFormsByWordIdQuery(context.kyselyDb, wordId);
    const results = await query.execute();
    
    expect(Array.isArray(results)).toBe(true);
    if (results.length > 0) {
      // All forms should belong to the requested word
      const wordIds = results.map(f => f.word_id);
      expect(wordIds.every(id => id === wordId)).toBe(true);
    }
  });

  it('should handle forms with different scripts and tags', async () => {
    const context = getContext();
    const wordId = 'computer-n-1';
    
    const query = getFormsByWordIdQuery(context.kyselyDb, wordId);
    const results = await query.execute();
    
    expect(Array.isArray(results)).toBe(true);
    if (results.length > 0) {
      const form = results[0];
      if (form) {
        // Script and tag should be valid if present
        if (form.script) {
          expect(typeof form.script).toBe('string');
        }
        if (form.tag) {
          expect(typeof form.tag).toBe('string');
        }
      }
    }
  });

  it('should return forms with unique IDs', async () => {
    const context = getContext();
    const wordId = 'computer-n-1';
    
    const query = getFormsByWordIdQuery(context.kyselyDb, wordId);
    const results = await query.execute();
    
    expect(Array.isArray(results)).toBe(true);
    if (results.length > 1) {
      const ids = results.map(f => f.id);
      const uniqueIds = new Set(ids);
      expect(ids.length).toBe(uniqueIds.size);
    }
  });

  it('should handle form queries with different word IDs', async () => {
    const context = getContext();
    const wordIds = ['word-1', 'word-2', 'word-3'];
    
    const queries = wordIds.map(id => getFormsByWordIdQuery(context.kyselyDb, id));
    const results = await Promise.all(queries.map(q => q.execute()));
    
    expect(Array.isArray(results)).toBe(true);
    expect(results.length).toBe(3);
    
    results.forEach((result, index) => {
      expect(Array.isArray(result)).toBe(true);
      if (result.length > 0) {
        // Each form should belong to the correct word
        const wordId = wordIds[index];
        result.forEach(form => {
          expect(form.word_id).toBe(wordId);
        });
      }
    });
  });

});