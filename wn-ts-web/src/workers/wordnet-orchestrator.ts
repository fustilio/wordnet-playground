/**
 * WordNet Orchestrator
 * 
 * High-level orchestrator that manages a single WordNet instance with multiple lexicons.
 * Focuses on lexicon lifecycle management, cross-lexicon operations, and query optimization.
 * 
 * Architecture:
 * - WordNetWorker → WordNetOrchestrator → DataLoader/WebWordnet
 * - This is the core business logic layer that coordinates WordNet operations
 * - Manages lexicon states, handles cross-lexicon queries, and optimizes data loading
 * - Provides a clean interface for the worker to interact with WordNet internals
 * 
 * This operates at a higher abstraction level than WordNetWorkerClient, which handles
 * worker communication and state tracking. The orchestrator focuses on WordNet-specific
 * operations and lexicon management.
 */

import type { Lexicon, PartOfSpeech, Word, Sense, Synset, ILI } from "wn-ts-core";
import { WebWordnet } from "../client/submodules/web-wordnet.js";
import { DataLoader } from "../data-loader.js";
import { WordNetEventEmitter, WordNetEvents } from "../event-emitter.js";
import type { EventCallback } from "../event-emitter.js";
import type { Sqlite3Static } from "@sqlite.org/sqlite-wasm";
import type { ProgressCallback } from "../types/progress.js";
import { createScopedLogger } from "utils/logger";
import { createWordNetInstance } from "../factory.js";
import type { WordQuery, SynsetQuery, SenseQuery } from "wn-ts-core";

export interface LexiconState {
  id: string;
  version: string;
  language: string;
  label: string;
  status: 'loading' | 'loaded' | 'error' | 'unloaded';
  lastLoaded?: Date;
  lastChecked?: Date;
  needsRedownload: boolean;
  error?: string;
  statistics?: {
    wordCount: number;
    synsetCount: number;
    senseCount: number;
  };
  metadata?: {
    checksum?: string;
    fileSize?: number;
    downloadUrl?: string;
  };
}

export interface OrchestratorOptions {
  defaultLexicons?: string[]; // Array of default lexicons to preload
  defaultLexicon?: string; // Single default lexicon (for backward compatibility)
  autoCheckUpdates?: boolean;
  checkInterval?: number; // milliseconds
  maxConcurrentLoads?: number;
  enableCaching?: boolean;
  lexiconId?: string; // Base lexicon ID for the orchestrator
}

export interface LoadLexiconOptions {
  forceRedownload?: boolean;
  onProgress?: ProgressCallback;
  validateChecksum?: boolean;
}

export interface QueryOptions {
  lexicons?: string[];
  language?: string;
  version?: string;
  includeUnloaded?: boolean;
}

const logger = createScopedLogger('WordNetOrchestrator');

export class WordNetOrchestrator {
  private wordnet: WebWordnet | null = null;
  private dataLoader: DataLoader | null = null;
  private lexiconStates = new Map<string, LexiconState>();
  private eventEmitter = new WordNetEventEmitter();
  private options: OrchestratorOptions;
  private isInitialized = false;
  private loadQueue: Array<() => Promise<void>> = [];
  private activeLoads = 0;

  constructor(options: OrchestratorOptions = {}) {
    this.options = {
      defaultLexicons: ['oewn:2024'], // Array of default lexicons to preload
      autoCheckUpdates: true,
      checkInterval: 24 * 60 * 60 * 1000, // 24 hours
      maxConcurrentLoads: 2,
      enableCaching: true,
      lexiconId: 'oewn:2024', // Default base lexicon (for backward compatibility)
      ...options
    };

    // Handle backward compatibility: if defaultLexicon is provided, use it
    if (options.defaultLexicon && !options.defaultLexicons) {
      this.options.defaultLexicons = [options.defaultLexicon];
    }

    // Start update checker if enabled
    if (this.options.autoCheckUpdates) {
      this.startUpdateChecker();
    }

    // Start periodic database flush for OPFS persistence
    this.startPeriodicFlush();
  }

  /**
   * Initialize the orchestrator with SQLite module
   */
  async initialize(sqlModule: Sqlite3Static, options?: { onProgress?: (progress: number) => void }): Promise<void> {
    if (this.isInitialized) {
      logger.warn('Orchestrator already initialized');
      return; // Already initialized
    }

    // Create a temporary WebWordnet instance for initialization
    // The actual lexicon ID will be set when the first lexicon is loaded
    const { wordnet, dataLoader } = await createWordNetInstance('*');
    this.wordnet = wordnet;
    this.dataLoader = dataLoader;
    
    // Initialize the instance
    await this.wordnet.initialize(sqlModule);
    
    // Set initialized flag BEFORE trying to load default lexicons
    this.isInitialized = true;
    
    // Emit initialized event
    this.eventEmitter.emit(WordNetEvents.INITIALIZED, { success: true });
    
    // Auto-load default lexicons if enabled
    if (this.options.defaultLexicons && this.options.defaultLexicons.length > 0) {
      await this.loadDefaultLexicons(options?.onProgress);
    }
  }

