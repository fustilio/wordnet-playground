/**
 * Browser-compatible database implementation using @sqlite.org/sqlite-wasm
 * Optimized for modern browsers with OPFS support
 * 
 * IMPORTANT: This class is designed to work in worker threads where OPFS is available.
 * In the main thread, it will fall back to in-memory storage.
 * 
 * Usage:
 * - Worker thread: Uses OPFS for persistent storage
 * - Main thread: Falls back to in-memory storage (for fallback scenarios only)
 */

import type { Sqlite3Static, Database } from "@sqlite.org/sqlite-wasm";
import { createScopedLogger } from "utils/logger";

const logger = createScopedLogger('WebDatabase');

export class WebDatabase {
  private db: Database | null = null;
  private sqlModule: Sqlite3Static | null = null;
  private _initialized = false;
  private useOPFS = false;

  constructor() {
    // Will be initialized with @sqlite.org/sqlite-wasm
  }

  // Initialize with @sqlite.org/sqlite-wasm module
  async initializeWithModule(sqlModule: Sqlite3Static): Promise<void> {
    this.sqlModule = sqlModule;

    // Don't check OPFS support here - we'll check it when actually creating the database
    // This allows the class to work in both main thread and worker thread contexts
    this._initialized = true;
  }

  // Interface-compatible initialize method
  async initialize(): Promise<void> {
    if (!this.sqlModule) {
      throw new Error(
        "SQL module not initialized. Call initializeWithModule() first."
      );
    }
    // Already initialized in initializeWithModule
  }

  isInitialized(): boolean {
    return this._initialized && this.db !== null;
  }

  async loadDatabase(data: Uint8Array): Promise<void> {
    if (!this.sqlModule) {
      throw new Error(
        "SQL module not initialized. Call initializeWithModule() first."
      );
    }

    if (this.db) {
      this.db.close();
      this.db = null;
    }

    // Create a new in-memory database from the provided buffer.
    // The data is a Uint8Array representing an SQLite database file.
    if (this.sqlModule.oo1 && this.sqlModule.oo1.DB) {
      this.db = new this.sqlModule.oo1.DB();
   
      // TODO: actually load the data into the database
      
    } else {
      throw new Error(
        "No compatible database constructor found in SQLite WASM module"
      );
    }
  }

  async createDatabase(data?: Uint8Array): Promise<void> {
    if (!this.sqlModule) {
      throw new Error("SQL module not initialized");
    }

    // Check OPFS support at the time of database creation
    // This ensures we detect it correctly in the worker thread context
    if (this.sqlModule.oo1?.OpfsDb) {
      try {
        // Try to create an OPFS database - this will work in worker threads
        this.db = new this.sqlModule.oo1.OpfsDb("/wordnet.sqlite3");
        this.useOPFS = true;
        logger.info("Created persistent OPFS database: /wordnet.sqlite3");
      } catch (error) {
        logger.warn("Failed to create OPFS database, falling back to in-memory:", error);
        this.db = new this.sqlModule.oo1.DB(":memory:", "ct");
        this.useOPFS = false;
        logger.info("Using in-memory database as fallback");
      }
    } else if (this.sqlModule.oo1?.DB) {
      // Fall back to regular DB constructor
      this.db = new this.sqlModule.oo1.DB(":memory:", "ct");
      this.useOPFS = false;
      logger.info("Using in-memory database (OpfsDb not available)");
    } else {
      throw new Error(
        "No compatible database constructor found in SQLite WASM module"
      );
    }

    // Disable SQLite tracing to reduce console noise
    try {
      this.db.exec("PRAGMA trace = 0");
      this.db.exec("PRAGMA vdbe_trace = 0");
    } catch (error) {
      // Ignore if tracing is not available
    }
  }

  run(sql: string, params: any[] = []): void {
    if (!this.db) {
      throw new Error("Database not initialized");
    }

    try {
      const stmt = this.db.prepare(sql);
      try {
        if (params.length > 0) {
          stmt.bind(params);
        }
        stmt.step(); // Execute the statement
      } finally {
        stmt.stepFinalize();
      }
    } catch (e) {
      logger.error(`SQL execution failed: ${sql}`, { params, error: e });
      throw e;
    }
  }

  async clearAllData(): Promise<void> {
    if (!this.db) return;
    const tables = [
      "lexicons",
      "words",
      "forms",
      "synsets",
      "senses",
      "definitions",
      "relations",
      "examples",
      "ilis",
    ];
    for (const table of tables) {
      this.run(`DELETE FROM ${table}`);
    }
  }

  async getStatistics(): Promise<any> {
    // This is a mock-like implementation to allow DataLoader to proceed.
    // The actual getStatistics is on WebWordnet and uses Kysely.
    return {
      totalWords: 0,
      totalSynsets: 0,
      totalSenses: 0,
      totalILIs: 0,
      totalLexicons: 0,
    };
  }

  /**
   * Export the current database as a Uint8Array of the SQLite file
   */
  exportBytes(): Uint8Array {
    if (!this.db) {
      throw new Error("Database not initialized");
    }
   
    throw new Error("Not implemented");
  }

  close(): void {
    if (this.db) {
      this.db.close();
      this.db = null;
    }
  }

  /**
   * Flush the database to ensure data is persisted to OPFS storage
   * This is important for OPFS databases to ensure data is written to disk
   */
  async flush(): Promise<void> {
    if (!this.db) return;
    
    try {
      // Force a checkpoint to ensure WAL data is written to the main database file
      this.db.exec("PRAGMA wal_checkpoint(FULL);");
      
      // For OPFS databases, also try to sync the file
      if (this.useOPFS) {
        // Force a sync operation to ensure data is written to OPFS
        this.db.exec("PRAGMA synchronous = FULL;");
        this.db.exec("PRAGMA journal_mode = WAL;");
        
        // Additional flush for OPFS
        try {
          // This might not be available in all SQLite versions, so wrap in try-catch
          this.db.exec("PRAGMA optimize;");
        } catch (e) {
          // Ignore if optimize pragma is not available
        }
      }
      
      logger.info("Database flushed successfully");
    } catch (error) {
      logger.warn("Failed to flush database:", error);
      // Don't throw - flushing is best effort
    }
  }

  /**
   * Get the underlying SQLite WASM database instance
   * This is needed for Kysely integration
   */
  getDatabase(): Database {
    if (!this.db) {
      throw new Error("Database not initialized");
    }
    return this.db;
  }

  /**
   * Check if the database is persistent (OPFS) or in-memory
   */
  isPersistent(): boolean {
    return this.useOPFS && this.db !== null;
  }

  /**
   * Get information about the database storage type
   */
  getStorageInfo(): { type: 'opfs' | 'memory' | 'unknown', persistent: boolean, path?: string } {
    if (!this.db) {
      return { type: 'unknown', persistent: false };
    }
    
    if (this.useOPFS) {
      return { type: 'opfs', persistent: true, path: '/wordnet.sqlite3' };
    } else {
      return { type: 'memory', persistent: false };
    }
  }

  getSqlModule() {
    if (!this.sqlModule) {
      throw new Error("SQL module not initialized");
    }

    return this.sqlModule;
  }
}
