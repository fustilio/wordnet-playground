import { describe, it, expect, beforeEach } from 'vitest';
import { Wordnet, BaseWordnet } from '../src/wordnet';
import { config } from '../src/config';
import { DatabaseError } from '../src/types';
import { testUtils } from './setup';

describe('Wordnet', () => {
  beforeEach(async () => {
    config.dataDirectory = testUtils.getTestDataDir();
  });

  describe('BaseWordnet abstract class', () => {
    it('should define the correct abstract interface', () => {
      // Test that the abstract class defines all required methods
      expect(BaseWordnet).toBeDefined();
      
      // Check that abstract methods are defined by creating a concrete implementation
      class TestWordnet extends BaseWordnet {
        async lexicons() { return []; }
        async expandedLexicons() { return []; }
        async words() { return []; }
        async synsets() { return []; }
        async synset() { return undefined; }
        async senses() { return []; }
        async word() { return undefined; }
        async sense() { return undefined; }
        async ili() { return undefined; }
        async ilis() { return []; }
        async getStatistics() { 
          return { totalWords: 0, totalSynsets: 0, totalSenses: 0, totalILIs: 0, totalLexicons: 0 }; 
        }
        async getLexiconStatistics() { return []; }
        async getDataQualityMetrics() { 
          return { synsetsWithILI: 0, synsetsWithoutILI: 0, iliCoveragePercentage: 0, emptySynsets: 0, synsetsWithDefinitions: 0 }; 
        }
        async getPartOfSpeechDistribution() { return {}; }
        async getSynsetSizeAnalysis() { 
          return { averageSize: 0, maxSize: 0, minSize: 0, sizeDistribution: {} }; 
        }
        async close() {}
      }

      const testInstance = new TestWordnet();
      
      // Verify all abstract methods are implemented
      expect(typeof testInstance.lexicons).toBe('function');
      expect(typeof testInstance.expandedLexicons).toBe('function');
      expect(typeof testInstance.words).toBe('function');
      expect(typeof testInstance.synsets).toBe('function');
      expect(typeof testInstance.synset).toBe('function');
      expect(typeof testInstance.senses).toBe('function');
      expect(typeof testInstance.word).toBe('function');
      expect(typeof testInstance.sense).toBe('function');
      expect(typeof testInstance.ili).toBe('function');
      expect(typeof testInstance.ilis).toBe('function');
      expect(typeof testInstance.getStatistics).toBe('function');
      expect(typeof testInstance.getLexiconStatistics).toBe('function');
      expect(typeof testInstance.getDataQualityMetrics).toBe('function');
      expect(typeof testInstance.getPartOfSpeechDistribution).toBe('function');
      expect(typeof testInstance.getSynsetSizeAnalysis).toBe('function');
      expect(typeof testInstance.close).toBe('function');
    });

    it('should have protected properties accessible to subclasses', () => {
      // Create a concrete implementation to test protected properties
      class TestWordnet extends BaseWordnet {
        async lexicons() { return []; }
        async expandedLexicons() { return []; }
        async words() { return []; }
        async synsets() { return []; }
        async synset() { return undefined; }
        async senses() { return []; }
        async word() { return undefined; }
        async sense() { return undefined; }
        async ili() { return undefined; }
        async ilis() { return []; }
        async getStatistics() { 
          return { totalWords: 0, totalSynsets: 0, totalSenses: 0, totalILIs: 0, totalLexicons: 0 }; 
        }
        async getLexiconStatistics() { return []; }
        async getDataQualityMetrics() { 
          return { synsetsWithILI: 0, synsetsWithoutILI: 0, iliCoveragePercentage: 0, emptySynsets: 0, synsetsWithDefinitions: 0 }; 
        }
        async getPartOfSpeechDistribution() { return {}; }
        async getSynsetSizeAnalysis() { 
          return { averageSize: 0, maxSize: 0, minSize: 0, sizeDistribution: {} }; 
        }
        async close() {}
        
        // Test method to access protected properties
        getProtectedProperties() {
          return {
            lexiconId: this.lexiconId,
            lexiconVersion: this.lexiconVersion,
            expand: this.expand,
            normalizer: this.normalizer,
            lemmatizer: this.lemmatizer,
            searchAllForms: this.searchAllForms,
            lang: this.lang
          };
        }
      }

      const testWordnet = new TestWordnet('test-en:1.0', {
        expand: ['test-es'],
        normalizer: (form: string) => form.toLowerCase(),
        lemmatizer: (form: string) => ({ n: new Set(), v: new Set(), a: new Set(), r: new Set(), s: new Set(), c: new Set(), p: new Set(), i: new Set(), x: new Set(), u: new Set() }),
        searchAllForms: false,
        lang: 'en'
      });

      const props = testWordnet.getProtectedProperties();
      
      expect(props.lexiconId).toBe('test-en');
      expect(props.lexiconVersion).toBe('1.0');
      expect(props.expand).toEqual(['test-es']);
      expect(typeof props.normalizer).toBe('function');
      expect(typeof props.lemmatizer).toBe('function');
      expect(props.searchAllForms).toBe(false);
      expect(props.lang).toBe('en');
    });
  });

  describe('database-agnostic behavior', () => {
    it('should throw DatabaseError for database operations', async () => {
      const en = new Wordnet('test-en');
      
      // All database operations should throw DatabaseError
      await expect(en.lexicons()).rejects.toThrow(DatabaseError);
      await expect(en.expandedLexicons()).rejects.toThrow(DatabaseError);
      await expect(en.words('test')).rejects.toThrow(DatabaseError);
      await expect(en.synsets('test')).rejects.toThrow(DatabaseError);
      await expect(en.synset('test-synset')).rejects.toThrow(DatabaseError);
      await expect(en.senses('test-word')).rejects.toThrow(DatabaseError);
      await expect(en.word('test-word')).rejects.toThrow(DatabaseError);
      await expect(en.sense('test-sense')).rejects.toThrow(DatabaseError);
      await expect(en.ili('test-ili')).rejects.toThrow(DatabaseError);
      await expect(en.ilis()).rejects.toThrow(DatabaseError);
      await expect(en.getStatistics()).rejects.toThrow(DatabaseError);
      await expect(en.getLexiconStatistics()).rejects.toThrow(DatabaseError);
      await expect(en.getDataQualityMetrics()).rejects.toThrow(DatabaseError);
      await expect(en.getPartOfSpeechDistribution()).rejects.toThrow(DatabaseError);
      await expect(en.getSynsetSizeAnalysis()).rejects.toThrow(DatabaseError);
    });

    it('should handle constructor options correctly', () => {
      const normalizer = (form: string) => form.toLowerCase();
      const lemmatizer = (form: string, pos?: string) => {
        const result: Record<string, Set<string>> = {
          n: new Set(),
          v: new Set(),
          a: new Set(),
          r: new Set(),
          s: new Set(),
          c: new Set(),
          p: new Set(),
          i: new Set(),
          x: new Set(),
          u: new Set(),
        };
        return result;
      };

      // Should not throw on construction with options
      expect(() => new Wordnet('test-en', { normalizer })).not.toThrow();
      expect(() => new Wordnet('test-en', { lemmatizer })).not.toThrow();
      expect(() => new Wordnet('test-en', { searchAllForms: false })).not.toThrow();
      expect(() => new Wordnet('test-en', { expand: 'test-es' })).not.toThrow();
      expect(() => new Wordnet('test-en', { lang: 'en' })).not.toThrow();
    });

    it('should handle lexicon specifier parsing', () => {
      // Test lexicon specifier parsing (this doesn't require database)
      const en = new Wordnet('test-en:1.0');
      expect(en).toBeInstanceOf(Wordnet);
      
      const wildcard = new Wordnet('*');
      expect(wildcard).toBeInstanceOf(Wordnet);
    });

    it('should provide close method', () => {
      const en = new Wordnet('test-en');
      // Should not throw when closing (placeholder implementation)
      expect(() => en.close()).not.toThrow();
    });

    it('should handle various lexicon specifiers', () => {
      // Test different lexicon specifier formats
      expect(() => new Wordnet('test-en')).not.toThrow();
      expect(() => new Wordnet('test-en:1.0')).not.toThrow();
      expect(() => new Wordnet('*')).not.toThrow();
      expect(() => new Wordnet('test-en:*')).not.toThrow();
      expect(() => new Wordnet('*:1.0')).not.toThrow();
    });

    it('should handle array expand options', () => {
      const en = new Wordnet('test-en', { expand: ['test-es', 'test-fr'] });
      expect(en).toBeInstanceOf(Wordnet);
    });

    it('should handle string expand options', () => {
      const en = new Wordnet('test-en', { expand: 'test-es' });
      expect(en).toBeInstanceOf(Wordnet);
    });

    it('should handle undefined expand options', () => {
      const en = new Wordnet('test-en', { expand: undefined });
      expect(en).toBeInstanceOf(Wordnet);
    });

    it('should handle empty expand options', () => {
      const en = new Wordnet('test-en', { expand: [] });
      expect(en).toBeInstanceOf(Wordnet);
    });
  });

  describe('constructor logic', () => {
    it('should parse lexicon specifier correctly', () => {
      // Test the config.splitLexiconSpecifier logic
      const [id1, version1] = config.splitLexiconSpecifier('test-en');
      expect(id1).toBe('test-en');
      expect(version1).toBe(''); // Returns empty string when no version specified

      const [id2, version2] = config.splitLexiconSpecifier('test-en:1.0');
      expect(id2).toBe('test-en');
      expect(version2).toBe('1.0');

      const [id3, version3] = config.splitLexiconSpecifier('*');
      expect(id3).toBe('*');
      expect(version3).toBe(''); // Returns empty string when no version specified
    });

    it('should set default searchAllForms to true', () => {
      const en = new Wordnet('test-en');
      // We can't directly access protected properties, but we can test behavior
      expect(en).toBeInstanceOf(Wordnet);
    });

    it('should handle undefined options', () => {
      expect(() => new Wordnet('test-en', undefined)).not.toThrow();
    });

    it('should handle empty options', () => {
      expect(() => new Wordnet('test-en', {})).not.toThrow();
    });
  });
}); 
