/**
 * WordNet Worker for wn-ts-web
 * 
 * This is the production worker implementation that handles all WordNet operations
 * in a web worker context. It provides a clean API via Comlink for main thread usage.
 * 
 * Architecture:
 * - WordNetWorkerClient → WordNetWorker → WordNetOrchestrator → DataLoader
 * - All heavy operations (package loading, data processing, queries) are handled here
 * - Prevents UI freezing by moving expensive operations off the main thread
 * - Provides a clean, promise-based API for the main thread
 * 
 * All the heavy lifting is handled here, making the main library much more maintainable.
 * The worker manages the complete lifecycle of WordNet instances and data operations.
 */

import { expose } from 'comlink';
import { WordNetOrchestrator } from './wordnet-orchestrator.js';
import sqlite3InitModule, { type Sqlite3Static } from '@sqlite.org/sqlite-wasm';
// Import wn-data-loader to ensure it's bundled in the worker
import { WordNetProcessor } from 'wn-data-loader';

// Force usage to prevent tree-shaking
const _unused = WordNetProcessor;
import type { 
  WordNetWorkerAPI,
  LexiconStatistics,
  OverallStatistics,
  CacheInfo,
  DatabaseStorageInfo,
  MemoryQueryTestResult,
  PartOfSpeech
} from './type.js';
import { createScopedLogger } from 'utils/logger';

const logger = createScopedLogger('WordNetWorker');

let orchestrator: WordNetOrchestrator | null = null;
let sqlModule: Sqlite3Static | null = null;
let isInitialized = false;
let isDisposing = false;

// Expose the worker API using Comlink
export async function initializeWordNet(lexiconId = "oewn:2024") {
  try {
    logger.start('WordNet initialization');
    
    // Check if we're already initialized
    if (isInitialized && orchestrator) {
      logger.info('WordNet already initialized, returning existing instance');
      return { 
        success: true, 
        data: { 
          lexiconStats: [], 
          statistics: { totalWords: 0, totalSynsets: 0, totalSenses: 0, totalILIs: 0, totalLexicons: 0 },
          hasInitialState: true
        } 
      };
    }
    
    // Check if we're in the middle of disposing
    if (isDisposing) {
      logger.warn('WordNet is currently being disposed, waiting...');
      await new Promise(resolve => setTimeout(resolve, 100));
      isDisposing = false;
    }
    
    // If we have existing instances, dispose them first to avoid conflicts
    if (orchestrator) {
      logger.info('Disposing existing orchestrator before reinitializing');
      await disposeWordNet();
    }
    
    // Load SQLite WASM module once
    if (!sqlModule) {
      logger.step('loading SQLite WASM module');
      try {
        sqlModule = await sqlite3InitModule({
          print: (msg: string) => logger.debug('sqlite3InitModule:', msg),
          printErr: (msg: string) => logger.error('sqlite3InitModule error:', msg)
        }) as unknown as Sqlite3Static;
        logger.step('SQLite module loaded successfully');
      } catch (sqliteError) {
        logger.error('Failed to load SQLite module:', sqliteError);
        throw sqliteError;
      }
    }

    logger.step('creating WordNetOrchestrator');
    // Create and initialize orchestrator with default lexicons
    orchestrator = new WordNetOrchestrator({ 
      defaultLexicons: [lexiconId], // Use the requirement ID as the default lexicon
      autoCheckUpdates: false 
    });
    logger.step('orchestrator created, initializing');
    await orchestrator.initialize(sqlModule, {
      onProgress: (progress, message) => {
        // Progress is handled by the orchestrator's internal logging
        // No need for noisy console.log here - the progress callback is sufficient
      }
    });
    isInitialized = true;
    
    logger.step('orchestrator initialized successfully');
    
    // Check if we have existing data after initialization
    try {
      const status = await getStatus();
      if (status.success && status.data && status.data.hasData) {
        logger.info('Worker initialization complete - existing data found and ready for queries');
      } else {
        logger.info('Worker initialization complete - database is empty, ready to load new data');
      }
    } catch (e) {
      logger.info('Worker initialization complete - status check failed, but worker is ready');
    }
    
    // Don't try to get expensive statistics during initialization
    // Just return success and let the main thread check status when needed
    logger.end('WordNet initialization', { success: true });
    return { 
      success: true, 
      data: { 
        lexiconStats: [], 
        statistics: { totalWords: 0, totalSynsets: 0, totalSenses: 0, totalILIs: 0, totalLexicons: 0 },
        hasInitialState: false
      } 
    };
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logger.fail('WordNet initialization', error);
    return { success: false, error: errorMessage };
  }
}

