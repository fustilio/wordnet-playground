/**
 * Relations Module
 * 
 * Provides functions for analyzing synset relationships and taxonomy structure,
 * including hypernyms, hyponyms, paths, and depth calculations.
 * 
 * This is a CORE MODULE - essential for WordNet functionality.
 */

// Re-export individual functions for direct use
export { 
  hypernyms, 
  shortestPath, 
  maxDepth, 
  lowestCommonHypernyms 
} from './synset-utils.js';
export { 
  roots, 
  leaves, 
  taxonomyDepth, 
  hypernymPaths, 
  minDepth, 
  taxonomyShortestPath 
} from './taxonomy.js';
export {
  getHypernyms,
  getHyponyms,
  getMeronyms,
  getHolonyms,
  getEntailments,
  getSimilarTos,
  getRelationsByType,
  getAllRelations
} from './simple-queries.js';
