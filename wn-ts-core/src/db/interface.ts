/**
 * Abstract database interface for environment-agnostic database operations
 * This allows different implementations (better-sqlite3, sql.js, etc.)
 */

export interface DatabaseRunResult {
  changes: number;
  lastInsertRowid: number | bigint;
}

export interface DatabaseRow {
  [key: string]: any;
}

export interface DatabaseInterface {
  /**
   * Initialize the database connection
   */
  initialize(): void;

  /**
   * Check if the database is initialized
   */
  isInitialized(): boolean;

  /**
   * Close the database connection
   */
  close(): void;

  /**
   * Execute a SQL statement that doesn't return data
   */
  run(sql: string, params?: unknown[]): DatabaseRunResult;

  /**
   * Execute a SQL statement and return a single row
   */
  get<T = DatabaseRow>(sql: string, params?: unknown[]): T | undefined;

  /**
   * Execute a SQL statement and return all rows
   */
  all<T = DatabaseRow>(sql: string, params?: unknown[]): T[];

  /**
   * Execute a function within a transaction
   */
  transaction(fn: () => void): void;

  /**
   * Clear any cached connections/resources
   */
  clearConnections(): void;

  /**
   * Reset the database connection
   */
  reset(): void;

  /**
   * Check if database is locked
   */
  isLocked(): boolean;
}

/**
 * Abstract database manager that provides a factory pattern
 */
export interface DatabaseManagerInterface {
  /**
   * Get the database instance
   */
  getDatabase(): DatabaseInterface;

  /**
   * Create a new database instance
   */
  createDatabase(): DatabaseInterface;

  /**
   * Check if database is available
   */
  isAvailable(): boolean;
} 