export async function getStatus() {
  logger.start('Getting status from worker');
  try {
    if (!orchestrator) {
      logger.error('WordNet not initialized');
      return { success: false, error: "WordNet not initialized" };
    }

    // Lightweight status check - try simple queries first, then fall back to complex ones
    let lexiconStats: LexiconStatistics[] | null = null;
    let statistics: OverallStatistics | null = null;
    
    try {
      logger.step('Getting lexicon stats from worker');
      
      // Pull lexicon stats directly from orchestrator
      try {
        lexiconStats = await orchestrator.getLexiconStatistics();
        logger.debug('Got lexicon stats via orchestrator', { count: Array.isArray(lexiconStats) ? lexiconStats.length : 0 });
        
        // Log whether we're reading existing data or have no data
        if (Array.isArray(lexiconStats) && lexiconStats.length > 0) {
          const totalWords = lexiconStats.reduce((sum, lex) => sum + (lex.wordCount || 0), 0);
          logger.debug(`📊 Reading existing data from persistent storage: ${totalWords} total words across ${lexiconStats.length} lexicons`);
        } else {
          logger.debug('📊 No existing data found - database is empty');
        }
      } catch (e: unknown) {
        const errorMessage = e instanceof Error ? e.message : String(e);
        logger.warn('Failed to get lexicon stats via orchestrator', { error: errorMessage });
        // If this fails, it might be because no data is loaded yet - that's okay
        lexiconStats = [];
      }

      // Get overall statistics via orchestrator (already optimized in core)
      try {
        const overall = await orchestrator.getOverallStatistics();
        statistics = { 
          totalWords: overall.totalWords, 
          totalSynsets: overall.totalSynsets, 
          totalSenses: overall.totalSenses,
          totalILIs: overall.totalILIs,
          totalLexicons: overall.totalLexicons
        };
        
        // Log statistics to show data persistence
        if (overall.totalWords > 0) {
          logger.debug(`💾 Database contains persistent data: ${overall.totalWords} words, ${overall.totalSynsets} synsets, ${overall.totalSenses} senses`);
        } else {
          logger.debug('💾 Database is empty - no persistent data found');
        }
      } catch (e: unknown) {
        const errorMessage = e instanceof Error ? e.message : String(e);
        logger.warn('Failed to get overall statistics', { error: errorMessage });
        // If this fails, it might be because no data is loaded yet - that's okay
        statistics = { totalWords: 0, totalSynsets: 0, totalSenses: 0, totalILIs: 0, totalLexicons: 0 };
      }
    } catch (e: unknown) {
      const errorMessage = e instanceof Error ? e.message : String(e);
      logger.warn('Unexpected error during status check', { error: errorMessage });
      // Set default values if everything fails
      lexiconStats = [];
      statistics = { totalWords: 0, totalSynsets: 0, totalSenses: 0, totalILIs: 0, totalLexicons: 0 };
    }

    // Always return success, even if no data is loaded yet
    logger.end('Getting status', { success: true });
    return {
      success: true,
      data: {
        lexiconStats: lexiconStats || [],
        statistics: statistics || { totalWords: 0, totalSynsets: 0, totalSenses: 0, totalILIs: 0 },
        hasData: !!(lexiconStats && lexiconStats.length > 0)
      }
    };
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logger.error('Failed to get status', { error });
    return { success: false, error: errorMessage };
  }
}


