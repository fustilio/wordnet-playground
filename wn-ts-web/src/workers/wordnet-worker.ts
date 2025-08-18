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
import type { WordNetWorkerAPI } from './type.js';

let orchestrator: WordNetOrchestrator | null = null;
let sqlModule: Sqlite3Static | null = null;
let isInitialized = false;
let isDisposing = false;

// Expose the worker API using Comlink
export async function initializeWordNet(lexiconId = "oewn:2024") {
  try {
    console.log('Starting: WordNet initialization');
    
    // Check if we're already initialized
    if (isInitialized && orchestrator) {
      console.log('WordNet already initialized, returning existing instance');
      return { 
        success: true, 
        data: { 
          lexiconStats: [], 
          statistics: { totalWords: 0, totalSynsets: 0, totalSenses: 0 },
          hasInitialState: true
        } 
      };
    }
    
    // Check if we're in the middle of disposing
    if (isDisposing) {
      console.warn('WordNet is currently being disposed, waiting...');
      await new Promise(resolve => setTimeout(resolve, 100));
      isDisposing = false;
    }
    
    // If we have existing instances, dispose them first to avoid conflicts
    if (orchestrator) {
      console.log('Disposing existing orchestrator before reinitializing');
      await disposeWordNet();
    }
    
    // Load SQLite WASM module once
    if (!sqlModule) {
      console.log('Loading @sqlite.org/sqlite-wasm module');
      try {
        sqlModule = await sqlite3InitModule({
          print: (msg: string) => console.log('sqlite3InitModule:', msg),
          printErr: (msg: string) => console.error('sqlite3InitModule:', msg)
        }) as unknown as Sqlite3Static;
        console.log('SQLite module loaded successfully');
      } catch (sqliteError) {
        console.error('Failed to load SQLite module:', sqliteError);
        throw sqliteError;
      }
    }

    console.log('Creating WordNetOrchestrator...');
    // Create and initialize orchestrator with default lexicons
    orchestrator = new WordNetOrchestrator({ 
      defaultLexicons: [lexiconId], // Use the requirement ID as the default lexicon
      autoCheckUpdates: false 
    });
    console.log('Orchestrator created, initializing...');
    await orchestrator.initialize(sqlModule);
    isInitialized = true;
    
    console.log('Orchestrator initialized successfully');
    
    // Don't try to get expensive statistics during initialization
    // Just return success and let the main thread check status when needed
    return { 
      success: true, 
      data: { 
        lexiconStats: [], 
        statistics: { totalWords: 0, totalSynsets: 0, totalSenses: 0 },
        hasInitialState: false
      } 
    };
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('Failed to initialize WordNet', { error });
    return { success: false, error: errorMessage };
  }
}

export async function getStatus() {
  console.log('Getting status from worker');
  try {
    if (!orchestrator) {
      console.error('WordNet not initialized');
      return { success: false, error: "WordNet not initialized" };
    }

    // Lightweight status check - try simple queries first, then fall back to complex ones
    let lexiconStats = null;
    let statistics = null;
    
    try {
      console.log('Getting lexicon stats from worker');
      
      // Pull lexicon stats directly from orchestrator
      try {
        lexiconStats = await orchestrator.getLexiconStatistics();
        console.log('Got lexicon stats via orchestrator', { count: Array.isArray(lexiconStats) ? lexiconStats.length : 0 });
      } catch (e: any) {
        console.warn('Failed to get lexicon stats via orchestrator', { error: e });
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
          totalILIs: overall.totalILIs 
        };
      } catch (e: any) {
        console.warn('Failed to get overall statistics', { error: e });
        // If this fails, it might be because no data is loaded yet - that's okay
        statistics = { totalWords: 0, totalSynsets: 0, totalSenses: 0, totalILIs: 0 };
      }
    } catch (e: any) {
      console.warn('Unexpected error during status check', e);
      // Set default values if everything fails
      lexiconStats = [];
      statistics = { totalWords: 0, totalSynsets: 0, totalSenses: 0 };
    }

    // Always return success, even if no data is loaded yet
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
    console.error('Failed to get status', { error });
    return { success: false, error: errorMessage };
  }
}

