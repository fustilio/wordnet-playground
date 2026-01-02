/**
 * Runtime utilities for serverless dictionary
 * Fast O(1) lookups optimized for edge functions and serverless environments
 * With optional caching for improved performance
 */

import type {
  DictionaryData,
  SynsetResult,
  LookupResult,
  TranslationResult,
  DefinitionResult
} from '../types/index.js';
import { DictionaryCache, MultiLevelCache, CacheKeys, type CacheOptions } from './cache.js';
import { globalRegistry } from '../plugins/registry.js';

export interface DictionaryOptions {
  enableCache?: boolean;
  cacheOptions?: CacheOptions;
  enableMultiLevelCache?: boolean;
}

/**
 * Create dictionary utilities from dictionary data
 * @param data - Dictionary data structure
 * @param options - Optional configuration including caching
 */
export function createDictionary(data: DictionaryData, options: DictionaryOptions = {}) {
  const {
    enableCache = false,
    cacheOptions = {},
    enableMultiLevelCache = false
  } = options;

  // Initialize cache if enabled
  const cache = enableCache
    ? (enableMultiLevelCache
        ? new MultiLevelCache()
        : new DictionaryCache(cacheOptions))
    : null;
  /**
   * Lookup a word and get all matching synsets
   * @param word - The word to look up
   * @param lang - Language code (default: 'en')
   * @returns Lookup result with matching synsets
   */
  function lookup(word: string, lang: string = 'en'): LookupResult {
    // Check cache first
    if (cache) {
      const cacheKey = CacheKeys.lookup(word, lang);
      const cached = cache.get(cacheKey);
      if (cached) {
        return cached;
      }
    }

    const key = `${word.toLowerCase()}:${lang}`;
    const ilis = data.w[key];

    if (!ilis) {
      const emptyResult = {
        word,
        lang,
        results: [],
        count: 0
      };

      // Cache empty results too (prevents repeated lookups of non-existent words)
      if (cache) {
        cache.set(CacheKeys.lookup(word, lang), emptyResult);
      }

      return emptyResult;
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

    const result = {
      word,
      lang,
      results,
      count: results.length
    };

    // Cache the result
    if (cache) {
      cache.set(CacheKeys.lookup(word, lang), result);
    }

    return result;
  }

  /**
   * Get translations for a word across languages
   * @param word - The word to translate
   * @param fromLang - Source language
   * @param toLang - Target language
   * @returns Translation result
   */
  function translate(word: string, fromLang: string, toLang: string): TranslationResult {
    // Check cache first
    if (cache) {
      const cacheKey = CacheKeys.translate(word, fromLang, toLang);
      const cached = cache.get(cacheKey);
      if (cached) {
        return cached;
      }
    }

    const lookupResult = lookup(word, fromLang);
    const translations = new Set<string>();

    lookupResult.results.forEach(synset => {
      const targetWords = synset.translations[toLang] || [];
      targetWords.forEach(w => translations.add(w));
    });

    const result = {
      word,
      from: fromLang,
      to: toLang,
      translations: Array.from(translations),
      count: translations.size
    };

    // Cache the result
    if (cache) {
      cache.set(CacheKeys.translate(word, fromLang, toLang), result);
    }

    return result;
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
    const stats = {
      version: data.v,
      synsets: data.m.c,
      words: data.m.w,
      generatedAt: new Date(data.m.t).toISOString(),
      languages: data.m.langs || ['en'],
      pos: data.m.pos || ['all'],
      cache: cache ? cache.getStats() : null
    };

    return stats;
  }

  /**
   * Clear cache (if enabled)
   */
  function clearCache() {
    if (cache) {
      cache.clear();
    }
  }

  /**
   * Warm cache with common words
   * Pre-loads frequently used words into cache
   */
  function warmCache(commonWords: Array<{ word: string; lang: string }> = []) {
    if (!cache) return;

    commonWords.forEach(({ word, lang }) => {
      lookup(word, lang);
    });
  }

  return {
    lookup,
    translate,
    define,
    getMetadata,
    getStats,
    clearCache,
    warmCache
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
