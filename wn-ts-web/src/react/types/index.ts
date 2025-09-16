/**
 * React-specific types for wn-ts-web
 * 
 * This module exports types that are specifically designed for React usage.
 * These types extend the core types with React-specific functionality.
 */

// Import types first
import type {
  // Core WordNet types
  WordNetStatistics,
  CacheInfo,
  LexiconInfo,
  WordNetEventMap,
  WordNetEventListener,
  
  // Query result types
  WordQueryResult,
  SynsetQueryResult,
  SenseInfo,
  DefinitionInfo,
  WordInfo,
  RelationInfo,
  
  // Package and worker types
  PackageInfo,
  WorkerStatus,
  
  // Event types
  LexiconsChangedEvent,
  PackageLoadedEvent,
  StatusUpdatedEvent,
  ErrorEvent,
  
  // Test and data source types
  MemoryQueryTestResult,
  DataSourceInfo,
  IntegrityInfo,
  
  // Database types
  DatabaseStorageInfo,
  
  // Lexicon introspection types
  LexiconIntrospection,
  ResourceTypeInfo,
  CategorizedResources,
  CrossLingualAnalysis,
  MappingCoverage,
  IntegrityReport,
  CompatibilityReport
} from '../../types/index.js';

// Re-export core types that are commonly used in React components
export type {
  // Core WordNet types
  WordNetStatistics,
  CacheInfo,
  LexiconInfo,
  WordNetEventMap,
  WordNetEventListener,
  
  // Query result types
  WordQueryResult,
  SynsetQueryResult,
  SenseInfo,
  DefinitionInfo,
  WordInfo,
  RelationInfo,
  
  // Package and worker types
  PackageInfo,
  WorkerStatus,
  
  // Event types
  LexiconsChangedEvent,
  PackageLoadedEvent,
  StatusUpdatedEvent,
  ErrorEvent,
  
  // Test and data source types
  MemoryQueryTestResult,
  DataSourceInfo,
  IntegrityInfo,
  
  // Database types
  DatabaseStorageInfo,
  
  // Lexicon introspection types
  LexiconIntrospection,
  ResourceTypeInfo,
  CategorizedResources,
  CrossLingualAnalysis,
  MappingCoverage,
  IntegrityReport,
  CompatibilityReport
} from '../../types/index.js';

// React-specific types
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

// React hook return type
export interface WordNetHookReturn extends WordNetState {
  loadPackageData: (packageId: string, progress?: ProgressCallback) => Promise<void>;
  queryWords: (term: string) => Promise<WordQueryResult[]>;
  querySynsets: (term: string) => Promise<SynsetQueryResult[]>;
  querySenses: (term: string) => Promise<SenseInfo[]>;
  unloadData: () => Promise<void>;
  refreshPackages: () => Promise<void>;
  getLexiconInfo: (id?: string) => LexiconInfo[] | undefined;
  getCurrentLexicons: () => LexiconInfo[];
  testMemoryQueries: () => Promise<MemoryQueryTestResult>;
  
  // Bilingual query helpers
  getSensesByWordIdOrForm: (wordIdOrForm: string) => Promise<SenseInfo[]>;
  getWordsBySynsetAndLanguage: (synsetId: string, language: string) => Promise<WordInfo[]>;
  getDefinitionsBySynsetId: (synsetId: string) => Promise<DefinitionInfo[]>;
  getSynsetById: (synsetId: string) => Promise<SynsetQueryResult | undefined>;
  getWordsByIliAndLanguage: (ili: string, language: string) => Promise<WordInfo[]>;
  getWordsByIliAndLexiconPrefix: (ili: string, lexiconPrefix: string) => Promise<WordInfo[]>;
  getIliForSynset: (synsetId: string) => Promise<string | null>;
  searchWordsInLexicon: (term: string, lexicon: string, language?: string) => Promise<WordQueryResult[]>;
  
  // Data management
  clearCacheAndUnload: () => Promise<void>;
  getCacheInfo: () => Promise<CacheInfo>;
  isWorkerReady: () => boolean;
  hasPendingLoads: () => boolean;
  hasInitializationStarted: () => boolean;
  
  // Lexicon introspection and resource analysis
  introspectLexicon: (lexiconId: string) => Promise<LexiconIntrospection>;
  introspectAllResources: () => Promise<LexiconIntrospection[]>;
  detectResourceType: (lexiconId: string) => Promise<ResourceTypeInfo>;
  categorizeResources: () => Promise<CategorizedResources>;
  analyzeCrossLingualCapabilities: () => Promise<CrossLingualAnalysis>;
  getCrossLingualMappingCoverage: () => Promise<MappingCoverage>;
  validateResourceIntegrity: (lexiconId: string) => Promise<IntegrityReport>;
  checkResourceCompatibility: (lexiconIds: string[]) => Promise<CompatibilityReport>;
  
  // Database persistence methods
  isDatabasePersistent: () => Promise<boolean>;
  getDatabaseStorageInfo: () => Promise<DatabaseStorageInfo>;
}

// React context types
export interface WordNetContextValue extends WordNetHookReturn {
  // Additional context-specific methods can be added here
}

// React component prop types
export interface WordNetProviderProps {
  children: React.ReactNode;
  config?: {
    workerUrl?: string;
    enableWorkers?: boolean;
    fallbackToMainThread?: boolean;
  };
}

export interface WordNetConfig {
  workerUrl?: string;
  enableWorkers?: boolean;
  fallbackToMainThread?: boolean;
}

export interface WordNetConfigProviderProps {
  children: React.ReactNode;
  config: WordNetConfig;
}

export * from '../../types/index.js';