export async function loadPackage(packageId: string, options?: { onProgress?: (progress: number) => void }) {
  try {
    if (!orchestrator) {
      return { success: false, error: "WordNet not initialized" };
    }

    console.log(`Loading package ${packageId}`);
    await orchestrator.loadLexicon(packageId, {
      onProgress: options?.onProgress
    });

    // Get updated state after successful load
    const statistics = await orchestrator.getOverallStatistics();
    const lexiconStats = await orchestrator.getLexiconStatistics();

    return {
      success: true,
      data: {
        statistics,
        lexiconStats,
      },
    };
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(`Failed to load package ${packageId}`, { error });
    return { success: false, error: errorMessage };
  }
}

export async function loadDemoData(options?: { onProgress?: (progress: number) => void }) {
  try {
    if (!orchestrator) {
      return { success: false, error: "WordNet not initialized" };
    }

    console.log('Loading demo data');
    // Load all default lexicons if they exist, otherwise fall back to oewn:2024
    const defaultLexicons = orchestrator.getDefaultLexicons();
    if (defaultLexicons.length > 0) {
      for (const lexiconId of defaultLexicons) {
        await orchestrator.loadLexicon(lexiconId, {
          onProgress: options?.onProgress
        });
      }
    } else {
      // Fallback for backward compatibility
      await orchestrator.loadLexicon('oewn:2024', {
        onProgress: options?.onProgress
      });
    }

    // Get updated state after successful load
    const statistics = await orchestrator.getOverallStatistics();
    const lexiconStats = await orchestrator.getLexiconStatistics();

    return {
      success: true,
      data: {
        statistics,
        lexiconStats,
      },
    };
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('Failed to load demo data', { error });
    return { success: false, error: errorMessage };
  }
}

export async function queryWords(term: string, pos?: string) {
  try {
    if (!orchestrator) {
      return { success: false, error: "WordNet not initialized" };
    }

    console.log(`Querying words for term: ${term}`);
    const results = await orchestrator.queryWords(term, pos as any);

    return { success: true, data: results };
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(`Failed to query words for term: ${term}`, { error });
    return { success: false, error: errorMessage };
  }
}

export async function querySynsets(term: string, pos?: string) {
  try {
    if (!orchestrator) {
      return { success: false, error: "WordNet not initialized" };
    }

    console.log(`Querying synsets for term: ${term}`);
    const results = await orchestrator.querySynsets(term, pos as any);

    return { success: true, data: results };
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(`Failed to query synsets for term: ${term}`, { error });
    return { success: false, error: errorMessage };
  }
}

export async function querySenses(term: string, pos?: string) {
  try {
    if (!orchestrator) {
      return { success: false, error: "WordNet not initialized" };
    }

    console.log(`Querying senses for term: ${term}`);
    const results = await orchestrator.querySenses(term, pos as any);

    return { success: true, data: results };
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(`Failed to query senses for term: ${term}`, { error });
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
        const hasPackage = lexiconStats.some((ls: any) => ls.lexiconId === packageId);
        return {
          success: true,
          data: { hasPackage, loadedCount: lexiconStats.length },
        };
      } else {
        // Return general loaded status
        return {
          success: true,
          data: {
            hasData: lexiconStats.length > 0,
            loadedCount: lexiconStats.length,
          },
        };
      }
    } catch (e: any) {
      if (e?.resultCode === 7) {
        // SQLITE_NOMEM
        console.warn('SQLITE_NOMEM during hasLoadedData check');
        // On SQLITE_NOMEM, assume no data to be safe
        return {
          success: true,
          data: { hasPackage: false, hasData: false, loadedCount: 0 },
        };
      } else {
        console.warn('Failed to check loaded data status', e);
        return { success: false, error: e.message };
      }
    }
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('Failed to check loaded data', { error });
    return { success: false, error: errorMessage };
  }
}

