import { useState, useEffect, useCallback, useRef } from 'react';
import { createScopedLogger } from '../logger';

const logger = createScopedLogger('useWordNetWorker');

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
    logger.start('creating ComlinkWorker');
    
    // Only create worker in browser environment
    if (typeof window === 'undefined') {
      logger.step('not in browser environment, skipping worker creation');
      return;
    }
    
    try {
      // Create ComlinkWorker - the plugin handles the worker creation
      const worker = new ComlinkWorker(new URL('../workers/wordnetWorker.ts', import.meta.url));
      workerRef.current = worker;

      // Initialize WordNet in worker
      logger.step('initializing WordNet in worker');
      initializeWorker();

      return () => {
        logger.step('cleaning up worker');
        if (workerRef.current) {
          // The plugin handles cleanup automatically
          workerRef.current = null;
        }
      };
    } catch (error) {
      logger.fail('Failed to create worker', error);
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
      logger.step('worker initialization result received', result);
      
      if (result.success) {
        logger.success('Worker initialized successfully, setting isReady to true');
        setState(prev => ({ ...prev, isReady: true, loading: false, error: null }));
      } else {
        logger.fail('Worker initialization failed', result.error);
        setState(prev => ({ ...prev, loading: false, error: result.error || 'Worker initialization failed' }));
      }
    } catch (error) {
      logger.fail('Error initializing worker', error);
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

    logger.start('loading demo data');
    setState(prev => ({ ...prev, loading: true, error: null, progress: 0 }));
    
    try {
      const response = await workerRef.current.loadDemoData();
      logger.step('demo data load response received', response);
      
      if (response.success) {
        logger.success('Demo data loaded successfully');
        setState(prev => ({ 
          ...prev, 
          loading: false, 
          error: null,
          statistics: response.statistics,
          loadedPackages: response.loadedPackages || []
        }));
      } else {
        logger.fail('Demo data load failed', response.error);
        setState(prev => ({ 
          ...prev, 
          loading: false, 
          error: response.error || 'Demo data load failed' 
        }));
      }
      
      logger.end('loading demo data', response);
    } catch (error) {
      logger.fail('Demo data load failed with exception', error);
      setState(prev => ({ 
        ...prev, 
        loading: false, 
        error: error instanceof Error ? error.message : String(error) 
      }));
      logger.end('loading demo data');
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