  /**
   * Get the underlying WordNet instance
   */
  getWordNetInstance(): WebWordnet {
    if (!this.wordnet) {
      throw new Error("Orchestrator not initialized");
    }
    return this.wordnet;
  }

  /**
   * Get the list of default lexicons
   */
  getDefaultLexicons(): string[] {
    return this.options.defaultLexicons || [];
  }

  /**
   * Set the default lexicons
   */
  setDefaultLexicons(lexicons: string[]): void {
    this.options.defaultLexicons = lexicons;
  }

  /**
   * Check if all default lexicons are loaded
   */
  areDefaultLexiconsLoaded(): boolean {
    if (!this.options.defaultLexicons || this.options.defaultLexicons.length === 0) {
      return true; // No default lexicons means nothing to check
    }

    return this.options.defaultLexicons.every(lexiconId => {
      const state = this.lexiconStates.get(lexiconId);
      return state?.status === 'loaded';
    });
  }

  /**
   * Load all default lexicons
   */
  private async loadDefaultLexicons(onProgress?: (progress: number) => void): Promise<void> {
    if (!this.options.defaultLexicons || this.options.defaultLexicons.length === 0) {
      return;
    }

    logger.info(`Loading ${this.options.defaultLexicons.length} default lexicons: ${this.options.defaultLexicons.join(', ')}`);
    
    for (let i = 0; i < this.options.defaultLexicons.length; i++) {
      const lexiconId = this.options.defaultLexicons[i];
      const progress = onProgress ? (p: number) => onProgress(p) : undefined;
      
      try {
        await this.loadLexicon(lexiconId, { onProgress: progress });
        logger.info(`✅ Default lexicon loaded: ${lexiconId}`);
      } catch (error) {
        logger.error(`❌ Failed to load default lexicon ${lexiconId}:`, error);
        // Continue loading other lexicons even if one fails
      }
    }
  }

  /**
   * Load multiple lexicons at once
   */
  async loadLexicons(lexiconIds: string[], options: LoadLexiconOptions = {}): Promise<void> {
    if (!this.isInitialized || !this.dataLoader) {
      throw new Error("Orchestrator not initialized");
    }

    logger.info(`Loading ${lexiconIds.length} lexicons: ${lexiconIds.join(', ')}`);
    
    // Load lexicons concurrently up to the max concurrent limit
    const chunks = [];
    for (let i = 0; i < lexiconIds.length; i += this.options.maxConcurrentLoads!) {
      chunks.push(lexiconIds.slice(i, i + this.options.maxConcurrentLoads!));
    }

    for (const chunk of chunks) {
      await Promise.all(chunk.map(lexiconId => this.loadLexicon(lexiconId, options)));
    }
  }

  /**
   * Load a lexicon into the single WordNet instance
   */
  async loadLexicon(lexiconId: string, options: LoadLexiconOptions = {}): Promise<void> {
    if (!this.isInitialized || !this.dataLoader) {
      throw new Error("Orchestrator not initialized");
    }

    // Check if already loaded
    if (this.lexiconStates.get(lexiconId)?.status === 'loaded' && !options.forceRedownload) {
      return;
    }

    // Add to load queue if at capacity
    if (this.activeLoads >= this.options.maxConcurrentLoads!) {
      return new Promise((resolve, reject) => {
        this.loadQueue.push(async () => {
          try {
            await this.loadLexiconInternal(lexiconId, options);
            resolve();
          } catch (error) {
            reject(error);
          }
        });
      });
    }

    return this.loadLexiconInternal(lexiconId, options);
  }

