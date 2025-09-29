/**
 * Wordnet Interface - TypeScript Port
 * 
 * A modern TypeScript implementation of the wn library for accessing WordNet data.
 * This package is environment-agnostic and provides interfaces and abstract classes.
 * Concrete implementations are provided by environment-specific packages.
 * 
 * ## Core Architecture
 * 
 * The library is built around a kernel-based architecture with the following main components:
 * - **WordNetKernel**: The main entry point for WordNet operations
 * - **WordNetCore**: Core interface for database operations
 * - **Plugins**: Optional functionality that can be loaded dynamically
 * 
 * ## Main Exports
 * 
 * ### Core Classes and Functions
 * - `WordNetKernel` - Main kernel class for WordNet operations
 * - `createWordNet` - Factory function to create WordNet instances
 * - `WordNetCore` - Core interface for database operations
 * 
 * ### Database Types
 * - `Database` - Main database interface
 * - `LexiconTable`, `WordTable`, `SynsetTable`, etc. - Table type definitions
 * - `NodeDatabaseConfig`, `WebDatabaseConfig` - Database configuration types
 * 
 * ### Query and Data Management
 * - `batchInsert` - Batch insert operations
 * - `BaseKyselyQueryService` - Base query service class
 * - `SchemaBuilder` - Database schema builder
 * 
 * ### Configuration and Utilities
 * - Project configuration functions and types
 * - Download and archive utilities
 * - Logging utilities
 * - Validation utilities
 * 
 * ### Plugins and Extensions
 * - Relation plugins for semantic relationships
 * - Morphology plugins for word forms
 * - Translation utilities
 */

// ============================================================================
// CORE ARCHITECTURE
// ============================================================================

// Main kernel and core interfaces
export { 
  WordNetKernel, 
  createWordNet
} from './wordnet-kernel.js';
export type { 
  WordNetCore,
  KyselyDatabase,
  WordNetWithPlugins,
  Plugin,
  PluginMethod,
  PluginSchemaRequirements,
  HealthCheckResult,
  ConflictResolutionStrategy
} from './wordnet-kernel.js';

// Core functionality
export {
  // Core validation functions
  validateSynsetData,
  validateSenseData,
  validateWordData,
  validateRelation,
  validateWordnetData
} from './core/index.js';

// Core types
export type {
  // Basic types
  PartOfSpeech,
  Form,
  Pronunciation,
  Tag,
  Count,
  Example,
  Definition,
  Relation,
  SyntacticBehaviour,
  Word,
  Sense,
  Synset,
  ILI,
  Lexicon,
  Project,
  // Query types
  WordQuery,
  SynsetQuery,
  SenseQuery,
  // Configuration types
  WordnetConfig,
  WordnetOptions,
  DownloadOptions,
  AddOptions,
  ExportOptions
} from './core/types.js';

// ============================================================================
// DATABASE TYPES AND CONFIGURATION
// ============================================================================

// Database table types
export type { 
  Database,
  LexiconTable, 
  WordTable, 
  SynsetTable, 
  SenseTable, 
  DefinitionTable, 
  RelationTable, 
  ExampleTable, 
  IliTable, 
  FormTable,
  NewLexicon,
  NewWord,
  NewSynset,
  NewSense,
  NewDefinition,
  NewExample,
  NewRelation,
  NewILI,
  NewForm
} from './types/database.js';

// Database configuration types
export type { 
  BaseDatabaseConfig,
  NodeDatabaseConfig,
  WebDatabaseConfig,
  DatabaseStats,
  DatabaseConnectionState
} from './shared/database-config.js';

// ============================================================================
// DATABASE OPERATIONS
// ============================================================================

// Shared database utilities
export {
  BaseKyselyQueryService,
  batchInsert,
  SchemaBuilder,
  DatabaseUtils
} from './shared/index.js';

// Database operations
export {
  insertRecord,
  insertRecords
} from './modules/database-operations/mutations/index.js';

// Query strategy types
export type { 
  QueryStrategy, 
  QueryOptions 
} from './shared/index.js';

// Common interfaces
export type { QueryService } from './shared/index.js';

// ============================================================================
// PROJECT CONFIGURATION
// ============================================================================

