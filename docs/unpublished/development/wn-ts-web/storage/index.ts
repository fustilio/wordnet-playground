/**
 * Storage Module Exports
 * 
 * Central export point for all storage-related functionality
 */

// Storage adapters
export type { StorageAdapter } from './adapters/storage-adapter.js';
export { StorageAdapterFactory } from './adapters/storage-adapter.js';
export type { StorageInfo, StorageAdapterConfig } from './adapters/storage-adapter.js';
export { OpfsStorageAdapter } from './adapters/opfs-storage-adapter.js';
export { MemoryStorageAdapter } from './adapters/memory-storage-adapter.js';
export { IndexedDBStorageAdapter } from './adapters/indexeddb-storage-adapter.js';

// Database implementations
export { WebDatabase, type WebDatabaseConfig } from '../client/submodules/web-database.js';

// Utilities
export { 
  manualOpfsCleanup, 
  nuclearOpfsCleanup, 
  checkOpfsStatus, 
  setupConsoleUtilities,
  type OpfsCleanupResult 
} from './utils/opfs-cleanup.js';
