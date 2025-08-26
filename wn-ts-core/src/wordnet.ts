/**
 * Abstract Wordnet class for wn-ts-core
 * This package is environment-agnostic and defines the interface for concrete implementations
 * 
 * Implements the complete Python Wn API including:
 * - Primary queries (words, synsets, senses)
 * - Secondary queries (relations, translations, etc.)
 * - Interlingual queries via ILI
 * - Enhanced lemmatization and normalization
 * - Cross-lingual capabilities
 */

import type {
  Word,
  Sense,
  Synset,
  Lexicon,
  PartOfSpeech,
  WordnetOptions,
  ILI,
  Project,
  WordQuery,
  SynsetQuery,
  SenseQuery
} from './types.js';

export abstract class BaseWordnet {
  protected lexiconIds: string[]; // Support multiple lexicons
  protected expand: string[];
  protected normalizer?: ((form: string) => string) | undefined;
  protected lemmatizer?: ((form: string, pos?: PartOfSpeech) => Record<PartOfSpeech, Set<string>>) | undefined;
  protected searchAllForms: boolean;
  protected lang: string | undefined;
  protected lexicon?: Lexicon;

  constructor(options: WordnetOptions = {}) {
    // Parse lexicon specifier if provided
    let lexiconSpecifiers: string[] = [];
    
    if (options.lexicon) {
      if (Array.isArray(options.lexicon)) {
        lexiconSpecifiers = options.lexicon;
      } else {
        // Handle single lexicon string
        lexiconSpecifiers = [options.lexicon];
      }
    } else {
      // Default to oewn if no lexicon specified
      lexiconSpecifiers = ['oewn'];
    }
    
    this.lexiconIds = lexiconSpecifiers;
    this.expand = Array.isArray(options.expand) ? options.expand : options.expand ? [options.expand] : [];
    if (options.normalizer) {
      this.normalizer = options.normalizer;
    }
    if (options.lemmatizer) {
      this.lemmatizer = options.lemmatizer;
    }
    this.searchAllForms = options.searchAllForms !== false; // Default to true
    this.lang = options.language;
  }

  // ============================================================================
  // PRIMARY QUERIES - Core query methods matching Python Wn API
  // ============================================================================

  /**
   * Get words matching the query criteria
   * Equivalent to wn.words() in Python Wn
   */
  abstract words(query?: WordQuery): Promise<Word[]>;

  /**
   * Get a specific word by ID
   * Equivalent to wn.word() in Python Wn
   */
  abstract word(wordId: string): Promise<Word>;

  /**
   * Get synsets matching the query criteria
   * Equivalent to wn.synsets() in Python Wn
   */
  abstract synsets(query?: SynsetQuery): Promise<Synset[]>;

  /**
   * Get a specific synset by ID
   * Equivalent to wn.synset() in Python Wn
   */
  abstract synset(synsetId: string): Promise<Synset>;

  /**
   * Get senses matching the query criteria
   * Equivalent to wn.senses() in Python Wn
   */
  abstract senses(query?: SenseQuery): Promise<Sense[]>;

  /**
   * Get a specific sense by ID
   * Equivalent to wn.sense() in Python Wn
   */
  abstract sense(senseId: string): Promise<Sense>;

  // ============================================================================
  // INTERLINGUAL QUERIES - Cross-language concept mapping
  // ============================================================================

  /**
   * Get ILI by ID
   * Equivalent to wn.ili() in Python Wn
   */
  abstract ili(iliId: string): Promise<ILI>;

  /**
   * Get all ILIs, optionally filtered by status
   * Equivalent to wn.ilis() in Python Wn
   */
  abstract ilis(status?: string): Promise<ILI[]>;

  /**
   * Get synsets by ILI (cross-language concept lookup)
   * Equivalent to wn.synsets(ili='...') in Python Wn
   */
  abstract synsetsByILI(iliId: string): Promise<Synset[]>;

  // ============================================================================
  // LEXICON MANAGEMENT - Working with multiple wordnets
  // ============================================================================

  /**
   * Get all available lexicons
   * Equivalent to wn.lexicons() in Python Wn
   */
  abstract lexicons(): Promise<Lexicon[]>;

