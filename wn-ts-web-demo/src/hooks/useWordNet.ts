import { useState, useEffect, useCallback } from 'react';
import { 
  createWordNetInstance, 
  WebWordnet, 
  DataLoader, 
  extendProjectIndex, 
  extendProjectIndexFromUrl, 
  clearCustomProjectIndex, 
  getAvailableProjects
} from 'wn-ts-web';
import { useWordNetCache } from './useWordNetCache';
// Comlink-backed worker for heavy operations
import type { Remote } from 'comlink';
import { createScopedLogger } from '../logger';

// Worker API interface
interface WordNetWorkerAPI {
  initializeWordNet(): Promise<{ success: boolean; error?: string }>;
  loadPackage(packageId: string): Promise<{ success: boolean; data?: any; error?: string }>;

  loadDemoData(): Promise<{ success: boolean; data?: any; error?: string }>;
  getStatistics(): Promise<{ success: boolean; data?: any; error?: string }>;
  queryWords(term: string): Promise<{ success: boolean; data?: any; error?: string }>;
  querySynsets(term: string): Promise<{ success: boolean; data?: any; error?: string }>;
  clearData(): Promise<{ success: boolean; error?: string }>;
}

let remote: Remote<WordNetWorkerAPI> | null = null;



export interface WordNetState {
  wordnet: WebWordnet | null;
  dataLoader: DataLoader | null;
  loading: boolean;
  isInitializing: boolean;
  error: string | null;
  statistics: Record<string, unknown> | undefined;
  integrity: {
    isValid: boolean;
    checksum?: string;
    fileSize: number;
    compressionType?: string;
    format: string;
    errors: string[];
    warnings: string[];
    qualityScore: number;
  } | null;
  dataSource: {
    id: string;
    name: string;
    version: string;
    url: string;
    description: string;
    lastChecked: string;
    status: 'available' | 'unavailable' | 'error';
  } | null;
  availablePackages: Array<{
    id: string;
    label: string;
    language: string;
    version: string;
  }>;
  loadedPackages: string[];
  progress: number;
  progressStage: string;
  cacheInfo: {
    isSupported: boolean;
    totalFiles: number;
    totalSizeMB: number;
    availableSpaceMB: number;
  };
}

export interface ProgressCallback {
  (progress: number): void;
}

