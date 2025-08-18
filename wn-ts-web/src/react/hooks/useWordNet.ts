import { useState, useEffect, useCallback, useRef } from "react";

import { createScopedLogger, setGlobalLogLevel } from "utils/logger";
import { getAvailableProjects } from "../utils/project-list";
import {
  WordNetWorkerClient,
  type DatabaseStatistics,
  type LexiconInfo,
} from "../../";

// Define types locally instead of importing from demo
export interface WordNetStatistics extends DatabaseStatistics {
  source: "Database" | "Worker" | "MainThread";
}

export interface CacheInfo {
  hasStorageQuota: boolean;
  hasIndexedDB: boolean;
  hasLocalStorage: boolean;
  hasSessionStorage: boolean;
  source: "worker" | "dataLoader" | "fallback";
  storageQuota?: {
    usage: number;
    quota: number;
    percentage: number;
  };
  opfsUsage?: {
    totalFiles: number;
    totalSize: number;
    availableSpace: number;
  };
}

export interface WordQueryResult {
  id: string;
  lemma: string;
  pos: string;
  language: string;
  lexicon: string;
  senses: SenseInfo[];
}

export interface SynsetQueryResult {
  id: string;
  ili?: string;
  pos: string;
  language: string;
  lexicon: string;
  definitions: DefinitionInfo[];
  words: WordInfo[];
  relations: RelationInfo[];
}

export interface SenseInfo {
  id: string;
  wordId: string;
  synsetId: string;
  source?: string;
  sensekey?: string;
  adjposition?: string;
  subcategory?: string;
  domain?: string;
  register?: string;
}

export interface DefinitionInfo {
  id: string;
  synsetId: string;
  language: string;
  text: string;
  source?: string;
}

export interface WordInfo {
  id: string;
  lemma: string;
  pos: string;
  language: string;
  lexicon: string;
}

export interface RelationInfo {
  id: string;
  sourceId: string;
  targetId: string;
  type: string;
  source?: string;
}

export interface PackageInfo {
  id: string;
  label: string;
  language?: string;
  license?: string;
  description?: string;
  url?: string;
  citation?: string;
  versions: string[];
}

export interface WorkerStatus {
  initialized: boolean;
  error?: string;
}

export interface LexiconsChangedEvent {
  type: "lexiconsChanged";
  lexicons: LexiconInfo[];
}

export interface PackageLoadedEvent {
  type: "packageLoaded";
  packageId: string;
  success: boolean;
  error?: string;
}

export interface StatusUpdatedEvent {
  type: "statusUpdated";
  status: WorkerStatus;
}

export interface ErrorEvent {
  type: "error";
  error: string;
}

export interface MemoryQueryTestResult {
  success: boolean;
  queryTime: number;
  resultCount: number;
  error?: string;
}

export interface DataSourceInfo {
  type: "worker" | "dataLoader" | "fallback";
  initialized: boolean;
  error?: string;
}

export interface IntegrityInfo {
  totalChecks: number;
  passedChecks: number;
  failedChecks: number;
  errors: string[];
}

setGlobalLogLevel("info");

/**
 * useWordNet Hook
 * 
 * A React hook that provides WordNet functionality with a worker-first architecture.
 * All heavy operations (package loading, data processing, queries) are handled by
 * web workers to prevent UI freezing.
 * 
 * Architecture:
 * - useWordNet → WordNetWorkerClient → WordNetWorker → WordNetOrchestrator → DataLoader
 * - No direct access to DataLoader or WebWordnet instances from the hook
 * - All operations go through the worker client - no main-thread fallbacks
 * - Event-driven updates for package loading, status changes, and errors
 * 
 * Key Features:
 * - Worker-first: All operations go through Comlink workers
 * - No fallbacks: Pure worker architecture for consistency
 * - Event-driven: Real-time updates via event listeners
 * - Memory efficient: Heavy operations don't block the main thread
 * - Type-safe: Full TypeScript support with proper interfaces
 * - Queue system: Package load requests are queued if worker isn't ready
 * 
 * Usage:
 * ```tsx
 * const { 
 *   workerReady,
 *   loading, 
 *   loadPackageData, 
 *   queryWords 
 * } = useWordNet();
 * 
 * // Check if worker is ready
 * if (workerReady) {
 *   // Load a package
 *   await loadPackageData('oewn:2024');
 *   
 *   // Query words
 *   const results = await queryWords('water');
 * }
 * ```
 */
