/**
 * LMF Parser implementations
 * 
 * This module provides various parser implementations for LMF XML files,
 * each optimized for different use cases and performance requirements.
 */

export * from './base.js';
export * from './native-xml.js';
export * from './optimized-sax.js';
export * from './streaming-sax.js';
export * from './in-memory-sax.js';
export * from './legacy.js';
export * from './python.js';
export * from './registry.js';

// Re-export the main loadLMF function for backward compatibility
export { loadLMF, parseLMFXML, isLMF, createMinimalLMF } from '../lmf.js';
export type { LMFDocument, LMFLoadOptions } from '../lmf.js'; 