export function useWordNet(): WordNetState & {
  loadPackageData: (packageId: string, progress?: ProgressCallback) => Promise<void>;
  loadDemoData: (progress?: ProgressCallback) => Promise<void>;
  queryWords: (term: string) => Promise<unknown[]>;
  querySynsets: (term: string) => Promise<unknown[]>;
  unloadData: () => Promise<void>;
  clearCacheAndUnload: () => Promise<void>;
  getCacheInfo: () => Promise<Record<string, unknown>>;
  clearCache: () => Promise<boolean>;
  removeFromCache: (packageId: string) => Promise<boolean>;
  refreshPackages: () => Promise<void>;
} {
  const cache = useWordNetCache();
  const logger = createScopedLogger('useWordNet');
  
  
  
  const [state, setState] = useState<WordNetState>({
    wordnet: null,
    dataLoader: null,
    loading: false, // Start with no loading
    isInitializing: true,
    error: null,
    statistics: undefined,
    integrity: null,
    dataSource: null,
    availablePackages: [],
    loadedPackages: [],
    progress: 0,
    progressStage: 'Ready - No packages loaded', // Clear message that no packages are loaded
    cacheInfo: {
      isSupported: false,
      totalFiles: 0,
      totalSizeMB: 0,
      availableSpaceMB: 0
    }
  });

  const computeAvailablePackages = () => {
    try {
      const projects = getAvailableProjects();
      const flat = projects.flatMap(p => p.versions.map(v => ({
        id: `${p.id}:${v}`,
        label: p.label,
        language: p.language || 'unknown',
        version: v
      })));
      return flat;
    } catch {
      // Fallback to a minimal list if index isn't available
      return [
        { id: 'oewn:2024', label: 'Open English WordNet', language: 'en', version: '2024' },
        { id: 'cili:1.0', label: 'Collaborative Interlingual Index', language: 'interlingual', version: '1.0' },
      ];
    }
  };

  const refreshPackages = useCallback(async () => {
    logger.start('refreshing packages');
    logger.step('computing available packages');
    
    try {
      const available = computeAvailablePackages();
      let loaded: string[] = [];
      let statistics = undefined;
      
      if (state.wordnet) {
        try {
          logger.step('getting lexicon statistics');
          const lexStats = await state.wordnet.getLexiconStatistics();
          loaded = (lexStats || []).map(ls => ls.lexiconId);
          
          // If we have loaded packages, refresh the statistics
          if (loaded.length > 0 && state.dataLoader) {
            try {
              logger.step('refreshing database statistics');
              const stats = await state.dataLoader.getStatistics();
              let posDistribution = undefined;
              
              // Try to get part of speech distribution if wordnet is available
              if (state.wordnet) {
                try {
                  posDistribution = await state.wordnet.getPartOfSpeechDistribution();
                } catch (e) {
                  logger.warn('Failed to get POS distribution', { error: e });
                }
              }
              
              statistics = {
                totalWords: stats.totalWords,
                totalSynsets: stats.totalSynsets,
                totalSenses: stats.totalSenses,
                totalRelations: 0,
                totalDefinitions: 0,
                languages: ['en'],
                partsOfSpeech: ['n', 'v', 'a', 'r'],
                dataSize: stats.totalWords * 100 + stats.totalSynsets * 200,
                lastUpdated: new Date().toISOString(),
                source: 'Database',
                posDistribution
              };
            } catch (e) {
              logger.warn('Failed to refresh statistics', { error: e });
            }
          }
        } catch {
          // ignore if not available yet
        }
      }
      
      logger.step('updating state with package information');
      setState(prev => ({ 
        ...prev, 
        availablePackages: available, 
        loadedPackages: loaded,
        statistics: statistics || prev.statistics
      }));
      
      logger.success('Packages refreshed successfully');
      logger.end('refreshing packages', { 
        availableCount: available.length, 
        loadedCount: loaded.length,
        hasStatistics: !!statistics
      });
    } catch (e) {
      logger.fail('Failed to refresh packages', e);
      logger.end('refreshing packages');
      // keep previous on failure
    }
  }, [state.wordnet, state.dataLoader]);

  // Initialize WordNet instance (run once on mount)
  useEffect(() => {
    const initializeWordNet = async () => {
      logger.start('WordNet initialization');
      logger.step('setting initial state');
      
      setState(prev => ({ ...prev, loading: true, isInitializing: true, progressStage: 'Loading SQLite WASM...' }));
      
      try {
        // Initialize Comlink worker for heavy operations
        if (!remote) {
          try {
            logger.step('initializing Comlink worker');
            remote = new ComlinkWorker<typeof import('../workers/wordnetWorker')>(new URL('../workers/wordnetWorker.ts', import.meta.url));
            
            logger.success('Comlink worker initialized');
          } catch (error) {
            logger.warn('Failed to initialize Comlink worker, falling back to main thread', { error });
          }
        }

        // Try to use worker first, fall back to main thread
        let wordnet: WebWordnet | null = null;
        let dataLoader: DataLoader | null = null;

        if (remote) {
          try {
            logger.step('using Comlink worker for initialization');
            const result = await remote.initializeWordNet();
            if (result.success) {
              logger.success('Worker initialization successful');
              // For now, still create main thread instance for compatibility
              logger.step('creating main thread instance for compatibility');
              const instance = await createWordNetInstance();
              wordnet = instance.wordnet;
              dataLoader = instance.dataLoader;
            } else {
              logger.warn('Worker initialization failed, using main thread', { error: result.error });
              logger.step('creating main thread instance as fallback');
              const instance = await createWordNetInstance();
              wordnet = instance.wordnet;
              dataLoader = instance.dataLoader;
            }
          } catch (error) {
            logger.warn('Worker error, falling back to main thread', { error });
            logger.step('creating main thread instance as fallback');
            const instance = await createWordNetInstance();
            wordnet = instance.wordnet;
            dataLoader = instance.dataLoader;
          }
        } else {
          logger.step('using main thread for initialization');
          const instance = await createWordNetInstance();
          wordnet = instance.wordnet;
          dataLoader = instance.dataLoader;
        }
        
        logger.step('updating state with initialized instances');
        setState(prev => ({ 
          ...prev, 
          wordnet, 
          dataLoader, 
          isInitializing: false,
          progressStage: 'Initializing cache...'
        }));

        // Expose minimal demo API for tests and manual control
        try {
          if (typeof window !== 'undefined') {
            logger.step('attaching demo API to window');
            // @ts-expect-error attach demo API for manual/e2e usage
            window.__wnDemo = {
              loadProject: async (projectIdWithVersion: string) => {
                try {
                  setState(prev => ({ ...prev, loading: true, progressStage: `Loading ${projectIdWithVersion}...` }))
                  await dataLoader.downloadAndLoad(projectIdWithVersion, {
                    progress: (p: number) => {
                      setState(prev => ({ ...prev, progress: p }))
                    }
                  })
                  // Update statistics asynchronously to avoid blocking UI
                  setState(prev => ({ 
                    ...prev, 
                    progressStage: 'Updating statistics...',
                    progress: 0.95
                  }));
                  
                  try {
                  const stats = await dataLoader.getStatistics()
                    let posDistribution = undefined;
                    
                    // Try to get part of speech distribution if wordnet is available
                    if (state.wordnet) {
                      try {
                        posDistribution = await state.wordnet.getPartOfSpeechDistribution();
                      } catch (e) {
                        logger.warn('Failed to get POS distribution', { error: e });
                      }
                    }
                    
                  setState(prev => ({
                    ...prev,
                    statistics: {
                      totalWords: stats.totalWords,
                      totalSynsets: stats.totalSynsets,
                      totalSenses: stats.totalSenses,
                      totalRelations: 0,
                      totalDefinitions: 0,
                      languages: ['th','en'],
                      partsOfSpeech: ['n','v','a','r'],
                      dataSize: stats.totalWords * 100 + stats.totalSynsets * 200,
                      lastUpdated: new Date().toISOString(),
                        source: 'Database',
                        posDistribution
                    },
                    loadedPackages: Array.from(new Set([...(prev.loadedPackages||[]), projectIdWithVersion])),
                    loading: false,
                    progressStage: 'Ready'
                  }))
                  } catch (e) {
                    logger.warn('Failed to update statistics', { error: e });
                    // Continue without statistics rather than failing completely
                    setState(prev => ({
                      ...prev,
                      loadedPackages: Array.from(new Set([...(prev.loadedPackages||[]), projectIdWithVersion])),
                      loading: false,
                      progressStage: 'Ready'
                    }));
                  }
                  
                  return true
                } catch (e: unknown) {
                  setState(prev => ({ ...prev, error: e instanceof Error ? e.message : String(e), loading: false }))
                  return false
                }
              },
              extendIndex: (indexLike: Record<string, unknown>) => {
                try {
                  extendProjectIndex(indexLike);
                  return true;
                } catch (e: unknown) {
                  logger.error('extendIndex failed', { error: e });
                  return false;
                }
              },
              extendIndexFromUrl: async (url: string) => {
                await extendProjectIndexFromUrl(url);
                return true;
              },
              clearIndex: () => {
                clearCustomProjectIndex();
                return true;
              },
              clear: async () => {
                try {
                  await dataLoader.clearAllData()
                  setState(prev => ({ ...prev, loadedPackages: [], statistics: undefined }))
                  return true
                } catch {
                  return false
                }
              }
            }
          }
        } catch (ex) {
          logger.warn('Failed to attach __wnDemo API', { error: ex });
        }

        // Initialize cache
        logger.step('initializing cache');
        await cache.checkOPFSSupport();
        const cacheStats = cache.getCacheStats();
        
        setState(prev => ({ 
          ...prev, 
          cacheInfo: cacheStats,
          progressStage: 'Ready',
          loading: false,
          progress: 0,
        }));

        // Populate available and loaded packages
        logger.step('populating available and loaded packages');
        await refreshPackages();

        logger.success('WordNet initialized successfully');
        logger.end('WordNet initialization', { 
          hasWorker: !!remote,
          hasWordNet: !!wordnet,
          hasDataLoader: !!dataLoader,
          cacheStatus: cacheStats
        });
        
      } catch (error) {
        logger.fail('Failed to initialize WordNet', error);
        logger.end('WordNet initialization');
        setState(prev => ({ 
          ...prev, 
          error: error instanceof Error ? error.message : 'Unknown error',
          isInitializing: false,
          progressStage: 'Initialization failed',
          loading: false,
        }));
      }
    };

    initializeWordNet();
    // Intentionally run once; cache methods are stable via useCallback
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);



  // Load package data with caching
  const loadPackageData = useCallback(async (packageId: string, progress?: ProgressCallback) => {
    if (!state.dataLoader) {
      throw new Error('DataLoader not initialized');
    }

    logger.start(`loading package ${packageId}`);
    logger.step('checking cache status', { packageId });

    setState(prev => ({ 
      ...prev, 
      loading: true, 
      progress: 0, 
      progressStage: `Checking cache for ${packageId}...` 
    }));

    try {
      // First, check if the package is cached
      if (cache.isPackageCached(packageId)) {
        logger.step('loading from cache', { packageId });
        setState(prev => ({ ...prev, progressStage: `Loading ${packageId} from cache...` }));
        
        const cachedData = await cache.loadFromCache(packageId, (p) => {
          setState(prev => ({ ...prev, progress: p }));
          progress?.(p);
        });
        
        if (cachedData && cachedData.byteLength >= 100) {
          // Load the cached database
          logger.step('loading database from cached buffer', { 
            packageId, 
            bufferSize: cachedData.byteLength 
          });
          await state.dataLoader.loadDbFromBuffer(cachedData, packageId);
          logger.success(`Loaded ${packageId} from cache successfully`);
          logger.end(`loading package ${packageId}`, { 
            source: 'cache', 
            bufferSize: cachedData.byteLength 
          });
        } else {
          logger.warn(`Cache entry for ${packageId} is invalid or empty`, { 
            packageId, 
            bufferSize: cachedData?.byteLength ?? 0 
          });
          try { await cache.removeFromCache(packageId); } catch {}
          throw new Error('Failed to load from cache');
        }
      } else {
        logger.step('downloading from server', { packageId });
        setState(prev => ({ ...prev, progressStage: `Downloading ${packageId}...` }));
        
        // Try to use Comlink worker for heavy operations
        if (remote) {
          try {
            logger.step('using Comlink worker for package loading', { packageId });
            const result = await remote.loadPackage(packageId);
            if (result.success) {
              logger.success('Worker package loading successful');
              logger.end(`loading package ${packageId}`, { 
                source: 'worker', 
                method: 'comlink' 
              });
              // No redundant main-thread reload here
            } else {
              logger.warn('Worker package loading failed, using main thread', { 
                packageId, 
                error: result.error 
              });
              if (!state.dataLoader) throw new Error('DataLoader not initialized');
              await state.dataLoader.downloadAndLoad(packageId, {
                progress: (p: number) => {
                  setState(prev => ({ ...prev, progress: p }));
                  progress?.(p);
                }
              });
              logger.end(`loading package ${packageId}`, { 
                source: 'main-thread', 
                method: 'fallback' 
              });
            }
          } catch (error) {
            logger.warn('Worker error, falling back to main thread', { 
              packageId, 
              error: error instanceof Error ? error.message : String(error) 
            });
            if (!state.dataLoader) throw new Error('DataLoader not initialized');
            await state.dataLoader.downloadAndLoad(packageId, {
              progress: (p: number) => {
                setState(prev => ({ ...prev, progress: p }));
                progress?.(p);
              }
            });
            logger.end(`loading package ${packageId}`, { 
              source: 'main-thread', 
              method: 'fallback-error' 
            });
          }
        } else {
          logger.step('using main thread for package loading', { packageId });
          if (!state.dataLoader) throw new Error('DataLoader not initialized');
          await state.dataLoader.downloadAndLoad(packageId, {
            progress: (p: number) => {
              setState(prev => ({ ...prev, progress: p }));
              progress?.(p);
            }
          });
          logger.end(`loading package ${packageId}`, { 
            source: 'main-thread', 
            method: 'direct' 
          });
        }
      }

      setState(prev => ({
        ...prev,
        loading: false,
        progress: 1,
        progressStage: 'Complete',
        loadedPackages: [...new Set([...prev.loadedPackages, packageId])],
      }));

      // Update statistics asynchronously to avoid blocking UI
      logger.step('updating statistics', { packageId });
      setState(prev => ({ 
        ...prev, 
        progressStage: 'Updating statistics...',
        progress: 0.95
      }));
      
      try {
        const stats = await state.dataLoader.getStatistics();
        let posDistribution = undefined;
        
        // Try to get part of speech distribution if wordnet is available
        if (state.wordnet) {
          try {
            posDistribution = await state.wordnet.getPartOfSpeechDistribution();
          } catch (e) {
            logger.warn('Failed to get POS distribution', { error: e });
          }
        }
        
        const uiStatistics = {
          totalWords: stats.totalWords,
          totalSynsets: stats.totalSynsets,
          totalSenses: stats.totalSenses,
          totalRelations: 0,
          totalDefinitions: 0,
          languages: ['en'],
          partsOfSpeech: ['n', 'v', 'a', 'r'],
          dataSize: stats.totalWords * 100 + stats.totalSynsets * 200,
          lastUpdated: new Date().toISOString(),
            source: 'Database',
            posDistribution
        };
        
      setState(prev => ({ 
        ...prev, 
        statistics: uiStatistics,
        integrity: null,
        dataSource: {
          id: packageId,
          name: packageId,
          version: 'N/A',
          url: 'N/A',
          description: `Loaded package: ${packageId}`,
          lastChecked: new Date().toISOString(),
          status: 'available'
        }
      }));
      } catch (e) {
        console.warn('Failed to update statistics:', e);
        // Continue without statistics rather than failing completely
      }

    } catch (error) {
      console.error('Failed to load package:', error);
      setState(prev => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        progressStage: 'Failed to load package'
      }));
    }
  }, [state.dataLoader, cache]);

  // Load demo data with caching
  const loadDemoData = useCallback(async (progress?: ProgressCallback) => {
    if (!state.dataLoader) {
      throw new Error('DataLoader not initialized');
    }

    console.log('🚀 Starting demo data load...');
    setState(prev => ({ 
      ...prev, 
      loading: true, 
      progress: 0, 
      progressStage: 'Loading demo data...' 
    }));

    try {
      console.log('📦 Attempting to load oewn:2024...');
      
      // Try to use Comlink worker for demo data loading
      if (remote) {
        try {
          console.log('🔧 Using Comlink worker for demo data loading...');
          const result = await remote.loadDemoData();
          if (result.success) {
            console.log('✅ Worker demo data loading successful');
            // Still need to load the database into main thread for queries
            await loadPackageData('oewn:2024', progress);
          } else {
            console.warn('⚠️ Worker demo data loading failed, using main thread:', result.error);
            await loadPackageData('oewn:2024', progress);
          }
        } catch (error) {
          console.warn('⚠️ Worker error, falling back to main thread:', error);
          await loadPackageData('oewn:2024', progress);
        }
      } else {
        console.log('🔧 Using main thread for demo data loading...');
      await loadPackageData('oewn:2024', progress);
      }
      
      console.log('✅ Demo data loaded successfully');
    } catch (error) {
      console.error('❌ Failed to load demo data:', error);
      setState(prev => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        progressStage: 'Failed to load demo data'
      }));
    }
  }, [state.dataLoader, loadPackageData]);

  // Query words
  const queryWords = useCallback(async (term: string) => {
    if (!state.wordnet) {
      throw new Error('WordNet not initialized');
    }
    
    // Try to use Comlink worker for queries
    if (remote) {
      try {
        const result = await remote.queryWords(term);
        if (result.success) {
          return result.data;
        } else {
          console.warn('⚠️ Worker query failed, using main thread:', result.error);
        }
      } catch (error) {
        console.warn('⚠️ Worker error, falling back to main thread:', error);
      }
    }
    
    // Fall back to main thread
    return await state.wordnet.words(term);
  }, [state.wordnet]);

  // Query synsets
  const querySynsets = useCallback(async (term: string) => {
    if (!state.wordnet) {
      throw new Error('WordNet not initialized');
    }
    
    // Try to use Comlink worker for queries
    if (remote) {
      try {
        const result = await remote.querySynsets(term);
        if (result.success) {
          return result.data;
        } else {
          console.warn('⚠️ Worker query failed, using main thread:', result.error);
        }
      } catch (error) {
        console.warn('⚠️ Worker error, falling back to main thread:', error);
      }
    }
    
    // Fall back to main thread
    return await state.wordnet.synsets(term);
  }, [state.wordnet]);

  // Unload data
  const unloadData = useCallback(async () => {
    if (!state.dataLoader) {
      return;
    }
    try {
      setState(prev => ({ ...prev, loading: true }));
      
      // Try to use Comlink worker for clearing data
      if (remote) {
        try {
          const result = await remote.clearData();
          if (result.success) {
            console.log('✅ Worker data clearing successful');
          } else {
            console.warn('⚠️ Worker data clearing failed, using main thread:', result.error);
          }
        } catch (error) {
          console.warn('⚠️ Worker error, falling back to main thread:', error);
        }
      }
      
      // Always clear main thread data
      await state.dataLoader.clearAllData();
      setState(prev => ({
        ...prev,
        loadedPackages: [],
        statistics: undefined,
        integrity: null,
        dataSource: null,
        loading: false,
      }));
      
      console.log('✅ Data unloaded successfully');
    } catch (error) {
      console.error('❌ Failed to unload data:', error);
      setState(prev => ({ ...prev, loading: false }));
    }
  }, [state.dataLoader]);

  // Clear cache and unload
  const clearCacheAndUnload = useCallback(async () => {
    try {
      await unloadData();
      const success = await cache.clearCache();
      if (success) {
        console.log('✅ Cache cleared successfully');
        const cacheStats = cache.getCacheStats();
        setState(prev => ({ ...prev, cacheInfo: cacheStats }));
      }
    } catch (error) {
      console.error('❌ Failed to clear cache:', error);
    }
  }, [unloadData, cache]);

  // Get cache info
  const getCacheInfo = useCallback(async () => {
    return cache.getCacheStats();
  }, [cache]);

  // Clear cache
  const clearCache = useCallback(async () => {
    const success = await cache.clearCache();
    if (success) {
      const cacheStats = cache.getCacheStats();
      setState(prev => ({ ...prev, cacheInfo: cacheStats }));
    }
    return success;
  }, [cache]);

  // Remove from cache
  const removeFromCache = useCallback(async (packageId: string) => {
    const success = await cache.removeFromCache(packageId);
    if (success) {
      const cacheStats = cache.getCacheStats();
      setState(prev => ({ ...prev, cacheInfo: cacheStats }));
    }
    return success;
  }, [cache]);

  return {
    ...state,
    loadPackageData,
    loadDemoData,
    queryWords,
    querySynsets,
    unloadData,
    clearCacheAndUnload,
    getCacheInfo,
    clearCache,
    removeFromCache,
    refreshPackages,
  };
}

// NOTE: This hook now uses Comlink workers for heavy operations to prevent UI freezing.
// It automatically falls back to main thread operations if the worker fails.
// The worker handles: package loading, data processing, and heavy queries.
