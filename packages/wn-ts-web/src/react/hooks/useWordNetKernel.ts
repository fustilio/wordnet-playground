import { useState, useEffect, useCallback, useRef } from "react";
import { WebWordNetKernel } from '../../wordnet-kernel.js';
import { createScopedLogger } from "utils/logger";
import sqlite3InitModule, { type Sqlite3Static } from '@sqlite.org/sqlite-wasm';
import type { 
  WordQuery,
  SynsetQuery,
  SenseQuery,
  Word,
  Synset,
  Sense,
  Lexicon,
  ILI
} from 'wn-ts-core';
import type { 
  WordNetKernelOptions
} from '../../types/index.js';

// Import common relation types
import type { RelationMethod, RelationMethodReturn, RelationUtilityMethod } from '../../workers/type.js';

// Import all types from the dedicated types file
import type {
  CacheInfo,
  WordQueryResult,
  SynsetQueryResult,
  SenseInfo,
  DefinitionInfo,
  WordInfo,
  MemoryQueryTestResult,
  DatabaseStorageInfo,
  WordNetState,
  ProgressCallback,
  LexiconIntrospection,
  ResourceTypeInfo,
  CategorizedResources,
  CrossLingualAnalysis,
  MappingCoverage,
  IntegrityReport,
  CompatibilityReport,
  PackageInfo,
  WordNetStatistics,
} from "../../types/index.ts";

const logger = createScopedLogger("useWordNetKernel");

// Helper function to create basic relation method callbacks
const createBasicRelationMethod = (ensureInitialized: () => WebWordNetKernel, methodName: keyof WebWordNetKernel) => {
  return useCallback(async (synsetId: string, lexicon?: string) => {
    const kernel = ensureInitialized();
    return (kernel[methodName] as RelationMethod)(synsetId, lexicon);
  }, [ensureInitialized]);
};

// Helper function to create relation type method callbacks
const createRelationTypeMethod = (ensureInitialized: () => WebWordNetKernel, methodName: keyof WebWordNetKernel) => {
  return useCallback(async (synsetId: string, relationType: string, lexicon?: string) => {
    const kernel = ensureInitialized();
    return (kernel[methodName] as any)(synsetId, relationType, lexicon);
  }, [ensureInitialized]);
};

// Helper function to create all relations method callbacks
const createAllRelationsMethod = (ensureInitialized: () => WebWordNetKernel, methodName: keyof WebWordNetKernel) => {
  return useCallback(async (synsetId: string, lexicon?: string) => {
    const kernel = ensureInitialized();
    return (kernel[methodName] as any)(synsetId, lexicon);
  }, [ensureInitialized]);
};

// Helper function to create string array method callbacks
const createStringArrayMethod = (ensureInitialized: () => WebWordNetKernel, methodName: keyof WebWordNetKernel) => {
  return useCallback(async (synsetId: string, lexicon?: string) => {
    const kernel = ensureInitialized();
    return (kernel[methodName] as any)(synsetId, lexicon);
  }, [ensureInitialized]);
};

// Helper function to create stats method callbacks
const createStatsMethod = (ensureInitialized: () => WebWordNetKernel, methodName: keyof WebWordNetKernel) => {
  return useCallback(async (synsetId: string, lexicon?: string) => {
    const kernel = ensureInitialized();
    return (kernel[methodName] as any)(synsetId, lexicon);
  }, [ensureInitialized]);
};

// Helper function to create utility method callbacks
const createUtilityMethod = <T>(ensureInitialized: () => WebWordNetKernel, methodName: keyof WebWordNetKernel) => {
  return useCallback(async () => {
    const kernel = ensureInitialized();
    return (kernel[methodName] as RelationUtilityMethod<T>)();
  }, [ensureInitialized]);
};

/**
 * useWordNetKernel Hook
 *
 * A React hook that provides WordNet functionality using the new kernel architecture.
 * This hook uses the WebWordNetKernel which provides the plugin system for relations,
 * similarity, and translation operations.
 *
 * Key Features:
 * - Kernel-based: Uses the new microkernel architecture with plugins
 * - Type-safe: Full TypeScript support with compile-time checking
 * - Plugin system: Access to relations, similarity, and translation plugins
 * - Cross-lingual: Built-in support for cross-lingual operations
 * - Schema management: Database schema management capabilities
 *
 * Usage:
 * ```tsx
 * const {
 *   wordnet,
 *   loading,
 *   error,
 *   initialize,
 *   getHypernyms,
 *   getPathSimilarity,
 *   getTranslations
 * } = useWordNetKernel();
 *
 * // Initialize the kernel
 * await initialize('oewn:2024');
 *
 * // Use plugin methods
 * const hypernyms = await getHypernyms(synsetId);
 * const similarity = await getPathSimilarity(synset1, synset2);
 * const translations = await getTranslations(synsetId);
 * ```
 */
