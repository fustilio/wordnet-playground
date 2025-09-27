import { describe, it, expect, beforeEach } from 'vitest';
import type { WordNetCore } from '../../src/wordnet-kernel.js';
import type { Word, Sense, Synset, Lexicon, ILI, WordQuery, SynsetQuery, SenseQuery } from '../../src/core/types.js';

// Mock implementation of WordNetCore for testing
class MockWordNetCore implements WordNetCore {
  // Core query methods
  async query(_sql: string, _params?: unknown[]): Promise<unknown[]> { return []; }
  async words(_query?: WordQuery): Promise<Word[]> { return []; }
  async synsets(_query?: SynsetQuery): Promise<Synset[]> { return []; }
  async senses(_query?: SenseQuery): Promise<Sense[]> { return []; }
  async word(_wordId: string): Promise<Word> { 
    return {
      id: 'mock-word',
      lemma: 'mock',
      pos: 'n',
      forms: [],
      pronunciations: [],
      tags: [],
      counts: [],
      language: 'en',
      lexicon: 'mock-lexicon',
      syntacticBehaviours: []
    } as Word; 
  }
  async synset(_synsetId: string): Promise<Synset> { 
    return {
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
    } as Synset; 
  }
  async sense(_senseId: string): Promise<Sense> { 
    return {
      id: 'mock-sense',
      wordId: 'mock-word',
      synsetId: 'mock-synset',
      examples: [],
      counts: [],
      tags: [],
      language: 'en',
      lexicon: 'mock-lexicon'
    } as Sense; 
  }
  async ili(_iliId: string): Promise<ILI> { 
    return {
      id: 'mock-ili',
      status: 'standard'
    } as ILI; 
  }
  async ilis(_status?: string): Promise<ILI[]> { return []; }
  async lexicons(): Promise<Lexicon[]> { return []; }
  async synsetsByILI(_iliId: string): Promise<Synset[]> { return []; }
  async getWord(_form: string): Promise<Word[]> { return []; }
  async getSynset(_id: string): Promise<Synset | null> { return null; }
  async getSenses(_wordId: string): Promise<Sense[]> { return []; }
  async getDefinitions(_synsetId: string): Promise<any[]> { return []; }
  async getRelations(_synsetId: string, _type?: string): Promise<any[]> { return []; }
}

describe('WordNetCore Interface', () => {
  let wordnet: WordNetCore;

  beforeEach(() => {
    wordnet = new MockWordNetCore();
  });

  describe('Core Query Methods', () => {
    it('should implement words method', async () => {
      const words = await wordnet.words();
      expect(Array.isArray(words)).toBe(true);
    });

    it('should implement synsets method', async () => {
      const synsets = await wordnet.synsets();
      expect(Array.isArray(synsets)).toBe(true);
    });

    it('should implement senses method', async () => {
      const senses = await wordnet.senses();
      expect(Array.isArray(senses)).toBe(true);
    });

    it('should implement word method', async () => {
      const word = await wordnet.word('test-word-id');
      expect(word).toBeDefined();
      expect(word.id).toBe('mock-word');
    });

    it('should implement synset method', async () => {
      const synset = await wordnet.synset('test-synset-id');
      expect(synset).toBeDefined();
      expect(synset.id).toBe('mock-synset');
    });

    it('should implement sense method', async () => {
      const sense = await wordnet.sense('test-sense-id');
      expect(sense).toBeDefined();
      expect(sense.id).toBe('mock-sense');
    });

    it('should implement ili method', async () => {
      const ili = await wordnet.ili('test-ili-id');
      expect(ili).toBeDefined();
      expect(ili.id).toBe('mock-ili');
    });

    it('should implement ilis method', async () => {
      const ilis = await wordnet.ilis();
      expect(Array.isArray(ilis)).toBe(true);
    });
  });

  describe('Lexicon Methods', () => {
    it('should implement lexicons method', async () => {
      const lexicons = await wordnet.lexicons();
      expect(Array.isArray(lexicons)).toBe(true);
    });
  });

  describe('Additional Methods', () => {
    it('should implement getWord method', async () => {
      const words = await wordnet.getWord('test');
      expect(Array.isArray(words)).toBe(true);
    });

    it('should implement getSynset method', async () => {
      const synset = await wordnet.getSynset('test-id');
      expect(synset).toBeNull();
    });

    it('should implement getSenses method', async () => {
      const senses = await wordnet.getSenses('test-word');
      expect(Array.isArray(senses)).toBe(true);
    });

    it('should implement getDefinitions method', async () => {
      const definitions = await wordnet.getDefinitions('test-synset');
      expect(Array.isArray(definitions)).toBe(true);
    });

    it('should implement getRelations method', async () => {
      const relations = await wordnet.getRelations('test-synset');
      expect(Array.isArray(relations)).toBe(true);
    });
  });
});
