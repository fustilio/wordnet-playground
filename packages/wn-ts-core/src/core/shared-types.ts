/**
 * Shared type definitions to eliminate duplication across the codebase
 * 
 * This file contains commonly used types, enums, and constants that are
 * frequently redefined throughout the codebase. By centralizing them here,
 * we eliminate duplication and ensure consistency.
 */

// ============================================================================
// CORE ENUMS AND CONSTANTS
// ============================================================================

/**
 * Part of Speech enumeration
 * Centralized definition to avoid duplication across the codebase
 */
export type PartOfSpeech = 'n' | 'v' | 'a' | 'r' | 's' | 'c' | 'p' | 'i' | 'x' | 'u';

/**
 * Part of Speech values as a readonly array for iteration
 */
export const PARTS_OF_SPEECH: readonly PartOfSpeech[] = ['n', 'v', 'a', 'r', 's', 'c', 'p', 'i', 'x', 'u'] as const;

/**
 * Common parts of speech used in most operations (excluding rare ones)
 */
export const COMMON_PARTS_OF_SPEECH: readonly PartOfSpeech[] = ['n', 'v', 'a', 'r'] as const;

/**
 * Language codes - commonly used language identifiers
 */
export type LanguageCode = string;

/**
 * Common language codes used in the system
 */
export const COMMON_LANGUAGE_CODES = {
  ENGLISH: 'en',
  SPANISH: 'es',
  FRENCH: 'fr',
  GERMAN: 'de',
  ITALIAN: 'it',
  PORTUGUESE: 'pt',
  DUTCH: 'nl',
  JAPANESE: 'ja',
  CHINESE: 'zh',
  RUSSIAN: 'ru'
} as const;

/**
 * Relation types commonly used in WordNet
 */
export type RelationType = 
  | 'hypernym' | 'hyponym'
  | 'meronym' | 'holonym'
  | 'part_meronym' | 'member_meronym' | 'substance_meronym'
  | 'part_holonym' | 'member_holonym' | 'substance_holonym'
  | 'entailment' | 'similar_to'
  | 'antonym' | 'also_see'
  | 'causes' | 'caused_by'
  | 'derivationally_related_form'
  | 'pertainym' | 'attribute'
  | 'instance_hypernym' | 'instance_hyponym'
  | 'domain_topic' | 'domain_region' | 'domain_usage'
  | 'member_of_domain_topic' | 'member_of_domain_region' | 'member_of_domain_usage'
  | 'exemplifies' | 'usage_of'
  | 'in_topic' | 'in_region' | 'in_usage'
  | 'has_topic' | 'has_region' | 'has_usage';

/**
 * Common relation types used in most operations
 */
export const COMMON_RELATION_TYPES: readonly RelationType[] = [
  'hypernym', 'hyponym', 'meronym', 'holonym', 'entailment', 'similar_to'
] as const;

/**
 * ILI (Inter-Lingual Index) status values
 */
export type ILIStatus = 'standard' | 'proposed' | 'deprecated';

/**
 * Export format types
 */
export type ExportFormat = 'json' | 'xml' | 'csv';

/**
 * Database operation types
 */
export type DatabaseOperation = 'create' | 'read' | 'update' | 'delete';

// ============================================================================
// COMMON INTERFACES
// ============================================================================

/**
 * Base entity interface with common fields
 */
export interface BaseEntity {
  id: string;
}

/**
 * Language-aware entity interface
 */
export interface LanguageAwareEntity extends BaseEntity {
  language: LanguageCode;
}

/**
 * Lexicon-aware entity interface
 */
export interface LexiconAwareEntity extends BaseEntity {
  lexicon: string;
}

/**
 * POS-aware entity interface
 */
export interface POSAwareEntity extends BaseEntity {
  pos: PartOfSpeech;
}

/**
 * Text content entity interface
 */
export interface TextContentEntity extends BaseEntity {
  text: string;
  language: LanguageCode;
  source?: string;
}

/**
 * Metadata entity interface
 */
export interface MetadataEntity extends BaseEntity {
  metadata?: Record<string, unknown>;
}

// ============================================================================
// QUERY INTERFACES
// ============================================================================

/**
 * Base query interface with common query parameters
 */
export interface BaseQuery {
  form?: string;
  pos?: PartOfSpeech;
  lexicon?: string | string[];
  language?: LanguageCode;
  searchAllForms?: boolean;
  fuzzy?: boolean;
  maxResults?: number;
  strategy?: string;
}

/**
 * Content query interface for queries that include content
 */
export interface ContentQuery extends BaseQuery {
  includeDefinitions?: boolean;
  includeExamples?: boolean;
  includeRelations?: boolean;
}

/**
 * Pagination interface
 */
export interface PaginationOptions {
  limit?: number;
  offset?: number;
}

