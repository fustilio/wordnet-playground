import { useState, useEffect, useCallback, useRef } from 'react';
import { 
  createWordNetInstance, 
  WebWordnet, 
  DataLoader
} from 'wn-ts-web';
import { WordNetWorkerClient } from '../lib/wordnetWorkerClient';
import { createScopedLogger, setGlobalLogLevel } from '../logger';
import { getAvailableProjects } from '../utils/project-list';
setGlobalLogLevel('debug')

// Worker-first: This hook prefers a Comlink worker for initialization and heavy operations.
// It automatically falls back to main thread if the worker cannot be created.



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
  refreshPackages: () => Promise<void>;
  getLexiconInfo: (id?: string) => any[] | undefined;
  getCurrentLexicons: () => any[];
  testMemoryQueries: () => Promise<any>;
} {
  const logger = createScopedLogger('useWordNet');
  
  // Store the worker client in a ref to maintain it across renders
  const workerClientRef = useRef<WordNetWorkerClient | null>(null);
  const [workerAvailable, setWorkerAvailable] = useState(false);
  
  // Initialize the worker client only once
  useEffect(() => {
    if (!workerClientRef.current) {
      workerClientRef.current = new WordNetWorkerClient();
    }
    setWorkerAvailable(!!workerClientRef.current);
  }, []); // Empty dependency array ensures this only runs once

  
  
  
  
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
    progressStage: 'Ready - No packages loaded' // Clear message that no packages are loaded
  });

  // Initialize available packages immediately on mount
  useEffect(() => {
    logger.debug('Initializing package discovery on mount');
    
    // Start with a minimal set of essential packages
    const essentialPackages = [
      { id: 'oewn:2024', label: 'Open English WordNet', language: 'en', version: '2024' },
    ];
    
    logger.debug('Setting essential packages initially', { 
      essentialCount: essentialPackages.length,
      essentialPackages: essentialPackages.map(p => ({ id: p.id, label: p.label }))
    });
    
    setState(prev => ({
      ...prev,
      availablePackages: essentialPackages,
      progressStage: 'Detecting existing packages...'
    }));
    
    // Don't call detectExistingPackages here - wait for worker to be ready
    // It will be called after worker initialization completes
  }, []); // Only run once on mount

  // Detect existing packages on disk without blocking UI
  const detectExistingPackages = async () => {
    try {
      logger.debug('Starting disk status detection');
      setState(prev => ({ ...prev, progressStage: 'Scanning for existing packages...' }));
      
      // Always try to get status from worker if available, regardless of cache status
    const wc = workerClientRef.current;
    if (wc) {
        try {
          logger.debug('Calling worker getStatus()');
          const status = await wc.getStatus();
          logger.debug('Worker getStatus() response', status);
          
          // status is already the data payload from the worker client
          {
            const loaded = status.lexiconStats?.map((ls: any) => `${ls.lexiconId}${ls.version ? `:${ls.version}` : ''}`) || [];
            const hasData = status.hasData;
            
            logger.debug('Detected loaded packages', { loaded, hasData });
            
            // Only show packages that are actually relevant
            const relevantPackages = essentialPackages.filter(pkg => {
              // Show OEWN if it's not loaded or if we have no data
              if (pkg.id === 'oewn:2024') {
                return !hasData || !loaded.includes(pkg.id);
              }
              // For other packages, only show if they're loaded
              return loaded.includes(pkg.id);
            });
            
            setState(prev => ({
              ...prev,
              availablePackages: relevantPackages,
              loadedPackages: Array.from(new Set([...(prev.loadedPackages || []), ...loaded])),
              progressStage: hasData ? 'Ready - Packages detected' : 'Ready - No packages loaded'
            }));
            
            logger.debug('Updated state with detected packages', {
              relevantCount: relevantPackages.length,
              loadedCount: loaded.length,
              hasData
            });
            
            return;
          }
        } catch (error) {
          logger.warn('Worker status check failed with error', { error });
        }
              } else {
          logger.debug('No worker client available for status check');
        }
      
      // No cache fallback needed since worker handles everything
      logger.debug('No cache files found');
      setState(prev => ({ ...prev, progressStage: 'Ready - Essential packages available' }));
      
    } catch (error) {
      logger.warn('Package detection failed, using essential packages', { error });
      setState(prev => ({
        ...prev,
        progressStage: 'Ready - Essential packages available'
      }));
    }
  };

  // Essential packages that should always be available
  const essentialPackages = [
    { id: 'oewn:2024', label: 'Open English WordNet', language: 'en', version: '2024' },
  ];

  // Refresh packages: update loadedPackages from worker and available list from catalog
  const refreshPackages = useCallback(async () => {
    logger.start('refreshing packages');
    logger.step('detecting existing packages');
    
    try {
      await detectExistingPackages();
      // Also refresh the catalog-based available list for UI discovery
      const catalog = getAvailableProjects();
      const mapped = catalog.map(p => ({ id: `${p.id}:${(p as any).versions?.[0] ?? (p as any).version ?? ''}`, label: p.label || p.id, language: p.language || 'mul', version: String((p as any).versions?.[0] ?? (p as any).version ?? '') }));
      setState(prev => ({ ...prev, availablePackages: mapped }));
      logger.success('Packages refreshed successfully');
      logger.end('refreshing packages');
    } catch (error) {
      logger.fail('Failed to refresh packages', error);
      logger.end('refreshing packages');
    }
  }, []);

  // Get lexicon information from the worker client
  const getLexiconInfo = useCallback((id?: string) => {
    const wc = workerClientRef.current;
    if (!wc) return undefined;
    
    if (id) {
      const lexicon = wc.getLexicon(id);
      return lexicon ? [lexicon] : [];
    }
    return wc.lexicons;
  }, []);

  // Get current lexicons from the worker client
  const getCurrentLexicons = useCallback(() => {
    const wc = workerClientRef.current;
    if (!wc) return [];
    return wc.lexicons;
  }, []);

  // Test memory queries for debugging
  const testMemoryQueries = useCallback(async () => {
    const wc = workerClientRef.current;
    if (!wc) {
      logger.warn('No worker client available for memory testing');
      return null;
    }
    
    try {
      logger.debug('Running memory query tests');
      const results = await wc.testMemoryQueries();
      logger.debug('Memory test results', { results });
      return results;
    } catch (error) {
      logger.error('Memory test failed', { error });
      throw error;
    }
  }, [logger]);

  // Initialize WordNet instance (run once on mount)
  useEffect(() => {
    if (state.isInitializing) {
      console.log("start initializing")
      initializeWordNet();
    }
  }, [state.isInitializing]);

  // Cleanup effect to dispose the worker client when the component unmounts
  useEffect(() => {
    return () => {
      if (workerClientRef.current) {
        workerClientRef.current.dispose();
        workerClientRef.current = null;
      }
    };
  }, []);

  // Set up event listeners for the worker client
  useEffect(() => {
    const wc = workerClientRef.current;
    if (!wc) {
      logger.debug('No worker client available for event listeners');
      return;
    }

    // Handle lexicon changes
    const handleLexiconsChanged = (event: { lexicons: Array<{ id: string; version?: string }>; added?: Array<{ id: string; version?: string }>; removed?: string[] }) => {
      logger.debug('Lexicons changed event received', event);
      
      setState(prev => {
        const merged = new Set<string>(prev.loadedPackages);
        for (const l of event.lexicons) {
          merged.add(l.version ? `${l.id}:${l.version}` : l.id);
        }
        return {
          ...prev,
          loadedPackages: Array.from(merged),
          // keep available list stable; do not filter it down on events
          availablePackages: prev.availablePackages
        };
      });
    };

    // Handle package loaded events
    const handlePackageLoaded = (event: { packageId: string; success: boolean; error?: string; lexiconInfo?: any }) => {
      logger.debug('Package loaded event received', event);
      
      if (event.success && event.lexiconInfo) {
        setState(prev => ({
          ...prev,
          loadedPackages: [...new Set([...prev.loadedPackages, event.packageId])],
          progressStage: `Package ${event.packageId} loaded successfully`
        }));
      } else if (event.error) {
        setState(prev => ({
          ...prev,
          error: `Failed to load package ${event.packageId}: ${event.error}`,
          progressStage: `Failed to load ${event.packageId}`
        }));
      }
    };

    // Handle status updates
    const handleStatusUpdated = (event: { status: { lexiconStats?: Array<{ lexiconId: string; version?: string }>; statistics?: Record<string, unknown> } }) => {
      logger.debug('Status updated event received', event);
      
      const payload = event.status || (event as unknown as any);
      if (payload.lexiconStats) {
        const loadedPackages = payload.lexiconStats.map(ls => (ls.version ? `${ls.lexiconId}:${ls.version}` : ls.lexiconId));
        setState(prev => ({
          ...prev,
          loadedPackages: Array.from(new Set([...(prev.loadedPackages || []), ...loadedPackages])),
          statistics: payload.statistics,
          progressStage: loadedPackages.length > 0 ? 'Ready - Packages loaded' : 'Ready - No packages loaded'
        }));
      }
    };

    // Handle errors
    const handleError = (event: { error: string; context: string }) => {
      logger.warn('Worker error event received', event);
      setState(prev => ({
        ...prev,
        error: `Worker error (${event.context}): ${event.error}`,
        progressStage: 'Error occurred'
      }));
    };

    // Add event listeners
    wc.addEventListener('lexiconsChanged', handleLexiconsChanged);
    wc.addEventListener('packageLoaded', handlePackageLoaded);
    wc.addEventListener('statusUpdated', handleStatusUpdated);
    wc.addEventListener('error', handleError);

    // Cleanup event listeners
    return () => {
      wc.removeEventListener('lexiconsChanged', handleLexiconsChanged);
      wc.removeEventListener('packageLoaded', handlePackageLoaded);
      wc.removeEventListener('statusUpdated', handleStatusUpdated);
      wc.removeEventListener('error', handleError);
    };
  }, [workerAvailable, logger]);

  // Initialize WordNet instance (run once on mount)
  const initializeWordNet = async () => {
    logger.start('WordNet initialization');
    logger.step('setting initial state');
    
    setState(prev => ({ ...prev, loading: true, isInitializing: true, progressStage: 'Loading SQLite WASM...' }));
    
    try {
      // Initialize worker client for heavy operations
      const wc = workerClientRef.current;
      if (wc && !wc.initialized) {
        try {
          logger.step('initializing worker client');
          await wc.initialize();
          
          logger.success('Worker client initialized');
        } catch (error) {
          logger.warn('Failed to initialize worker client, falling back to main thread', { error });
        }
      }

              // Try to use worker first, fall back to main thread
        let wordnet: WebWordnet | null = null;
        let dataLoader: DataLoader | null = null;

        const wc2 = workerClientRef.current;
        if (wc2) {
          try {
            logger.step('using worker client for initialization');
            const data: any = await wc2.getStatus();
            logger.success('Worker initialization successful');
            logger.debug('Worker result data', data);
            
            // Populate loaded packages and minimal stats from worker (if provided)
            try {
              const lexStats = data.lexiconStats || [];
              const loaded = Array.isArray(lexStats) ? lexStats.map((ls: any) => `${ls.lexiconId}${ls.version ? `:${ls.version}` : ''}`) : [];
              
              logger.debug('Processing worker data', { 
                hasData: !!data, 
                hasLexiconStats: !!data.lexiconStats, 
                hasStatistics: !!data.statistics,
                loadedCount: loaded.length
              });
              
              if (loaded.length > 0 || data.statistics) {
                setState(prev => ({
                  ...prev,
                  loadedPackages: loaded,
                  statistics: data.statistics ? {
                    totalWords: data.statistics.totalWords ?? 0,
                    totalSynsets: data.statistics.totalSynsets ?? 0,
                    totalSenses: data.statistics.totalSenses ?? 0,
                    totalRelations: 0,
                    totalDefinitions: 0,
                    languages: ['en'],
                    partsOfSpeech: ['n','v','a','r'],
                    dataSize: (data.statistics.totalWords ?? 0) * 100 + (data.statistics.totalSynsets ?? 0) * 200,
                    lastUpdated: new Date().toISOString(),
                    source: 'Database',
                    posDistribution: undefined
                  } : prev.statistics
                }));
              }
              
              // Worker is ready; detect packages and finish
              setState(prev => ({ 
                ...prev, 
                isReady: true, 
                loading: false, 
                isInitializing: false,
                progressStage: 'Worker ready - Detecting packages...'
              }));
              logger.debug('Worker ready, detecting existing packages');
              await detectExistingPackages();
              return;
              
            } catch (e) {
              logger.warn('Failed to process worker data', { error: e });
              setState(prev => ({ 
                ...prev, 
                isReady: true, 
                loading: false, 
                isInitializing: false,
                progressStage: 'Worker ready - Detecting packages...'
              }));
              logger.debug('Worker ready, detecting existing packages');
              await detectExistingPackages();
              return;
            }
          } catch (error) {
          logger.warn('Worker error, falling back to main thread', { error });
          logger.step('creating main thread instance as fallback');
          const instance = await createWordNetInstance();
          wordnet = instance.wordnet;
          dataLoader = instance.dataLoader;
        }
        } else {
        logger.warn('No remote worker available, using main thread for initialization');
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
        progressStage: 'Initializing...'
      }));

      setState(prev => ({ 
        ...prev, 
        progressStage: 'Ready',
        loading: false,
        progress: 0,
      }));

      // Populate available and loaded packages
      logger.step('populating available and loaded packages');
      await refreshPackages();

      logger.success('WordNet initialized successfully');
      logger.end('WordNet initialization', { 
        hasWorker: !!workerAvailable,
        hasWordNet: !!wordnet,
        hasDataLoader: !!dataLoader
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

  // Load package data with caching
  const loadPackageData = useCallback(async (packageId: string, progress?: ProgressCallback) => {
    if (!workerClientRef.current?.initialized && !state.dataLoader) {
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
      logger.step('downloading from server', { packageId });
      setState(prev => ({ ...prev, progressStage: `Downloading ${packageId}...` }));
      
              // Try to use worker client for heavy operations
        if (workerClientRef.current) {
          try {
            logger.step('using worker client for package loading', { packageId });
            const result = await workerClientRef.current.loadPackage(packageId);
                      if (result) {
              logger.success('Worker package loading successful');
              logger.end(`loading package ${packageId}`, { 
                source: 'worker', 
                method: 'client' 
              });
              // No redundant main-thread reload here
            } else {
              logger.warn('Worker package loading failed, using main thread', { 
                packageId, 
                error: 'Worker returned false' 
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
        let totalWords = 0;
        let totalSynsets = 0;
        let totalSenses = 0;
        let posDistribution: any = undefined;

        if (workerClientRef.current && !state.dataLoader) {
          const resp = await workerClientRef.current.getStatus();
          if (resp && resp.statistics) {
            totalWords = resp.statistics.totalWords;
            totalSynsets = resp.statistics.totalSynsets;
            totalSenses = resp.statistics.totalSenses;
            posDistribution = resp.posDistribution;
          } else {
            throw new Error('Failed to fetch worker statistics');
          }
        } else if (state.dataLoader) {
          const stats = await state.dataLoader.getStatistics();
          totalWords = stats.totalWords;
          totalSynsets = stats.totalSynsets;
          totalSenses = stats.totalSenses;
          // Try to get part of speech distribution if wordnet is available
          if (state.wordnet) {
            try {
              posDistribution = await state.wordnet.getPartOfSpeechDistribution();
            } catch (e) {
              logger.warn('Failed to get POS distribution', { error: e });
            }
          }
        }

        const uiStatistics = {
          totalWords,
          totalSynsets,
          totalSenses,
          totalRelations: 0,
          totalDefinitions: 0,
          languages: ['en'],
          partsOfSpeech: ['n', 'v', 'a', 'r'],
          dataSize: totalWords * 100 + totalSynsets * 200,
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
  }, [state.dataLoader]);

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
      
      // Try to use worker client for demo data loading
      if (workerClientRef.current) {
        try {
          console.log('🔧 Using worker client for demo data loading...');
          const result = await workerClientRef.current.loadDemoData();
          if (result) {
            console.log('✅ Worker demo data loading successful');
            // Still need to load the database into main thread for queries
            await loadPackageData('oewn:2024', progress);
          } else {
            console.warn('⚠️ Worker demo data loading failed, using main thread');
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
    // Prefer worker if available
    if (workerClientRef.current) {
      try {
        const result = await workerClientRef.current.queryWords(term);
        if (result && result.length > 0) return result;
        console.warn('⚠️ Worker query failed, using main thread');
      } catch (error) {
        console.warn('⚠️ Worker error, falling back to main thread:', error);
      }
    }

    if (!state.wordnet) {
      throw new Error('WordNet not initialized');
    }
    return await state.wordnet.words(term);
  }, [state.wordnet]);

  // Query synsets
  const querySynsets = useCallback(async (term: string) => {
    // Prefer worker if available
    if (workerClientRef.current) {
      try {
        const result = await workerClientRef.current.querySynsets(term);
        if (result && result.length > 0) return result;
        console.warn('⚠️ Worker query failed, using main thread');
      } catch (error) {
        console.warn('⚠️ Worker error, falling back to main thread:', error);
      }
    }

    if (!state.wordnet) {
      throw new Error('WordNet not initialized');
    }
    return await state.wordnet.synsets(term);
  }, [state.wordnet]);

  // Unload data
  const unloadData = useCallback(async () => {
    try {
      setState(prev => ({ ...prev, loading: true }));
      
      // Try to use worker client for clearing data
      if (workerClientRef.current) {
        try {
          const result = await workerClientRef.current.clearData();
          if (result) {
            console.log('✅ Worker data clearing successful');
          } else {
            console.warn('⚠️ Worker data clearing failed, using main thread');
          }
        } catch (error) {
          console.warn('⚠️ Worker error, falling back to main thread:', error);
        }
      }
      
      // Clear main thread data if available
      if (state.dataLoader) {
        await state.dataLoader.clearAllData();
      }
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



  return {
    ...state,
    loadPackageData,
    loadDemoData,
    queryWords,
    querySynsets,
    unloadData,
    refreshPackages,
    getLexiconInfo,
    getCurrentLexicons,
    testMemoryQueries,
  };
}

// NOTE: This hook now uses Comlink workers for heavy operations to prevent UI freezing.
// It automatically falls back to main thread operations if the worker fails.
// The worker handles: package loading, data processing, and heavy queries.
