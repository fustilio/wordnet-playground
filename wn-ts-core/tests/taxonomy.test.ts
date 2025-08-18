import { describe, it, expect, beforeEach } from 'vitest';
import { 
  roots, 
  leaves, 
  taxonomyDepth, 
  hypernymPaths, 
  taxonomyShortestPath 
} from '../src/taxonomy';
import { BaseWordnet } from '../src/wordnet';
import type { Synset } from '../src/types';

describe('Taxonomy', () => {
  let wordnet: BaseWordnet;

  beforeEach(async () => {
    // Create a mock implementation of BaseWordnet for testing
    wordnet = {
      lexicons: async () => [],
      expandedLexicons: async () => [],
      words: async () => [],
      synsets: async () => [],
      synset: async () => undefined,
      senses: async () => [],
      word: async () => undefined,
      sense: async () => undefined,
      ili: async () => undefined,
      ilis: async () => [],
      getStatistics: async () => ({
        totalWords: 0,
        totalSynsets: 0,
        totalSenses: 0,
        totalILIs: 0,
        totalLexicons: 0
      }),
      getLexiconStatistics: async () => [],
      getDataQualityMetrics: async () => ({
        synsetsWithILI: 0,
        synsetsWithoutILI: 0,
        iliCoveragePercentage: 0,
        emptySynsets: 0,
        synsetsWithDefinitions: 0
      }),
      getPartOfSpeechDistribution: async () => ({}),
      getSynsetSizeAnalysis: async () => ({
        averageSize: 0,
        maxSize: 0,
        minSize: 0,
        sizeDistribution: {}
      }),
      close: async () => {}
    } as unknown as BaseWordnet;

    // Create mock synsets for testing
    const mockSynsets: Synset[] = [
      {
        id: 'test-entity-n',
        ili: 'i123',
        pos: 'n',
        language: 'en',
        lexicon: 'test',
        definitions: [],
        relations: [
          { id: 'rel1', type: 'hypernym', target: 'test-thing-n', source: 'test' }
        ],
        members: ['entity'],
        senses: ['test-entity-n-1'],
        examples: []
      },
      {
        id: 'test-thing-n',
        ili: 'i456',
        pos: 'n',
        language: 'en',
        lexicon: 'test',
        definitions: [],
        relations: [
          { id: 'rel2', type: 'hypernym', target: 'test-object-n', source: 'test' }
        ],
        members: ['thing'],
        senses: ['test-thing-n-1'],
        examples: []
      },
      {
        id: 'test-object-n',
        ili: 'i789',
        pos: 'n',
        language: 'en',
        lexicon: 'test',
        definitions: [],
        relations: [],
        members: ['object'],
        senses: ['test-object-n-1'],
        examples: []
      }
    ];

    // Mock the synset method to return our test synsets
    wordnet.synset = async (id: string) => {
      const synset = mockSynsets.find(s => s.id === id);
      if (!synset) {
        throw new Error(`Synset not found: ${id}`);
      }
      return synset;
    };
  });

  describe('roots', () => {
    it('should find root synsets', async () => {
      const rootSynsets = await roots(wordnet);
      expect(rootSynsets).toBeDefined();
      expect(Array.isArray(rootSynsets)).toBe(true);
    });

    it('should filter by part of speech', async () => {
      const rootSynsets = await roots(wordnet, 'n');
      expect(rootSynsets).toBeDefined();
      expect(Array.isArray(rootSynsets)).toBe(true);
    });
  });

  describe('leaves', () => {
    it('should find leaf synsets', async () => {
      const leafSynsets = await leaves(wordnet);
      expect(leafSynsets).toBeDefined();
      expect(Array.isArray(leafSynsets)).toBe(true);
    });
  });

  describe('taxonomyDepth', () => {
    it('should calculate taxonomy depth', async () => {
      const depth = await taxonomyDepth(wordnet, 'n');
      expect(depth).toBeDefined();
      expect(typeof depth).toBe('number');
    });

    it('should return 0 for empty taxonomy', async () => {
      const emptyWordnet = {
        ...wordnet,
        synsets: async () => []
      } as unknown as BaseWordnet;
      
      const depth = await taxonomyDepth(emptyWordnet, 'n');
      expect(depth).toBe(0);
    });
  });

  describe('hypernymPaths', () => {
    it('should find hypernym paths for root synset', async () => {
      // Get the test synset
      const testSynset = await wordnet.synset('test-object-n');
      expect(testSynset).toBeDefined();
      
      if (testSynset) {
        const paths = await hypernymPaths(testSynset, wordnet);
        expect(paths).toBeDefined();
        expect(Array.isArray(paths)).toBe(true);
      }
    });

    it('should find hypernym paths for leaf synset', async () => {
      // Get the test synset
      const testSynset = await wordnet.synset('test-entity-n');
      expect(testSynset).toBeDefined();
      
      if (testSynset) {
        const paths = await hypernymPaths(testSynset, wordnet);
        expect(paths).toBeDefined();
        expect(Array.isArray(paths)).toBe(true);
      }
    });
  });

  describe('taxonomyShortestPath', () => {
    it('should return empty path for identical synsets', async () => {
      const testSynset = await wordnet.synset('test-entity-n');
      expect(testSynset).toBeDefined();
      
      if (testSynset) {
        const path = await taxonomyShortestPath(testSynset, testSynset, wordnet);
        expect(path).toEqual([]);
      }
    });

    it('should find path between related synsets', async () => {
      const synset1 = await wordnet.synset('test-entity-n');
      const synset2 = await wordnet.synset('test-thing-n');
      expect(synset1).toBeDefined();
      expect(synset2).toBeDefined();
      
      if (synset1 && synset2) {
        const path = await taxonomyShortestPath(synset1, synset2, wordnet);
        expect(path).toBeDefined();
        expect(Array.isArray(path)).toBe(true);
      }
    });

    it('should find path through common ancestor', async () => {
      const synset1 = await wordnet.synset('test-entity-n');
      const synset2 = await wordnet.synset('test-object-n');
      expect(synset1).toBeDefined();
      expect(synset2).toBeDefined();
      
      if (synset1 && synset2) {
        const path = await taxonomyShortestPath(synset1, synset2, wordnet);
        expect(path).toBeDefined();
        expect(Array.isArray(path)).toBe(true);
      }
    });

    it('should throw error for unrelated synsets', async () => {
      // Mock synsets that are unrelated
      const unrelatedWordnet = {
        ...wordnet,
        synset: async (id: string) => {
          if (id === 'test-entity-n') {
            return {
              id: 'test-entity-n',
              ili: 'i123',
              pos: 'n',
              language: 'en',
              lexicon: 'test',
              definitions: [],
              relations: [],
              members: ['entity'],
              senses: ['test-entity-n-1'],
              examples: []
            };
          }
          if (id === 'test-unrelated-n') {
            return {
              id: 'test-unrelated-n',
              ili: 'i999',
              pos: 'n',
              language: 'en',
              lexicon: 'test',
              definitions: [],
              relations: [],
              members: ['unrelated'],
              senses: ['test-unrelated-n-1'],
              examples: []
            };
          }
          return undefined;
        }
      } as unknown as BaseWordnet;

      const synset1 = await unrelatedWordnet.synset('test-entity-n');
      const synset2 = await unrelatedWordnet.synset('test-unrelated-n');
      expect(synset1).toBeDefined();
      expect(synset2).toBeDefined();
      
      if (synset1 && synset2) {
        // Since the synsets have no relations, they should be considered unrelated
        // and the function should throw a WnError
        await expect(taxonomyShortestPath(synset1, synset2, unrelatedWordnet)).rejects.toThrow('No path found between synsets');
      }
    });

    it('should simulate root when requested', async () => {
      const synset1 = await wordnet.synset('test-entity-n');
      const synset2 = await wordnet.synset('test-thing-n');
      expect(synset1).toBeDefined();
      expect(synset2).toBeDefined();
      
      if (synset1 && synset2) {
        const path = await taxonomyShortestPath(synset1, synset2, wordnet, true);
        expect(path).toBeDefined();
        expect(Array.isArray(path)).toBe(true);
      }
    });

    it('should find path between synsets', async () => {
      const synset1 = await wordnet.synset('test-entity-n');
      const synset2 = await wordnet.synset('test-object-n');
      expect(synset1).toBeDefined();
      expect(synset2).toBeDefined();
      
      if (synset1 && synset2) {
        const path = await taxonomyShortestPath(synset1, synset2, wordnet);
        expect(path).toBeDefined();
        expect(Array.isArray(path)).toBe(true);
      }
    });
  });
}); 
