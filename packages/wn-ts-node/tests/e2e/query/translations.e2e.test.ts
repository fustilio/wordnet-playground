import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { setupTestEnvironment } from '../shared/test-setup.js';
import { logger } from 'wn-ts-core/utils';
import type { Wordnet } from '../../src/wordnet.js';
import type { Word } from 'wn-ts-core';
import type { PartOfSpeech } from 'wn-ts-core';

class PolylingualDictionary {
  constructor(private wordnetClient: Wordnet) {}

  async findCognates(word: string, languages: string[] = ['en', 'fr', 'es']) {
    const cognates: Record<string, string[]> = {};

    for (const lang of languages) {
      try {
        const words = await this.wordnetClient.words({
          form: word,
          language: lang,
          fuzzy: true,
        });
        if (words.length > 0) {
          cognates[lang] = words.map(w => w.lemma);
        }
      } catch (error) {
        // Language not available, skip
        logger.warn(`Language ${lang} not available for cognate search`);
      }
    }

    return cognates;
  }

  async getTranslations(concept: string, sourceLanguage: string = 'en') {
    // Find source language synsets
    const sourceSynsets = await this.wordnetClient.synsets({
      form: concept,
      language: sourceLanguage,
    });

    const translations: Record<string, string[]> = {};

    for (const synset of sourceSynsets) {
      if (synset.ili) {
        // Find translations in all available languages
        const availableLanguages = ['en', 'fr', 'es', 'de', 'it'];

        for (const lang of availableLanguages) {
          if (lang !== sourceLanguage) {
            try {
              const words = await this.wordnetClient.getWordsByIliAndLanguage(
                synset.ili,
                lang
              );
              if (words.length > 0) {
                if (!translations[lang]) translations[lang] = [];
                translations[lang].push(...words.map(w => w.lemma));
              }
            } catch (error) {
              // Language not available, skip
              logger.warn(`Language ${lang} not available for ILI ${synset.ili}`);
            }
          }
        }
      }
    }

    return translations;
  }

