// Lightweight client wrapper around the wordnet worker RPC
// Provides a clean API for WordNet operations via Comlink
import { createScopedLogger } from '../logger'
import type { Remote } from 'comlink'

export interface WordNetWorkerAPI {
  initializeWordNet(): Promise<{ success: boolean; error?: string; data?: any }>;
  loadPackage(packageId: string): Promise<{ success: boolean; data?: any; error?: string }>;
  loadPackageFromData(packageId: string, data: ArrayBuffer): Promise<{ success: boolean; data?: any; error?: string }>;
  loadDemoData(): Promise<{ success: boolean; data?: any; error?: string }>;
  getStatistics(): Promise<{ success: boolean; data?: any; error?: string }>;
  queryWords(term: string): Promise<{ success: boolean; data?: any; error?: string }>;
  querySynsets(term: string): Promise<{ success: boolean; data?: any; error?: string }>;
  clearData(): Promise<{ success: boolean; error?: string }>;
  getStatus(): Promise<{ success: boolean; data?: any; error?: string }>;
  hasLoadedData(packageId?: string): Promise<{ success: boolean; data?: any; error?: string }>;
  testMemoryQueries(): Promise<{ success: boolean; data?: any; error?: string }>;
}

export interface LexiconInfo {
  id: string;
  label: string;
  language: string;
  version: string;
  wordCount: number;
  synsetCount: number;
  loadedAt: Date;
}

export interface WordNetEventMap {
  'initialized': { success: boolean; error?: string };
  'packageLoaded': { packageId: string; success: boolean; error?: string; lexiconInfo?: LexiconInfo };
  'packageLoadProgress': { packageId: string; progress: number; stage: string };
  'dataCleared': { success: boolean; error?: string };
  'error': { error: string; context: string };
  'statusUpdated': { status: any };
  'lexiconsChanged': { lexicons: LexiconInfo[]; added?: LexiconInfo[]; removed?: string[] };
}

export type WordNetEventListener<K extends keyof WordNetEventMap> = (event: WordNetEventMap[K]) => void;

export class WordNetWorkerClient {
  private worker: Worker | null = null;
  private remote: Remote<WordNetWorkerAPI> | null = null;
  private eventListeners = new Map<keyof WordNetEventMap, Set<WordNetEventListener<any>>>();
  private logger = createScopedLogger('wordnet-client');
  private isInitialized = false;
  private initializationPromise: Promise<boolean> | null = null;
  
  // Lexicon tracking state
  private loadedLexicons = new Map<string, LexiconInfo>();
  private statistics: any = null;

  constructor() {
    this.logger.info('WordNetWorkerClient created');
  }

  /**
   * Initialize the worker and establish Comlink connection
   */
  async initialize(): Promise<boolean> {
    if (this.isInitialized) {
      return true;
    }

    if (this.initializationPromise) {
      return this.initializationPromise;
    }

    this.initializationPromise = this._initialize();
    return this.initializationPromise;
  }

  private async _initialize(): Promise<boolean> {
    try {
      this.logger.start('initializing WordNet worker');
      
      // Create worker
      this.remote = new ComlinkWorker(new URL('../workers/wordnetWorker.ts', import.meta.url), { type: 'module' });
      
      // Test the connection
      const result = await this.remote.initializeWordNet();
      if (!result.success) {
        throw new Error(result.error || 'Worker initialization failed');
      }

      this.isInitialized = true;
      this.logger.success('WordNet worker initialized successfully');
      this.emit('initialized', { success: true });
      
      return true;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.fail('Failed to initialize WordNet worker', error);
      this.emit('error', { error: errorMessage, context: 'initialization' });
      throw error;
    } finally {
      this.logger.end('initializing WordNet worker');
      this.initializationPromise = null;
    }
  }

