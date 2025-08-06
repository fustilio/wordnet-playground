/**
 * SQLite WASM types
 * 
 * Type definitions for SQLite WASM integration with Kysely
 */

import type { Database, Sqlite3Static } from "@sqlite.org/sqlite-wasm";

/**
 * Extended SQLite WASM database type with sqlite3 module access
 */
export type SqliteWasmDatabase = Database & {
  /**
   * The sqlite3 module used to create the database.
   *
   * Use this API to access the sqlite3 module directly.
   */
  sqlite3: Sqlite3Static;
};

/**
 * Configuration for creating an in-memory SQLite WASM database
 */
export interface CreateDatabaseOptions {
  readOnly?: boolean;
} 