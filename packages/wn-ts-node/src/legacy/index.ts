/**
 * Legacy WordNet API - Deprecated
 * 
 * This module contains deprecated APIs that are maintained for backward compatibility.
 * These APIs will be removed in a future major version.
 * 
 * @deprecated Use the main API instead: import WordNet from 'wn-ts-node'
 * 
 * @example
 * ```typescript
 * // ❌ Deprecated - Don't use
 * import { Wordnet, KyselyWordnet } from 'wn-ts-node/legacy';
 * 
 * // ✅ Recommended - Use this instead
 * import WordNet from 'wn-ts-node';
 * const wn = WordNet.create('oewn:2024');
 * ```
 */

// ============================================================================
// DEPRECATED CLASSES
// ============================================================================

/**
 * @deprecated Use WordNet.create() instead. Will be removed in v2.0.0
 */
export { Wordnet } from '../wordnet.js';

/**
 * @deprecated Use WordNet.create() instead. Will be removed in v2.0.0
 */
export { KyselyWordnet } from '../kysely-wordnet.js';

/**
 * @deprecated Use WordNet.create() instead. Will be removed in v2.0.0
 */
export { NodeWordNetKernel } from '../wordnet-kernel.js';

/**
 * @deprecated Use WordNet.create() instead. Will be removed in v2.0.0
 */
export { NodeWordNetCore } from '../wordnet-core.js';

// ============================================================================
// DEPRECATED MODULE FUNCTIONS
// ============================================================================

/**
 * @deprecated Use WordNet.create().search() instead. Will be removed in v2.0.0
 */
export {
  word,
  words,
  sense,
  senses,
  synset,
  synsets,
  ili,
  ilis,
} from '../module-functions.js';

/**
 * @deprecated Use WordNet.create().download() instead. Will be removed in v2.0.0
 */
export {
  download,
  add,
  addLexicalResource,
  remove,
  exportData as export,
} from '../data-management/index.js';

/**
 * @deprecated Use WordNet.create().getLexicons() instead. Will be removed in v2.0.0
 */
export {
  projects,
  lexicons,
} from '../module-functions.js';

// ============================================================================
// DEPRECATED UTILITIES
// ============================================================================

/**
 * @deprecated Use low-level API instead. Will be removed in v2.0.0
 */
export * from '../database/index.js';

/**
 * @deprecated Use low-level API instead. Will be removed in v2.0.0
 */
export { config, ConfigManager } from '../config.js';

/**
 * @deprecated Use low-level API instead. Will be removed in v2.0.0
 */
export {
  downloadFile,
  DownloadError,
} from 'wn-ts-core';

/**
 * @deprecated Use low-level API instead. Will be removed in v2.0.0
 */
export {
  getProjects,
  getProject,
  getProjectVersions,
  getProjectVersionUrls,
  getProjectVersionError,
  loadProjectIndex,
  clearProjectIndexCache,
} from 'wn-ts-core';

/**
 * @deprecated Use low-level API instead. Will be removed in v2.0.0
 */
export {
  parseLMFXML,
  createMinimalLMF,
} from 'wn-ts-core';

/**
 * @deprecated Use low-level API instead. Will be removed in v2.0.0
 */
export {
  loadLMF,
  isLMF,
} from '../lmf.js';

/**
 * @deprecated Use low-level API instead. Will be removed in v2.0.0
 */
export {
  TranslationHelper,
  createTranslationHelper,
  quickTranslate,
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
  Project,
  ILI,
  Form,
  Pronunciation,
  Tag,
  Count,
  Example,
  Definition,
  Relation,
  PartOfSpeech,
  WordnetConfig,
  WordnetOptions,
  AddOptions,
  ExportOptions,
  ProjectIndex,
  ProjectVersion,
  LMFDocument,
  LMFLoadOptions,
  TranslationResult,
  BilingualQueryOptions,
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
