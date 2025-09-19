import { describe, it, expect, beforeEach } from 'vitest';
import { WordNetKernel, createWordNet } from '../src/wordnet-kernel.js';
import type { WordNetCore } from '../src/wordnet-kernel.js';
import type { Word, Sense, Synset, ILI, WordQuery, SynsetQuery, SenseQuery } from '../src/core/types.js';
import { similarity } from '../src/plugins/similarity/index.js';
import { translation } from '../src/plugins/translation.js';

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

describe('Plugin System', () => {
  let kernel: WordNetKernel<any>;
  let mockCore: WordNetCore;

  beforeEach(() => {
    mockCore = new MockWordNetCore();
    kernel = new WordNetKernel(mockCore);
  });

  describe('Plugin Loading', () => {
    it('should load similarity plugin', () => {
      kernel.use(similarity);
      expect(kernel.has('similarity')).toBe(true);
    });

    it('should load translation plugin', () => {
      kernel.use(translation);
      expect(kernel.has('translation')).toBe(true);
    });

    it('should load multiple plugins', () => {
      kernel.use(similarity);
      kernel.use(translation);
      expect(kernel.has('similarity')).toBe(true);
      expect(kernel.has('translation')).toBe(true);
    });

    it('should not load duplicate plugins', () => {
      kernel.use(similarity);
      kernel.use(similarity);
      const plugins = kernel.getPlugins();
      const similarityPlugins = plugins.filter(p => p === 'similarity');
      expect(similarityPlugins).toHaveLength(1);
    });
  });

  describe('Plugin Methods', () => {
    beforeEach(() => {
      kernel.use(similarity);
      kernel.use(translation);
    });

    it('should call similarity plugin methods', async () => {
      const mockSynset1 = {
        id: 'synset1',
        pos: 'n' as const,
        definitions: [],
        examples: [],
        memberIds: [],
        senseIds: [],
        relations: [],
        language: 'en',
        lexicon: 'test',
        ili: 'ili1'
      };
      const mockSynset2 = {
        id: 'synset2',
        pos: 'n' as const,
        definitions: [],
        examples: [],
        memberIds: [],
        senseIds: [],
        relations: [],
        language: 'en',
        lexicon: 'test',
        ili: 'ili2'
      };

      // Test path similarity - plugin methods are added directly to kernel
      const pathResult = await (kernel as any).path(mockSynset1, mockSynset2);
      expect(typeof pathResult).toBe('number');

      // Test Wu-Palmer similarity
      const wupResult = await (kernel as any).wup(mockSynset1, mockSynset2);
      expect(typeof wupResult).toBe('number');

      // Test Leacock-Chodorow similarity
      const lchResult = await (kernel as any).lch(mockSynset1, mockSynset2, 3);
      expect(typeof lchResult).toBe('number');
    });

    it('should throw error when calling translation plugin methods without Kysely', async () => {
      // Test getTranslations - should throw Kysely error
      await expect((kernel as any).getTranslations('synset1', 'es'))
        .rejects.toThrow('Kysely database not available. Please ensure the kernel was initialized with a Kysely database.');

      // Test getTranslationsByWord - should throw Kysely error
      await expect((kernel as any).getTranslationsByWord('test', 'en', 'es'))
        .rejects.toThrow('Kysely database not available. Please ensure the kernel was initialized with a Kysely database.');

      // Test getAvailableLanguages - should throw Kysely error
      await expect((kernel as any).getAvailableLanguages())
        .rejects.toThrow('Kysely database not available. Please ensure the kernel was initialized with a Kysely database.');

      // Test getSynsetsByIli - should throw Kysely error
      await expect((kernel as any).getSynsetsByIli('ili1'))
        .rejects.toThrow('Kysely database not available. Please ensure the kernel was initialized with a Kysely database.');

      // Test getTranslationConfidence - should throw Kysely error
      await expect((kernel as any).getTranslationConfidence('word1', 'word2'))
        .rejects.toThrow('Kysely database not available. Please ensure the kernel was initialized with a Kysely database.');

      // Test getTranslationSuggestions - should throw Kysely error
      await expect((kernel as any).getTranslationSuggestions('test', 'en', 'es'))
        .rejects.toThrow('Kysely database not available. Please ensure the kernel was initialized with a Kysely database.');
    });

    it('should handle plugin method errors gracefully', async () => {
      // Test calling non-existent methods - this should throw an error
      expect(() => (kernel as any).nonexistentMethod()).toThrow();
    });
  });

  describe('Plugin Management', () => {
    it('should unload plugins', () => {
      kernel.use(similarity);
      expect(kernel.has('similarity')).toBe(true);
      
      kernel.remove('similarity');
      expect(kernel.has('similarity')).toBe(false);
    });

    it('should get all loaded plugins', () => {
      kernel.use(similarity);
      kernel.use(translation);
      
      const plugins = kernel.getPlugins();
      expect(plugins).toHaveLength(2);
      expect(plugins).toContain('similarity');
      expect(plugins).toContain('translation');
    });

    it('should check if plugin is loaded', () => {
      expect(kernel.has('similarity')).toBe(false);
      
      kernel.use(similarity);
      expect(kernel.has('similarity')).toBe(true);
    });
  });

  describe('Plugin Integration with createWordNet', () => {
    it('should create kernel with plugins', () => {
      const kernelWithPlugins = createWordNet({ 
        core: mockCore, 
        plugins: [similarity, translation] 
      });
      
      expect(kernelWithPlugins.has('similarity')).toBe(true);
      expect(kernelWithPlugins.has('translation')).toBe(true);
    });

    it('should create kernel without plugins', () => {
      const kernelWithoutPlugins = createWordNet({ core: mockCore });
      
      expect(kernelWithoutPlugins.has('similarity')).toBe(false);
      expect(kernelWithoutPlugins.has('translation')).toBe(false);
    });
  });

  describe('Plugin Method Validation', () => {
    beforeEach(() => {
      kernel.use(similarity);
      kernel.use(translation);
    });

    it('should validate similarity plugin methods', () => {
      // Check that similarity methods are available on the kernel
      expect(typeof (kernel as any).path).toBe('function');
      expect(typeof (kernel as any).wup).toBe('function');
      expect(typeof (kernel as any).lch).toBe('function');
      expect(typeof (kernel as any).res).toBe('function');
      expect(typeof (kernel as any).jcn).toBe('function');
      expect(typeof (kernel as any).lin).toBe('function');
    });

    it('should validate translation plugin methods', () => {
      // Check that translation methods are available on the kernel
      expect(typeof (kernel as any).getTranslations).toBe('function');
      expect(typeof (kernel as any).getTranslationsByWord).toBe('function');
      expect(typeof (kernel as any).getAvailableLanguages).toBe('function');
      expect(typeof (kernel as any).getSynsetsByIli).toBe('function');
      expect(typeof (kernel as any).getTranslationConfidence).toBe('function');
      expect(typeof (kernel as any).getTranslationSuggestions).toBe('function');
    });
  });
});
