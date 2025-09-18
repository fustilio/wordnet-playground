/**
 * Core Modules for WordNet
 * 
 * These are essential modules that provide core WordNet functionality.
 * They are NOT plugins - they are required for basic WordNet operations.
 */

// Re-export all module functions for convenience
export * from './morphology/index.js';
export * from './relations/index.js';
export * from './data-management/index.js';
export * from './environment/index.js';