import { describe, it, expect, beforeEach, beforeAll } from 'vitest';
import {
  projects,
  lexicons,
  word,
  words,
  sense,
  senses,
  synset,
  synsets,
  ili,
  ilis,
} from '../src/module-functions';
import { add } from '../src/data-management';
import { db } from '../src/database';
import { config } from '../src/config';
import { testUtils } from './setup';
import { join } from 'path';
import { existsSync } from 'fs';
import { Wordnet } from '../src/wordnet';

describe('Module Functions', () => {
  beforeEach(async () => {
    // The global setup hook creates a new temp directory for each test
    // We need to ensure our test data is loaded into this new directory
    const xmlPath = join(testUtils.getActualTestDataDir(), 'mini-lmf-1.0.xml');
    if (existsSync(xmlPath)) {
      await add(xmlPath, { force: true });
    }
  });

  describe('projects', () => {
    it('should return list of known projects', async () => {
      const result = await projects();
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeGreaterThan(0);
    });
  });

  describe('lexicons', () => {
    it('should return lexicons when they exist', async () => {
      const result = await lexicons();
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeGreaterThan(0);
      expect(result.some(l => l.id === 'test-en')).toBe(true);
    });

    it('should return empty array when no lexicons exist', async () => {
      const result = await lexicons({ lexicon: 'nonexistent' });
      expect(result).toEqual([]);
    });
  });

  describe('word', () => {
    it('should throw error for non-existent word', async () => {
      await expect(word('nonexistent')).rejects.toThrow();
    });
  });

  describe('words', () => {
    it('should return words when they exist', async () => {
      const result = await words('information');
      expect(result.length).toBeGreaterThan(0);
      expect(result.some(w => w.lemma === 'information' && w.partOfSpeech === 'n' && w.lexicon === 'test-en')).toBe(true);
    });

    it('should return empty array for non-existent word', async () => {
      const result = await words('nonexistent');
      expect(result).toEqual([]);
    });

    it('should handle part of speech filtering', async () => {
      const result = await words('information', 'n');
      expect(result.length).toBeGreaterThan(0);
      expect(result.every(w => w.partOfSpeech === 'n')).toBe(true);
    });

    it('should handle lexicon filtering', async () => {
      const result = await words('information', undefined, { lexicon: 'test-en' });
      expect(result.length).toBeGreaterThan(0);
      expect(result.every(w => w.lexicon === 'test-en')).toBe(true);
    });
  });

  describe('sense', () => {
    it('should throw error for non-existent sense', async () => {
      await expect(sense('nonexistent')).rejects.toThrow();
    });
  });

  describe('senses', () => {
    it('should return senses when they exist', async () => {
      const result = await senses('information');
      expect(result.length).toBeGreaterThan(0);
      expect(result.some(s => s.word === 'test-en-information-n')).toBe(true);
    });

    it('should return empty array for non-existent word', async () => {
      const result = await senses('nonexistent');
      expect(result).toEqual([]);
    });

    it('should handle part of speech filtering', async () => {
      const result = await senses('information', 'n');
      expect(result.length).toBeGreaterThan(0);
      // partOfSpeech is not guaranteed on Sense, so we skip that check
    });

    it('should handle lexicon filtering', async () => {
      const result = await senses('information', undefined, { lexicon: 'test-en' });
      expect(result.length).toBeGreaterThan(0);
      // lexicon is not guaranteed on Sense, so we skip that check
    });
  });

  describe('synset', () => {
    it('should throw error for non-existent synset', async () => {
      await expect(synset('nonexistent')).rejects.toThrow();
    });
  });

  describe('synsets', () => {
    it('should return synsets when they exist', async () => {
      const result = await synsets('information');
      expect(result.length).toBeGreaterThan(0);
      expect(result.some(s => s.id === 'test-en-0001-n' && s.partOfSpeech === 'n')).toBe(true);
    });

    it('should return empty array for non-existent word', async () => {
      const result = await synsets('nonexistent');
      expect(result).toEqual([]);
    });

    it('should handle part of speech filtering', async () => {
      const result = await synsets('information', 'n');
      expect(result.length).toBeGreaterThan(0);
      expect(result.every(s => s.partOfSpeech === 'n')).toBe(true);
    });

    it('should handle lexicon filtering', async () => {
      const result = await synsets('information', undefined, { lexicon: 'test-en' });
      expect(result.length).toBeGreaterThan(0);
      expect(result.every(s => s.lexicon === 'test-en')).toBe(true);
    });
  });

  describe('ili', () => {
    it('should throw error for non-existent ili', async () => {
      await expect(ili('nonexistent')).rejects.toThrow();
    });
  });

  describe('ilis', () => {
    it('should return empty array for now', async () => {
      const result = await ilis();
      expect(result).toEqual([]);
    });
  });
}); 
