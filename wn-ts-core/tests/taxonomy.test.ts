import { describe, it, expect, beforeEach } from 'vitest';
import { 
  minDepth, 
  taxonomyShortestPath,
  roots, 
  leaves, 
  taxonomyDepth, 
  hypernymPaths
} from '../src/taxonomy';
import { Synset } from '../src/types';
import { Wordnet } from '../src/wordnet';
import type { PartOfSpeech } from '../src/types';

describe('Taxonomy', () => {
  let wordnet: Wordnet;
  let mockSynsets: Record<string, Synset>;

  beforeEach(async () => {
    wordnet = new Wordnet('test-en');
    
    // Create mock synsets for testing
    mockSynsets = {
      information: {
        id: 'test-en-0001-n',
        partOfSpeech: 'n' as PartOfSpeech,
        ili: undefined,
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
        partOfSpeech: 'n' as PartOfSpeech,
        ili: undefined,
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
        partOfSpeech: 'n' as PartOfSpeech,
        ili: undefined,
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
        partOfSpeech: 'n' as PartOfSpeech,
        ili: undefined,
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
        partOfSpeech: 'n' as PartOfSpeech,
        ili: undefined,
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
        partOfSpeech: 'v' as PartOfSpeech,
        ili: undefined,
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
        synsets: async (word: string, pos?: string) => {
          if (pos === 'n') {
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
        synsets: async (word: string, pos?: string) => {
          if (pos === 'v') {
            return [mockSynsets.exemplify];
          }
          return Object.values(mockSynsets);
        },
        synset: async (id: string) => Object.values(mockSynsets).find(s => s.id === id),
      } as unknown as Wordnet;

      const rootSynsets = await roots(mockWordnet, 'v');
      expect(rootSynsets).toHaveLength(1);
      expect(rootSynsets[0].id).toBe('test-en-0003-v');
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
        synset: async (id: string) => undefined,
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
      const paths = await hypernymPaths(mockSynsets.datum, mockWordnet);
      expect(paths).toEqual([[mockSynsets.datum]]);
    });

    it('should find hypernym paths for leaf synset', async () => {
      const mockWordnet = {
        synset: async (id: string) => Object.values(mockSynsets).find(s => s.id === id),
      } as unknown as Wordnet;

      const paths = await hypernymPaths(mockSynsets['random sample'], mockWordnet);
      expect(paths).toEqual([
        [
          mockSynsets['random sample'],
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
      
      const path = await taxonomyShortestPath(
        mockSynsets.information,
        mockSynsets.information,
        mockWordnet
      );
      expect(path).toEqual([]);
    });

    it('should find path between related synsets', async () => {
      const mockWordnet = {
        synset: async (id: string) => Object.values(mockSynsets).find(s => s.id === id),
      } as unknown as Wordnet;

      const path = await taxonomyShortestPath(
        mockSynsets.information,
        mockSynsets.example,
        mockWordnet
      );
      expect(path.map(s => s.id)).toEqual(['test-en-0001-n', 'test-en-0002-n']);
    });

    it('should find path through common ancestor', async () => {
      const mockWordnet = {
        synset: async (id: string) => Object.values(mockSynsets).find(s => s.id === id),
      } as unknown as Wordnet;

      const path = await taxonomyShortestPath(mockSynsets.sample, mockSynsets['random sample'], mockWordnet);
      expect(path.map(s => s.id)).toEqual(['test-en-0004-n', 'test-en-0005-n']);
    });

    it('should throw error for unrelated synsets', async () => {
      const mockWordnet = {
        synset: async (id: string) => Object.values(mockSynsets).find(s => s.id === id),
      } as unknown as Wordnet;
      
      await expect(
        taxonomyShortestPath(mockSynsets.example, mockSynsets.exemplify, mockWordnet)
      ).rejects.toThrow('No path found');
    });

    it('should simulate root when requested', async () => {
      const mockWordnet = {
        synset: async (id: string) => Object.values(mockSynsets).find(s => s.id === id),
      } as unknown as Wordnet;

      const path = await taxonomyShortestPath(mockSynsets.datum, mockSynsets.exemplify, mockWordnet, true);
      const ids = path.map(s => s.id);
      expect(ids).toContain('test-en-0006-n'); // datum
      expect(ids).toContain('test-en-0003-v'); // exemplify
      expect(ids).toContain('*ROOT*');
    });

    it('should find path between synsets', async () => {
      const mockWordnet = {
        synset: async (id: string) => Object.values(mockSynsets).find(s => s.id === id),
      } as unknown as Wordnet;

      const path = await taxonomyShortestPath(mockSynsets.information, mockSynsets.example, mockWordnet);
      
      // Path should be: information -> example (direct relation)
      expect(path).toHaveLength(2);
      expect(path[0].id).toBe('test-en-0001-n');
    });
  });
});

export const mockSynsets = {
  information: {
    id: 'test-en-0001-n',
    partOfSpeech: 'n' as PartOfSpeech,
    ili: undefined,
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
    partOfSpeech: 'n' as PartOfSpeech,
    ili: undefined,
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
    partOfSpeech: 'n' as PartOfSpeech,
    ili: undefined,
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
    partOfSpeech: 'n' as PartOfSpeech,
    ili: undefined,
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
    partOfSpeech: 'n' as PartOfSpeech,
    ili: undefined,
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
    partOfSpeech: 'v' as PartOfSpeech,
    ili: undefined,
    definitions: [],
    examples: [],
    relations: [],
    language: 'en',
    lexicon: 'test-en',
    members: [],
    senses: [],
  },
}; 
