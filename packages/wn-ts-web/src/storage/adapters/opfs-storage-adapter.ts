/**
 * OPFS (Origin Private File System) Storage Adapter
 * 
 * Provides persistent, high-performance storage using the Origin Private File System API.
 * This is the preferred storage method for modern browsers with SQLite WASM.
 */

import type { Database, Sqlite3Static } from "@sqlite.org/sqlite-wasm";
import type { StorageAdapter, StorageAdapterConfig, StorageInfo } from "./storage-adapter.js";
import { createScopedLogger } from "utils/logger";

const logger = createScopedLogger('OpfsStorageAdapter');

export class OpfsStorageAdapter implements StorageAdapter {
  private db: Database | null = null;
  private sqlModule: Sqlite3Static | null = null;
  private initialized = false;
  private config: Required<StorageAdapterConfig>;
  
  // Singleton pattern to prevent multiple OPFS database instances
  private static opfsDatabaseInstance: Database | null = null;
  private static opfsDatabaseInUse = false;
  private static opfsDatabaseFailed = false;
  private static opfsCreationPromise: Promise<Database> | null = null;
  private static opfsCreationLock = false;
  private static opfsAccessHandle: any = null;
  private static opfsCompletelyUnavailable = false;

  constructor(config: StorageAdapterConfig = {}) {
    this.config = {
      maxRetries: config.maxRetries ?? 5,
      retryDelay: config.retryDelay ?? 1000,
      verbose: config.verbose ?? false,
      databaseName: config.databaseName ?? 'wordnet.sqlite3'
    };
  }

  getName(): string {
    return 'OPFS';
  }

  isAvailable(): boolean {
    // Check if OPFS is available
    if (typeof navigator === 'undefined' || 
        !('storage' in navigator) || 
        !('getDirectory' in navigator.storage)) {
      return false;
    }

    // Check if OPFS has been marked as completely unavailable for this session
    if (OpfsStorageAdapter.opfsCompletelyUnavailable) {
      logger.warn("OPFS marked as completely unavailable for this session");
      return false;
    }

    // Check if OPFS is in a corrupted state (all files locked)
    // This is a heuristic: if we've seen multiple consecutive failures,
    // we should consider OPFS unavailable
    try {
      const opfsFailureKey = 'opfs-consecutive-failures';
      const consecutiveFailures = parseInt(localStorage.getItem(opfsFailureKey) || '0');
      
      if (consecutiveFailures >= 2) {
        logger.warn(`OPFS marked as unavailable due to ${consecutiveFailures} consecutive failures`);
        return false;
      }
    } catch (error) {
      // localStorage not available (e.g., in Web Worker context)
      // In this case, we'll assume OPFS is available and let the runtime handle failures
      logger.debug("localStorage not available, assuming OPFS is available");
    }

    return true;
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
      throw new Error('OPFS is not available in this environment');
    }

    // Check if another instance is already creating the OPFS database
    if (OpfsStorageAdapter.opfsCreationLock) {
      if (OpfsStorageAdapter.opfsCreationPromise) {
        logger.info("Another instance is creating OPFS database, waiting...");
        await OpfsStorageAdapter.opfsCreationPromise;
        if (OpfsStorageAdapter.opfsDatabaseInstance) {
          this.db = OpfsStorageAdapter.opfsDatabaseInstance;
          return;
        }
      }
    }

    // Set creation lock
    OpfsStorageAdapter.opfsCreationLock = true;
    OpfsStorageAdapter.opfsCreationPromise = this.createOpfsDatabase(data);

