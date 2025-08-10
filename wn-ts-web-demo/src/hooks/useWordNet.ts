import { useState, useEffect, useCallback, useRef } from 'react';
import { createWordNetInstance, WebWordnet, DataLoader, extendProjectIndex, extendProjectIndexFromUrl, clearCustomProjectIndex } from 'wn-ts-web';
import { useWordNetCache } from './useWordNetCache';

export interface WordNetState {
  wordnet: WebWordnet | null;
  dataLoader: DataLoader | null;
  loading: boolean;
  isInitializing: boolean;
  error: string | null;
  statistics: {
    totalWords: number;
    totalSynsets: number;
    totalSenses: number;
    totalRelations: number;
    totalDefinitions: number;
    languages: string[];
    partsOfSpeech: string[];
    dataSize: number;
    lastUpdated: string;
    source: string;
  } | null;
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
} {
  const cache = useWordNetCache();
  
  const [state, setState] = useState<WordNetState>({
    wordnet: null,
    dataLoader: null,
    loading: true,
    isInitializing: true,
    error: null,
    statistics: null,
    integrity: null,
    dataSource: null,
    availablePackages: [
      {
        id: 'oewn:2024',
        label: 'Open English WordNet',
        language: 'en',
        version: '2024'
      },
      {
        id: 'cili:1.0',
        label: 'Collaborative Interlingual Index',
        language: 'interlingual',
        version: '1.0'
      }
    ],
    loadedPackages: [],
    progress: 0,
    progressStage: 'Initializing...',
    cacheInfo: {
      isSupported: false,
      totalFiles: 0,
      totalSizeMB: 0,
      availableSpaceMB: 0
    }
  });

  // Ensure auto-load runs only once
  const hasAutoLoadedRef = useRef(false);

  // Initialize WordNet instance (run once on mount)
  useEffect(() => {
    const initializeWordNet = async () => {
      setState(prev => ({ ...prev, loading: true, isInitializing: true, progressStage: 'Loading SQLite WASM...' }));
      
      try {
        const { wordnet, dataLoader } = await createWordNetInstance();
        
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
              // Allow tests and manual usage to extend the project index at runtime
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
                  setState(prev => ({ ...prev, loadedPackages: [], statistics: null }))
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
          progressStage: 'Ready'
        }));

        console.log('✅ WordNet initialized successfully');
        console.log('📦 Cache status:', cacheStats);
        
      } catch (error) {
        console.error('❌ Failed to initialize WordNet:', error);
        setState(prev => ({ 
          ...prev, 
          error: error instanceof Error ? error.message : 'Unknown error',
          isInitializing: false,
          progressStage: 'Initialization failed'
        }));
      }
    };

    initializeWordNet();
    // Intentionally run once; cache methods are stable via useCallback
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Automatically load demo data on initialization
  useEffect(() => {
    if (
      state.dataLoader &&
      !state.isInitializing &&
      state.loadedPackages.length === 0 &&
      !hasAutoLoadedRef.current
    ) {
      hasAutoLoadedRef.current = true;
      console.log('🔄 Auto-load effect triggered');
      const loadInitialData = async () => {
        try {
          console.log('📊 Checking initial statistics...');
          const stats = await state.dataLoader!.getStatistics();
          console.log('📊 Initial stats:', stats);
          
          // Always load demo data to ensure it works
          console.log('📊 Loading demo data...');
          await loadDemoData();
          
          // Update statistics after loading
          const finalStats = await state.dataLoader!.getStatistics();
          console.log('📊 Final stats after loading:', finalStats);
          
          const uiStatistics = {
            totalWords: finalStats.totalWords,
            totalSynsets: finalStats.totalSynsets,
            totalSenses: finalStats.totalSenses,
            totalRelations: 0,
            totalDefinitions: 0,
            languages: ['en'],
            partsOfSpeech: ['n', 'v', 'a', 'r'],
            dataSize: finalStats.totalWords * 100 + finalStats.totalSynsets * 200,
            lastUpdated: new Date().toISOString(),
            source: 'Database'
          };
          
          setState(prev => ({ 
            ...prev, 
            statistics: uiStatistics,
            loadedPackages: ['oewn:2024'],
          }));
          
        } catch (error) {
          console.error("❌ Error checking initial stats, attempting to load demo data.", error);
          // If stats fails, it probably means the DB is empty. Load demo data.
          await loadDemoData();
        }
      };
      loadInitialData();
    }
  // Intentionally not including loadDemoData to avoid effect recreation; guarded by ref
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.dataLoader, state.isInitializing, state.loadedPackages.length]);

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
        
        if (cachedData) {
          // Load the cached database
          await state.dataLoader.loadDbFromBuffer(cachedData, packageId);
          console.log(`✅ Loaded ${packageId} from cache successfully`);
        } else {
          throw new Error('Failed to load from cache');
        }
      } else {
        console.log(`📥 Downloading ${packageId} from server...`);
        setState(prev => ({ ...prev, progressStage: `Downloading ${packageId}...` }));
        
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
        
        // Cache placeholder disabled until we export real DB bytes
        console.log(`💾 Skipping cache save for ${packageId} (no DB export available yet)`);
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
      // Load a sample package for demo
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
        // Clear the database - using a simple approach for now
        // In a real implementation, you'd call the appropriate method
        setState(prev => ({
          ...prev,
          loadedPackages: [],
          statistics: null,
          integrity: null,
          dataSource: null
        }));
        console.log('✅ Data unloaded successfully');
      } catch (error) {
        console.error('❌ Failed to unload data:', error);
      }
  }, [state.dataLoader]);

  // Clear cache and unload
  const clearCacheAndUnload = useCallback(async () => {
    try {
      await unloadData();
      const success = await cache.clearCache();
      if (success) {
        console.log('✅ Cache cleared successfully');
        // Update cache info
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
    removeFromCache
  };
}
