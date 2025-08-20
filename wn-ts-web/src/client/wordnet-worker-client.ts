/**
 * WordNet Worker Client
 * 
 * Mid-level client that handles worker communication and lexicon state tracking.
 * Provides a clean API for WordNet operations via Comlink workers.
 * 
 * This is the primary interface for React components to interact with WordNet.
 * All heavy operations (package loading, data processing, queries) go through
 * this client to ensure UI responsiveness.
 * 
 * Architecture:
 * - React Components → WordNetWorkerClient → WordNetWorker → WordNetOrchestrator → DataLoader
 * - No direct access to lower-level components from React components
 * - Handles worker lifecycle, event management, and state synchronization
 * - Provides fallback mechanisms for error handling
 * 
 * This operates at a different abstraction level than WordNetOrchestrator:
 * - Orchestrator: High-level, manages WordNet instances and cross-lexicon operations
 * - WorkerClient: Mid-level, handles worker communication and state tracking
 * - WebWordnet: Low-level, individual lexicon instance operations
 */

import { createScopedLogger } from 'utils/logger';
import { createWordNetWorker, type RemoteWordNetWorker } from './utils/worker-factory';

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

const logger = createScopedLogger('WordNetWorkerClient');

export class WordNetWorkerClient {
  private remote: RemoteWordNetWorker | null = null;
  private eventListeners = new Map<keyof WordNetEventMap, Set<WordNetEventListener<any>>>();
  private isInitialized = false;
  private initializationPromise: Promise<boolean> | null = null;
  
  // Lexicon tracking state
  private loadedLexicons = new Map<string, LexiconInfo>();
  private statistics: any = null;

  constructor() {
    logger.info('WordNetWorkerClient created');
  }

  /**
   * Initialize the worker and establish Comlink connection
   */
  async initialize(workerUrl?: string | URL): Promise<boolean> {
    if (this.isInitialized) {
      return true;
    }

    if (this.initializationPromise) {
      return this.initializationPromise;
    }

    // For now, always use URL-based worker since package worker is not yet implemented
    if (!workerUrl) {
      const resolvedUrl = this.resolveDefaultWorkerUrl();
      this.initializationPromise = this._initialize(resolvedUrl);
      return this.initializationPromise;
    } else {
      // Use provided worker URL
      this.initializationPromise = this._initialize(workerUrl);
      return this.initializationPromise;
    }
  }

  /**
   * Resolve the default worker URL
   */
  private resolveDefaultWorkerUrl(): string {
    try {
      // For development and demo environments, we need to handle the fact that
      // the worker is being served from the demo's public directory
      const currentUrl = new URL(import.meta.url);
      logger.info('Current URL for worker resolution:', currentUrl.href);
      
      // // Check if we're in a development environment
      // if (currentUrl.hostname === 'localhost' || currentUrl.hostname === '127.0.0.1') {
      //   // In development, the worker should be available at the root of the dev server
      //   // This assumes the demo has copied the worker to its public directory
      //   const workerUrl = new URL('/wordnet-worker.mjs', currentUrl.origin).href;
      //   logger.info('Development worker URL resolved to:', workerUrl);
      //   return workerUrl;
      // }
      
      // For production builds, try to use the worker from the package
      // This should work when the library is properly bundled
      const packageWorkerUrl = new URL('./wordnet-worker.mjs', import.meta.url).href;
      logger.info('Package worker URL resolved to:', packageWorkerUrl);
      return packageWorkerUrl;
    } catch (error) {
      logger.warn('Error in URL resolution, trying fallback:', error);
      
      // Fallback: try to construct a URL relative to the current script
      try {
        const scriptUrl = new URL(import.meta.url);
        const baseUrl = scriptUrl.href.substring(0, scriptUrl.href.lastIndexOf('/'));
        const fallbackUrl = `${baseUrl}/wordnet-worker.mjs`;
        logger.info('Fallback worker URL resolved to:', fallbackUrl);
        return fallbackUrl;
      } catch (fallbackError) {
        logger.warn('Fallback URL resolution also failed:', fallbackError);
        // Final fallback: use a relative path
        const finalFallback = "./wordnet-worker.mjs";
        logger.info('Using final fallback URL:', finalFallback);
        return finalFallback;
      }
    }
  }

