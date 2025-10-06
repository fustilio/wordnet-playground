/**
 * Low-level WordNet Web API for advanced users
 * 
 * This module provides direct access to the underlying database and query systems
 * for users who need fine-grained control over WordNet operations in the browser.
 * 
 * @example
 * ```typescript
 * import { Database, QueryService, Kernel } from 'wn-ts-web/low-level';
 * 
 * // Direct database access
 * const db = new Database({ storage: 'opfs' });
 * await db.initialize();
 * 
 * // Raw SQL queries
 * const results = await db.query('SELECT * FROM synsets WHERE form = ?', ['computer']);
 * 
 * // Query service for type-safe queries
 * const queryService = new QueryService(db);
 * const synsets = await queryService.synsets({ form: 'computer' });
 * 
 * // Kernel for plugin architecture
 * const kernel = new Kernel(db, [relationsPlugin, similarityPlugin]);
 * ```
 */

// ============================================================================
// DATABASE LAYER
// ============================================================================

export { KyselyQueryService } from '../database/kysely-query-service.js';
// Database types are defined locally for now
export interface Database {
  // Placeholder interface
}

// ============================================================================
// KERNEL LAYER
// ============================================================================

export { WebWordNetKernel } from '../wordnet-kernel.js';
export { WebWordNetCore } from '../wordnet-core.js';

// ============================================================================
// WORKER SYSTEM
// ============================================================================

export { 
  WordNetOrchestrator,
  WordNetWorkerClient,
  createWordNetWorker
} from '../workers/index.js';

// ============================================================================
// PLUGINS
// ============================================================================

export { 
  RelationsPlugin,
  SimilarityPlugin,
  TranslationPlugin,
  relationsPlugin,
  similarityPlugin,
  translationPlugin,
  availablePlugins,
  getPlugin,
  getAllPlugins
} from '../plugins/index.js';

// ============================================================================
// UTILITIES
// ============================================================================

export { 
  downloadFile,
  extractTarArchive 
} from 'wn-ts-core';

export {
  parseLMFXML,
  createMinimalLMF,
  validateSynsetData
} from 'wn-ts-core';

// ============================================================================
// TYPES
// ============================================================================

export type {
  // Database types
  WebDatabaseConfig,
  QueryStrategy,
  
  // Query types
  WordQuery,
  SynsetQuery,
  SenseQuery,
  
  // Plugin types
  Plugin,
  
  // Core types
  Word,
  Sense,
  Synset,
  ILI,
  Lexicon,
  Project,
  PartOfSpeech,
  Definition,
  Relation,
  
  // Configuration
  WordnetConfig,
  WordnetOptions,
} from 'wn-ts-core';

// ============================================================================
// ERRORS
// ============================================================================

export {
  WnError,
  DatabaseError as CoreDatabaseError,
  ConfigurationError as CoreConfigurationError,
  ProjectError,
  WnWarning,
} from 'wn-ts-core';