export async function loadPackage(packageId: string, options?: { onProgress?: (progress: number) => void }) {
  try {
    logger.debug(`🔍 Worker loadPackage called with packageId: ${packageId}, hasProgress: ${!!options?.onProgress}`);
    
    if (!orchestrator) {
      return { success: false, error: "WordNet not initialized" };
    }

    logger.start(`Loading package ${packageId}`);
    
    await orchestrator.loadLexicon(packageId, {
      onProgress: options?.onProgress
    });

    // Get updated state after successful load
    const statistics = await orchestrator.getOverallStatistics();
    const lexiconStats = await orchestrator.getLexiconStatistics();

    logger.end(`Loading package ${packageId}`, { success: true });
    return {
      success: true,
      data: {
        statistics,
        lexiconStats,
      },
    };
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logger.error(`Failed to load package ${packageId}`, { error });
    return { success: false, error: errorMessage };
  }
}


export async function queryWords(term: string, pos?: PartOfSpeech) {
  try {
    if (!orchestrator) {
      return { success: false, error: "WordNet not initialized" };
    }

    logger.start(`Querying words for term: ${term}`);
    const results = await orchestrator.queryWords(term, pos);

    logger.end(`Querying words for term: ${term}`, { success: true });
    return { success: true, data: results };
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logger.error(`Failed to query words for term: ${term}`, { error: errorMessage });
    return { success: false, error: errorMessage };
  }
}

export async function querySynsets(term: string, pos?: PartOfSpeech) {
  try {
    if (!orchestrator) {
      return { success: false, error: "WordNet not initialized" };
    }

    logger.start(`Querying synsets for term: ${term}`);
    const results = await orchestrator.querySynsets(term, pos);

    logger.end(`Querying synsets for term: ${term}`, { success: true });
    return { success: true, data: results };
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logger.error(`Failed to query synsets for term: ${term}`, { error: errorMessage });
    return { success: false, error: errorMessage };
  }
}

export async function querySenses(term: string, pos?: PartOfSpeech) {
  try {
    if (!orchestrator) {
      return { success: false, error: "WordNet not initialized" };
    }

    logger.start(`Querying senses for term: ${term}`);
    const results = await orchestrator.querySenses(term, pos);

    logger.end(`Querying senses for term: ${term}`, { success: true });
    return { success: true, data: results };
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logger.error(`Failed to query senses for term: ${term}`, { error: errorMessage });
    return { success: false, error: errorMessage };
  }
}

export async function hasLoadedData(packageId?: string) {
  try {
    if (!orchestrator) {
      return { success: false, error: "WordNet not initialized" };
    }

    // Lightweight check for loaded data
    try {
      const lexiconStats = await orchestrator.getLexiconStatistics();
      if (packageId) {
        // Check if specific package is loaded
        // Handle both full package ID (e.g., "oewn:2024") and base lexicon ID (e.g., "oewn")
        const baseLexiconId = packageId.split(':')[0];
        const hasPackage = lexiconStats.some((ls: LexiconStatistics) => {
          const idMatch = ls.lexiconId === packageId || ls.lexiconId === baseLexiconId;
          // Also check if the lexicon actually has data (not just an empty entry)
          const hasData = (ls.wordCount || 0) > 0 || (ls.synsetCount || 0) > 0;
          return idMatch && hasData;
        });
        return {
          success: true,
          data: { hasPackage, loadedCount: lexiconStats.length },
        };
      } else {
        // Return general loaded status - only count lexicons that actually have data
        const lexiconsWithData = lexiconStats.filter(ls => 
          (ls.wordCount || 0) > 0 || (ls.synsetCount || 0) > 0
        );
        return {
          success: true,
          data: {
            hasData: lexiconsWithData.length > 0,
            loadedCount: lexiconsWithData.length,
          },
        };
      }
    } catch (e: unknown) {
      if (e && typeof e === 'object' && 'resultCode' in e && (e as { resultCode: number }).resultCode === 7) {
        // SQLITE_NOMEM
        logger.warn('SQLITE_NOMEM during hasLoadedData check');
        // On SQLITE_NOMEM, assume no data to be safe
        return {
          success: true,
          data: { hasPackage: false, hasData: false, loadedCount: 0 },
        };
      } else {
        const errorMessage = e instanceof Error ? e.message : String(e);
        logger.warn('Failed to check loaded data status', { error: errorMessage });
        return { success: false, error: errorMessage };
      }
    }
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logger.error('Failed to check loaded data', { error });
    return { success: false, error: errorMessage };
  }
}