// Project configuration functions
export {
  DEFAULT_PROJECTS,
  DEFAULT_PROXY_CONFIG,
  FALLBACK_URLS,
  getProjectConfig,
  getProjectVersionConfig,
  getProjectUrls,
  getFallbackUrls,
  getAllProjectUrls,
  projectExists,
  getAllProjectIds,
  validateProjectId,
  getProxyUrl,
  needsProxy
} from './config/project-config.js';

// Project configuration types
export type {
  ProjectConfig,
  ProjectVersionConfig,
  ProxyConfig,
  DataSourceConfig
} from './config/project-config.js';

// Project management
export type { ProjectIndex } from './modules/data-management/project.js';

// ============================================================================
// DATA MANAGEMENT
// ============================================================================

// Data management functions
export {
  download,
  loadLexicalResource,
  getProjects,
  getProject,
  getProjectVersions,
  getProjectVersionUrls,
  getProjectVersionError,
  loadProjectIndex,
  clearProjectIndexCache,
  isILI,
  loadILI,
  SharedDataManager
} from './modules/data-management/index.js';

// Data management types
export type { 
  DataManagerOptions,
  DataManagerLogger,
  DataManagerAdapter,
  DataManagerProjectInfo
} from './modules/data-management/shared-data-manager.js';
export type { IliRecord } from './modules/data-management/ili.js';

// ============================================================================
// PLUGINS AND EXTENSIONS
// ============================================================================

// Morphology plugins
export {
  Morphy,
  createMorphy,
  morphy
} from './modules/morphology/index.js';
export type { MorphyResult } from './modules/morphology/index.js';

// Relation plugins
export {
  hypernyms,
  shortestPath,
  maxDepth,
  lowestCommonHypernyms,
  roots,
  leaves,
  taxonomyDepth,
  hypernymPaths,
  minDepth,
  taxonomyShortestPath,
  getHypernyms,
  getHyponyms,
  getMeronyms,
  getHolonyms,
  getEntailments,
  getSimilarTos,
  getRelationsByType,
  getAllRelations
} from './modules/relations/index.js';

// Comprehensive relation methods
export {
  comprehensiveRelationMethods,
  RELATION_CATEGORIES,
  ALL_RELATION_TYPES,
  RELATION_DESCRIPTIONS
} from './plugins/relations/comprehensive-relations.js';

// Translation utilities
export {
  TranslationHelper,
  createTranslationHelper,
  quickTranslate
} from './shared/translation-utils.js';
export type {
  TranslationResult,
  BilingualQueryOptions
} from './shared/translation-utils.js';

// ============================================================================
// LMF (LEXICAL MARKUP FRAMEWORK)
// ============================================================================

// LMF parsers
export type { 
  LMFParser as LMFXMLParser, 
  LMFDocument, 
  LMFLoadOptions 
} from './parsers/index.js';
export { StreamingSaxParser } from './parsers/index.js';

// LMF utilities
export type { 
  Lexicon as LMFlexicon
} from './lmf.js';
export { 
  analyzeXMLContent,
  parseLMFXML,
  createMinimalLMF
} from './lmf.js';

// ============================================================================
// UTILITIES
// ============================================================================

// File and download utilities
export { 
  downloadFile, 
  DownloadError 
} from './utils/download.js';

// Archive utilities
export { 
  extractTarArchive, 
  decompressXz, 
  decompressGz, 
  findLMFiles 
} from './utils/archive.js';

// Package ID utilities
export { 
  parsePackageId, 
  formatPackageId, 
  isValidPackageId, 
  getPackageBase, 
  getPackageVersion 
} from './utils/package-id.js';
export type { PackageIdParts } from './utils/package-id.js';

// Logging utilities
export { 
  logger, 
  Logger, 
  LogLevel 
} from './utils/logger.js';

// Validation utilities
export {
  validateLMFDataIntegrity,
  fileOperations
} from './validation.js';
export type {
  ValidationResult,
  ValidationDifference,
  DatabaseAdapter,
  ValidationOptions
} from './validation.js';

// Environment utilities
export {
  config,
  ConfigManager,
  PlaceholderConfigManager
} from './modules/environment/index.js';
export type {
  ProjectVersion,
  ProjectInfo,
  Config
} from './modules/environment/index.js';

// ============================================================================
// ERROR HANDLING
// ============================================================================

export { 
  WnError,
  DatabaseError,
  ConfigurationError,
  ProjectError,
  WnWarning
} from './core/errors.js';

// ============================================================================
// VERSION
// ============================================================================

export const __version__ = '0.1.1';