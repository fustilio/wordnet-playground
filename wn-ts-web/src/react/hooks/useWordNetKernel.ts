import { useState, useEffect, useCallback, useRef } from "react";
import { WebWordNetKernel } from '../../wordnet-kernel.js';
import { createScopedLogger } from "utils/logger";

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
  options?: any;
}): {
  // Core state
  wordnet: WebWordNetKernel | null;
  loading: boolean;
  error: string | null;
  initialized: boolean;
  
  // Core operations
  initialize: (lexicon?: string | string[], options?: any) => Promise<void>;
  close: () => Promise<void>;
  
  // Basic WordNet operations
  words: (query?: any) => Promise<any[]>;
  word: (wordId: string) => Promise<any>;
  synsets: (query?: any) => Promise<any[]>;
  synset: (synsetId: string) => Promise<any>;
  senses: (query?: any) => Promise<any[]>;
  sense: (senseId: string) => Promise<any>;
  ili: (iliId: string) => Promise<any>;
  ilis: (status?: string) => Promise<any[]>;
  synsetsByILI: (iliId: string) => Promise<any[]>;
  
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
  getLeacockChodorowSimilarity: (synset1: string, synset2: string) => Promise<number>;
  getJaccardSimilarity: (synset1: string, synset2: string) => Promise<number>;
  getBestSimilarity: (synset1: string, synset2: string) => Promise<number>;
  findMostSimilar: (synsetId: string, limit?: number) => Promise<Array<{
    id: string;
    similarity: number;
  }>>;
  
  // Plugin methods - Translation
  getTranslations: (synsetId: string, targetLanguage?: string) => Promise<Array<{
    id: string;
    language: string;
    lexicon: string;
    lemma: string;
    pos: string;
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
  getAvailableLanguages: (synsetId: string) => Promise<Array<{
    language: string;
    word_count: number;
  }>>;
  getSynsetsByIli: (ili: string) => Promise<Array<{
    id: string;
    language: string;
    lexicon: string;
    pos: string;
    words: string;
  }>>;
  getTranslationConfidence: (synset1: string, synset2: string) => Promise<number>;
  getTranslationSuggestions: (wordForm: string, sourceLanguage: string, targetLanguage: string) => Promise<Array<{
    sourceSynset: string;
    ili: string;
    confidence: number;
    targetWords: string[];
  }>>;
  
  // Plugin management
  getPlugins: () => string[];
  has: (pluginName: string) => boolean;
  
  // Schema management
  schemaManager: any;
} {
  const [wordnet, setWordnet] = useState<WebWordNetKernel | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [initialized, setInitialized] = useState(false);

  // Initialize the WordNet kernel
  const initialize = useCallback(async (lexicon?: string | string[], options?: any) => {
    try {
      setLoading(true);
      setError(null);
      
      logger.debug("Initializing WordNet kernel", { lexicon, options });
      
      const kernel = new WebWordNetKernel(lexicon || config?.lexicon || 'oewn:2024', options || config?.options);
      await kernel.initialize();
      
      setWordnet(kernel);
      setInitialized(true);
      
      logger.success("WordNet kernel initialized successfully");
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      logger.error("Failed to initialize WordNet kernel", { error: err });
    } finally {
      setLoading(false);
    }
  }, [config]);

  // Close the WordNet kernel
  const close = useCallback(async () => {
    if (wordnet) {
      try {
        await wordnet.close();
        setWordnet(null);
        setInitialized(false);
        logger.debug("WordNet kernel closed");
      } catch (err) {
        logger.warn("Error closing WordNet kernel", { error: err });
      }
    }
  }, [wordnet]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (wordnet) {
        close();
      }
    };
  }, [wordnet, close]);

  // Helper function to ensure wordnet is initialized
  const ensureInitialized = useCallback(() => {
    if (!wordnet || !initialized) {
      throw new Error("WordNet kernel not initialized. Call initialize() first.");
    }
    return wordnet;
  }, [wordnet, initialized]);

  // Basic WordNet operations
  const words = useCallback(async (query?: any) => {
    const kernel = ensureInitialized();
    return kernel.words(query);
  }, [ensureInitialized]);

  const word = useCallback(async (wordId: string) => {
    const kernel = ensureInitialized();
    return kernel.word(wordId);
  }, [ensureInitialized]);

  const synsets = useCallback(async (query?: any) => {
    const kernel = ensureInitialized();
    return kernel.synsets(query);
  }, [ensureInitialized]);

  const synset = useCallback(async (synsetId: string) => {
    const kernel = ensureInitialized();
    return kernel.synset(synsetId);
  }, [ensureInitialized]);

  const senses = useCallback(async (query?: any) => {
    const kernel = ensureInitialized();
    return kernel.senses(query);
  }, [ensureInitialized]);

  const sense = useCallback(async (senseId: string) => {
    const kernel = ensureInitialized();
    return kernel.sense(senseId);
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
  const getHypernyms = useCallback(async (synsetId: string, lexicon?: string) => {
    const kernel = ensureInitialized();
    return kernel.getHypernyms(synsetId, lexicon);
  }, [ensureInitialized]);

  const getHyponyms = useCallback(async (synsetId: string, lexicon?: string) => {
    const kernel = ensureInitialized();
    return kernel.getHyponyms(synsetId, lexicon);
  }, [ensureInitialized]);

  const getMeronyms = useCallback(async (synsetId: string, lexicon?: string) => {
    const kernel = ensureInitialized();
    return kernel.getMeronyms(synsetId, lexicon);
  }, [ensureInitialized]);

  const getHolonyms = useCallback(async (synsetId: string, lexicon?: string) => {
    const kernel = ensureInitialized();
    return kernel.getHolonyms(synsetId, lexicon);
  }, [ensureInitialized]);

  const getEntailments = useCallback(async (synsetId: string, lexicon?: string) => {
    const kernel = ensureInitialized();
    return kernel.getEntailments(synsetId, lexicon);
  }, [ensureInitialized]);

  const getSimilarTos = useCallback(async (synsetId: string, lexicon?: string) => {
    const kernel = ensureInitialized();
    return kernel.getSimilarTos(synsetId, lexicon);
  }, [ensureInitialized]);

  const getRelationsByType = useCallback(async (synsetId: string, relationType: string, lexicon?: string) => {
    const kernel = ensureInitialized();
    return kernel.getRelationsByType(synsetId, relationType, lexicon);
  }, [ensureInitialized]);

  const getAllRelations = useCallback(async (synsetId: string, lexicon?: string) => {
    const kernel = ensureInitialized();
    return kernel.getAllRelations(synsetId, lexicon);
  }, [ensureInitialized]);

  const getRelationTypes = useCallback(async (synsetId: string, lexicon?: string) => {
    const kernel = ensureInitialized();
    return kernel.getRelationTypes(synsetId, lexicon);
  }, [ensureInitialized]);

  const getRelationStats = useCallback(async (synsetId: string, lexicon?: string) => {
    const kernel = ensureInitialized();
    return kernel.getRelationStats(synsetId, lexicon);
  }, [ensureInitialized]);

  // Plugin methods - Similarity
  const getPathSimilarity = useCallback(async (synset1: string, synset2: string) => {
    const kernel = ensureInitialized();
    return kernel.getPathSimilarity(synset1, synset2);
  }, [ensureInitialized]);

  const getWuPalmerSimilarity = useCallback(async (synset1: string, synset2: string) => {
    const kernel = ensureInitialized();
    return kernel.getWuPalmerSimilarity(synset1, synset2);
  }, [ensureInitialized]);

  const getLeacockChodorowSimilarity = useCallback(async (synset1: string, synset2: string) => {
    const kernel = ensureInitialized();
    return kernel.getLeacockChodorowSimilarity(synset1, synset2);
  }, [ensureInitialized]);

  const getJaccardSimilarity = useCallback(async (synset1: string, synset2: string) => {
    const kernel = ensureInitialized();
    return kernel.getJaccardSimilarity(synset1, synset2);
  }, [ensureInitialized]);

  const getBestSimilarity = useCallback(async (synset1: string, synset2: string) => {
    const kernel = ensureInitialized();
    return kernel.getBestSimilarity(synset1, synset2);
  }, [ensureInitialized]);

  const findMostSimilar = useCallback(async (synsetId: string, limit?: number) => {
    const kernel = ensureInitialized();
    return kernel.findMostSimilar(synsetId, limit);
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

  const getAvailableLanguages = useCallback(async (synsetId: string) => {
    const kernel = ensureInitialized();
    return kernel.getAvailableLanguages(synsetId);
  }, [ensureInitialized]);

  const getSynsetsByIli = useCallback(async (ili: string) => {
    const kernel = ensureInitialized();
    return kernel.getSynsetsByIli(ili);
  }, [ensureInitialized]);

  const getTranslationConfidence = useCallback(async (synset1: string, synset2: string) => {
    const kernel = ensureInitialized();
    return kernel.getTranslationConfidence(synset1, synset2);
  }, [ensureInitialized]);

  const getTranslationSuggestions = useCallback(async (wordForm: string, sourceLanguage: string, targetLanguage: string) => {
    const kernel = ensureInitialized();
    return kernel.getTranslationSuggestions(wordForm, sourceLanguage, targetLanguage);
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
    getLeacockChodorowSimilarity,
    getJaccardSimilarity,
    getBestSimilarity,
    findMostSimilar,
    
    // Plugin methods - Translation
    getTranslations,
    getTranslationsByWord,
    getAvailableLanguages,
    getSynsetsByIli,
    getTranslationConfidence,
    getTranslationSuggestions,
    
    // Plugin management
    getPlugins,
    has,
    
    // Schema management
    schemaManager,
  };
}


