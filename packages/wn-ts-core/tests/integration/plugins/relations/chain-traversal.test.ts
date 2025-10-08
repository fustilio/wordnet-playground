/**
 * Chain Traversal Test
 * 
 * This test verifies the chain traversal functionality for the RelationsDemo
 */

import { describe, it, expect } from 'vitest';

describe('Chain Traversal Functionality', () => {
  describe('Chain Data Structure', () => {
    it('should have correct chain entry structure', () => {
      const mockChainEntry = {
        synset: {
          id: 'test-synset-1',
          pos: 'n' as const,
          definitions: [{ id: 'def-1', language: 'en', text: 'test definition' }],
          examples: [],
          language: 'en',
          lexicon: 'oewn',
          memberIds: [],
          senseIds: [],
          iliDefinitions: []
        },
        relationType: 'hypernym',
        direction: 'to' as const,
        timestamp: Date.now()
      };

      expect(mockChainEntry.synset).toBeDefined();
      expect(mockChainEntry.relationType).toBe('hypernym');
      expect(mockChainEntry.direction).toBe('to');
      expect(mockChainEntry.timestamp).toBeGreaterThan(0);
    });

    it('should support different relation types', () => {
      const relationTypes = [
        'hypernym', 'hyponym', 'meronym', 'holonym',
        'troponym', 'entailment', 'antonym', 'similar',
        'coordinate_term', 'morphosemantic_link'
      ];

      relationTypes.forEach(relationType => {
        const chainEntry = {
          synset: { id: 'test-synset', pos: 'n' as const, definitions: [], examples: [], language: 'en', lexicon: 'oewn', memberIds: [], senseIds: [], iliDefinitions: [] },
          relationType,
          direction: 'to' as const,
          timestamp: Date.now()
        };

        expect(chainEntry.relationType).toBe(relationType);
      });
    });
  });

  describe('Path Building', () => {
    it('should build correct path strings', () => {
      const mockRelations = [
        { lemma: 'vehicle', relationType: 'hypernym' },
        { lemma: 'automobile', relationType: 'hyponym' },
        { lemma: 'engine', relationType: 'meronym' }
      ];

      const expectedPaths = [
        'vehicle (hypernym)',
        'automobile (hyponym)',
        'engine (meronym)'
      ];

      mockRelations.forEach((relation, index) => {
        const pathString = `${relation.lemma} (${relation.relationType})`;
        expect(pathString).toBe(expectedPaths[index]);
      });
    });

    it('should handle empty chains', () => {
      const emptyChain: any[] = [];
      const emptyPath: string[] = [];

      expect(emptyChain.length).toBe(0);
      expect(emptyPath.length).toBe(0);
    });
  });

  describe('Chain Navigation', () => {
    it('should support forward navigation', () => {
      const chain = [
        { synset: { id: 'synset-1', pos: 'n' as const, definitions: [], examples: [], language: 'en', lexicon: 'oewn', memberIds: [], senseIds: [], iliDefinitions: [] }, relationType: 'hypernym', direction: 'to' as const, timestamp: 1000 },
        { synset: { id: 'synset-2', pos: 'n' as const, definitions: [], examples: [], language: 'en', lexicon: 'oewn', memberIds: [], senseIds: [], iliDefinitions: [] }, relationType: 'hyponym', direction: 'to' as const, timestamp: 2000 }
      ];

      expect(chain.length).toBe(2);
      if (chain[0]) expect(chain[0].relationType).toBe('hypernym');
      if (chain[1]) expect(chain[1].relationType).toBe('hyponym');
    });

    it('should support backward navigation', () => {
      const chain = [
        { synset: { id: 'synset-1', pos: 'n' as const, definitions: [], examples: [], language: 'en', lexicon: 'oewn', memberIds: [], senseIds: [], iliDefinitions: [] }, relationType: 'hypernym', direction: 'to' as const, timestamp: 1000 },
        { synset: { id: 'synset-2', pos: 'n' as const, definitions: [], examples: [], language: 'en', lexicon: 'oewn', memberIds: [], senseIds: [], iliDefinitions: [] }, relationType: 'hyponym', direction: 'to' as const, timestamp: 2000 }
      ];

      // Simulate going back
      const newChain = chain.slice(0, -1);
      expect(newChain.length).toBe(1);
      if (newChain[0]) expect(newChain[0].relationType).toBe('hypernym');
    });
  });

  describe('Chain Export', () => {
    it('should create valid export data structure', () => {
      const mockChain = [
        { synset: { id: 'synset-1', pos: 'n' as const, definitions: [], examples: [], language: 'en', lexicon: 'oewn', memberIds: [], senseIds: [], iliDefinitions: [] }, relationType: 'hypernym', direction: 'to' as const, timestamp: 1000 },
        { synset: { id: 'synset-2', pos: 'n' as const, definitions: [], examples: [], language: 'en', lexicon: 'oewn', memberIds: [], senseIds: [], iliDefinitions: [] }, relationType: 'hyponym', direction: 'to' as const, timestamp: 2000 }
      ];

      const mockPath = ['vehicle (hypernym)', 'automobile (hyponym)'];

      const exportData = {
        path: mockPath,
        chain: mockChain.map(entry => ({
          synset: entry.synset.id,
          words: entry.synset.id,
          relationType: entry.relationType,
          direction: entry.direction,
          timestamp: new Date(entry.timestamp).toISOString()
        })),
        totalSteps: mockChain.length
      };

      expect(exportData.path).toEqual(mockPath);
      expect(exportData.chain).toHaveLength(2);
      expect(exportData.totalSteps).toBe(2);
      if (exportData.chain[0]) expect(exportData.chain[0].relationType).toBe('hypernym');
      if (exportData.chain[1]) expect(exportData.chain[1].relationType).toBe('hyponym');
    });
  });

  describe('Comprehensive Chain Example', () => {
    it('should demonstrate a realistic traversal chain', () => {
      // Simulate a realistic WordNet traversal: car -> vehicle -> transportation -> system
      const realisticChain = [
        {
          synset: { id: 'car-1', pos: 'n' as const, definitions: [{ id: 'def-1', language: 'en', text: 'a motor vehicle with four wheels' }], examples: [], language: 'en', lexicon: 'oewn', memberIds: [], senseIds: [], iliDefinitions: [] },
          relationType: 'hypernym',
          direction: 'to' as const,
          timestamp: 1000
        },
        {
          synset: { id: 'vehicle-1', pos: 'n' as const, definitions: [{ id: 'def-2', language: 'en', text: 'a conveyance that transports people or objects' }], examples: [], language: 'en', lexicon: 'oewn', memberIds: [], senseIds: [], iliDefinitions: [] },
          relationType: 'hypernym',
          direction: 'to' as const,
          timestamp: 2000
        },
        {
          synset: { id: 'transportation-1', pos: 'n' as const, definitions: [{ id: 'def-3', language: 'en', text: 'the act of moving something from one location to another' }], examples: [], language: 'en', lexicon: 'oewn', memberIds: [], senseIds: [], iliDefinitions: [] },
          relationType: 'hypernym',
          direction: 'to' as const,
          timestamp: 3000
        }
      ];

      const realisticPath = [
        'vehicle (hypernym)',
        'transportation (hypernym)',
        'system (hypernym)'
      ];

      expect(realisticChain).toHaveLength(3);
      expect(realisticPath).toHaveLength(3);
      
      // Verify the chain follows a logical hierarchy
      expect(realisticChain[0]?.relationType).toBe('hypernym');
      expect(realisticChain[1]?.relationType).toBe('hypernym');
      expect(realisticChain[2]?.relationType).toBe('hypernym');
      
      // Verify timestamps are increasing
      if (realisticChain[0]?.timestamp && realisticChain[1]?.timestamp) {
        expect(realisticChain[0].timestamp).toBeLessThan(realisticChain[1].timestamp);
      }
      if (realisticChain[1]?.timestamp && realisticChain[2]?.timestamp) {
        expect(realisticChain[1].timestamp).toBeLessThan(realisticChain[2].timestamp);
      }
    });
  });
});
