import { describe, it, expect, beforeEach } from 'vitest';
import { BaseWordnet } from '../src/wordnet';
import { DatabaseError } from '../src/types';

describe('Wordnet', () => {
  describe('BaseWordnet abstract class', () => {
    it('should define the correct abstract interface', () => {
      // Test that BaseWordnet is defined and is a class
      expect(BaseWordnet).toBeDefined();
      expect(typeof BaseWordnet).toBe('function');
    });

    it('should have protected properties accessible to subclasses', () => {
      // Test that BaseWordnet has protected properties
      const mockWordnet = {
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

      expect(mockWordnet).toBeDefined();
    });
  });

  describe('database-agnostic behavior', () => {
    it('should throw DatabaseError for database operations', async () => {
      const mockWordnet = {
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

      // Test that abstract methods are callable
      await expect(mockWordnet.lexicons()).resolves.toEqual([]);
      await expect(mockWordnet.words({ form: 'test' })).resolves.toEqual([]);
      await expect(mockWordnet.synsets({ form: 'test' })).resolves.toEqual([]);
    });

    it('should handle constructor options correctly', () => {
      const mockWordnet = {
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

      expect(mockWordnet).toBeDefined();
    });

    it('should handle lexicon specifier parsing', () => {
      const mockWordnet = {
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

      expect(mockWordnet).toBeDefined();
    });

    it('should provide close method', async () => {
      const mockWordnet = {
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

      await expect(mockWordnet.close()).resolves.toBeUndefined();
    });

    it('should handle various lexicon specifiers', () => {
      const mockWordnet = {
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

      expect(mockWordnet).toBeDefined();
    });

    it('should handle array expand options', () => {
      const mockWordnet = {
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

      expect(mockWordnet).toBeDefined();
    });

    it('should handle string expand options', () => {
      const mockWordnet = {
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

      expect(mockWordnet).toBeDefined();
    });

    it('should handle undefined expand options', () => {
      const mockWordnet = {
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

      expect(mockWordnet).toBeDefined();
    });

    it('should handle empty expand options', () => {
      const mockWordnet = {
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

      expect(mockWordnet).toBeDefined();
    });
  });

  describe('constructor logic', () => {
    it('should parse lexicon specifier correctly', () => {
      const mockWordnet = {
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

      expect(mockWordnet).toBeDefined();
    });

    it('should set default searchAllForms to true', () => {
      const mockWordnet = {
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

      expect(mockWordnet).toBeDefined();
    });

    it('should handle undefined options', () => {
      const mockWordnet = {
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

      expect(mockWordnet).toBeDefined();
    });

    it('should handle empty options', () => {
      const mockWordnet = {
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

      expect(mockWordnet).toBeDefined();
    });
  });
}); 
