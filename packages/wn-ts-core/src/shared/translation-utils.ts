/**
 * Translation utilities for easy bilingual queries
 * 
 * This module provides convenience functions for translating words and concepts
 * between different languages using the WordNet database.
 */

import type { WordNetCore } from '../wordnet-kernel.js';
import { logger } from '../utils/logger.js';

export interface TranslationResult {
  sourceWord: string;
  sourceLanguage: string;
  translations: Record<string, {
    words: string[];
    definitions: string[];
    examples: string[];
  }>;
}

export interface BilingualQueryOptions {
  /** Source language code (e.g., 'en', 'fr') */
  sourceLanguage: string;
  /** Target language code (e.g., 'en', 'fr') */
  targetLanguage: string;
  /** Whether to include definitions in results */
  includeDefinitions?: boolean;
  /** Whether to include examples in results */
  includeExamples?: boolean;
  /** Maximum number of translations to return per language */
  maxTranslations?: number;
}

/**
 * Convenience class for easy translation queries
 */
export class TranslationHelper {
  constructor(private wordnetClient: WordNetCore) {}

  /**
   * Get translations for a word from one language to another
   * 
   * @param word - The word to translate
   * @param options - Translation options
   * @returns Promise<TranslationResult>
   * 
   * @example
   * ```typescript
   * const helper = new TranslationHelper(wordnetClient);
   * const result = await helper.translateWord('computer', {
   *   sourceLanguage: 'en',
   *   targetLanguage: 'fr',
   *   includeDefinitions: true,
   *   includeExamples: true
   * });
   * console.log(result.translations.fr.words); // ['ordinateur']
   * ```
   */
  async translateWord(
    word: string, 
    options: BilingualQueryOptions
  ): Promise<TranslationResult> {
    const { sourceLanguage, targetLanguage, includeDefinitions = true, includeExamples = true, maxTranslations = 10 } = options;
    
    logger.info(`🌍 Translating '${word}' from ${sourceLanguage} to ${targetLanguage}`);

    // Find source language synsets
    const sourceSynsets = await this.wordnetClient.synsets({
      form: word,
      language: sourceLanguage,
    });

    if (sourceSynsets.length === 0) {
      logger.warn(`No synsets found for '${word}' in ${sourceLanguage}`);
      return {
        sourceWord: word,
        sourceLanguage,
        translations: {}
      };
    }

    const translations: Record<string, { words: string[]; definitions: string[]; examples: string[] }> = {};

    // For each source synset, find translations via ILI
    for (const synset of sourceSynsets) {
      if (synset.ili) {
        // Find translations in target language using form similarity
        // For now, let's use a simpler approach and find words by form similarity
        const similarWords = await this.wordnetClient.words({
          form: word,
          language: targetLanguage,
          fuzzy: true
        });

        if (similarWords.length > 0) {
          if (!translations[targetLanguage]) {
            translations[targetLanguage] = { words: [], definitions: [], examples: [] };
          }

          // Add unique words
          const newWords = similarWords
            .map(w => w.lemma)
            .filter(lemma => !translations[targetLanguage]?.words.includes(lemma))
            .slice(0, maxTranslations);
          
          if (translations[targetLanguage]) {
            translations[targetLanguage].words.push(...newWords);
          }

          if (includeDefinitions) {
            // Get definitions for the target words
            for (const targetWord of similarWords.slice(0, maxTranslations)) {
              const targetSynsets = await this.wordnetClient.synsets({
                form: targetWord.lemma,
                language: targetLanguage
              });
              
              for (const targetSynset of targetSynsets) {
                if (targetSynset.definitions) {
                  translations[targetLanguage].definitions.push(...targetSynset.definitions.map(d => d.text));
                }
                if (includeExamples && targetSynset.examples) {
                  translations[targetLanguage].examples.push(...targetSynset.examples.map(e => e.text));
                }
              }
            }
          }
        }
      }
    }

    // If no translations found via ILI, try direct word lookup
    if (Object.keys(translations).length === 0) {
      const directTranslations = await this.wordnetClient.words({
        form: word,
        language: targetLanguage,
        fuzzy: true
      });

      if (directTranslations.length > 0) {
        translations[targetLanguage] = {
          words: directTranslations.slice(0, maxTranslations).map(w => w.lemma),
          definitions: [],
          examples: []
        };

        if (includeDefinitions) {
          for (const word of directTranslations.slice(0, maxTranslations)) {
            const synsets = await this.wordnetClient.synsets({
              form: word.lemma,
              language: targetLanguage
            });
            
            for (const synset of synsets) {
              if (synset.definitions) {
                translations[targetLanguage].definitions.push(...synset.definitions.map(d => d.text));
              }
              if (includeExamples && synset.examples) {
                translations[targetLanguage].examples.push(...synset.examples.map(e => e.text));
              }
            }
          }
        }
      }
    }

    logger.success(`Found translations in ${Object.keys(translations).length} languages`);
    return {
      sourceWord: word,
      sourceLanguage,
      translations
    };
  }

  /**
   * Get bidirectional translations between two languages
   * 
   * @param word - The word to translate
   * @param language1 - First language code
   * @param language2 - Second language code
   * @param options - Additional options
   * @returns Promise<{ [language1]: TranslationResult, [language2]: TranslationResult }>
   */
  async getBidirectionalTranslations(
    word: string,
    language1: string,
    language2: string,
    options: Omit<BilingualQueryOptions, 'sourceLanguage' | 'targetLanguage'> = {}
  ) {
    const [result1, result2] = await Promise.all([
      this.translateWord(word, { ...options, sourceLanguage: language1, targetLanguage: language2 }),
      this.translateWord(word, { ...options, sourceLanguage: language2, targetLanguage: language1 })
    ]);

    return {
      [language1]: result1,
      [language2]: result2
    };
  }

  /**
   * Get all available languages in the database
   * 
   * @returns Promise<string[]> Array of language codes
   */
  async getAvailableLanguages(): Promise<string[]> {
    const lexicons = await this.wordnetClient.lexicons();
    return lexicons.map(lexicon => lexicon.language).filter(Boolean) as string[];
  }

  /**
   * Check if a language is available for translation
   * 
   * @param language - Language code to check
   * @returns Promise<boolean>
   */
  async isLanguageAvailable(language: string): Promise<boolean> {
    const availableLanguages = await this.getAvailableLanguages();
    return availableLanguages.includes(language);
  }
}

/**
 * Create a translation helper instance
 * 
 * @param wordnetClient - WordNet client instance
 * @returns TranslationHelper instance
 */
export function createTranslationHelper(wordnetClient: WordNetCore): TranslationHelper {
  return new TranslationHelper(wordnetClient);
}

/**
 * Quick translation function for simple use cases
 * 
 * @param wordnetClient - WordNet client instance
 * @param word - Word to translate
 * @param fromLang - Source language
 * @param toLang - Target language
 * @returns Promise<string[]> Array of translated words
 */
export async function quickTranslate(
  wordnetClient: WordNetCore,
  word: string,
  fromLang: string,
  toLang: string
): Promise<string[]> {
  const helper = new TranslationHelper(wordnetClient);
  const result = await helper.translateWord(word, {
    sourceLanguage: fromLang,
    targetLanguage: toLang,
    includeDefinitions: false,
    includeExamples: false
  });
  
  return result.translations[toLang]?.words || [];
}