  private async loadLexiconInternal(lexiconId: string, options: LoadLexiconOptions): Promise<void> {
    this.activeLoads++;
    try {
      // Update state to loading
      this.updateLexiconState(lexiconId, { status: 'loading' });

      // Emit progress event for lexicon loading start
      this.eventEmitter.emit(WordNetEvents.PROGRESS, 0, `Starting to load ${lexiconId}`, new Date().toISOString());

      // Check if this specific lexicon is already loaded
      const hasSpecificData = await this.wordnet!.hasSpecificLexiconLoaded(lexiconId);
      
      if (!hasSpecificData || options.forceRedownload) {
        // Create enhanced progress callback that emits events
        const enhancedProgress = options.onProgress ? 
          (progress: number) => {
            // Call the original progress callback
            options.onProgress!(progress);
            
            // Emit progress event through orchestrator
            this.eventEmitter.emit(WordNetEvents.PROGRESS, progress, `${lexiconId}: progress ${Math.round(progress * 100)}%`, new Date().toISOString());
          } : 
          (progress: number) => {
            // Emit progress event through orchestrator even without callback
            this.eventEmitter.emit(WordNetEvents.PROGRESS, progress, `${lexiconId}: progress ${Math.round(progress * 100)}%`, new Date().toISOString());
          };

        // Load data using the single data loader
        await this.dataLoader!.downloadAndLoad(lexiconId, {
          progress: enhancedProgress
        });
      }

      // Update state to loaded
      this.updateLexiconState(lexiconId, {
        status: 'loaded',
        lastLoaded: new Date(),
        needsRedownload: false
      });

      // The WebWordnet instance now supports multiple lexicons natively
      // No need to manipulate lexicon IDs - just track the state
      logger.info(`✅ Lexicon ${lexiconId} loaded successfully`);
      
      // Emit package loaded event
      this.eventEmitter.emit('packageLoaded', lexiconId, true, new Date().toISOString());

      // Emit data changed event
      this.eventEmitter.emit(WordNetEvents.DATA_CHANGED, 'packageLoaded', { packageId: lexiconId }, new Date().toISOString());

      // Emit statistics updated event
      await this.emitStatisticsUpdated();
      
    } catch (error) {
      // Update state to error
      this.updateLexiconState(lexiconId, {
        status: 'error',
        error: error instanceof Error ? error.message : String(error)
      });

      // Emit error event
      this.eventEmitter.emit(WordNetEvents.ERROR, 'loadLexicon', error instanceof Error ? error.message : String(error), new Date().toISOString());

      // Emit package loaded event with error
      this.eventEmitter.emit('packageLoaded', lexiconId, false, error instanceof Error ? error.message : String(error), new Date().toISOString());

      throw error;
    } finally {
      // Always decrement and process queue to avoid deadlocks/timeouts
      this.activeLoads--;
      this.processLoadQueue();
    }
  }

  /**
   * Ensure a lexicon is loaded (load if not already)
   */
  async ensureLexiconLoaded(lexiconId: string, options: LoadLexiconOptions = {}): Promise<void> {
    const state = this.lexiconStates.get(lexiconId);
    if (state?.status === 'loaded' && !options.forceRedownload) {
      return;
    }
    return this.loadLexicon(lexiconId, options);
  }

  /**
   * Unload a lexicon (mark as unloaded, but keep in database)
   */
  async unloadLexicon(lexiconId: string): Promise<void> {
    // Note: We don't actually remove data from the database, just mark as unloaded
    // This allows for efficient re-loading without re-downloading
    this.updateLexiconState(lexiconId, { status: 'unloaded' });
  }

  /**
   * Query across multiple lexicons using the single WordNet instance
   */
  async queryWords(term: string, pos?: PartOfSpeech, options: QueryOptions = {}): Promise<Word[]> {
    if (!this.wordnet) {
      throw new Error("Orchestrator not initialized");
    }

    // Use the single instance to query across all loaded lexicons
    // The WebWordnet instance can handle cross-lexicon queries more efficiently
    const query: WordQuery = { form: term };
    if (pos) query.pos = pos;
    if (options.lexicons && options.lexicons.length > 0) query.lexicon = options.lexicons[0];
    return this.wordnet.words(query);
  }

  async querySynsets(term: string, pos?: PartOfSpeech, options: QueryOptions = {}): Promise<Synset[]> {
    if (!this.wordnet) {
      throw new Error("Orchestrator not initialized");
    }

    const query: SynsetQuery = { form: term };
    if (pos) query.pos = pos;
    if (options.lexicons && options.lexicons.length > 0) query.lexicon = options.lexicons[0];
    return this.wordnet.synsets(query);
  }

  async querySenses(term: string, pos?: PartOfSpeech, options: QueryOptions = {}): Promise<Sense[]> {
    if (!this.wordnet) {
      throw new Error("Orchestrator not initialized");
    }

    const query: SenseQuery = { wordIdOrForm: term };
    if (pos) query.pos = pos;
    if (options.lexicons && options.lexicons.length > 0) query.lexicon = options.lexicons[0];
    return this.wordnet.senses(query);
  }

