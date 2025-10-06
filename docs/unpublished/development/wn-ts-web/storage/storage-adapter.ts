/**
 * Storage Adapter Interface
 * 
 * Defines the contract for different database storage backends in the web environment.
 * This allows for hot-swapping between different storage mechanisms (OPFS, IndexedDB, Memory, etc.)
 */

import type { Database } from "@sqlite.org/sqlite-wasm";
import type { Sqlite3Static } from "@sqlite.org/sqlite-wasm";

export interface StorageInfo {
  type: 'opfs' | 'memory' | 'indexeddb' | 'localstorage';
  persistent: boolean;
  path?: string;
  size?: number;
  available: boolean;
}

export interface StorageAdapter {
  /**
   * Initialize the storage adapter with the SQLite module
   */
  initialize(sqlModule: Sqlite3Static): Promise<void>;

  /**
   * Create or open the database
   */
  createDatabase(data?: Uint8Array): Promise<void>;

  /**
   * Get the underlying SQLite database instance
   */
  getDatabase(): Database | null;

  /**
   * Get information about the current storage
   */
  getStorageInfo(): StorageInfo;

  /**
   * Check if the storage is available in the current environment
   */
  isAvailable(): boolean;

  /**
   * Close the database and clean up resources
   */
  close(): void;

  /**
   * Check if the adapter is initialized
   */
  isInitialized(): boolean;

  /**
   * Get the adapter name for identification
   */
  getName(): string;
}

export interface StorageAdapterConfig {
  /**
   * Maximum number of retry attempts for storage operations
   */
  maxRetries?: number;

  /**
   * Delay between retry attempts in milliseconds
   */
  retryDelay?: number;

  /**
   * Whether to enable verbose logging
   */
  verbose?: boolean;

  /**
   * Custom database name/path
   */
  databaseName?: string;
}

/**
 * Storage adapter factory for creating different types of adapters
 */
export class StorageAdapterFactory {
  /**
   * Create a storage adapter based on the specified type
   */
  static createAdapter(type: 'opfs' | 'memory' | 'indexeddb', config?: StorageAdapterConfig): StorageAdapter {
    switch (type) {
      case 'opfs':
        return new OpfsStorageAdapter(config);
      case 'memory':
        return new MemoryStorageAdapter(config);
      case 'indexeddb':
        return new IndexedDBStorageAdapter(config);
      default:
        throw new Error(`Unsupported storage adapter type: ${type}`);
    }
  }

  /**
   * Get the best available storage adapter for the current environment
   * Priority: OPFS > IndexedDB > Memory
   */
  static getBestAvailableAdapter(config?: StorageAdapterConfig): StorageAdapter {
    const opfsAdapter = new OpfsStorageAdapter(config);
    if (opfsAdapter.isAvailable()) {
      return opfsAdapter;
    }

    const indexedDBAdapter = new IndexedDBStorageAdapter(config);
    if (indexedDBAdapter.isAvailable()) {
      return indexedDBAdapter;
    }

    return new MemoryStorageAdapter(config);
  }

  /**
   * Get all available adapters in order of preference
   */
  static getAvailableAdapters(config?: StorageAdapterConfig): StorageAdapter[] {
    const adapters: StorageAdapter[] = [];
    
    const opfsAdapter = new OpfsStorageAdapter(config);
    if (opfsAdapter.isAvailable()) {
      adapters.push(opfsAdapter);
    }

    const indexedDBAdapter = new IndexedDBStorageAdapter(config);
    if (indexedDBAdapter.isAvailable()) {
      adapters.push(indexedDBAdapter);
    }

    // Memory adapter is always available as fallback
    adapters.push(new MemoryStorageAdapter(config));

    return adapters;
  }
}

// Import the concrete implementations
import { OpfsStorageAdapter } from './opfs-storage-adapter.js';
import { MemoryStorageAdapter } from './memory-storage-adapter.js';
import { IndexedDBStorageAdapter } from './indexeddb-storage-adapter.js';
