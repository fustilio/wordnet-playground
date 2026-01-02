/**
 * wn-serverless-dict
 * Serverless-optimized dictionary generation and runtime utilities for WordNet
 */

// Export all types
export * from './types/index.js';

// Export generators
export * from './generators/index.js';

// Export runtime utilities
export * from './utils/index.js';

// Re-export commonly used items for convenience
export { createDictionary, lookup, translate, define } from './utils/index.js';
export { PRESETS, generateDictionary, createESModule } from './generators/index.js';