  /**
   * Find ILI identifier for a given synset by querying the CILI package
   * This is the key method for cross-lingual mapping
   */
  async getIliForSynset(synsetId: string): Promise<string | null> {
    if (!this.wordnet) {
      throw new Error("Orchestrator not initialized");
    }

    try {
      // Get the query service to access the database directly
      const queryService = this.wordnet.getQueryService?.();
      if (!queryService) {
        throw new Error("Query service not available");
      }

      // Method 1: Check if the English synset already has an ILI
      // We need to find the synset by its ID, not by form
      try {
        const db = (queryService as any).db;
        if (db) {
          // Query the synsets table directly by ID
          const synsetResult = await db.selectFrom('synsets')
            .select(['id', 'ili', 'lexicon', 'language'])
            .where('id', '=', synsetId)
            .where('language', '=', 'en')
            .executeTakeFirst();
          
          if (synsetResult && synsetResult.ili) {
            return synsetResult.ili;
          }
        }
      } catch (dbError) {
        console.warn('Direct synset query failed:', dbError);
      }

      // Method 2: Try to find ILI through word-based mapping
      // Get words in this synset and look for related concepts
      try {
        const db = (queryService as any).db;
        if (db) {
          // Get words in this synset
          const wordsResult = await db.selectFrom('senses')
            .innerJoin('words', 'senses.word_id', 'words.id')
            .select(['words.lemma', 'words.pos'])
            .where('senses.synset_id', '=', synsetId)
            .execute();
          
          if (wordsResult && wordsResult.length > 0) {
            // Try to find ILI through word forms
            for (const word of wordsResult) {
              // Look for synsets in CILI that might contain this word
              // Use the correct SynsetQuery interface
              const ciliSynsets = await queryService.getSynsets({ 
                form: word.lemma,
                lexicon: 'cili:1.0'
              } as any);
              
              if (ciliSynsets && ciliSynsets.length > 0) {
                const ciliSynset = ciliSynsets[0];
                if (ciliSynset.ili) {
                  return ciliSynset.ili;
                }
              }
            }
          }
        }
      } catch (dbError) {
        console.warn('Word-based mapping failed:', dbError);
      }

      // Method 3: Try to find ILI through direct database query
      // This is a fallback that directly queries the database for ILI mappings
      try {
        const db = (queryService as any).db;
        if (db) {
          // Query the ilis table directly for potential matches
          const iliResults = await db.selectFrom('ilis')
            .select(['id', 'definition'])
            .where('definition', 'like', `%${synsetId}%`)
            .limit(5)
            .execute();
          
          if (iliResults && iliResults.length > 0) {
            // Return the first matching ILI
            return iliResults[0].id;
          }
        }
      } catch (dbError) {
        // If direct database access fails, continue to next method
        console.warn('Direct database query failed:', dbError);
      }

      // Method 4: Try to find ILI through synset ID pattern matching
      // Some synset IDs follow patterns that can be mapped to ILI identifiers
      try {
        const db = (queryService as any).db;
        if (db) {
          // Extract numeric part from synset ID (e.g., "oewn-03999061-n" -> "03999061")
          const numericMatch = synsetId.match(/(\d+)/);
          if (numericMatch) {
            const numericPart = numericMatch[1];
            
            // Try to find ILI with similar numeric pattern
            const iliResults = await db.selectFrom('ilis')
              .select(['id', 'definition'])
              .where('id', 'like', `%${numericPart}%`)
              .limit(5)
              .execute();
            
            if (iliResults && iliResults.length > 0) {
              return iliResults[0].id;
            }
          }
        }
      } catch (dbError) {
        console.warn('Pattern matching query failed:', dbError);
      }

      // No ILI found
      return null;
    } catch (error) {
      console.error('Error in getIliForSynset:', error);
      return null;
    }
  }

