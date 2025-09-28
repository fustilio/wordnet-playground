/**
 * Database Queries Module
 * 
 * This module provides all database query operations for the WordNet database.
 * It includes entity-specific queries, batch operations, and performance-optimized variants.
 * 
 * Available Categories:
 * - Word Queries: Word lookup, search, and filtering operations
 * - Sense Queries: Sense relationships and filtering
 * - Synset Queries: Multiple optimized versions for different use cases
 * - Entity Queries: Lexicons, ILIs, relations, examples, forms, definitions
 * - Batch Queries: Efficient bulk data retrieval
 * - Statistics Queries: Database statistics and counts
 */

// ============================================================================
// WORD QUERIES
// ============================================================================
// Word lookup, search, and filtering operations
export {
  getWordsQuery,                        // Main word query with comprehensive filtering
  getWordByIdQuery,                     // Get single word by ID
  getWordsBySynsetAndLanguageQuery,     // Get words in a synset for specific language
  getWordsByIliAndLanguageQuery,        // Get words by ILI and language
  getWordsByIliAndLexiconPrefixQuery,   // Get words by ILI and lexicon prefix
  getWordsByLexiconQuery,               // Get all words in a lexicon
  getWordsByIdsQuery,                   // Get multiple words by IDs
  getWordsByFormFastQuery,              // Fast exact form lookup (indexed)
  getWordsByFormFuzzyFastQuery,         // Fast fuzzy form search (indexed)
} from './words-queries.js';

// ============================================================================
// SENSE QUERIES
// ============================================================================
// Sense relationships and filtering operations
export {
  getSensesQuery,           // Main sense query with word/synset filtering
  getSenseByIdQuery,        // Get single sense by ID
  getSensesByWordIdQuery,   // Get all senses for a word
  getSensesBySynsetIdQuery, // Get all senses in a synset
} from './senses-queries.js';

// ============================================================================
// SYNSET QUERIES
// ============================================================================
// Multiple optimized versions for different performance requirements
export {
  getSynsetsV2Query,              // V2: Direct joins with subquery fallback
  getSynsetsV3Query,              // V3: Optimized join strategy
  getSynsetsV4Query,              // V4: Single massive JOIN for complete data
  getSynsetsV5Query,              // V5: Index-optimized with proper indexes
  getSynsetsV6Query,              // V6: Most efficient query possible
  getSynsetsFastQuery,            // Fast: Minimal data transformation
  getSynsetsByFormFastQuery,      // Fast form-based synset lookup
  getSynsetsByLexiconQuery,       // Get synsets by lexicon
  getSynsetByIdQuery,             // Get single synset by ID
  getSynsetsByIliQuery,           // Get synsets by ILI with language exclusion
} from './synsets-queries.js';

// ============================================================================
// ENTITY QUERIES
// ============================================================================
// Core entity lookup operations
export { 
  getDefinitionsBySynsetIdQuery  // Get definitions for a synset
} from './definitions-queries.js';

export { 
  getLexiconsQuery,    // Get lexicons with filtering options
  getLexiconByIdQuery  // Get single lexicon by ID
} from './lexicons-queries.js';

export { 
  getIliByIdQuery,  // Get ILI by ID
  getIlisQuery      // Get ILIs with status filtering
} from './ilis-queries.js';

export { 
  getRelationsBySynsetIdQuery  // Get relations for a synset
} from './relations-queries.js';

export { 
  getExamplesBySynsetIdQuery  // Get examples for a synset
} from './examples-queries.js';

export { 
  getFormsByWordIdQuery  // Get inflected forms for a word
} from './forms-queries.js';

// ============================================================================
// BATCH QUERIES
// ============================================================================
// Efficient bulk data retrieval operations
export {
  getBatchDefinitionsQuery,                    // Batch definitions by synset IDs
  getBatchExamplesQuery,                       // Batch examples by synset IDs
  getBatchRelationsQuery,                      // Batch relations by synset IDs
  getBatchSensesQuery,                         // Batch senses by synset IDs
  getSensesBySynsetIdForTransformationQuery,   // Senses for data transformation
  getSensesBySynsetIdAllQuery,                 // All senses for a synset
} from './batch-queries.js';

// ============================================================================
// STATISTICS QUERIES
// ============================================================================
// Database statistics and counting operations
export { 
  getStatisticsQueries  // Get counts for words, synsets, senses, ILIs, lexicons
} from './statistics-queries.js';