  private async _initialize(workerUrl: string | URL): Promise<boolean> {
    try {
      logger.info('Starting worker initialization with URL:', workerUrl);
      
      // Create standard Worker and wrap with comlink
      this.remote = createWordNetWorker(workerUrl);
      logger.info('Worker created successfully, testing connection...');
      
      // Test the connection with a timeout
      const result = await Promise.race([
        this.remote.initializeWordNet(),
        new Promise<never>((_, reject) => 
          setTimeout(() => reject(new Error('Worker initialization timeout after 5 minutes')), 300000)
        )
      ]) as any;
      logger.info('Worker initialization result:', result);

      if (!result.success) {
        throw new Error(result.error || 'Worker initialization failed');
      }

      this.isInitialized = true;
      logger.info('Worker initialization completed successfully');
      this.emit('initialized', { success: true });
      
      return true;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error('Failed to initialize WordNet worker', error);
      this.emit('error', { error: errorMessage, context: 'initialization' });
      throw error;
    } finally {
      this.initializationPromise = null;
    }
  }

  /**
   * Get the current status from the worker
   */
  async getStatus(): Promise<any> {
    await this.ensureInitialized();
    
    try {
      logger.info('Getting status from worker');
      const result = await this.remote!.getStatus();

      logger.info('Status from worker', result);
      
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
      logger.error('Failed to get status', { error: errorMessage });
      this.emit('error', { error: errorMessage, context: 'getStatus' });
      throw error;
    }
  }

  /**
   * Update local lexicon tracking from worker
   */
  private async updateLexiconTracking(): Promise<void> {
    try {
      const result = await this.remote!.getStatus();
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
      logger.warn('Failed to update lexicon tracking', { error: error instanceof Error ? error.message : String(error) });
    }
  }