  /**
   * Find cross-lingual equivalents using multiple strategies
   * Returns words, strategy used, and confidence score
   */
  async findCrossLingualEquivalents(
    sourceSynsetId: string, 
    targetLanguage: string,
    options: { 
      useIli?: boolean; 
      useWordSimilarity?: boolean; 
      useDefinitionMatching?: boolean 
    } = {}
  ): Promise<{
    words: any[];
    strategy: string;
    confidence: number;
  }> {
    if (!this.wordnet) {
      throw new Error("Orchestrator not initialized");
    }

    const queryService = this.wordnet.getQueryService?.();
    if (!queryService) {
      throw new Error("Query service not available");
    }

    const { 
      useIli = true, 
      useWordSimilarity = true, 
      useDefinitionMatching = false 
    } = options;

    // Strategy 1: ILI-based mapping (highest confidence)
    if (useIli) {
      try {
        const ili = await this.getIliForSynset(sourceSynsetId);
        if (ili) {
          const targetWords = await queryService.getWordsByIliAndLanguage(ili, targetLanguage);
          if (targetWords && targetWords.length > 0) {
            return {
              words: targetWords,
              strategy: 'ili-based-mapping',
              confidence: 0.9
            };
          }
        }
      } catch (error) {
        console.warn('ILI-based mapping failed:', error);
      }
    }

    // Strategy 2: Word-based similarity mapping
    if (useWordSimilarity) {
      try {
        // Get words from the source synset
        const sourceWords = await queryService.getWordsBySynsetAndLanguage(sourceSynsetId, 'en');
        if (sourceWords && sourceWords.length > 0) {
          // Try to find exact word matches in target language
          for (const sourceWord of sourceWords) {
            const targetWords = await queryService.getWords({
              form: sourceWord.lemma,
              language: targetLanguage
            });
            if (targetWords && targetWords.length > 0) {
              return {
                words: targetWords,
                strategy: 'exact-word-match',
                confidence: 0.8
              };
            }
          }

          // Try partial word matching (e.g., "jumping" -> "jump" variations)
          for (const sourceWord of sourceWords) {
            const baseForm = this.getBaseForm(sourceWord.lemma);
            if (baseForm && baseForm !== sourceWord.lemma) {
              const targetWords = await queryService.getWords({
                form: baseForm,
                language: targetLanguage
              });
              if (targetWords && targetWords.length > 0) {
                return {
                  words: targetWords,
                  strategy: 'partial-word-match',
                  confidence: 0.6
                };
              }
            }
          }
        }
      } catch (error) {
        console.warn('Word-based similarity mapping failed:', error);
      }
    }

    // Strategy 3: Definition-based matching (placeholder for future)
    if (useDefinitionMatching) {
      try {
        // This would require implementing definition similarity algorithms
        // For now, just return empty result
        console.log('Definition-based matching not yet implemented');
      } catch (error) {
        console.warn('Definition-based matching failed:', error);
      }
    }

    // Strategy 4: Common word fallback (lowest confidence)
    try {
      const fallbackWords = await this.findCommonWordFallback(sourceSynsetId, targetLanguage, queryService);
      if (fallbackWords && fallbackWords.length > 0) {
        return {
          words: fallbackWords,
          strategy: 'common-word-fallback',
          confidence: 0.3
        };
      }
    } catch (error) {
      console.warn('Common word fallback failed:', error);
    }

    // No strategy succeeded
    return {
      words: [],
      strategy: 'none',
      confidence: 0.0
    };
  }

  /**
   * Get base form of a word (simple stemming)
   * This is a basic implementation - could be enhanced with proper stemming
   */
  private getBaseForm(word: string): string | null {
    // Simple rules for common English patterns
    if (word.endsWith('ing')) {
      return word.slice(0, -3);
    }
    if (word.endsWith('ed')) {
      return word.slice(0, -2);
    }
    if (word.endsWith('s')) {
      return word.slice(0, -1);
    }
    if (word.endsWith('er')) {
      return word.slice(0, -2);
    }
    if (word.endsWith('est')) {
      return word.slice(0, -3);
    }
    return null;
  }

  /**
   * Find definition-based matches by searching for key terms in definitions
   */
  private async findDefinitionBasedMatches(
    definitions: any[], 
    targetLanguage: string, 
    queryService: any
  ): Promise<any[]> {
    // This is a simplified implementation
    // In a full implementation, you would:
    // 1. Extract key terms from definitions
    // 2. Translate those terms to the target language
    // 3. Search for words in the target language
    return [];
  }

  /**
   * Enhanced common word fallback mechanism
   */
  private async findCommonWordFallback(
    sourceSynsetId: string, 
    targetLanguage: string, 
    queryService: any
  ): Promise<any[]> {
    try {
      const db = (queryService as any).db;
      if (db) {
        // Get the source synset to understand its meaning
        const sourceSynset = await db.selectFrom('synsets')
          .select(['id', 'pos', 'language'])
          .where('id', '=', sourceSynsetId)
          .executeTakeFirst();

        if (sourceSynset) {
          // Try to find target language words with similar meanings
          // This is a simplified approach - in practice you'd want more sophisticated matching
          const targetWords = await queryService.getWords({ 
            lang: targetLanguage,
            pos: sourceSynset.pos 
          });

          if (targetWords && targetWords.length > 0) {
            // Return a subset of common words
            return targetWords.slice(0, 5);
          }
        }
      }
    } catch (error) {
      console.warn('Enhanced common word fallback failed:', error);
    }

    return [];
  }

  /**
   * Get lexicon statistics from the single instance
   */
  async getLexiconStatistics(lexiconId?: string): Promise<any[]> {
    if (!this.wordnet) {
      throw new Error("Orchestrator not initialized");
    }

    return this.wordnet.getLexiconStatistics(lexiconId);
  }

  /**
   * Get overall statistics from the single instance
   */
  async getOverallStatistics(): Promise<{
    totalWords: number;
    totalSynsets: number;
    totalSenses: number;
    totalILIs: number;
    totalLexicons: number;
    lexiconBreakdown: Record<string, any>;
  }> {
    if (!this.wordnet) {
      throw new Error("Orchestrator not initialized");
    }

    const statistics = await this.wordnet.getStatistics();
    const lexiconStats = await this.wordnet.getLexiconStatistics();
    
    return {
      ...statistics,
      totalLexicons: lexiconStats.length,
      lexiconBreakdown: Object.fromEntries(
        lexiconStats.map(stat => [stat.lexiconId, stat])
      )
    };
  }

