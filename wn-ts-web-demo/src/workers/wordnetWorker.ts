/**
 * Web Worker for handling heavy WordNet operations using Comlink
 * Prevents the main thread from freezing during database operations
 */

import { createWordNetInstance, DataLoader, WebWordnet } from "wn-ts-web";
import { createScopedLogger } from '../logger'

let wordnet: WebWordnet | null = null;
let dataLoader: DataLoader | null = null;
const logger = createScopedLogger('wordnet-worker')

// Expose the worker API using Comlink
export async function initializeWordNet() {
  try {
    logger.start('WordNet initialization');
    logger.step('calling createWordNetInstance');

    const instance = await createWordNetInstance();
    wordnet = instance.wordnet;
    dataLoader = instance.dataLoader;

    logger.success('WordNet instance created successfully');
    logger.end('WordNet initialization', { 
      wordnet: !!wordnet, 
      dataLoader: !!dataLoader 
    });

    return { success: true };
  } catch (error) {
    logger.fail('Error initializing WordNet', error);
    logger.end('WordNet initialization');
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
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