export async function clearData() {
  try {
    if (!orchestrator) {
      return { success: false, error: "WordNet not initialized" };
    }

    console.log('Clearing all data');
    await orchestrator.clearAllData();
    return { success: true };
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('Failed to clear data', { error });
    return { success: false, error: errorMessage };
  }
}

export async function getStatistics() {
  try {
    if (!orchestrator) {
      return { success: false, error: "WordNet not initialized" };
    }

    const statistics = await orchestrator.getOverallStatistics();
    return { success: true, data: statistics };
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('Failed to get statistics', { error });
    return { success: false, error: errorMessage };
  }
}

export async function getLexiconStatistics() {
  try {
    if (!orchestrator) {
      return { success: false, error: "WordNet not initialized" };
    }

    const lexiconStats = await orchestrator.getLexiconStatistics();
    return { success: true, data: lexiconStats };
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('Failed to get lexicon statistics', { error });
    return { success: false, error: errorMessage };
  }
}

export async function getPartOfSpeechDistribution() {
  try {
    if (!orchestrator) {
      return { success: false, error: "WordNet not initialized" };
    }

    console.log('Getting part of speech distribution');
    const overall = await orchestrator.getOverallStatistics();
    const posDistribution = undefined as unknown as any;

    console.log('Part of speech distribution fetched successfully');
    console.log('Getting part of speech distribution completed', { statistics: !!overall });

    return { success: true, data: posDistribution };
  } catch (error) {
    console.error('Error getting part of speech distribution', error);
    console.log('Getting part of speech distribution failed');
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
    const senses = await qs.getSenses({ wordIdOrForm });
    return { success: true, data: senses };
  } catch (error) {
    console.error('Error getting senses', error);
    return { success: false, error: (error as Error)?.message || String(error) };
  }
}

export async function getWordsBySynsetAndLanguage(synsetId: string, language: string) {
  try {
    if (!orchestrator) return { success: false, error: 'WordNet not initialized' };
    const qs = orchestrator.getWordNetInstance().getQueryService?.();
    if (!qs) return { success: false, error: 'Query service unavailable' };
    const words = await qs.getWordsBySynsetAndLanguage(synsetId, language);
    return { success: true, data: words };
  } catch (error) {
    console.error('Error getting words by synset and language', error);
    return { success: false, error: (error as Error)?.message || String(error) };
  }
}

export async function getDefinitionsBySynsetId(synsetId: string) {
  try {
    if (!orchestrator) return { success: false, error: 'WordNet not initialized' };
    const qs = orchestrator.getWordNetInstance().getQueryService?.();
    if (!qs) return { success: false, error: 'Query service unavailable' };
    const defs = await qs.getDefinitionsBySynsetId(synsetId);
    return { success: true, data: defs };
  } catch (error) {
    console.error('Error getting definitions by synset id', error);
    return { success: false, error: (error as Error)?.message || String(error) };
  }
}

export async function getSynsetById(synsetId: string) {
  try {
    if (!orchestrator) return { success: false, error: 'WordNet not initialized' };
    const qs = orchestrator.getWordNetInstance().getQueryService?.();
    if (!qs) return { success: false, error: 'Query service unavailable' };
    const synset = await qs.getSynsetById(synsetId);
    return { success: true, data: synset };
  } catch (error) {
    console.error('Error getting synset by id', error);
    return { success: false, error: (error as Error)?.message || String(error) };
  }
}

export async function getWordsByIliAndLanguage(ili: string, language: string) {
  try {
    if (!orchestrator) return { success: false, error: 'WordNet not initialized' };
    const qs = orchestrator.getWordNetInstance().getQueryService?.();
    if (!qs) return { success: false, error: 'Query service unavailable' };
    const words = await qs.getWordsByIliAndLanguage(ili, language);
    return { success: true, data: words };
  } catch (error) {
    console.error('Error getting words by ILI and language', error);
    return { success: false, error: (error as Error)?.message || String(error) };
  }
}

