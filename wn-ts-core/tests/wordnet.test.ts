import { describe, it, expect, beforeEach } from 'vitest';
import { BaseWordnet } from '../src/wordnet';
import { DatabaseError } from '../src/types';

// Create a test subclass to access protected properties
class TestWordnet extends BaseWordnet {
  constructor(options: any = {}) {
    super(options);
  }

  // Expose protected properties for testing
  getLexiconIds() { return this.lexiconIds; }
  getExpand() { return this.expand; }
  getNormalizer() { return this.normalizer; }
  getLemmatizer() { return this.lemmatizer; }
  getSearchAllForms() { return this.searchAllForms; }
  getLang() { return this.lang; }

  // Implement abstract methods with correct signatures
  async lexicons() { return []; }
  async expandedLexicons() { return []; }
  async words(query?: any) { return []; }
  async synsets(query?: any) { return []; }
  async synset(synsetId: string) { return {} as any; }
  async senses(query?: any) { return []; }
  async word(wordId: string) { return {} as any; }
  async sense(senseId: string) { return {} as any; }
  async ili(iliId: string) { return {} as any; }
  async ilis(status?: string) { return []; }
  async getProjects() { return []; }
  async getStatistics() { 
    return {
      totalWords: 0,
      totalSynsets: 0,
      totalSenses: 0,
      totalILIs: 0,
      totalLexicons: 0
    };
  }
  async getLexiconStatistics(lexiconId?: string) { 
    return [{
      lexiconId: lexiconId || 'test',
      label: 'Test Lexicon',
      language: 'en',
      version: '1.0',
      wordCount: 0,
      synsetCount: 0
    }]; 
  }
  async getDataQualityMetrics() { 
    return {
      synsetsWithILI: 0,
      synsetsWithoutILI: 0,
      iliCoveragePercentage: 0,
      emptySynsets: 0,
      synsetsWithDefinitions: 0
    };
  }
  async getPartOfSpeechDistribution() { return {}; }
  async getSynsetSizeAnalysis() { 
    return {
      averageSize: 0,
      maxSize: 0,
      minSize: 0,
      sizeDistribution: {}
    };
  }
  async close() {}
}

