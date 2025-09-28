/**
 * True Plugins for WordNet
 * 
 * These are OPTIONAL plugins that can be added or removed without breaking
 * core WordNet functionality. They provide additional features beyond
 * the essential WordNet operations.
 * 
 * A plugin is only a plugin if:
 * 1. It can be removed without breaking the kernel
 * 2. It provides optional functionality
 * 3. It can be loaded/unloaded dynamically
 */

// Core plugin system types
export type { Plugin, WordNetCore, WordNetWithPlugins, PluginMethod } from '../wordnet-kernel.js';

// Relations queries (optional)
export { relations } from './relations.js';
export { enhancedRelations } from './relations/enhanced-relations.js';

// Similarity algorithms (optional)
export { similarity } from './similarity/index.js';

// Translation features (optional)
export { translation } from './translation.js';

// Example: Analytics and clustering (optional)
// export { analytics } from './analytics/index.js';

// Example: Export/Import utilities (optional)
// export { exportUtils } from './export-utils/index.js';

// Import plugins for use in collections
import { relations } from './relations.js';
import { enhancedRelations } from './relations/enhanced-relations.js';
import { similarity } from './similarity/index.js';
import { translation } from './translation.js';

// Plugin collections for common use cases
export const allPlugins = [
  relations,
  enhancedRelations,
  similarity,
  translation
];

export const comprehensivePlugins = [
  enhancedRelations,
  similarity,
  translation
];

export const similarityPlugins = [
  similarity
];

export const translationPlugins = [
  translation
] as const;

export const analyticsPlugins = [
  // Add analytics-related plugins here
];
