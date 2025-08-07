import { useState, useEffect, useCallback } from 'react';
import { createWordNetInstance, WebWordnet, DataLoader } from 'wn-ts-web';

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
} {
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
        id: 'oewn',
        label: 'Open English WordNet',
        language: 'en',
        version: '2024'
      },
      {
        id: 'cili',
        label: 'Collaborative Interlingual Index',
        language: 'interlingual',
        version: '1.0'
      }
    ],
    loadedPackages: [],
    progress: 0,
    progressStage: 'Initializing...'
  });

  // Initialize WordNet instance
  useEffect(() => {
    const initializeWordNet = async () => {
      setState(prev => ({ ...prev, loading: true, isInitializing: true, progressStage: 'Loading SQLite WASM...' }));
      
      try {
        const { wordnet, dataLoader } = await createWordNetInstance();
        
        setState(prev => ({
          ...prev,
          wordnet,
          dataLoader,
          loading: false,
          isInitializing: false,
          progressStage: 'Ready',
          dataSource: {
            id: 'initialized',
            name: 'Initialized',
            version: 'N/A',
            url: 'N/A',
            description: 'WordNet instance initialized',
            lastChecked: new Date().toISOString(),
            status: 'available'
          }
        }));

        // Initial statistics will be loaded by the auto-load useEffect
      } catch (error) {
        console.error('Failed to initialize WordNet:', error);
        setState(prev => ({
          ...prev,
          loading: false,
          isInitializing: false,
          error: error instanceof Error ? error.message : 'Unknown error',
          progressStage: 'Failed to initialize'
        }));
      }
    };

    initializeWordNet();
  }, []);

  // Automatically load demo data on initialization
  useEffect(() => {
    if (state.dataLoader && !state.isInitializing && state.loadedPackages.length === 0) {
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
  }, [state.dataLoader, state.isInitializing]);

  // Load package data
  const loadPackageData = useCallback(async (packageId: string, progress?: ProgressCallback) => {
    if (!state.dataLoader) {
      throw new Error('DataLoader not initialized');
    }

    setState(prev => ({ 
      ...prev, 
      loading: true, 
      progress: 0, 
      progressStage: `Loading ${packageId}...` 
    }));

    try {
      await state.dataLoader.downloadAndLoad(packageId, {
        progress: (p: number) => {
          setState(prev => ({ ...prev, progress: p }));
          progress?.(p);
        }
      });

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
  }, [state.dataLoader]);

  // Load demo data
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
      await state.dataLoader.downloadAndLoad('oewn:2024', {
        progress: (p: number) => {
          console.log(`📊 Progress: ${p * 100}%`);
          setState(prev => ({ ...prev, progress: p }));
          progress?.(p);
        }
      });

      console.log('✅ Demo data loaded successfully');
      setState(prev => ({
        ...prev,
        loading: false,
        progress: 1,
        progressStage: 'Demo loaded',
        loadedPackages: [...prev.loadedPackages, 'oewn:2024'],
      }));

      // Update statistics
      console.log('📊 Getting statistics...');
      const stats = await state.dataLoader.getStatistics();
      console.log('📊 Statistics received:', stats);
      
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
      
      console.log('📊 UI Statistics:', uiStatistics);
      setState(prev => ({ 
        ...prev, 
        statistics: uiStatistics,
        integrity: null,
        dataSource: {
          id: 'oewn:2024',
          name: 'Open English WordNet 2024',
          version: '2024',
          url: 'https://github.com/WordNet-Tools/wn-ts-web/releases/download/v0.1.0/oewn-2024.wn.zip',
          description: 'Open English WordNet 2024',
          lastChecked: new Date().toISOString(),
          status: 'available'
        }
      }));
    } catch (error) {
      console.error('❌ Failed to load demo data:', error);
      setState(prev => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        progressStage: 'Failed to load demo'
      }));
    }
  }, [state.dataLoader]);

  // Query words
  const queryWords = useCallback(async (term: string): Promise<unknown[]> => {
    if (!state.wordnet) {
      throw new Error('WordNet not initialized');
    }

    try {
      return await state.wordnet.words(term);
    } catch (error) {
      console.error('Query error:', error);
      return [];
    }
  }, [state.wordnet]);

  // Query synsets
  const querySynsets = useCallback(async (term: string): Promise<unknown[]> => {
    if (!state.wordnet) {
      throw new Error('WordNet not initialized');
    }

    try {
      return await state.wordnet.synsets(term);
    } catch (error) {
      console.error('Query error:', error);
      return [];
    }
  }, [state.wordnet]);

  // Unload data
  const unloadData = useCallback(async () => {
    if (!state.dataLoader) {
      throw new Error('DataLoader not initialized');
    }

    try {
      await state.dataLoader.clearAllData();
      setState(prev => ({
        ...prev,
        loadedPackages: [],
        statistics: null,
        integrity: null,
        dataSource: null
      }));
    } catch (error) {
      console.error('Failed to unload data:', error);
      throw error;
    }
  }, [state.dataLoader]);

  // Clear cache and unload
  const clearCacheAndUnload = useCallback(async () => {
    try {
      // Clear browser storage
      if ('storage' in navigator && 'clear' in navigator.storage) {
        await (navigator.storage.clear as () => Promise<void>)();
      }
      
      // Clear IndexedDB
      if ('indexedDB' in window) {
        const databases = await indexedDB.databases();
        for (const db of databases) {
          if (db.name) {
            indexedDB.deleteDatabase(db.name);
          }
        }
      }

      // Clear localStorage and sessionStorage
      localStorage.clear();
      sessionStorage.clear();

      // Unload data
      await unloadData();
    } catch (error) {
      console.error('Failed to clear cache:', error);
      throw error;
    }
  }, [unloadData]);

  // Get cache info
  const getCacheInfo = useCallback(async (): Promise<Record<string, unknown>> => {
    const info: Record<string, unknown> = {};

    // Storage estimate
    if ('storage' in navigator && 'estimate' in navigator.storage) {
      try {
        const estimate = await navigator.storage.estimate();
        info.storage = estimate;
      } catch (error) {
        console.warn('Could not get storage estimate:', error);
      }
    }

    // IndexedDB databases
    if ('indexedDB' in window) {
      try {
        const databases = await indexedDB.databases();
        info.indexedDB = databases;
      } catch (error) {
        console.warn('Could not get IndexedDB info:', error);
      }
    }

    // localStorage and sessionStorage
    info.localStorage = {
      length: localStorage.length,
      keys: Object.keys(localStorage)
    };
    info.sessionStorage = {
      length: sessionStorage.length,
      keys: Object.keys(sessionStorage)
    };

    return info;
  }, []);

  return {
    ...state,
    loadPackageData,
    loadDemoData,
    queryWords,
    querySynsets,
    unloadData,
    clearCacheAndUnload,
    getCacheInfo
  };
}