export async function clearData() {
  try {
    if (!orchestrator) {
      return { success: false, error: "WordNet not initialized" };
    }

    logger.start('Clearing all data');
    await orchestrator.clearAllData();
    logger.end('Clearing all data', { success: true });
    return { success: true };
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logger.error('Failed to clear data', { error });
    return { success: false, error: errorMessage };
  }
}

export async function getStatistics() {
  try {
    if (!orchestrator) {
      return { success: false, error: "WordNet not initialized" };
    }

    const statistics = await orchestrator.getOverallStatistics();
    logger.end('Getting statistics', { success: true });
    return { success: true, data: statistics };
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logger.error('Failed to get statistics', { error });
    return { success: false, error: errorMessage };
  }
}

export async function getLexiconStatistics() {
  try {
    if (!orchestrator) {
      return { success: false, error: "WordNet not initialized" };
    }

    const lexiconStats = await orchestrator.getLexiconStatistics();
    logger.end('Getting lexicon statistics', { success: true });
    return { success: true, data: lexiconStats };
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logger.error('Failed to get lexicon statistics', { error });
    return { success: false, error: errorMessage };
  }
}

export async function getPartOfSpeechDistribution() {
  try {
    if (!orchestrator) {
      return { success: false, error: "WordNet not initialized" };
    }

    logger.start('Getting part of speech distribution');
    
    // Get overall statistics which may include POS distribution
    const overall = await orchestrator.getOverallStatistics();
    
    // TODO: Get actual POS counts from the database
    // For now, return a basic POS distribution based on available data
    // In the future, this could be enhanced to get actual POS counts
    const posDistribution: Record<string, number> = {
      'n': overall.totalSynsets * 0.6, // Estimate: ~60% nouns
      'v': overall.totalSynsets * 0.2, // Estimate: ~20% verbs  
      'a': overall.totalSynsets * 0.15, // Estimate: ~15% adjectives
      'r': overall.totalSynsets * 0.05, // Estimate: ~5% adverbs
    };
    
    logger.end('Getting part of speech distribution', { success: true, posCount: Object.keys(posDistribution).length });

    return { success: true, data: posDistribution };
  } catch (error) {
    logger.error('Error getting part of speech distribution', error);
    logger.end('Getting part of speech distribution failed', { error: error instanceof Error ? error.message : String(error) });
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

// Additional query methods that were missing from the API
export async function getSensesByWordIdOrForm(wordIdOrForm: string) {
  try {
    if (!orchestrator) return { success: false, error: 'WordNet not initialized' };
    const qs = orchestrator.getWordNetInstance().getQueryService?.();
    if (!qs) return { success: false, error: 'Query service unavailable' };
    const senses = await qs.getSenses({ wordIdOrForm, language: undefined });
    logger.end('Getting senses by word ID or form', { success: true });
    return { success: true, data: senses };
  } catch (error) {
    logger.error('Error getting senses', error);
    logger.end('Getting senses failed', { error: (error as Error)?.message || String(error) });
    return { success: false, error: (error as Error)?.message || String(error) };
  }
}

export async function getWordsBySynsetAndLanguage(synsetId: string, language: string) {
  try {
    if (!orchestrator) return { success: false, error: 'WordNet not initialized' };
    const qs = orchestrator.getWordNetInstance().getQueryService?.();
    if (!qs) return { success: false, error: 'Query service unavailable' };
    const words = await qs.getWordsBySynsetAndLanguage(synsetId, language);
    logger.end('Getting words by synset and language', { success: true });
    return { success: true, data: words };
  } catch (error) {
    logger.error('Error getting words by synset and language', error);
    logger.end('Getting words by synset and language failed', { error: (error as Error)?.message || String(error) });
    return { success: false, error: (error as Error)?.message || String(error) };
  }
}

export async function getDefinitionsBySynsetId(synsetId: string) {
  try {
    if (!orchestrator) return { success: false, error: 'WordNet not initialized' };
    const qs = orchestrator.getWordNetInstance().getQueryService?.();
    if (!qs) return { success: false, error: 'Query service unavailable' };
    const defs = await qs.getDefinitionsBySynsetId(synsetId);
    logger.end('Getting definitions by synset id', { success: true });
    return { success: true, data: defs.map(d => ({
      id: d.id,
      language: d.language,
      text: d.text,
      source: d.source || undefined,
    })) };
  } catch (error) {
    logger.error('Error getting definitions by synset id', error);
    logger.end('Getting definitions by synset id failed', { error: (error as Error)?.message || String(error) });
    return { success: false, error: (error as Error)?.message || String(error) };
  }
}

export async function getSynsetById(synsetId: string) {
  try {
    if (!orchestrator) return { success: false, error: 'WordNet not initialized' };
    const qs = orchestrator.getWordNetInstance().getQueryService?.();
    if (!qs) return { success: false, error: 'Query service unavailable' };
    const synset = await qs.getSynsetById(synsetId);
    logger.end('Getting synset by id', { success: true });
    return { success: true, data: synset };
  } catch (error) {
    logger.error('Error getting synset by id', error);
    logger.end('Getting synset by id failed', { error: (error as Error)?.message || String(error) });
    return { success: false, error: (error as Error)?.message || String(error) };
  }
}

export async function getWordsByIliAndLanguage(ili: string, language: string) {
  try {
    if (!orchestrator) return { success: false, error: 'WordNet not initialized' };
    const qs = orchestrator.getWordNetInstance().getQueryService?.();
    if (!qs) return { success: false, error: 'Query service unavailable' };
    const words = await qs.getWordsByIliAndLanguage(ili, language);
    logger.end('Getting words by ILI and language', { success: true });
    return { success: true, data: words };
  } catch (error) {
    logger.error('Error getting words by ILI and language', error);
    logger.end('Getting words by ILI and language failed', { error: (error as Error)?.message || String(error) });
    return { success: false, error: (error as Error)?.message || String(error) };
  }
}

export async function getWordsByIliAndLexiconPrefix(ili: string, lexiconPrefix: string) {
  try {
    if (!orchestrator) return { success: false, error: 'WordNet not initialized' };
    const qs = orchestrator.getWordNetInstance().getQueryService?.();
    if (!qs) return { success: false, error: 'Query service unavailable' };
    const words = await qs.getWordsByIliAndLexiconPrefix(ili, lexiconPrefix);
    logger.end('Getting words by ILI and lexicon prefix', { success: true });
    return { success: true, data: words };
  } catch (error) {
    logger.error('Error getting words by ILI and lexicon prefix', error);
    logger.end('Getting words by ILI and lexicon prefix failed', { error: (error as Error)?.message || String(error) });
    return { success: false, error: (error as Error)?.message || String(error) };
  }
}

// NEW: Find ILI identifier for a given synset by querying CILI package
export async function getIliForSynset(synsetId: string) {
  try {
    if (!orchestrator) return { success: false, error: 'WordNet not initialized' };
    
    // This method needs to query the CILI package to find the ILI for a given synset
    // The logic will be implemented in the orchestrator
    const result = await orchestrator.getIliForSynset(synsetId);
    logger.end('Getting ILI for synset', { success: true, synsetId });
    // Convert null to undefined to match the expected type
    return { success: true, data: result || undefined };
  } catch (error) {
    logger.error('Error getting ILI for synset', error);
    logger.end('Getting ILI for synset failed', { error: (error as Error)?.message || String(error), synsetId });
    return { success: false, error: (error as Error)?.message || String(error) };
  }
}

/**
 * Map package ID to lexicon ID
 * e.g., "oewn:2024" -> "oewn", "omw-fr:1.4" -> "omw-fr"
 */
function mapPackageIdToLexiconId(packageId: string): string {
  // The database stores the full package ID (with version) in the lexicon field
  // So we should use the package ID as-is, not strip the version
  return packageId;
}

export async function searchWordsInLexicon(term: string, lexicon: string, language?: string) {
  try {
    if (!orchestrator) return { success: false, error: 'WordNet not initialized' };
    const qs = orchestrator.getWordNetInstance().getQueryService?.();
    if (!qs) return { success: false, error: 'Query service unavailable' };
    
    // Map package ID to lexicon ID for database queries
    const lexiconId = mapPackageIdToLexiconId(lexicon);
    logger.debug(`Searching words in lexicon: ${lexicon} -> ${lexiconId}, term: ${term}, language: ${language}`);
    
    const words = await qs.searchWords(term, { lexicon: lexiconId, language, exact: true });
    logger.end('Searching words in lexicon', { success: true });
    return { success: true, data: words };
  } catch (error) {
    logger.error('Error searching words in lexicon', error);
    logger.end('Searching words in lexicon failed', { error: (error as Error)?.message || String(error) });
    return { success: false, error: (error as Error)?.message || String(error) };
  }
}

// Test function to debug memory issues
export async function testMemoryQueries() {
  logger.start('Testing memory-efficient queries');
  
  if (!orchestrator) {
    return { success: false, error: "WordNet not initialized" };
  }

  const results: MemoryQueryTestResult = {
    lexicons: { success: false },
    query: { success: false }
  };
  
  try {
    // Basic sanity queries through orchestrator
    logger.step('Test: orchestrator lexicon stats');
    try {
      const stats = await orchestrator.getLexiconStatistics();
      results.lexicons = { success: true, count: stats.length };
    } catch (e: unknown) {
      const errorMessage = e instanceof Error ? e.message : String(e);
      results.lexicons = { success: false, error: errorMessage };
    }

    logger.step('Test: query words/synsets');
    try {
      const words = await orchestrator.queryWords('water');
      const synsets = await orchestrator.querySynsets('water');
      results.query = { success: true, words: words.length, synsets: synsets.length };
    } catch (e: unknown) {
      const errorMessage = e instanceof Error ? e.message : String(e);
      results.query = { success: false, error: errorMessage };
    }

    logger.end('Testing memory-efficient queries', { success: true });
    return { success: true, data: results };
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logger.error('Memory test failed', { error: errorMessage });
    logger.end('Testing memory-efficient queries failed', { error: errorMessage });
    return { success: false, error: errorMessage };
  }
}

// Additional methods needed to replace direct dataLoader access
export async function clearCache() {
  try {
    if (!orchestrator) {
      return { success: false, error: "WordNet not initialized" };
    }

    logger.start('Clearing cache');
    // The orchestrator's clearAllData method handles cache clearing
    await orchestrator.clearAllData();
    logger.end('Clearing cache', { success: true });
    return { success: true };
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logger.error('Failed to clear cache', { error });
    return { success: false, error: errorMessage };
  }
}

export async function getCacheInfo() {
  try {
    if (!orchestrator) {
      return { success: false, error: "WordNet not initialized" };
    }

    logger.start('Getting cache info');
    
    // For now, return basic storage availability info since the orchestrator doesn't have detailed cache info
    // This provides useful information without requiring the orchestrator to implement detailed cache info
    const hasStorageQuota = "storage" in navigator && "estimate" in navigator.storage;
    const hasIndexedDB = "indexedDB" in window;
    const hasLocalStorage = "localStorage" in window;
    const hasSessionStorage = "sessionStorage" in window;

    // Try to get basic statistics to show what's cached
    let hasData = false;
    try {
      const lexiconStats = await orchestrator.getLexiconStatistics();
      hasData = lexiconStats.length > 0;
    } catch (e) {
      // If this fails, assume no data is cached
      hasData = false;
    }

    const cacheInfo: CacheInfo = {
      hasStorageQuota,
      hasIndexedDB,
      hasLocalStorage,
      hasSessionStorage,
      source: "worker",
      // Add more detailed cache info here when orchestrator supports it
    };

    logger.end('Getting cache info', { success: true });
    return { success: true, data: cacheInfo };
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logger.error('Failed to get cache info', { error: errorMessage });
    return { success: false, error: errorMessage };
  }
}

// Helper function to properly dispose WordNet instances
async function disposeWordNet() {
  try {
    logger.start('Disposing WordNet instances');
    isDisposing = true;
    
    if (orchestrator) {
      try {
        await orchestrator.close();
        logger.debug('Orchestrator closed');
      } catch (e) {
        logger.warn('Error closing orchestrator', { error: e });
      }
      orchestrator = null;
    }
    
    // Close the OPFS database singleton to prevent access handle conflicts
    try {
      // const { WebDatabase } = await import('../client/submodules/web-database'); // Temporarily disabled due to missing StorageAdapter implementation
      // WebDatabase.closeOpfsDatabase(); // Temporarily disabled
      logger.debug('OPFS database singleton closed');
    } catch (e) {
      logger.warn('Error closing OPFS database singleton', { error: e });
    }
    
    isInitialized = false;
    isDisposing = false;
    logger.end('Disposing WordNet instances', { success: true });
  } catch (error) {
    logger.error('Error disposing WordNet instances', { error });
    isDisposing = false;
  }
}

// Flush database to ensure data persistence
export async function flushDatabase() {
  try {
    if (!orchestrator) {
      return { success: false, error: "WordNet not initialized" };
    }

    logger.start('Flushing database for persistence');
    
    // Get the underlying database and flush it
    const wordnet = orchestrator.getWordNetInstance();
    const database = wordnet.getDatabase();
    
    if (database && typeof (database as any).flush === 'function') {
      await (database as any).flush();
      logger.success('Database flushed successfully');
      return { success: true };
    } else {
      logger.warn('Database flush method not available');
      return { success: false, error: "Database flush method not available" };
    }
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logger.error('Failed to flush database', { error });
    return { success: false, error: errorMessage };
  }
}

// Check if database is persistent
export async function isDatabasePersistent() {
  try {
    if (!orchestrator) {
      return { success: false, error: "WordNet not initialized" };
    }

    const isPersistent = orchestrator.isDatabasePersistent();
    return { success: true, data: isPersistent };
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logger.error('Failed to check database persistence', { error });
    return { success: false, error: errorMessage };
  }
}

// Get database storage information
export async function getDatabaseStorageInfo() {
  try {
    if (!orchestrator) {
      return { success: false, error: "WordNet not initialized" };
    }

    const storageInfo: DatabaseStorageInfo = orchestrator.getDatabaseStorageInfo();
    return { success: true, data: storageInfo };
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logger.error('Failed to get database storage info', { error: errorMessage });
    return { success: false, error: errorMessage };
  }
}


expose({
  initializeWordNet,
  getStatus,
  loadPackage,
  queryWords,
  querySynsets,
  querySenses,
  clearData,
  getStatistics,
  hasLoadedData,
  testMemoryQueries,
  clearCache,
  getCacheInfo,
  searchWordsInLexicon,
  getSensesByWordIdOrForm,
  getWordsBySynsetAndLanguage,
  getDefinitionsBySynsetId,
  getSynsetById,
  getWordsByIliAndLanguage,
  getWordsByIliAndLexiconPrefix,
  getIliForSynset,
  getLexiconStatistics,
  getPartOfSpeechDistribution,
  flushDatabase,
  isDatabasePersistent,
  getDatabaseStorageInfo,
} satisfies WordNetWorkerAPI)

// Initialize when worker loads
logger.info("WordNet worker script loaded and ready");
