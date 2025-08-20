import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { Wordnet } from '../src/wordnet.js';

describe('Basic Wordnet Functionality', () => {
  let wordnet: Wordnet;

  beforeEach(() => {
    wordnet = new Wordnet('*');
  });

  afterEach(async () => {
    await wordnet.close();
  });

  it('should create a Wordnet instance', () => {
    expect(wordnet).toBeInstanceOf(Wordnet);
  });

  it('should have default normalizer and lemmatizer', () => {
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
    const word = await wordnet.getWord('non-existent-word-id');
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
    expect(stats).toHaveProperty('totalLexicons');
  });
});
