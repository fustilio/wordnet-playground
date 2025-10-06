/**
 * Legacy WordNet Web API - Deprecated
 * 
 * This module contains deprecated APIs that are maintained for backward compatibility.
 * These APIs will be removed in a future major version.
 * 
 * @deprecated Use the main API instead: import WordNet from 'wn-ts-web'
 * 
 * @example
 * ```typescript
 * // ❌ Deprecated - Don't use
 * import { WebWordnet, createWebWordnet } from 'wn-ts-web/legacy';
 * 
 * // ✅ Recommended - Use this instead
 * import WordNet from 'wn-ts-web';
 * const wn = WordNet.create('oewn:2024');
 * ```
 */

// ============================================================================
// DEPRECATED CLASSES
// ============================================================================

/**
 * @deprecated Use WordNet.create() instead. Will be removed in v2.0.0
 */
export { WebWordnet } from '../client/submodules/web-wordnet.js';

/**
 * @deprecated Use WordNet.create() instead. Will be removed in v2.0.0
 */
export { createWebWordnet, createDataLoader, createWordNetInstance } from '../factory.js';

/**
 * @deprecated Use WordNet.create() instead. Will be removed in v2.0.0
 */
export { WebWordNetKernel } from '../wordnet-kernel.js';

/**
 * @deprecated Use WordNet.create() instead. Will be removed in v2.0.0
 */
export { WebWordNetCore } from '../wordnet-core.js';

// ============================================================================
// DEPRECATED DATA MANAGEMENT
// ============================================================================

/**
 * @deprecated Use WordNet.create().download() instead. Will be removed in v2.0.0
 */
export { WebDataManager as DataLoader } from '../data-management/index.js';

// ============================================================================
// DEPRECATED WORKER SYSTEM
// ============================================================================

/**
 * @deprecated Use low-level API instead. Will be removed in v2.0.0
 */
export { WordNetOrchestrator } from '../workers/wordnet-orchestrator.js';

/**
 * @deprecated Use low-level API instead. Will be removed in v2.0.0
 */
export { WordNetWorkerClient } from '../client/wordnet-worker-client.js';

/**
 * @deprecated Use low-level API instead. Will be removed in v2.0.0
 */
export { createWordNetWorker } from '../client/utils/worker-factory.js';

// ============================================================================
// DEPRECATED UTILITIES
// ============================================================================

/**
 * @deprecated Use low-level API instead. Will be removed in v2.0.0
 */
export { KyselyQueryService } from '../database/kysely-query-service.js';

/**
 * @deprecated Use low-level API instead. Will be removed in v2.0.0
 */
export { Project } from '../project.js';

/**
 * @deprecated Use low-level API instead. Will be removed in v2.0.0
 */
export {
  TranslationHelper,
  createTranslationHelper,
  quickTranslate,
} from 'wn-ts-core';

/**
 * @deprecated Use low-level API instead. Will be removed in v2.0.0
 */
export {
  parsePackageId,
  formatPackageId,
  isValidPackageId,
  getPackageBase,
  getPackageVersion,
} from 'wn-ts-core';

// ============================================================================
// DEPRECATED TYPES
// ============================================================================

/**
 * @deprecated Use types from main API instead. Will be removed in v2.0.0
 */
export type {
  Word,
  Sense,
  Synset,
  Lexicon,
  ILI,
  PartOfSpeech,
  Definition,
  Relation,
  WordnetConfig,
  WordnetOptions,
  TranslationResult,
  BilingualQueryOptions,
  PackageIdParts,
  QueryOptions,
  Database,
} from 'wn-ts-core';

// ============================================================================
// DEPRECATED ERRORS
// ============================================================================

/**
 * @deprecated Use errors from main API instead. Will be removed in v2.0.0
 */
export {
  WnError,
  DatabaseError,
  ConfigurationError,
  ProjectError,
  WnWarning,
} from 'wn-ts-core';

// ============================================================================
// DEPRECATED EVENT SYSTEM
// ============================================================================

/**
 * @deprecated Use low-level API instead. Will be removed in v2.0.0
 */
export { WordNetEventEmitter, WordNetEvents } from '../event-emitter.js';

/**
 * @deprecated Use low-level API instead. Will be removed in v2.0.0
 */
export type { EventCallback, WordNetEventName } from '../event-emitter.js';