  async getCulturalContext(concept: string) {
    const contexts: Record<string, any> = {};

    // Get synsets in different languages
    const languages = ['en', 'fr', 'es'];
    for (const lang of languages) {
      try {
        const synsets = await this.wordnetClient.synsets({
          form: concept,
          language: lang,
        });

        if (synsets.length > 0) {
          contexts[lang] = {
            definitions: synsets[0]?.definitions || [],
            examples: synsets[0]?.examples || [],
            relatedConcepts: synsets[0]?.relations || [],
          };
        }
      } catch (error) {
        // Language not available, skip
        logger.warn(`Language ${lang} not available for cultural context`);
      }
    }

    return contexts;
  }
}
describe('Translation Queries', () => {
  let wordnetClient: Wordnet;
  let cleanup: () => Promise<void>;

  beforeAll(async () => {
    const context = await setupTestEnvironment('translations', [
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

  describe('Cross-Language Word Discovery', () => {
    it('should find words across different languages', async () => {
      logger.info('🌍 Testing cross-language word discovery...');

      // Test English words
      const enWords = await wordnetClient.words({ form: 'computer', language: 'en' });
      expect(enWords.length).toBeGreaterThan(0);
      expect(enWords.every(w => w.language === 'en')).toBe(true);

      // Test French words
      const frWords = await wordnetClient.words({ form: 'ordinateur', language: 'fr' });
      expect(frWords.length).toBeGreaterThan(0);
      expect(frWords.every(w => w.language === 'fr')).toBe(true);

      logger.success(
        `Found ${enWords.length} English and ${frWords.length} French words`
      );
    });

    it('should find synsets across different languages', async () => {
      logger.info('🌍 Testing cross-language synset discovery...');

      // Test English synsets
      const enSynsets = await wordnetClient.synsets({
        form: 'computer',
        language: 'en',
      });
      expect(enSynsets.length).toBeGreaterThan(0);
      expect(enSynsets.every(s => s.language === 'en')).toBe(true);

      // Test French synsets
      const frSynsets = await wordnetClient.synsets({
        form: 'ordinateur',
        language: 'fr',
      });
      expect(frSynsets.length).toBeGreaterThan(0);
      expect(frSynsets.every(s => s.language === 'fr')).toBe(true);

      logger.success(
        `Found ${enSynsets.length} English and ${frSynsets.length} French synsets`
      );
    });

    it('should work with language-specific queries', async () => {
      logger.info('🔧 Testing language-specific queries...');

      // First, let's check what lexicons are available
      const lexicons = await wordnetClient.lexicons();
      logger.info(`Available lexicons: ${lexicons.map(l => l.id).join(', ')}`);

      // Test English words with lexicon and language filtering
      const enResults = await wordnetClient.words({ 
        form: 'computer', 
        language: 'en',
        lexicon: 'oewn'
      });
      logger.info(`English query returned ${enResults.length} results`);
      if (enResults.length > 0) {
        logger.info(`First result: ${JSON.stringify(enResults[0], null, 2)}`);
      }
      expect(enResults.length).toBeGreaterThan(0);
      expect(enResults.every((w: Word) => w.language === 'en')).toBe(true);

      // Test French words with lexicon and language filtering
      const frResults = await wordnetClient.words({ 
        form: 'ordinateur', 
        language: 'fr',
        lexicon: 'omw-fr'
      });
      logger.info(`French query returned ${frResults.length} results`);
      if (frResults.length > 0) {
        logger.info(`First result: ${JSON.stringify(frResults[0], null, 2)}`);
      }
      expect(frResults.length).toBeGreaterThan(0);
      expect(frResults.every((w: Word) => w.language === 'fr')).toBe(true);

      logger.success(`Language-specific queries work correctly`);
    });
  });

  describe('ILI-Based Translation', () => {
    it('should find words by ILI and language', async () => {
      logger.info('🔗 Testing ILI-based word discovery...');

      // First find an English synset with an ILI
      const enSynsets = await wordnetClient.synsets({ form: 'water', language: 'en' });
      const synsetWithIli = enSynsets.find(s => s.ili);

      if (synsetWithIli && synsetWithIli.ili) {
        // Find French words with the same ILI
        const frWords = await wordnetClient.getWordsByIliAndLanguage(
          synsetWithIli.ili,
          'fr'
        );
        expect(Array.isArray(frWords)).toBe(true);

        if (frWords.length > 0) {
          expect(frWords.some(w => w.lemma === 'eau')).toBe(true);
          logger.success(
            `Found French translation 'eau' for water concept via ILI ${synsetWithIli.ili}`
          );
        } else {
          logger.info(
            'No French words found for this ILI - this may be normal for some concepts'
          );
        }
      } else {
        logger.info(
          'No synset with ILI found for water - this may be normal for some datasets'
        );
      }
    });

    it('should find words by ILI without language filter', async () => {
      logger.info('🔗 Testing ILI-based word discovery without language filter...');

      const allILIs = await wordnetClient.ilis();
      if (allILIs.length > 0) {
        const sampleIli = allILIs[0]!.id;

        const words = await wordnetClient.getWordsByIliAndLanguage(sampleIli);
        expect(Array.isArray(words)).toBe(true);

        logger.success(
          `Found ${words.length} words for ILI ${sampleIli} across all languages`
        );
      }
    });

    it('should demonstrate complete translation workflow', async () => {
      logger.info('🌐 Testing complete translation workflow...');

      async function translateFromEnglishToFrench(english: string, pos?: PartOfSpeech) {
        // Find English synsets
        const englishSynsets = await wordnetClient.synsets({
          form: english,
          pos: pos as any,
          language: 'en',
        });
        const allIlis = englishSynsets.map(s => s.ili).filter(Boolean);

        // Find French words with matching ILIs
        const allMatchingFrenchWords = await Promise.all(
          allIlis.map(ili => wordnetClient.getWordsByIliAndLanguage(ili!, 'fr'))
        );

        // Return unique words
        return allMatchingFrenchWords
          .flat()
          .filter(
            (word, index, self) => index === self.findIndex(t => t.id === word.id)
          )
          .map(w => ({
            id: w.id,
            lemma: w.lemma,
            pos: w.pos,
          }));
      }

      const translatedWater = await translateFromEnglishToFrench('water', 'n');
      expect(translatedWater.length).toBeGreaterThan(0);
      expect(translatedWater.some(w => w.lemma === 'eau')).toBe(true);

      const translatedComputer = await translateFromEnglishToFrench('computer', 'n');
      expect(translatedComputer.length).toBeGreaterThan(0);
      expect(translatedComputer.some(w => w.lemma === 'ordinateur')).toBe(true);

      logger.success('Translation workflow completed successfully');
    });
  });

  describe('Translation Applications', () => {
    it('should support translation discovery across languages', async () => {
      logger.info('🌍 Testing translation discovery across languages...');

      const polyDict = new PolylingualDictionary(wordnetClient);
      const translations = await polyDict.getTranslations('water');

      expect(typeof translations).toBe('object');

      const totalTranslations = Object.values(translations).flat().length;
      expect(totalTranslations).toBeGreaterThan(0);

      logger.success(
        `Found translations in ${Object.keys(translations).length} languages with ${totalTranslations} total translations`
      );
    });

    it('should support cognate discovery', async () => {
      logger.info('🔍 Testing cognate discovery...');

      const polyDict = new PolylingualDictionary(wordnetClient);
      const cognates = await polyDict.findCognates('computer');

      expect(typeof cognates).toBe('object');

      // Should find at least English
      expect(cognates.en).toBeDefined();
      expect(cognates.en!.length).toBeGreaterThan(0);

      logger.success(`Found cognates in ${Object.keys(cognates).length} languages`);
    });

    it('should support cultural context retrieval', async () => {
      logger.info('🏛️ Testing cultural context retrieval...');

      const polyDict = new PolylingualDictionary(wordnetClient);
      const context = await polyDict.getCulturalContext('house');

      expect(typeof context).toBe('object');

      // Should have at least English context
      expect(context.en).toBeDefined();

      logger.success(
        `Found cultural context in ${Object.keys(context).length} languages`
      );
    });
  });

  describe('Cross-Language Concept Mapping', () => {
    it('should find synsets that share the same ILI', async () => {
      logger.info('🔗 Testing synset ILI sharing...');

      // Get English synsets for a concept
      const enSynsets = await wordnetClient.synsets({
        form: 'computer',
        language: 'en',
      });
      const synsetWithIli = enSynsets.find(s => s.ili);

      if (synsetWithIli && synsetWithIli.ili) {
        // Find all synsets with this ILI
        const synsetsWithIli = await wordnetClient.synsets({ ili: synsetWithIli.ili });

        // Group by language
        const byLanguage: Record<string, any[]> = {};
        for (const synset of synsetsWithIli) {
          if (synset && synset.language) {
            if (!byLanguage[synset.language]) {
              byLanguage[synset.language] = [];
            }
            byLanguage[synset.language]!.push(synset);
          }
        }

        logger.info(
          `Found synsets with ILI ${synsetWithIli.ili} in languages: ${Object.keys(byLanguage).join(', ')}`
        );
        expect(synsetsWithIli.length).toBeGreaterThan(0);
      }
    });

    it('should support concept exploration across languages', async () => {
      logger.info('🔍 Testing concept exploration across languages...');

      async function exploreConcept(concept: string) {
        // Find all synsets for the concept across languages
        const synsets = await wordnetClient.synsets({ form: concept });

        // Group by language
        const byLanguage: Record<string, any[]> = {};
        for (const synset of synsets) {
          if (synset && synset.language) {
            if (!byLanguage[synset.language]) {
              byLanguage[synset.language] = [];
            }
            byLanguage[synset.language]!.push(synset);
          }
        }

        return byLanguage;
      }

      const conceptDetails = await exploreConcept('house');
      expect(Object.keys(conceptDetails).length).toBeGreaterThan(0);

      logger.success(
        `Explored 'house' concept in ${Object.keys(conceptDetails).length} languages`
      );
    });
  });

  describe('Error Handling', () => {
    it('should handle non-existent words in specific languages', async () => {
      logger.info('❌ Testing non-existent word handling...');

      const results = await wordnetClient.words({
        form: 'thiswordprobablydoesnotexistinanylanguage',
      });
      expect(Array.isArray(results)).toBe(true);
      expect(results.length).toBe(0);

      logger.success('Non-existent word handled correctly');
    });

    it('should handle invalid language codes gracefully', async () => {
      logger.info('❌ Testing invalid language code handling...');

      const results = await wordnetClient.words({
        form: 'computer',
        language: 'invalid',
      });
      expect(Array.isArray(results)).toBe(true);
      expect(results.length).toBe(0);

      logger.success('Invalid language code handled correctly');
    });
  });

  describe('Performance', () => {
    it('should handle concurrent multilingual queries', async () => {
      logger.info('⚡ Testing concurrent multilingual queries...');

      const queries = [
        wordnetClient.words({ form: 'computer', language: 'en' }),
        wordnetClient.words({ form: 'ordinateur', language: 'fr' }),
        wordnetClient.synsets({ form: 'computer', language: 'en' }),
        wordnetClient.synsets({ form: 'ordinateur', language: 'fr' }),
        wordnetClient.lexicons(),
        wordnetClient.ilis(),
      ];

      const results = await Promise.all(queries);
      expect(results.length).toBe(6);

      results.forEach((result, index) => {
        expect(Array.isArray(result)).toBe(true);
        if (result.length > 0) {
          logger.success(`Query ${index + 1} returned ${result.length} results`);
        } else {
          logger.info(
            `Query ${index + 1} returned 0 results (may be normal for some languages)`
          );
        }
      });

      logger.success('Concurrent multilingual queries completed');
    });
  });
});