  /**
   * Check if lexicons need updates
   */
  async checkForUpdates(): Promise<{
    needsUpdate: string[];
    upToDate: string[];
    errors: Array<{ lexiconId: string; error: string }>;
  }> {
    const needsUpdate: string[] = [];
    const upToDate: string[] = [];
    const errors: Array<{ lexiconId: string; error: string }> = [];

    for (const [lexiconId, state] of this.lexiconStates) {
      try {
        // Check if lexicon needs redownload based on metadata
        const needsRedownload = await this.checkIfNeedsRedownload(lexiconId, state);
        
        if (needsRedownload) {
          needsUpdate.push(lexiconId);
          this.updateLexiconState(lexiconId, { needsRedownload: true });
        } else {
          upToDate.push(lexiconId);
          this.updateLexiconState(lexiconId, { needsRedownload: false });
        }

        this.updateLexiconState(lexiconId, { lastChecked: new Date() });
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        errors.push({ lexiconId, error: errorMessage });
      }
    }

    return { needsUpdate, upToDate, errors };
  }

  /**
   * Get all lexicon states
   */
  getLexiconStates(): Map<string, LexiconState> {
    return new Map(this.lexiconStates);
  }

  /**
   * Get a specific lexicon state
   */
  getLexiconState(lexiconId: string): LexiconState | undefined {
    return this.lexiconStates.get(lexiconId);
  }

  /**
   * Subscribe to orchestrator events
   */
  on(event: string, callback: EventCallback): void {
    this.eventEmitter.on(event, callback);
  }

  /**
   * Unsubscribe from orchestrator events
   */
  off(event: string, callback: EventCallback): void {
    this.eventEmitter.off(event, callback);
  }

  /**
   * Close the orchestrator and clean up
   */
  async close(): Promise<void> {
    if (this.wordnet) {
      try {
        await this.wordnet.close();
      } catch (error) {
        console.warn(`Error closing WordNet instance:`, error);
      }
      this.wordnet = null;
    }

    this.dataLoader = null;
    this.lexiconStates.clear();
    this.isInitialized = false;
  }

  /**
   * Clear all data from the underlying database/cache.
   * Keeps the database connection open but removes loaded content
   * so a subsequent load can start from a clean state.
   */
  async clearAllData(): Promise<void> {
    if (!this.isInitialized) return;
    try {
      if (this.dataLoader) {
        await this.dataLoader.clearAllData();
      }
    } finally {
      // Reset local bookkeeping so UI reflects an empty state
      this.lexiconStates.clear();
      this.eventEmitter.emit('lexiconStateChanged', {
        lexiconId: '*',
        state: undefined,
        previousState: undefined
      } as any);
    }
  }

  /**
   * Flush the database to ensure data persistence
   * This is important for OPFS databases to ensure data is written to disk
   */
  async flushDatabase(): Promise<void> {
    if (!this.isInitialized || !this.wordnet) return;
    
    try {
      const database = this.wordnet.getDatabase();
      if (database && typeof database.flush === 'function') {
        await database.flush();
        logger.info('Database flushed successfully for persistence');
      } else {
        logger.warn('Database flush method not available');
      }
    } catch (error) {
      logger.warn('Failed to flush database:', error);
      // Don't throw - flushing is best effort
    }
  }

  /**
   * Check if the database is persistent (OPFS) or in-memory
   */
  isDatabasePersistent(): boolean {
    if (!this.isInitialized || !this.wordnet) return false;
    
    try {
      const database = this.wordnet.getDatabase();
      return database ? database.isPersistent() : false;
    } catch (error) {
      logger.warn('Failed to check database persistence:', error);
      return false;
    }
  }

  /**
   * Get database storage information
   */
  getDatabaseStorageInfo(): { type: 'opfs' | 'memory' | 'unknown', persistent: boolean, path?: string } {
    if (!this.isInitialized || !this.wordnet) {
      return { type: 'unknown', persistent: false };
    }
    
    try {
      const database = this.wordnet.getDatabase();
      return database ? database.getStorageInfo() : { type: 'unknown', persistent: false };
    } catch (error) {
      logger.warn('Failed to get database storage info:', error);
      return { type: 'unknown', persistent: false };
    }
  }

