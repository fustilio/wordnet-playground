/**
 * Low-level WordNet API for advanced users
 * 
 * This module provides direct access to the underlying database and query systems
 * for users who need fine-grained control over WordNet operations.
 * 
 * @example
 * ```typescript
 * import { Database, QueryService, Kernel } from 'wn-ts-node/low-level';
 * 
 * // Direct database access
 * const db = new Database({ filename: './custom.db' });
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

export { NodeKyselyDatabase } from '../database/node-kysely-database.js';
export { KyselyQueryService } from '../database/kysely-query-service.js';
export type { Database } from '../database/types/database.js';

// ============================================================================
// KERNEL LAYER
// ============================================================================

export { NodeWordNetKernel } from '../wordnet-kernel.js';
export { NodeWordNetCore } from '../wordnet-core.js';

// ============================================================================
// QUERY BUILDERS
// ============================================================================

// Query builders are available through the query service
// export { 
//   WordQueryBuilder,
//   SynsetQueryBuilder,
//   SenseQueryBuilder,
//   ILIQueryBuilder 
// } from '../database/query-builders/index.js';

// ============================================================================
// PLUGINS
// ============================================================================

export { 
  RelationsPlugin,
  SimilarityPlugin,
  TranslationPlugin 
} from '../plugins/index.js';

// ============================================================================
// UTILITIES
// ============================================================================

export { 
  batchInsert,
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
  NodeDatabaseConfig,
  WebDatabaseConfig as DatabaseConfig,
  QueryStrategy,
  
  // Query types
  WordQuery,
  SynsetQuery,
  SenseQuery,
  
  // Plugin types
  Plugin,
  // Plugin types - these are not exported from core yet
  
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
  NodeDatabaseConfig as NodeWordnetConfig,
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