    try {
      this.db = await OpfsStorageAdapter.opfsCreationPromise;
      OpfsStorageAdapter.opfsDatabaseInstance = this.db;
      OpfsStorageAdapter.opfsDatabaseInUse = true;
      OpfsStorageAdapter.opfsDatabaseFailed = false;
      logger.info("OPFS database created successfully");
    } catch (error) {
      OpfsStorageAdapter.opfsDatabaseFailed = true;
      OpfsStorageAdapter.opfsAccessHandle = null;
      logger.error("Failed to create OPFS database:", error);
      
      // Mark OPFS as completely unavailable for this session on any failure
      OpfsStorageAdapter.opfsCompletelyUnavailable = true;
      
      try {
        const opfsFailureKey = 'opfs-consecutive-failures';
        const consecutiveFailures = parseInt(localStorage.getItem(opfsFailureKey) || '0') + 1;
        localStorage.setItem(opfsFailureKey, consecutiveFailures.toString());
        logger.error(`OPFS failed - marking as unavailable for ${consecutiveFailures} consecutive failures.`);
      } catch (localStorageError) {
        // localStorage not available (e.g., in Web Worker context)
        logger.error('OPFS failed - marking as unavailable. (localStorage not available for failure tracking)');
      }
      
      throw error;
    } finally {
      OpfsStorageAdapter.opfsCreationLock = false;
      OpfsStorageAdapter.opfsCreationPromise = null;
    }
  }

  private async createOpfsDatabase(data?: Uint8Array): Promise<Database> {
    if (!this.sqlModule) {
      throw new Error('SQL module not initialized');
    }

    // Try OpfsDb first (like the demo)
    try {
      const db = new this.sqlModule.oo1.OpfsDb(`/${this.config.databaseName}`);
      
      if (data) {
        db.exec(data);
      }

      logger.info(`OPFS database created successfully with OpfsDb: ${this.config.databaseName}`);
      
      // Reset failure counter on success
      try {
        localStorage.removeItem('opfs-consecutive-failures');
      } catch (error) {
        // localStorage not available (e.g., in Web Worker context)
        logger.debug("localStorage not available for failure counter reset");
      }
      
      return db;
    } catch (error) {
      logger.debug("OpfsDb failed, trying VFS approach:", error);
    }

    // Try VFS URI approach (like the demo)
    try {
      const db = new this.sqlModule.oo1.DB(`file:${this.config.databaseName}?vfs=opfs`);
      
      if (data) {
        db.exec(data);
      }

      logger.info(`OPFS database created successfully with VFS: ${this.config.databaseName}`);
      
      // Reset failure counter on success
      try {
        localStorage.removeItem('opfs-consecutive-failures');
      } catch (error) {
        // localStorage not available (e.g., in Web Worker context)
        logger.debug("localStorage not available for failure counter reset");
      }
      
      return db;
    } catch (error) {
      logger.debug("VFS approach failed:", error);
    }

    // If both OPFS methods fail, throw the last error
    throw new Error(`Failed to create OPFS database. Both OpfsDb and VFS approaches failed.`);
  }

  /**
   * Coordinate between multiple instances trying to access the same OPFS file
   */
  private async coordinateMultipleInstances(): Promise<void> {
    try {
      // Use a simple coordination mechanism based on timestamp
      const coordinationKey = `opfs-coordination-${this.config.databaseName}`;
      const now = Date.now();
      
      // Check if another instance is currently trying to access the file
      const lastAttempt = localStorage.getItem(coordinationKey);
      if (lastAttempt) {
        const timeSinceLastAttempt = now - parseInt(lastAttempt);
        if (timeSinceLastAttempt < 10000) { // 10 seconds
          logger.info("Another instance may be accessing OPFS, waiting...");
          await new Promise(resolve => setTimeout(resolve, 2000 + Math.random() * 3000));
        }
      }
      
      // Mark our attempt
      localStorage.setItem(coordinationKey, now.toString());
      
      // Clean up old coordination entries
      setTimeout(() => {
        localStorage.removeItem(coordinationKey);
      }, 30000); // Clean up after 30 seconds
      
    } catch (error) {
      logger.debug("Coordination mechanism failed:", error);
    }
  }

  /**
   * Create access handle with timeout to prevent hanging
   */
  private async createAccessHandleWithTimeout(fileHandle: FileSystemFileHandle, timeoutMs: number = 5000): Promise<any> {
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('Access handle creation timed out'));
      }, timeoutMs);

      (fileHandle as any).createSyncAccessHandle()
        .then((handle: any) => {
          clearTimeout(timeout);
          resolve(handle);
        })
        .catch((error: any) => {
          clearTimeout(timeout);
          reject(error);
        });
    });
  }

  private async tryClearLingeringOpfsHandles(): Promise<void> {
    try {
      if (navigator.storage && 'getDirectory' in navigator.storage) {
        const opfsRoot = await navigator.storage.getDirectory();
        try {
          const fileHandle = await opfsRoot.getFileHandle(this.config.databaseName, { create: false });
          
          // If we can get the file handle, it means there might be a lingering access handle
          logger.warn("Detected potential lingering OPFS access handle, attempting aggressive cleanup...");
          
          // Try multiple cleanup strategies
          await this.aggressiveOpfsCleanup(fileHandle);
          
        } catch (fileError) {
          logger.debug("OPFS file doesn't exist yet, no lingering handles to clear");
        }
      }
    } catch (error) {
      logger.debug("No lingering OPFS handles detected or OPFS not available");
    }
  }

  /**
   * Aggressive OPFS cleanup strategies for stubborn access handles
   */
  private async aggressiveOpfsCleanup(fileHandle: FileSystemFileHandle): Promise<void> {
    const strategies = [
      // Strategy 1: Wait and try to create/close a test database
      async () => {
        logger.info("Strategy 1: Wait and test database creation");
        await new Promise(resolve => setTimeout(resolve, 2000));
        try {
          const testDb = new this.sqlModule!.oo1.OpfsDb(`/${this.config.databaseName}`);
          testDb.close();
          logger.info("Strategy 1: Successfully cleared lingering handle");
          return true;
        } catch (error) {
          logger.warn("Strategy 1: Failed to clear handle:", error);
          return false;
        }
      },

      // Strategy 2: Try to get a writable stream and close it immediately
      async () => {
        logger.info("Strategy 2: Try writable stream approach");
        try {
          const writable = await fileHandle.createWritable();
          await writable.close();
          logger.info("Strategy 2: Successfully cleared via writable stream");
          return true;
        } catch (error) {
          logger.warn("Strategy 2: Failed writable stream approach:", error);
          return false;
        }
      },

      // Strategy 3: Force garbage collection hint and wait longer
      async () => {
        logger.info("Strategy 3: Force GC and extended wait");
        try {
          // Check if we're in a browser context and GC is available
          if (typeof globalThis !== 'undefined' && 'gc' in globalThis) {
            (globalThis as any).gc();
          }
          await new Promise(resolve => setTimeout(resolve, 5000));
          const testDb = new this.sqlModule!.oo1.OpfsDb(`/${this.config.databaseName}`);
          testDb.close();
          logger.info("Strategy 3: Successfully cleared after GC");
          return true;
        } catch (error) {
          logger.warn("Strategy 3: Failed after GC:", error);
          return false;
        }
      },

      // Strategy 4: Try to access the file in read-only mode
      async () => {
        logger.info("Strategy 4: Read-only file access");
        try {
          const file = await fileHandle.getFile();
          const content = await file.text();
          logger.info("Strategy 4: Successfully accessed file in read-only mode");
          return true;
        } catch (error) {
          logger.warn("Strategy 4: Failed read-only access:", error);
          return false;
        }
      },

      // Strategy 5: Try to create a completely new file with a different name
      async () => {
        logger.info("Strategy 5: Create new file with different name");
        try {
          const opfsRoot = await navigator.storage.getDirectory();
          const newFileName = `${this.config.databaseName}.${Date.now()}`;
          const newFileHandle = await opfsRoot.getFileHandle(newFileName, { create: true });
          const newDb = new this.sqlModule!.oo1.OpfsDb(`/${newFileName}`);
          newDb.close();
          await opfsRoot.removeEntry(newFileName);
          logger.info("Strategy 5: Successfully created and cleaned up new file");
          return true;
        } catch (error) {
          logger.warn("Strategy 5: Failed to create new file:", error);
          return false;
        }
      },

      // Strategy 6: Try to access the file with a timeout
      async () => {
        logger.info("Strategy 6: Timeout-based access");
        try {
          const timeoutPromise = new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Timeout')), 3000)
          );
          
          const accessPromise = this.createAccessHandleWithTimeout(fileHandle, 3000);
          await Promise.race([accessPromise, timeoutPromise]);
          logger.info("Strategy 6: Successfully accessed file with timeout");
          return true;
        } catch (error) {
          logger.warn("Strategy 6: Failed timeout access:", error);
          return false;
        }
      }
    ];

    // Try each strategy in sequence
    for (let i = 0; i < strategies.length; i++) {
      try {
        const success = await strategies[i]();
        if (success) {
          logger.info(`Strategy ${i + 1} succeeded, OPFS should be clear now`);
          return;
        }
      } catch (error) {
        logger.warn(`Strategy ${i + 1} threw error:`, error);
      }
    }

    logger.warn("All aggressive cleanup strategies failed, OPFS may still be locked");
  }

  private async forceClearOpfsState(): Promise<void> {
    try {
      if (navigator.storage && 'getDirectory' in navigator.storage) {
        const opfsRoot = await navigator.storage.getDirectory();
        try {
          await opfsRoot.removeEntry(this.config.databaseName);
          logger.info("Force cleared OPFS file");
        } catch (error) {
          logger.warn("Could not remove OPFS file:", error);
        }
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    } catch (error) {
      logger.warn("Could not access OPFS for force clear:", error);
    }
  }

  private async nuclearClearOpfsStorage(): Promise<void> {
    try {
      if (navigator.storage && 'getDirectory' in navigator.storage) {
        const opfsRoot = await navigator.storage.getDirectory();
        // Use type assertion to access the async iterator methods
        const opfsRootWithIterator = opfsRoot as FileSystemDirectoryHandle & {
          keys(): AsyncIterableIterator<string>;
        };
        
        for await (const name of opfsRootWithIterator.keys()) {
          try {
            const handle = await opfsRoot.getFileHandle(name);
            if (handle.kind === 'file') {
              await opfsRoot.removeEntry(name);
              logger.info(`Removed OPFS file: ${name}`);
            }
          } catch (error) {
            logger.warn(`Could not remove OPFS file ${name}:`, error);
          }
        }
        
        logger.info("Nuclear clear completed - all OPFS files removed");
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    } catch (error) {
      logger.warn("Could not access OPFS for nuclear clear:", error);
    }
  }

  getDatabase(): Database | null {
    return this.db;
  }

  getStorageInfo(): StorageInfo {
    return {
      type: 'opfs',
      persistent: true,
      path: `/${this.config.databaseName}`,
      available: this.isAvailable(),
    };
  }

  close(): void {
    if (this.db) {
      this.db.close();
      this.db = null;
    }
  }

  /**
   * Static method to close the singleton OPFS database
   */
  static closeOpfsDatabase(): void {
    if (OpfsStorageAdapter.opfsDatabaseInstance) {
      OpfsStorageAdapter.opfsDatabaseInstance.close();
      OpfsStorageAdapter.opfsDatabaseInstance = null;
      OpfsStorageAdapter.opfsDatabaseInUse = false;
      OpfsStorageAdapter.opfsAccessHandle = null;
    }
  }

  /**
   * Static method to clean up OPFS access handles
   */
  static async cleanupOpfsAccessHandle(): Promise<void> {
    if (OpfsStorageAdapter.opfsAccessHandle) {
      try {
        OpfsStorageAdapter.opfsAccessHandle.close();
      } catch (error) {
        logger.warn("Error closing OPFS access handle:", error);
      }
      OpfsStorageAdapter.opfsAccessHandle = null;
    }
    
    OpfsStorageAdapter.opfsDatabaseInstance = null;
    OpfsStorageAdapter.opfsDatabaseInUse = false;
    OpfsStorageAdapter.opfsDatabaseFailed = false;
    OpfsStorageAdapter.opfsCreationPromise = null;
    OpfsStorageAdapter.opfsCreationLock = false;
  }

  /**
   * Reset the OPFS failure counter to allow retrying OPFS
   */
  static resetOpfsFailureCounter(): void {
    try {
      localStorage.removeItem('opfs-consecutive-failures');
      logger.info("OPFS failure counter reset - OPFS will be retried on next attempt");
    } catch (error) {
      logger.warn("localStorage not available for OPFS failure counter reset");
    }
  }

  /**
   * Get the current OPFS failure count
   */
  static getOpfsFailureCount(): number {
    try {
      return parseInt(localStorage.getItem('opfs-consecutive-failures') || '0');
    } catch (error) {
      logger.debug("localStorage not available for OPFS failure count");
      return 0;
    }
  }

  /**
   * Reset the session-level OPFS unavailability flag
   */
  static resetOpfsSessionAvailability(): void {
    OpfsStorageAdapter.opfsCompletelyUnavailable = false;
    logger.info("OPFS session availability reset - OPFS will be retried on next attempt");
  }
}
