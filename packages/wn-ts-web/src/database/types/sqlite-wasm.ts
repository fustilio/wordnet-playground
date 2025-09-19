/**
 * SQLite WASM types
 * 
 * Type definitions for SQLite WASM integration with Kysely
 */

import type { Database } from "@sqlite.org/sqlite-wasm";

/**
 * Extended SQLite WASM database type
 */
export type SqliteWasmDatabase = Database;

/**
 * Configuration for creating an in-memory SQLite WASM database
 */
export interface CreateDatabaseOptions {
  readOnly?: boolean;
} 