  /**
   * Get expanded lexicons (dependencies)
   * Equivalent to wn.expanded_lexicons() in Python Wn
   */
  abstract expandedLexicons(): Promise<Lexicon[]>;

  /**
   * Get projects (metadata about wordnet projects)
   * Equivalent to wn.projects() in Python Wn
   */
  abstract getProjects(): Promise<Project[]>;

  // ============================================================================
  // ENHANCED QUERY METHODS - Additional filtering and search capabilities
  // ============================================================================

  /**
   * Search for words with fuzzy matching and advanced filtering
   * Enhanced version of words() with more options
   */
  abstract searchWords(query: WordQuery & {
    fuzzy?: boolean;
    maxResults?: number;
    includeForms?: boolean;
  }): Promise<Word[]>;

  /**
   * Search for synsets with advanced filtering
   * Enhanced version of synsets() with more options
   */
  abstract searchSynsets(query: SynsetQuery & {
    fuzzy?: boolean;
    maxResults?: number;
    includeDefinitions?: boolean;
    includeExamples?: boolean;
  }): Promise<Synset[]>;

  /**
   * Get words by form (including inflected forms)
   * Equivalent to wn.words(form='...') in Python Wn
   */
  abstract wordsByForm(form: string, options?: {
    pos?: PartOfSpeech;
    lexicon?: string | string[];
    lang?: string;
    includeInflected?: boolean;
  }): Promise<Word[]>;

  /**
   * Get synsets by word form
   * Equivalent to wn.synsets(form='...') in Python Wn
   */
  abstract synsetsByForm(form: string, options?: {
    pos?: PartOfSpeech;
    lexicon?: string | string[];
    lang?: string;
  }): Promise<Synset[]>;

  // ============================================================================
  // LEMMATIZATION AND NORMALIZATION - Enhanced morphological analysis
  // ============================================================================

  /**
   * Get all forms of a word (including inflections)
   * Equivalent to Word.forms() in Python Wn
   */
  abstract getWordForms(wordId: string): Promise<string[]>;

  /**
   * Get the canonical form (lemma) of a word
   * Equivalent to Word.lemma() in Python Wn
   */
  abstract getWordLemma(wordId: string): Promise<string>;

  /**
   * Find base forms of a word using morphological analysis
   * Equivalent to wn.morphy() in Python Wn
   */
  abstract morphy(form: string, pos?: PartOfSpeech): Promise<Record<PartOfSpeech, Set<string>>>;

  /**
   * Get derived words (morphologically related)
   * Equivalent to Word.derived_words() in Python Wn
   */
  abstract getDerivedWords(wordId: string): Promise<Word[]>;

  /**
   * Normalize a word form using the configured normalizer
   * Enhanced normalization capabilities
   */
  abstract normalizeForm(form: string): Promise<string>;

  // ============================================================================
  // RELATIONSHIP QUERIES - Hierarchical and semantic relations
  // ============================================================================

  /**
   * Get hypernyms (more general concepts)
   * Equivalent to Synset.hypernyms() in Python Wn
   */
  abstract getHypernyms(synsetId: string): Promise<Synset[]>;

  /**
   * Get hyponyms (more specific concepts)
   * Equivalent to Synset.hyponyms() in Python Wn
   */
  abstract getHyponyms(synsetId: string): Promise<Synset[]>;

  /**
   * Get all related synsets by relation type
   * Equivalent to Synset.get_related() in Python Wn
   */
  abstract getRelatedSynsets(synsetId: string, relationType: string): Promise<Synset[]>;

  /**
   * Get all related senses by relation type
   * Equivalent to Sense.get_related() in Python Wn
   */
  abstract getRelatedSenses(senseId: string, relationType: string): Promise<Sense[]>;

  /**
   * Get the shortest path between two synsets
   * Equivalent to Synset.shortest_path() in Python Wn
   */
  abstract getShortestPath(synsetId1: string, synsetId2: string): Promise<Synset[]>;

  /**
   * Get the depth of a synset in the hierarchy
   * Equivalent to Synset.max_depth() in Python Wn
   */
  abstract getSynsetDepth(synsetId: string): Promise<number>;

  // ============================================================================
  // TRANSLATION AND CROSS-LINGUAL QUERIES
  // ============================================================================