export interface WordNetState {
  loading: boolean;
  isInitializing: boolean;
  error: string | null;
  statistics: WordNetStatistics | undefined;
  integrity: IntegrityInfo | null;
  dataSource: DataSourceInfo | null;
  availablePackages: PackageInfo[];
  loadedPackages: string[];
  progress: number;
  progressStage: string;
  workerReady: boolean;
}

export interface ProgressCallback {
  (progress: number): void;
}

export function useWordNet(config?: { workerUrl?: string; enableWorkers?: boolean; fallbackToMainThread?: boolean }): WordNetState & {
  loadPackageData: (
    packageId: string,
    progress?: ProgressCallback
  ) => Promise<void>;
  loadDemoData: (progress?: ProgressCallback) => Promise<void>;
  queryWords: (term: string) => Promise<WordQueryResult[]>;
  querySynsets: (term: string) => Promise<SynsetQueryResult[]>;
  querySenses: (term: string) => Promise<SenseInfo[]>;
  unloadData: () => Promise<void>;
  refreshPackages: () => Promise<void>;
  getLexiconInfo: (id?: string) => LexiconInfo[] | undefined;
  getCurrentLexicons: () => LexiconInfo[];
  testMemoryQueries: () => Promise<MemoryQueryTestResult>;
  // New helpers for bilingual queries
  getSensesByWordIdOrForm: (wordIdOrForm: string) => Promise<SenseInfo[]>;
  getWordsBySynsetAndLanguage: (
    synsetId: string,
    language: string
  ) => Promise<WordInfo[]>;
  getDefinitionsBySynsetId: (synsetId: string) => Promise<DefinitionInfo[]>;
  getSynsetById: (synsetId: string) => Promise<SynsetQueryResult | undefined>;
  getWordsByIliAndLanguage: (
    ili: string,
    language: string
  ) => Promise<WordInfo[]>;
  getWordsByIliAndLexiconPrefix: (
    ili: string,
    lexiconPrefix: string
  ) => Promise<WordInfo[]>;
  searchWordsInLexicon: (
    term: string,
    lexicon: string,
    language?: string
  ) => Promise<WordQueryResult[]>;
  // Data management
  clearCacheAndUnload: () => Promise<void>;
  getCacheInfo: () => Promise<CacheInfo>;
  isWorkerReady: () => boolean;
  hasPendingLoads: () => boolean;
  hasInitializationStarted: () => boolean;
} {
  const logger = createScopedLogger("useWordNet");

  // Store the worker client in a ref to maintain it across renders
  const workerClientRef = useRef<WordNetWorkerClient | null>(null);
  
  // Queue for package load requests made before worker is ready
  const pendingPackageLoads = useRef<Array<{ packageId: string; progress?: ProgressCallback }>>([]);
  
  // Track initialization state to prevent infinite loops
  const initializationStartedRef = useRef(false);

  // Initialize the worker client only once
  useEffect(() => {
    logger.debug("Worker client effect running", { 
      hasWorkerClient: !!workerClientRef.current,
      componentMounted: true,
      timestamp: Date.now()
    });
    
    if (!workerClientRef.current) {
      logger.debug("Creating new WordNetWorkerClient");
      workerClientRef.current = new WordNetWorkerClient();
      logger.debug("WordNetWorkerClient created successfully");
    }
    
    // Cleanup function to dispose worker client on unmount
    return () => {
      logger.debug("Worker client cleanup running", { 
        hasWorkerClient: !!workerClientRef.current,
        componentMounted: false,
        timestamp: Date.now()
      });
      if (workerClientRef.current) {
        logger.debug("Disposing WordNetWorkerClient");
        workerClientRef.current.dispose();
        workerClientRef.current = null;
        logger.debug("WordNetWorkerClient disposed");
      }
    };
  }, []); // Only run once on mount

  // Update workerReady state when worker client becomes initialized
  useEffect(() => {
    const checkWorkerReady = () => {
      const isReady = workerClientRef.current?.initialized === true;
      setState(prev => ({ ...prev, workerReady: isReady }));
      
      // Process any pending package loads when worker becomes ready
      if (isReady && pendingPackageLoads.current.length > 0) {
        logger.debug("Processing pending package loads", { count: pendingPackageLoads.current.length });
        const pending = [...pendingPackageLoads.current];
        pendingPackageLoads.current = []; // Clear the queue
        
        // Process each pending load
        pending.forEach(async ({ packageId, progress }) => {
          try {
            await loadPackageData(packageId, progress);
          } catch (error) {
            logger.warn("Failed to process pending package load", { packageId, error });
          }
        });
      }
    };

    // Check immediately
    checkWorkerReady();

    // Set up an interval to check periodically until ready
    const interval = setInterval(() => {
      if (workerClientRef.current?.initialized) {
        checkWorkerReady();
        clearInterval(interval);
      }
    }, 100);

    return () => clearInterval(interval);
  }, []); // Only run once on mount

  // Check if there are pending package loads
  const hasPendingLoads = useCallback(() => {
    return pendingPackageLoads.current.length > 0;
  }, []);

  // Check if initialization has started
  const hasInitializationStarted = useCallback(() => {
    return initializationStartedRef.current;
  }, []);

  const [state, setState] = useState<WordNetState>({
    loading: false, // Start with no loading
    isInitializing: true,
    error: null,
    statistics: undefined,
    integrity: null,
    dataSource: null,
    availablePackages: [],
    loadedPackages: [],
    progress: 0,
    progressStage: "Ready - No packages loaded", // Clear message that no packages are loaded
    workerReady: false,
  });

  // Initialize available packages immediately on mount
  useEffect(() => {
    logger.debug("Initializing package discovery on mount");

    // Start with a minimal set of essential packages
    const essentialPackages = [
      {
        id: "oewn:2024",
        label: "Open English WordNet",
        language: "en",
        versions: ["2024"],
        description: "Open English WordNet 2024",
      },
    ];

    logger.debug("Setting essential packages initially", {
      essentialCount: essentialPackages.length,
      essentialPackages: essentialPackages.map((p) => ({
        id: p.id,
        label: p.label,
      })),
    });

    setState((prev) => ({
      ...prev,
      availablePackages: essentialPackages,
      progressStage: "Detecting existing packages...",
    }));

    // Don't call detectExistingPackages here - wait for worker to be ready
    // It will be called after worker initialization completes
  }, []); // Only run once on mount

  // Detect existing packages on disk without blocking UI
  const detectExistingPackages = async () => {
    try {
      logger.debug("Starting disk status detection");
      setState((prev) => ({
        ...prev,
        progressStage: "Scanning for existing packages...",
      }));

      // Always try to get status from worker if available, regardless of cache status
      const wc = workerClientRef.current;
      if (wc) {
        try {
          logger.debug("Calling worker getStatus()");
          const status = await wc.getStatus();
          logger.debug("Worker getStatus() response", status);

          // status is already the data payload from the worker client
          {
            const loaded =
              status.lexiconStats?.map(
                (ls: any) =>
                  `${ls.lexiconId}${ls.version ? `:${ls.version}` : ""}`
              ) || [];
            const hasData = status.hasData;

            logger.debug("Detected loaded packages", { loaded, hasData });

            // Only update loadedPackages and stage here; do not overwrite availablePackages
            setState((prev) => ({
              ...prev,
              loadedPackages: Array.from(
                new Set([...(prev.loadedPackages || []), ...loaded])
              ),
              progressStage: hasData
                ? "Ready - Packages detected"
                : "Ready - No packages loaded",
            }));

            logger.debug("Updated state with detected packages", {
              relevantCount: 0,
              loadedCount: loaded.length,
              hasData,
            });

            return;
          }
        } catch (error) {
          logger.warn("Worker status check failed with error", { error });
        }
      } else {
        logger.debug("No worker client available for status check");
      }

      // No cache fallback needed since worker handles everything
      logger.debug("No cache files found");
      setState((prev) => ({
        ...prev,
        progressStage: "Ready - Essential packages available",
      }));
    } catch (error) {
      logger.warn("Package detection failed, using essential packages", {
        error,
      });
      setState((prev) => ({
        ...prev,
        progressStage: "Ready - Essential packages available",
      }));
    }
  };

  // Refresh packages: update loadedPackages from worker and available list from catalog
  const refreshPackages = useCallback(async () => {
    logger.start("refreshing packages");
    logger.step("detecting existing packages");

    try {
      await detectExistingPackages();
      // Also refresh the catalog-based available list for UI discovery
      const catalog = getAvailableProjects();
      const mapped = catalog.map((p: any) => {
        // Get the first available version, ensuring we don't create malformed IDs
        const firstVersion = p.versions && p.versions.length > 0 ? p.versions[0] : null;
        const packageId = firstVersion ? `${p.id}:${firstVersion}` : p.id;
        
        return {
          id: packageId,
          label: p.label || p.id,
          language: p.language || "mul",
          versions: p.versions || [],
          description: p.description,
          url: p.url,
          citation: p.citation,
        };
      });
      setState((prev) => ({ ...prev, availablePackages: mapped }));
      logger.success("Packages refreshed successfully");
      logger.end("refreshing packages");
    } catch (error) {
      logger.fail("Failed to refresh packages", error);
      logger.end("refreshing packages");
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

  // Worker-backed helpers with main-thread fallback
  const getSensesByWordIdOrForm = useCallback(
    async (wordIdOrForm: string) => {
      const wc = workerClientRef.current;
      if (wc?.initialized) {
        try {
          return await wc.getSensesByWordIdOrForm(wordIdOrForm);
        } catch (error) {
          logger.warn("Worker query failed", { error });
          throw error;
        }
      }
      throw new Error("Worker not available");
    },
    []
  );

  const getWordsBySynsetAndLanguage = useCallback(
    async (synsetId: string, language: string) => {
      const wc = workerClientRef.current;
      if (wc?.initialized) {
        try {
          return await wc.getWordsBySynsetAndLanguage(synsetId, language);
        } catch (error) {
          logger.warn("Worker query failed", { error });
          throw error;
        }
      }
      throw new Error("Worker not available");
    },
    []
  );

  const getDefinitionsBySynsetId = useCallback(
    async (synsetId: string) => {
      const wc = workerClientRef.current;
      if (wc?.initialized) {
        try {
          return await wc.getDefinitionsBySynsetId(synsetId);
        } catch (error) {
          logger.warn("Worker query failed", { error });
          throw error;
        }
      }
      throw new Error("Worker not available");
    },
    []
  );

  const getSynsetById = useCallback(
    async (synsetId: string) => {
      const wc = workerClientRef.current;
      if (wc?.initialized) {
        try {
          return await wc.getSynsetById(synsetId);
        } catch (error) {
          logger.warn("Worker query failed", { error });
          throw error;
        }
      }
      throw new Error("Worker not available");
    },
    []
  );

  const getWordsByIliAndLanguage = useCallback(
    async (ili: string, language: string) => {
      const wc = workerClientRef.current;
      if (wc?.initialized) {
        try {
          return await wc.getWordsByIliAndLanguage(ili, language);
        } catch (error) {
          logger.warn("Worker query failed", { error });
          throw error;
        }
      }
      throw new Error("Worker not available");
    },
    []
  );

  const getWordsByIliAndLexiconPrefix = useCallback(
    async (ili: string, lexiconPrefix: string) => {
      const wc = workerClientRef.current;
      if (wc?.initialized) {
        try {
          return await wc.getWordsByIliAndLexiconPrefix(ili, lexiconPrefix);
        } catch (error) {
          logger.warn("Worker query failed", { error });
          throw error;
        }
      }
      throw new Error("Worker not available");
    },
    []
  );

  const searchWordsInLexicon = useCallback(
    async (term: string, lexicon: string, language?: string) => {
      const wc = workerClientRef.current;
      if (wc?.initialized) {
        try {
          return await wc.searchWordsInLexicon(term, lexicon, language);
        } catch (error) {
          logger.warn("Worker query failed", { error });
          throw error;
        }
      }
      throw new Error("Worker not available");
    },
    []
  );

  // Test memory queries for debugging
  const testMemoryQueries = useCallback(async () => {
    const wc = workerClientRef.current;
    if (!wc) {
      logger.warn("No worker client available for memory testing");
      return null;
    }

    try {
      logger.debug("Running memory query tests");
      const results = await wc.testMemoryQueries();
      logger.debug("Memory test results", { results });
      return results;
    } catch (error) {
      logger.error("Memory test failed", { error });
      throw error;
    }
  }, [logger]);

  // Initialize WordNet instance (run once on mount)
  useEffect(() => {
    if (!initializationStartedRef.current) {
      initializationStartedRef.current = true;
      console.log("start initializing");
      initializeWordNet();
    }
  }, []); // Only run once on mount



  // Set up event listeners for the worker client
  useEffect(() => {
    const wc = workerClientRef.current;
    if (!wc) {
      logger.debug("No worker client available for event listeners");
      return;
    }

    // Handle lexicon changes
    const handleLexiconsChanged = (event: {
      lexicons: Array<{ id: string; version?: string }>;
      added?: Array<{ id: string; version?: string }>;
      removed?: string[];
    }) => {
      logger.debug("Lexicons changed event received", event);

      setState((prev) => {
        const merged = new Set<string>(prev.loadedPackages);
        for (const l of event.lexicons) {
          merged.add(l.version ? `${l.id}:${l.version}` : l.id);
        }
        return {
          ...prev,
          loadedPackages: Array.from(merged),
          // keep available list stable; do not filter it down on events
          availablePackages: prev.availablePackages,
        };
      });
    };

    // Handle package loaded events
    const handlePackageLoaded = (event: {
      packageId: string;
      success: boolean;
      error?: string;
      lexiconInfo?: any;
    }) => {
      logger.debug("Package loaded event received", event);

      if (event.success && event.lexiconInfo) {
        setState((prev) => ({
          ...prev,
          loadedPackages: [
            ...new Set([...prev.loadedPackages, event.packageId]),
          ],
          progressStage: `Package ${event.packageId} loaded successfully`,
        }));
      } else if (event.error) {
        setState((prev) => ({
          ...prev,
          error: `Failed to load package ${event.packageId}: ${event.error}`,
          progressStage: `Failed to load ${event.packageId}`,
        }));
      }
    };

    // Handle status updates
    const handleStatusUpdated = (event: {
      status: {
        lexiconStats?: Array<{ lexiconId: string; version?: string }>;
        statistics?: Record<string, unknown>;
      };
    }) => {
      logger.debug("Status updated event received", event);

      const payload = event.status || (event as unknown as any);
      if (payload.lexiconStats) {
        const loadedPackages = payload.lexiconStats.map((ls) =>
          ls.version ? `${ls.lexiconId}:${ls.version}` : ls.lexiconId
        );
        setState((prev) => ({
          ...prev,
          loadedPackages: Array.from(
            new Set([...(prev.loadedPackages || []), ...loadedPackages])
          ),
          statistics: payload.statistics ? {
            totalWords: (payload.statistics as any).totalWords ?? 0,
            totalSynsets: (payload.statistics as any).totalSynsets ?? 0,
            totalSenses: (payload.statistics as any).totalSenses ?? 0,
            totalILIs: (payload.statistics as any).totalILIs ?? 0,
            totalRelations: (payload.statistics as any).totalRelations ?? 0,
            totalDefinitions: (payload.statistics as any).totalDefinitions ?? 0,
            totalLexicons: (payload.statistics as any).totalLexicons ?? 1,
            languages: (payload.statistics as any).languages ?? ['en'],
            partsOfSpeech: (payload.statistics as any).partsOfSpeech ?? ['n', 'v', 'a', 'r'],
            dataSize: (payload.statistics as any).dataSize ?? 0,
            lastUpdated: new Date().toISOString(),
            source: (payload.statistics as any).source ?? 'Worker' as const,
            posDistribution: (payload.statistics as any).posDistribution ?? {}
          } : undefined,
          progressStage:
            loadedPackages.length > 0
              ? "Ready - Packages loaded"
              : "Ready - No packages loaded",
        }));
      }
    };

    // Handle errors
    const handleError = (event: { error: string; context: string }) => {
      logger.warn("Worker error event received", event);
      setState((prev) => ({
        ...prev,
        error: `Worker error (${event.context}): ${event.error}`,
        progressStage: "Error occurred",
      }));
    };

    // Add event listeners
    wc.addEventListener("lexiconsChanged", handleLexiconsChanged);
    wc.addEventListener("packageLoaded", handlePackageLoaded);
    wc.addEventListener("statusUpdated", handleStatusUpdated);
    wc.addEventListener("error", handleError);

    // Cleanup event listeners
    return () => {
      wc.removeEventListener("lexiconsChanged", handleLexiconsChanged);
      wc.removeEventListener("packageLoaded", handlePackageLoaded);
      wc.removeEventListener("statusUpdated", handleStatusUpdated);
      wc.removeEventListener("error", handleError);
    };
  }, []); // Only run once on mount, event listeners will be set up when worker client is available

  // Initialize WordNet instance (run once on mount)
  const initializeWordNet = async () => {
    logger.start("WordNet initialization");
    logger.step("setting initial state");

    setState((prev) => ({
      ...prev,
      loading: true,
      isInitializing: true,
      progressStage: "Loading SQLite WASM...",
    }));

    try {
      // Initialize worker client for heavy operations (if enabled)
      const wc = workerClientRef.current;
      logger.debug("Checking worker client for initialization", { 
        hasWorkerClient: !!wc, 
        isInitialized: wc?.initialized,
        enableWorkers: config?.enableWorkers,
        initializationStarted: initializationStartedRef.current
      });
      
      // Check if worker client is still available (might have been disposed by React StrictMode)
      if (!wc) {
        logger.warn("Worker client not available during initialization, skipping");
        setState((prev) => ({
          ...prev,
          isInitializing: false,
          loading: false,
          progressStage: "Worker client not available",
        }));
        return;
      }
      
      if (!wc.initialized && config?.enableWorkers !== false) {
        try {
          logger.step("initializing worker client");
          // Let the WordNetWorkerClient handle all worker initialization
          await wc.initialize(config?.workerUrl);

          logger.success("Worker client initialized");
        } catch (error) {
          logger.warn(
            "Failed to initialize worker client",
            { error }
          );
          throw error; // Don't fall back, just fail
        }
      }

      // Use worker client for initialization
      try {
        logger.step("using worker client for initialization");
        const data: any = await wc.getStatus();
        logger.success("Worker initialization successful");
        logger.debug("Worker result data", data);

        // Populate loaded packages and minimal stats from worker (if provided)
        try {
          const lexStats = data.lexiconStats || [];
          const loaded = Array.isArray(lexStats)
            ? lexStats.map(
                (ls: any) =>
                  `${ls.lexiconId}${ls.version ? `:${ls.version}` : ""}`
              )
            : [];

          logger.debug("Processing worker data", {
            hasData: !!data,
            hasLexiconStats: !!data.lexiconStats,
            hasStatistics: !!data.statistics,
            loadedCount: loaded.length,
          });

          if (loaded.length > 0 || data.statistics) {
            setState((prev) => ({
              ...prev,
              loadedPackages: loaded,
              statistics: data.statistics
                ? {
                    totalWords: data.statistics.totalWords ?? 0,
                    totalSynsets: data.statistics.totalSynsets ?? 0,
                    totalSenses: data.statistics.totalSenses ?? 0,
                    totalRelations: 0,
                    totalDefinitions: 0,
                    totalLexicons: 1,
                    languages: ["en"],
                    partsOfSpeech: ["n", "v", "a", "r"],
                    dataSize:
                      (data.statistics.totalWords ?? 0) * 100 +
                      (data.statistics.totalSynsets ?? 0) * 200,
                    lastUpdated: new Date().toISOString(),
                    source: "Worker" as const,
                    posDistribution: {},
                  }
                : prev.statistics,
            }));
          }

          // Check if worker client is still available before proceeding
          if (!workerClientRef.current) {
            logger.warn("Worker client became unavailable during data processing, stopping initialization");
            setState((prev) => ({
              ...prev,
              isInitializing: false,
              loading: false,
              progressStage: "Worker client became unavailable during processing",
            }));
            return;
          }

          // Worker is ready; detect packages, refresh catalog, and finish
          setState((prev) => ({
            ...prev,
            isReady: true,
            loading: false,
            isInitializing: false,
            progressStage: "Worker ready - Detecting packages...",
          }));
          logger.debug("Worker ready, detecting existing packages");
          await detectExistingPackages();
          await refreshPackages();
          return;
        } catch (e) {
          logger.warn("Failed to process worker data", { error: e });
          
          // Check if worker client is still available before proceeding
          if (!workerClientRef.current) {
            logger.warn("Worker client became unavailable during error handling, stopping initialization");
            setState((prev) => ({
              ...prev,
              isInitializing: false,
              loading: false,
              progressStage: "Worker client became unavailable during error handling",
            }));
            return;
          }
          
          setState((prev) => ({
            ...prev,
            isReady: true,
            loading: false,
            isInitializing: false,
            progressStage: "Worker ready - Detecting packages...",
          }));
          logger.debug("Worker ready, detecting existing packages");
          await detectExistingPackages();
          await refreshPackages();
          return;
        }
      } catch (error) {
        logger.error("Worker initialization failed", { error });
        throw error; // Don't fall back, just fail
      }

    } catch (error) {
      logger.fail("Failed to initialize WordNet", error);
      logger.end("WordNet initialization");
      setState((prev) => ({
        ...prev,
        error: error instanceof Error ? error.message : "Unknown error",
        isInitializing: false,
        progressStage: "Initialization failed",
        loading: false,
      }));
    }
  };

  // Load package data with caching
  const loadPackageData = useCallback(
    async (packageId: string, progress?: ProgressCallback) => {
      // Check if we have a worker client
      if (!workerClientRef.current?.initialized) {
        logger.warn("Worker client not initialized, queuing package load request", { packageId });
        // Add to pending queue for when worker is ready
        pendingPackageLoads.current.push({ packageId, progress });
        setState((prev) => ({
          ...prev,
          error: `Worker not ready yet. Package ${packageId} will be loaded when worker initializes.`,
          progressStage: "Waiting for worker to initialize...",
        }));
        return; // Don't throw, just return early
      }

      logger.start(`loading package ${packageId}`);
      logger.step("checking cache status", { packageId });

      setState((prev) => ({
        ...prev,
        loading: true,
        progress: 0,
        progressStage: `Checking cache for ${packageId}...`,
      }));

      try {
        logger.step("downloading from server", { packageId });
        setState((prev) => ({
          ...prev,
          progressStage: `Downloading ${packageId}...`,
        }));

        // Use worker client for package loading
        logger.step("using worker client for package loading", {
          packageId,
        });
        const result = await workerClientRef.current.loadPackage(packageId);
        if (result) {
          logger.success("Worker package loading successful");
          logger.end(`loading package ${packageId}`, {
            source: "worker",
            method: "client",
          });
        } else {
          throw new Error("Worker package loading failed");
        }

        setState((prev) => ({
          ...prev,
          loading: false,
          progress: 1,
          progressStage: "Complete",
          loadedPackages: [...new Set([...prev.loadedPackages, packageId])],
        }));

        // Update statistics asynchronously to avoid blocking UI
        logger.step("updating statistics", { packageId });
        setState((prev) => ({
          ...prev,
          progressStage: "Updating statistics...",
          progress: 0.95,
        }));

        try {
          // Get statistics from worker
          const resp = await workerClientRef.current.getStatus();
          if (resp && resp.statistics) {
            const totalWords = resp.statistics.totalWords;
            const totalSynsets = resp.statistics.totalSynsets;
            const totalSenses = resp.statistics.totalSenses;
            const totalILIs = resp.statistics.totalILIs;
            const posDistribution = resp.posDistribution;

            const uiStatistics = {
              totalWords,
              totalSynsets,
              totalSenses,
              totalILIs,
              totalRelations: 0,
              totalDefinitions: 0,
              totalLexicons: 1,
              languages: ["en"],
              partsOfSpeech: ["n", "v", "a", "r"],
              dataSize: totalWords * 100 + totalSynsets * 200,
              lastUpdated: new Date().toISOString(),
              source: "Worker" as const,
              posDistribution,
            };

            setState((prev) => ({
              ...prev,
              statistics: uiStatistics,
              integrity: null,
              dataSource: {
                type: "worker" as const,
                initialized: true,
                error: undefined,
              },
            }));
          }
        } catch (e) {
          console.warn("Failed to update statistics:", e);
          // Continue without statistics rather than failing completely
        }
      } catch (error) {
        console.error("Failed to load package:", error);
        setState((prev) => ({
          ...prev,
          loading: false,
          error: error instanceof Error ? error.message : "Unknown error",
          progressStage: "Failed to load package",
        }));
      }
    },
    []
  );

  // Load demo data with caching
  const loadDemoData = useCallback(
    async (progress?: ProgressCallback) => {
      if (!workerClientRef.current?.initialized) {
        logger.warn("Worker client not initialized, demo data load will be queued");
        setState((prev) => ({
          ...prev,
          error: "Worker not ready yet. Demo data will be loaded when worker initializes.",
          progressStage: "Waiting for worker to initialize...",
        }));
        return; // Don't throw, just return early
      }

      console.log("🚀 Starting demo data load...");
      setState((prev) => ({
        ...prev,
        loading: true,
        progress: 0,
        progressStage: "Loading demo data...",
      }));

      try {
        console.log("📦 Attempting to load oewn:2024...");

        // Use worker client for demo data loading
        console.log("🔧 Using worker client for demo data loading...");
        const result = await workerClientRef.current.loadDemoData();
        if (result) {
          console.log("✅ Worker demo data loading successful");
          // Load the package data to ensure it's available for queries
          await loadPackageData("oewn:2024", progress);
        } else {
          throw new Error("Worker demo data loading failed");
        }

        console.log("✅ Demo data loaded successfully");
      } catch (error) {
        console.error("❌ Failed to load demo data:", error);
        setState((prev) => ({
          ...prev,
          loading: false,
          error: error instanceof Error ? error.message : "Unknown error",
          progressStage: "Failed to load demo data",
        }));
      }
    },
    [loadPackageData]
  );

  // Query words
  const queryWords = useCallback(
    async (term: string) => {
      const wc = workerClientRef.current;
      if (!wc?.initialized) {
        throw new Error("Worker not available");
      }
      
      try {
        const result = await wc.queryWords(term);
        if (result && result.length > 0) return result;
        return [];
      } catch (error) {
        logger.error("Worker query failed", { error });
        throw error;
      }
    },
    []
  );

  // Query synsets
  const querySynsets = useCallback(
    async (term: string) => {
      const wc = workerClientRef.current;
      if (!wc?.initialized) {
        throw new Error("Worker not available");
      }
      
      try {
        const result = await wc.querySynsets(term);
        if (result && result.length > 0) return result;
        return [];
      } catch (error) {
        logger.error("Worker query failed", { error });
        throw error;
      }
    },
    []
  );

  // Query senses
  const querySenses = useCallback(
    async (term: string) => {
      const wc = workerClientRef.current;
      if (!wc?.initialized) {
        throw new Error("Worker not available");
      }
      
      try {
        const result = await wc.querySenses(term);
        if (result && result.length > 0) return result;
        return [];
      } catch (error) {
        logger.error("Worker query failed", { error });
        throw error;
      }
    },
    []
  );

  // Unload data
  const unloadData = useCallback(async () => {
    try {
      setState((prev) => ({ ...prev, loading: true }));

      // Use worker client for clearing data if available and initialized
      if (workerClientRef.current?.initialized) {
        try {
          const result = await workerClientRef.current.clearData();
          if (result) {
            console.log("✅ Worker data clearing successful");
          } else {
            console.warn("⚠️ Worker data clearing failed, clearing local state only");
          }
        } catch (error) {
          console.warn("⚠️ Worker data clearing failed, clearing local state only:", error);
        }
      } else {
        // Worker not ready, just clear local state
        console.log("🔧 Worker client not initialized, clearing local state only");
      }

      setState((prev) => ({
        ...prev,
        loadedPackages: [],
        statistics: undefined,
        integrity: null,
        dataSource: null,
        loading: false,
      }));

      console.log("✅ Data unloaded successfully");
    } catch (error) {
      console.error("❌ Failed to unload data:", error);
      setState((prev) => ({ ...prev, loading: false }));
    }
  }, []);

  // Clear cache and unload data
  const clearCacheAndUnload = useCallback(async () => {
    try {
      setState((prev) => ({
        ...prev,
        loading: true,
        progressStage: "Clearing cache...",
      }));
      
      if (workerClientRef.current?.initialized) {
        // Clear cache first
        await workerClientRef.current.clearCache();
        // Then clear data
        await workerClientRef.current.clearData();
      } else {
        // Worker not ready, just clear local state
        logger.warn("Worker client not initialized, clearing local state only");
      }
      
      setState((prev) => ({
        ...prev,
        loadedPackages: [],
        statistics: undefined,
        integrity: null,
        dataSource: null,
        loading: false,
        progressStage: "Cache cleared and data unloaded",
      }));
    } catch (error) {
      logger.fail("Failed to clear cache and unload data", error);
      setState((prev) => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : String(error),
      }));
    }
  }, []);

  // Get cache info
  const getCacheInfo = useCallback(async () => {
    // Use worker client for cache info if available and initialized
    if (workerClientRef.current?.initialized) {
      try {
        const result = await workerClientRef.current.getCacheInfo();
        return result;
      } catch (error) {
        logger.warn("Failed to get cache info from worker", { error });
        // Fall through to fallback
      }
    }
    
    // Fallback: return basic storage availability info when worker isn't ready
    const hasStorageQuota = "storage" in navigator && "estimate" in navigator.storage;
    const hasIndexedDB = "indexedDB" in window;
    const hasLocalStorage = "localStorage" in window;
    const hasSessionStorage = "sessionStorage" in window;

    return {
      hasStorageQuota,
      hasIndexedDB,
      hasLocalStorage,
      hasSessionStorage,
      source: "fallback" as const,
      hasData: false, // Assume no data until worker is ready
    };
  }, []);

  // Check if worker client is ready for operations
  const isWorkerReady = useCallback(() => {
    return state.workerReady;
  }, [state.workerReady]);

  return {
    ...state,
    loadPackageData,
    loadDemoData,
    queryWords,
    querySynsets,
    querySenses,
    unloadData,
    refreshPackages,
    getLexiconInfo,
    getCurrentLexicons,
    testMemoryQueries,
    getSensesByWordIdOrForm,
    getWordsBySynsetAndLanguage,
    getDefinitionsBySynsetId,
    getSynsetById,
    getWordsByIliAndLanguage,
    getWordsByIliAndLexiconPrefix,
    searchWordsInLexicon,
    clearCacheAndUnload,
    getCacheInfo,
    isWorkerReady,
    hasPendingLoads,
    hasInitializationStarted,
  };
}

// NOTE: This hook now uses a pure worker-first architecture where all operations
// go through WordNetWorkerClient → WordNetWorker → WordNetOrchestrator → DataLoader.
// The hook no longer directly accesses DataLoader or WebWordnet instances.
// There are no main-thread fallbacks - all operations require the worker to be ready.
// This ensures UI responsiveness and proper separation of concerns.
