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
// Optional: Comlink-backed worker (progressive adoption)
// import WorkerURL from '../workers/wordnetWorker.ts?worker&url'
// import { wrap } from 'comlink'
// type RemoteWordnetApi = ReturnType<typeof wrap<any>>
// let remote: RemoteWordnetApi | null = null



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
    try {
      const available = computeAvailablePackages();
      let loaded: string[] = [];
      if (state.wordnet) {
        try {
          const lexStats = await state.wordnet.getLexiconStatistics();
          loaded = (lexStats || []).map(ls => ls.lexiconId);
        } catch {
          // ignore if not available yet
        }
      }
      setState(prev => ({ ...prev, availablePackages: available, loadedPackages: loaded }));
    } catch (e) {
      // keep previous on failure
    }
  }, [state.wordnet]);

  // Initialize WordNet instance (run once on mount)
  useEffect(() => {
    const initializeWordNet = async () => {
      setState(prev => ({ ...prev, loading: true, isInitializing: true, progressStage: 'Loading SQLite WASM...' }));
      
      try {
        // Progressive: local path; can switch to worker path below
        const { wordnet, dataLoader } = await createWordNetInstance();
        
        setState(prev => ({ 
          ...prev, 
          wordnet, 
          dataLoader, 
          isInitializing: false,
          progressStage: 'Initializing cache...'
        }));
        // Worker path (future):
        // if (!remote) {
        //   const url = new URL('../workers/wordnetWorker.ts', import.meta.url) as unknown as string
        //   // @ts-ignore - vite-plugin-comlink URL syntax
        //   remote = wrap(new Worker(url, { type: 'module' }))
        //   const initState = await remote.init()
        //   // Map initState.available/loaded into our UI
        // }

        // Expose minimal demo API for tests and manual control
        try {
          if (typeof window !== 'undefined') {
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
                  const stats = await dataLoader.getStatistics()
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
                      source: 'Database'
                    },
                    loadedPackages: Array.from(new Set([...(prev.loadedPackages||[]), projectIdWithVersion])),
                    loading: false,
                    progressStage: 'Ready'
                  }))
                  
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
                  console.error('extendIndex failed', e);
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
          console.warn('Failed to attach __wnDemo API:', ex);
        }

        // Initialize cache
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
        await refreshPackages();

        console.log('✅ WordNet initialized successfully');
        console.log('📦 Cache status:', cacheStats);
        
      } catch (error) {
        console.error('❌ Failed to initialize WordNet:', error);
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

    setState(prev => ({ 
      ...prev, 
      loading: true, 
      progress: 0, 
      progressStage: `Checking cache for ${packageId}...` 
    }));

    try {
      // First, check if the package is cached
      if (cache.isPackageCached(packageId)) {
        console.log(`📦 Loading ${packageId} from cache...`);
        setState(prev => ({ ...prev, progressStage: `Loading ${packageId} from cache...` }));
        
        const cachedData = await cache.loadFromCache(packageId, (p) => {
          setState(prev => ({ ...prev, progress: p }));
          progress?.(p);
        });
        
        if (cachedData && cachedData.byteLength >= 100) {
          // Load the cached database
          await state.dataLoader.loadDbFromBuffer(cachedData, packageId);
          console.log(`✅ Loaded ${packageId} from cache successfully`);
        } else {
          console.warn(`⚠️ Cache entry for ${packageId} is invalid or empty (${cachedData?.byteLength ?? 0} bytes). Falling back to download.`);
          try { await cache.removeFromCache(packageId); } catch {}
          throw new Error('Failed to load from cache');
        }
      } else {
        console.log(`📥 Downloading ${packageId} from server...`);
        setState(prev => ({ ...prev, progressStage: `Downloading ${packageId}...` }));
        
        // Yield to UI
        await Promise.resolve();
        
        // Download and load the package
        const dlStarted = performance.now();
        await state.dataLoader.downloadAndLoad(packageId, {
          progress: (p: number) => {
            setState(prev => ({ ...prev, progress: p }));
            progress?.(p);
          }
        });
        const dlMs = performance.now() - dlStarted;
        console.log(`⏱️ Download+Load ${packageId} took ${dlMs.toFixed(1)}ms`);
      }

      setState(prev => ({
        ...prev,
        loading: false,
        progress: 1,
        progressStage: 'Complete',
        loadedPackages: [...new Set([...prev.loadedPackages, packageId])],
      }));

      // Update statistics
      const stats = await state.dataLoader.getStatistics();
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
        source: 'Database'
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
      await loadPackageData('oewn:2024', progress);
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
    return await state.wordnet.words(term);
  }, [state.wordnet]);

  // Query synsets
  const querySynsets = useCallback(async (term: string) => {
    if (!state.wordnet) {
      throw new Error('WordNet not initialized');
    }
    return await state.wordnet.synsets(term);
  }, [state.wordnet]);

  // Unload data
  const unloadData = useCallback(async () => {
    if (!state.dataLoader) {
      return;
    }
    try {
      setState(prev => ({ ...prev, loading: true }));
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

// NOTE: For best UX, heavy operations should run in a worker via Comlink.
// This hook currently uses direct wn-ts-web instance but can be switched
// to a Comlink worker-backed client without changing component APIs.
