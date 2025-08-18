import { describe, it, expect, beforeEach } from 'vitest';
import { 
  taxonomyShortestPath,
  roots, 
  leaves, 
  taxonomyDepth, 
  hypernymPaths
} from '../src/taxonomy';
import { Wordnet } from '../src/wordnet';
import type { PartOfSpeech, SynsetQuery, Synset } from 'wn-ts-core';

describe('Taxonomy', () => {
  let mockSynsets: Record<string, Synset>;

  beforeEach(async () => {
    // Create mock synsets for testing
    mockSynsets = {
      information: {
        id: 'test-en-0001-n',
        pos: 'n' as PartOfSpeech,
        ili: 'i123',
        definitions: [],
        examples: [],
        relations: [
          { id: 'r1', type: 'hypernym', target: 'test-en-0006-n' },
          { id: 'r2', type: 'hyponym', target: 'test-en-0002-n' },
        ],
        language: 'en',
        lexicon: 'test-en',
        members: [],
        senses: [],
      },
      example: {
        id: 'test-en-0002-n',
        pos: 'n' as PartOfSpeech,
        ili: 'i124',
        definitions: [],
        examples: [],
        relations: [
          { id: 'r3', type: 'hypernym', target: 'test-en-0001-n' },
          { id: 'r4', type: 'hyponym', target: 'test-en-0004-n' },
        ],
        language: 'en',
        lexicon: 'test-en',
        members: [],
        senses: [],
      },
      sample: {
        id: 'test-en-0004-n',
        pos: 'n' as PartOfSpeech,
        ili: 'i125',
        definitions: [],
        examples: [],
        relations: [
          { id: 'r5', type: 'hypernym', target: 'test-en-0002-n' },
          { id: 'r6', type: 'hyponym', target: 'test-en-0005-n' },
        ],
        language: 'en',
        lexicon: 'test-en',
        members: [],
        senses: [],
      },
      'random sample': {
        id: 'test-en-0005-n',
        pos: 'n' as PartOfSpeech,
        ili: 'i126',
        definitions: [],
        examples: [],
        relations: [
          { id: 'r7', type: 'hypernym', target: 'test-en-0004-n' },
          { id: 'r8', type: 'hyponym', target: 'test-en-0006-n' },
        ],
        language: 'en',
        lexicon: 'test-en',
        members: [],
        senses: [],
      },
      datum: {
        id: 'test-en-0006-n',
        pos: 'n' as PartOfSpeech,
        ili: 'i127',
        definitions: [],
        examples: [],
        relations: [],
        language: 'en',
        lexicon: 'test-en',
        members: [],
        senses: [],
      },
      exemplify: {
        id: 'test-en-0003-v',
        pos: 'v' as PartOfSpeech,
        ili: 'i128',
        definitions: [],
        examples: [],
        relations: [],
        language: 'en',
        lexicon: 'test-en',
        members: [],
        senses: [],
      },
    };
  });

  describe('roots', () => {
    it('should find root synsets', async () => {
      // Mock the wordnet to return our test synsets
      const mockWordnet = {
        synsets: async (query?: SynsetQuery) => {
          if (query?.pos === 'n') {
            return [mockSynsets.information, mockSynsets.example, mockSynsets.sample, mockSynsets['random sample'], mockSynsets.datum];
          }
          return Object.values(mockSynsets);
        },
        synset: async (id: string) => Object.values(mockSynsets).find(s => s.id === id),
      } as unknown as Wordnet;

      const rootSynsets = await roots(mockWordnet, 'n');
      
      // Only datum is a root in the current mock data
      expect(rootSynsets).toHaveLength(1);
      expect(rootSynsets.map(s => s.id)).toContain('test-en-0006-n');
    });

    it('should filter by part of speech', async () => {
      const mockWordnet = {
        synsets: async (query?: SynsetQuery) => {
          if (query?.pos === 'v') {
            return [mockSynsets.exemplify];
          }
          return Object.values(mockSynsets);
        },
        synset: async (id: string) => Object.values(mockSynsets).find(s => s.id === id),
      } as unknown as Wordnet;

      const rootSynsets = await roots(mockWordnet, 'v');
      expect(rootSynsets).toHaveLength(1);
      const firstRoot = rootSynsets[0];
      expect(firstRoot).toBeDefined();
      expect(firstRoot?.id).toBe('test-en-0003-v');
    });
  });

  describe('leaves', () => {
    it('should find leaf synsets', async () => {
      const mockWordnet = {
        synsets: async () => Object.values(mockSynsets),
        synset: async (id: string) => Object.values(mockSynsets).find(s => s.id === id),
      } as unknown as Wordnet;

      const leafSynsets = await leaves(mockWordnet, 'n');
      
      // Random sample should be a leaf (no hyponyms)
      expect(leafSynsets.some(s => s.id === 'test-en-0005-n')).toBe(true);
    });
  });

  describe('taxonomyDepth', () => {
    it('should calculate taxonomy depth', async () => {
      const mockWordnet = {
        synsets: async () => Object.values(mockSynsets),
        synset: async (id: string) => Object.values(mockSynsets).find(s => s.id === id),
      } as unknown as Wordnet;

      const depth = await taxonomyDepth(mockWordnet, 'n');
      expect(depth).toBeGreaterThan(0);
    });

    it('should return 0 for empty taxonomy', async () => {
      const mockWordnet = {
        synsets: async () => [],
        synset: async () => undefined,
      } as unknown as Wordnet;

      const depth = await taxonomyDepth(mockWordnet, 'n');
      expect(depth).toBe(0);
    });
  });

  describe('hypernymPaths', () => {
    it('should find hypernym paths for root synset', async () => {
      const mockWordnet = {
        synset: async (id: string) => Object.values(mockSynsets).find(s => s.id === id),
      } as unknown as Wordnet;
      const datum = mockSynsets.datum;
      expect(datum).toBeDefined();
      const paths = await hypernymPaths(datum!, mockWordnet);
      expect(paths).toEqual([[datum]]);
    });

    it('should find hypernym paths for leaf synset', async () => {
      const mockWordnet = {
        synset: async (id: string) => Object.values(mockSynsets).find(s => s.id === id),
      } as unknown as Wordnet;

      const randomSample = mockSynsets['random sample'];
      expect(randomSample).toBeDefined();
      const paths = await hypernymPaths(randomSample!, mockWordnet);
      expect(paths).toEqual([
        [
          randomSample,
          mockSynsets.sample,
          mockSynsets.example,
          mockSynsets.information,
          mockSynsets.datum,
        ],
      ]);
    });
  });

  describe('taxonomyShortestPath', () => {
    it('should return empty path for identical synsets', async () => {
      const mockWordnet = {
        synset: async (id: string) => Object.values(mockSynsets).find(s => s.id === id),
      } as unknown as Wordnet;
      
      const information = mockSynsets.information;
      expect(information).toBeDefined();
      const path = await taxonomyShortestPath(
        information!,
        information!,
        mockWordnet
      );
      expect(path).toEqual([]);
    });

    it('should find path between related synsets', async () => {
      const mockWordnet = {
        synset: async (id: string) => Object.values(mockSynsets).find(s => s.id === id),
      } as unknown as Wordnet;

      const information = mockSynsets.information;
      const example = mockSynsets.example;
      expect(information).toBeDefined();
      expect(example).toBeDefined();
      const path = await taxonomyShortestPath(
        information!,
        example!,
        mockWordnet
      );
      expect(path.map(s => s.id)).toEqual(['test-en-0001-n', 'test-en-0002-n']);
    });

    it('should find path through common ancestor', async () => {
      const mockWordnet = {
        synset: async (id: string) => Object.values(mockSynsets).find(s => s.id === id),
      } as unknown as Wordnet;

      const sample = mockSynsets.sample;
      const randomSample = mockSynsets['random sample'];
      expect(sample).toBeDefined();
      expect(randomSample).toBeDefined();
      const path = await taxonomyShortestPath(sample!, randomSample!, mockWordnet);
      expect(path.map(s => s.id)).toEqual(['test-en-0004-n', 'test-en-0005-n']);
    });

    it('should throw error for unrelated synsets', async () => {
      const mockWordnet = {
        synset: async (id: string) => Object.values(mockSynsets).find(s => s.id === id),
      } as unknown as Wordnet;
      
      const example = mockSynsets.example;
      const exemplify = mockSynsets.exemplify;
      expect(example).toBeDefined();
      expect(exemplify).toBeDefined();
      await expect(
        taxonomyShortestPath(example!, exemplify!, mockWordnet)
      ).rejects.toThrow('No path found');
    });

    it('should simulate root when requested', async () => {
      const mockWordnet = {
        synset: async (id: string) => Object.values(mockSynsets).find(s => s.id === id),
      } as unknown as Wordnet;

      const datum = mockSynsets.datum;
      const exemplify = mockSynsets.exemplify;
      expect(datum).toBeDefined();
      expect(exemplify).toBeDefined();
      const path = await taxonomyShortestPath(datum!, exemplify!, mockWordnet, true);
      const ids = path.map(s => s.id);
      expect(ids).toContain('test-en-0006-n'); // datum
      expect(ids).toContain('test-en-0003-v'); // exemplify
      expect(ids).toContain('*ROOT*');
    });

    it('should find path between synsets', async () => {
      const mockWordnet = {
        synset: async (id: string) => Object.values(mockSynsets).find(s => s.id === id),
      } as unknown as Wordnet;

      const information = mockSynsets.information;
      const example = mockSynsets.example;
      expect(information).toBeDefined();
      expect(example).toBeDefined();
      const path = await taxonomyShortestPath(information!, example!, mockWordnet);
      
      // Path should be: information -> example (direct relation)
      expect(path).toHaveLength(2);
      const firstPath = path[0];
      expect(firstPath).toBeDefined();
      expect(firstPath?.id).toBe('test-en-0001-n');
    });
  });
});

