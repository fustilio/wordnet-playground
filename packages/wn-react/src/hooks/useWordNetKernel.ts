/**
 * useWordNetKernel Hook - Advanced kernel-based WordNet functionality
 * 
 * This hook provides access to the full WordNet kernel with plugin system.
 * Use this for advanced scenarios where you need direct kernel access.
 * 
 * For most use cases, prefer the simpler `useWordNet` hook.
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { createWordNetInstance } from 'wn-ts-web/factory';
import type { WordnetOptions } from 'wn-ts-core';
import type { 
  Word,
  Sense,
  Synset,
  Lexicon,
  ILI,
  PartOfSpeech,
  WordQuery,
  SynsetQuery,
  SenseQuery,
} from 'wn-ts-core';

export interface UseWordNetKernelOptions extends Partial<WordnetOptions> {
  lexicon?: string | string[];
  plugins?: string[];
}

export interface UseWordNetKernelReturn {
  // Core state
  wordnet: any | null;
  loading: boolean;
  error: Error | null;
  initialized: boolean;
  
  // Core operations
  initialize: (lexicon?: string | string[], options?: UseWordNetKernelOptions) => Promise<void>;
  close: () => Promise<void>;
  
  // Basic WordNet operations
  words: (query?: WordQuery) => Promise<Word[]>;
  word: (wordId: string) => Promise<Word | undefined>;
  synsets: (query?: SynsetQuery) => Promise<Synset[]>;
  synset: (synsetId: string) => Promise<Synset | undefined>;
  senses: (query?: SenseQuery) => Promise<Sense[]>;
  sense: (senseId: string) => Promise<Sense | undefined>;
  lexicons: () => Promise<Lexicon[]>;
  ili: (iliId: string) => Promise<ILI | undefined>;
  ilis: (status?: string) => Promise<ILI[]>;
  
  // Plugin methods - Relations (if plugins loaded)
  getHypernyms?: (synsetId: string) => Promise<Synset[]>;
  getHyponyms?: (synsetId: string) => Promise<Synset[]>;
  getMeronyms?: (synsetId: string) => Promise<Synset[]>;
  getHolonyms?: (synsetId: string) => Promise<Synset[]>;
  
  // Plugin methods - Similarity (if plugins loaded)
  getPathSimilarity?: (synset1: string, synset2: string) => Promise<number>;
  getWuPalmerSimilarity?: (synset1: string, synset2: string) => Promise<number>;
  
  // Plugin methods - Translation (if plugins loaded)
  getTranslations?: (synsetId: string, targetLanguage?: string) => Promise<string[]>;
  
  // Plugin management
  getPlugins: () => string[];
  hasPlugin: (pluginName: string) => boolean;
}

export function useWordNetKernel(options: UseWordNetKernelOptions = {}): UseWordNetKernelReturn {
  const {
    lexicon = 'oewn:2024',
    plugins = [],
    ...wordnetOptions
  } = options;

  // State
  const [wordnet, setWordnet] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [initialized, setInitialized] = useState(false);

  // Initialize the WordNet kernel
  const initialize = useCallback(async (lexiconParam?: string | string[], optionsParam?: UseWordNetKernelOptions) => {
    if (loading) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const finalLexicon = lexiconParam || lexicon;
      const finalOptions = { ...wordnetOptions, ...optionsParam };
      
      // Create WordNet instance with plugins
      const { wordnet } = await createWordNetInstance(finalLexicon, {
        ...finalOptions,
        plugins: plugins.length > 0 ? plugins : undefined,
      });
      setWordnet(wordnet);
      setInitialized(true);
    } catch (err) {
      const errorMessage = err instanceof Error ? err : new Error('Failed to initialize WordNet kernel');
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [loading, lexicon, plugins, wordnetOptions]);

  // Close the WordNet kernel
  const close = useCallback(async () => {
    if (wordnet) {
      try {
        await wordnet.close();
        setWordnet(null);
        setInitialized(false);
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Failed to close WordNet kernel'));
      }
    }
  }, [wordnet]);

  // Ensure kernel is initialized
  const ensureInitialized = useCallback(() => {
    if (!wordnet || !initialized) {
      throw new Error('WordNet kernel not initialized. Call initialize() first.');
    }
    return wordnet;
  }, [wordnet, initialized]);

  // Basic WordNet operations
  const words = useCallback(async (query?: WordQuery) => {
    const kernel = ensureInitialized();
    return kernel.words(query);
  }, [ensureInitialized]);

  const word = useCallback(async (wordId: string) => {
    const kernel = ensureInitialized();
    return kernel.word(wordId);
  }, [ensureInitialized]);

  const synsets = useCallback(async (query?: SynsetQuery) => {
    const kernel = ensureInitialized();
    return kernel.synsets(query);
  }, [ensureInitialized]);

  const synset = useCallback(async (synsetId: string) => {
    const kernel = ensureInitialized();
    return kernel.synset(synsetId);
  }, [ensureInitialized]);

  const senses = useCallback(async (query?: SenseQuery) => {
    const kernel = ensureInitialized();
    return kernel.senses(query);
  }, [ensureInitialized]);

  const sense = useCallback(async (senseId: string) => {
    const kernel = ensureInitialized();
    return kernel.sense(senseId);
  }, [ensureInitialized]);

  const lexicons = useCallback(async () => {
    const kernel = ensureInitialized();
    return kernel.lexicons();
  }, [ensureInitialized]);

  const ili = useCallback(async (iliId: string) => {
    const kernel = ensureInitialized();
    return kernel.ili(iliId);
  }, [ensureInitialized]);

  const ilis = useCallback(async (status?: string) => {
    const kernel = ensureInitialized();
    return kernel.ilis(status);
  }, [ensureInitialized]);

  // Plugin methods (if available)
  const getHypernyms = useCallback(async (synsetId: string) => {
    const kernel = ensureInitialized();
    if (kernel.getHypernyms) {
      return kernel.getHypernyms(synsetId);
    }
    return [];
  }, [ensureInitialized]);

  const getHyponyms = useCallback(async (synsetId: string) => {
    const kernel = ensureInitialized();
    if (kernel.getHyponyms) {
      return kernel.getHyponyms(synsetId);
    }
    return [];
  }, [ensureInitialized]);

  const getMeronyms = useCallback(async (synsetId: string) => {
    const kernel = ensureInitialized();
    if (kernel.getMeronyms) {
      return kernel.getMeronyms(synsetId);
    }
    return [];
  }, [ensureInitialized]);

  const getHolonyms = useCallback(async (synsetId: string) => {
    const kernel = ensureInitialized();
    if (kernel.getHolonyms) {
      return kernel.getHolonyms(synsetId);
    }
    return [];
  }, [ensureInitialized]);

  const getPathSimilarity = useCallback(async (synset1: string, synset2: string) => {
    const kernel = ensureInitialized();
    if (kernel.getPathSimilarity) {
      return kernel.getPathSimilarity(synset1, synset2);
    }
    return 0;
  }, [ensureInitialized]);

  const getWuPalmerSimilarity = useCallback(async (synset1: string, synset2: string) => {
    const kernel = ensureInitialized();
    if (kernel.getWuPalmerSimilarity) {
      return kernel.getWuPalmerSimilarity(synset1, synset2);
    }
    return 0;
  }, [ensureInitialized]);

  const getTranslations = useCallback(async (synsetId: string, targetLanguage?: string) => {
    const kernel = ensureInitialized();
    if (kernel.getTranslations) {
      return kernel.getTranslations(synsetId, targetLanguage);
    }
    return [];
  }, [ensureInitialized]);

  // Plugin management
  const getPlugins = useCallback(() => {
    if (!wordnet) return [];
    return wordnet.getPlugins ? wordnet.getPlugins() : [];
  }, [wordnet]);

  const hasPlugin = useCallback((pluginName: string) => {
    if (!wordnet) return false;
    return wordnet.hasPlugin ? wordnet.hasPlugin(pluginName) : false;
  }, [wordnet]);

  // Auto-initialize if enabled
  useEffect(() => {
    if (!initialized && !loading) {
      initialize();
    }
  }, [initialized, loading, initialize]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (wordnet) {
        wordnet.close().catch(console.error);
      }
    };
  }, [wordnet]);

  return {
    // Core state
    wordnet,
    loading,
    error,
    initialized,
    
    // Core operations
    initialize,
    close,
    
    // Basic WordNet operations
    words,
    word,
    synsets,
    synset,
    senses,
    sense,
    lexicons,
    ili,
    ilis,
    
    // Plugin methods - Relations
    getHypernyms,
    getHyponyms,
    getMeronyms,
    getHolonyms,
    
    // Plugin methods - Similarity
    getPathSimilarity,
    getWuPalmerSimilarity,
    
    // Plugin methods - Translation
    getTranslations,
    
    // Plugin management
    getPlugins,
    hasPlugin,
  };
}
