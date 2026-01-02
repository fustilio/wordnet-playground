/**
 * Storage system for flexible dictionary persistence
 * Supports multiple storage backends with fallback strategy
 */

// Export storage adapter interface
export * from './adapter.js';

// Export storage manager
export { StorageManager, type StorageManagerConfig } from './manager.js';

// Export built-in adapters
export { JsonStorageAdapter } from './adapters/json-adapter.js';
export { ESModuleStorageAdapter } from './adapters/esmodule-adapter.js';
export { MemoryStorageAdapter } from './adapters/memory-adapter.js';
