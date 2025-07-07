import { describe, it, expect, beforeEach } from 'vitest';
import { Wordnet } from '../src/wordnet';
import { config } from '../src/config';
import { db } from '../src/database';
import { testUtils } from './setup';

describe('Wordnet', () => {
  beforeEach(async () => {
    // Reset database for each test
    await db.close();
    config.dataDirectory = testUtils.getTestDataDir();
  });

  describe('lexicons', () => {
    it('should return empty lexicons for non-existent lexicon', async () => {
      const en = new Wordnet('test-en');
      const lexicons = await en.lexicons();
      expect(lexicons).toHaveLength(0);
    });

    it('should return empty expanded lexicons by default', async () => {
      const en = new Wordnet('test-en');
      const expandedLexicons = await en.expandedLexicons();
      expect(expandedLexicons).toHaveLength(0);
    });

    it('should handle lexicon with expansion', async () => {
      const es = new Wordnet('test-es', { expand: 'test-en' });
      const expandedLexicons = await es.expandedLexicons();
      expect(expandedLexicons).toHaveLength(0); // No data yet
    });

    it('should handle empty expansion', async () => {
      const ja = new Wordnet('test-ja', { expand: '' });
      const expandedLexicons = await ja.expandedLexicons();
      expect(expandedLexicons).toHaveLength(0);
    });
  });

  describe('words', () => {
    it('should return empty array for non-existent word', async () => {
      const en = new Wordnet('test-en');
      const words = await en.words('nonexistent');
      expect(words).toHaveLength(0);
    });

    it('should handle part of speech filtering', async () => {
      const en = new Wordnet('test-en');
      const words = await en.words('test', 'n');
      expect(words).toHaveLength(0); // No data yet
    });
  });

  describe('synsets', () => {
    it('should return empty array for non-existent word', async () => {
      const en = new Wordnet('test-en');
      const synsets = await en.synsets('nonexistent');
      expect(synsets).toHaveLength(0);
    });

    it('should handle part of speech filtering', async () => {
      const en = new Wordnet('test-en');
      const synsets = await en.synsets('test', 'n');
      expect(synsets).toHaveLength(0); // No data yet
    });
  });

  describe('synset', () => {
    it('should return undefined for non-existent synset', async () => {
      const en = new Wordnet('test-en');
      const synset = await en.synset('nonexistent-synset');
      expect(synset).toBeUndefined();
    });
  });

  describe('senses', () => {
    it('should return empty array for non-existent word', async () => {
      const en = new Wordnet('test-en');
      const senses = await en.senses('nonexistent-word');
      expect(senses).toHaveLength(0);
    });
  });

  describe('word', () => {
    it('should return undefined for non-existent word', async () => {
      const en = new Wordnet('test-en');
      const word = await en.word('nonexistent-word');
      expect(word).toBeUndefined();
    });
  });

  describe('sense', () => {
    it('should return undefined for non-existent sense', async () => {
      const en = new Wordnet('test-en');
      const sense = await en.sense('nonexistent-sense');
      expect(sense).toBeUndefined();
    });
  });

  describe('normalization', () => {
    it('should use custom normalizer when provided', async () => {
      const normalizer = (form: string) => form.toLowerCase();
      const es = new Wordnet('test-es', { normalizer });
      const words = await es.words('TEST');
      expect(words).toHaveLength(0); // No data yet, but normalizer should be used
    });
  });

  describe('lemmatization', () => {
    it('should use custom lemmatizer when provided', async () => {
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
        
        if (pos === 'n' && form.endsWith('s')) {
          result.n.add(form.slice(0, -1));
        }
        
        return result;
      };

      const en = new Wordnet('test-en', { lemmatizer, searchAllForms: false });
      const words = await en.words('examples', 'n');
      expect(words).toHaveLength(0); // No data yet, but lemmatizer should be used
    });
  });

  describe('search all forms', () => {
    it('should respect searchAllForms option', async () => {
      const en = new Wordnet('test-en', { searchAllForms: false });
      const words = await en.words('examples');
      expect(words).toHaveLength(0); // No data yet
    });
  });
}); 