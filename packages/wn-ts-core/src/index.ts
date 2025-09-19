/**
 * Wordnet Interface - TypeScript Port
 * 
 * A modern TypeScript implementation of the wn library for accessing WordNet data.
 * This package is environment-agnostic and provides interfaces and abstract classes.
 * Concrete implementations are provided by environment-specific packages.
 */

// Core abstract classes removed - use WordNetCore interface instead

// New kernel-based architecture (recommended)
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
export * from './core/index.js';

// Core modules (essential functionality)
export * from './modules/index.js';

// Basic query functions are now available through the WordNetCore client

// True plugins (optional functionality)
export * from './plugins/index.js';

// Abstract query classes have been replaced by Kysely-based implementations

// Shared Kysely-based implementations
export * from './shared/index.js';

// Additional utilities (environment-agnostic)
export { downloadFile, DownloadError } from './utils/download.js';
export { logger, Logger, LogLevel } from './utils/logger.js';
export { extractTarArchive, decompressXz, decompressGz, findLMFiles } from './utils/archive.js';
export { parsePackageId, formatPackageId, isValidPackageId, getPackageBase, getPackageVersion } from './utils/package-id.js';
export type { PackageIdParts } from './utils/package-id.js';

// Query strategy types
export type { QueryStrategy, QueryOptions } from './shared/base-query-service.js';

// LMF Parsers module (environment-agnostic)
export type { LMFParser as LMFXMLParser, LMFDocument, LMFLoadOptions } from './parsers/index.js';
export { StreamingSaxParser } from './parsers/index.js';

// LMF utilities - use explicit exports to avoid conflicts
export type { 
  Lexicon as LMFlexicon
} from './lmf.js';
export { 
  analyzeXMLContent,
  parseLMFXML,
  createMinimalLMF
} from './lmf.js';

// Validation utilities
export * from './validation.js';

// Translation utilities
export * from './shared/translation-utils.js';

// Test utilities (Node.js only - not exported for browser compatibility)
// export * from './test/test-data-manager.js';

// Version
export const __version__ = '0.1.1';

// Additional exports for compatibility
export type { ProjectIndex } from './modules/data-management/project.js';
export { WnError } from './core/errors.js';

 