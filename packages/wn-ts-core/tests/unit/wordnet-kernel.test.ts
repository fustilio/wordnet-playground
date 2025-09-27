import { describe, it, expect, beforeEach } from 'vitest';
import { WordNetKernel, createWordNet } from '../../src/wordnet-kernel.js';
import type { WordNetCore } from '../../src/wordnet-kernel.js';
import type { Word, Sense, Synset, ILI, WordQuery, SynsetQuery, SenseQuery } from '../../src/core/types.js';

// Mock implementation of WordNetCore for testing
class MockWordNetCore implements WordNetCore {
  async query(_sql: string, _params?: unknown[]): Promise<unknown[]> { return []; }
  async words(_query?: WordQuery): Promise<Word[]> { return []; }
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
  async synsets(_query?: SynsetQuery): Promise<Synset[]> { return []; }
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
  async senses(_query?: SenseQuery): Promise<Sense[]> { return []; }
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
  async lexicons(): Promise<any[]> { return []; }
  async synsetsByILI(_iliId: string): Promise<Synset[]> { return []; }
  async getWord(_form: string): Promise<Word[]> { return []; }
  async getSynset(_id: string): Promise<Synset | null> { return null; }
  async getSenses(_wordId: string): Promise<Sense[]> { return []; }
  async getDefinitions(_synsetId: string): Promise<any[]> { return []; }
  async getRelations(_synsetId: string, _type?: string): Promise<any[]> { return []; }
}

describe('WordNetKernel', () => {
  let kernel: WordNetKernel<any>;
  let mockCore: WordNetCore;

  beforeEach(() => {
    mockCore = new MockWordNetCore();
    kernel = new WordNetKernel(mockCore);
  });

  describe('Constructor', () => {
    it('should create a kernel instance', () => {
      expect(kernel).toBeDefined();
      expect(kernel).toBeInstanceOf(WordNetKernel);
    });

    it('should initialize with core implementation', () => {
      expect(kernel['core']).toBe(mockCore);
    });
  });

  describe('Core Delegation', () => {
    it('should delegate words method to core', async () => {
      const words = await kernel.words();
      expect(Array.isArray(words)).toBe(true);
    });

    it('should delegate synsets method to core', async () => {
      const synsets = await kernel.synsets();
      expect(Array.isArray(synsets)).toBe(true);
    });

    it('should delegate senses method to core', async () => {
      const senses = await kernel.senses();
      expect(Array.isArray(senses)).toBe(true);
    });

    it('should delegate word method to core', async () => {
      const word = await kernel.word('test-id');
      expect(word).toBeDefined();
    });

    it('should delegate synset method to core', async () => {
      const synset = await kernel.synset('test-id');
      expect(synset).toBeDefined();
    });

    it('should delegate sense method to core', async () => {
      const sense = await kernel.sense('test-id');
      expect(sense).toBeDefined();
    });

    it('should delegate ili method to core', async () => {
      const ili = await kernel.ili('test-id');
      expect(ili).toBeDefined();
    });

    it('should delegate ilis method to core', async () => {
      const ilis = await kernel.ilis();
      expect(Array.isArray(ilis)).toBe(true);
    });

    it('should delegate synsetsByILI method to core', async () => {
      const synsets = await kernel.synsetsByILI('test-ili');
      expect(Array.isArray(synsets)).toBe(true);
    });

    it('should delegate query method to core', async () => {
      const result = await kernel.query('SELECT 1');
      expect(Array.isArray(result)).toBe(true);
    });

    it('should delegate getWord method to core', async () => {
      const words = await kernel.getWord('test');
      expect(Array.isArray(words)).toBe(true);
    });

    it('should delegate getSynset method to core', async () => {
      const synset = await kernel.getSynset('test-id');
      expect(synset).toBeNull();
    });

    it('should delegate getSenses method to core', async () => {
      const senses = await kernel.getSenses('test-word');
      expect(Array.isArray(senses)).toBe(true);
    });

    it('should delegate getDefinitions method to core', async () => {
      const definitions = await kernel.getDefinitions('test-synset');
      expect(Array.isArray(definitions)).toBe(true);
    });

    it('should delegate getRelations method to core', async () => {
      const relations = await kernel.getRelations('test-synset');
      expect(Array.isArray(relations)).toBe(true);
    });
  });

  describe('Plugin System', () => {
    it('should have plugin management methods', () => {
      expect(typeof kernel.has).toBe('function');
      expect(typeof kernel.getPlugins).toBe('function');
      expect(typeof kernel.getCore).toBe('function');
    });

    it('should check if plugin is loaded', () => {
      expect(kernel.has('test-plugin')).toBe(false);
    });

    it('should get all loaded plugins', () => {
      const plugins = kernel.getPlugins();
      expect(Array.isArray(plugins)).toBe(true);
    });

    it('should get the core instance', () => {
      const core = kernel.getCore();
      expect(core).toBe(mockCore);
    });
  });
});

describe('createWordNet Factory Function', () => {
  it('should create a WordNetKernel instance', () => {
    const mockCore = new MockWordNetCore();
    const kernel = createWordNet({ core: mockCore });
    
    expect(kernel).toBeDefined();
    expect(kernel).toBeInstanceOf(WordNetKernel);
  });

  it('should create a WordNetKernel instance with plugins', () => {
    const mockCore = new MockWordNetCore();
    const kernel = createWordNet({ core: mockCore, plugins: [] });
    
    expect(kernel).toBeDefined();
    expect(kernel).toBeInstanceOf(WordNetKernel);
  });
});