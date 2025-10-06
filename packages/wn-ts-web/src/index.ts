/**
 * WordNet TypeScript - Web Implementation
 * 
 * A modern TypeScript implementation of WordNet for web browsers.
 * 
 * @version 1.0.0
 * @example
 * ```typescript
 * import WordNet from 'wn-ts-web';
 * 
 * const wn = WordNet.create('oewn:2024');
 * const results = await wn.search('computer');
 * console.log(results[0].definition);
 * ```
 */

// ============================================================================
// MAIN API - The ONE way to use this library
// ============================================================================

/**
 * Create a WordNet instance for web browsers
 * 
 * @param lexicon - Lexicon identifier (e.g., 'oewn:2024')
 * @param options - Configuration options
 * @returns WordNet instance
 * 
 * @example
 * ```typescript
 * import WordNet from 'wn-ts-web';
 * 
 * // Simple usage
 * const wn = WordNet.create('oewn:2024');
 * const results = await wn.search('computer');
 * 
 * // With options
 * const wn = WordNet.create('oewn:2024', {
 *   storage: 'opfs',
 *   cache: true
 * });
 * 
 * // With plugins
 * const wn = WordNet.create('oewn:2024', {
 *   plugins: [relationsPlugin, similarityPlugin]
 * });
 * ```
 */
export { createWebWordnet as create, createWebWordnet } from './wordnet-kernel.js';

/**
 * Default export - same as create()
 * Enables: import WordNet from 'wn-ts-web';
 */
export { createWebWordnet as default } from './wordnet-kernel.js';

/**
 * Main WordNet class (for advanced users who need direct access)
 */
export { WebWordNetKernel } from './wordnet-kernel.js';

// ============================================================================
// TYPES - Essential types only
// ============================================================================

export type {
  // Core WordNet types
  Word,
  Sense,
  Synset,
  Lexicon,
  ILI,
  PartOfSpeech,
  
  // Configuration
  WebDatabaseConfig,
} from 'wn-ts-core';

// ============================================================================
// ERRORS - User-friendly error classes
// ============================================================================

export {
  WordNetError,
  DatabaseError,
  ConfigurationError,
  NetworkError,
} from './errors.js';

// ============================================================================
// UTILITIES - Essential utilities only
// ============================================================================

/**
 * Download WordNet data
 * 
 * @param lexicon - Lexicon to download
 * @param options - Download options
 * 
 * @example
 * ```typescript
 * import { download } from 'wn-ts-web';
 * 
 * await download('oewn:2024', { storage: 'opfs' });
 * ```
 */
export { download } from './data-management/index.js';

/**
 * Get available lexicons
 * 
 * @returns List of available lexicons
 * 
 * @example
 * ```typescript
 * import { getLexicons } from 'wn-ts-web';
 * 
 * const lexicons = await getLexicons();
 * console.log(lexicons); // ['oewn:2024', 'oewn:2023', ...]
 * ```
 */
export { getLexicons } from './data-management/index.js';

// ============================================================================
// LOW-LEVEL API - For advanced users who need full control
// ============================================================================

/**
 * Low-level database access
 * 
 * @example
 * ```typescript
 * import { Database } from 'wn-ts-web/low-level';
 * 
 * const db = new Database({ storage: 'opfs' });
 * await db.initialize();
 * const results = await db.query('SELECT * FROM synsets WHERE form = ?', ['computer']);
 * ```
 */
export * from './low-level/index.js';

// ============================================================================
// VERSION
// ============================================================================

export const version = '1.0.0';