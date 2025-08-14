/**
 * WordNet Orchestrator
 * 
 * High-level orchestrator that manages a single WordNet instance with multiple lexicons.
 * Focuses on lexicon lifecycle management, cross-lexicon operations, and query optimization.
 * 
 * This operates at a higher abstraction level than WordNetWorkerClient, which handles
 * worker communication and state tracking.
 */

import type { Lexicon, PartOfSpeech, Word, Sense, Synset, ILI } from "wn-ts-core";
import { WebWordnet } from "./web-wordnet.js";
import { DataLoader } from "./data-loader.js";
import { WordNetEventEmitter, WordNetEvents } from "./event-emitter.js";
import type { EventCallback } from "./event-emitter.js";
import type { Sqlite3Static } from "@sqlite.org/sqlite-wasm";
import type { ProgressCallback } from "./types/progress.js";

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
  defaultLexicon?: string;
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

export class WordNetOrchestrator {
  private wordnet: WebWordnet | null = null;
  private dataLoader: DataLoader | null = null;
  private lexiconStates = new Map<string, LexiconState>();
  private eventEmitter = new WordNetEventEmitter();
  private options: OrchestratorOptions;
  private sqlModule?: Sqlite3Static;
  private isInitialized = false;
  private loadQueue: Array<() => Promise<void>> = [];
  private activeLoads = 0;

  constructor(options: OrchestratorOptions = {}) {
    this.options = {
      defaultLexicon: 'oewn:2024',
      autoCheckUpdates: true,
      checkInterval: 24 * 60 * 60 * 1000, // 24 hours
      maxConcurrentLoads: 2,
      enableCaching: true,
      lexiconId: 'oewn:2024', // Default base lexicon
      ...options
    };

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
      return; // Already initialized
    }

    // Create the single WordNet instance and data loader
    this.wordnet = new WebWordnet(this.options.lexiconId!);
    this.dataLoader = new DataLoader(this.wordnet.getDatabase(), this.wordnet);
    
    // Initialize the instance
    await this.wordnet.initialize(sqlModule);
    
    // Set initialized flag BEFORE trying to load default lexicon
    this.isInitialized = true;
    
    // Initialize default lexicon if specified
    if (this.options.defaultLexicon) {
      // Convert the two-parameter progress callback to the expected one-parameter callback
      const progressCallback = options?.onProgress ? 
        (progress: number) => options.onProgress!(progress, 'Loading default lexicon') : 
        undefined;
        
      await this.ensureLexiconLoaded(this.options.defaultLexicon, {
        onProgress: progressCallback
      });
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

      // Check if data needs to be loaded
      const hasData = await this.wordnet!.hasLoadedLexicons();
      
      if (!hasData || options.forceRedownload) {
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

      // Process next item in queue
      this.processLoadQueue();

    } catch (error) {
      // Update state to error
      this.updateLexiconState(lexiconId, {
        status: 'error',
        error: error instanceof Error ? error.message : String(error)
      });

      this.activeLoads--;
      this.processLoadQueue();
      throw error;
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
    return this.wordnet.words(term, pos);
  }

  async querySynsets(term: string, pos?: PartOfSpeech, options: QueryOptions = {}): Promise<Synset[]> {
    if (!this.wordnet) {
      throw new Error("Orchestrator not initialized");
    }

    return this.wordnet.synsets(term, pos);
  }

  async querySenses(term: string, pos?: PartOfSpeech, options: QueryOptions = {}): Promise<Sense[]> {
    if (!this.wordnet) {
      throw new Error("Orchestrator not initialized");
    }

    return this.wordnet.senses(term, pos);
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
