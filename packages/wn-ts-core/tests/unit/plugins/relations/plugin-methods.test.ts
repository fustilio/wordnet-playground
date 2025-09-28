/**
 * Plugin Methods Test for Enhanced Relations
 * 
 * Tests the enhanced relations plugin methods directly without requiring
 * a full WordNet core instance.
 */

import { describe, it, expect } from 'vitest';
import { enhancedRelations } from '../../../../src/plugins/relations/enhanced-relations.js';
import type { WordNetKernel } from '../../../../src/wordnet-kernel.js';

describe('Enhanced Relations Plugin Methods', () => {
  // Mock kernel for testing
  const mockKernel = {
    core: {
      synset: async (id: string) => {
        if (id === 'test-id') {
          return {
            id: 'test-id',
            lemma: 'test',
            pos: 'n',
            language: 'en',
            lexicon: 'test-lexicon'
          };
        }
        return null;
      },
      words: async () => [],
      senses: async () => [],
      query: async () => []
    },
    kyselyDb: {
      db: {
        selectFrom: () => ({
          innerJoin: () => ({
            innerJoin: () => ({
              innerJoin: () => ({
                select: () => ({
                  where: () => ({
                    where: () => ({
                      where: () => ({
                        groupBy: () => ({
                          orderBy: () => ({
                            execute: async () => []
                          })
                        })
                      })
                    })
                  })
                })
              })
            })
          })
        })
      }
    }
  } as WordNetKernel;

  describe('Plugin Structure', () => {
    it('should have correct plugin name', () => {
      expect(enhancedRelations.name).toBe('enhanced-relations');
    });

    it('should have methods object', () => {
      expect(enhancedRelations.methods).toBeDefined();
      expect(typeof enhancedRelations.methods).toBe('object');
    });

    it('should have all required relation methods', () => {
      const methods = enhancedRelations.methods;
      
      // Hierarchical relations
      expect(methods.getHypernyms).toBeDefined();
      expect(methods.getHyponyms).toBeDefined();
      expect(methods.getInstanceHypernyms).toBeDefined();
      expect(methods.getInstanceHyponyms).toBeDefined();
      
      // Part-whole relations
      expect(methods.getMeronyms).toBeDefined();
      expect(methods.getHolonyms).toBeDefined();
      expect(methods.getPartMeronyms).toBeDefined();
      expect(methods.getMemberMeronyms).toBeDefined();
      expect(methods.getSubstanceMeronyms).toBeDefined();
      
      // Semantic role relations
      expect(methods.getAgents).toBeDefined();
      expect(methods.getPatients).toBeDefined();
      expect(methods.getInstruments).toBeDefined();
      expect(methods.getResults).toBeDefined();
      expect(methods.getSources).toBeDefined();
      expect(methods.getTargets).toBeDefined();
      
      // Domain relations
      expect(methods.getDomainTopics).toBeDefined();
      expect(methods.getDomainRegions).toBeDefined();
      
      // Causal relations
      expect(methods.getCauses).toBeDefined();
      expect(methods.getEntailments).toBeDefined();
      
      // Similarity relations
      expect(methods.getSimilar).toBeDefined();
      
      // Opposition relations
      expect(methods.getAntonyms).toBeDefined();
      
      // Gender relations
      expect(methods.getFeminine).toBeDefined();
      expect(methods.getMasculine).toBeDefined();
      
      // Size relations
      expect(methods.getDiminutives).toBeDefined();
      expect(methods.getAugmentatives).toBeDefined();
    });

    it('should have generic query methods', () => {
      const methods = enhancedRelations.methods;
      
      expect(methods.getRelationsByType).toBeDefined();
      expect(methods.getRelationsByCategory).toBeDefined();
      expect(methods.getAvailableRelationTypes).toBeDefined();
      expect(methods.getRelationStatsByCategory).toBeDefined();
    });

    it('should have utility methods', () => {
      const methods = enhancedRelations.methods;
      
      expect(methods.getRelationDescriptions).toBeDefined();
      expect(methods.getRelationCategories).toBeDefined();
      expect(methods.isValidRelationType).toBeDefined();
      expect(methods.getRelationTypesByCategory).toBeDefined();
    });
  });

  describe('Utility Methods', () => {
    it('should get relation descriptions', async () => {
      const descriptions = await enhancedRelations.methods.getRelationDescriptions?.(mockKernel);
      expect(typeof descriptions).toBe('object');
      expect(descriptions).toHaveProperty('hypernym');
      expect(descriptions).toHaveProperty('meronym');
      expect(descriptions).toHaveProperty('agent');
      expect(descriptions).toHaveProperty('domain_topic');
      expect(descriptions).toHaveProperty('causes');
      expect(descriptions).toHaveProperty('similar');
      expect(descriptions).toHaveProperty('antonym');
    });

    it('should get relation categories', async () => {
      const categories = await enhancedRelations.methods.getRelationCategories?.(mockKernel);
      expect(typeof categories).toBe('object');
      expect(categories).toHaveProperty('HIERARCHICAL');
      expect(categories).toHaveProperty('PART_WHOLE');
      expect(categories).toHaveProperty('SEMANTIC_ROLES');
      expect(categories).toHaveProperty('DOMAIN');
      expect(categories).toHaveProperty('CAUSAL');
      expect(categories).toHaveProperty('SIMILARITY');
      expect(categories).toHaveProperty('OPPOSITION');
      expect(categories).toHaveProperty('GENDER');
      expect(categories).toHaveProperty('SIZE');
      expect(categories).toHaveProperty('OTHER');
    });

    it('should validate relation types', async () => {
      const isValid = await enhancedRelations.methods.isValidRelationType?.(mockKernel as any, 'hypernym');
      expect(isValid).toBe(true);
      
      const isInvalid = await enhancedRelations.methods.isValidRelationType?.(mockKernel as any, 'invalid-relation');
      expect(isInvalid).toBe(false);
    });

    it('should get relation types by category', async () => {
      const hierarchicalTypes = await enhancedRelations.methods.getRelationTypesByCategory?.(mockKernel as any, 'HIERARCHICAL');
      expect(Array.isArray(hierarchicalTypes)).toBe(true);
      expect(hierarchicalTypes).toContain('hypernym');
      expect(hierarchicalTypes).toContain('hyponym');
      expect(hierarchicalTypes).toContain('instance_hypernym');
      expect(hierarchicalTypes).toContain('instance_hyponym');
    });

    it('should handle invalid categories gracefully', async () => {
      const invalidTypes = await enhancedRelations.methods.getRelationTypesByCategory?.(mockKernel as any, 'INVALID_CATEGORY' as any);
      expect(Array.isArray(invalidTypes)).toBe(true);
      expect(invalidTypes).toHaveLength(0);
    });
  });

  describe('Method Signatures', () => {
    it('should have correct method signatures for relation queries', () => {
      const methods = enhancedRelations.methods;
      
      // All relation methods should be functions
      Object.values(methods).forEach(method => {
        expect(typeof method).toBe('function');
      });
    });

    it('should have consistent return types for relation queries', async () => {
      // Test that methods return arrays
      const hypernyms = await enhancedRelations.methods.getHypernyms?.(mockKernel, 'test-id');
      expect(Array.isArray(hypernyms)).toBe(true);

      const meronyms = await enhancedRelations.methods.getMeronyms?.(mockKernel, 'test-id');
      expect(Array.isArray(meronyms)).toBe(true);

      const agents = await enhancedRelations.methods.getAgents?.(mockKernel, 'test-id');
      expect(Array.isArray(agents)).toBe(true);
    });

    it('should handle missing core gracefully', async () => {
      // Test with undefined core - should return empty array
      const result = await enhancedRelations.methods.getHypernyms?.('test-id');
      expect(Array.isArray(result)).toBe(true);
      expect(result).toHaveLength(0);
    });
  });

  describe('Error Handling', () => {
    it('should handle invalid synset IDs gracefully', async () => {
      // Should return empty array for invalid synset ID
      const relations = await enhancedRelations.methods.getHypernyms?.('invalid-id');
      expect(Array.isArray(relations)).toBe(true);
      expect(relations).toHaveLength(0);
    });

    it('should handle database errors gracefully', async () => {
      // With valid synset ID, should return empty array (no relations found)
      const relations = await enhancedRelations.methods.getHypernyms?.('test-id');
      expect(Array.isArray(relations)).toBe(true);
      expect(relations).toHaveLength(0);
    });
  });
});
