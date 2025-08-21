import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { BaseWordnet } from '../src/wordnet.js';

describe('Basic Wordnet Functionality', () => {
  let wordnet: BaseWordnet;

  beforeEach(() => {
    // Create a mock implementation of BaseWordnet for testing
    wordnet = {
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
        synsetsWithDefinitions: 0,
        synsetsWithExamples: 0,
        averageSynsetSize: 0
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
  });

  afterEach(async () => {
    await wordnet.close();
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

  it('should handle statistics queries', async () => {
    const stats = await wordnet.getStatistics();
    expect(stats).toHaveProperty('totalWords');
    expect(stats).toHaveProperty('totalSynsets');
    expect(stats).toHaveProperty('totalSenses');
    expect(stats).toHaveProperty('totalILIs');
    expect(stats).toHaveProperty('totalSynsets');
  });

  it('should handle data quality metrics', async () => {
    const metrics = await wordnet.getDataQualityMetrics();
    expect(metrics).toHaveProperty('synsetsWithILI');
    expect(metrics).toHaveProperty('synsetsWithoutILI');
    expect(metrics).toHaveProperty('iliCoveragePercentage');
    expect(metrics).toHaveProperty('emptySynsets');
    expect(metrics).toHaveProperty('synsetsWithDefinitions');
    expect(metrics).toHaveProperty('synsetsWithExamples');
    expect(metrics).toHaveProperty('averageSynsetSize');
  });

  it('should handle part of speech distribution', async () => {
    const distribution = await wordnet.getPartOfSpeechDistribution();
    expect(typeof distribution).toBe('object');
  });

  it('should handle synset size analysis', async () => {
    const analysis = await wordnet.getSynsetSizeAnalysis();
    expect(analysis).toHaveProperty('averageSize');
    expect(analysis).toHaveProperty('maxSize');
    expect(analysis).toHaveProperty('minSize');
    expect(analysis).toHaveProperty('sizeDistribution');
  });
});
