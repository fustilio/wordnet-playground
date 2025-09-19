/**
 * Shared database configuration interfaces for wn-ts ecosystem
 * 
 * This provides common configuration types that both Node.js and Web implementations
 * can use, eliminating duplication across packages.
 */

/**
 * Base database configuration interface
 */
export interface BaseDatabaseConfig {
  /**
   * Whether the database is read-only
   */
  readonly?: boolean;
  
  /**
   * Whether to force recreation of the database
   */
  forceRecreate?: boolean;
  
  /**
   * Whether to enable verbose logging
   */
  verbose?: boolean;
}

/**
 * Node.js specific database configuration
 */
export interface NodeDatabaseConfig extends BaseDatabaseConfig {
  /**
   * Database file path
   */
  filename: string;
  
  /**
   * Whether the file must exist
   */
  fileMustExist?: boolean;
  
  /**
   * Database timeout in milliseconds
   */
  timeout?: number;
}

/**
 * Web specific database configuration
 */
export interface WebDatabaseConfig extends BaseDatabaseConfig {
  /**
   * Database name for in-memory storage
   */
  name?: string;
  
  /**
   * Whether to enable foreign key support
   */
  enableForeignKeys?: boolean;
  
  /**
   * Custom SQLite WASM module configuration
   */
  sqliteWasmConfig?: {
    /**
     * Custom trace callback for debugging
     */
    traceCallback?: ((reason: number, cbArg: number, arg1: number, arg2: number) => number) | null;
  };
}

/**
 * Common database statistics interface
 */
export interface DatabaseStats {
  /**
   * Total number of pages in the database
   */
  pageCount: number;
  
  /**
   * Size of each page in bytes
   */
  pageSize: number;
  
  /**
   * Total database size in bytes
   */
  totalSizeBytes: number;
  
  /**
   * Number of free pages
   */
  freelistCount: number;
  
  /**
   * Size of free space in bytes
   */
  freelistSizeBytes: number;
  
  /**
   * Cache size in pages
   */
  cacheSize: number;
  
  /**
   * Cache size in bytes
   */
  cacheSizeBytes: number;
  
  /**
   * Number of pages currently in cache
   */
  cacheUsed: number;
  
  /**
   * Size of cached pages in bytes
   */
  cacheUsedBytes: number;
}

/**
 * Database connection state
 */
export interface DatabaseConnectionState {
  /**
   * Whether the database is currently connected
   */
  isConnected: boolean;
  
  /**
   * Whether the database is in a transaction
   */
  isInTransaction: boolean;
  
  /**
   * Connection error if any
   */
  error?: string;
  
  /**
   * Last connection timestamp
   */
  lastConnected?: Date;
}
