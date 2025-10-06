/**
 * WordNet TypeScript - Node.js Implementation
 * 
 * A modern TypeScript implementation of WordNet for Node.js.
 * 
 * @version 1.0.0
 * @example
 * ```typescript
 * import WordNet from 'wn-ts-node';
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
 * Create a WordNet instance
 * 
 * @param lexicon - Lexicon identifier (e.g., 'oewn:2024')
 * @param options - Configuration options
 * @returns WordNet instance
 * 
 * @example
 * ```typescript
 * import WordNet from 'wn-ts-node';
 * 
 * // Simple usage
 * const wn = WordNet.create('oewn:2024');
 * const results = await wn.search('computer');
 * 
 * // With options
 * const wn = WordNet.create('oewn:2024', {
 *   dataDir: './wordnet-data',
 *   cache: true
 * });
 * 
 * // With plugins
 * const wn = WordNet.create('oewn:2024', {
 *   plugins: [relationsPlugin, similarityPlugin]
 * });
 * ```
 */
export { createWordnet as create, createWordnet, createWordnetWithPlugins } from './kysely-wordnet.js';

/**
 * Default export - same as create()
 * Enables: import WordNet from 'wn-ts-node';
 */
export { createWordnet as default } from './kysely-wordnet.js';

/**
 * Main WordNet class (for advanced users who need direct access)
 */
export { KyselyWordnet } from './kysely-wordnet.js';

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
  NodeDatabaseConfig as NodeWordnetConfig,
  
  // Results - these types don't exist in core, so we'll define them locally
} from 'wn-ts-core';

// Import types for local definitions
import type { Synset, Sense, PartOfSpeech } from 'wn-ts-core';

// Define missing result types locally
export type SearchResult = {
  word: string;
  synsets: Synset[];
  senses: Sense[];
};

export type DefinitionResult = {
  word: string;
  definition: string;
  partOfSpeech: PartOfSpeech;
  examples: string[];
};

export type TranslationResult = {
  word: string;
  translations: string[];
  sourceLanguage: string;
  targetLanguage: string;
};

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
 * import { download } from 'wn-ts-node';
 * 
 * await download('oewn:2024', { dataDir: './data' });
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
 * import { getLexicons } from 'wn-ts-node';
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
 * import { Database } from 'wn-ts-node/low-level';
 * 
 * const db = new Database({ filename: './custom.db' });
 * await db.initialize();
 * const results = await db.query('SELECT * FROM synsets WHERE form = ?', ['computer']);
 * ```
 */
export * from './low-level/index.js';

// ============================================================================
// VERSION
// ============================================================================

export const version = '1.0.0';