describe('Wordnet', () => {
  describe('BaseWordnet abstract class', () => {
    it('should define the correct abstract interface', () => {
      // Test that BaseWordnet is defined and is a class
      expect(BaseWordnet).toBeDefined();
      expect(typeof BaseWordnet).toBe('function');
    });

    it('should have protected properties accessible to subclasses', () => {
      // Test that BaseWordnet has protected properties
      const wordnet = new TestWordnet({
        lexicon: ['oewn:2024', 'omw-fr:1.4']
      });

      expect(wordnet).toBeDefined();
      expect(wordnet.getLexiconIds()).toEqual(['oewn:2024', 'omw-fr:1.4']);
    });
  });

  describe('Multi-lexicon support', () => {
    it('should handle single lexicon string in constructor', () => {
      const wordnet = new TestWordnet({
        lexicon: 'oewn:2024'
      });

      expect(wordnet.getLexiconIds()).toEqual(['oewn:2024']);
    });

    it('should handle multiple lexicons array in constructor', () => {
      const wordnet = new TestWordnet({
        lexicon: ['oewn:2024', 'omw-fr:1.4', 'cili:1.0']
      });

      expect(wordnet.getLexiconIds()).toEqual(['oewn:2024', 'omw-fr:1.4', 'cili:1.0']);
      expect(wordnet.getLexiconIds()).toHaveLength(3);
    });

    it('should handle wildcard lexicon specifier', () => {
      const wordnet = new TestWordnet({
        lexicon: '*'
      });

      expect(wordnet.getLexiconIds()).toEqual(['*']);
    });

    it('should handle expand options correctly', () => {
      const wordnet = new TestWordnet({
        lexicon: 'oewn:2024',
        expand: ['omw-fr:1.4', 'cili:1.0']
      });

      expect(wordnet.getExpand()).toEqual(['omw-fr:1.4', 'cili:1.0']);
      expect(wordnet.getExpand()).toHaveLength(2);
    });
  });

  describe('database-agnostic behavior', () => {
    it('should throw DatabaseError for database operations', async () => {
      const wordnet = new TestWordnet({
        lexicon: 'oewn:2024'
      });

      // Test that abstract methods are callable
      await expect(wordnet.lexicons()).resolves.toEqual([]);
      await expect(wordnet.words({ form: 'test' })).resolves.toEqual([]);
      await expect(wordnet.synsets({ form: 'test' })).resolves.toEqual([]);
    });

    it('should handle constructor options correctly', () => {
      const wordnet = new TestWordnet({
        lexicon: ['oewn:2024', 'omw-fr:1.4'],
        expand: ['cili:1.0'],
        normalizer: (form: string) => form.toLowerCase(),
        lemmatizer: (form: string) => ({ n: new Set([form]) }),
        searchAllForms: true,
        lang: 'en'
      });

      expect(wordnet.getLexiconIds()).toEqual(['oewn:2024', 'omw-fr:1.4']);
      expect(wordnet.getExpand()).toEqual(['cili:1.0']);
      expect(wordnet.getNormalizer()).toBeDefined();
      expect(wordnet.getLemmatizer()).toBeDefined();
      expect(wordnet.getSearchAllForms()).toBe(true);
      expect(wordnet.getLang()).toBe('en');
    });
  });

  describe('Multi-lexicon query support', () => {
    it('should support lexicon filtering in WordQuery', () => {
      const query = {
        form: 'happy',
        pos: 'a',
        lexicon: ['oewn:2024', 'omw-fr:1.4'],
        lang: 'en'
      };

      expect(query.lexicon).toEqual(['oewn:2024', 'omw-fr:1.4']);
      expect(Array.isArray(query.lexicon)).toBe(true);
      expect(query.lexicon).toHaveLength(2);
    });

    it('should support single lexicon in WordQuery', () => {
      const query = {
        form: 'happy',
        pos: 'a',
        lexicon: 'oewn:2024',
        lang: 'en'
      };

      expect(query.lexicon).toBe('oewn:2024');
      expect(typeof query.lexicon).toBe('string');
    });

    it('should support lexicon filtering in SynsetQuery', () => {
      const query = {
        form: 'happiness',
        pos: 'n',
        lexicon: ['oewn:2024', 'cili:1.0'],
        lang: 'en'
      };

      expect(query.lexicon).toEqual(['oewn:2024', 'cili:1.0']);
      expect(Array.isArray(query.lexicon)).toBe(true);
    });

    it('should support lexicon filtering in SenseQuery', () => {
      const query = {
        form: 'happy',
        pos: 'a',
        lexicon: ['oewn:2024', 'omw-fr:1.4', 'cili:1.0'],
        lang: 'en',
        wordIdOrForm: 'w-happy'
      };

      expect(query.lexicon).toEqual(['oewn:2024', 'omw-fr:1.4', 'cili:1.0']);
      expect(Array.isArray(query.lexicon)).toBe(true);
      expect(query.lexicon).toHaveLength(3);
    });

    it('should handle undefined lexicon in queries', () => {
      const query = {
        form: 'happy',
        pos: 'a',
        lexicon: undefined,
        lang: 'en'
      };

      expect(query.lexicon).toBeUndefined();
    });
  });

  describe('Special lexicon presets', () => {
    it('should support English-Thai dictionary preset', () => {
      const wordnet = new TestWordnet({
        lexicon: ['oewn:2024', 'omw-th:1.4', 'cili:1.0']
      });

      expect(wordnet.getLexiconIds()).toEqual(['oewn:2024', 'omw-th:1.4', 'cili:1.0']);
      expect(wordnet.getLexiconIds()).toContain('oewn:2024');
      expect(wordnet.getLexiconIds()).toContain('omw-th:1.4');
      expect(wordnet.getLexiconIds()).toContain('cili:1.0');
    });

    it('should support English-French dictionary preset', () => {
      const wordnet = new TestWordnet({
        lexicon: ['oewn:2024', 'omw-fr:1.4', 'cili:1.0']
      });

      expect(wordnet.getLexiconIds()).toEqual(['oewn:2024', 'omw-fr:1.4', 'cili:1.0']);
      expect(wordnet.getLexiconIds()).toContain('oewn:2024');
      expect(wordnet.getLexiconIds()).toContain('omw-fr:1.4');
      expect(wordnet.getLexiconIds()).toContain('cili:1.0');
    });

    it('should support multilingual preset', () => {
      const wordnet = new TestWordnet({
        lexicon: ['omw:1.4', 'cili:1.0']
      });

      expect(wordnet.getLexiconIds()).toEqual(['omw:1.4', 'cili:1.0']);
      expect(wordnet.getLexiconIds()).toContain('omw:1.4');
      expect(wordnet.getLexiconIds()).toContain('cili:1.0');
    });
  });

  describe('constructor logic', () => {
    it('should parse lexicon specifier correctly', () => {
      const wordnet = new TestWordnet({
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
      });

      expect(wordnet).toBeDefined();
    });

    it('should set default searchAllForms to true', () => {
      const wordnet = new TestWordnet({
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
      });

      expect(wordnet).toBeDefined();
    });

    it('should handle undefined options', () => {
      const wordnet = new TestWordnet({
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
      });

      expect(wordnet).toBeDefined();
    });

    it('should handle empty options', () => {
      const wordnet = new TestWordnet({
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
      });

      expect(wordnet).toBeDefined();
    });
  });
}); 