export const mockSynsets = {
  information: {
    id: 'test-en-0001-n',
    pos: 'n' as PartOfSpeech,
    ili: 'i123',
    definitions: [],
    examples: [],
    relations: [
      { id: 'r1', type: 'hypernym', target: 'test-en-0006-n' },
      { id: 'r2', type: 'hyponym', target: 'test-en-0002-n' },
    ],
    language: 'en',
    lexicon: 'test-en',
    members: [],
    senses: [],
  },
  example: {
    id: 'test-en-0002-n',
    pos: 'n' as PartOfSpeech,
    ili: 'i124',
    definitions: [],
    examples: [],
    relations: [
      { id: 'r3', type: 'hypernym', target: 'test-en-0001-n' },
      { id: 'r4', type: 'hyponym', target: 'test-en-0004-n' },
    ],
    language: 'en',
    lexicon: 'test-en',
    members: [],
    senses: [],
  },
  sample: {
    id: 'test-en-0004-n',
    pos: 'n' as PartOfSpeech,
    ili: 'i125',
    definitions: [],
    examples: [],
    relations: [
      { id: 'r5', type: 'hypernym', target: 'test-en-0002-n' },
      { id: 'r6', type: 'hyponym', target: 'test-en-0005-n' },
    ],
    language: 'en',
    lexicon: 'test-en',
    members: [],
    senses: [],
  },
  'random sample': {
    id: 'test-en-0005-n',
    pos: 'n' as PartOfSpeech,
    ili: 'i126',
    definitions: [],
    examples: [],
    relations: [
      { id: 'r7', type: 'hypernym', target: 'test-en-0004-n' },
      { id: 'r8', type: 'hyponym', target: 'test-en-0006-n' },
    ],
    language: 'en',
    lexicon: 'test-en',
    members: [],
    senses: [],
  },
  datum: {
    id: 'test-en-0006-n',
    pos: 'n' as PartOfSpeech,
    ili: 'i127',
    definitions: [],
    examples: [],
    relations: [],
    language: 'en',
    lexicon: 'test-en',
    members: [],
    senses: [],
  },
  exemplify: {
    id: 'test-en-0003-v',
    pos: 'v' as PartOfSpeech,
    ili: 'i128',
    definitions: [],
    examples: [],
    relations: [],
    language: 'en',
    lexicon: 'test-en',
    members: [],
    senses: [],
  },
}; 