  /**
   * Get the current status from the worker
   */
  async getStatus(): Promise<any> {

    if (!this.remote) {
      throw new Error('Worker not initialized');
    }

    await this.ensureInitialized();
    
    try {
      this.logger.debug('Getting status from worker');
      const result = await this.remote.getStatus();

      this.logger.debug('Status from worker', result);
      
      if (result.success) {
        // Update our local lexicon tracking
        await this.updateLexiconTracking();
        
        this.emit('statusUpdated', result.data);
        return result.data;
      } else {
        throw new Error(result.error || 'Failed to get status');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.error('Failed to get status', { error: errorMessage });
      this.emit('error', { error: errorMessage, context: 'getStatus' });
      throw error;
    }
  }

  /**
   * Update local lexicon tracking from worker
   */
  private async updateLexiconTracking(): Promise<void> {
    if (!this.remote) {
      throw new Error('Worker not initialized');
    }

    try {
      const result = await this.remote.getStatus();
      if (result.success && result.data?.lexiconStats) {
        const newLexicons = new Map<string, LexiconInfo>();
        
        for (const stat of result.data.lexiconStats) {
          const lexiconInfo: LexiconInfo = {
            id: stat.lexiconId,
            label: stat.label || stat.lexiconId,
            language: stat.language || 'en',
            version: stat.version || 'unknown',
            wordCount: stat.wordCount || 0,
            synsetCount: stat.synsetCount || 0,
            loadedAt: new Date()
          };
          newLexicons.set(stat.lexiconId, lexiconInfo);
        }
        
        // Check for changes
        const added: LexiconInfo[] = [];
        const removed: string[] = [];
        
        // Find added lexicons
        for (const [id, info] of newLexicons) {
          if (!this.loadedLexicons.has(id)) {
            added.push(info);
          }
        }
        
        // Find removed lexicons
        for (const [id] of this.loadedLexicons) {
          if (!newLexicons.has(id)) {
            removed.push(id);
          }
        }
        
        // Update local state
        this.loadedLexicons = newLexicons;
        this.statistics = result.data.statistics;
        
        // Emit change event if there were changes
        if (added.length > 0 || removed.length > 0) {
          this.emit('lexiconsChanged', {
            lexicons: Array.from(this.loadedLexicons.values()),
            added: added.length > 0 ? added : undefined,
            removed: removed.length > 0 ? removed : undefined
          });
        }
      }
    } catch (error) {
      this.logger.warn('Failed to update lexicon tracking', { error: error instanceof Error ? error.message : String(error) });
    }
  }

  /**
   * Load a package by ID
   */
  async loadPackage(packageId: string, progressCallback?: (progress: number, stage: string) => void): Promise<boolean> {
    await this.ensureInitialized();
    
    try {
      this.logger.start(`loading package ${packageId}`);
      
      // Emit progress events
      if (progressCallback) {
        progressCallback(0, 'Starting download...');
      }
      
      const result = await this.remote!.loadPackage(packageId);
      
      if (result.success) {
        this.logger.success(`Package ${packageId} loaded successfully`);
        
        // Update lexicon tracking after successful load
        await this.updateLexiconTracking();
        
        // Get the lexicon info for this package
        const lexiconInfo = this.getLexicon(packageId);
        
        this.emit('packageLoaded', { packageId, success: true, lexiconInfo });
        
        if (progressCallback) {
          progressCallback(1, 'Complete');
        }
        
        return true;
      } else {
        throw new Error(result.error || 'Package loading failed');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.fail(`Failed to load package ${packageId}`, error);
      this.emit('packageLoaded', { packageId, success: false, error: errorMessage });
      this.emit('error', { error: errorMessage, context: 'loadPackage' });
      throw error;
    } finally {
      this.logger.end(`loading package ${packageId}`);
    }
  }

  /**
   * Load demo data
   */
  async loadDemoData(progressCallback?: (progress: number, stage: string) => void): Promise<boolean> {
    await this.ensureInitialized();
    
    try {
      this.logger.start('loading demo data');
      
      if (progressCallback) {
        progressCallback(0, 'Starting demo data load...');
      }
      
      const result = await this.remote!.loadDemoData();
      
      if (result.success) {
        this.logger.success('Demo data loaded successfully');
        
        // Update lexicon tracking after successful load
        await this.updateLexiconTracking();
        
        // Get the lexicon info for demo data
        const lexiconInfo = this.getLexicon('oewn:2024');
        
        this.emit('packageLoaded', { packageId: 'oewn:2024', success: true, lexiconInfo });
        
        if (progressCallback) {
          progressCallback(1, 'Complete');
        }
        
        return true;
      } else {
        throw new Error(result.error || 'Demo data loading failed');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.fail('Failed to load demo data', error);
      this.emit('packageLoaded', { packageId: 'oewn:2024', success: false, error: errorMessage });
      this.emit('error', { error: errorMessage, context: 'loadDemoData' });
      throw error;
    } finally {
      this.logger.end('loading demo data');
    }
  }

  /**
   * Query words
   */
  async queryWords(term: string): Promise<any[]> {
    await this.ensureInitialized();
    
    try {
      this.logger.debug(`Querying words for term: ${term}`);
      const result = await this.remote!.queryWords(term);
      
      if (result.success) {
        return result.data || [];
      } else {
        throw new Error(result.error || 'Word query failed');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.error(`Failed to query words for term: ${term}`, { error: errorMessage });
      this.emit('error', { error: errorMessage, context: 'queryWords' });
      throw error;
    }
  }

  /**
   * Query synsets
   */
  async querySynsets(term: string): Promise<any[]> {
    await this.ensureInitialized();
    
    try {
      this.logger.debug(`Querying synsets for term: ${term}`);
      const result = await this.remote!.querySynsets(term);
      
      if (result.success) {
        return result.data || [];
      } else {
        throw new Error(result.error || 'Synset query failed');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.error(`Failed to query synsets for term: ${term}`, { error: errorMessage });
      this.emit('error', { error: errorMessage, context: 'querySynsets' });
      throw error;
    }
  }

  /**
   * Clear all data
   */
  async clearData(): Promise<boolean> {
    await this.ensureInitialized();
    
    try {
      this.logger.start('clearing all data');
      const result = await this.remote!.clearData();
      
      if (result.success) {
        this.logger.success('All data cleared successfully');
        
        // Clear local lexicon tracking
        const removedLexicons = Array.from(this.loadedLexicons.keys());
        this.loadedLexicons.clear();
        this.statistics = null;
        
        // Emit lexicon change event
        this.emit('lexiconsChanged', {
          lexicons: [],
          removed: removedLexicons
        });
        
        this.emit('dataCleared', { success: true });
        return true;
      } else {
        throw new Error(result.error || 'Data clearing failed');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.fail('Failed to clear data', error);
      this.emit('dataCleared', { success: false, error: errorMessage });
      this.emit('error', { error: errorMessage, context: 'clearData' });
      throw error;
    } finally {
      this.logger.end('clearing all data');
    }
  }

  /**
   * Test memory queries for debugging
   */
  async testMemoryQueries(): Promise<any> {
    await this.ensureInitialized();
    
    try {
      this.logger.debug('Testing memory queries');
      const result = await this.remote!.testMemoryQueries();
      
      if (result.success) {
        this.logger.debug('Memory test completed successfully', { data: result.data });
        return result.data;
      } else {
        throw new Error(result.error || 'Memory test failed');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.error('Failed to run memory test', { error: errorMessage });
      this.emit('error', { error: errorMessage, context: 'testMemoryQueries' });
      throw error;
    }
  }

  /**
   * Check if data is loaded
   */
  async hasLoadedData(packageId?: string): Promise<boolean> {
    await this.ensureInitialized();
    
    try {
      const result = await this.remote!.hasLoadedData(packageId);
      
      if (result.success) {
        if (packageId) {
          return result.data.hasPackage;
        } else {
          return result.data.hasData;
        }
      } else {
        return false;
      }
    } catch (error) {
      this.logger.warn('Failed to check loaded data status', { error: error instanceof Error ? error.message : String(error) });
      return false;
    }
  }

  /**
   * Add event listener
   */
  addEventListener<K extends keyof WordNetEventMap>(event: K, listener: WordNetEventListener<K>): void {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, new Set());
    }
    this.eventListeners.get(event)!.add(listener);
  }

  /**
   * Remove event listener
   */
  removeEventListener<K extends keyof WordNetEventMap>(event: K, listener: WordNetEventListener<K>): void {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      listeners.delete(listener);
    }
  }

  /**
   * Emit event to all listeners
   */
  private emit<K extends keyof WordNetEventMap>(event: K, data: WordNetEventMap[K]): void {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      listeners.forEach(listener => {
        try {
          listener(data);
        } catch (error) {
          this.logger.error(`Error in event listener for ${event}`, { error: error instanceof Error ? error.message : String(error) });
        }
      });
    }
  }

  /**
   * Ensure the client is initialized
   */
  private async ensureInitialized(): Promise<void> {
    if (!this.isInitialized) {
      await this.initialize();
    }
  }

  /**
   * Check if the client is initialized
   */
  get initialized(): boolean {
    return this.isInitialized;
  }

  /**
   * Get all loaded lexicons
   */
  get lexicons(): LexiconInfo[] {
    return Array.from(this.loadedLexicons.values());
  }

  /**
   * Get a specific lexicon by ID
   */
  getLexicon(id: string): LexiconInfo | undefined {
    return this.loadedLexicons.get(id);
  }

  /**
   * Check if a specific lexicon is loaded
   */
  hasLexicon(id: string): boolean {
    return this.loadedLexicons.has(id);
  }

  /**
   * Get current statistics
   */
  get currentStatistics(): any {
    return this.statistics;
  }

  /**
   * Get lexicon count
   */
  get lexiconCount(): number {
    return this.loadedLexicons.size;
  }

  /**
   * Dispose of the client and terminate the worker
   */
  dispose(): void {
    this.logger.info('Disposing WordNetWorkerClient');
    
    if (this.worker) {
      this.worker.terminate();
      this.worker = null;
    }
    
    this.remote = null;
    this.isInitialized = false;
    this.eventListeners.clear();
    this.initializationPromise = null;
    
    // Clear lexicon tracking
    this.loadedLexicons.clear();
    this.statistics = null;
  }
}