  /**
   * Translate a word to target language(s)
   * Equivalent to Word.translate() in Python Wn
   */
  abstract translateWord(wordId: string, targetLang: string): Promise<Record<string, Word[]>>;

  /**
   * Translate a synset to target language(s)
   * Equivalent to Synset.translate() in Python Wn
   */
  abstract translateSynset(synsetId: string, targetLang: string): Promise<Synset[]>;

  /**
   * Translate a sense to target language(s)
   * Equivalent to Sense.translate() in Python Wn
   */
  abstract translateSense(senseId: string, targetLang: string): Promise<Sense[]>;

  /**
   * Get cross-lingual synsets by ILI
   * Enhanced interlingual lookup
   */
  abstract getCrossLingualSynsets(iliId: string, targetLangs?: string[]): Promise<Record<string, Synset[]>>;

  // ============================================================================
  // CONTENT AND METADATA QUERIES
  // ============================================================================

  /**
   * Get definitions for a synset
   * Equivalent to Synset.definition() in Python Wn
   */
  abstract getDefinitions(synsetId: string): Promise<string[]>;

  /**
   * Get examples for a synset
   * Equivalent to Synset.examples() in Python Wn
   */
  abstract getExamples(synsetId: string): Promise<string[]>;

  /**
   * Get examples for a sense
   * Equivalent to Sense.examples() in Python Wn
   */
  abstract getSenseExamples(senseId: string): Promise<string[]>;

  /**
   * Get all words in a synset
   * Equivalent to Synset.words() in Python Wn
   */
  abstract getSynsetWords(synsetId: string): Promise<Word[]>;

  /**
   * Get all lemmas in a synset
   * Equivalent to Synset.lemmas() in Python Wn
   */
  abstract getSynsetLemmas(synsetId: string): Promise<string[]>;

  /**
   * Get all senses in a synset
   * Equivalent to Synset.senses() in Python Wn
   */
  abstract getSynsetSenses(synsetId: string): Promise<Sense[]>;

  // ============================================================================
  // STATISTICS AND ANALYTICS - Data quality and usage metrics
  // ============================================================================

  /**
   * Get overall statistics
   * Equivalent to wn.statistics() in Python Wn
   */
  abstract getStatistics(): Promise<{
    totalWords: number;
    totalSynsets: number;
    totalSenses: number;
    totalILIs: number;
    totalLexicons: number;
  }>;

  /**
   * Get lexicon-specific statistics
   * Enhanced statistics per lexicon
   */
  abstract getLexiconStatistics(lexiconId?: string): Promise<{
    lexiconId: string;
    label: string;
    language: string;
    version: string;
    wordCount: number;
    synsetCount: number;
    senseCount: number;
    iliCount: number;
  }[]>;

  /**
   * Get data quality metrics
   * Enhanced quality analysis
   */
  abstract getDataQualityMetrics(): Promise<{
    synsetsWithILI: number;
    synsetsWithoutILI: number;
    iliCoveragePercentage: number;
    emptySynsets: number;
    synsetsWithDefinitions: number;
    synsetsWithExamples: number;
    averageSynsetSize: number;
  }>;

  /**
   * Get part of speech distribution
   * Enhanced POS analysis
   */
  abstract getPartOfSpeechDistribution(): Promise<Record<string, number>>;

  /**
   * Get synset size analysis
   * Enhanced size distribution analysis
   */
  abstract getSynsetSizeAnalysis(): Promise<{
    averageSize: number;
    maxSize: number;
    minSize: number;
    sizeDistribution: Record<number, number>;
  }>;

  // ============================================================================
  // UTILITY AND CONFIGURATION METHODS
  // ============================================================================

  /**
   * Check if a lexicon is available
   * Utility method for lexicon availability
   */
  abstract hasLexicon(lexiconId: string): Promise<boolean>;

  /**
   * Get supported languages
   * Utility method for language support
   */
  abstract getSupportedLanguages(): Promise<string[]>;

  /**
   * Get lexicon dependencies
   * Utility method for dependency management
   */
  abstract getLexiconDependencies(lexiconId: string): Promise<string[]>;

  /**
   * Close the wordnet connection
   * Cleanup method
   */
  abstract close(): Promise<void>;


} 
