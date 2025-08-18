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
  }

  /**
   * Initialize the orchestrator with SQLite module
   */
  async initialize(sqlModule: Sqlite3Static, options?: { onProgress?: (progress: number, stage: string) => void }): Promise<void> {
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
    
    // Auto-load default lexicons if enabled
    if (this.options.defaultLexicons && this.options.defaultLexicons.length > 0) {
      await this.loadDefaultLexicons(options?.onProgress);
    }

    this.eventEmitter.emit(WordNetEvents.INITIALIZED, { success: true });
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
  private async loadDefaultLexicons(onProgress?: (progress: number, stage: string) => void): Promise<void> {
    if (!this.options.defaultLexicons || this.options.defaultLexicons.length === 0) {
      return;
    }

    logger.info(`Loading ${this.options.defaultLexicons.length} default lexicons: ${this.options.defaultLexicons.join(', ')}`);
    
    for (let i = 0; i < this.options.defaultLexicons.length; i++) {
      const lexiconId = this.options.defaultLexicons[i];
      const progress = onProgress ? (p: number) => onProgress(p, `Loading ${lexiconId}`) : undefined;
      
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

      // Check if this specific lexicon is already loaded
      const hasSpecificData = await this.wordnet!.hasSpecificLexiconLoaded(lexiconId);
      
      if (!hasSpecificData || options.forceRedownload) {
        // Load data using the single data loader
        await this.dataLoader!.downloadAndLoad(lexiconId, {
          progress: options.onProgress
        });
      }

      // Update state to loaded
      this.updateLexiconState(lexiconId, {
        status: 'loaded',
        lastLoaded: new Date(),
        needsRedownload: false
      });

      // Update the WebWordnet instance's lexicon ID to match the actual loaded package
      // This ensures that queries use the correct lexicon ID that matches the database
      if (this.wordnet) {
        // The actual lexicon ID in the database is "oewn", not the package ID "oewn:2019"
        // We need to extract the base lexicon ID from the package ID
        const actualLexiconId = lexiconId.split(':')[0]; // "oewn:2019" -> "oewn"
        (this.wordnet as any).updateLexiconId(actualLexiconId);
      }
    } catch (error) {
      // Update state to error
      this.updateLexiconState(lexiconId, {
        status: 'error',
        error: error instanceof Error ? error.message : String(error)
      });
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

    const query: SenseQuery = { form: term };
    if (pos) query.pos = pos;
    if (options.lexicons && options.lexicons.length > 0) query.lexicon = options.lexicons[0];
    return this.wordnet.senses(query);
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

  // Private helper methods

  private updateLexiconState(lexiconId: string, updates: Partial<LexiconState>): void {
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

  private processLoadQueue(): void {
    if (this.loadQueue.length > 0 && this.activeLoads < this.options.maxConcurrentLoads!) {
      const nextLoad = this.loadQueue.shift();
      if (nextLoad) {
        nextLoad();
      }
    }
  }
}
