/**
 * IndexedDB Storage Adapter
 * 
 * Provides persistent storage using IndexedDB as a fallback when OPFS is not available.
 * This adapter stores the SQLite database as a blob in IndexedDB.
 */

import type { Database, Sqlite3Static } from "@sqlite.org/sqlite-wasm";
import type { StorageAdapter, StorageAdapterConfig, StorageInfo } from "./storage-adapter.js";
import { createScopedLogger } from "utils/logger";

const logger = createScopedLogger('IndexedDBStorageAdapter');

export class IndexedDBStorageAdapter implements StorageAdapter {
  private db: Database | null = null;
  private sqlModule: Sqlite3Static | null = null;
  private initialized = false;
  private config: Required<StorageAdapterConfig>;
  private dbName: string;
  private storeName: string;

  constructor(config: StorageAdapterConfig = {}) {
    this.config = {
      maxRetries: config.maxRetries ?? 3,
      retryDelay: config.retryDelay ?? 1000,
      verbose: config.verbose ?? false,
      databaseName: config.databaseName ?? 'wordnet.sqlite3'
    };
    
    this.dbName = 'WordNetDB';
    this.storeName = 'databases';
  }

  getName(): string {
    return 'IndexedDB';
  }

  isAvailable(): boolean {
    return typeof globalThis !== 'undefined' && 'indexedDB' in globalThis;
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

    if (!this.isAvailable()) {
      throw new Error('IndexedDB is not available in this environment');
    }

    try {
      logger.info("Creating IndexedDB-backed database");
      
      // Create in-memory database first
      this.db = new this.sqlModule.oo1.DB(':memory:');

      // Try to load existing data from IndexedDB
      const existingData = await this.loadFromIndexedDB();
      if (existingData) {
        this.db.exec(existingData);
        logger.info("Loaded existing database from IndexedDB");
      } else if (data) {
        this.db.exec(data);
        logger.info("Loaded new database data into memory");
      }

      // Set up periodic saving to IndexedDB
      this.setupPeriodicSave();

      logger.info("IndexedDB-backed database created successfully");
    } catch (error) {
      logger.error("Failed to create IndexedDB-backed database:", error);
      throw error;
    }
  }

  private async loadFromIndexedDB(): Promise<Uint8Array | null> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, 1);
      
      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        const db = request.result;
        const transaction = db.transaction([this.storeName], 'readonly');
        const store = transaction.objectStore(this.storeName);
        const getRequest = store.get(this.config.databaseName);
        
        getRequest.onsuccess = () => {
          resolve(getRequest.result || null);
        };
        getRequest.onerror = () => reject(getRequest.error);
      };
      
      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains(this.storeName)) {
          db.createObjectStore(this.storeName);
        }
      };
    });
  }

  private async saveToIndexedDB(data: Uint8Array): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, 1);
      
      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        const db = request.result;
        const transaction = db.transaction([this.storeName], 'readwrite');
        const store = transaction.objectStore(this.storeName);
        const putRequest = store.put(data, this.config.databaseName);
        
        putRequest.onsuccess = () => resolve();
        putRequest.onerror = () => reject(putRequest.error);
      };
      
      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains(this.storeName)) {
          db.createObjectStore(this.storeName);
        }
      };
    });
  }

  private setupPeriodicSave(): void {
    // Save to IndexedDB every 30 seconds
    setInterval(async () => {
      if (this.db) {
        try {
          const data = this.db.export();
          await this.saveToIndexedDB(data);
          logger.debug("Database saved to IndexedDB");
        } catch (error) {
          logger.warn("Failed to save database to IndexedDB:", error);
        }
      }
    }, 30000);
  }

  getDatabase(): Database | null {
    return this.db;
  }

  getStorageInfo(): StorageInfo {
    return {
      type: 'indexeddb',
      persistent: true,
      path: `${this.dbName}/${this.storeName}/${this.config.databaseName}`,
      available: this.isAvailable(),
    };
  }

  close(): void {
    if (this.db) {
      // Save final state to IndexedDB before closing
      try {
        const data = this.db.export();
        this.saveToIndexedDB(data).catch(error => {
          logger.warn("Failed to save final database state to IndexedDB:", error);
        });
      } catch (error) {
        logger.warn("Failed to export database before closing:", error);
      }
      
      this.db.close();
      this.db = null;
    }
  }
}
