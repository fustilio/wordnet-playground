import type { WebWordnet } from 'wn-ts-web';

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

export type WordNetStats = Awaited<ReturnType<WebWordnet['getStatistics']>>;
export type WordNetPosDistribution = Awaited<ReturnType<WebWordnet['getPartOfSpeechDistribution']>>;
export type WordNetLexiconStats = Awaited<ReturnType<WebWordnet['getLexiconStatistics']>>;

export interface StatisticsBundle {
  statistics: WordNetStats;
  posDistribution: WordNetPosDistribution;
  lexiconStats: WordNetLexiconStats;
}

export interface WordNetIntegrityInfo {
  isValid: boolean;
  checksum?: string;
  fileSize: number;
  compressionType?: string;
  format: string;
  errors: string[];
  warnings: string[];
  qualityScore: number;
}

export interface DataSourceInfo {
  id: string;
  name: string;
  version: string;
  url: string;
  description: string;
  lastChecked: string;
  status: 'available' | 'unavailable' | 'error';
}