export function useWordNetKernel(config?: {
  lexicon?: string | string[];
  options?: WordNetKernelOptions;
}): {
  // Core state
  wordnet: WebWordNetKernel | null;
  loading: boolean;
  error: string | null;
  initialized: boolean;
  
  // Core operations
  initialize: (lexicon?: string | string[], options?: WordNetKernelOptions) => Promise<void>;
  close: () => Promise<void>;
  
  // Basic WordNet operations
  words: (query?: WordQuery) => Promise<Word[]>;
  word: (wordId: string) => Promise<Word>;
  synsets: (query?: SynsetQuery) => Promise<Synset[]>;
  synset: (synsetId: string) => Promise<Synset>;
  senses: (query?: SenseQuery) => Promise<Sense[]>;
  sense: (senseId: string) => Promise<Sense>;
  lexicons: () => Promise<Lexicon[]>;
  ili: (iliId: string) => Promise<ILI>;
  ilis: (status?: string) => Promise<ILI[]>;
  synsetsByILI: (iliId: string) => Promise<Synset[]>;
  
  // Plugin methods - Relations
  getHypernyms: (synsetId: string, lexicon?: string) => Promise<Array<{
    id: string;
    lemma: string;
    pos: string;
    language: string;
    lexicon: string;
  }>>;
  getHyponyms: (synsetId: string, lexicon?: string) => Promise<Array<{
    id: string;
    lemma: string;
    pos: string;
    language: string;
    lexicon: string;
  }>>;
  getMeronyms: (synsetId: string, lexicon?: string) => Promise<Array<{
    id: string;
    lemma: string;
    pos: string;
    language: string;
    lexicon: string;
  }>>;
  getHolonyms: (synsetId: string, lexicon?: string) => Promise<Array<{
    id: string;
    lemma: string;
    pos: string;
    language: string;
    lexicon: string;
  }>>;
  getEntailments: (synsetId: string, lexicon?: string) => Promise<Array<{
    id: string;
    lemma: string;
    pos: string;
    language: string;
    lexicon: string;
  }>>;
  getSimilarTos: (synsetId: string, lexicon?: string) => Promise<Array<{
    id: string;
    lemma: string;
    pos: string;
    language: string;
    lexicon: string;
  }>>;
  getRelationsByType: (synsetId: string, relationType: string, lexicon?: string) => Promise<Array<{
    id: string;
    lemma: string;
    pos: string;
    language: string;
    lexicon: string;
    type: string;
  }>>;
  getAllRelations: (synsetId: string, lexicon?: string) => Promise<Array<{
    id: string;
    sourceId: string;
    targetId: string;
    type: string;
    sourceLemma: string;
    targetLemma: string;
    sourceLexicon: string;
    targetLexicon: string;
    direction: 'incoming' | 'outgoing';
  }>>;
  getRelationTypes: (synsetId: string, lexicon?: string) => Promise<string[]>;
  getRelationStats: (synsetId: string, lexicon?: string) => Promise<Array<{
    type: string;
    count: number;
    direction: 'incoming' | 'outgoing';
  }>>;
  
  // Plugin methods - Similarity
  getPathSimilarity: (synset1: string, synset2: string) => Promise<number>;
  getWuPalmerSimilarity: (synset1: string, synset2: string) => Promise<number>;
  
  // Plugin methods - Translation
  getTranslations: (synsetId: string, targetLanguage?: string) => Promise<Array<{
    id: string;
    lemma: string;
    pos: string;
    language: string;
    lexicon: string;
  }>>;
  getTranslationsByWord: (wordForm: string, sourceLanguage: string, targetLanguage: string) => Promise<Array<{
    sourceSynset: string;
    ili: string;
    translations: Array<{
      lemma: string;
      pos: string;
      lexicon: string;
    }>;
  }>>;
  
  // Plugin management
  getPlugins: () => string[];
  has: (pluginName: string) => boolean;
  
  // Schema management
  schemaManager: Record<string, unknown> | null;
} {
  const [wordnet, setWordnet] = useState<WebWordNetKernel | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [initialized, setInitialized] = useState(false);

  // Initialize the WordNet kernel
  const initialize = useCallback(async (lexicon?: string | string[], options?: WordNetKernelOptions) => {
    if (loading) return;
    
    setLoading(true);
    setError(null);
    
    try {
      logger.info('Initializing WordNet kernel...', { lexicon, options });
      
      const kernel = new WebWordNetKernel();
      
      // Load SQLite WASM module
      const sqlModule = await sqlite3InitModule({
        print: (msg: string) => logger.debug('sqlite3InitModule:', msg),
        printErr: (msg: string) => logger.error('sqlite3InitModule error:', msg)
      });
      
      await kernel.initialize(sqlModule);
      
      setWordnet(kernel);
      setInitialized(true);
      
      logger.info('WordNet kernel initialized successfully');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to initialize WordNet kernel';
      setError(errorMessage);
      logger.error('Failed to initialize WordNet kernel', { error: err });
    } finally {
      setLoading(false);
    }
  }, [loading, config?.lexicon, config?.options]);

  // Close the WordNet kernel
  const close = useCallback(async () => {
    if (wordnet) {
      try {
        await wordnet.close();
        setWordnet(null);
        setInitialized(false);
        logger.info('WordNet kernel closed successfully');
      } catch (err) {
        logger.error('Error closing WordNet kernel', { error: err });
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

  const synsetsByILI = useCallback(async (iliId: string) => {
    const kernel = ensureInitialized();
    return kernel.synsetsByILI(iliId);
  }, [ensureInitialized]);

  // Plugin methods - Relations
  const getHypernyms = createBasicRelationMethod(ensureInitialized, 'getHypernyms');
  const getHyponyms = createBasicRelationMethod(ensureInitialized, 'getHyponyms');
  const getMeronyms = createBasicRelationMethod(ensureInitialized, 'getMeronyms');
  const getHolonyms = createBasicRelationMethod(ensureInitialized, 'getHolonyms');
  const getEntailments = createBasicRelationMethod(ensureInitialized, 'getEntailments');
  const getSimilarTos = createBasicRelationMethod(ensureInitialized, 'getSimilarTos');
  const getRelationsByType = createRelationTypeMethod(ensureInitialized, 'getRelationsByType');
  const getAllRelations = createAllRelationsMethod(ensureInitialized, 'getAllRelations');
  const getRelationTypes = createStringArrayMethod(ensureInitialized, 'getRelationTypes');
  const getRelationStats = createStatsMethod(ensureInitialized, 'getRelationStats');

  // Plugin methods - Similarity
  const getPathSimilarity = useCallback(async (synset1: string, synset2: string) => {
    const kernel = ensureInitialized();
    return kernel.getPathSimilarity(synset1, synset2);
  }, [ensureInitialized]);

  const getWuPalmerSimilarity = useCallback(async (synset1: string, synset2: string) => {
    const kernel = ensureInitialized();
    return kernel.getWuPalmerSimilarity(synset1, synset2);
  }, [ensureInitialized]);

  // Plugin methods - Translation
  const getTranslations = useCallback(async (synsetId: string, targetLanguage?: string) => {
    const kernel = ensureInitialized();
    return kernel.getTranslations(synsetId, targetLanguage);
  }, [ensureInitialized]);

  const getTranslationsByWord = useCallback(async (wordForm: string, sourceLanguage: string, targetLanguage: string) => {
    const kernel = ensureInitialized();
    return kernel.getTranslationsByWord(wordForm, sourceLanguage, targetLanguage);
  }, [ensureInitialized]);

  // Plugin management
  const getPlugins = useCallback(() => {
    if (!wordnet) return [];
    return wordnet.getPlugins();
  }, [wordnet]);

  const has = useCallback((pluginName: string) => {
    if (!wordnet) return false;
    return wordnet.has(pluginName);
  }, [wordnet]);

  // Schema management
  const schemaManager = wordnet?.schemaManager || null;

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
    synsetsByILI,
    
    // Plugin methods - Relations
    getHypernyms,
    getHyponyms,
    getMeronyms,
    getHolonyms,
    getEntailments,
    getSimilarTos,
    getRelationsByType,
    getAllRelations,
    getRelationTypes,
    getRelationStats,
    
    // Plugin methods - Similarity
    getPathSimilarity,
    getWuPalmerSimilarity,
    
    // Plugin methods - Translation
    getTranslations,
    getTranslationsByWord,
    
    // Plugin management
    getPlugins,
    has,
    
    // Schema management
    schemaManager,
  };
}