/**
 * Sorting interface
 */
export interface SortOptions {
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

// ============================================================================
// VALIDATION INTERFACES
// ============================================================================

/**
 * Validation result interface
 */
export interface ValidationResult<T = unknown> {
  success: boolean;
  data?: T;
  errors?: string[];
}

/**
 * Error context interface
 */
export interface ErrorContext {
  field?: string;
  value?: unknown;
  message: string;
  code?: string;
}

// ============================================================================
// CONFIGURATION INTERFACES
// ============================================================================

/**
 * Base configuration interface
 */
export interface BaseConfig {
  debug?: boolean;
  timeout?: number;
  retries?: number;
}

/**
 * Database configuration interface
 */
export interface DatabaseConfig extends BaseConfig {
  dataDirectory: string;
  downloadDirectory?: string;
  cacheDirectory?: string;
}

/**
 * Plugin configuration interface
 */
export interface PluginConfig extends BaseConfig {
  enabled?: boolean;
  options?: Record<string, unknown>;
}

// ============================================================================
// STATISTICS INTERFACES
// ============================================================================

/**
 * Base statistics interface
 */
export interface BaseStatistics {
  total: number;
  timestamp: Date;
}

/**
 * WordNet statistics interface
 */
export interface WordNetStatistics extends BaseStatistics {
  totalWords: number;
  totalSynsets: number;
  totalSenses: number;
  totalRelations: number;
  totalLexicons: number;
  languages: LanguageCode[];
  partsOfSpeech: PartOfSpeech[];
}

/**
 * Lexicon statistics interface
 */
export interface LexiconStatistics extends BaseStatistics {
  lexiconId: string;
  language: LanguageCode;
  wordCount: number;
  synsetCount: number;
  senseCount: number;
  relationCount: number;
}

// ============================================================================
// UTILITY TYPES
// ============================================================================

/**
 * Make all properties optional except specified ones
 */
export type PartialExcept<T, K extends keyof T> = Partial<T> & Pick<T, K>;

/**
 * Make all properties required except specified ones
 */
export type RequiredExcept<T, K extends keyof T> = Required<T> & Partial<Pick<T, K>>;

/**
 * Extract the value type from a union of string literals
 */
export type ValueOf<T> = T[keyof T];

/**
 * Create a union type from an array of string literals
 */
export type ArrayToUnion<T extends readonly string[]> = T[number];

/**
 * Create a type from the keys of an object
 */
export type KeysOf<T> = keyof T;

/**
 * Create a type from the values of an object
 */
export type ValuesOf<T> = T[keyof T];

// ============================================================================
// TYPE GUARDS
// ============================================================================

/**
 * Type guard for PartOfSpeech
 */
export function isPartOfSpeech(value: string): value is PartOfSpeech {
  return PARTS_OF_SPEECH.includes(value as PartOfSpeech);
}

/**
 * Type guard for LanguageCode
 */
export function isLanguageCode(value: string): value is LanguageCode {
  return typeof value === 'string' && value.length >= 2 && value.length <= 5;
}

/**
 * Type guard for RelationType
 */
export function isRelationType(value: string): value is RelationType {
  return COMMON_RELATION_TYPES.includes(value as RelationType);
}

/**
 * Type guard for ILIStatus
 */
export function isILIStatus(value: string): value is ILIStatus {
  return ['standard', 'proposed', 'deprecated'].includes(value);
}

// ============================================================================
// CONSTANTS
// ============================================================================

/**
 * Default values for common operations
 */
export const DEFAULTS = {
  MAX_RESULTS: 100,
  TIMEOUT: 30000,
  RETRIES: 3,
  PAGE_SIZE: 20,
  FUZZY_THRESHOLD: 0.8,
  CACHE_TTL: 3600000, // 1 hour in milliseconds
} as const;

/**
 * Error codes used throughout the system
 */
export const ERROR_CODES = {
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  NOT_FOUND: 'NOT_FOUND',
  DUPLICATE_ENTRY: 'DUPLICATE_ENTRY',
  INVALID_INPUT: 'INVALID_INPUT',
  DATABASE_ERROR: 'DATABASE_ERROR',
  NETWORK_ERROR: 'NETWORK_ERROR',
  TIMEOUT_ERROR: 'TIMEOUT_ERROR',
  PERMISSION_ERROR: 'PERMISSION_ERROR',
} as const;

/**
 * Common regular expressions
 */
export const REGEX_PATTERNS = {
  ID: /^[a-zA-Z0-9_-]+$/,
  LANGUAGE_CODE: /^[a-z]{2,5}$/,
  EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  URL: /^https?:\/\/.+/,
  SYNSET_ID: /^[a-z]+-[a-z]+-\d+$/,
} as const;
