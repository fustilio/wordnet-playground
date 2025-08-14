/**
 * WordNet Worker for wn-ts-web-demo
 * 
 * This worker now uses the worker factory from wn-ts-web to provide
 * a clean API for the main thread via Comlink.
 * 
 * All the heavy lifting is now handled by the factory, making this
 * much more maintainable and consistent with the main library.
 */

// For now, we'll create a simple worker that uses the factory
// Once the package exports are fully working, we can simplify this further

import { createWordNetInstance, WebWordnet, DataLoader } from "wn-ts-web";
import { createScopedLogger } from '../logger'

let wordnet: WebWordnet | null = null;
let dataLoader: DataLoader | null = null;
let isInitialized = false;
let isDisposing = false; // Flag to prevent multiple disposal operations
const logger = createScopedLogger('wordnet-worker')

// Expose the worker API using Comlink
export async function initializeWordNet() {
  try {
    logger.info('Starting: WordNet initialization');
    
    // Check if we're already initialized
    if (isInitialized && wordnet && dataLoader) {
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
    if (wordnet || dataLoader) {
      logger.debug('Disposing existing instances before reinitializing');
      await disposeWordNet();
    }
    
    // Create WordNet instance
    const instance = await createWordNetInstance();
    if (instance.wordnet && instance.dataLoader) {
      wordnet = instance.wordnet;
      dataLoader = instance.dataLoader;
      isInitialized = true;
      
      logger.info('WordNet instance created successfully');
      
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
    }
    
    return { success: false, error: 'Failed to create WordNet instance' };
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logger.error('Failed to initialize WordNet', { error });
    return { success: false, error: errorMessage };
  }
}

export async function getStatus() {
  logger.debug('Getting status from worker');
  try {
    if (!wordnet) {
      logger.error('WordNet not initialized');
      return { success: false, error: "WordNet not initialized" };
    }

    // Lightweight status check - try simple queries first, then fall back to complex ones
    let lexiconStats = null;
    let statistics = null;
    
    try {
      logger.debug('Getting lexicon stats from worker');
      
      // Try to get lexicon stats efficiently, with fallbacks for memory issues
      try {
        // First try the lightweight getQuickStatus method
        logger.debug('Trying lightweight status check');
        const quickStatus = await wordnet.getQuickStatus({ includeExpensive: false });
        lexiconStats = quickStatus.lexiconStats;
        logger.debug('Got lexicon stats via getQuickStatus', { lexiconStats });
      } catch (e: any) {
        logger.warn('getQuickStatus failed, trying direct method', { error: e });
        
        try {
          // Fallback to direct method
          lexiconStats = await wordnet.getLexiconStatistics();
          logger.debug('Got lexicon stats via direct method', { lexiconStats });
        } catch (e2: any) {
          if (e2?.resultCode === 7) { // SQLITE_NOMEM
            logger.warn('SQLITE_NOMEM during lexicon stats fetch, using minimal fallback');
            
            // Create minimal lexicon info - just check if lexicons table has data
            try {
              // Try to get basic lexicon info without expensive JOINs
              const basicLexicons = await wordnet.lexicons();
              if (basicLexicons && basicLexicons.length > 0) {
                lexiconStats = basicLexicons.map(l => ({
                  lexiconId: l.id,
                  label: l.label || l.id,
                  language: l.language || 'en',
                  version: l.version || 'unknown',
                  wordCount: 0, // We can't get these without expensive queries
                  synsetCount: 0
                }));
                logger.debug('Created minimal lexicon stats from lexicons()', { lexiconStats });
              }
            } catch (fallbackError: any) {
              logger.warn('All fallback approaches failed', { error: fallbackError });
            }
          } else {
            logger.warn('Failed to get lexicon stats via direct method', { error: e2 });
          }
        }
      }
      
      // Only try to get general statistics if it's not too expensive
      try {
        logger.debug('Getting statistics from worker');
        statistics = await wordnet.getStatistics();
        logger.debug('Statistics from worker', statistics);
      } catch (e: any) {
        if (e?.resultCode === 7) { // SQLITE_NOMEM
          logger.warn('SQLITE_NOMEM during status statistics fetch, skipping', { error: e });
        } else {
          logger.warn('Failed to get statistics during status check', e);
        }
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
  
  if (!wordnet) {
    return { success: false, error: "WordNet not initialized" };
  }

  const results: any = {};
  
  try {
    // Test 1: Simple lexicons query
    logger.debug('Test 1: Simple lexicons query');
    try {
      const lexicons = await wordnet.lexicons();
      results.lexicons = { success: true, count: lexicons.length, data: lexicons };
      logger.debug('Lexicons query successful', { count: lexicons.length });
    } catch (e: any) {
      results.lexicons = { success: false, error: e.message, code: e.resultCode };
      logger.warn('Lexicons query failed', { error: e });
    }

    // Test 2: Try to get basic lexicon info
    logger.debug('Test 2: Basic lexicon info via public methods');
    try {
      // Try to get basic info without expensive operations
      const basicLexicons = await wordnet.lexicons();
      if (basicLexicons && basicLexicons.length > 0) {
        results.basicInfo = { 
          success: true, 
          count: basicLexicons.length, 
          data: basicLexicons.map(l => ({ id: l.id, label: l.label, language: l.language, version: l.version }))
        };
        logger.debug('Basic lexicon info successful', { count: basicLexicons.length });
      } else {
        results.basicInfo = { success: true, count: 0, data: [] };
      }
    } catch (e: any) {
      results.basicInfo = { success: false, error: e.message, code: e.resultCode };
      logger.warn('Basic lexicon info failed', { error: e });
    }

    // Test 3: Try the expensive method with error handling
    logger.debug('Test 3: Expensive getLexiconStatistics method');
    try {
      const expensiveResult = await wordnet.getLexiconStatistics();
      results.expensiveQuery = { success: true, count: expensiveResult.length, data: expensiveResult };
      logger.debug('Expensive query successful', { count: expensiveResult.length });
    } catch (e: any) {
      results.expensiveQuery = { success: false, error: e.message, code: e.resultCode };
      logger.warn('Expensive query failed', { error: e });
    }

    return { success: true, data: results };
  } catch (error: any) {
    logger.error('Memory test failed', { error });
    return { success: false, error: error.message };
  }
}

export async function hasLoadedData(packageId?: string) {
  try {
    if (!wordnet) {
      return { success: false, error: "WordNet not initialized" };
    }

    // Lightweight check for loaded data
    try {
      const lexiconStats = await wordnet.getLexiconStatistics();
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
    if (!dataLoader) {
      return { success: false, error: "DataLoader not initialized" };
    }

    if (!wordnet) {
      return { success: false, error: "WordNet not initialized" };
    }

    logger.start('loading package from data');
    logger.step('loading data into database', { packageId, bytes: data.byteLength });
    
    // Load the data directly into the database
    await dataLoader.loadDbFromBuffer(data, packageId);

    // Get updated statistics after successful load
    logger.step('fetching updated statistics');
    const stats = await wordnet.getStatistics();
    const posDistribution = await wordnet.getPartOfSpeechDistribution();
    const lexiconStats = await wordnet.getLexiconStatistics();

    logger.success('Package loaded successfully from data');
    logger.end('loading package from data', { 
      packageId,
      statistics: !!stats,
      posDistribution: !!posDistribution,
      lexiconStats: !!lexiconStats
    });

    return {
      success: true,
      data: {
        statistics: stats,
        posDistribution,
        lexiconStats,
      },
    };
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
    if (!dataLoader) {
      return { success: false, error: "DataLoader not initialized" };
    }

    if (!wordnet) {
      return { success: false, error: "WordNet not initialized" };
    }

    logger.start('loading package');
    logger.step('getting project URLs', { packageId });
    
    // Try to get project URLs and attempt proxy downloads first
    try {
      const { Project } = await import('wn-ts-web');
      const project = Project.from(packageId);
      const urls = project.getUrls();
      
      if (urls && urls.length > 0) {
        logger.step('attempting proxy downloads', { urlCount: urls.length });
        
        // Try each URL with proxy first
        for (const url of urls) {
          try {
            // Convert external URL to proxy URL
            let proxyUrl: string;
            if (url.includes('en-word.net')) {
              proxyUrl = `/api/en-word-net/static/english-wordnet-2024.xml.gz`;
            } else if (url.includes('github.com/globalwordnet')) {
              proxyUrl = `/api/globalwordnet/english-wordnet/releases/download/2024-edition/english-wordnet-2024.xml.gz`;
            } else {
              // Generic proxy for other URLs
              proxyUrl = `/api/external/${encodeURIComponent(url)}`;
            }
            
            logger.step('trying proxy URL', { proxyUrl });
            
            // Attempt to download from proxy URL
            const response = await fetch(proxyUrl);
            if (!response.ok) {
              throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            const data = await response.arrayBuffer();
            if (data.byteLength === 0) {
              throw new Error('Empty response');
            }
            
            logger.success('Downloaded from proxy', { bytes: data.byteLength });
            
            // Load the downloaded data directly (supports gz/xz/XML)
            logger.step('loading data into database');
            await dataLoader.loadFromBuffer(data, packageId);
            logger.success('Package loaded successfully (skipping stats in worker)');
            logger.end('loading package', { 
              source: 'proxy',
              packageId,
              bytes: data.byteLength
            });
            return { success: true };
          } catch (error) {
            logger.warn('Failed to download from proxy', { url, error: error instanceof Error ? error.message : String(error) });
            continue; // Try next URL
          }
        }
        
        logger.warn('All proxy URLs failed, falling back to original method');
      }
    } catch (error) {
      logger.warn('Failed to get project URLs, using original method', { error: error instanceof Error ? error.message : String(error) });
    }
    
    // Fall back to original method (will likely fail due to CORS, but that's expected)
    logger.step('using original downloadAndLoad method (may fail due to CORS)');
    await dataLoader.downloadAndLoad(packageId);

    // Get updated statistics after successful load
    logger.step('fetching updated statistics');
    const stats = await wordnet.getStatistics();
    const posDistribution = await wordnet.getPartOfSpeechDistribution();
    const lexiconStats = await wordnet.getLexiconStatistics();

    logger.success('Package loaded successfully via original method');
    logger.end('loading package', { 
      source: 'original',
      packageId,
      statistics: !!stats,
      posDistribution: !!posDistribution,
      lexiconStats: !!lexiconStats
    });

    return {
      success: true,
      data: {
        statistics: stats,
        posDistribution,
        lexiconStats,
      },
    };
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
    if (!dataLoader) {
      return { success: false, error: "DataLoader not initialized" };
    }

    if (!wordnet) {
      return { success: false, error: "WordNet not initialized" };
    }

    logger.start('loading demo data');
    logger.step('attempting proxy downloads for demo data');
    
    // Try proxy URLs first for demo data
    try {
      const proxyUrls = [
        `/api/en-word-net/static/english-wordnet-2024.xml.gz`,
        `/api/globalwordnet/english-wordnet/releases/download/2024-edition/english-wordnet-2024.xml.gz`
      ];
      
      logger.step('attempting proxy downloads for demo data');
      
      // Try each proxy URL
      for (const proxyUrl of proxyUrls) {
        try {
          logger.step('trying proxy URL', { proxyUrl });
          
          // Attempt to download from proxy URL
          const response = await fetch(proxyUrl);
          if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
          }
          
          const data = await response.arrayBuffer();
          if (data.byteLength === 0) {
            throw new Error('Empty response');
          }
          
          logger.success('Downloaded from proxy', { bytes: data.byteLength });
          
          // Load the downloaded data directly (supports gz/xz/XML)
          logger.step('loading data into database');
          await dataLoader.loadFromBuffer(data, 'oewn:2024');
          logger.success('Demo data loaded successfully (skipping stats in worker)');
          logger.end('loading demo data', { 
            source: 'proxy',
            packageId: 'oewn:2024',
            bytes: data.byteLength
          });
          return { success: true };
        } catch (error) {
          logger.warn('Failed to download from proxy', { proxyUrl, error: error instanceof Error ? error.message : String(error) });
          continue; // Try next URL
        }
      }
      
      logger.warn('All proxy URLs failed, falling back to original method');
    } catch (error) {
      logger.warn('Failed to try proxy URLs, using original method', { error: error instanceof Error ? error.message : String(error) });
    }
    
    // Fall back to original method (will likely fail due to CORS, but that's expected)
    logger.step('using original downloadAndLoad method (may fail due to CORS)');
    await dataLoader.downloadAndLoad('oewn:2024');

    // Get updated statistics after successful load
    logger.step('fetching updated statistics');
    const stats = await wordnet.getStatistics();
    const posDistribution = await wordnet.getPartOfSpeechDistribution();
    const lexiconStats = await wordnet.getLexiconStatistics();

    logger.success('Demo data loaded successfully via original method');
    logger.end('loading demo data', { 
      source: 'original',
      packageId: 'oewn:2024',
      statistics: !!stats,
      posDistribution: !!posDistribution,
      lexiconStats: !!lexiconStats
    });

    return {
      success: true,
      data: {
        statistics: stats,
        posDistribution,
        lexiconStats,
      },
    };
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
    if (!wordnet) {
      return { success: false, error: "WordNet not initialized" };
    }

    logger.start('getting statistics');
    const stats = await wordnet.getStatistics();
    const posDistribution = await wordnet.getPartOfSpeechDistribution();
    const lexiconStats = await wordnet.getLexiconStatistics();

    logger.success('Statistics fetched successfully');
    logger.end('getting statistics', { 
      statistics: !!stats,
      posDistribution: !!posDistribution,
      lexiconStats: !!lexiconStats
    });

    return {
      success: true,
      data: {
        statistics: stats,
        posDistribution,
        lexiconStats,
      },
    };
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
    if (!wordnet) {
      return { success: false, error: "WordNet not initialized" };
    }

    logger.start('querying words');
    logger.step('querying words', { term });
    // TODO: not sure if should use words or searchWords
    const results = await wordnet.words(term);

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
    if (!wordnet) {
      return { success: false, error: "WordNet not initialized" };
    }

    if (!wordnet) {
      return { success: false, error: "WordNet not initialized" };
    }

    logger.start('querying synsets');
    logger.step('querying synsets', { term });
    const results = await wordnet.synsets(term);

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
    
    if (wordnet) {
      try {
        await wordnet.close();
        logger.debug('WordNet instance closed');
      } catch (e) {
        logger.warn('Error closing WordNet instance', { error: e });
      }
      wordnet = null;
    }
    
    if (dataLoader) {
      try {
        // Clear any cached data
        await dataLoader.clearAllData();
        logger.debug('DataLoader cleared');
      } catch (e) {
        logger.warn('Error clearing DataLoader', { error: e });
      }
      dataLoader = null;
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
    
    // Use the dispose helper to properly clean up everything
    await disposeWordNet();

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
