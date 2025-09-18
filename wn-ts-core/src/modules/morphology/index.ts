/**
 * Morphology Module
 * 
 * Provides morphological analysis capabilities for lemmatization,
 * including the Morphy class for finding base forms of words.
 * 
 * This is a CORE MODULE - essential for WordNet functionality.
 */

// Re-export individual functions and classes for direct use
export { Morphy, createMorphy, morphy } from './morphy.js';
export type { MorphyResult } from './morphy.js';
