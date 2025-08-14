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
const logger = createScopedLogger('wordnet-worker')

// Expose the worker API using Comlink
export async function initializeWordNet() {
  try {
    logger.info('Starting: WordNet initialization');
    
    // Create WordNet instance
    const instance = await createWordNetInstance();
    if (instance.wordnet && instance.dataLoader) {
      wordnet = instance.wordnet;
      dataLoader = instance.dataLoader;
      
      logger.info('WordNet instance created successfully');
      
      // Don't try to get expensive statistics during initialization
      // Just return success and let the main thread check status when needed
      return { 
        success: true, 
        data: { 
          lexiconStats: null, 
          statistics: null,
          // We don't have initial state yet, but the worker is ready
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
  try {
    if (!wordnet) {
      return { success: false, error: "WordNet not initialized" };
    }

    // Lightweight status check - only get what's already cached/available
    let lexiconStats = null;
    let statistics = null;
    
    try {
      // Get lexicon stats (usually lightweight)
      lexiconStats = await wordnet.getLexiconStatistics();
      
      // Only try to get general statistics if it's not too expensive
      try {
        statistics = await wordnet.getStatistics();
      } catch (e: any) {
        if (e?.resultCode === 7) { // SQLITE_NOMEM
          logger.warn('SQLITE_NOMEM during status statistics fetch, skipping', { error: e });
        } else {
          logger.warn('Failed to get statistics during status check', e);
        }
      }
    } catch (e: any) {
      if (e?.resultCode === 7) { // SQLITE_NOMEM
        logger.warn('SQLITE_NOMEM during status lexicon stats fetch');
      } else {
        logger.warn('Failed to get lexicon stats during status check', e);
      }
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

export async function clearData() {
  try {
    if (!dataLoader) {
      return { success: false, error: "DataLoader not initialized" };
    }

    logger.start('clearing all data');
    await dataLoader.clearAllData();

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