  /**
   * Introspect the database to understand the current data structure
   * This helps debug cross-lingual mapping issues
   */
  async introspectDatabase(): Promise<{
    synsets: { total: number; withIli: number; byLanguage: Record<string, number> };
    ilis: { total: number; sample: string[] };
    words: { total: number; byLanguage: Record<string, number> };
    crossLingualMapping: { iliToFrench: number; iliToEnglish: number };
  }> {
    if (!this.wordnet) {
      throw new Error("Orchestrator not initialized");
    }

    const queryService = this.wordnet.getQueryService?.();
    if (!queryService) {
      throw new Error("Query service not available");
    }

    try {
      const db = (queryService as any).db;
      if (!db) {
        throw new Error("Database not accessible");
      }

      // Get synset statistics
      const synsetStats = await db.selectFrom('synsets')
        .select([
          'language',
          'ili',
          db.fn.count('id').as('count')
        ])
        .groupBy(['language', 'ili'])
        .execute();

      const synsets = {
        total: 0,
        withIli: 0,
        byLanguage: {} as Record<string, number>
      };

      synsetStats.forEach((row: any) => {
        const count = Number(row.count);
        synsets.total += count;
        if (row.ili) synsets.withIli += count;
        synsets.byLanguage[row.language] = (synsets.byLanguage[row.language] || 0) + count;
      });

      // Get ILI statistics
      const iliStats = await db.selectFrom('ilis')
        .select([
          'id',
          db.fn.count('id').as('count')
        ])
        .groupBy('id')
        .execute();

      const ilis = {
        total: iliStats.length,
        sample: iliStats.slice(0, 10).map((row: any) => row.id)
      };

      // Get word statistics
      const wordStats = await db.selectFrom('words')
        .select([
          'language',
          db.fn.count('id').as('count')
        ])
        .groupBy('language')
        .execute();

      const words = {
        total: 0,
        byLanguage: {} as Record<string, number>
      };

      wordStats.forEach((row: any) => {
        const count = Number(row.count);
        words.total += count;
        words.byLanguage[row.language] = count;
      });

      // Check cross-lingual mapping capabilities
      const crossLingualMapping = {
        iliToFrench: 0,
        iliToEnglish: 0
      };

      // Count how many ILIs map to French synsets
      const frenchIliCount = await db.selectFrom('synsets')
        .select([
          'ili',
          db.fn.count('id').as('count')
        ])
        .where('language', '=', 'fr')
        .where('ili', 'is not', null)
        .groupBy('ili')
        .execute();

      crossLingualMapping.iliToFrench = frenchIliCount.length;

      // Count how many ILIs map to English synsets
      const englishIliCount = await db.selectFrom('synsets')
        .select([
          'ili',
          db.fn.count('id').as('count')
        ])
        .where('language', '=', 'en')
        .where('ili', 'is not', null)
        .groupBy('ili')
        .execute();

      crossLingualMapping.iliToEnglish = englishIliCount.length;

      return {
        synsets,
        ilis,
        words,
        crossLingualMapping
      };

    } catch (error) {
      console.error('Database introspection failed:', error);
      throw error;
    }
  }

  /**
   * Debug a specific synset to understand its ILI mapping
   */
  async debugSynset(synsetId: string): Promise<{
    synset: any;
    words: any[];
    ili: string | null;
    crossLingualMatches: any[];
  }> {
    if (!this.wordnet) {
      throw new Error("Orchestrator not initialized");
    }

    const queryService = this.wordnet.getQueryService?.();
    if (!queryService) {
      throw new Error("Query service not available");
    }

    try {
      const db = (queryService as any).db;
      if (!db) {
        throw new Error("Database not accessible");
      }

      // Get the synset
      const synset = await db.selectFrom('synsets')
        .selectAll()
        .where('id', '=', synsetId)
        .executeTakeFirst();

      if (!synset) {
        throw new Error(`Synset ${synsetId} not found`);
      }

      // Get words in this synset
      const words = await db.selectFrom('senses')
        .innerJoin('words', 'senses.word_id', 'words.id')
        .selectAll('words')
        .where('senses.synset_id', '=', synsetId)
        .execute();

      // Get ILI if available
      const ili = synset.ili;

      // Find cross-lingual matches if ILI exists
      let crossLingualMatches: any[] = [];
      if (ili) {
        crossLingualMatches = await db.selectFrom('synsets')
          .selectAll()
          .where('ili', '=', ili)
          .where('language', '!=', synset.language)
          .execute();
      }

      return {
        synset,
        words,
        ili,
        crossLingualMatches
      };

    } catch (error) {
      console.error('Synset debugging failed:', error);
      throw error;
      }
  }

