/**
 * Core exports for wn-ts-core
 * 
 * This module provides the essential types, schemas, and validation
 * functions that form the foundation of the WordNet library.
 */

// Core types
export * from './types.js';

// Core schemas
export * from './schemas.js';

// Core validation - use explicit exports to avoid conflicts
export { 
  validateSynset as validateSynsetData,
  validateSense as validateSenseData, 
  validateWord as validateWordData,
  validateRelation,
  validateWordnet as validateWordnetData
} from './validation.js';

// Core errors
export * from './errors.js';
