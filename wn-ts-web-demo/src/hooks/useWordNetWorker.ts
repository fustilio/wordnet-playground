import { useState, useEffect, useCallback, useRef } from 'react';

export interface WordNetWorkerState {
  isReady: boolean;
  loading: boolean;
  error: string | null;
  progress: number;
  progressStage: string;
  statistics: any;
  loadedPackages: string[];
}

export function useWordNetWorker() {
  const [state, setState] = useState<WordNetWorkerState>({
    isReady: false,
    loading: false,
    error: null,
    progress: 0,
    progressStage: '',
    statistics: null,
    loadedPackages: []
  });

  const workerRef = useRef<any>(null);

  // Initialize worker
  useEffect(() => {
    console.log('🔧 Hook: Creating ComlinkWorker...');
    
    // Only create worker in browser environment
    if (typeof window === 'undefined') {
      console.log('🔧 Hook: Not in browser environment, skipping worker creation');
      return;
    }
    
    try {
      // Create ComlinkWorker - the plugin handles the worker creation
      const worker = new ComlinkWorker(new URL('../workers/wordnetWorker.ts', import.meta.url));
      workerRef.current = worker;

      // Initialize WordNet in worker
      console.log('🔧 Hook: Initializing WordNet in worker...');
      initializeWorker();

      return () => {
        console.log('🔧 Hook: Cleaning up worker...');
        if (workerRef.current) {
          // The plugin handles cleanup automatically
          workerRef.current = null;
        }
      };
    } catch (error) {
      console.error('🔧 Hook: Failed to create worker:', error);
      setState(prev => ({
        ...prev,
        error: 'Failed to create worker'
      }));
    }
  }, []);

  // Initialize the worker
  const initializeWorker = useCallback(async () => {
    if (!workerRef.current) return;

    try {
      setState(prev => ({ ...prev, loading: true, error: null }));
      
      const result = await workerRef.current.initializeWordNet();
      console.log('🔧 Hook: Worker initialization result:', result);
      
      if (result.success) {
        console.log('🔧 Hook: Worker initialized successfully, setting isReady to true');
        setState(prev => ({ ...prev, isReady: true, loading: false, error: null }));
      } else {
        console.error('🔧 Hook: Worker initialization failed:', result.error);
        setState(prev => ({ ...prev, loading: false, error: result.error || 'Worker initialization failed' }));
      }
    } catch (error) {
      console.error('🔧 Hook: Error initializing worker:', error);
      setState(prev => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : String(error)
      }));
    }
  }, []);

  // Load demo data
  const loadDemoData = useCallback(async () => {
    if (!workerRef.current) {
      setState(prev => ({ ...prev, error: 'Worker not initialized' }));
      return;
    }

    console.log('🔧 Hook: loadDemoData called');
    setState(prev => ({ ...prev, loading: true, error: null, progress: 0 }));
    
    try {
      const response = await workerRef.current.loadDemoData();
      console.log('🔧 Hook: loadDemoData response:', response);
      
      if (response.success) {
        // Statistics are now included in the response
        if (response.data) {
          setState(prev => ({
            ...prev,
            loading: false,
            progress: 1,
            progressStage: 'Complete',
            statistics: response.data,
            loadedPackages: [...prev.loadedPackages, 'oewn:2024']
          }));
        } else {
          // Fallback: get statistics separately if not included
          const statsResponse = await workerRef.current.getStatistics();
          if (statsResponse.success && statsResponse.data) {
            setState(prev => ({
              ...prev,
              loading: false,
              progress: 1,
              progressStage: 'Complete',
              statistics: statsResponse.data,
              loadedPackages: [...prev.loadedPackages, 'oewn:2024']
            }));
          }
        }
      } else {
        setState(prev => ({
          ...prev,
          loading: false,
          error: response.error || 'Failed to load demo data'
        }));
      }
    } catch (error) {
      console.error('🔧 Hook: loadDemoData error:', error);
      setState(prev => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : String(error)
      }));
    }
  }, []);

  // Load package data
  const loadPackageData = useCallback(async (packageId: string) => {
    if (!workerRef.current) {
      setState(prev => ({ ...prev, error: 'Worker not initialized' }));
      return;
    }

    console.log('🔧 Hook: loadPackageData called for:', packageId);
    setState(prev => ({ ...prev, loading: true, error: null, progress: 0 }));
    
    try {
      const response = await workerRef.current.loadPackage(packageId);
      console.log('🔧 Hook: loadPackageData response:', response);
      console.log('🔧 Hook: Response success:', response.success);
      console.log('🔧 Hook: Response data:', response.data);
      
      if (response.success) {
        // Statistics are now included in the response
        if (response.data) {
          console.log('🔧 Hook: Updating state with response data...');
          setState(prev => {
            const newState = {
              ...prev,
              loading: false,
              progress: 1,
              progressStage: 'Complete',
              statistics: response.data,
              loadedPackages: [...prev.loadedPackages, packageId]
            };
            console.log('🔧 Hook: New state:', newState);
            return newState;
          });
        } else {
          console.log('🔧 Hook: No data in response, falling back to separate statistics call...');
          // Fallback: get statistics separately if not included
          const statsResponse = await workerRef.current.getStatistics();
          if (statsResponse.success && statsResponse.data) {
            setState(prev => ({
              ...prev,
              loading: false,
              progress: 1,
              progressStage: 'Complete',
              statistics: statsResponse.data,
              loadedPackages: [...prev.loadedPackages, packageId]
            }));
          }
        }
      } else {
        console.log('🔧 Hook: Response failed, setting error state...');
        setState(prev => ({
          ...prev,
          loading: false,
          error: response.error || 'Failed to load package data'
        }));
      }
    } catch (error) {
      console.error('🔧 Hook: loadPackageData error:', error);
      setState(prev => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : String(error)
      }));
    }
  }, []);

  // Query words
  const queryWords = useCallback(async (term: string) => {
    if (!workerRef.current) {
      throw new Error('Worker not initialized');
    }

    console.log('🔧 Hook: queryWords called for:', term);
    try {
      const response = await workerRef.current.queryWords(term);
      if (response.success && response.data) {
        return response.data;
      }
      throw new Error(response.error || 'Failed to query words');
    } catch (error) {
      console.error('🔧 Hook: queryWords error:', error);
      throw error;
    }
  }, []);

  // Query synsets
  const querySynsets = useCallback(async (term: string) => {
    if (!workerRef.current) {
      throw new Error('Worker not initialized');
    }

    console.log('🔧 Hook: querySynsets called for:', term);
    try {
      const response = await workerRef.current.querySynsets(term);
      if (response.success && response.data) {
        return response.data;
      }
      throw new Error(response.error || 'Failed to query synsets');
    } catch (error) {
      console.error('🔧 Hook: querySynsets error:', error);
      throw error;
    }
  }, []);

  // Clear data
  const clearData = useCallback(async () => {
    if (!workerRef.current) {
      setState(prev => ({ ...prev, error: 'Worker not initialized' }));
      return;
    }

    console.log('🔧 Hook: clearData called');
    setState(prev => ({ ...prev, loading: true, error: null }));
    
    try {
      const response = await workerRef.current.clearData();
      if (response.success) {
        setState(prev => ({
          ...prev,
          loading: false,
          statistics: null,
          progress: 0,
          progressStage: '',
          loadedPackages: []
        }));
      } else {
        setState(prev => ({
          ...prev,
          loading: false,
          error: response.error || 'Failed to clear data'
        }));
      }
    } catch (error) {
      console.error('🔧 Hook: clearData error:', error);
      setState(prev => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : String(error)
      }));
    }
  }, []);

  // Refresh statistics
  const refreshStatistics = useCallback(async () => {
    if (!workerRef.current) {
      setState(prev => ({ ...prev, error: 'Worker not initialized' }));
      return;
    }

    console.log('🔧 Hook: refreshStatistics called');
    try {
      const response = await workerRef.current.getStatistics();
      if (response.success && response.data) {
        setState(prev => ({
          ...prev,
          statistics: response.data
        }));
      } else {
        setState(prev => ({
          ...prev,
          error: response.error || 'Failed to get statistics'
        }));
      }
    } catch (error) {
      console.error('🔧 Hook: refreshStatistics error:', error);
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : String(error)
      }));
    }
  }, []);

  return {
    ...state,
    loadDemoData,
    loadPackageData,
    queryWords,
    querySynsets,
    clearData,
    refreshStatistics
  };
}