  /**
   * Find all synsets with a specific ILI across languages
   */
  async findSynsetsByIli(ili: string): Promise<{
    ili: string;
    synsets: any[];
    languages: string[];
    coverage: Record<string, number>;
  }> {
    if (!this.wordnet) {
      throw new Error("Orchestrator not initialized");
    }

    const queryService = this.wordnet.getQueryService?.();
    if (!queryService) {
      throw new Error("Query service not available");
    }

    try {
      const db = (queryService as any).db;
      if (!db) {
        throw new Error("Database not accessible");
      }

      // Find all synsets with this ILI
      const synsets = await db.selectFrom('synsets')
        .selectAll()
        .where('ili', '=', ili)
        .execute();

      // Group by language
      const languages = [...new Set(synsets.map((s: any) => s.language))] as string[];
      const coverage: Record<string, number> = {};
      
      languages.forEach(lang => {
        coverage[lang as string] = synsets.filter((s: any) => s.language === lang).length;
      });

      return {
        ili,
        synsets,
        languages,
        coverage
      };

    } catch (error) {
      console.error('ILI synset search failed:', error);
      throw error;
    }
  }

  // Helper methods

  updateLexiconState(lexiconId: string, updates: Partial<LexiconState>): void {
    const current = this.lexiconStates.get(lexiconId) || {
      id: lexiconId,
      version: lexiconId.split(':')[1] || 'unknown',
      language: 'en',
      label: lexiconId,
      status: 'unloaded',
      needsRedownload: false
    };

    const updated = { ...current, ...updates };
    this.lexiconStates.set(lexiconId, updated);

    // Emit state change event
    this.eventEmitter.emit('lexiconStateChanged', {
      lexiconId,
      state: updated,
      previousState: current
    });
  }

  private async checkIfNeedsRedownload(lexiconId: string, state: LexiconState): Promise<boolean> {
    // For now, implement basic logic - can be enhanced with actual checksum validation
    if (state.needsRedownload) return true;
    
    // Check if it's been a while since last check
    if (state.lastChecked) {
      const timeSinceCheck = Date.now() - state.lastChecked.getTime();
      if (timeSinceCheck > this.options.checkInterval!) {
        // Could implement actual update check here
        return false; // Assume up to date for now
      }
    }

    return false;
  }

  private startUpdateChecker(): void {
    setInterval(async () => {
      try {
        await this.checkForUpdates();
      } catch (error) {
        console.warn('Update check failed:', error);
      }
    }, this.options.checkInterval);
  }

  private startPeriodicFlush(): void {
    // Flush database every 30 seconds to ensure OPFS persistence
    const flushInterval = 30 * 1000; // 30 seconds
    
    setInterval(async () => {
      try {
        if (this.wordnet && this.isInitialized) {
          const database = this.wordnet.getDatabase();
          if (database && typeof database.flush === 'function') {
            await database.flush();
            logger.debug('Periodic database flush completed');
          }
        }
      } catch (error) {
        logger.warn('Periodic database flush failed:', error);
        // Don't throw - this is best effort
      }
    }, flushInterval);
    
    logger.info('Started periodic database flush for OPFS persistence');
  }

  private processLoadQueue(): void {
    if (this.loadQueue.length > 0 && this.activeLoads < this.options.maxConcurrentLoads!) {
      const nextLoad = this.loadQueue.shift();
      if (nextLoad) {
        nextLoad();
      }
    }
  }

  /**
   * Emit statistics updated event
   * This consolidates statistics emission from the orchestrator
   */
  async emitStatisticsUpdated(): Promise<void> {
    if (!this.isInitialized || !this.wordnet) return;

    try {
      const eventData = await this.wordnet.getStatisticsForEvents();
      
      this.eventEmitter.emit(WordNetEvents.STATISTICS_UPDATED, eventData.statistics, eventData.posDistribution, eventData.lexiconStats, new Date().toISOString());

      // Also emit status updated event for compatibility
      this.eventEmitter.emit('statusUpdated', {
        lexiconStats: eventData.lexiconStats,
        statistics: eventData.statistics,
        hasData: eventData.lexiconStats.length > 0
      });

    } catch (error) {
      this.eventEmitter.emit(WordNetEvents.ERROR, "getStatistics", error instanceof Error ? error.message : String(error), new Date().toISOString());
    }
  }

  /**
   * Emit data changed event
   * This consolidates data change emission from the orchestrator
   */
  emitDataChanged(operation: string, details?: any): void {
    this.eventEmitter.emit(WordNetEvents.DATA_CHANGED, operation, details, new Date().toISOString());
  }

  /**
   * Emit progress event
   * This consolidates progress emission from the orchestrator
   */
  emitProgress(progress: number, stage: string): void {
    this.eventEmitter.emit(WordNetEvents.PROGRESS, progress, stage, new Date().toISOString());
  }

  /**
   * Emit error event
   * This consolidates error emission from the orchestrator
   */
  emitError(operation: string, error: Error | string): void {
    this.eventEmitter.emit(WordNetEvents.ERROR, operation, error instanceof Error ? error.message : String(error), new Date().toISOString());
  }
}
