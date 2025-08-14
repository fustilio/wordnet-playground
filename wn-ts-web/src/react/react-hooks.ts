/**
 * React Hooks for wn-ts-web
 * 
 * This module provides convenient React hooks for using WordNet with workers,
 * including state management, error handling, and progress tracking.
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { createWordNetWorker, type WordNetWorkerAPI } from '../worker-factory';

// Types for the hook state
export interface WordNetState {
  // Core state
  isReady: boolean;
  isLoading: boolean;
  isInitializing: boolean;
  error: string | null;
  
  // Data state
  loadedPackages: string[];
  statistics: any;
  posDistribution: any;
  
  // Progress state
  progress: number;
  progressStage: string;
  
  // Cache state
  cacheInfo: {
    isSupported: boolean;
    totalFiles: number;
    totalSizeMB: number;
    availableSpaceMB: number;
  };
}

// Types for hook options
export interface UseWordNetOptions {
  workerUrl: string | URL;
  autoInitialize?: boolean;
  initialLexiconId?: string;
  onProgress?: (progress: number) => void;
  onError?: (error: string) => void;
}

// Types for query results
export interface QueryResult<T = any> {
  success: boolean;
  data?: T;
  error?: string;
}

// Progress callback type
export type ProgressCallback = (progress: number) => void;

/**
 * Main hook for using WordNet with workers
 */
