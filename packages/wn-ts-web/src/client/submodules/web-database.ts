/**
 * Browser-compatible database implementation using @sqlite.org/sqlite-wasm
 * Uses the StorageAdapter pattern for hot-swappable storage backends
 * 
 * This class acts as a facade over different storage adapters, allowing
 * for easy switching between OPFS, IndexedDB, and Memory storage.
 */

import type { Sqlite3Static, Database } from "@sqlite.org/sqlite-wasm";
import type { StorageAdapter, StorageAdapterConfig } from "../../storage/adapters/storage-adapter.js";
import { StorageAdapterFactory } from "../../storage/adapters/storage-adapter.js";
import { createScopedLogger } from "utils/logger";

const logger = createScopedLogger('WebDatabase');

export interface WebDatabaseConfig {
  /**
   * Preferred storage adapter type
   * If not specified, will auto-detect the best available option
   */
  preferredAdapter?: 'opfs' | 'memory' | 'indexeddb' | 'auto';
  
  /**
   * Storage adapter configuration
   */
  adapterConfig?: StorageAdapterConfig;
  
  /**
   * Whether to enable verbose logging
   */
  verbose?: boolean;
}

export class WebDatabase {
  private adapter: StorageAdapter | null = null;
  private sqlModule: Sqlite3Static | null = null;
  private initialized = false;
  private config: WebDatabaseConfig;

  constructor(config: WebDatabaseConfig = {}) {
    this.config = {
      preferredAdapter: config.preferredAdapter ?? 'opfs',
      adapterConfig: config.adapterConfig ?? {},
      verbose: config.verbose ?? false,
    };
  }

  /**
   * Initialize the database with the SQLite module
   */
  async initializeWithModule(sqlModule: Sqlite3Static): Promise<void> {
    this.sqlModule = sqlModule;
    this.initialized = true;
    logger.info("WebDatabase initialized with SQLite module");
  }

  /**
   * Create or open the database using the configured storage adapter
   */
  async createDatabase(data?: Uint8Array): Promise<void> {
    if (!this.sqlModule) {
      throw new Error('Database not initialized. Call initializeWithModule() first.');
    }

    // Select the appropriate storage adapter
    this.adapter = this.selectStorageAdapter();
    
    if (!this.adapter) {
      throw new Error('No suitable storage adapter available');
    }

    logger.info(`Using storage adapter: ${this.adapter.getName()}`);

    try {
      // Initialize the adapter
      await this.adapter.initialize(this.sqlModule);
      
      // Create the database
      await this.adapter.createDatabase(data);
      
      const storageInfo = this.adapter.getStorageInfo();
      logger.info(`Database created successfully using ${storageInfo.type} storage (persistent: ${storageInfo.persistent})`);
      
    } catch (error) {
      logger.error(`Failed to create database with ${this.adapter.getName()} adapter:`, error);
      
      // Try progressive fallback strategy
      await this.tryProgressiveFallback(data, error);
    }
  }

  /**
   * Try progressive fallback strategy when the preferred adapter fails
   */
  private async tryProgressiveFallback(data?: Uint8Array, originalError?: Error): Promise<void> {
    const fallbackOrder = this.getFallbackOrder();
    
    for (const adapterType of fallbackOrder) {
      if (adapterType === this.adapter?.getName()) {
        continue; // Skip the adapter that just failed
      }
      
      try {
        logger.info(`Trying fallback to ${adapterType} storage adapter`);
        this.adapter = StorageAdapterFactory.createAdapter(adapterType as any, this.config.adapterConfig);
        
        if (!this.adapter.isAvailable()) {
          logger.warn(`${adapterType} adapter is not available, skipping`);
          continue;
        }
        
        await this.adapter.initialize(this.sqlModule!);
        await this.adapter.createDatabase(data);
        
        const storageInfo = this.adapter.getStorageInfo();
        logger.info(`Successfully created database using ${adapterType} storage fallback (persistent: ${storageInfo.persistent})`);
        return;
        
      } catch (fallbackError) {
        logger.warn(`${adapterType} fallback also failed:`, fallbackError);
        continue;
      }
    }
    
    // If all adapters failed, throw the original error
    throw originalError || new Error('All storage adapters failed');
  }

