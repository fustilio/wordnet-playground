/**
 * WordNet Worker for wn-ts-web-demo
 * 
 * This worker now uses the worker factory from wn-ts-web to provide
 * a clean API for the main thread via Comlink.
 * 
 * All the heavy lifting is now handled by the factory, making this
 * much more maintainable and consistent with the main library.
 */

// For now, we'll route through the orchestrator which manages a single
// WordNet instance and lexicon lifecycle.

import { createScopedLogger } from '../logger'
import { WordNetOrchestrator } from 'wn-ts-web'
import sqlite3InitModule, { type Sqlite3Static } from '@sqlite.org/sqlite-wasm'

let orchestrator: WordNetOrchestrator | null = null;
let sqlModule: Sqlite3Static | null = null;
let isInitialized = false;
let isDisposing = false; // Flag to prevent multiple disposal operations
const logger = createScopedLogger('wordnet-worker')

// Expose the worker API using Comlink
export async function initializeWordNet() {
  try {
    logger.info('Starting: WordNet initialization');
    
    // Check if we're already initialized
    if (isInitialized && orchestrator) {
      logger.debug('WordNet already initialized, returning existing instance');
      return { 
        success: true, 
        data: { 
          lexiconStats: null, 
          statistics: null,
          hasInitialState: true
        } 
      };
    }
    
    // Check if we're in the middle of disposing
    if (isDisposing) {
      logger.warn('WordNet is currently being disposed, waiting...');
      // Wait a bit for disposal to complete
      await new Promise(resolve => setTimeout(resolve, 100));
      isDisposing = false;
    }
    
    // If we have existing instances, dispose them first to avoid conflicts
    if (orchestrator) {
      logger.debug('Disposing existing orchestrator before reinitializing');
      await disposeWordNet();
    }
    
    // Load SQLite WASM module once
    if (!sqlModule) {
      logger.debug('Loading @sqlite.org/sqlite-wasm module');
      sqlModule = await sqlite3InitModule({
        print: (msg: string) => console.log('sqlite3InitModule:', msg),
        printErr: (msg: string) => console.error('sqlite3InitModule:', msg)
      }) as unknown as Sqlite3Static;
    }

    // Create and initialize orchestrator
    orchestrator = new WordNetOrchestrator({ lexiconId: 'oewn:2024', autoCheckUpdates: false });
    await orchestrator.initialize(sqlModule);
    isInitialized = true;
    
    logger.info('Orchestrator initialized successfully');
    
    // Don't try to get expensive statistics during initialization
    // Just return success and let the main thread check status when needed
    return { 
      success: true, 
      data: { 
        lexiconStats: null, 
        statistics: null,
        hasInitialState: false
      } 
    };
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logger.error('Failed to initialize WordNet', { error });
    return { success: false, error: errorMessage };
  }
}

export async function getStatus() {
  logger.debug('Getting status from worker');
  try {
    if (!orchestrator) {
      logger.error('WordNet not initialized');
      return { success: false, error: "WordNet not initialized" };
    }

    // Lightweight status check - try simple queries first, then fall back to complex ones
    let lexiconStats = null;
    let statistics = null;
    
    try {
      logger.debug('Getting lexicon stats from worker');
      
      // Pull lexicon stats directly from orchestrator
      try {
        lexiconStats = await orchestrator.getLexiconStatistics();
        logger.debug('Got lexicon stats via orchestrator', { count: Array.isArray(lexiconStats) ? lexiconStats.length : 0 });
      } catch (e: any) {
        logger.warn('Failed to get lexicon stats via orchestrator', { error: e });
        lexiconStats = [];
      }

      // Get overall statistics via orchestrator (already optimized in core)
      try {
        const overall = await orchestrator.getOverallStatistics();
        statistics = { totalWords: overall.totalWords, totalSynsets: overall.totalSynsets, totalSenses: overall.totalSenses };
      } catch (e: any) {
        logger.warn('Failed to get overall statistics', { error: e });
      }
    } catch (e: any) {
      logger.warn('Unexpected error during status check', e);
    }

    return {
      success: true,
      data: {
        lexiconStats,
        statistics,
        hasData: !!(lexiconStats && lexiconStats.length > 0)
      }
    };
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logger.error('Failed to get status', { error });
    return { success: false, error: errorMessage };
  }
}