export function useWordNet(options: UseWordNetOptions) {
  const {
    workerUrl,
    autoInitialize = true,
    initialLexiconId = 'oewn:2024',
    onProgress,
    onError
  } = options;

  // State management
  const [state, setState] = useState<WordNetState>({
    isReady: false,
    isLoading: false,
    isInitializing: false,
    error: null,
    loadedPackages: [],
    statistics: null,
    posDistribution: null,
    progress: 0,
    progressStage: 'Ready - No packages loaded',
    cacheInfo: {
      isSupported: false,
      totalFiles: 0,
      totalSizeMB: 0,
      availableSpaceMB: 0
    }
  });

  // Worker reference
  const workerRef = useRef<WordNetWorkerAPI | null>(null);
  const isInitializedRef = useRef(false);

  // Initialize worker
  const initializeWorker = useCallback(async () => {
    try {
      if (!workerRef.current) {
        workerRef.current = createWordNetWorker(workerUrl);
      }
      return workerRef.current;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to create worker';
      setState(prev => ({ ...prev, error: errorMessage }));
      onError?.(errorMessage);
      throw error;
    }
  }, [workerUrl, onError]);

  // Initialize WordNet
  const initializeWordNet = useCallback(async () => {
    if (isInitializedRef.current) return;

    try {
      setState(prev => ({ 
        ...prev, 
        isInitializing: true, 
        error: null,
        progressStage: 'Initializing WordNet...'
      }));

      const worker = await initializeWorker();
      const result = await worker.initializeWordNet(initialLexiconId);

      if (result.success && result.data) {
        const { lexiconStats, statistics, hasInitialState } = result.data;
        
        setState(prev => ({
          ...prev,
          isReady: true,
          isInitializing: false,
          isLoading: false,
          loadedPackages: lexiconStats?.map((ls: any) => ls.lexiconId) || [],
          statistics: statistics || prev.statistics,
          progressStage: hasInitialState ? 'Ready - Using existing data' : 'Ready - No packages loaded'
        }));

        isInitializedRef.current = true;
      } else {
        throw new Error(result.error || 'Initialization failed');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Initialization failed';
      setState(prev => ({ 
        ...prev, 
        isInitializing: false, 
        error: errorMessage 
      }));
      onError?.(errorMessage);
      throw error;
    }
  }, [initialLexiconId, initializeWorker, onError]);

  // Load package data
  const loadPackageData = useCallback(async (packageId: string, progressCallback?: ProgressCallback) => {
    try {
      if (!workerRef.current) {
        throw new Error('Worker not initialized');
      }

      setState(prev => ({ 
        ...prev, 
        isLoading: true, 
        error: null,
        progressStage: `Loading package: ${packageId}`
      }));

      const result = await workerRef.current.loadPackage(packageId, {
        onProgress: (progress) => {
          setState(prev => ({ ...prev, progress }));
          progressCallback?.(progress);
          onProgress?.(progress);
        }
      });

      if (result.success && result.data) {
        const { statistics, lexiconStats } = result.data;
        
        setState(prev => ({
          ...prev,
          isLoading: false,
          statistics: statistics || prev.statistics,
          loadedPackages: [...prev.loadedPackages, packageId],
          progressStage: 'Ready - Package loaded successfully'
        }));
      } else {
        throw new Error(result.error || 'Package loading failed');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Package loading failed';
      setState(prev => ({ 
        ...prev, 
        isLoading: false, 
        error: errorMessage 
      }));
      onError?.(errorMessage);
      throw error;
    }
  }, [onProgress, onError]);

  // Load demo data
  const loadDemoData = useCallback(async (progressCallback?: ProgressCallback) => {
    try {
      if (!workerRef.current) {
        throw new Error('Worker not initialized');
      }

      setState(prev => ({ 
        ...prev, 
        isLoading: true, 
        error: null,
        progressStage: 'Loading demo data...'
      }));

      const result = await workerRef.current.loadDemoData({
        onProgress: (progress) => {
          setState(prev => ({ ...prev, progress }));
          progressCallback?.(progress);
          onProgress?.(progress);
        }
      });

      if (result.success && result.data) {
        const { statistics, lexiconStats } = result.data;
        
        setState(prev => ({
          ...prev,
          isLoading: false,
          statistics: statistics || prev.statistics,
          loadedPackages: lexiconStats?.map((ls: any) => ls.lexiconId) || [],
          progressStage: 'Ready - Demo data loaded'
        }));
      } else {
        throw new Error(result.error || 'Demo data loading failed');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Demo data loading failed';
      setState(prev => ({ 
        ...prev, 
        isLoading: false, 
        error: errorMessage 
      }));
      onError?.(errorMessage);
      throw error;
    }
  }, [onProgress, onError]);

  // Query operations
  const queryWords = useCallback(async (term: string, pos?: string): Promise<any[]> => {
    try {
      if (!workerRef.current) {
        throw new Error('Worker not initialized');
      }

      const result = await workerRef.current.queryWords(term, pos);
      if (result.success) {
        return result.data || [];
      } else {
        throw new Error(result.error || 'Query failed');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Query failed';
      setState(prev => ({ ...prev, error: errorMessage }));
      onError?.(errorMessage);
      return [];
    }
  }, [onError]);

  const querySynsets = useCallback(async (term: string, pos?: string): Promise<any[]> => {
    try {
      if (!workerRef.current) {
        throw new Error('Worker not initialized');
      }

      const result = await workerRef.current.querySynsets(term, pos);
      if (result.success) {
        return result.data || [];
      } else {
        throw new Error(result.error || 'Query failed');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Query failed';
      setState(prev => ({ ...prev, error: errorMessage }));
      onError?.(errorMessage);
      return [];
    }
  }, [onError]);

  const querySenses = useCallback(async (term: string, pos?: string): Promise<any[]> => {
    try {
      if (!workerRef.current) {
        throw new Error('Worker not initialized');
      }

      const result = await workerRef.current.querySenses(term, pos);
      if (result.success) {
        return result.data || [];
      } else {
        throw new Error(result.error || 'Query failed');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Query failed';
      setState(prev => ({ ...prev, error: errorMessage }));
      onError?.(errorMessage);
      return [];
    }
  }, [onError]);

  // Utility operations
  const getStatus = useCallback(async () => {
    try {
      if (!workerRef.current) {
        throw new Error('Worker not initialized');
      }

      const result = await workerRef.current.getStatus();
      if (result.success && result.data) {
        const { lexiconStats, statistics } = result.data;
        setState(prev => ({
          ...prev,
          loadedPackages: lexiconStats?.map((ls: any) => ls.lexiconId) || [],
          statistics: statistics || prev.statistics
        }));
        return result.data;
      } else {
        throw new Error(result.error || 'Status check failed');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Status check failed';
      setState(prev => ({ ...prev, error: errorMessage }));
      onError?.(errorMessage);
      return null;
    }
  }, [onError]);

  const clearData = useCallback(async () => {
    try {
      if (!workerRef.current) {
        throw new Error('Worker not initialized');
      }

      const result = await workerRef.current.clearData();
      if (result.success) {
        setState(prev => ({
          ...prev,
          loadedPackages: [],
          statistics: null,
          posDistribution: null,
          progressStage: 'Ready - Data cleared'
        }));
      } else {
        throw new Error(result.error || 'Data clearing failed');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Data clearing failed';
      setState(prev => ({ ...prev, error: errorMessage }));
      onError?.(errorMessage);
      throw error;
    }
  }, [onError]);

  // Clear error
  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }));
  }, []);

  // Auto-initialize if requested
  useEffect(() => {
    if (autoInitialize && !isInitializedRef.current) {
      initializeWordNet();
    }
  }, [autoInitialize, initializeWordNet]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      // Cleanup worker if needed
      workerRef.current = null;
      isInitializedRef.current = false;
    };
  }, []);

  return {
    // State
    ...state,
    
    // Actions
    initializeWordNet,
    loadPackageData,
    loadDemoData,
    queryWords,
    querySynsets,
    querySenses,
    getStatus,
    clearData,
    clearError,
    
    // Worker reference (for advanced usage)
    worker: workerRef.current
  };
}

/**
 * Hook for checking if a specific package is loaded
 */
export function usePackageStatus(packageId: string, worker: WordNetWorkerAPI | null) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isChecking, setIsChecking] = useState(false);

  const checkStatus = useCallback(async () => {
    if (!worker) return;
    
    setIsChecking(true);
    try {
      const result = await worker.hasLoadedData(packageId);
      if (result.success && result.data) {
        setIsLoaded(result.data.hasPackage || false);
      }
    } catch (error) {
      console.error('Failed to check package status:', error);
    } finally {
      setIsChecking(false);
    }
  }, [worker, packageId]);

  useEffect(() => {
    checkStatus();
  }, [checkStatus]);

  return { isLoaded, isChecking, checkStatus };
}

/**
 * Hook for managing cache information
 */
export function useCacheInfo(worker: WordNetWorkerAPI | null) {
  const [cacheInfo, setCacheInfo] = useState({
    isSupported: false,
    totalFiles: 0,
    totalSizeMB: 0,
    availableSpaceMB: 0
  });

  const updateCacheInfo = useCallback(async () => {
    if (!worker) return;
    
    try {
      // This would need to be implemented in the worker
      // For now, we'll use a placeholder
      setCacheInfo({
        isSupported: true,
        totalFiles: 0,
        totalSizeMB: 0,
        availableSpaceMB: 0
      });
    } catch (error) {
      console.error('Failed to update cache info:', error);
    }
  }, [worker]);

  useEffect(() => {
    updateCacheInfo();
  }, [updateCacheInfo]);

  return { cacheInfo, updateCacheInfo };
}