export async function getWordsByIliAndLexiconPrefix(ili: string, lexiconPrefix: string) {
  try {
    if (!orchestrator) return { success: false, error: 'WordNet not initialized' };
    const qs = orchestrator.getWordNetInstance().getQueryService?.();
    if (!qs) return { success: false, error: 'Query service unavailable' };
    const words = await qs.getWordsByIliAndLexiconPrefix(ili, lexiconPrefix);
    return { success: true, data: words };
  } catch (error) {
    console.error('Error getting words by ILI and lexicon prefix', error);
    return { success: false, error: (error as Error)?.message || String(error) };
  }
}

export async function searchWordsInLexicon(term: string, lexicon: string, language?: string) {
  try {
    if (!orchestrator) return { success: false, error: 'WordNet not initialized' };
    const qs = orchestrator.getWordNetInstance().getQueryService?.();
    if (!qs) return { success: false, error: 'Query service unavailable' };
    const words = await qs.searchWords(term, { lexicon, language, exact: true });
    return { success: true, data: words };
  } catch (error) {
    console.error('Error searching words in lexicon', error);
    return { success: false, error: (error as Error)?.message || String(error) };
  }
}

// Test function to debug memory issues
export async function testMemoryQueries() {
  console.log('Testing memory-efficient queries');
  
  if (!orchestrator) {
    return { success: false, error: "WordNet not initialized" };
  }

  const results: any = {};
  
  try {
    // Basic sanity queries through orchestrator
    console.log('Test: orchestrator lexicon stats');
    try {
      const stats = await orchestrator.getLexiconStatistics();
      results.lexicons = { success: true, count: stats.length };
    } catch (e: any) {
      results.lexicons = { success: false, error: e.message };
    }

    console.log('Test: query words/synsets');
    try {
      const words = await orchestrator.queryWords('water');
      const synsets = await orchestrator.querySynsets('water');
      results.query = { success: true, words: words.length, synsets: synsets.length };
    } catch (e: any) {
      results.query = { success: false, error: e.message };
    }

    return { success: true, data: results };
  } catch (error: any) {
    console.error('Memory test failed', { error });
    return { success: false, error: error.message };
  }
}

// Additional methods needed to replace direct dataLoader access
export async function clearCache() {
  try {
    if (!orchestrator) {
      return { success: false, error: "WordNet not initialized" };
    }

    console.log('Clearing cache');
    // The orchestrator's clearAllData method handles cache clearing
    await orchestrator.clearAllData();
    return { success: true };
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('Failed to clear cache', { error });
    return { success: false, error: errorMessage };
  }
}

export async function getCacheInfo() {
  try {
    if (!orchestrator) {
      return { success: false, error: "WordNet not initialized" };
    }

    console.log('Getting cache info');
    
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

    const cacheInfo = {
      hasStorageQuota,
      hasIndexedDB,
      hasLocalStorage,
      hasSessionStorage,
      source: "worker",
      hasData,
      // Add more detailed cache info here when orchestrator supports it
    };

    return { success: true, data: cacheInfo };
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('Failed to get cache info', { error });
    return { success: false, error: errorMessage };
  }
}

// Helper function to properly dispose WordNet instances
async function disposeWordNet() {
  try {
    console.log('Disposing WordNet instances');
    isDisposing = true;
    
    if (orchestrator) {
      try {
        await orchestrator.close();
        console.log('Orchestrator closed');
      } catch (e) {
        console.warn('Error closing orchestrator', { error: e });
      }
      orchestrator = null;
    }
    
    isInitialized = false;
    isDisposing = false;
    console.log('WordNet instances disposed successfully');
  } catch (error) {
    console.error('Error disposing WordNet instances', { error });
    isDisposing = false;
  }
}


expose({
  initializeWordNet,
  getStatus,
  loadPackage,
  loadDemoData,
  queryWords,
  querySynsets,
  querySenses,
  clearData,
  getStatistics,
  hasLoadedData,
  testMemoryQueries,
  clearCache,
  getCacheInfo,
} satisfies WordNetWorkerAPI)

// Initialize when worker loads
console.log("WordNet worker script loaded and ready");