  /**
   * Load a package by ID
   */
  async loadPackage(packageId: string, progressCallback?: (progress: number, stage: string) => void): Promise<boolean> {
    await this.ensureInitialized();
    
    try {
      logger.info(`Loading package ${packageId}`);
      
      // Emit progress events
      if (progressCallback) {
        progressCallback(0, 'Starting download...');
      }
      
      const result = await this.remote!.loadPackage(packageId);
      
      if (result.success) {
        logger.info(`Package ${packageId} loaded successfully`);
        
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
      logger.error(`Failed to load package ${packageId}`, error);
      this.emit('packageLoaded', { packageId, success: false, error: errorMessage });
      this.emit('error', { error: errorMessage, context: 'loadPackage' });
      throw error;
    }
  }

  /**
   * Load demo data
   */
  async loadDemoData(progressCallback?: (progress: number, stage: string) => void): Promise<boolean> {
    await this.ensureInitialized();
    
    try {
      logger.info('Loading demo data');
      
      if (progressCallback) {
        progressCallback(0, 'Starting demo data load...');
      }
      
      const result = await this.remote!.loadDemoData();
      
      if (result.success) {
        logger.info('Demo data loaded successfully');
        
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
      logger.error('Failed to load demo data', error);
      this.emit('packageLoaded', { packageId: 'oewn:2024', success: false, error: errorMessage });
      this.emit('error', { error: errorMessage, context: 'loadDemoData' });
      throw error;
    }
  }

  /**
   * Query words
   */
  async queryWords(term: string, pos?: string): Promise<any[]> {
    await this.ensureInitialized();
    
    try {
      logger.info(`Querying words for term: ${term}`);
      const result = await this.remote!.queryWords(term, pos);
      
      if (result.success) {
        return result.data || [];
      } else {
        throw new Error(result.error || 'Word query failed');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error(`Failed to query words for term: ${term}`, { error: errorMessage });
      this.emit('error', { error: errorMessage, context: 'queryWords' });
      throw error;
    }
  }

  /**
   * Query synsets
   */
  async querySynsets(term: string, pos?: string): Promise<any[]> {
    await this.ensureInitialized();
    
    try {
      logger.info(`Querying synsets for term: ${term}`);
      const result = await this.remote!.querySynsets(term, pos);
      
      if (result.success) {
        return result.data || [];
      } else {
        throw new Error(result.error || 'Synset query failed');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error(`Failed to query synsets for term: ${term}`, { error: errorMessage });
      this.emit('error', { error: errorMessage, context: 'querySynsets' });
      throw error;
    }
  }

  /**
   * Query senses
   */
  async querySenses(term: string, pos?: string): Promise<any[]> {
    await this.ensureInitialized();
    
    try {
      logger.info(`Querying senses for term: ${term}`);
      // Double-check remote is available after ensureInitialized
      if (!this.remote) {
        throw new Error('Worker remote not available after initialization check');
      }
      
      const result = await this.remote!.querySenses(term, pos);
      
      if (result.success) {
        return result.data || [];
      } else {
        throw new Error(result.error || 'Sense query failed');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error(`Failed to query senses for term: ${term}`, { error: errorMessage });
      this.emit('error', { error: errorMessage, context: 'querySenses' });
      throw error;
    }
  }

  /**
   * Clear all data
   */
  async clearData(): Promise<boolean> {
    await this.ensureInitialized();
    
    try {
      logger.info('Clearing all data');
      const result = await this.remote!.clearData();
      
      if (result.success) {
        logger.info('All data cleared successfully');
        
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
      logger.error('Failed to clear data', error);
      this.emit('dataCleared', { success: false, error: errorMessage });
      this.emit('error', { error: errorMessage, context: 'clearData' });
      throw error;
    }
  }

  /**
   * Test memory queries for debugging
   */
  async testMemoryQueries(): Promise<any> {
    await this.ensureInitialized();
    
    try {
      logger.info('Testing memory queries');
      const result = await this.remote!.testMemoryQueries();
      
      if (result.success) {
        logger.info('Memory test completed successfully', { data: result.data });
        return result.data;
      } else {
        throw new Error(result.error || 'Memory test failed');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error('Failed to run memory test', { error: errorMessage });
      this.emit('error', { error: errorMessage, context: 'testMemoryQueries' });
      throw error;
    }
  }

  /**
   * Clear cache
   */
  async clearCache(): Promise<boolean> {
    await this.ensureInitialized();
    
    try {
      logger.info('Clearing cache');
      const result = await this.remote!.clearCache();
      
      if (result.success) {
        logger.info('Cache cleared successfully');
        this.emit('dataCleared', { success: true }); // Assuming clearCache is part of data clearing
        return true;
      } else {
        throw new Error(result.error || 'Cache clearing failed');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error('Failed to clear cache', error);
      this.emit('dataCleared', { success: false, error: errorMessage });
      this.emit('error', { error: errorMessage, context: 'clearCache' });
      throw error;
    }
  }

  /**
   * Get cache info
   */
  async getCacheInfo(): Promise<any> {
    await this.ensureInitialized();
    
    try {
      logger.info('Getting cache info');
      const result = await this.remote!.getCacheInfo();
      
      if (result.success) {
        logger.info('Cache info retrieved successfully', { data: result.data });
        return result.data;
      } else {
        throw new Error(result.error || 'Cache info retrieval failed');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error('Failed to get cache info', error);
      this.emit('error', { error: errorMessage, context: 'getCacheInfo' });
      throw error;
    }
  }

  /**
   * Get senses by word ID or form
   */
  async getSensesByWordIdOrForm(wordIdOrForm: string): Promise<any[]> {
    await this.ensureInitialized();
    
    try {
      logger.info(`Getting senses for word ID or form: ${wordIdOrForm}`);
      // For now, use the existing querySenses method as a fallback
      const result = await this.querySenses(wordIdOrForm);
      return result || [];
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error(`Failed to get senses for word ID or form: ${wordIdOrForm}`, { error: errorMessage });
      this.emit('error', { error: errorMessage, context: 'getSensesByWordIdOrForm' });
      throw error;
    }
  }

  /**
   * Get words by synset ID and language
   */
  async getWordsBySynsetAndLanguage(synsetId: string, language: string): Promise<any[]> {
    await this.ensureInitialized();
    
    try {
      logger.info(`Getting words for synset ID: ${synsetId}, language: ${language}`);
      // For now, return empty array as this method needs to be implemented in the worker
      return [];
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error(`Failed to get words for synset ID: ${synsetId}, language: ${language}`, { error: errorMessage });
      this.emit('error', { error: errorMessage, context: 'getWordsBySynsetAndLanguage' });
      throw error;
    }
  }

  /**
   * Get definitions by synset ID
   */
  async getDefinitionsBySynsetId(synsetId: string): Promise<any[]> {
    await this.ensureInitialized();
    
    try {
      logger.info(`Getting definitions for synset ID: ${synsetId}`);
      // For now, return empty array as this method needs to be implemented in the worker
      return [];
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error(`Failed to get definitions for synset ID: ${synsetId}`, { error: errorMessage });
      this.emit('error', { error: errorMessage, context: 'getDefinitionsBySynsetId' });
      throw error;
    }
  }

  /**
   * Get synset by ID
   */
  async getSynsetById(synsetId: string): Promise<any | undefined> {
    await this.ensureInitialized();
    
    try {
      console.log(`Getting synset by ID: ${synsetId}`);
      // For now, return undefined as this method needs to be implemented in the worker
      return undefined;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error(`Failed to get synset by ID: ${synsetId}`, { error: errorMessage });
      this.emit('error', { error: errorMessage, context: 'getSynsetById' });
      throw error;
    }
  }

  /**
   * Get words by ILI and language
   */
  async getWordsByIliAndLanguage(ili: string, language: string): Promise<any[]> {
    await this.ensureInitialized();
    
    try {
      console.log(`Getting words for ILI: ${ili}, language: ${language}`);
      // For now, return empty array as this method needs to be implemented in the worker
      return [];
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error(`Failed to get words for ILI: ${ili}, language: ${language}`, { error: errorMessage });
      this.emit('error', { error: errorMessage, context: 'getWordsByIliAndLanguage' });
      throw error;
    }
  }

  /**
   * Get words by ILI and lexicon prefix
   */
  async getWordsByIliAndLexiconPrefix(ili: string, lexiconPrefix: string): Promise<any[]> {
    await this.ensureInitialized();
    
    try {
      console.log(`Getting words for ILI: ${ili}, lexicon prefix: ${lexiconPrefix}`);
      // For now, return empty array as this method needs to be implemented in the worker
      return [];
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error(`Failed to get words for ILI: ${ili}, lexicon prefix: ${lexiconPrefix}`, { error: errorMessage });
      this.emit('error', { error: errorMessage, context: 'getWordsByIliAndLexiconPrefix' });
      throw error;
    }
  }

  /**
   * Search words in lexicon
   */
  async searchWordsInLexicon(term: string, lexicon: string, language?: string): Promise<any[]> {
    await this.ensureInitialized();
    
    try {
      console.log(`Searching words in lexicon: ${lexicon}, term: ${term}, language: ${language}`);
      const result = await this.remote!.searchWordsInLexicon(term, lexicon, language);
      
      if (result.success) {
        return result.data || [];
      } else {
        throw new Error(result.error || 'Search words in lexicon failed');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error(`Failed to search words in lexicon: ${lexicon}, term: ${term}`, { error: errorMessage });
      this.emit('error', { error: errorMessage, context: 'searchWordsInLexicon' });
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
      console.warn('Failed to check loaded data status', { error: error instanceof Error ? error.message : String(error) });
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
          console.error(`Error in event listener for ${event}`, { error: error instanceof Error ? error.message : String(error) });
        }
      });
    }
  }

  /**
   * Ensure the client is initialized
   */
  private async ensureInitialized(): Promise<void> {
    if (!this.isInitialized) {
      throw new Error('Worker client not initialized. Call initialize() first.');
    }
    if (!this.remote) {
      throw new Error('Worker remote not available. Worker may have been disposed or failed to initialize properly.');
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
    // Try exact match first
    let lexicon = this.loadedLexicons.get(id);
    
    if (!lexicon) {
      // If exact match fails, try to find by base lexicon ID (e.g., "oewn" from "oewn:2024")
      const baseLexiconId = id.split(':')[0];
      lexicon = this.loadedLexicons.get(baseLexiconId);
    }
    
    return lexicon;
  }

  /**
   * Check if a specific lexicon is loaded
   */
  hasLexicon(id: string): boolean {
    // Try exact match first
    if (this.loadedLexicons.has(id)) {
      return true;
    }
    
    // If exact match fails, try to find by base lexicon ID (e.g., "oewn" from "oewn:2024")
    const baseLexiconId = id.split(':')[0];
    return this.loadedLexicons.has(baseLexiconId);
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
    console.log('Disposing WordNetWorkerClient');
    
    if (this.remote) {
      //  to be implemented
      // this.remote.terminate();
    }
    
    this.remote = null;
    this.isInitialized = false;
    this.eventListeners.clear();
    this.initializationPromise = null;
    
    // Clear lexicon tracking
    this.loadedLexicons.clear();
    this.statistics = null;
  }

  /**
   * Get part of speech distribution
   */
  async getPartOfSpeechDistribution(): Promise<any> {
    await this.ensureInitialized();
    
    try {
      logger.info('Getting part of speech distribution from worker');
      const result = await this.remote!.getPartOfSpeechDistribution();
      
      if (result.success) {
        return result.data;
      } else {
        throw new Error(result.error || 'Failed to get part of speech distribution');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error(`Failed to get part of speech distribution`, { error: errorMessage });
      this.emit('error', { error: errorMessage, context: 'getPartOfSpeechDistribution' });
      throw error;
    }
  }
}