// Test function to debug memory issues
// Test function to debug memory issues - exposed for debugging
export async function testMemoryQueries() {
  logger.debug('Testing memory-efficient queries');
  
  if (!orchestrator) {
    return { success: false, error: "WordNet not initialized" };
  }

  const results: any = {};
  
  try {
    // Basic sanity queries through orchestrator
    logger.debug('Test: orchestrator lexicon stats');
    try {
      const stats = await orchestrator.getLexiconStatistics();
      results.lexicons = { success: true, count: stats.length };
    } catch (e: any) {
      results.lexicons = { success: false, error: e.message };
    }

    logger.debug('Test: query words/synsets');
    try {
      const words = await orchestrator.queryWords('water');
      const synsets = await orchestrator.querySynsets('water');
      results.query = { success: true, words: words.length, synsets: synsets.length };
    } catch (e: any) {
      results.query = { success: false, error: e.message };
    }

    return { success: true, data: results };
  } catch (error: any) {
    logger.error('Memory test failed', { error });
    return { success: false, error: error.message };
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
        const hasPackage = lexiconStats.some(ls => ls.lexiconId === packageId);
        return { success: true, data: { hasPackage, loadedCount: lexiconStats.length } };
      } else {
        // Return general loaded status
        return { success: true, data: { hasData: lexiconStats.length > 0, loadedCount: lexiconStats.length } };
      }
    } catch (e: any) {
      if (e?.resultCode === 7) { // SQLITE_NOMEM
        logger.warn('SQLITE_NOMEM during hasLoadedData check', { error: e });
        // On SQLITE_NOMEM, assume no data to be safe
        return { success: true, data: { hasPackage: false, hasData: false, loadedCount: 0 } };
      } else {
        logger.warn('Failed to check loaded data status', e);
        return { success: false, error: e.message };
      }
    }
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logger.error('Failed to check loaded data', { error });
    return { success: false, error: errorMessage };
  }
}

export async function loadPackageFromData(packageId: string, data: ArrayBuffer) {
  try {
    if (!orchestrator) {
      return { success: false, error: "WordNet not initialized" };
    }

    // Orchestrator manages download+load; for raw data input we don't have a direct path yet
    logger.start('loading package from data');
    logger.step('falling back to orchestrator.loadLexicon', { packageId, bytes: data.byteLength });
    await orchestrator.loadLexicon(packageId);
    logger.success('Package load triggered via orchestrator');
    logger.end('loading package from data', { packageId });
    return { success: true, data: { packageId } };
  } catch (error) {
    logger.fail('Error loading package from data', error);
    logger.end('loading package from data');
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

export async function loadPackage(packageId: string) {
  try {
    if (!orchestrator) {
      return { success: false, error: "WordNet not initialized" };
    }

    logger.start('loading package');
    await orchestrator.loadLexicon(packageId);
    logger.success('Package loaded via orchestrator');
    logger.end('loading package', { packageId });
    return { success: true };
  } catch (error) {
    logger.fail('Error loading package', error);
    logger.end('loading package');
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

export async function loadDemoData() {
  try {
    if (!orchestrator) {
      return { success: false, error: "WordNet not initialized" };
    }

    logger.start('loading demo data');
    await orchestrator.loadLexicon('oewn:2024');
    logger.success('Demo data loaded via orchestrator');
    logger.end('loading demo data', { packageId: 'oewn:2024' });
    return { success: true };
  } catch (error) {
    logger.fail('Error loading demo data', error);
    logger.end('loading demo data');
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

export async function getStatistics() {
  try {
    if (!orchestrator) {
      return { success: false, error: "WordNet not initialized" };
    }

    logger.start('getting statistics');
    const overall = await orchestrator.getOverallStatistics();
    const lexiconStats = await orchestrator.getLexiconStatistics();
    const stats = { totalWords: overall.totalWords, totalSynsets: overall.totalSynsets, totalSenses: overall.totalSenses };
    const posDistribution = undefined as unknown as any;

    logger.success('Statistics fetched successfully');
    logger.end('getting statistics', { statistics: !!overall, lexiconCount: lexiconStats.length });

    return { success: true, data: { statistics: stats, posDistribution, lexiconStats } };
  } catch (error) {
    logger.fail('Error getting statistics', error);
    logger.end('getting statistics');
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

export async function queryWords(term: string) {
  try {
    if (!orchestrator) {
      return { success: false, error: "WordNet not initialized" };
    }

    logger.start('querying words');
    logger.step('querying words', { term });
    const results = await orchestrator.queryWords(term);

    logger.success('Words queried successfully');
    logger.end('querying words', { 
      term,
      resultCount: results.length
    });

    return { success: true, data: results };
  } catch (error) {
    logger.fail('Error querying words', error);
    logger.end('querying words');
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

export async function querySynsets(term: string) {
  try {
    if (!orchestrator) {
      return { success: false, error: "WordNet not initialized" };
    }

    logger.start('querying synsets');
    logger.step('querying synsets', { term });
    const results = await orchestrator.querySynsets(term);

    logger.success('Synsets queried successfully');
    logger.end('querying synsets', { 
      term,
      resultCount: results.length
    });

    return { success: true, data: results };
  } catch (error) {
    logger.fail('Error querying synsets', error);
    logger.end('querying synsets');
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

// Helper function to properly dispose WordNet instances
async function disposeWordNet() {
  try {
    logger.debug('Disposing WordNet instances');
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
    
    isInitialized = false;
    isDisposing = false;
    logger.debug('WordNet instances disposed successfully');
  } catch (error) {
    logger.error('Error disposing WordNet instances', { error });
    isDisposing = false;
  }
}

export async function clearData() {
  try {
    logger.start('clearing all data');
    
    if (orchestrator) {
      await orchestrator.clearAllData();
    }

    logger.success('All data cleared successfully');
    logger.end('clearing all data');

    return { success: true };
  } catch (error) {
    logger.fail('Error clearing data', error);
    logger.end('clearing all data');
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

// Initialize when worker loads
logger.info("Worker script loaded and ready");
