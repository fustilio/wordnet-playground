/**
 * Runtime utilities for serverless dictionary
 * Fast O(1) lookups optimized for edge functions and serverless environments
 */

import type {
  DictionaryData,
  SynsetResult,
  LookupResult,
  TranslationResult,
  DefinitionResult
} from '../types/index.js';

/**
 * Create dictionary utilities from dictionary data
 */
export function createDictionary(data: DictionaryData) {
  /**
   * Lookup a word and get all matching synsets
   * @param word - The word to look up
   * @param lang - Language code (default: 'en')
   * @returns Lookup result with matching synsets
   */
  function lookup(word: string, lang: string = 'en'): LookupResult {
    const key = `${word.toLowerCase()}:${lang}`;
    const ilis = data.w[key];

    if (!ilis) {
      return {
        word,
        lang,
        results: [],
        count: 0
      };
    }

    const results: SynsetResult[] = ilis.map(ili => {
      const synset = data.s[ili];
      if (!synset) return null;

      const [pos, definition, translations] = synset;
      return {
        ili,
        pos,
        definition,
        translations
      };
    }).filter((r): r is SynsetResult => r !== null);

    return {
      word,
      lang,
      results,
      count: results.length
    };
  }

  /**
   * Get translations for a word across languages
   * @param word - The word to translate
   * @param fromLang - Source language
   * @param toLang - Target language
   * @returns Translation result
   */
  function translate(word: string, fromLang: string, toLang: string): TranslationResult {
    const lookupResult = lookup(word, fromLang);
    const translations = new Set<string>();

    lookupResult.results.forEach(synset => {
      const targetWords = synset.translations[toLang] || [];
      targetWords.forEach(w => translations.add(w));
    });

    return {
      word,
      from: fromLang,
      to: toLang,
      translations: Array.from(translations),
      count: translations.size
    };
  }

  /**
   * Get all definitions for a word
   * @param word - The word
   * @param lang - Language code (default: 'en')
   * @returns Definition result
   */
  function define(word: string, lang: string = 'en'): DefinitionResult {
    const lookupResult = lookup(word, lang);
    const definitions = lookupResult.results.map(r => r.definition).filter(Boolean);

    return {
      word,
      lang,
      definitions,
      count: definitions.length
    };
  }

  /**
   * Get dictionary metadata
   */
  function getMetadata() {
    return data.m;
  }

  /**
   * Get dictionary statistics
   */
  function getStats() {
    return {
      version: data.v,
      synsets: data.m.c,
      words: data.m.w,
      generatedAt: new Date(data.m.t).toISOString(),
      languages: data.m.langs || ['en'],
      pos: data.m.pos || ['all']
    };
  }

  return {
    lookup,
    translate,
    define,
    getMetadata,
    getStats
  };
}

/**
 * Standalone lookup function (without creating dictionary instance)
 * @param data - Dictionary data
 * @param word - The word to look up
 * @param lang - Language code
 */
export function lookup(data: DictionaryData, word: string, lang: string = 'en'): LookupResult {
  return createDictionary(data).lookup(word, lang);
}

/**
 * Standalone translate function
 * @param data - Dictionary data
 * @param word - The word to translate
 * @param fromLang - Source language
 * @param toLang - Target language
 */
export function translate(
  data: DictionaryData,
  word: string,
  fromLang: string,
  toLang: string
): TranslationResult {
  return createDictionary(data).translate(word, fromLang, toLang);
}

/**
 * Standalone define function
 * @param data - Dictionary data
 * @param word - The word
 * @param lang - Language code
 */
export function define(data: DictionaryData, word: string, lang: string = 'en'): DefinitionResult {
  return createDictionary(data).define(word, lang);
}
