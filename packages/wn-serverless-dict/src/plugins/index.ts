/**
 * Plugin system for wn-serverless-dict
 * Provides extensibility through lifecycle hooks
 */

// Export plugin types
export * from './types.js';

// Export plugin registry
export { PluginRegistry, globalRegistry } from './registry.js';

// Export example plugins
export { StatisticsPlugin, type GenerationStatistics } from './examples/statistics-plugin.js';
export { FilterPlugin, type FilterPluginConfig, type FilterFunction } from './examples/filter-plugin.js';
export { CachePlugin, type CachePluginConfig } from './examples/cache-plugin.js';

// Re-export for convenience
export type { Plugin, PluginHooks, PluginMetadata } from './types.js';
