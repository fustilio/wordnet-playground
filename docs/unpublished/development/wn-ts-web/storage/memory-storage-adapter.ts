/**
 * Memory Storage Adapter
 * 
 * Provides in-memory storage using SQLite WASM. This is the fallback option
 * when persistent storage is not available or fails.
 */

import type { Database, Sqlite3Static } from "@sqlite.org/sqlite-wasm";
import type { StorageAdapter, StorageAdapterConfig, StorageInfo } from "./storage-adapter.js";
import { createScopedLogger } from "utils/logger";

const logger = createScopedLogger('MemoryStorageAdapter');

export class MemoryStorageAdapter implements StorageAdapter {
  private db: Database | null = null;
  private sqlModule: Sqlite3Static | null = null;
  private initialized = false;
  private config: Required<StorageAdapterConfig>;

  constructor(config: StorageAdapterConfig = {}) {
    this.config = {
      maxRetries: config.maxRetries ?? 3,
      retryDelay: config.retryDelay ?? 500,
      verbose: config.verbose ?? false,
      databaseName: config.databaseName ?? ':memory:'
    };
  }

  getName(): string {
    return 'Memory';
  }

  isAvailable(): boolean {
    return true; // Memory storage is always available
  }

  async initialize(sqlModule: Sqlite3Static): Promise<void> {
    this.sqlModule = sqlModule;
    this.initialized = true;
  }

  isInitialized(): boolean {
    return this.initialized;
  }

  async createDatabase(data?: Uint8Array): Promise<void> {
    if (!this.sqlModule) {
      throw new Error('Storage adapter not initialized. Call initialize() first.');
    }

    try {
      logger.info("Creating in-memory database");
      this.db = new this.sqlModule.oo1.DB(':memory:');

      if (data) {
        this.db.exec(data);
        logger.info("Database data loaded into memory");
      }

      logger.info("In-memory database created successfully");
    } catch (error) {
      logger.error("Failed to create in-memory database:", error);
      throw error;
    }
  }

  getDatabase(): Database | null {
    return this.db;
  }

  getStorageInfo(): StorageInfo {
    return {
      type: 'memory',
      persistent: false,
      path: ':memory:',
      available: true,
    };
  }

  close(): void {
    if (this.db) {
      this.db.close();
      this.db = null;
    }
  }
}
