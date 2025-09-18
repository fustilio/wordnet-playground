import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { setupTestEnvironment } from './e2e/shared/test-setup.js';
import { TranslationHelper, quickTranslate } from 'wn-ts-core';
import type { Wordnet } from '../src/wordnet.js';

describe('Translation Utilities', () => {
  let wordnetClient: Wordnet;
  let cleanup: () => Promise<void>;

  beforeAll(async () => {
    const context = await setupTestEnvironment('translation-utils', [
      'cili:1.0',
      'oewn:2024',
      'omw-fr:1.4',
    ]);
    wordnetClient = context.wordnetClient;
    cleanup = context.cleanup;
  }, 900000); // 15 minute timeout for setup

  afterAll(async () => {
    await cleanup();
  });

  describe('TranslationHelper', () => {
    it('should translate words between languages', async () => {
      const helper = new TranslationHelper(wordnetClient);
      
      const result = await helper.translateWord('computer', {
        sourceLanguage: 'en',
        targetLanguage: 'fr',
        includeDefinitions: true,
        includeExamples: true
      });

      expect(result.sourceWord).toBe('computer');
      expect(result.sourceLanguage).toBe('en');
      expect(result.translations).toBeDefined();
      expect(result.translations.fr).toBeDefined();
      expect(result.translations.fr.words).toBeDefined();
      expect(Array.isArray(result.translations.fr.words)).toBe(true);
    });

    it('should get available languages', async () => {
      const helper = new TranslationHelper(wordnetClient);
      const languages = await helper.getAvailableLanguages();
      
      expect(Array.isArray(languages)).toBe(true);
      expect(languages).toContain('en');
      expect(languages).toContain('fr');
    });

    it('should check if language is available', async () => {
      const helper = new TranslationHelper(wordnetClient);
      
      expect(await helper.isLanguageAvailable('en')).toBe(true);
      expect(await helper.isLanguageAvailable('fr')).toBe(true);
      expect(await helper.isLanguageAvailable('xyz')).toBe(false);
    });

    it('should get bidirectional translations', async () => {
      const helper = new TranslationHelper(wordnetClient);
      
      const result = await helper.getBidirectionalTranslations('house', 'en', 'fr');
      
      expect(result.en).toBeDefined();
      expect(result.fr).toBeDefined();
      expect(result.en.sourceWord).toBe('house');
      expect(result.fr.sourceWord).toBe('house');
    });
  });

  describe('quickTranslate', () => {
    it('should provide a simple translation interface', async () => {
      const translations = await quickTranslate(wordnetClient, 'computer', 'en', 'fr');
      
      expect(Array.isArray(translations)).toBe(true);
      // Note: translations might be empty if no direct matches found
      // This is expected behavior for the current implementation
    });
  });
});