  /**
   * Get the fallback order based on the preferred adapter
   */
  private getFallbackOrder(): string[] {
    const preferred = this.config.preferredAdapter;
    
    switch (preferred) {
      case 'opfs':
        return ['indexeddb', 'memory'];
      case 'indexeddb':
        return ['opfs', 'memory'];
      case 'memory':
        return ['indexeddb', 'opfs'];
      case 'auto':
      default:
        return ['indexeddb', 'memory'];
    }
  }

  /**
   * Select the appropriate storage adapter based on configuration and availability
   */
  private selectStorageAdapter(): StorageAdapter | null {
    if (this.config.preferredAdapter === 'auto') {
      return StorageAdapterFactory.getBestAvailableAdapter(this.config.adapterConfig);
    }

    if (this.config.preferredAdapter === 'memory') {
      return StorageAdapterFactory.createAdapter('memory', this.config.adapterConfig);
    }

    // Try the preferred adapter first
    try {
      const adapter = StorageAdapterFactory.createAdapter(this.config.preferredAdapter!, this.config.adapterConfig);
      if (adapter.isAvailable()) {
        return adapter;
      }
    } catch (error) {
      logger.warn(`Preferred adapter ${this.config.preferredAdapter} is not available:`, error);
    }

    // Fall back to the best available option
    return StorageAdapterFactory.getBestAvailableAdapter(this.config.adapterConfig);
  }

  /**
   * Get the underlying SQLite database instance
   */
  getDatabase(): Database | null {
    return this.adapter?.getDatabase() ?? null;
  }

  /**
   * Get information about the current storage
   */
  getStorageInfo(): { type: string; persistent: boolean; path?: string; available: boolean } {
    return this.adapter?.getStorageInfo() ?? {
      type: 'none',
      persistent: false,
      available: false
    };
  }

  /**
   * Check if the database is using OPFS
   */
  get useOPFS(): boolean {
    return this.adapter?.getName() === 'OPFS';
  }

  /**
   * Close the database and clean up resources
   */
  close(): void {
    if (this.adapter) {
      this.adapter.close();
      this.adapter = null;
    }
  }

  /**
   * Get the current storage adapter
   */
  getCurrentAdapter(): StorageAdapter | null {
    return this.adapter;
  }

  /**
   * Switch to a different storage adapter
   * This will close the current database and create a new one with the specified adapter
   */
  async switchAdapter(adapterType: 'opfs' | 'memory' | 'indexeddb'): Promise<void> {
    if (!this.sqlModule) {
      throw new Error('Database not initialized. Call initializeWithModule() first.');
    }

    logger.info(`Switching to ${adapterType} storage adapter`);

    // Close current adapter
    this.close();

    // Create new adapter
    this.adapter = StorageAdapterFactory.createAdapter(adapterType, this.config.adapterConfig);
    
    if (!this.adapter.isAvailable()) {
      throw new Error(`${adapterType} storage adapter is not available in this environment`);
    }

    try {
      await this.adapter.initialize(this.sqlModule);
      await this.adapter.createDatabase();
      logger.info(`Successfully switched to ${adapterType} storage adapter`);
    } catch (error) {
      logger.error(`Failed to switch to ${adapterType} storage adapter:`, error);
      throw error;
    }
  }

  /**
   * Get all available storage adapters
   */
  static getAvailableAdapters(config?: StorageAdapterConfig): StorageAdapter[] {
    return StorageAdapterFactory.getAvailableAdapters(config);
  }

  /**
   * Get the best available storage adapter for the current environment
   */
  static getBestAdapter(config?: StorageAdapterConfig): StorageAdapter {
    return StorageAdapterFactory.getBestAvailableAdapter(config);
  }

  /**
   * Static method to clean up OPFS access handle
   */
  static async cleanupOpfsAccessHandle(): Promise<void> {
    const { OpfsStorageAdapter } = await import('../../storage/adapters/opfs-storage-adapter.js');
    await OpfsStorageAdapter.cleanupOpfsAccessHandle();
  }

  /**
   * Static method to close the singleton OPFS database
   */
  static closeOpfsDatabase(): void {
    const { OpfsStorageAdapter } = require('../../storage/adapters/opfs-storage-adapter.js');
    OpfsStorageAdapter.closeOpfsDatabase();
  }

  // Legacy compatibility methods
  /**
   * @deprecated Use getStorageInfo() instead
   */
  getStorageType(): string {
    return this.getStorageInfo().type;
  }

  /**
   * @deprecated Use getStorageInfo() instead
   */
  isPersistent(): boolean {
    return this.getStorageInfo().persistent;
  }
}