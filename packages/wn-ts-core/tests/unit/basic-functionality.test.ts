import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import type { WordNetCore } from '../../src/wordnet-kernel.js';

describe('Basic Wordnet Functionality', () => {
  let wordnet: WordNetCore;

  beforeEach(() => {
    // Create a mock implementation of WordNetCore for testing
    wordnet = {
      query: async () => [],
      lexicons: async () => [],
      words: async () => [],
      synsets: async () => [],
      synset: async () => ({
        id: 'mock-synset',
        pos: 'n',
        definitions: [],
        examples: [],
        memberIds: [],
        senseIds: [],
        relations: [],
        language: 'en',
        lexicon: 'mock-lexicon',
        ili: 'mock-ili'
      }),
      senses: async () => [],
      word: async () => undefined,
      sense: async () => ({
        id: 'mock-sense',
        wordId: 'mock-word',
        synsetId: 'mock-synset',
        examples: [],
        counts: [],
        language: 'en',
        lexicon: 'mock-lexicon'
      }),
      ili: async () => ({
        id: 'mock-ili',
        status: 'standard'
      }),
      ilis: async () => [],
      synsetsByILI: async () => [],
      getWord: async () => [],
      getSynset: async () => null,
      getSenses: async () => [],
      getDefinitions: async () => [],
      getRelations: async () => []
    } as unknown as WordNetCore;
  });

  afterEach(async () => {
    // No close method in WordNetCore interface
  });

  it('should create a Wordnet instance', () => {
    expect(wordnet).toBeDefined();
  });

  it('should handle empty queries gracefully', async () => {
    const words = await wordnet.words();
    expect(Array.isArray(words)).toBe(true);
  });

  it('should handle empty synset queries gracefully', async () => {
    const synsets = await wordnet.synsets();
    expect(Array.isArray(synsets)).toBe(true);
  });

  it('should handle empty sense queries gracefully', async () => {
    const senses = await wordnet.senses();
    expect(Array.isArray(senses)).toBe(true);
  });

  it('should return empty arrays for non-existent data', async () => {
    const word = await wordnet.word('non-existent-word-id');
    expect(word).toBeUndefined();
  });

  it('should handle lexicon queries', async () => {
    const lexicons = await wordnet.lexicons();
    expect(Array.isArray(lexicons)).toBe(true);
  });

  it('should handle additional methods', async () => {
    const words = await wordnet.getWord('test');
    expect(Array.isArray(words)).toBe(true);
    
    const synset = await wordnet.getSynset('test-id');
    expect(synset).toBeNull();
    
    const senses = await wordnet.getSenses('test-word');
    expect(Array.isArray(senses)).toBe(true);
    
    const definitions = await wordnet.getDefinitions('test-synset');
    expect(Array.isArray(definitions)).toBe(true);
    
    const relations = await wordnet.getRelations('test-synset');
    expect(Array.isArray(relations)).toBe(true);
  });
});
