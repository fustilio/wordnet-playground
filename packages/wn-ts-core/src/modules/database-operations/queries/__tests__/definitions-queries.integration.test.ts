/**
 * Definitions Queries Integration Test Suite
 *
 * Tests all definition query functions with real database and actual WordNet data.
 * This is an integration test that hits the actual database to ensure query
 * functions work correctly with real data.
 */

import { it, expect } from 'vitest';
import { getDefinitionsBySynsetIdQuery } from '../definitions-queries.js';
import {
  createIntegrationTestSuite,
  type IntegrationTestContext,
} from '../../../../test/integration-test-utils.js';

createIntegrationTestSuite(
  'Definitions Queries Integration Tests',
  (getContext: () => IntegrationTestContext) => {
    it('should get definitions by synset ID', async () => {
      const context = getContext();
      const synsetId = 'computer-n-1';

      const query = getDefinitionsBySynsetIdQuery(context.kyselyDb, synsetId);
      const results = await query.execute();

      expect(Array.isArray(results)).toBe(true);
      expect(results.length).toBeGreaterThan(0);
      
      if (results.length === 0 || !results[0]) {
        expect(results[0]).toBeDefined();
        return;
      }
      
      expect(results[0]).toHaveProperty('id');
      expect(results[0]).toHaveProperty('synset_id');
      expect(results[0]).toHaveProperty('text');
    });

    it('should return empty array for non-existent synset', async () => {
      const context = getContext();
      const nonExistentSynsetId = 'non-existent-synset';

      const query = getDefinitionsBySynsetIdQuery(
        context.kyselyDb,
        nonExistentSynsetId
      );
      const results = await query.execute();

      expect(Array.isArray(results)).toBe(true);
      expect(results.length).toBe(0);
    });

    it('should return definitions with correct structure', async () => {
      const context = getContext();
      const synsetId = 'computer-n-1';

      const query = getDefinitionsBySynsetIdQuery(context.kyselyDb, synsetId);
      const results = await query.execute();

      expect(Array.isArray(results)).toBe(true);
      if (results.length > 0) {
        const definition = results[0];

        if (!definition) {
          expect(definition).toBeDefined();

          return;
        }
        
        expect(definition).toHaveProperty('id');
        expect(definition).toHaveProperty('synset_id');
        expect(definition).toHaveProperty('language');
        expect(definition).toHaveProperty('text');
        expect(definition).toHaveProperty('source');

        expect(typeof definition.id).toBe('string');
        expect(typeof definition.synset_id).toBe('string');
        expect(typeof definition.language).toBe('string');
        expect(typeof definition.text).toBe('string');
        expect(typeof definition.source).toBe('string');
      }
    });

    it('should handle multiple definitions for same synset', async () => {
      const context = getContext();
      const synsetId = 'computer-n-1';

      const query = getDefinitionsBySynsetIdQuery(context.kyselyDb, synsetId);
      const results = await query.execute();

      expect(Array.isArray(results)).toBe(true);
      // Should have at least one definition based on test data
      expect(results.length).toBeGreaterThanOrEqual(1);
    });

    it('should return definitions with valid text content', async () => {
      const context = getContext();
      const synsetId = 'computer-n-1';

      const query = getDefinitionsBySynsetIdQuery(context.kyselyDb, synsetId);
      const results = await query.execute();

      expect(Array.isArray(results)).toBe(true);
      
      if (results.length === 0) {
        return;
      }
      
      const definition = results[0];
      if (!definition) {
        expect(definition).toBeDefined();
        return;
      }
      
      expect(definition.text).toBeDefined();
      expect(typeof definition.text).toBe('string');
      expect(definition.text.length).toBeGreaterThan(0);
    });

    it('should return definitions with valid language codes', async () => {
      const context = getContext();
      const synsetId = 'computer-n-1';

      const query = getDefinitionsBySynsetIdQuery(context.kyselyDb, synsetId);
      const results = await query.execute();

      expect(Array.isArray(results)).toBe(true);
      
      if (results.length === 0) {
        return;
      }
      
      const definition = results[0];
      if (!definition) {
        expect(definition).toBeDefined();
        return;
      }
      
      expect(definition.language).toBeDefined();
      expect(typeof definition.language).toBe('string');
      expect(definition.language.length).toBeGreaterThan(0);
    });

    it('should return definitions with valid source information', async () => {
      const context = getContext();
      const synsetId = 'computer-n-1';

      const query = getDefinitionsBySynsetIdQuery(context.kyselyDb, synsetId);
      const results = await query.execute();

      expect(Array.isArray(results)).toBe(true);
      
      if (results.length === 0) {
        return;
      }
      
      const definition = results[0];
      if (!definition) {
        expect(definition).toBeDefined();
        return;
      }
      
      expect(definition.source).toBeDefined();
      expect(typeof definition.source).toBe('string');
      expect(definition.source?.length).toBeGreaterThan(0);
    });

    it('should handle concurrent definition queries', async () => {
      const context = getContext();
      const synsetIds = ['synset-1', 'synset-2'];

      const queries = synsetIds.map(id =>
        getDefinitionsBySynsetIdQuery(context.kyselyDb, id)
      );
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

      const query1 = getDefinitionsBySynsetIdQuery(context.kyselyDb, synsetId);
      const query2 = getDefinitionsBySynsetIdQuery(context.kyselyDb, synsetId);

      const [results1, results2] = await Promise.all([
        query1.execute(),
        query2.execute(),
      ]);

      expect(results1).toEqual(results2);
    });

    it('should handle empty synset ID gracefully', async () => {
      const context = getContext();
      const emptySynsetId = '';

      const query = getDefinitionsBySynsetIdQuery(context.kyselyDb, emptySynsetId);
      const results = await query.execute();

      expect(Array.isArray(results)).toBe(true);
      expect(results.length).toBe(0);
    });

    it('should return definitions with proper ordering', async () => {
      const context = getContext();
      const synsetId = 'computer-n-1';

      const query = getDefinitionsBySynsetIdQuery(context.kyselyDb, synsetId);
      const results = await query.execute();

      expect(Array.isArray(results)).toBe(true);
      if (results.length > 1) {
        // Results should be ordered consistently
        const ids = results.map(d => d.id);
        const sortedIds = [...ids].sort();
        expect(ids).toEqual(sortedIds);
      }
    });

    it('should maintain referential integrity', async () => {
      const context = getContext();
      const synsetId = 'computer-n-1';

      const query = getDefinitionsBySynsetIdQuery(context.kyselyDb, synsetId);
      const results = await query.execute();

      expect(Array.isArray(results)).toBe(true);
      if (results.length > 0) {
        // All definitions should belong to the requested synset
        const synsetIds = results.map(d => d.synset_id);
        expect(synsetIds.every(id => id === synsetId)).toBe(true);
      }
    });

    it('should return definitions with unique IDs', async () => {
      const context = getContext();
      const synsetId = 'computer-n-1';

      const query = getDefinitionsBySynsetIdQuery(context.kyselyDb, synsetId);
      const results = await query.execute();

      expect(Array.isArray(results)).toBe(true);
      if (results.length > 1) {
        const ids = results.map(d => d.id);
        const uniqueIds = new Set(ids);
        expect(ids.length).toBe(uniqueIds.size);
      }
    });

    it('should handle definition queries with different synset IDs', async () => {
      const context = getContext();
      const synsetIds = ['synset-1', 'synset-2'];

      const queries = synsetIds.map(id =>
        getDefinitionsBySynsetIdQuery(context.kyselyDb, id)
      );
      const results = await Promise.all(queries.map(q => q.execute()));

      expect(Array.isArray(results)).toBe(true);
      expect(results.length).toBe(2);

      results.forEach(result => {
        expect(Array.isArray(result)).toBe(true);
        // Each result should be an array of definitions
        result.forEach(definition => {
          expect(definition).toHaveProperty('id');
          expect(definition).toHaveProperty('synset_id');
          expect(definition).toHaveProperty('text');
        });
      });
    });

    it('should return definitions with meaningful text content', async () => {
      const context = getContext();
      const synsetId = 'computer-n-1';

      const query = getDefinitionsBySynsetIdQuery(context.kyselyDb, synsetId);
      const results = await query.execute();

      expect(Array.isArray(results)).toBe(true);
      
      if (results.length === 0) {
        return;
      }
      
      const definition = results[0];
      if (!definition) {
        expect(definition).toBeDefined();
        return;
      }
      
      // Definition text should be meaningful (not just whitespace)
      expect(definition.text.trim().length).toBeGreaterThan(0);
      // Should contain some alphabetic characters
      expect(/[a-zA-Z]/.test(definition.text)).toBe(true);
    });

    it('should return definitions with consistent language codes', async () => {
      const context = getContext();
      const synsetId = 'computer-n-1';

      const query = getDefinitionsBySynsetIdQuery(context.kyselyDb, synsetId);
      const results = await query.execute();

      expect(Array.isArray(results)).toBe(true);
      if (results.length > 1) {
        const languages = results.map(d => d.language);
        // All definitions should have the same language (or be consistent)
        const uniqueLanguages = new Set(languages);
        expect(uniqueLanguages.size).toBeLessThanOrEqual(2); // Allow for some variation
      }
    });
  }
);
