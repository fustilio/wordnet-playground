/**
 * Centralized type definitions for wn-ts-web
 * 
 * This file serves as the single source of truth for all types used across wn-ts-web.
 * Types are organized by category and extend core types from wn-ts-core where possible.
 */

import type { Word, Synset, Sense, Definition, Relation, Project } from "wn-ts-core";

// Re-export core types from wn-ts-core
export type { 
  Word, 
  Sense, 
  Synset, 
  Definition, 
  Relation,
  Lexicon,
  PartOfSpeech,
  Project
} from "wn-ts-core";

// ============================================================================
// CORE WORDNET TYPES
// ============================================================================

export interface WordNetStatistics {
  totalWords: number;
  totalSynsets: number;
  totalSenses: number;
  totalILIs?: number;
  totalLexicons: number;
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

// ============================================================================
// LEXICON TYPES
// ============================================================================

export interface LexiconInfo {
  id: string;
  label: string;
  language: string;
  version: string;
  wordCount: number;
  synsetCount: number;
  loadedAt: Date;
}

// ============================================================================
// QUERY RESULT TYPES
// ============================================================================

export interface WordQueryResult extends Pick<Word, 'id' | 'lemma' | 'language' | 'lexicon'> {
  pos: string; // Convert PartOfSpeech to string for UI compatibility
  senses: SenseInfo[];
}

export interface SynsetQueryResult extends Pick<Synset, 'id' | 'ili' | 'language' | 'lexicon'> {
  pos: string; // Convert PartOfSpeech to string for UI compatibility
  definitions: DefinitionInfo[];
  words: WordInfo[];
  relations: RelationInfo[];
}

export interface SenseInfo extends Pick<Sense, 'id' | 'wordId' | 'synsetId' | 'source' | 'sensekey' | 'adjposition'> {
  subcategory?: string;
  domain?: string;
  register?: string;
}

export interface DefinitionInfo extends Pick<Definition, 'id' | 'language' | 'text' | 'source'> {
  synsetId: string; // Add synsetId for UI convenience
}

export interface WordInfo extends Pick<Word, 'id' | 'lemma' | 'language' | 'lexicon'> {
  pos: string; // Convert PartOfSpeech to string for UI compatibility
}

export interface RelationInfo extends Pick<Relation, 'id' | 'type' | 'source'> {
  sourceId: string; // Add sourceId for UI convenience
  targetId: string; // Add targetId for UI convenience
}

// ============================================================================
// PACKAGE TYPES
// ============================================================================

export interface PackageInfo extends Pick<Project, 'id' | 'label' | 'description' | 'url' | 'license' | 'citation'> {
  language?: string;
  versions: string[];
}

// ============================================================================
// WORKER TYPES
// ============================================================================

export interface WorkerStatus {
  initialized: boolean;
  error?: string;
}

// ============================================================================
// EVENT TYPES
// ============================================================================

export interface WordNetEventMap {
  'initialized': { success: boolean; error?: string };
  'packageLoaded': { packageId: string; success: boolean; error?: string; lexiconInfo?: LexiconInfo };
  'packageLoadProgress': { packageId: string; progress: number; message: string };
  'dataCleared': { success: boolean; error?: string };
  'error': { error: string; context: string };
  'statusUpdated': { status: any };
  'lexiconsChanged': { lexicons: LexiconInfo[]; added?: LexiconInfo[]; removed?: string[] };
}

export type WordNetEventListener<K extends keyof WordNetEventMap> = (event: WordNetEventMap[K]) => void;

// Event types based on existing WordNetEventMap
export type LexiconsChangedEvent = WordNetEventMap['lexiconsChanged'];
export type PackageLoadedEvent = WordNetEventMap['packageLoaded'];
export type StatusUpdatedEvent = WordNetEventMap['statusUpdated'];
export type ErrorEvent = WordNetEventMap['error'];

// ============================================================================
// TEST AND DATA SOURCE TYPES
// ============================================================================

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

// ============================================================================
// DATABASE TYPES
// ============================================================================

export interface DatabaseStorageInfo {
  type: 'opfs' | 'memory' | 'unknown';
  persistent: boolean;
  path?: string;
}

// ============================================================================
// REACT HOOK TYPES
// ============================================================================

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

// ============================================================================
// LEXICON INTROSPECTION TYPES
// ============================================================================

export interface LexiconIntrospection {
  // Basic information
  id: string;
  label: string;
  language: string;
  version: string;
  type: 'lexicon' | 'ili';
  
  // Content statistics
  wordCount: number;
  synsetCount: number;
  senseCount: number;
  iliCount?: number; // Only for ILI resources
  
  // Structural information
  hasDefinitions: boolean;
  hasRelations: boolean;
  hasILIMappings: boolean;
  
  // Language-specific features
  supportedPartsOfSpeech: string[];
  supportedLanguages: string[];
  
  // Data quality metrics
  iliCoverage?: number; // Percentage of synsets with ILI mappings
  crossLingualLinks?: number; // Number of cross-language connections
  
  // Metadata
  loadedAt: Date;
  lastUpdated?: Date;
  source: string;
}

export interface ResourceTypeInfo {
  type: 'lexicon' | 'ili' | 'mixed';
  hasCrossLingualMappings: boolean;
  supportedLanguages: string[];
  primaryLanguage: string;
  mappingConfidence: number;
}

export interface CategorizedResources {
  lexicons: LexiconIntrospection[];
  ilis: LexiconIntrospection[];
  mixed: LexiconIntrospection[];
  total: number;
}

export interface CrossLingualAnalysis {
  // Language coverage
  supportedLanguages: string[];
  primaryLanguage: string;
  
  // Cross-lingual mapping coverage
  totalILIMappings: number;
  languagePairCoverage: Record<string, Record<string, number>>;
  
  // Concept coverage analysis
  conceptCoverage: {
    total: number;
    fullyMapped: number; // Available in all languages
    partiallyMapped: number; // Available in some languages
    unmapped: number; // Only available in one language
  };
  
  // Quality metrics
  mappingQuality: {
    averageConfidence: number;
    verifiedMappings: number;
    unverifiedMappings: number;
  };
}

export interface MappingCoverage {
  totalMappings: number;
  languagePairs: Array<{
    source: string;
    target: string;
    mappingCount: number;
    coveragePercentage: number;
  }>;
  conceptDistribution: Record<string, number>;
}

export interface IntegrityReport {
  lexiconId: string;
  isValid: boolean;
  issues: Array<{
    type: 'warning' | 'error' | 'info';
    message: string;
    details?: any;
  }>;
  recommendations: string[];
}

export interface CompatibilityReport {
  compatible: boolean;
  conflicts: Array<{
    type: 'version' | 'language' | 'structure';
    description: string;
    severity: 'low' | 'medium' | 'high';
  }>;
  recommendations: string[];
}
