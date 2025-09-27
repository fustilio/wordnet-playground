import { describe, it, expect, beforeEach } from 'vitest';
import { TranslationHelper, quickTranslate } from '../../src/shared/translation-utils.js';
import type { WordNetCore } from '../../src/wordnet-kernel.js';
import type { Word, Synset, Sense, Lexicon, ILI } from '../../src/core/types.js';

// Mock implementation of WordNetCore for testing
class MockWordNetCore implements WordNetCore {
  async query() { return []; }
  async words() { return []; }
  async word() { 
    return {
      id: 'mock-word',
      lemma: 'computer',
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
  async synsets() { return []; }
  async synset() { 
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
  async senses() { return []; }
  async sense() { 
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
  async ili() { 
    return {
      id: 'mock-ili',
      status: 'standard'
    } as ILI; 
  }
  async ilis() { return []; }
  async synsetsByILI() { return []; }
  async lexicons() { 
    return [
      { id: 'en-lexicon', label: 'English', language: 'en' },
      { id: 'fr-lexicon', label: 'French', language: 'fr' }
    ] as Lexicon[]; 
  }
  async getWord() { return []; }
  async getSynset() { return null; }
  async getSenses() { return []; }
  async getDefinitions() { return []; }
  async getRelations() { return []; }
}

describe('Translation Utilities', () => {
  let mockWordnetClient: WordNetCore;

  beforeEach(() => {
    mockWordnetClient = new MockWordNetCore();
  });

  describe('TranslationHelper', () => {
    it('should create a TranslationHelper instance', () => {
      const helper = new TranslationHelper(mockWordnetClient);
      expect(helper).toBeInstanceOf(TranslationHelper);
    });

    it('should get available languages', async () => {
      const helper = new TranslationHelper(mockWordnetClient);
      const languages = await helper.getAvailableLanguages();
      
      expect(Array.isArray(languages)).toBe(true);
      expect(languages).toContain('en');
      expect(languages).toContain('fr');
    });

    it('should check if language is available', async () => {
      const helper = new TranslationHelper(mockWordnetClient);
      
      expect(await helper.isLanguageAvailable('en')).toBe(true);
      expect(await helper.isLanguageAvailable('fr')).toBe(true);
      expect(await helper.isLanguageAvailable('xyz')).toBe(false);
    });

    it('should translate words between languages', async () => {
      const helper = new TranslationHelper(mockWordnetClient);
      
      const result = await helper.translateWord('computer', {
        sourceLanguage: 'en',
        targetLanguage: 'fr',
        includeDefinitions: true,
        includeExamples: true
      });

      expect(result.sourceWord).toBe('computer');
      expect(result.sourceLanguage).toBe('en');
      expect(result.translations).toBeDefined();
      expect(typeof result.translations).toBe('object');
    });

    it('should get bidirectional translations', async () => {
      const helper = new TranslationHelper(mockWordnetClient);
      
      const result = await helper.getBidirectionalTranslations('computer', 'en', 'fr');
      
      expect(result.en).toBeDefined();
      expect(result.fr).toBeDefined();
      expect(result.en?.sourceWord).toBe('computer');
      expect(result.fr?.sourceWord).toBe('computer');
    });
  });

  describe('quickTranslate', () => {
    it('should provide a simple translation interface', async () => {
      const translations = await quickTranslate(mockWordnetClient, 'computer', 'en', 'fr');
      
      expect(Array.isArray(translations)).toBe(true);
    });
  });
});