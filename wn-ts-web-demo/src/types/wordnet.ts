// Import core types from wn-ts-web
import type { 
  WebWordnet,
  DataLoader,
  DatabaseStatistics,
  LexiconInfo as WnTsLexiconInfo,
  IntegrityInfo
} from 'wn-ts-web';

// Re-export wn-ts-web types for convenience
export type { 
  WebWordnet,
  DataLoader,
  DatabaseStatistics,
  WnTsLexiconInfo
};

// Extended lexicon info for the demo (only add what's not in wn-ts-web)
export interface LexiconInfo extends WnTsLexiconInfo {
  // Note: wn-ts-web uses loadedAt: Date, so we keep that
  // Only add demo-specific extensions if needed
}

// Re-export types from wn-ts-web that are now available there
export type {
  WordNetStatistics,
  CacheInfo,
  WordQueryResult,
  SynsetQueryResult,
  SenseInfo,
  DefinitionInfo,
  WordInfo,
  RelationInfo,
  PackageInfo,
  WorkerStatus,
  LexiconsChangedEvent,
  PackageLoadedEvent,
  StatusUpdatedEvent,
  ErrorEvent,
  MemoryQueryTestResult,
  DataSourceInfo,
  IntegrityInfo
} from 'wn-ts-web';

// Storage and database types (moved from index.ts)
export interface StorageInfo {
  total: number;
  used: number;
  available: number;
  databases: DatabaseInfo[];
}

export interface DatabaseInfo {
  name: string;
  size: number;
  lastModified: Date;
  tables: string[];
}

// Type aliases for wn-ts-web return types
export type WordNetStats = Awaited<ReturnType<WebWordnet['getStatistics']>>;
export type WordNetPosDistribution = Awaited<ReturnType<WebWordnet['getPartOfSpeechDistribution']>>;
export type WordNetLexiconStats = Awaited<ReturnType<WebWordnet['getLexiconStatistics']>>;

export interface StatisticsBundle {
  statistics: WordNetStats;
  posDistribution: WordNetPosDistribution;
  lexiconStats: WordNetLexiconStats;
}

// Legacy interface for backward compatibility
export interface WordNetTotals {
  totalWords: number;
  totalSynsets: number;
  totalSenses: number;
  totalRelations?: number;
  totalDefinitions?: number;
  languages?: string[];
  partsOfSpeech?: string[];
  dataSize?: number;
  lastUpdated?: string;
  source?: string;
  posDistribution?: Record<string, number>;
}

// Alias for backward compatibility
export type WordNetIntegrityInfo = IntegrityInfo;