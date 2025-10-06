/**
 * Main WordNet hook - provides all WordNet functionality
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { createWordNetInstance } from 'wn-ts-web/factory';
import type { WordnetOptions } from 'wn-ts-core';
import type { Synset, Word, Sense, PartOfSpeech } from 'wn-ts-core';

export interface UseWordNetOptions extends Partial<WordnetOptions> {
  autoInitialize?: boolean;
  lexicon?: string | string[];
}

export interface UseWordNetReturn {
  // Core functionality
  search: (term: string, options?: { pos?: string; limit?: number }) => Promise<void>;
  define: (term: string, pos?: string) => Promise<void>;
  translate: (term: string, fromLang: string, toLang: string) => Promise<void>;
  related: (term: string, relationType: 'hypernym' | 'hyponym') => Promise<void>;
  
  // Results
  results: Synset[];
  definitions: Array<{ text: string; pos: string; synsetId: string }>;
  translations: string[];
  relations: Synset[];
  
  // State
  loading: boolean;
  error: Error | null;
  initialized: boolean;
  
  // Advanced functionality
  initialize: () => Promise<void>;
  close: () => Promise<void>;
  
  // Plugin methods (if plugins are loaded)
  getHypernyms?: (synsetId: string) => Promise<Synset[]>;
  getHyponyms?: (synsetId: string) => Promise<Synset[]>;
  getPathSimilarity?: (synset1: string, synset2: string) => Promise<number>;
  getWuPalmerSimilarity?: (synset1: string, synset2: string) => Promise<number>;
}

export function useWordNet(options: UseWordNetOptions = {}): UseWordNetReturn {
  const {
    lexicon = 'oewn:2024',
    autoInitialize = true,
    ...wordnetOptions
  } = options;

  // State
  const [results, setResults] = useState<Synset[]>([]);
  const [definitions, setDefinitions] = useState<Array<{ text: string; pos: string; synsetId: string }>>([]);
  const [translations, setTranslations] = useState<string[]>([]);
  const [relations, setRelations] = useState<Synset[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [initialized, setInitialized] = useState(false);

  // WordNet instance
  const wordnetRef = useRef<any>(null);

  // Initialize WordNet
  const initialize = useCallback(async () => {
    if (wordnetRef.current) return;

    try {
      setLoading(true);
      setError(null);

      const { wordnet } = await createWordNetInstance(lexicon, wordnetOptions);
      wordnetRef.current = wordnet;
      setInitialized(true);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to initialize WordNet'));
    } finally {
      setLoading(false);
    }
  }, [lexicon, wordnetOptions]);

  // Auto-initialize if enabled
  useEffect(() => {
    if (autoInitialize && !initialized && !wordnetRef.current) {
      initialize();
    }
  }, [autoInitialize, initialized, initialize]);

  // Search function
  const search = useCallback(async (term: string, options?: { pos?: string; limit?: number }) => {
    if (!wordnetRef.current) {
      await initialize();
    }

    try {
      setLoading(true);
      setError(null);

      const searchResults = await wordnetRef.current.search(term, options);
      setResults(searchResults);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Search failed'));
    } finally {
      setLoading(false);
    }
  }, [initialize]);

  // Define function
  const define = useCallback(async (term: string, pos?: string) => {
    if (!wordnetRef.current) {
      await initialize();
    }

    try {
      setLoading(true);
      setError(null);

      const defs = await wordnetRef.current.define(term, pos);
      setDefinitions(defs);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Definition lookup failed'));
    } finally {
      setLoading(false);
    }
  }, [initialize]);

  // Translate function
  const translate = useCallback(async (term: string, fromLang: string, toLang: string) => {
    if (!wordnetRef.current) {
      await initialize();
    }

    try {
      setLoading(true);
      setError(null);

      const trans = await wordnetRef.current.translate(term, fromLang, toLang);
      setTranslations(trans);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Translation failed'));
    } finally {
      setLoading(false);
    }
  }, [initialize]);

  // Related function
  const related = useCallback(async (term: string, relationType: 'hypernym' | 'hyponym') => {
    if (!wordnetRef.current) {
      await initialize();
    }

    try {
      setLoading(true);
      setError(null);

      const rels = await wordnetRef.current.related(term, relationType);
      setRelations(rels);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Relation lookup failed'));
    } finally {
      setLoading(false);
    }
  }, [initialize]);

  // Close function
  const close = useCallback(async () => {
    if (wordnetRef.current) {
      try {
        await wordnetRef.current.close();
        wordnetRef.current = null;
        setInitialized(false);
        setResults([]);
        setDefinitions([]);
        setTranslations([]);
        setRelations([]);
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Failed to close WordNet'));
      }
    }
  }, []);

  // Plugin methods (if available)
  const getHypernyms = useCallback(async (synsetId: string) => {
    if (!wordnetRef.current) {
      await initialize();
    }

    if (wordnetRef.current.getHypernyms) {
      return await wordnetRef.current.getHypernyms(synsetId);
    }
    return [];
  }, [initialize]);

  const getHyponyms = useCallback(async (synsetId: string) => {
    if (!wordnetRef.current) {
      await initialize();
    }

    if (wordnetRef.current.getHyponyms) {
      return await wordnetRef.current.getHyponyms(synsetId);
    }
    return [];
  }, [initialize]);

  const getPathSimilarity = useCallback(async (synset1: string, synset2: string) => {
    if (!wordnetRef.current) {
      await initialize();
    }

    if (wordnetRef.current.getPathSimilarity) {
      return await wordnetRef.current.getPathSimilarity(synset1, synset2);
    }
    return 0;
  }, [initialize]);

  const getWuPalmerSimilarity = useCallback(async (synset1: string, synset2: string) => {
    if (!wordnetRef.current) {
      await initialize();
    }

    if (wordnetRef.current.getWuPalmerSimilarity) {
      return await wordnetRef.current.getWuPalmerSimilarity(synset1, synset2);
    }
    return 0;
  }, [initialize]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (wordnetRef.current) {
        wordnetRef.current.close().catch(console.error);
      }
    };
  }, []);

  return {
    // Core functionality
    search,
    define,
    translate,
    related,
    
    // Results
    results,
    definitions,
    translations,
    relations,
    
    // State
    loading,
    error,
    initialized,
    
    // Advanced functionality
    initialize,
    close,
    
    // Plugin methods
    getHypernyms,
    getHyponyms,
    getPathSimilarity,
    getWuPalmerSimilarity,
  };
}
